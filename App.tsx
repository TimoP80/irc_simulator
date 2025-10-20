import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelList } from './components/ChannelList';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_CHANNELS, DEFAULT_VIRTUAL_USERS, DEFAULT_NICKNAME, SIMULATION_INTERVALS, DEFAULT_AI_MODEL, DEFAULT_TYPING_DELAY } from './constants';
import type { Channel, Message, User, ActiveContext, PrivateMessageConversation, AppConfig } from './types';
import { generateChannelActivity, generateReactionToMessage, generatePrivateMessageResponse } from './services/geminiService';
import { loadConfig, saveConfig, initializeStateFromConfig, saveChannelLogs, loadChannelLogs, clearChannelLogs, simulateTypingDelay } from './utils/config';
import { parseIRCCommand, createCommandMessage, getIRCCommandsHelp } from './utils/ircCommands';

const App: React.FC = () => {
  const [currentUserNickname, setCurrentUserNickname] = useState<string>(DEFAULT_NICKNAME);
  const [virtualUsers, setVirtualUsers] = useState<User[]>(DEFAULT_VIRTUAL_USERS);
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessageConversation>>({});
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<AppConfig['simulationSpeed']>('normal');
  const [aiModel, setAiModel] = useState<AppConfig['aiModel']>(DEFAULT_AI_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [typingDelayConfig, setTypingDelayConfig] = useState(DEFAULT_TYPING_DELAY);
  
  const simulationIntervalRef = useRef<number | null>(null);
  const lastSimErrorTimestampRef = useRef<number>(0);
  const lastUserMessageTimeRef = useRef<number>(0);
  const burstModeRef = useRef<boolean>(false);

  // Load configuration and channel logs from localStorage on initial render
  useEffect(() => {
    const savedConfig = loadConfig();
    const savedLogs = loadChannelLogs();
    
    if (savedConfig) {
      const { nickname, virtualUsers, channels, simulationSpeed, aiModel: savedAiModel, typingDelay } = initializeStateFromConfig(savedConfig);
      console.log('Loaded configuration:', { 
        nickname, 
        virtualUsersCount: virtualUsers.length, 
        channelsCount: channels.length,
        channelNames: channels.map(c => c.name),
        aiModel: savedAiModel,
        typingDelay
      });
      setCurrentUserNickname(nickname);
      setVirtualUsers(virtualUsers);
      setSimulationSpeed(simulationSpeed);
      setAiModel(savedAiModel || DEFAULT_AI_MODEL);
      setTypingDelayConfig(typingDelay || DEFAULT_TYPING_DELAY);
      
      // Use saved logs if available and they match the current configuration
      if (savedLogs && savedLogs.length > 0) {
        // Check if saved logs match the configured channels
        const configuredChannelNames = channels.map(c => c.name).sort();
        const savedChannelNames = savedLogs.map(c => c.name).sort();
        
        console.log('Channel comparison:', {
          configured: configuredChannelNames,
          saved: savedChannelNames,
          match: JSON.stringify(configuredChannelNames) === JSON.stringify(savedChannelNames)
        });
        
        if (JSON.stringify(configuredChannelNames) === JSON.stringify(savedChannelNames)) {
          // Use saved logs but ensure they have the correct users
          const updatedLogs = savedLogs.map(savedChannel => {
            const configuredChannel = channels.find(c => c.name === savedChannel.name);
            if (configuredChannel) {
              return {
                ...savedChannel,
                users: configuredChannel.users, // Use configured users
                topic: configuredChannel.topic  // Use configured topic
              };
            }
            return savedChannel;
          });
          console.log('Using saved logs with updated users');
          setChannels(updatedLogs);
        } else {
          // Channel configuration changed, use new channels
          console.log('Channel configuration changed, using new channels');
          setChannels(channels);
        }
      } else {
        console.log('No saved logs, using configured channels');
        setChannels(channels);
      }
    } else {
      // If no config, open settings for the user to configure the app
      setIsSettingsOpen(true);
    }
  }, []);

  // Save channel logs whenever channels change
  useEffect(() => {
    if (channels.length > 0) {
      saveChannelLogs(channels);
    }
  }, [channels]);

  const handleSaveSettings = (config: AppConfig) => {
    saveConfig(config);
    const { nickname, virtualUsers, channels, simulationSpeed, aiModel: savedAiModel, typingDelay } = initializeStateFromConfig(config);
    setCurrentUserNickname(nickname);
    setVirtualUsers(virtualUsers);
    setChannels(channels);
    setSimulationSpeed(simulationSpeed);
    setAiModel(savedAiModel || DEFAULT_AI_MODEL);
    setTypingDelayConfig(typingDelay || DEFAULT_TYPING_DELAY);
    setPrivateMessages({});
    // Don't automatically join any channel - user needs to join manually
    setActiveContext(null);
    setIsSettingsOpen(false);
  };

  const setTyping = (nickname: string, isTyping: boolean) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (isTyping) {
        newSet.add(nickname);
      } else {
        newSet.delete(nickname);
      }
      return newSet;
    });
  };

  const addMessageToContext = useCallback((message: Message, context: ActiveContext | null) => {
    if (!context) return;
    if (context.type === 'channel') {
      setChannels(prev =>
        prev.map(c =>
          c.name === context.name
            ? { ...c, messages: [...c.messages, message].slice(-100) }
            : c
        )
      );
    } else { // 'pm'
      setPrivateMessages(prev => {
        const conversation = prev[context.with] || { user: virtualUsers.find(u => u.nickname === context.with)!, messages: [] };
        return {
          ...prev,
          [context.with]: {
            ...conversation,
            messages: [...conversation.messages, message].slice(-100),
          },
        };
      });
    }
  }, [virtualUsers]);

  const handleCommand = (command: string) => {
    const parsedCommand = parseIRCCommand(command);
    
    if (!parsedCommand) {
      addMessageToContext({
        id: Date.now(),
        nickname: 'system',
        content: `Unknown command: ${command}`,
        timestamp: new Date(),
        type: 'system'
      }, activeContext);
      return;
    }

    const channelName = activeContext?.type === 'channel' ? activeContext.name : null;
    const message = createCommandMessage(parsedCommand, currentUserNickname, channelName || '');

    switch (parsedCommand.command) {
      case 'nick': {
        const newNickname = parsedCommand.content.trim();
        if (newNickname && newNickname !== currentUserNickname) {
          const oldNickname = currentUserNickname;
          // Update nickname in all channels' user lists
          setChannels(prevChannels => prevChannels.map(channel => ({
            ...channel,
            users: channel.users.map(u => u.nickname === oldNickname ? { ...u, nickname: newNickname } : u)
          })));
          setCurrentUserNickname(newNickname);
          // Persist the change
          const currentConfig = loadConfig();
          if (currentConfig) {
            saveConfig({ ...currentConfig, currentUserNickname: newNickname });
          }
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: `You are now known as ${newNickname}`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
        }
        break;
      }
      case 'join': {
        const channelName = parsedCommand.content.trim();
        const channelExists = channels.some(c => c.name === channelName);
        if (channelExists) {
            const channel = channels.find(c => c.name === channelName);
            const isAlreadyInChannel = channel?.users.some(u => u.nickname === currentUserNickname);
            
            // Add user to channel if not already there
            setChannels(prev => prev.map(c => {
                if (c.name === channelName && !c.users.some(u => u.nickname === currentUserNickname)) {
                    return { ...c, users: [...c.users, { nickname: currentUserNickname, status: 'online' }]};
                }
                return c;
            }));
            setActiveContext({ type: 'channel', name: channelName });
            
            // Generate greeting if user is joining for the first time
            if (!isAlreadyInChannel && channel) {
              generateGreetingForNewUser(channel, currentUserNickname);
            }
        } else {
            addMessageToContext({
                id: Date.now(),
                nickname: 'system',
                content: `Channel ${channelName} does not exist.`,
                timestamp: new Date(),
                type: 'system'
            }, activeContext);
        }
        break;
      }
      case 'part': {
        if (activeContext && activeContext.type === 'channel') {
          const channelName = activeContext.name;
          // Remove user from channel
          setChannels(prev => prev.map(c => 
            c.name === channelName 
              ? { ...c, users: c.users.filter(u => u.nickname !== currentUserNickname) }
              : c
          ));
          // Switch to first available channel or clear context
          const remainingChannels = channels.filter(c => c.name !== channelName && c.users.some(u => u.nickname === currentUserNickname));
          if (remainingChannels.length > 0) {
            setActiveContext({ type: 'channel', name: remainingChannels[0].name });
          } else {
            setActiveContext(null);
          }
        }
        addMessageToContext(message, activeContext);
        break;
      }
      case 'quit': {
        // In a real IRC client, this would disconnect. For simulation, we'll just show the message
        addMessageToContext(message, activeContext);
        break;
      }
      case 'topic': {
        if (activeContext && activeContext.type === 'channel') {
          const channelName = activeContext.name;
          if (parsedCommand.content.trim()) {
            // Set new topic
            setChannels(prev => prev.map(c => 
              c.name === channelName 
                ? { ...c, topic: parsedCommand.content }
                : c
            ));
            addMessageToContext({
              id: Date.now(),
              nickname: 'system',
              content: `Topic for ${channelName} changed to: ${parsedCommand.content}`,
              timestamp: new Date(),
              type: 'system'
            }, activeContext);
          } else {
            // Show current topic
            const channel = channels.find(c => c.name === channelName);
            addMessageToContext({
              id: Date.now(),
              nickname: 'system',
              content: `Topic for ${channelName}: ${channel?.topic || 'No topic set'}`,
              timestamp: new Date(),
              type: 'system'
            }, activeContext);
          }
        }
        break;
      }
      case 'kick': {
        if (activeContext && activeContext.type === 'channel' && parsedCommand.target) {
          const channelName = activeContext.name;
          const targetUser = parsedCommand.target;
          // Remove target user from channel
          setChannels(prev => prev.map(c => 
            c.name === channelName 
              ? { ...c, users: c.users.filter(u => u.nickname !== targetUser) }
              : c
          ));
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: `${targetUser} has been kicked from ${channelName}${parsedCommand.content ? ` (${parsedCommand.content})` : ''}`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
        }
        break;
      }
      case 'ban': {
        if (activeContext && activeContext.type === 'channel' && parsedCommand.target) {
          const targetUser = parsedCommand.target;
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: `${targetUser} has been banned from ${activeContext.name}${parsedCommand.content ? ` (${parsedCommand.content})` : ''}`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
        }
        break;
      }
      case 'unban': {
        if (activeContext && activeContext.type === 'channel' && parsedCommand.target) {
          const targetUser = parsedCommand.target;
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: `${targetUser} has been unbanned from ${activeContext.name}`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
        }
        break;
      }
      case 'who': {
        if (activeContext && activeContext.type === 'channel') {
          const channel = channels.find(c => c.name === activeContext.name);
          if (channel) {
            const userList = channel.users.map(u => u.nickname).join(', ');
            addMessageToContext({
              id: Date.now(),
              nickname: 'system',
              content: `Users in ${channel.name}: ${userList}`,
              timestamp: new Date(),
              type: 'system'
            }, activeContext);
          }
        }
        break;
      }
      case 'help': {
        const helpText = getIRCCommandsHelp();
        helpText.forEach(line => {
          addMessageToContext({
            id: Date.now() + Math.random(),
            nickname: 'system',
            content: line,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
        });
        break;
      }
      case 'notice': {
        // For notices, we'll add them as system messages for now
        if (parsedCommand.target) {
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: `Notice to ${parsedCommand.target}: ${parsedCommand.content}`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
        }
        break;
      }
      case 'me': {
        // Action messages are handled by adding the message to context
        addMessageToContext(message, activeContext);
        break;
      }
      default:
        addMessageToContext({
          id: Date.now(),
          nickname: 'system',
          content: `Unknown command: /${parsedCommand.command}`,
          timestamp: new Date(),
          type: 'system'
        }, activeContext);
        break;
    }
  };
  
  const handleSendMessage = async (content: string) => {
    if (content.startsWith('/')) {
      handleCommand(content);
      
      // Trigger AI reactions for action commands (/me)
      if (content.startsWith('/me ')) {
        const parsedCommand = parseIRCCommand(content);
        if (parsedCommand && parsedCommand.command === 'me') {
          const userMessage: Message = {
            id: Date.now(),
            nickname: currentUserNickname,
            content: parsedCommand.content,
            timestamp: new Date(),
            type: 'action',
            command: 'me'
          };
          
          // Track user message time for burst mode
          lastUserMessageTimeRef.current = Date.now();
          
          // Trigger AI reaction to the action
          if (activeContext && activeContext.type === 'channel') {
            const channel = channels.find(c => c.name === activeContext.name);
            if (channel) {
              try {
                const aiResponse = await generateReactionToMessage(channel, userMessage, currentUserNickname, aiModel);
                if (aiResponse) {
                  const aiMessages = aiResponse.split('\n').filter(line => line.includes(':'));
                  for (let index = 0; index < aiMessages.length; index++) {
                    const msgLine = aiMessages[index];
                    const [nickname, ...contentParts] = msgLine.split(':');
                    const content = contentParts.join(':').trim();
                    if (nickname && content) {
                      // Show typing indicator for reaction message
                      setTyping(nickname.trim(), true);
                      
                      // Simulate typing delay for each reaction message
                      console.log(`[Simulation Debug] Simulating typing delay for reaction message: "${content}"`);
                      await simulateTypingDelay(content.length, typingDelayConfig);
                      
                      // Hide typing indicator
                      setTyping(nickname.trim(), false);
                      
                      const aiMessage: Message = {
                        id: Date.now() + index + 1,
                        nickname: nickname.trim(),
                        content: content,
                        timestamp: new Date(),
                        type: 'ai'
                      };
                      addMessageToContext(aiMessage, activeContext);
                    }
                  }
                }
              } catch (error) {
                console.error("Failed to get AI reaction to action:", error);
              }
            }
          }
        }
      }
      return;
    }
    
    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now(),
      nickname: currentUserNickname,
      content,
      timestamp: new Date(),
      type: activeContext?.type === 'pm' ? 'pm' : 'user'
    };
    addMessageToContext(userMessage, activeContext);
    
    // Track user message time for burst mode
    lastUserMessageTimeRef.current = Date.now();

    try {
      let aiResponse: string | null = null;
      if (activeContext && activeContext.type === 'channel') {
        const channel = channels.find(c => c.name === activeContext.name);
        if (channel) {
          aiResponse = await generateReactionToMessage(channel, userMessage, currentUserNickname, aiModel);
        }
      } else if (activeContext && activeContext.type === 'pm') { // 'pm'
        const conversation = privateMessages[activeContext.with] || { user: virtualUsers.find(u => u.nickname === activeContext.with)!, messages: [] };
        aiResponse = await generatePrivateMessageResponse(conversation, userMessage, currentUserNickname, aiModel);
      }
      
      if (aiResponse) {
        const aiMessages = aiResponse.split('\n').filter(line => line.includes(':'));
        for (let index = 0; index < aiMessages.length; index++) {
          const msgLine = aiMessages[index];
          const [nickname, ...contentParts] = msgLine.split(':');
          const content = contentParts.join(':').trim();
          if (nickname && content) {
            // Show typing indicator for AI response
            setTyping(nickname.trim(), true);
            
            // Simulate typing delay for each AI response message
            console.log(`[Simulation Debug] Simulating typing delay for AI response: "${content}"`);
            await simulateTypingDelay(content.length, typingDelayConfig);
            
            // Hide typing indicator
            setTyping(nickname.trim(), false);
            
            const aiMessage: Message = {
              id: Date.now() + index + 1,
              nickname: nickname.trim(),
              content: content,
              timestamp: new Date(),
              type: activeContext?.type === 'pm' ? 'pm' : 'ai'
            };
            addMessageToContext(aiMessage, activeContext);
          }
        }
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      let content = `Error: Could not get AI response. Please check your API key and network connection.`;
      if (error instanceof Error && (error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("429"))) {
        content = `Error: API request failed (rate limit or server issue). This can happen with frequent messages, even if your daily quota is fine. Try setting a slower simulation speed in the configuration.`;
      }
      const errorMessage: Message = {
        id: Date.now() + 1,
        nickname: 'system',
        content,
        timestamp: new Date(),
        type: 'system'
      };
      addMessageToContext(errorMessage, activeContext);
    } finally {
      setIsLoading(false);
    }
  };

  const generateGreetingForNewUser = async (channel: Channel, newUserNickname: string) => {
    try {
      const usersInChannel = channel.users.filter(u => u.nickname !== newUserNickname);
      if (usersInChannel.length === 0) return;

      const prompt = `
A new user named "${newUserNickname}" just joined the IRC channel ${channel.name}.
The channel topic is: "${channel.topic}".
The existing users in the channel are: ${usersInChannel.map(u => u.nickname).join(', ')}.
Their personalities are: ${usersInChannel.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.

Generate a warm, welcoming greeting from one of the existing users to the new person.
The greeting should be friendly, brief, and in-character for the user who is greeting.
The response must be a single line in the format: "nickname: greeting message"
`;

      const response = await generateChannelActivity(channel, newUserNickname, aiModel);
      if (response) {
        const greetingMessages = response.split('\n').filter(line => line.includes(':'));
        for (let index = 0; index < greetingMessages.length; index++) {
          const msgLine = greetingMessages[index];
          const [nickname, ...contentParts] = msgLine.split(':');
          const content = contentParts.join(':').trim();
          if (nickname && content) {
            // Show typing indicator for greeting
            setTyping(nickname.trim(), true);
            
            // Simulate typing delay for greeting messages
            console.log(`[Simulation Debug] Simulating typing delay for greeting: "${content}"`);
            await simulateTypingDelay(content.length, typingDelayConfig);
            
            // Hide typing indicator
            setTyping(nickname.trim(), false);
            
            const greetingMessage: Message = {
              id: Date.now() + index + 1,
              nickname: nickname.trim(),
              content: content,
              timestamp: new Date(),
              type: 'ai'
            };
            addMessageToContext(greetingMessage, { type: 'channel', name: channel.name });
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate greeting:", error);
    }
  };

  const runSimulation = useCallback(async () => {
    if (channels.length === 0) {
      console.log('[Simulation Debug] No channels available for simulation');
      return;
    }
    
    // Check if we should enter burst mode (user recently sent a message)
    const now = Date.now();
    const timeSinceLastUserMessage = now - lastUserMessageTimeRef.current;
    const shouldBurst = timeSinceLastUserMessage < 30000; // 30 seconds
    
    console.log(`[Simulation Debug] Running simulation - burst mode: ${shouldBurst}, time since last user message: ${timeSinceLastUserMessage}ms`);
    
    // Prioritize the active channel for more responsive conversation
    let targetChannel: Channel;
    if (activeContext && activeContext.type === 'channel') {
      const activeChannel = channels.find(c => c.name === activeContext.name);
      if (activeChannel) {
        targetChannel = activeChannel;
        console.log(`[Simulation Debug] Using active channel: ${targetChannel.name}`);
      } else {
        const randomChannelIndex = Math.floor(Math.random() * channels.length);
        targetChannel = channels[randomChannelIndex];
        console.log(`[Simulation Debug] Active channel not found, using random channel: ${targetChannel.name}`);
      }
    } else {
      const randomChannelIndex = Math.floor(Math.random() * channels.length);
      targetChannel = channels[randomChannelIndex];
      console.log(`[Simulation Debug] No active context, using random channel: ${targetChannel.name}`);
    }

    try {
      console.log(`[Simulation Debug] Generating channel activity for ${targetChannel.name}`);
      const response = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
      if (response) {
        const [nickname, ...contentParts] = response.split(':');
        const content = contentParts.join(':').trim();

        if (nickname && content) {
          // Show typing indicator
          setTyping(nickname.trim(), true);
          
          // Simulate typing delay before adding the message
          console.log(`[Simulation Debug] Simulating typing delay for message: "${content}"`);
          await simulateTypingDelay(content.length, typingDelayConfig);
          
          // Hide typing indicator
          setTyping(nickname.trim(), false);
          
          const aiMessage: Message = {
            id: Date.now(),
            nickname: nickname.trim(),
            content,
            timestamp: new Date(),
            type: 'ai'
          };
          console.log(`[Simulation Debug] Adding AI message from ${nickname.trim()}: "${content}"`);
          addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
        } else {
          console.log(`[Simulation Debug] Invalid response format: "${response}"`);
        }
      } else {
        console.log(`[Simulation Debug] No response generated for ${targetChannel.name}`);
      }
      
      // In burst mode, sometimes generate a second message for more activity
      if (shouldBurst && Math.random() < 0.3) {
        console.log(`[Simulation Debug] Burst mode: generating second message for ${targetChannel.name}`);
        setTimeout(async () => {
          try {
            const secondResponse = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
            if (secondResponse) {
              const [nickname, ...contentParts] = secondResponse.split(':');
              const content = contentParts.join(':').trim();

              if (nickname && content) {
                // Show typing indicator for burst message
                setTyping(nickname.trim(), true);
                
                // Simulate typing delay for burst message too
                console.log(`[Simulation Debug] Simulating typing delay for burst message: "${content}"`);
                await simulateTypingDelay(content.length, typingDelayConfig);
                
                // Hide typing indicator
                setTyping(nickname.trim(), false);
                
                const aiMessage: Message = {
                  id: Date.now() + Math.random(),
                  nickname: nickname.trim(),
                  content,
                  timestamp: new Date(),
                  type: 'ai'
                };
                console.log(`[Simulation Debug] Adding burst AI message from ${nickname.trim()}: "${content}"`);
                addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
              }
            }
          } catch (error) {
            console.error(`[Simulation Debug] Burst simulation failed for ${targetChannel.name}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              channel: targetChannel.name
            });
          }
        }, Math.random() * 3000 + 1000); // 1-4 seconds delay
      }
    } catch (error) {
      console.error(`[Simulation Debug] Simulation failed for ${targetChannel.name}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        channel: targetChannel.name,
        burstMode: shouldBurst
      });
      const now = Date.now();
      // Only show error message if the last one was more than 2 minutes ago
      if (now - lastSimErrorTimestampRef.current > 120000) { 
          lastSimErrorTimestampRef.current = now;
          console.log(`[Simulation Debug] Showing error message to user for ${targetChannel.name}`);
          const errorMessage: Message = {
              id: now,
              nickname: 'system',
              content: `Background simulation for this channel failed due to API errors. It will keep retrying silently. The issue might be rate limiting.`,
              timestamp: new Date(),
              type: 'system'
          };
          addMessageToContext(errorMessage, { type: 'channel', name: targetChannel.name });
      } else {
        console.log(`[Simulation Debug] Error rate limited, not showing alert for ${targetChannel.name}`);
      }
    }
  }, [channels, activeContext, addMessageToContext, currentUserNickname]);

  useEffect(() => {
    const stopSimulation = () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };

    const startSimulation = () => {
      stopSimulation(); // Ensure no multiple intervals are running
      if (simulationSpeed === 'off' || document.hidden) {
        return;
      }
      const interval = SIMULATION_INTERVALS[simulationSpeed];
      simulationIntervalRef.current = window.setInterval(runSimulation, interval);
    };
    
    const handleVisibilityChange = () => {
        if (document.hidden) {
            stopSimulation();
        } else {
            startSimulation();
        }
    };

    startSimulation();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopSimulation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runSimulation, simulationSpeed]);

  const activeChannel = activeContext?.type === 'channel' ? channels.find(c => c.name === activeContext.name) : undefined;
  const activePM = activeContext?.type === 'pm' ? privateMessages[activeContext.with] : undefined;
  
  const usersInContext: User[] = activeContext?.type === 'channel' && activeChannel
    ? activeChannel.users
    : activeContext?.type === 'pm'
    ? [virtualUsers.find(u => u.nickname === activeContext.with)!, { nickname: currentUserNickname, status: 'online' }]
    : [];

  const messagesInContext = activeContext?.type === 'channel' && activeChannel
    ? activeChannel.messages
    : activeContext?.type === 'pm' && activePM
    ? activePM.messages
    : [];
  
  const contextTitle = activeContext?.type === 'channel' 
    ? activeChannel?.topic || activeContext.name 
    : activeContext?.type === 'pm'
    ? `Private message with ${activeContext.with}`
    : 'No channel selected';

  const allPMUsers = Object.keys(privateMessages).map(nickname => virtualUsers.find(u => u.nickname === nickname)!);

  return (
    <div className="flex h-screen w-screen bg-gray-800 font-mono">
      {isSettingsOpen && <SettingsModal onSave={handleSaveSettings} onCancel={() => setIsSettingsOpen(false)} />}
      <ChannelList 
        channels={channels}
        privateMessageUsers={allPMUsers}
        activeContext={activeContext}
        onSelectContext={setActiveContext}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex flex-1 flex-col border-l border-r border-gray-700">
        <ChatWindow 
          title={contextTitle}
          messages={messagesInContext}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentUserNickname={currentUserNickname}
          typingUsers={Array.from(typingUsers)}
        />
      </main>
      <UserList users={usersInContext} onUserClick={(nickname) => setActiveContext({ type: 'pm', with: nickname })} currentUserNickname={currentUserNickname} />
    </div>
  );
};

export default App;