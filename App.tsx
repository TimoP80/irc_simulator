import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelList } from './components/ChannelList';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_CHANNELS, DEFAULT_VIRTUAL_USERS, DEFAULT_NICKNAME, SIMULATION_INTERVALS, DEFAULT_AI_MODEL, DEFAULT_TYPING_DELAY } from './constants';
import type { Channel, Message, User, ActiveContext, PrivateMessageConversation, AppConfig } from './types';
import { addChannelOperator, removeChannelOperator, isChannelOperator, canUserPerformAction } from './types';
import { generateChannelActivity, generateReactionToMessage, generatePrivateMessageResponse } from './services/geminiService';
import { loadConfig, saveConfig, initializeStateFromConfig, saveChannelLogs, loadChannelLogs, clearChannelLogs, simulateTypingDelay } from './utils/config';
import { getIRCExportService, getDefaultIRCExportConfig, type IRCExportConfig, type IRCExportStatus, type IRCExportMessage } from './services/ircExportService';

// Operator persistence functions
const saveOperatorAssignments = (channels: Channel[]) => {
  const operatorData = channels.map(channel => ({
    name: channel.name,
    operators: channel.operators || []
  }));
  localStorage.setItem('station_v_operators', JSON.stringify(operatorData));
};

const loadOperatorAssignments = (channels: Channel[]): Channel[] => {
  try {
    const saved = localStorage.getItem('station_v_operators');
    if (saved) {
      const operatorData = JSON.parse(saved);
      return channels.map(channel => {
        const savedChannel = operatorData.find((c: any) => c.name === channel.name);
        return {
          ...channel,
          operators: savedChannel?.operators || []
        };
      });
    }
  } catch (error) {
    console.warn('Failed to load operator assignments:', error);
  }
  return channels;
};
import { aiLogger, simulationLogger, configLogger } from './utils/debugLogger';

// Migration function to ensure all channels have operators property
const migrateChannels = (channels: Channel[]): Channel[] => {
  return channels.map(channel => ({
    ...channel,
    operators: channel.operators || []
  }));
};

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
  
  // IRC Export state
  const [ircExportConfig, setIrcExportConfig] = useState<IRCExportConfig>(getDefaultIRCExportConfig());
  const [ircExportStatus, setIrcExportStatus] = useState<IRCExportStatus>({
    connected: false,
    server: '',
    channel: '',
    nickname: '',
    lastActivity: null,
    error: null
  });
  
  const simulationIntervalRef = useRef<number | null>(null);
  const lastSimErrorTimestampRef = useRef<number>(0);
  const lastUserMessageTimeRef = useRef<number>(0);
  
  // Track conversation patterns to prevent repetition
  const conversationPatternsRef = useRef<{
    recentPhrases: string[];
    topicHistory: string[];
    lastTopicChange: number;
  }>({
    recentPhrases: [],
    topicHistory: [],
    lastTopicChange: 0
  });
  const burstModeRef = useRef<boolean>(false);
  const lastConversationResetRef = useRef<Record<string, number>>({});

  // Load configuration and channel logs from localStorage on initial render
  useEffect(() => {
    const savedConfig = loadConfig();
    const savedLogs = loadChannelLogs();
    
    configLogger.debug('useEffect running - savedConfig:', !!savedConfig, 'savedLogs:', savedLogs?.length || 0);
    
    if (savedConfig) {
      const { nickname, virtualUsers, channels, simulationSpeed, aiModel: savedAiModel, typingDelay } = initializeStateFromConfig(savedConfig);
      configLogger.debug('Loaded configuration:', { 
        nickname, 
        virtualUsersCount: virtualUsers.length, 
        channelsCount: channels.length,
        channelNames: channels.map(c => c.name),
        channelMessages: channels.map(c => ({ name: c.name, messageCount: c.messages?.length || 0 })),
        aiModel: savedAiModel,
        typingDelay
      });
      setCurrentUserNickname(nickname);
      setVirtualUsers(virtualUsers);
      setSimulationSpeed(simulationSpeed);
      setAiModel(savedAiModel || DEFAULT_AI_MODEL);
      setTypingDelayConfig(typingDelay || DEFAULT_TYPING_DELAY);
      
      // Merge saved logs with configured channels
      if (savedLogs && savedLogs.length > 0) {
        configLogger.debug('Saved logs details:', savedLogs.map(c => ({ 
          name: c.name, 
          messageCount: c.messages?.length || 0,
          messages: c.messages?.slice(0, 2) // Show first 2 messages
        })));
        
        // Merge saved messages with configured channels
        const mergedChannels = channels.map(configuredChannel => {
          const savedChannel = savedLogs.find(saved => saved.name === configuredChannel.name);
          configLogger.debug(`Looking for saved channel ${configuredChannel.name}:`, {
            found: !!savedChannel,
            messageCount: savedChannel?.messages?.length || 0,
            savedChannelNames: savedLogs.map(s => s.name)
          });
          
          if (savedChannel && savedChannel.messages && savedChannel.messages.length > 0) {
            // Use saved messages but keep configured users and topic
            configLogger.debug(`Merging saved messages for ${configuredChannel.name}: ${savedChannel.messages.length} messages`);
            return {
              ...configuredChannel,
              messages: savedChannel.messages, // Use saved messages
              users: configuredChannel.users, // Keep configured users
              topic: configuredChannel.topic  // Keep configured topic
            };
          } else {
            // No saved messages for this channel, use configured channel
            configLogger.debug(`No saved messages for ${configuredChannel.name}, using configured channel`);
            return configuredChannel;
          }
        });
        
        
        configLogger.debug('Merged channels message counts:', mergedChannels.map(c => ({ name: c.name, messageCount: c.messages?.length || 0 })));
        const channelsWithOperators = loadOperatorAssignments(migrateChannels(mergedChannels));
        // Ensure current user is an operator of all channels
        const channelsWithUserAsOperator = channelsWithOperators.map(channel => {
          if (!isChannelOperator(channel, currentUserNickname)) {
            return addChannelOperator(channel, currentUserNickname);
          }
          return channel;
        });
        setChannels(channelsWithUserAsOperator);
      } else {
        configLogger.debug('No saved logs, using configured channels');
        configLogger.debug('Configured channels message counts:', channels.map(c => ({ name: c.name, messageCount: c.messages?.length || 0 })));
        const channelsWithOperators = loadOperatorAssignments(migrateChannels(channels));
        // Ensure current user is an operator of all channels
        const channelsWithUserAsOperator = channelsWithOperators.map(channel => {
          if (!isChannelOperator(channel, currentUserNickname)) {
            return addChannelOperator(channel, currentUserNickname);
          }
          return channel;
        });
        setChannels(channelsWithUserAsOperator);
      }
    } else {
      // If no config, open settings for the user to configure the app
      setIsSettingsOpen(true);
    }
  }, []);


  // Save channel logs and operator assignments whenever channels change
  useEffect(() => {
    if (channels.length > 0) {
      configLogger.debug('Saving channel logs:', channels.map(c => ({ 
        name: c.name, 
        messageCount: c.messages?.length || 0 
      })));
      saveChannelLogs(channels);
      saveOperatorAssignments(channels);
    }
  }, [channels]);

  const handleSaveSettings = (config: AppConfig) => {
    saveConfig(config);
    
    // Initialize state from the new config
    const { nickname, virtualUsers, channels: newChannels, simulationSpeed, aiModel: savedAiModel, typingDelay } = initializeStateFromConfig(config);
    setCurrentUserNickname(nickname);
    setVirtualUsers(virtualUsers);
    
    // Use the new channels from config, but preserve operator assignments where possible
    const migratedChannels = migrateChannels(newChannels);
    setChannels(migratedChannels);
    
    setSimulationSpeed(simulationSpeed);
    setAiModel(savedAiModel || DEFAULT_AI_MODEL);
    setTypingDelayConfig(typingDelay || DEFAULT_TYPING_DELAY);
    setPrivateMessages({});

    
    // Preserve active context if it's a channel that still exists
    if (activeContext?.type === 'channel') {
      const channelStillExists = migratedChannels.some(c => c.name === activeContext.name);
      if (!channelStillExists) {
        setActiveContext(null);
      }
    } else {
      setActiveContext(null);
    }
    setIsSettingsOpen(false);
  };


  const handleOpenSettings = () => {
    // Stop simulation immediately when opening settings
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  // IRC Export handlers
  const handleIrcExportConfigChange = (newConfig: IRCExportConfig) => {
    setIrcExportConfig(newConfig);
  };

  const handleIrcExportConnect = async () => {
    try {
      const ircService = getIRCExportService();
      await ircService.connect(ircExportConfig);
      
      const status = ircService.getStatus();
      setIrcExportStatus(status);
      console.log('[IRC Export] Connected successfully');
    } catch (error) {
      console.error('[IRC Export] Connection failed:', error);
      setIrcExportStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  };

  const handleIrcExportDisconnect = async () => {
    try {
      const ircService = getIRCExportService();
      await ircService.disconnect();
      setIrcExportStatus({
        connected: false,
        server: '',
        channel: '',
        nickname: '',
        lastActivity: null,
        error: null
      });
      console.log('[IRC Export] Disconnected successfully');
    } catch (error) {
      console.error('[IRC Export] Disconnect failed:', error);
    }
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

  // Function to track conversation patterns and suggest topic changes
  const trackConversationPatterns = (message: Message, channel: Channel) => {
    const patterns = conversationPatternsRef.current;
    
    // Track recent phrases (keep last 20)
    const words = message.content.toLowerCase().split(/\s+/);
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      for (let len = 2; len <= Math.min(3, words.length - i); len++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 3) {
          phrases.push(phrase);
        }
      }
    }
    
    patterns.recentPhrases.push(...phrases);
    if (patterns.recentPhrases.length > 50) {
      patterns.recentPhrases = patterns.recentPhrases.slice(-50);
    }
    
    // Track topic changes
    if (message.type === 'topic') {
      patterns.topicHistory.push(message.content);
      patterns.lastTopicChange = Date.now();
      if (patterns.topicHistory.length > 10) {
        patterns.topicHistory = patterns.topicHistory.slice(-10);
      }
    }
    
    // Check if conversation is getting repetitive
    const recentMessages = channel.messages.slice(-10);
    const phraseCounts: { [key: string]: number } = {};
    patterns.recentPhrases.forEach(phrase => {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
    });
    
    const repetitivePhrases = Object.entries(phraseCounts)
      .filter(([_, count]) => count > 2)
      .map(([phrase, _]) => phrase);
    
    // If we have repetitive patterns and it's been a while since topic change, suggest a topic change
    if (repetitivePhrases.length > 3 && 
        Date.now() - patterns.lastTopicChange > 300000 && // 5 minutes
        Math.random() < 0.3) { // 30% chance
      
      const topicSuggestions = [
        'Let\'s talk about something completely different!',
        'This conversation is getting repetitive, how about a new topic?',
        'Anyone want to change the subject?',
        'We\'ve been going in circles, let\'s try something fresh!',
        'Time for a topic change, what should we discuss?'
      ];
      
      const suggestion = topicSuggestions[Math.floor(Math.random() * topicSuggestions.length)];
      
      // Add a system message suggesting topic change
      setTimeout(() => {
        addMessageToContext({
          id: Date.now(),
          nickname: 'system',
          content: suggestion,
          timestamp: new Date(),
          type: 'system'
        }, { type: 'channel', name: channel.name });
      }, 2000 + Math.random() * 3000);
    }
  };

  const addMessageToContext = useCallback((message: Message, context: ActiveContext | null) => {
    if (!context) return;
    if (context.type === 'channel') {
      setChannels(prev => {
        const updatedChannels = prev.map(c =>
          c.name === context.name
            ? { ...c, messages: [...(c.messages || []), message].slice(-100) }
            : c
        );
        simulationLogger.debug(`Message added to channel ${context.name}. Updated channel messages count: ${updatedChannels.find(c => c.name === context.name)?.messages?.length || 0}`);
        return updatedChannels;
      });

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

    // Export to IRC if enabled and message is from AI
    if (ircExportStatus.connected && (message.type === 'ai' || message.type === 'user')) {
      const ircService = getIRCExportService();
      if (ircService && ircService.isConnected()) {
        ircService.sendMessage(message.content, message.nickname).catch(error => {
          console.error('[IRC Export] Failed to send message:', error);
        });
      }
    }
  }, [virtualUsers, ircExportStatus.connected]);


  // Handle IRC Export messages
  useEffect(() => {
    if (ircExportStatus.connected) {
      const ircService = getIRCExportService();
      if (ircService) {
        ircService.onMessage((message: IRCExportMessage) => {
          if (message.type === 'import') {
            // Add message from IRC to Station V
            const ircMessage: Message = {
              id: Date.now(),
              nickname: message.nickname,
              content: message.content,
              timestamp: message.timestamp,
              type: 'user'
            };
            
            // Add to the active channel if we're in one
            if (activeContext?.type === 'channel') {
              addMessageToContext(ircMessage, activeContext);
            }
          }
        });
      }
    }
  }, [ircExportStatus.connected, activeContext, addMessageToContext]);

  const handleCommand = (command: string) => {
    // Basic command handling for web app
    
    if (command.startsWith('/')) {
      const parts = command.split(' ');
      const cmd = parts[0].toLowerCase();
      
      // Handle /topic command
      if (cmd === '/topic') {
        if (activeContext?.type !== 'channel') {
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: 'You can only change topics in channels',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        const activeChannel = channels.find(c => c.name === activeContext.name);
        if (!activeChannel) return;
        
        // Check if user is a channel operator
        if (!isChannelOperator(activeChannel, currentUserNickname)) {
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: 'You must be a channel operator to change the topic',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        // If no new topic provided, show current topic
        if (parts.length === 1) {
          addMessageToContext({
            id: Date.now(),
            nickname: 'system',
            content: `Current topic for ${activeChannel.name}: ${activeChannel.topic || 'No topic set'}`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        // Set new topic
        const newTopic = parts.slice(1).join(' ');
        setChannels(prevChannels => 
          prevChannels.map(channel => 
            channel.name === activeChannel.name 
              ? { ...channel, topic: newTopic }
              : channel
          )
        );
        
        // Add topic change message
        addMessageToContext({
          id: Date.now(),
          nickname: currentUserNickname,
          content: newTopic,
          timestamp: new Date(),
          type: 'topic',
          command: 'topic'
        }, activeContext);
        
        // Trigger AI reactions to topic change
        if (activeChannel) {
          setTimeout(async () => {
            try {
              const reaction = await generateReactionToMessage(activeChannel, {
                id: Date.now(),
                nickname: currentUserNickname,
                content: newTopic,
                timestamp: new Date(),
                type: 'topic',
                command: 'topic'
              }, currentUserNickname, aiModel);
              
              if (reaction) {
                addMessageToContext(reaction, activeContext);
              }
            } catch (error) {
              console.error('Failed to generate AI reaction to topic change:', error);
            }
          }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        }
        
        return;
      }
      
      // Handle /help command
      if (cmd === '/help') {
        addMessageToContext({
          id: Date.now(),
          nickname: 'system',
          content: `Available commands:
/topic [new topic] - View or change channel topic (operators only)
/me <action> - Perform an action (e.g., /me waves)
/help - Show this help message`,
          timestamp: new Date(),
          type: 'system'
        }, activeContext);
        return;
      }
      
      // Handle other commands
      addMessageToContext({
        id: Date.now(),
        nickname: 'system',
        content: `Command not supported in web mode: ${command}. Type /help for available commands.`,
        timestamp: new Date(),
        type: 'system'
      }, activeContext);
      return;
    }

    // No additional command handling needed for web app
  };
  
  // Operator management functions
  const handleToggleOperator = (nickname: string) => {
    if (!activeChannel) return;
    
    setChannels(prevChannels => 
      prevChannels.map(channel => {
        if (channel.name === activeChannel.name) {
          if (isChannelOperator(channel, nickname)) {
            return removeChannelOperator(channel, nickname);
          } else {
            return addChannelOperator(channel, nickname);
          }
        }
        return channel;
      })
    );
  };

  const handleKickUser = (targetNickname: string, reason: string) => {
    if (!activeChannel || !canUserPerformAction(activeChannel, currentUserNickname, 'kick')) {
      addMessageToContext({
        id: Date.now(),
        nickname: 'system',
        content: 'You do not have permission to kick users.',
        timestamp: new Date(),
        type: 'system'
      }, activeContext);
      return;
    }

    // Remove user from channel
    setChannels(prevChannels => 
      prevChannels.map(channel => {
        if (channel.name === activeChannel.name) {
          return {
            ...channel,
            users: channel.users.filter(u => u.nickname !== targetNickname)
          };
        }
        return channel;
      })
    );

    // Add kick message
    addMessageToContext({
      id: Date.now(),
      nickname: 'system',
      content: `${targetNickname} was kicked by ${currentUserNickname}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      type: 'kick'
    }, activeContext);
  };

  const handleBanUser = (targetNickname: string, reason: string) => {
    if (!activeChannel || !canUserPerformAction(activeChannel, currentUserNickname, 'ban')) {
      addMessageToContext({
        id: Date.now(),
        nickname: 'system',
        content: 'You do not have permission to ban users.',
        timestamp: new Date(),
        type: 'system'
      }, activeContext);
      return;
    }

    // Remove user from channel
    setChannels(prevChannels => 
      prevChannels.map(channel => {
        if (channel.name === activeChannel.name) {
          return {
            ...channel,
            users: channel.users.filter(u => u.nickname !== targetNickname)
          };
        }
        return channel;
      })
    );

    // Add ban message
    addMessageToContext({
      id: Date.now(),
      nickname: 'system',
      content: `${targetNickname} was banned by ${currentUserNickname}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      type: 'ban'
    }, activeContext);
  };

  const handleSendMessage = async (content: string) => {
    if (content.startsWith('/')) {
      handleCommand(content);
      
      // Trigger AI reactions for action commands (/me)
      if (content.startsWith('/me ')) {
        // Handle /me commands for web app
        if (content.startsWith('/me ')) {
          const actionContent = content.substring(4); // Remove '/me '
          const userMessage: Message = {
            id: Date.now(),
            nickname: currentUserNickname,
            content: actionContent,
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
                    if (nickname && content && nickname.trim()) {
                      // Show typing indicator for reaction message
                      setTyping(nickname.trim(), true);
                      
                      // Simulate typing delay for each reaction message
                      simulationLogger.debug(`Simulating typing delay for reaction message: "${content}"`);
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
          if (nickname && content && nickname.trim()) {
            // Show typing indicator for AI response
            setTyping(nickname.trim(), true);
            
            // Simulate typing delay for each AI response message
            simulationLogger.debug(`Simulating typing delay for AI response: "${content}"`);
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
      console.error("Full error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      let content = `Error: Could not get AI response. Please check your API key and network connection.`;
      if (error instanceof Error) {
        if (error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("429")) {
          content = `Error: API rate limit exceeded. Try reducing simulation speed or disabling typing delays in Settings.`;
        } else if (error.message.includes("PERMISSION_DENIED") || error.message.includes("403")) {
          content = `Error: API key permission denied. Please check your API key is valid and has proper permissions.`;
        } else if (error.message.includes("INVALID_ARGUMENT") || error.message.includes("400")) {
          content = `Error: Invalid API request. This might be a temporary issue with the API service.`;
        } else if (error.message.includes("UNAVAILABLE") || error.message.includes("503")) {
          content = `Error: API service temporarily unavailable. Please try again in a few moments.`;
        } else {
          // For Tier 1 API debugging - show the actual error
          content = `Error: ${error.message}. Check browser console for details.`;
        }
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
A new user named "${newUserNickname}" just joined the channel ${channel.name}.
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
          if (nickname && content && nickname.trim()) {
            // Show typing indicator for greeting
            setTyping(nickname.trim(), true);
            
            // Simulate typing delay for greeting messages
            simulationLogger.debug(`Simulating typing delay for greeting: "${content}"`);
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

  // Enhanced user management with dynamic channel joining
  const handleUsersChange = useCallback((newUsers: User[]) => {
    const oldUsers = virtualUsers;
    const addedUsers = newUsers.filter(newUser => 
      !oldUsers.some(oldUser => oldUser.nickname === newUser.nickname)
    );
    const removedUsers = oldUsers.filter(oldUser => 
      !newUsers.some(newUser => newUser.nickname === oldUser.nickname)
    );
    
    // Update virtual users
    setVirtualUsers(newUsers);
    
    // Handle added users - add them to channels dynamically
    if (addedUsers.length > 0) {
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          const updatedChannel = { ...channel };
          
          // Add new users to this channel
          addedUsers.forEach(newUser => {
            const isAlreadyInChannel = channel.users.some(u => u.nickname === newUser.nickname);
            if (!isAlreadyInChannel) {
              updatedChannel.users = [...updatedChannel.users, newUser];
              
              // Add join message
              const joinMessage: Message = {
                id: Date.now() + Math.random(),
                nickname: newUser.nickname,
                content: `joined ${channel.name}`,
                timestamp: new Date(),
                type: 'join'
              };
              updatedChannel.messages = [...updatedChannel.messages, joinMessage];
            }
          });
          
          return updatedChannel;
        })
      );
      
      // Generate greetings for new users in active channel
      if (activeContext?.type === 'channel') {
        const activeChannel = channels.find(c => c.name === activeContext.name);
        if (activeChannel) {
          addedUsers.forEach(async (newUser) => {
            try {
              // Use the existing generateGreetingForNewUser function
              await generateGreetingForNewUser(activeChannel, newUser.nickname);
            } catch (error) {
              console.error('Failed to generate greeting for new user:', error);
            }
          });
        }
      }
    }
    
    // Handle removed users - remove them from channels
    if (removedUsers.length > 0) {
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          const updatedChannel = { ...channel };
          
          removedUsers.forEach(removedUser => {
            const wasInChannel = channel.users.some(u => u.nickname === removedUser.nickname);
            if (wasInChannel) {
              updatedChannel.users = updatedChannel.users.filter(u => u.nickname !== removedUser.nickname);
              
              // Add part message
              const partMessage: Message = {
                id: Date.now() + Math.random(),
                nickname: removedUser.nickname,
                content: `left ${channel.name}`,
                timestamp: new Date(),
                type: 'part'
              };
              updatedChannel.messages = [...updatedChannel.messages, partMessage];
            }
          });
          
          return updatedChannel;
        })
      );
    }
  }, [virtualUsers, activeContext, channels, addMessageToContext, generateGreetingForNewUser, aiModel]);

  // Function to adjust simulation frequency based on time of day
  const getTimeAdjustedInterval = useCallback((baseInterval: number): number => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let multiplier = 1.0;
    
    if (hour >= 6 && hour < 12) {
      // Morning: More active (faster simulation)
      multiplier = isWeekend ? 0.8 : 0.7; // Even more active on weekends
    } else if (hour >= 12 && hour < 17) {
      // Afternoon: Normal activity
      multiplier = isWeekend ? 0.9 : 1.0;
    } else if (hour >= 17 && hour < 21) {
      // Evening: Peak social time
      multiplier = 0.6; // Much more active
    } else if (hour >= 21 && hour < 24) {
      // Late evening: Winding down
      multiplier = isWeekend ? 0.8 : 1.2;
    } else {
      // Late night/early morning: Very quiet
      multiplier = 2.0; // Much slower
    }
    
    const adjustedInterval = Math.round(baseInterval * multiplier);
    console.log(`[Time Sync] Hour: ${hour}, Weekend: ${isWeekend}, Multiplier: ${multiplier.toFixed(2)}, Adjusted interval: ${adjustedInterval}ms`);
    
    return adjustedInterval;
  }, []);

  // Function to occasionally reset conversations to prevent staleness
  const shouldResetConversation = useCallback((channelName: string) => {
    const now = Date.now();
    const lastReset = lastConversationResetRef.current[channelName] || 0;
    const timeSinceReset = now - lastReset;
    
    // Reset conversation every 2-3 hours (7200000-10800000ms) - much less frequent
    const resetInterval = 7200000 + Math.random() * 3600000;
    
    if (timeSinceReset > resetInterval) {
      lastConversationResetRef.current[channelName] = now;
      return true;
    }
    return false;
  }, []);

  const runSimulation = useCallback(async () => {
    // Safety check: Don't run simulation if settings modal is open
    if (isSettingsOpen) {
      simulationLogger.debug('Settings modal is open, skipping simulation');
      return;
    }
    
    if (channels.length === 0) {
      simulationLogger.debug('No channels available for simulation');
      return;
    }
    
    // Check if we should enter burst mode (user recently sent a message)
    const now = Date.now();
    const timeSinceLastUserMessage = now - lastUserMessageTimeRef.current;
    const shouldBurst = timeSinceLastUserMessage < 30000; // 30 seconds
    
    simulationLogger.debug(`Running simulation - burst mode: ${shouldBurst}, time since last user message: ${timeSinceLastUserMessage}ms`);
    
    // Prioritize the active channel for more responsive conversation
    let targetChannel: Channel;
    if (activeContext && activeContext.type === 'channel') {
      const activeChannel = channels.find(c => c.name === activeContext.name);
      if (activeChannel) {
        targetChannel = activeChannel;
        simulationLogger.debug(`Using active channel: ${targetChannel.name}`);
      } else {
        const randomChannelIndex = Math.floor(Math.random() * channels.length);
        targetChannel = channels[randomChannelIndex];
        simulationLogger.debug(`Active channel not found, using random channel: ${targetChannel.name}`);
      }
    } else {
      const randomChannelIndex = Math.floor(Math.random() * channels.length);
      targetChannel = channels[randomChannelIndex];
      simulationLogger.debug(`No active context, using random channel: ${targetChannel.name}`);
    }

    // Check if we should reset the conversation for this channel (much less aggressive)
    if (shouldResetConversation(targetChannel.name)) {
      simulationLogger.debug(`Resetting conversation for ${targetChannel.name} to prevent staleness`);
      // Keep the last 100 messages to maintain conversation history while preventing staleness
      const updatedChannels = channels.map(channel => 
        channel.name === targetChannel.name 
          ? { ...channel, messages: channel.messages.slice(-100) }
          : channel
      );
      setChannels(updatedChannels);
    }

    try {
      simulationLogger.debug(`Generating channel activity for ${targetChannel.name}`);
      const response = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
      if (response) {
        const [nickname, ...contentParts] = response.split(':');
        const content = contentParts.join(':').trim();

        simulationLogger.debug(`Parsed response - nickname: "${nickname}", content: "${content}"`);

        if (nickname && content && nickname.trim()) {
          // Show typing indicator
          setTyping(nickname.trim(), true);
          
          // Simulate typing delay before adding the message
          simulationLogger.debug(`Simulating typing delay for message: "${content}"`);
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
          simulationLogger.debug(`Adding AI message from ${nickname.trim()}: "${content}"`);
          addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
        } else {
          simulationLogger.debug(`Invalid response format: "${response}" - nickname: "${nickname}", content: "${content}"`);
        }
      } else {
        simulationLogger.debug(`No response generated for ${targetChannel.name}`);
      }
      
      // In burst mode, sometimes generate a second message for more activity
      // Reduced probability and increased delay for Tier 1 API stability
      if (shouldBurst && Math.random() < 0.15) { // Reduced from 0.3 to 0.15
        simulationLogger.debug(`Burst mode: generating second message for ${targetChannel.name}`);
        setTimeout(async () => {
          try {
            const secondResponse = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
            if (secondResponse) {
              const [nickname, ...contentParts] = secondResponse.split(':');
              const content = contentParts.join(':').trim();

              simulationLogger.debug(`Burst mode parsed response - nickname: "${nickname}", content: "${content}"`);

              if (nickname && content && nickname.trim()) {
                // Show typing indicator for burst message
                setTyping(nickname.trim(), true);
                
                // Simulate typing delay for burst message too
                simulationLogger.debug(`Simulating typing delay for burst message: "${content}"`);
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
                simulationLogger.debug(`Adding burst AI message from ${nickname.trim()}: "${content}"`);
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
        }, Math.random() * 5000 + 2000); // Increased from 1-4s to 2-7s delay
      }
    } catch (error) {
      console.error(`[Simulation Debug] Simulation failed for ${targetChannel.name}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        channel: targetChannel.name,
        burstMode: shouldBurst
      });
      const now = Date.now();
      // Only show error message if the last one was more than 5 minutes ago
      if (now - lastSimErrorTimestampRef.current > 300000) { 
          lastSimErrorTimestampRef.current = now;
          simulationLogger.debug(`Showing error message to user for ${targetChannel.name}`);
          const errorMessage: Message = {
              id: now,
              nickname: 'system',
              content: `Background simulation paused due to API rate limits. Try reducing simulation speed in Settings or wait a few minutes.`,
              timestamp: new Date(),
              type: 'system'
          };
          addMessageToContext(errorMessage, { type: 'channel', name: targetChannel.name });
      } else {
        simulationLogger.debug(`Error rate limited, not showing alert for ${targetChannel.name}`);
      }
      
      // Pause simulation for 30 seconds when API errors occur
      simulationLogger.debug(`Pausing simulation for 30 seconds due to API error`);
      setTimeout(() => {
        simulationLogger.debug(`Resuming simulation after API error pause`);
      }, 30000);
    }
  }, [channels, activeContext, addMessageToContext, currentUserNickname, isSettingsOpen]);

  useEffect(() => {
    simulationLogger.debug(`useEffect triggered - simulationSpeed: ${simulationSpeed}, isSettingsOpen: ${isSettingsOpen}`);
    const stopSimulation = () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };

    const startSimulation = () => {
      stopSimulation(); // Ensure no multiple intervals are running
      if (simulationSpeed === 'off' || document.hidden || isSettingsOpen) {
        simulationLogger.debug(`Not starting simulation - speed: ${simulationSpeed}, hidden: ${document.hidden}, settingsOpen: ${isSettingsOpen}`);
        return;
      }
      // Adjust simulation frequency based on time of day
      const baseInterval = SIMULATION_INTERVALS[simulationSpeed];
      const timeAdjustedInterval = getTimeAdjustedInterval(baseInterval);
      
      simulationLogger.debug(`Starting simulation with interval: ${timeAdjustedInterval}ms (${simulationSpeed}, time-adjusted)`);
      simulationIntervalRef.current = window.setInterval(runSimulation, timeAdjustedInterval);
    };
    
    const handleVisibilityChange = () => {
        if (document.hidden) {
            stopSimulation();
        } else {
            startSimulation();
        }
    };

    simulationLogger.debug(`Calling startSimulation from useEffect`);
    startSimulation();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopSimulation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runSimulation, simulationSpeed, isSettingsOpen]);

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
      {isSettingsOpen && (
        <SettingsModal 
          onSave={handleSaveSettings} 
          onCancel={handleCloseSettings} 
          currentChannels={channels} 
          onChannelsChange={setChannels} 
          currentUsers={virtualUsers}
          onUsersChange={handleUsersChange}
          ircExportConfig={ircExportConfig}
          ircExportStatus={ircExportStatus}
          onIrcExportConfigChange={handleIrcExportConfigChange}
          onIrcExportConnect={handleIrcExportConnect}
          onIrcExportDisconnect={handleIrcExportDisconnect}
        />
      )}
      <ChannelList 
        channels={channels}
        privateMessageUsers={allPMUsers}
        activeContext={activeContext}
        onSelectContext={setActiveContext}
        onOpenSettings={handleOpenSettings}
      />
      <main className="flex flex-1 flex-col border-l border-r border-gray-700">
        <ChatWindow 
          title={contextTitle}
          messages={messagesInContext}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentUserNickname={currentUserNickname}
          typingUsers={Array.from(typingUsers)}
          channel={activeChannel}
        />
      </main>
      <UserList 
        users={usersInContext} 
        onUserClick={(nickname) => setActiveContext({ type: 'pm', with: nickname })} 
        currentUserNickname={currentUserNickname}
        channel={activeChannel}
        onToggleOperator={handleToggleOperator}
      />
    </div>
  );
};

export default App;