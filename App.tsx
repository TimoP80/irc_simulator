import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelList } from './components/ChannelList';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_CHANNELS, DEFAULT_VIRTUAL_USERS, DEFAULT_NICKNAME, SIMULATION_INTERVALS } from './constants';
import type { Channel, Message, User, ActiveContext, PrivateMessageConversation, AppConfig } from './types';
import { generateChannelActivity, generateReactionToMessage, generatePrivateMessageResponse } from './services/geminiService';
import { loadConfig, saveConfig, initializeStateFromConfig } from './utils/config';

const App: React.FC = () => {
  const [currentUserNickname, setCurrentUserNickname] = useState<string>(DEFAULT_NICKNAME);
  const [virtualUsers, setVirtualUsers] = useState<User[]>(DEFAULT_VIRTUAL_USERS);
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessageConversation>>({});
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<AppConfig['simulationSpeed']>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const simulationIntervalRef = useRef<number | null>(null);
  const lastSimErrorTimestampRef = useRef<number>(0);

  // Load configuration from localStorage on initial render
  useEffect(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      const { nickname, virtualUsers, channels, simulationSpeed } = initializeStateFromConfig(savedConfig);
      setCurrentUserNickname(nickname);
      setVirtualUsers(virtualUsers);
      setChannels(channels);
      setSimulationSpeed(simulationSpeed);
    } else {
      // If no config, open settings for the user to configure the app
      setIsSettingsOpen(true);
    }
  }, []);

  const handleSaveSettings = (config: AppConfig) => {
    saveConfig(config);
    const { nickname, virtualUsers, channels, simulationSpeed } = initializeStateFromConfig(config);
    setCurrentUserNickname(nickname);
    setVirtualUsers(virtualUsers);
    setChannels(channels);
    setSimulationSpeed(simulationSpeed);
    setPrivateMessages({});
    // Don't automatically join any channel - user needs to join manually
    setActiveContext(null);
    setIsSettingsOpen(false);
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
    const [cmd, ...args] = command.slice(1).split(' ');
    const argString = args.join(' ');

    switch (cmd.toLowerCase()) {
      case 'nick': {
        const newNickname = argString.trim();
        if (newNickname) {
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
        const channelName = argString.trim();
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
      default:
        addMessageToContext({
          id: Date.now(),
          nickname: 'system',
          content: `Unknown command: /${cmd}`,
          timestamp: new Date(),
          type: 'system'
        }, activeContext);
        break;
    }
  };
  
  const handleSendMessage = async (content: string) => {
    if (content.startsWith('/')) {
      handleCommand(content);
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

    try {
      let aiResponse: string | null = null;
      if (activeContext && activeContext.type === 'channel') {
        const channel = channels.find(c => c.name === activeContext.name);
        if (channel) {
          aiResponse = await generateReactionToMessage(channel, userMessage, currentUserNickname);
        }
      } else if (activeContext && activeContext.type === 'pm') { // 'pm'
        const conversation = privateMessages[activeContext.with] || { user: virtualUsers.find(u => u.nickname === activeContext.with)!, messages: [] };
        aiResponse = await generatePrivateMessageResponse(conversation, userMessage, currentUserNickname);
      }
      
      if (aiResponse) {
        const aiMessages = aiResponse.split('\n').filter(line => line.includes(':'));
        aiMessages.forEach((msgLine, index) => {
          const [nickname, ...contentParts] = msgLine.split(':');
          const content = contentParts.join(':').trim();
          if (nickname && content) {
            const aiMessage: Message = {
              id: Date.now() + index + 1,
              nickname: nickname.trim(),
              content: content,
              timestamp: new Date(),
              type: activeContext?.type === 'pm' ? 'pm' : 'ai'
            };
            addMessageToContext(aiMessage, activeContext);
          }
        });
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

      const response = await generateChannelActivity(channel, newUserNickname);
      if (response) {
        const greetingMessages = response.split('\n').filter(line => line.includes(':'));
        greetingMessages.forEach((msgLine, index) => {
          const [nickname, ...contentParts] = msgLine.split(':');
          const content = contentParts.join(':').trim();
          if (nickname && content) {
            const greetingMessage: Message = {
              id: Date.now() + index + 1,
              nickname: nickname.trim(),
              content: content,
              timestamp: new Date(),
              type: 'ai'
            };
            addMessageToContext(greetingMessage, { type: 'channel', name: channel.name });
          }
        });
      }
    } catch (error) {
      console.error("Failed to generate greeting:", error);
    }
  };

  const runSimulation = useCallback(async () => {
    if (channels.length === 0) return;
    const randomChannelIndex = Math.floor(Math.random() * channels.length);
    const targetChannel = channels[randomChannelIndex];

    if (!(activeContext && activeContext.type === 'channel' && activeContext.name === targetChannel.name)) {
      try {
        const response = await generateChannelActivity(targetChannel, currentUserNickname);
        if (response) {
          const [nickname, ...contentParts] = response.split(':');
          const content = contentParts.join(':').trim();

          if (nickname && content) {
            const aiMessage: Message = {
              id: Date.now(),
              nickname: nickname.trim(),
              content,
              timestamp: new Date(),
              type: 'ai'
            };
            addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
          }
        }
      } catch (error) {
        console.error(`Simulation failed for ${targetChannel.name}:`, error);
        const now = Date.now();
        // Only show error message if the last one was more than 2 minutes ago
        if (now - lastSimErrorTimestampRef.current > 120000) { 
            lastSimErrorTimestampRef.current = now;
            const errorMessage: Message = {
                id: now,
                nickname: 'system',
                content: `Background simulation for this channel failed due to API errors. It will keep retrying silently. The issue might be rate limiting.`,
                timestamp: new Date(),
                type: 'system'
            };
            addMessageToContext(errorMessage, { type: 'channel', name: targetChannel.name });
        }
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
        />
      </main>
      <UserList users={usersInContext} onUserClick={(nickname) => setActiveContext({ type: 'pm', with: nickname })} currentUserNickname={currentUserNickname} />
    </div>
  );
};

export default App;