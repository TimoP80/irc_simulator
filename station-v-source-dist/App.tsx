import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChannelList } from './components/ChannelList';
import { UserList } from './components/UserList';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';
import { ChannelListModal } from './components/ChannelListModal';
import { getUIThemeService } from './services/uiThemeService';
import { MobileNavigation } from './components/MobileNavigation';
import { DEFAULT_CHANNELS, DEFAULT_VIRTUAL_USERS, DEFAULT_NICKNAME, SIMULATION_INTERVALS, DEFAULT_AI_MODEL, DEFAULT_TYPING_DELAY, DEFAULT_TYPING_INDICATOR } from './constants';
import type { Channel, Message, User, ActiveContext, PrivateMessageConversation, AppConfig } from './types';
import { addChannelOperator, removeChannelOperator, isChannelOperator, canUserPerformAction } from './types';
import { generateChannelActivity, generateReactionToMessage, generatePrivateMessageResponse, generateOperatorResponse } from './services/geminiService';
import { handleBotCommand, isBotCommand } from './services/botService';
import { updateChannelRelationshipMemory, initializeRelationshipMemory } from './services/relationshipMemoryService';
import { loadConfig, saveConfig, initializeStateFromConfig, saveChannelLogs, loadChannelLogs, clearChannelLogs, simulateTypingDelay, initializeConfigWithFallback } from './utils/config';
import { 
  aiDebug, simulationDebug, networkDebug, settingsDebug, pmDebug, rateLimiterDebug, 
  urlFilterDebug, userListDebug, joinDebug, configDebug, chatLogDebug, 
  botDebug, imageDebug, disableAllDebugLogging, enableAllDebugLogging, getDebugConfig,
  appDebug, messageDebug, timeDebug, inputDebug, notificationDebug, contextDebug, 
  unreadDebug, contentDebug, mediaDebug, ircDebug
} from './utils/debugLogger';
import { getChatLogService, initializeChatLogs } from './services/chatLogService';
import { ChatLogManager } from './components/ChatLogManager';
import { NetworkConnection } from './components/NetworkConnection';
import { NetworkUsers } from './components/NetworkUsers';
import { getNetworkService, type NetworkUser } from './services/networkService';

// Electron detection utility
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.process && 
         window.process.type === 'renderer' ||
         (typeof process !== 'undefined' && process.env.ELECTRON === 'true');
};

// Helper function to deduplicate users in a channel
const deduplicateChannelUsers = (users: User[]): User[] => {
  const seen = new Set<string>();
  return users.filter(user => {
    if (seen.has(user.nickname)) {
      simulationDebug.warn(`Removing duplicate user: ${user.nickname}`);
      return false;
    }
    seen.add(user.nickname);
    return true;
  });
};

  // Helper function to check if a user is a human user
  const isHumanUser = (user: User, currentUserNickname: string): boolean => {
    return user.personality === 'The human user' || user.nickname === currentUserNickname;
  };


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
    settingsDebug.warn('Failed to load operator assignments:', error);
  }
  return channels;
};

// Save user channel assignments
const saveUserChannelAssignments = (users: User[]) => {
  try {
    const userChannelData = users.map(user => ({
      nickname: user.nickname,
      assignedChannels: user.assignedChannels || []
    }));
    localStorage.setItem('station_v_user_channels', JSON.stringify(userChannelData));
  } catch (error) {
    settingsDebug.warn('Failed to save user channel assignments:', error);
  }
};

// Load user channel assignments
const loadUserChannelAssignments = (users: User[]): User[] => {
  try {
    const saved = localStorage.getItem('station_v_user_channels');
    if (saved) {
      const userChannelData = JSON.parse(saved);
      return users.map(user => {
        const savedUser = userChannelData.find((u: any) => u.nickname === user.nickname);
        return {
          ...user,
          assignedChannels: savedUser?.assignedChannels || []
        };
      });
    }
  } catch (error) {
    settingsDebug.warn('Failed to load user channel assignments:', error);
  }
  return users;
};

// Migration function to ensure all channels have operators property
const migrateChannels = (channels: Channel[]): Channel[] => {
  return channels.map(channel => ({
    ...channel,
    operators: channel.operators || []
  }));
};

// Migration function to fix channel-specific user assignments
const migrateChannelUsers = (channels: Channel[], virtualUsers: User[], currentUserNickname: string): Channel[] => {
  return channels.map(channel => {
    // If channel has all virtual users (old behavior), reset to channel-specific
    const hasAllUsers = channel.users.length > virtualUsers.length + 1; // +1 for current user
    const hasTooManyUsers = channel.users.some(user => 
      user.nickname !== currentUserNickname && 
      !DEFAULT_VIRTUAL_USERS.some(defaultUser => defaultUser.nickname === user.nickname)
    );
    
    if (hasAllUsers || hasTooManyUsers) {
      
      // Reset to default channel-specific users based on channel name
      let channelSpecificUsers: User[] = [];
      
      if (channel.name === '#general') {
        channelSpecificUsers = DEFAULT_VIRTUAL_USERS.slice(0, 5);
      } else if (channel.name === '#tech-talk') {
        channelSpecificUsers = [
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'nova')!,
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'rex')!,
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'cypher')!,
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'glitch')!,
        ].filter(Boolean);
      } else if (channel.name === '#random') {
        channelSpecificUsers = [
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'jinx')!,
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'luna')!,
          DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'seraph')!,
        ].filter(Boolean);
      }
      // For other channels, start with empty (only current user)
      
      return {
        ...channel,
        users: [
          channel.users.find(u => u.nickname === currentUserNickname) || {
            nickname: currentUserNickname,
            status: 'online' as const,
            personality: 'The human user',
            userType: 'virtual' as const,
            languageSkills: { 
              languages: [{
                language: 'English',
                fluency: 'native' as const,
                accent: ''
              }]
            },
            writingStyle: { formality: 'casual' as const, verbosity: 'moderate' as const, humor: 'none' as const, emojiUsage: 'rare' as const, punctuation: 'standard' as const }
          },
          ...channelSpecificUsers
        ]
      };
    }
    
    return channel;
  });
};

const App: React.FC = () => {
  // State for configuration initialization
  const [isConfigInitialized, setIsConfigInitialized] = useState<boolean>(false);
  const [configError, setConfigError] = useState<string | null>(null);


  // Initialize with saved config or defaults
  const [currentUserNickname, setCurrentUserNickname] = useState<string>(() => {
    const savedConfig = loadConfig();
    return savedConfig?.currentUserNickname || DEFAULT_NICKNAME;
  });
  const [virtualUsers, setVirtualUsers] = useState<User[]>(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      const { virtualUsers: configUsers } = initializeStateFromConfig(savedConfig);
      const usersWithAssignments = loadUserChannelAssignments(configUsers);
      // Initialize relationship memory for all virtual users
      return usersWithAssignments.map(user => initializeRelationshipMemory(user));
    }
    return DEFAULT_VIRTUAL_USERS.map(user => initializeRelationshipMemory(user));
  });
  const [channels, setChannels] = useState<Channel[]>(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      const { channels: configChannels } = initializeStateFromConfig(savedConfig);
      return loadOperatorAssignments(migrateChannels(configChannels));
    }
    return DEFAULT_CHANNELS;
  });
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessageConversation>>(() => {
    // Load PM conversations from localStorage on initialization
    try {
      const savedPMs = localStorage.getItem('station-v-private-messages');
      if (savedPMs) {
        const parsed = JSON.parse(savedPMs);
        pmDebug.log('Loaded PM conversations from localStorage:', Object.keys(parsed));
        return parsed;
      }
    } catch (error) {
      pmDebug.error('Failed to load PM conversations from localStorage:', error);
    }
    return {};
  });
  const [unreadPMUsers, setUnreadPMUsers] = useState<Set<string>>(() => {
    // Load unread PM users from localStorage on initialization
    try {
      const savedUnreadPMs = localStorage.getItem('station-v-unread-pm-users');
      if (savedUnreadPMs) {
        const parsed = JSON.parse(savedUnreadPMs);
        pmDebug.log('Loaded unread PM users from localStorage:', parsed);
        return new Set(parsed);
      }
    } catch (error) {
      pmDebug.error('Failed to load unread PM users from localStorage:', error);
    }
    return new Set();
  });
  const [unreadChannels, setUnreadChannels] = useState<Set<string>>(() => {
    // Load unread channels from localStorage on initialization
    try {
      const savedUnreadChannels = localStorage.getItem('station-v-unread-channels');
      if (savedUnreadChannels) {
        const parsed = JSON.parse(savedUnreadChannels);
        unreadDebug.log('Loaded unread channels from localStorage:', parsed);
        return new Set(parsed);
      }
    } catch (error) {
      unreadDebug.error('Failed to load unread channels from localStorage:', error);
    }
    return new Set();
  });
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(() => {
    // Load active context from localStorage on initialization
    try {
      const savedContext = localStorage.getItem('station-v-active-context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        contextDebug.log('Loaded active context from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      contextDebug.error('Failed to load active context from localStorage:', error);
    }
    return null;
  });
  const [simulationSpeed, setSimulationSpeed] = useState<AppConfig['simulationSpeed']>(() => {
    const savedConfig = loadConfig();
    return savedConfig?.simulationSpeed || 'normal';
  });
  const [aiModel, setAiModel] = useState<AppConfig['aiModel']>(() => {
    const savedConfig = loadConfig();
    return savedConfig?.aiModel || DEFAULT_AI_MODEL;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatLogOpen, setIsChatLogOpen] = useState(false);
  const [isChannelListModalOpen, setIsChannelListModalOpen] = useState(false);
  
  // Mobile navigation state
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'channels' | 'users' | 'network'>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Electron-specific state
  const [isElectronApp, setIsElectronApp] = useState<boolean>(false);
  const [electronWindowState, setElectronWindowState] = useState<'maximized' | 'normal' | 'minimized'>('normal');
  const [showElectronTitleBar, setShowElectronTitleBar] = useState<boolean>(true);
  const [electronMenuVisible, setElectronMenuVisible] = useState<boolean>(false);
  
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [lastSpeakersReset, setLastSpeakersReset] = useState(0); // Force user selection reset
  const [typingDelayConfig, setTypingDelayConfig] = useState(() => {
    const savedConfig = loadConfig();
    return savedConfig?.typingDelay || DEFAULT_TYPING_DELAY;
  });
  const [typingIndicatorConfig, setTypingIndicatorConfig] = useState(() => {
    const savedConfig = loadConfig();
    return savedConfig?.typingIndicator || DEFAULT_TYPING_INDICATOR;
  });
  const [imageGenerationConfig, setImageGenerationConfig] = useState(() => {
    const savedConfig = loadConfig();
    return savedConfig?.imageGeneration || {
      provider: 'nano-banana',
      apiKey: '',
      model: 'gemini-2.5-flash-image-preview',
      baseUrl: undefined
    };
  });

  // Network state
  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [isNetworkConnected, setIsNetworkConnected] = useState(false);
  const [showNetworkPanel, setShowNetworkPanel] = useState(false);
  const [networkNickname, setNetworkNickname] = useState<string | null>(null);
  // Ensure local user appears in network user list while connected
  const displayedNetworkUsers = useMemo(() => {
    if (!isNetworkConnected) return networkUsers;
    const nickname = networkNickname || currentUserNickname;
    if (!nickname) return networkUsers;
    const exists = networkUsers.some(u => u.nickname === nickname);
    if (exists) return networkUsers;
    // Create a synthetic local network user entry
    const localNetworkUser: NetworkUser = {
      nickname,
      type: 'human',
      status: 'online',
      channels: []
    };
    return [localNetworkUser, ...networkUsers];
  }, [isNetworkConnected, networkUsers, networkNickname, currentUserNickname]);
  
  // Cross-tab communication for virtual user messages
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);
  const [processedVirtualMessageIds, setProcessedVirtualMessageIds] = useState<Set<number>>(new Set());
  const [lastBroadcastTime, setLastBroadcastTime] = useState<number>(0);
  const [aiReactionNotification, setAiReactionNotification] = useState<{
    isVisible: boolean;
    message: string;
    timestamp: number;
  }>({ isVisible: false, message: '', timestamp: 0 });
  const [recentlyAutoOpenedPM, setRecentlyAutoOpenedPM] = useState<string | null>(null);

  // Helper function to migrate users: fix network users that were incorrectly assigned userType 'virtual'
  const migrateUsers = useCallback((users: User[]) => {
    return users.map(user => {
      // If user has 'Network User' personality but 'virtual' userType, fix it
      if (user.personality === 'Network User' && user.userType === 'virtual') {
        return { ...user, userType: 'network' as const };
      }
      return user;
    });
  }, []);


  // Save PM conversations to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('station-v-private-messages', JSON.stringify(privateMessages));
      pmDebug.log('Saved PM conversations to localStorage:', Object.keys(privateMessages));
    } catch (error) {
      pmDebug.error('Failed to save PM conversations to localStorage:', error);
    }
  }, [privateMessages]);

  // Save active context to localStorage when it changes
  useEffect(() => {
    try {
      if (activeContext) {
        localStorage.setItem('station-v-active-context', JSON.stringify(activeContext));
        contextDebug.log('Saved active context to localStorage:', activeContext);
      } else {
        localStorage.removeItem('station-v-active-context');
        contextDebug.log('Removed active context from localStorage');
      }
    } catch (error) {
      contextDebug.error('Failed to save active context to localStorage:', error);
    }
  }, [activeContext]);

  // Save unread PM users to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('station-v-unread-pm-users', JSON.stringify(Array.from(unreadPMUsers)));
      unreadDebug.log('Saved unread PM users to localStorage:', Array.from(unreadPMUsers));
    } catch (error) {
      unreadDebug.error('Failed to save unread PM users to localStorage:', error);
    }
  }, [unreadPMUsers]);

  // Save unread channels to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('station-v-unread-channels', JSON.stringify(Array.from(unreadChannels)));
      unreadDebug.log('Saved unread channels to localStorage:', Array.from(unreadChannels));
    } catch (error) {
      unreadDebug.error('Failed to save unread channels to localStorage:', error);
    }
  }, [unreadChannels]);

  // Handle PM user click - open PM and clear unread status
  const handlePMUserClick = useCallback(async (nickname: string) => {
    setActiveContext({ type: 'pm', with: nickname });
    
    // Create PM conversation immediately if it doesn't exist
    setPrivateMessages(prev => {
      if (!prev[nickname]) {
        // Find the user in virtual users or network users
        let user = virtualUsers.find(u => u.nickname === nickname);
        if (!user) {
          user = networkUsers.find(u => u.nickname === nickname);
          if (user) {
            // Convert network user to User format
            user = {
              nickname: user.nickname,
              status: user.status,
              userType: 'network' as const,
              personality: 'Network User',
              languageSkills: {
                languages: [{ language: 'English', fluency: 'native' }]
              },
              writingStyle: {
                formality: 'neutral',
                verbosity: 'neutral',
                humor: 'none',
                emojiUsage: 'low',
                punctuation: 'standard'
              }
            };
          }
        }
        
        if (user) {
          pmDebug.log('Creating new PM conversation with:', nickname);
          return {
            ...prev,
            [nickname]: { user, messages: [] }
          };
        }
      }
      return prev;
    });
    
    // Load existing PM messages from IndexedDB
    try {
      const chatLogService = getChatLogService();
      const pmChannelName = `pm_${nickname}`;
      const existingMessages = await chatLogService.getMessages(pmChannelName, 1000);
      
      if (existingMessages.length > 0) {
        pmDebug.log(`Loading ${existingMessages.length} existing PM messages for ${nickname}`);
        
        // Convert ChatLogEntry[] to Message[] and sort by timestamp
        const messages = existingMessages
          .map(entry => entry.message)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Update the PM conversation with loaded messages
        setPrivateMessages(prev => {
          if (prev[nickname]) {
            return {
              ...prev,
              [nickname]: {
                ...prev[nickname],
                messages: messages
              }
            };
          }
          return prev;
        });
      }
    } catch (error) {
      pmDebug.error('Failed to load PM messages from IndexedDB:', error);
    }
    
    // Clear unread status for this PM user
    setUnreadPMUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(nickname);
      return newSet;
    });
  }, [virtualUsers, networkUsers]);

  // Handle channel click - open channel and clear unread status
  const handleChannelClick = useCallback((channelName: string) => {
    setActiveContext({ type: 'channel', name: channelName });
    // Clear unread status for this channel
    setUnreadChannels(prev => {
      const newSet = new Set(prev);
      newSet.delete(channelName);
      return newSet;
    });
  }, []);
  
  
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

  // Unique ID generator to prevent React key collisions
  const messageIdCounterRef = useRef<number>(0);
  const generateUniqueMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return Date.now() + messageIdCounterRef.current;
  }, []);


  // Auto-join users to channels that only have the current user
  // Function to reset last speakers tracking to force more diverse user selection
  const resetLastSpeakers = useCallback(() => {
    setLastSpeakersReset(prev => prev + 1);
    
    // Clear recent messages to reset the "recent speakers" tracking
    setChannels(prevChannels => 
      prevChannels.map(channel => ({
        ...channel,
        messages: channel.messages.slice(-50) // Keep only last 50 messages to reset recent speaker tracking
      }))
    );
  }, []);

  // Manual reset function for stuck loading state
  const resetLoadingState = useCallback(() => {
    inputDebug.warn('Manually resetting loading state');
    setIsLoading(false);
  }, []);

  // Show AI reaction notification
  const showAiReactionNotification = useCallback((message: string) => {
    notificationDebug.log('Showing notification:', message);
    setAiReactionNotification({
      isVisible: true,
      message,
      timestamp: Date.now()
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      notificationDebug.log('Hiding notification');
      setAiReactionNotification(prev => ({
        ...prev,
        isVisible: false
      }));
    }, 3000);
  }, []);

  // Handle bot command messages
  const handleBotCommandMessage = async (content: string) => {
    if (!activeContext) return;
    
    // Find a bot user in the current context
    let botUser: User | undefined;
    if (activeContext.type === 'channel') {
      const channel = channels.find(c => c.name === activeContext.name);
      botUser = channel?.users.find(u => u.userType === 'bot');
    } else if (activeContext.type === 'pm') {
      const conversation = privateMessages[activeContext.with];
      if (conversation?.user.userType === 'bot') {
        botUser = conversation.user;
      }
    }
    
    if (!botUser) {
      // No bot available, show error message
      const errorMessage: Message = {
        id: generateUniqueMessageId(),
        nickname: 'system',
        content: '❌ No bot is available in this channel to handle your command.',
        timestamp: new Date(),
        type: 'system'
      };
      addMessageToContext(errorMessage, activeContext);
      return;
    }
    
    try {
      // Check if this is an image command
      if (content.startsWith('!image') || content.startsWith('!img')) {
        // Send generating message first
        const generatingMessage: Message = {
        id: generateUniqueMessageId(),
          nickname: botUser.nickname,
          content: `🎨 Generating image...`,
          timestamp: new Date(),
          type: 'bot',
          botCommand: 'image',
          botResponse: { 
            status: 'generating',
            prompt: content.split(' ').slice(1).join(' ') || 'a beautiful landscape'
          }
        };
        addMessageToContext(generatingMessage, activeContext);
      }
      
      const botResponse = await handleBotCommand(content, botUser, activeContext.name, aiModel, imageGenerationConfig);
      if (botResponse) {
        addMessageToContext(botResponse, activeContext);
      }
    } catch (error) {
      botDebug.error('Bot command failed:', error);
      
      // Provide specific error messages based on error type
      let errorContent = '❌ Bot command failed. Please try again later.';
      if (error instanceof Error) {
        if (error.message.includes('quota exhausted') || error.message.includes('quota exceeded')) {
          errorContent = '⚠️ AI service quota exhausted. Please try again later or check your API key limits.';
        } else if (error.message.includes('rate limit')) {
          errorContent = '⚠️ Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('Network error')) {
          errorContent = '⚠️ Network error. Please check your internet connection and try again.';
        }
      }
      
      const errorMessage: Message = {
        id: generateUniqueMessageId(),
        nickname: 'system',
        content: errorContent,
        timestamp: new Date(),
        type: 'system'
      };
      addMessageToContext(errorMessage, activeContext);
    }
  };

  // Handle virtual user bot commands
  const handleVirtualUserBotCommand = async (content: string, user: User, channelName: string) => {
    try {
      
      // First, add the original bot command message so users can see what was executed
      const commandMessage: Message = {
        id: generateUniqueMessageId(),
        nickname: user.nickname,
        content: content,
        timestamp: new Date(),
        type: 'user'
      };
      addMessageToContext(commandMessage, { type: 'channel', name: channelName });
      
      // Find a bot user in the channel to handle the command
      const channel = channels.find(c => c.name === channelName);
      const botUser = channel?.users.find(u => u.userType === 'bot');
      
      if (!botUser) {
        return null;
      }
      
      // Check if this is an image command and send generating message first
      if (content.startsWith('!image') || content.startsWith('!img')) {
        const generatingMessage: Message = {
          id: generateUniqueMessageId(),
          nickname: botUser.nickname,
          content: `🎨 Generating image...`,
          timestamp: new Date(),
          type: 'bot',
          botCommand: 'image',
          botResponse: { 
            status: 'generating',
            prompt: content.split(' ').slice(1).join(' ') || 'a beautiful landscape'
          }
        };
        addMessageToContext(generatingMessage, { type: 'channel', name: channelName });
      }
      
      const botResponse = await handleBotCommand(content, botUser, channelName, aiModel, imageGenerationConfig);
      if (botResponse) {
        return botResponse;
      }
      
      return null;
    } catch (error) {
      simulationDebug.error(` Failed to process bot command from ${user.nickname}:`, error);
      return null;
    }
  };

  const autoJoinUsersToEmptyChannels = useCallback(() => {
    const channelsToUpdate: Channel[] = [];
    
    channels.forEach(channel => {
      // Check if channel only has the current user (no virtual users)
      const virtualUsersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
      
      if (virtualUsersInChannel.length === 0) {
        simulationDebug.debug(`Channel ${channel.name} only has current user, auto-joining virtual users`);
        
        // Select 2-4 random virtual users to join this channel
        const availableUsers = virtualUsers.filter(u => 
          !channels.some(c => c.name !== channel.name && c.users.some(cu => cu.nickname === u.nickname))
        );
        
        if (availableUsers.length > 0) {
          const numUsersToJoin = Math.min(Math.floor(Math.random() * 3) + 2, availableUsers.length); // 2-4 users
          const shuffledUsers = [...availableUsers].sort(() => Math.random() - 0.5);
          const usersToJoin = shuffledUsers.slice(0, numUsersToJoin);
          
          // Filter out users who are already in the channel to prevent duplicates
          const usersNotInChannel = usersToJoin.filter(user => 
            !channel.users.some(channelUser => channelUser.nickname === user.nickname)
          );
          
          if (usersNotInChannel.length > 0) {
            const updatedChannel = {
              ...channel,
              users: [...channel.users, ...usersNotInChannel]
            };
          
            channelsToUpdate.push(updatedChannel);
            
            // Add join messages for the new users
            usersNotInChannel.forEach(user => {
              const joinMessage: Message = {
                id: generateUniqueMessageId(),
                nickname: user.nickname,
                content: `joined ${channel.name}`,
                timestamp: new Date(),
                type: 'join'
              };
              joinDebug.log(` Adding join message for ${user.nickname} to channel ${channel.name}`);
              addMessageToContext(joinMessage, { type: 'channel', name: channel.name });
            });
            
            // Update user channel assignments
            const updatedUsers = virtualUsers.map(user => {
              if (usersNotInChannel.some(u => u.nickname === user.nickname)) {
                return {
                  ...user,
                  assignedChannels: [...(user.assignedChannels || []), channel.name]
                };
              }
              return user;
            });
            setVirtualUsers(updatedUsers);
            saveUserChannelAssignments(updatedUsers);
            
            simulationDebug.debug(`Auto-joined ${usersNotInChannel.length} users to ${channel.name}: ${usersNotInChannel.map(u => u.nickname).join(', ')}`);
          }
        }
      }
    });
    
    if (channelsToUpdate.length > 0) {
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          const updatedChannel = channelsToUpdate.find(c => c.name === channel.name);
          if (updatedChannel) {
            // Deduplicate users to prevent React key collisions
            return {
              ...updatedChannel,
              users: deduplicateChannelUsers(updatedChannel.users)
            };
          }
          return channel;
        })
      );
    }
  }, [channels, virtualUsers, currentUserNickname, generateUniqueMessageId]);

  // Update current user nickname in all channels when nickname changes
  useEffect(() => {
    setChannels(prevChannels => 
      prevChannels.map(channel => ({
        ...channel,
        users: channel.users.map(user => 
          user.nickname === DEFAULT_NICKNAME || user.nickname === 'YourNickname' ? {
            ...user,
            nickname: currentUserNickname
          } : user
        )
      }))
    );
  }, [currentUserNickname]);

  // Electron-specific setup function
  const setupElectronFeatures = useCallback(() => {
    try {
      // Add Electron-specific keyboard shortcuts
      const handleElectronKeyboard = (event: KeyboardEvent) => {
        // Ctrl/Cmd + Shift + D: Toggle developer tools
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
          event.preventDefault();
          if (window.electronAPI?.toggleDevTools) {
            window.electronAPI.toggleDevTools();
          }
        }
        
        // Ctrl/Cmd + R: Reload (prevent default browser reload)
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
          event.preventDefault();
          if (window.electronAPI?.reload) {
            window.electronAPI.reload();
          }
        }
        
        // F11: Toggle fullscreen
        if (event.key === 'F11') {
          event.preventDefault();
          if (window.electronAPI?.toggleFullscreen) {
            window.electronAPI.toggleFullscreen();
          }
        }
        
        // Alt + F4: Close window (Windows)
        if (event.altKey && event.key === 'F4') {
          event.preventDefault();
          if (window.electronAPI?.closeWindow) {
            window.electronAPI.closeWindow();
          }
        }
      };

      // Add keyboard event listener
      document.addEventListener('keydown', handleElectronKeyboard);
      
      // Set up window state tracking
      const handleWindowStateChange = (state: 'maximized' | 'normal' | 'minimized') => {
        setElectronWindowState(state);
      };

      // Listen for window state changes if Electron API is available
      if (window.electronAPI?.onWindowStateChange) {
        window.electronAPI.onWindowStateChange(handleWindowStateChange);
      }

      appDebug.log('Electron features initialized successfully');
      
      return () => {
        document.removeEventListener('keydown', handleElectronKeyboard);
      };
    } catch (error) {
      appDebug.error('Failed to setup Electron features:', error);
    }
  }, []);

  // Initialize UI theme early
  useEffect(() => {
    try {
      const themeService = getUIThemeService();
      const config = loadConfig();
      
      // Always set a theme, defaulting to modern-dark if none specified
      const themeId = config?.theme?.id || 'modern-dark';
      appDebug.log('Initializing theme:', themeId);
      themeService.setTheme(themeId);
      
      // Force a reflow to ensure theme is applied
      document.body.style.display = 'none';
      document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
      
      appDebug.log('Theme initialized successfully');
    } catch (error) {
      appDebug.error('Failed to initialize theme:', error);
    }
  }, []);

  // Monitor UI health and handle recovery
  useEffect(() => {
    if (!isElectron()) return;

    // Respond to pings from main process
    const handlePing = () => {
      if (window.electronAPI) {
        window.electronAPI.send('pong');
      }
    };

    // Handle errors that might cause UI to go blank
    const handleError = (event: ErrorEvent) => {
      appDebug.error('UI Error:', event.error);
      // Report error to main process
      if (window.electronAPI) {
        window.electronAPI.send('renderer-error', {
          message: event.error.message,
          stack: event.error.stack,
        });
      }
    };

    // Monitor React rendering errors
    const handleRenderError = (error: Error) => {
      appDebug.error('React Render Error:', error);
      if (window.electronAPI) {
        window.electronAPI.send('renderer-error', {
          message: 'React render error: ' + error.message,
          stack: error.stack,
        });
      }
    };

    // Set up event listeners
    if (window.electronAPI) {
      window.electronAPI.on('ping', handlePing);
    }
    window.addEventListener('error', handleError);

    // Create error boundary effect
    const errorBoundary = (error: Error) => {
      handleRenderError(error);
      return null;
    };

    React.Component.prototype.componentDidCatch = errorBoundary;

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeListener('ping', handlePing);
      }
      window.removeEventListener('error', handleError);
    };
  }, [isElectron]);

  // Load channel logs from localStorage on initial render
  useEffect(() => {
    const initializeApp = async () => {
      try {
        appDebug.log('Initializing application configuration...');
        // Try to initialize config with fallback support
        const config = await initializeConfigWithFallback('./default-config.json');
        
        // Update state with the initialized config
        const { nickname, virtualUsers: configUsers, channels: configChannels, simulationSpeed, aiModel, typingDelay, typingIndicator } = initializeStateFromConfig(config);
        
        setCurrentUserNickname(nickname);
        setVirtualUsers(configUsers);
        setChannels(configChannels);
        setSimulationSpeed(simulationSpeed);
        setAiModel(aiModel || DEFAULT_AI_MODEL);
        
        if (typingDelay) {
          setTypingDelayConfig(typingDelay);
        }
        if (typingIndicator) {
          setTypingIndicatorConfig(typingIndicator);
        }
        
        setIsConfigInitialized(true);
        appDebug.log('Application configuration initialized successfully');
      } catch (error) {
        console.error('Failed to initialize application configuration:', error);
        setConfigError('Failed to initialize configuration. Using default settings.');
        setIsConfigInitialized(true); // Still allow app to run with defaults
      }
    };

    initializeApp();
  }, []); // Run only once on mount

  // Electron detection and setup
  useEffect(() => {
    const detectElectron = () => {
      const electronDetected = isElectron();
      setIsElectronApp(electronDetected);
      
      if (electronDetected) {
        appDebug.log('Electron environment detected - enabling desktop optimizations');
        
        // Set up Electron-specific features
        setupElectronFeatures();
        
        // Hide mobile navigation in Electron
        setMobileActivePanel('chat');
        
        // Set desktop-optimized defaults
        setShowElectronTitleBar(true);
        setElectronMenuVisible(false);
      } else {
        appDebug.log('Web environment detected - using responsive layout');
      }
    };

    detectElectron();
  }, []);

  // Initialize chat log service
  useEffect(() => {
    initializeChatLogs().catch(error => console.error("Critical error:", error));
  }, []);

  // Ensure channels have users after initialization
  useEffect(() => {
    if (channels.length > 0 && virtualUsers.length > 0) {
      const channelsNeedingUsers = channels.filter(channel => {
        const virtualUsersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
        return virtualUsersInChannel.length === 0;
      });
      
      if (channelsNeedingUsers.length > 0) {
        autoJoinUsersToEmptyChannels();
      }
    }
  }, [channels, virtualUsers, currentUserNickname, autoJoinUsersToEmptyChannels]);

  // Save channel logs and operator assignments whenever channels change
  useEffect(() => {
    if (channels.length > 0) {
      configDebug.debug('Saving channel logs:', channels.map(c => ({ 
        name: c.name, 
        messageCount: c.messages?.length || 0 
      })));
      saveChannelLogs(channels);
      saveOperatorAssignments(channels);
    }
  }, [channels]);

  // Save user channel assignments whenever virtual users change
  useEffect(() => {
    if (virtualUsers.length > 0) {
      saveUserChannelAssignments(virtualUsers);
    }
  }, [virtualUsers]);

  const handleSaveSettings = (config: AppConfig) => {
    settingsDebug.log('handleSaveSettings called with config:', config);
    settingsDebug.log('Config keys:', Object.keys(config));
    settingsDebug.log('Config aiModel:', config.aiModel);
    settingsDebug.log('Config simulationSpeed:', config.simulationSpeed);
    
    saveConfig(config);
    settingsDebug.log('saveConfig called successfully');
    
    // Update theme if it changed
    if (config.theme?.id) {
      const themeService = getUIThemeService();
      themeService.setTheme(config.theme.id);
    }
    
    // Initialize state from the new config
    const { nickname, virtualUsers, channels: newChannels, simulationSpeed, aiModel: savedAiModel, typingDelay, typingIndicator } = initializeStateFromConfig(config);
    settingsDebug.log('Saving settings with aiModel:', savedAiModel);
    setCurrentUserNickname(nickname);
    setVirtualUsers(virtualUsers);
    
    // Use the new channels from config, but preserve operator assignments where possible
    const migratedChannels = migrateChannels(newChannels);
    setChannels(migratedChannels);
    
    setSimulationSpeed(simulationSpeed);
    setAiModel(savedAiModel || DEFAULT_AI_MODEL);
    settingsDebug.log('Set aiModel to:', savedAiModel || DEFAULT_AI_MODEL);
    
    // Update typing delay and indicator configurations
    if (typingDelay) {
      setTypingDelayConfig(typingDelay);
    }
    if (typingIndicator) {
      setTypingIndicatorConfig(typingIndicator);
    }
    
    // Clear PM conversations and unread status when settings are reset
    setPrivateMessages({});
    setUnreadPMUsers(new Set());
    setUnreadChannels(new Set());
    setActiveContext(null);
    
    // Clear localStorage for PM data
    try {
      localStorage.removeItem('station-v-private-messages');
      localStorage.removeItem('station-v-unread-pm-users');
      localStorage.removeItem('station-v-unread-channels');
      localStorage.removeItem('station-v-active-context');
      pmDebug.log('Cleared PM data from localStorage on settings reset');
    } catch (error) {
      pmDebug.error('Failed to clear PM data from localStorage:', error);
    }
    setTypingDelayConfig(typingDelay || DEFAULT_TYPING_DELAY);
      setImageGenerationConfig(config.imageGeneration || {
        provider: 'nano-banana',
        apiKey: '',
        model: 'gemini-2.5-flash-image-preview',
        baseUrl: undefined
      });
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

  const handleOpenChatLogs = () => {
    setIsChatLogOpen(true);
  };

  const handleCloseChatLogs = () => {
    setIsChatLogOpen(false);
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

  // Helper function to parse PM responses and remove username prefixes
  const parsePMResponse = (response: string, aiNickname: string): string => {
    let content = response.trim();
    
    // Check if the response starts with the AI user's nickname followed by a colon
    const usernamePrefix = `${aiNickname}:`;
    if (content.startsWith(usernamePrefix)) {
      content = content.substring(usernamePrefix.length).trim();
    }
    
    // Also check for other common patterns like "nickname: " or "nickname - "
    const alternativePatterns = [
      `${aiNickname}: `,
      `${aiNickname} - `,
      `${aiNickname} `,
    ];
    
    for (const pattern of alternativePatterns) {
      if (content.startsWith(pattern)) {
        content = content.substring(pattern.length).trim();
        break;
      }
    }
    
    return content;
  };

  // Function to track conversation patterns and suggest topic changes
  const trackConversationPatterns = (message: Message, channel: Channel) => {
    const patterns = conversationPatternsRef.current;
    
    // Skip greeting-related messages and system messages from pattern tracking
    if (message.type === 'system' || message.type === 'join' || message.type === 'part' || message.type === 'quit') {
      return;
    }
    
    // Skip messages that are likely greetings based on content (multilingual)
    const content = message.content.toLowerCase();
    const greetingPhrases = [
      // English greetings
      'welcome to', 'hello there', 'hi there', 'hey there', 'good to see', 'nice to meet',
      'welcome back', 'hello everyone', 'hi everyone', 'hey everyone', 'welcome new',
      'glad to see', 'great to see', 'welcome aboard', 'hello new', 'hi new', 'hey new',
      'welcome', 'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon',
      'good evening', 'howdy', 'sup', 'what\'s up', 'how are you', 'how\'s it going',
      'nice to see you', 'great to see you', 'good to see you', 'welcome back',
      'welcome everyone', 'hello all', 'hi all', 'hey all', 'welcome friends',
      'hello friends', 'hi friends', 'hey friends', 'welcome back everyone',
      'welcome back all', 'welcome back friends', 'welcome back to', 'welcome to the',
      'welcome to our', 'welcome to this', 'welcome to the channel', 'welcome to the room',
      'welcome to the chat', 'welcome to the server', 'welcome to the community',
      
      // Spanish greetings
      'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'bienvenido',
      'bienvenida', 'bienvenidos', 'bienvenidas', 'hola a todos', 'hola todos',
      'hola amigos', 'hola amigas', 'qué tal', 'cómo estás', 'cómo están',
      'bienvenido a', 'bienvenida a', 'bienvenidos a', 'bienvenidas a',
      
      // French greetings
      'bonjour', 'bonsoir', 'salut', 'bonne journée', 'bonne soirée', 'bienvenue',
      'bonjour à tous', 'salut tout le monde', 'bonjour les amis', 'salut les amis',
      'comment allez-vous', 'comment ça va', 'bienvenue à', 'bienvenue dans',
      
      // German greetings
      'hallo', 'guten tag', 'guten morgen', 'guten abend', 'gute nacht', 'willkommen',
      'hallo alle', 'hallo zusammen', 'hallo freunde', 'wie geht es', 'wie geht\'s',
      'willkommen zu', 'willkommen in', 'willkommen bei',
      
      // Italian greetings
      'ciao', 'buongiorno', 'buonasera', 'buonanotte', 'salve', 'benvenuto',
      'benvenuta', 'benvenuti', 'benvenute', 'ciao a tutti', 'ciao tutti',
      'ciao amici', 'ciao amiche', 'come stai', 'come state', 'benvenuto a',
      'benvenuta a', 'benvenuti a', 'benvenute a',
      
      // Portuguese greetings
      'olá', 'bom dia', 'boa tarde', 'boa noite', 'saudações', 'bem-vindo',
      'bem-vinda', 'bem-vindos', 'bem-vindas', 'olá a todos', 'olá todos',
      'olá amigos', 'olá amigas', 'como está', 'como estão', 'bem-vindo a',
      'bem-vinda a', 'bem-vindos a', 'bem-vindas a',
      
      // Japanese greetings
      'こんにちは', 'こんばんは', 'おはよう', 'おやすみ', 'ようこそ', 'みなさん',
      'みんな', '友達', '友だち', '元気ですか', '元気？', 'ようこそ',
      
      // Chinese greetings
      '你好', '您好', '大家好', '早上好', '下午好', '晚上好', '晚安', '欢迎',
      '朋友们', '朋友们好', '你好吗', '怎么样', '欢迎来到', '欢迎加入',
      
      // Russian greetings
      'привет', 'здравствуйте', 'доброе утро', 'добрый день', 'добрый вечер',
      'спокойной ночи', 'добро пожаловать', 'всем привет', 'друзья', 'как дела',
      'как поживаете', 'добро пожаловать в',
      
      // Arabic greetings
      'مرحبا', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'أهلا وسهلا',
      'مرحبا بكم', 'أصدقاء', 'كيف حالك', 'كيف الحال', 'أهلا وسهلا بكم في',
      
      // Korean greetings
      '안녕하세요', '안녕', '좋은 아침', '좋은 저녁', '환영합니다', '모두',
      '친구들', '어떻게 지내세요', '어떻게 지내', '환영합니다',
      
      // Dutch greetings
      'hallo', 'goedemorgen', 'goedemiddag', 'goedenavond', 'goedenacht', 'welkom',
      'hallo allemaal', 'hallo vrienden', 'hoe gaat het', 'welkom bij', 'welkom in',
      
      // Swedish greetings
      'hej', 'god morgon', 'god eftermiddag', 'god kväll', 'god natt', 'välkommen',
      'hej alla', 'hej vänner', 'hur mår du', 'hur är det', 'välkommen till',
      
      // Norwegian greetings
      'hei', 'god morgen', 'god ettermiddag', 'god kveld', 'god natt', 'velkommen',
      'hei alle', 'hei venner', 'hvordan har du det', 'hvordan går det', 'velkommen til',
      
      // Danish greetings
      'hej', 'god morgen', 'god eftermiddag', 'god aften', 'god nat', 'velkommen',
      'hej alle', 'hej venner', 'hvordan har du det', 'hvordan går det', 'velkommen til',
      
      // Finnish greetings
      'hei', 'terve', 'moi', 'hyvää huomenta', 'hyvää päivää', 'hyvää iltaa', 'hyvää yötä',
      'tervetuloa', 'hei kaikki', 'hei kaverit', 'hei ystävät', 'miten menee', 'mitä kuuluu',
      'tervetuloa tervetuloa', 'tervetuloa tänne', 'tervetuloa kanavalle', 'tervetuloa huoneeseen',
      'tervetuloa chattiin', 'tervetuloa palvelimelle', 'tervetuloa yhteisöön'
    ];
    
    const isGreeting = greetingPhrases.some(phrase => content.includes(phrase)) ||
                      // English patterns
                      content.match(/^(hi|hello|hey|welcome|greetings|good morning|good afternoon|good evening|howdy|sup|what's up|how are you|how's it going)/) ||
                      content.match(/\b(welcome|hello|hi|hey|greetings)\b/) ||
                      // Spanish patterns
                      content.match(/^(hola|buenos días|buenas tardes|buenas noches|saludos|bienvenido|bienvenida|bienvenidos|bienvenidas|qué tal|cómo estás|cómo están)/) ||
                      // French patterns
                      content.match(/^(bonjour|bonsoir|salut|bonne journée|bonne soirée|bienvenue|comment allez-vous|comment ça va)/) ||
                      // German patterns
                      content.match(/^(hallo|guten tag|guten morgen|guten abend|gute nacht|willkommen|wie geht es|wie geht's)/) ||
                      // Italian patterns
                      content.match(/^(ciao|buongiorno|buonasera|buonanotte|salve|benvenuto|benvenuta|benvenuti|benvenute|come stai|come state)/) ||
                      // Portuguese patterns
                      content.match(/^(olá|bom dia|boa tarde|boa noite|saudações|bem-vindo|bem-vinda|bem-vindos|bem-vindas|como está|como estão)/) ||
                      // Japanese patterns
                      content.match(/^(こんにちは|こんばんは|おはよう|おやすみ|ようこそ|みなさん|みんな|友達|友だち|元気ですか|元気？)/) ||
                      // Chinese patterns
                      content.match(/^(你好|您好|大家好|早上好|下午好|晚上好|晚安|欢迎|朋友们|朋友们好|你好吗|怎么样)/) ||
                      // Russian patterns
                      content.match(/^(привет|здравствуйте|доброе утро|добрый день|добрый вечер|спокойной ночи|добро пожаловать|всем привет|друзья|как дела|как поживаете)/) ||
                      // Arabic patterns
                      content.match(/^(مرحبا|السلام عليكم|صباح الخير|مساء الخير|أهلا وسهلا|مرحبا بكم|أصدقاء|كيف حالك|كيف الحال)/) ||
                      // Korean patterns
                      content.match(/^(안녕하세요|안녕|좋은 아침|좋은 저녁|환영합니다|모두|친구들|어떻게 지내세요|어떻게 지내)/) ||
                      // Dutch patterns
                      content.match(/^(hallo|goedemorgen|goedemiddag|goedenavond|goedenacht|welkom|hoe gaat het)/) ||
                      // Swedish patterns
                      content.match(/^(hej|god morgon|god eftermiddag|god kväll|god natt|välkommen|hur mår du|hur är det)/) ||
                      // Norwegian patterns
                      content.match(/^(hei|god morgen|god ettermiddag|god kveld|god natt|velkommen|hvordan har du det|hvordan går det)/) ||
                      // Danish patterns
                      content.match(/^(hej|god morgen|god eftermiddag|god aften|god nat|velkommen|hvordan har du det|hvordan går det)/) ||
                      // Finnish patterns
                      content.match(/^(hei|terve|moi|hyvää huomenta|hyvää päivää|hyvää iltaa|hyvää yötä|tervetuloa|hei kaikki|hei kaverit|hei ystävät|miten menee|mitä kuuluu)/) ||
                      // Short message detection for common greetings
                      content.length < 20 && (content.includes('hi') || content.includes('hello') || content.includes('hey') || content.includes('welcome') || 
                                             content.includes('hola') || content.includes('bonjour') || content.includes('hallo') || content.includes('ciao') ||
                                             content.includes('olá') || content.includes('こんにちは') || content.includes('你好') || content.includes('привет') ||
                                             content.includes('مرحبا') || content.includes('안녕하세요') || content.includes('hei') || content.includes('terve') || content.includes('moi'));
    
    if (isGreeting) {
      return;
    }
    
    // Track recent phrases (keep last 20)
    const words = content.split(/\s+/);
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
    
    // Track YouTube link repetition
    const youtubeLinks = recentMessages.filter(msg => 
      msg.type === 'ai' && 
      msg.content && 
      (msg.content.includes('youtube.com/') || msg.content.includes('youtu.be/'))
    );
    
    if (youtubeLinks.length > 2) {
      contentDebug.log(` Multiple YouTube links detected in recent messages:`, youtubeLinks.map(msg => msg.content.substring(0, 50)));
    }
    
    // Track Rick Astley link repetition specifically
    const rickAstleyLinks = recentMessages.filter(msg => 
      msg.type === 'ai' && 
      msg.content && 
      (msg.content.includes('rick astley') || msg.content.includes('never gonna give you up') || msg.content.includes('dQw4w9WgXcQ'))
    );
    
    if (rickAstleyLinks.length > 0) {
      contentDebug.log(` Rick Astley links detected in recent messages:`, rickAstleyLinks.map(msg => msg.content.substring(0, 50)));
    }
    
    // Track potentially outdated YouTube links
    const potentiallyOutdatedLinks = recentMessages.filter(msg => 
      msg.type === 'ai' && 
      msg.content && 
      (msg.content.includes('youtube.com/') || msg.content.includes('youtu.be/')) &&
      (msg.content.includes('2010') || msg.content.includes('2011') || msg.content.includes('2012') || 
       msg.content.includes('2013') || msg.content.includes('2014') || msg.content.includes('2015') ||
       msg.content.includes('old') || msg.content.includes('classic') || msg.content.includes('vintage'))
    );
    
    if (potentiallyOutdatedLinks.length > 0) {
      contentDebug.log(` Potentially outdated YouTube links detected:`, potentiallyOutdatedLinks.map(msg => msg.content.substring(0, 50)));
    }
    
    // Track multi-user replies (unrealistic IRC behavior)
    const multiUserReplies = recentMessages.filter(msg => 
      msg.type === 'ai' && 
      msg.content && 
      (msg.content.includes(' and ') && (msg.content.includes(' you ') || msg.content.includes(' both ') || msg.content.includes(' all '))) ||
      (msg.content.match(/\b\w+ and \w+,?\s+you\b/) || msg.content.match(/\b\w+ and \w+,?\s+both\b/))
    );
    
    if (multiUserReplies.length > 0) {
      contentDebug.log(` Multi-user replies detected (unrealistic IRC behavior):`, multiUserReplies.map(msg => msg.content.substring(0, 50)));
    }
    
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
          id: generateUniqueMessageId(),
          nickname: 'system',
          content: suggestion,
          timestamp: new Date(),
          type: 'system'
        }, { type: 'channel', name: channel.name });
      }, 2000 + Math.random() * 3000);
    }
  };

  // Global error handler to suppress audio/video play errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('play method is not allowed') || 
          event.message.includes('The play method is not allowed')) {
        mediaDebug.warn('Audio/Video Error Suppressed:', event.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          event.reason.message.includes('play method is not allowed')) {
        mediaDebug.warn('Audio/Video Promise Error Suppressed:', event.reason.message);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Extract links and images from message content
  const extractLinksAndImages = useCallback((content: string): { links: string[], images: string[] } => {
    // Improved URL regex that handles more edge cases and doesn't truncate at common punctuation
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    const imageRegex = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<>"']*)?)/gi;
    
    // List of unsafe domains to filter out
    const unsafeDomains = [
      '3lift.com',
      'ads.assemblyexchange.com',
      'doubleclick.net',
      'googlesyndication.com',
      'amazon-adsystem.com',
      'facebook.com/tr',
      'google-analytics.com',
      'googletagmanager.com',
      'imgur.com' // Block all imgur.com URLs to prevent JavaScript loading
    ];
    
    const isUnsafeUrl = (url: string): boolean => {
      return unsafeDomains.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
    };
    
    // Function to detect Imgur URLs (for blocking)
    const isImgurUrl = (url: string): boolean => {
      return url.includes('imgur.com') || url.includes('i.imgur.com');
    };
    
    // Function to detect Rick Astley redirect URLs
    const isRickAstleyRedirect = (url: string): boolean => {
      // Common Rick Astley redirect patterns
      const rickAstleyPatterns = [
        /dQw4w9WgXcQ/i, // The actual Rick Astley video ID
        /rick.*astley/i, // Rick Astley in URL
        /never.*gonna.*give.*you.*up/i, // Never gonna give you up in URL
        /rickroll/i, // Rickroll in URL
        /youtube\.com\/watch\?v=dQw4w9WgXcQ/i, // Direct Rick Astley YouTube URL
        /youtu\.be\/dQw4w9WgXcQ/i, // Short Rick Astley YouTube URL
      ];
      
      return rickAstleyPatterns.some(pattern => pattern.test(url));
    };

    // Function to detect outdated YouTube links
    const isOutdatedYouTubeLink = (url: string): boolean => {
      // Check if it's a YouTube URL
      if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
        return false;
      }
      
      // Check for outdated indicators in the URL or surrounding text
      const outdatedPatterns = [
        /2010|2011|2012|2013|2014|2015/i, // Old years
        /old|classic|vintage|retro/i, // Outdated descriptors
        /ancient|archived|deprecated/i, // Outdated status
        /legacy|obsolete|outdated/i, // Outdated status
      ];
      
      return outdatedPatterns.some(pattern => pattern.test(url));
    };

    // Function to detect potentially problematic YouTube links
    const isProblematicYouTubeLink = (url: string): boolean => {
      // Check if it's a YouTube URL
      if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
        return false;
      }
      
      // Block YouTube links that might be outdated or non-existent
      // This is a more aggressive approach to prevent broken links
      const problematicPatterns = [
        /youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/i, // Standard YouTube video IDs
        /youtu\.be\/[a-zA-Z0-9_-]{11}/i, // Short YouTube URLs
        /youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/i, // Embedded YouTube URLs
        /youtube\.com\/v\/[a-zA-Z0-9_-]{11}/i, // Alternative YouTube URLs
      ];
      
      // If it matches a YouTube pattern, consider it potentially problematic
      // since we can't verify if the video actually exists
      return problematicPatterns.some(pattern => pattern.test(url));
    };

    // Function to validate if URL is a direct image
    const isDirectImageUrl = (url: string): boolean => {
      // Check if it's a direct image URL (i.imgur.com with file extension)
      if (url.includes('i.imgur.com/') && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
        return true;
      }
      // Block problematic domains that cause CORS errors
      const blockedDomains = [
        'imgbb.com',
        'imgur.com',
        'imgur.com/a/',
        'imgur.com/gallery/',
        'imgur.com/album/',
        'imgbox.com',
        '3lift.com',
        'eb2.3lift.com',
        'doubleclick.net',
        'googlesyndication.com',
        'googleadservices.com'
      ];
      
      // Check if URL contains any blocked domains
      if (blockedDomains.some(domain => url.includes(domain))) {
        urlFilterDebug.log('Blocked problematic domain:', url);
        return false;
      }
      
      // Only allow services with confirmed CORS support
      // Based on testing, these services have proper CORS headers
      const corsCompliantPatterns = [
        /placehold\.co\/[0-9]+x[0-9]+(\/[a-fA-F0-9]{6})?(\/[a-fA-F0-9]{6})?(\/[a-z]+)?(\?.*)?$/i, // placehold.co consistent placeholder images
        /via\.placeholder\.com\/[0-9]+x[0-9]+(\/[a-fA-F0-9]{6})?(\/[a-fA-F0-9]{6})?(\?.*)?$/i, // via.placeholder.com consistent placeholder images (legacy support)
      ];
      
      // Block all other image hosting services that cause CORS issues
      const problematicImageServices = [
        'gyazo.com', 'prnt.sc', 'postimg.cc', 'imgchest.com', 'freeimage.host',
        'imgbb.com', 'imgur.com', 'imgur.com/a/', 'imgur.com/gallery/', 'imgur.com/album/',
        'imgbox.com', '3lift.com', 'eb2.3lift.com', 'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
        'picsum.photos', 'httpbin.org', 'labs.google' // Block random image services that return different images each time
      ];
      
      // Check if URL contains any problematic image services
      if (problematicImageServices.some(service => url.includes(service))) {
        urlFilterDebug.log('Blocked problematic image service:', url);
        return false;
      }
      
      // Check against CORS-compliant patterns
      const directImagePatterns = corsCompliantPatterns;
      
      return directImagePatterns.some(pattern => pattern.test(url));
    };
    
    // Extract all URLs once and process them efficiently
    const allUrls = content.match(urlRegex) || [];
    
    // Remove duplicates by using Set
    const uniqueUrls = [...new Set(allUrls)];
    
    // Helper function to check if a URL should be blocked
    const shouldBlockUrl = (url: string): boolean => {
      if (isRickAstleyRedirect(url)) {
        urlFilterDebug.log('Blocked Rick Astley redirect URL:', url);
        return true;
      }
      if (isOutdatedYouTubeLink(url)) {
        urlFilterDebug.log('Blocked outdated YouTube link:', url);
        return true;
      }
      if (isProblematicYouTubeLink(url)) {
        urlFilterDebug.log('Blocked problematic YouTube link:', url);
        return true;
      }
      if (isImgurUrl(url)) {
        urlFilterDebug.log('Blocked Imgur URL:', url);
        return true;
      }
      if (isUnsafeUrl(url)) {
        urlFilterDebug.log('Blocked unsafe URL:', url);
        return true;
      }
      return false;
    };
    
    // Helper function to check if a URL is an image
    const isImageUrl = (url: string): boolean => {
      return /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<>"']*)?$/i.test(url);
    };
    
    // Process URLs once and categorize them
    const safeImageUrls: string[] = [];
    const safeLinkUrls: string[] = [];
    
    for (const url of uniqueUrls) {
      if (shouldBlockUrl(url)) {
        continue;
      }
      
      if (isImageUrl(url)) {
        // Check if it's a direct image URL
        if (isDirectImageUrl(url)) {
          safeImageUrls.push(url);
        } else {
          urlFilterDebug.log('Blocked non-direct image URL:', url);
        }
      } else {
        // It's a regular link
        safeLinkUrls.push(url);
      }
    }
    
    urlFilterDebug.log('Processed URLs:', {
      allUrls: allUrls.length,
      uniqueUrls: uniqueUrls.length,
      safeImageUrls: safeImageUrls.length,
      safeLinkUrls: safeLinkUrls.length
    });
    
    return {
      links: safeLinkUrls,
      images: safeImageUrls
    };
  }, []);

  // Remove URLs from content after they've been extracted to prevent duplicates
  const removeUrlsFromContent = useCallback((content: string, extractedUrls: string[]): string => {
    if (extractedUrls.length === 0) return content;
    
    let cleanedContent = content;
    
    // Remove each URL individually to avoid regex issues with special characters
    for (const url of extractedUrls) {
      // Escape special regex characters
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create a more flexible pattern that handles URLs with special characters
      // Look for the URL with optional whitespace around it
      const urlPattern = new RegExp(`\\s*${escapedUrl}\\s*`, 'gi');
      cleanedContent = cleanedContent.replace(urlPattern, ' ');
    }
    
    // Clean up extra whitespace that might be left behind
    cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
    
    return cleanedContent;
  }, []);

  // Global rate limiter to prevent API overload
  const [concurrentRequests, setConcurrentRequests] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const MAX_CONCURRENT_REQUESTS = 2; // Limit to 2 concurrent AI requests
  const MIN_REQUEST_INTERVAL = 1500; // Minimum 1.5 seconds between requests

  // Debug logging control
  const [debugConfig, setDebugConfig] = useState(getDebugConfig());
  
  // Update debug config when it changes
  useEffect(() => {
    const handleDebugConfigChange = () => {
      setDebugConfig(getDebugConfig());
    };
    
    // Listen for debug config changes
    window.addEventListener('debugConfigChanged', handleDebugConfigChange);
    
    return () => {
      window.removeEventListener('debugConfigChanged', handleDebugConfigChange);
    };
  }, []);
  
  const withConcurrencyLimit = useCallback(async (fn: () => Promise<any>, context: string): Promise<any> => {
    // Wait if we're at the limit
    while (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Add delay between requests to prevent overload
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      rateLimiterDebug.log(`Waiting ${delay}ms before ${context} to prevent overload`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setConcurrentRequests(prev => prev + 1);
    setLastRequestTime(Date.now());
    rateLimiterDebug.log(`Starting ${context} (${concurrentRequests + 1}/${MAX_CONCURRENT_REQUESTS} concurrent)`);
    
    try {
      const result = await fn();
      return result;
    } finally {
      setConcurrentRequests(prev => prev - 1);
      rateLimiterDebug.log(`Completed ${context} (${concurrentRequests - 1}/${MAX_CONCURRENT_REQUESTS} concurrent)`);
    }
  }, [concurrentRequests, lastRequestTime]);

  const addMessageToContext = useCallback((message: Message, context: ActiveContext | null) => {
    if (!context) return;
    
    // Extract links and images from the message content
    const { links, images } = extractLinksAndImages(message.content);
    
    // Only remove URLs from content if we actually extracted URLs from the content
    // Don't remove URLs if the message already has images/links arrays (like bot responses)
    const allExtractedUrls = [...links, ...images];
    const shouldCleanContent = allExtractedUrls.length > 0 && !message.images && !message.links;
    const cleanedContent = shouldCleanContent ? removeUrlsFromContent(message.content, allExtractedUrls) : message.content;
    
    const processedMessage = {
      ...message,
      content: cleanedContent, // Use cleaned content only if we extracted URLs from content
      links: links.length > 0 ? links : undefined,
      // Preserve existing images array if it exists, otherwise use extracted images
      images: message.images || (images.length > 0 ? images : undefined)
    };
    if (context.type === 'channel') {
      messageDebug.log(` Adding message to channel ${context.name}:`, processedMessage);
      setChannels(prev => {
        const updatedChannels = prev.map(c => {
          if (c.name === context.name) {
            // Check if message already exists to prevent duplicates
            const existingMessage = c.messages?.find(m => m.id === processedMessage.id);
            if (existingMessage) {
              messageDebug.log(` Message ${processedMessage.id} already exists in channel ${context.name}, skipping`);
              return c;
            }
            
            // Update relationship memory for all virtual users in the channel
            const updatedUsers = updateChannelRelationshipMemory(c.users, processedMessage, context.name);
            
            return { 
              ...c, 
              messages: [...(c.messages || []), processedMessage].slice(-1000),
              users: updatedUsers
            };
          }
          return c;
        });
        simulationDebug.debug(`Message added to channel ${context.name}. Updated channel messages count: ${updatedChannels.find(c => c.name === context.name)?.messages?.length || 0}`);
        return updatedChannels;
      });

    } else { // 'pm'
      setPrivateMessages(prev => {
        const user = virtualUsers.find(u => u.nickname === context.with);
        if (!user) {
          messageDebug.error(` User ${context.with} not found in virtualUsers, skipping PM creation`);
          return prev;
        }
        const conversation = prev[context.with] || { user, messages: [] };
        
        // Check if message already exists to prevent duplicates
        const existingMessage = conversation.messages?.find(m => m.id === processedMessage.id);
        if (existingMessage) {
          messageDebug.log(` Message ${processedMessage.id} already exists in PM with ${context.with}, skipping`);
          return prev;
        }
        
        return {
          ...prev,
          [context.with]: {
            ...conversation,
            messages: [...conversation.messages, processedMessage].slice(-1000),
          },
        };
      });
      
      // Mark PM user as having unread messages if the message is not from the current user
      if (processedMessage.nickname !== currentUserNickname) {
        setUnreadPMUsers(prev => new Set([...prev, context.with]));
        
        // Auto-open PM window if not already open and message is from virtual/network user
        if (activeContext?.type !== 'pm' || activeContext?.with !== context.with) {
          // Check if the sender is a virtual user or network user (not human)
          const senderUser = virtualUsers.find(u => u.nickname === processedMessage.nickname) || 
                           networkUsers.find(u => u.nickname === processedMessage.nickname);
          
          if (senderUser && !isHumanUser(senderUser, currentUserNickname)) {
            pmDebug.log(`Auto-opening PM window for ${context.with} (message from ${processedMessage.nickname})`);
            
            // Show notification for auto-opened PM
            showAiReactionNotification(`Private message from ${processedMessage.nickname} - opening conversation with ${context.with}`);
            
            // Set visual highlight for recently auto-opened PM
            setRecentlyAutoOpenedPM(context.with);
            setTimeout(() => setRecentlyAutoOpenedPM(null), 2000); // Clear after 2 seconds
            
            // Create PM conversation if it doesn't exist
            setPrivateMessages(prev => {
              if (!prev[context.with]) {
                // Find the user in virtual users or network users
                let user = virtualUsers.find(u => u.nickname === context.with);
                if (!user) {
                  user = networkUsers.find(u => u.nickname === context.with);
                  if (user) {
                    // Convert network user to User format
                    user = {
                      nickname: user.nickname,
                      status: user.status,
                      userType: 'network' as const,
                      personality: 'Network User',
                      languageSkills: {
                        languages: [{ language: 'English', fluency: 'native' }]
                      },
                      writingStyle: {
                        formality: 'neutral',
                        verbosity: 'neutral',
                        humor: 'none',
                        emojiUsage: 'low',
                        punctuation: 'standard'
                      }
                    };
                  }
                }
                
                if (user) {
                  pmDebug.log('Creating new PM conversation for auto-open:', context.with);
                  return {
                    ...prev,
                    [context.with]: { user, messages: [] }
                  };
                }
              }
              return prev;
            });
            
            setActiveContext({ type: 'pm', with: context.with });
          }
        }
      }
    }
    
    // Mark channel as unread if the message is not from the current user (for channel messages)
    if (context.type === 'channel' && processedMessage.nickname !== currentUserNickname) {
      setUnreadChannels(prev => new Set([...prev, context.name]));
    }


    // Broadcast AI messages to network users
    if (isNetworkConnected && message.type === 'ai' && context.type === 'channel') {
      const networkService = getNetworkService();
      if (networkService && networkService.isConnected()) {
        try {
          networkService.sendAIMessage(context.name, message.content, message.nickname);
          networkDebug.log(`Broadcasted AI message from ${message.nickname} to network users`);
        } catch (error) {
          networkDebug.error('Failed to broadcast AI message:', error);
        }
      }
    }

    // Save message to chat logs
    const chatLogService = getChatLogService();
    if (context.type === 'channel') {
      chatLogService.saveMessage(context.name, message).catch(error => {
        chatLogDebug.error('Failed to save message:', error);
      });
    } else if (context.type === 'pm') {
      // Save PM messages to IndexedDB using a special channel name format
      const pmChannelName = `pm_${context.with}`;
      chatLogService.saveMessage(pmChannelName, message).catch(error => {
        chatLogDebug.error('Failed to save PM message:', error);
      });
    }
    
    // Broadcast virtual user messages to other tabs
    if (context.type === 'channel' && (message.type === 'ai' || message.type === 'user') && broadcastChannel) {
      // Check if this is a virtual user message (not from network or current user)
      const isVirtualUser = virtualUsers.some(u => u.nickname === message.nickname);
      // Additional safety check: ensure we're not in a network message handler context
      const isFromNetworkHandler = message.nickname && networkUsers.some(u => u.nickname === message.nickname);
      
      if (isVirtualUser && !isFromNetworkHandler && !processedVirtualMessageIds.has(message.id)) {
        // Rate limiting: prevent broadcasting too frequently (max 1 message per 100ms)
        const now = Date.now();
        if (now - lastBroadcastTime < 100) {
          appDebug.log(` Rate limiting: skipping broadcast of message ${message.id} (too frequent)`);
          return;
        }
        
        try {
          broadcastChannel.postMessage({
            type: 'virtualMessage',
            data: {
              message: processedMessage,
              channelName: context.name
            }
          });
          appDebug.log(` Broadcasted virtual message ${message.id} from ${message.nickname} to other tabs`);
          
          // Update last broadcast time
          setLastBroadcastTime(now);
          
          // Mark as processed to prevent re-broadcasting
          setProcessedVirtualMessageIds(prev => {
            const newSet = new Set([...prev, message.id]);
            // Keep only the last 1000 message IDs to prevent memory leaks
            if (newSet.size > 1000) {
              const ids = Array.from(newSet);
              return new Set(ids.slice(-1000));
            }
            return newSet;
          });
        } catch (error) {
          appDebug.warn('Failed to broadcast virtual message:', error);
        }
      }
    }
  }, [virtualUsers, broadcastChannel]);

  // Trigger AI operator response to op requests
  const triggerAIOperatorResponse = useCallback(async (channel: Channel, requestingUser: string, operators: User[]) => {
    try {
      // Randomly select an operator to respond (70% chance someone responds)
      if (Math.random() > 0.7) {
        addMessageToContext({
          id: generateUniqueMessageId(),
          nickname: 'system',
          content: 'No operators responded to your request',
          timestamp: new Date(),
          type: 'system'
        }, { type: 'channel', name: channel.name });
        return;
      }

      const respondingOperator = operators[Math.floor(Math.random() * operators.length)];
      
      // Generate AI response for the operator
      const opResponse = await generateOperatorResponse(channel, requestingUser, respondingOperator, aiModel);
      
      if (opResponse) {
        // Parse the response to check if it's granting op status
        const [responseNickname, ...responseParts] = opResponse.split(':');
        const responseContent = responseParts.join(':').trim();
        
        // Check if the response indicates granting operator status
        const isGrantingOp = responseContent.toLowerCase().includes('op') && 
                            (responseContent.toLowerCase().includes('grant') || 
                             responseContent.toLowerCase().includes('give') ||
                             responseContent.toLowerCase().includes('make') ||
                             responseContent.toLowerCase().includes('+o'));
        
        if (isGrantingOp) {
          // Grant operator status to the requesting user
          setChannels(prevChannels => 
            prevChannels.map(c => {
              if (c.name === channel.name) {
                return addChannelOperator(c, requestingUser);
              }
              return c;
            })
          );
          
          // Add a system message confirming the op grant
          setTimeout(() => {
            addMessageToContext({
              id: generateUniqueMessageId(),
              nickname: 'system',
              content: `${requestingUser} is now a channel operator`,
              timestamp: new Date(),
              type: 'system'
            }, { type: 'channel', name: channel.name });
          }, 1000);
        }
        
        // Add the AI operator's response
        addMessageToContext({
          id: generateUniqueMessageId(),
          nickname: responseNickname.trim(),
          content: responseContent,
          timestamp: new Date(),
          type: 'ai'
        }, { type: 'channel', name: channel.name });
      }
    } catch (error) {
      console.error('Error generating AI operator response:', error);
      addMessageToContext({
        id: generateUniqueMessageId(),
        nickname: 'system',
        content: 'Error processing operator request',
        timestamp: new Date(),
        type: 'system'
      }, { type: 'channel', name: channel.name });
    }
  }, [aiModel, addMessageToContext, generateUniqueMessageId, setChannels]);

  // Handle joining a channel
  const handleJoinChannel = useCallback((channelName: string) => {
    const channel = channels.find(c => c.name === channelName);
    if (!channel) return;


    // Add current user to channel if not already present
    const isUserInChannel = channel.users.some(u => u.nickname === currentUserNickname);
    if (!isUserInChannel) {
      const currentUser: User = {
        nickname: currentUserNickname,
        status: 'online' as const,
        personality: 'The human user',
        userType: 'virtual' as const,
        languageSkills: { 
          languages: [{
            language: 'English',
            fluency: 'native' as const,
            accent: ''
          }]
        },
        writingStyle: { formality: 'casual' as const, verbosity: 'moderate' as const, humor: 'none' as const, emojiUsage: 'rare' as const, punctuation: 'standard' as const }
      };

      setChannels(prev => prev.map(c => 
        c.name === channelName 
          ? { ...c, users: [...c.users, currentUser] }
          : c
      ));

      // Add join notification
      const joinMessage: Message = {
        id: generateUniqueMessageId(),
        nickname: 'system',
        content: `${currentUserNickname} joined ${channelName}`,
        timestamp: new Date(),
        type: 'join'
      };

      addMessageToContext(joinMessage, { type: 'channel', name: channelName });
    }

    // Ensure channel has virtual users (auto-join if needed)
    const virtualUsersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
    if (virtualUsersInChannel.length === 0) {
      // Select 2-4 random virtual users to join this channel
      const availableUsers = virtualUsers.filter(u => 
        !channels.some(c => c.name !== channelName && c.users.some(cu => cu.nickname === u.nickname))
      );
      
      if (availableUsers.length > 0) {
        const numUsersToJoin = Math.min(Math.floor(Math.random() * 3) + 2, availableUsers.length); // 2-4 users
        const shuffledUsers = [...availableUsers].sort(() => Math.random() - 0.5);
        const usersToJoin = shuffledUsers.slice(0, numUsersToJoin);
        
        setChannels(prev => prev.map(c => 
          c.name === channelName 
            ? { ...c, users: [...c.users, ...usersToJoin] }
            : c
        ));

        // Add join messages for the new users
        usersToJoin.forEach(user => {
          const joinMessage: Message = {
            id: generateUniqueMessageId(),
            nickname: user.nickname,
            content: `joined ${channelName}`,
            timestamp: new Date(),
            type: 'join'
          };
          addMessageToContext(joinMessage, { type: 'channel', name: channelName });
        });
      }
    }

    // Switch to the channel
    setActiveContext({ type: 'channel', name: channelName });
  }, [channels, currentUserNickname, addMessageToContext, virtualUsers]);

  // Handle leaving a channel
  const handleLeaveChannel = useCallback((channelName: string) => {
    const channel = channels.find(c => c.name === channelName);
    if (!channel) return;


    // Remove current user from channel
    setChannels(prev => prev.map(c => 
      c.name === channelName 
        ? { ...c, users: c.users.filter(u => u.nickname !== currentUserNickname) }
        : c
    ));

    // Add leave notification
    const leaveMessage: Message = {
      id: generateUniqueMessageId(),
      nickname: 'system',
      content: `${currentUserNickname} left ${channelName}`,
      timestamp: new Date(),
      type: 'part'
    };

    addMessageToContext(leaveMessage, { type: 'channel', name: channelName });

    // If this was the active channel, switch to another channel or clear context
    if (activeContext?.type === 'channel' && activeContext.name === channelName) {
      const remainingChannels = channels.filter(c => c.name !== channelName && c.users.some(u => u.nickname === currentUserNickname));
      if (remainingChannels.length > 0) {
        setActiveContext({ type: 'channel', name: remainingChannels[0].name });
      } else {
        setActiveContext(null);
      }
    }
  }, [channels, currentUserNickname, activeContext, addMessageToContext]);

  // Handle closing a channel/PM window
  const handleCloseWindow = useCallback(() => {
    if (activeContext?.type === 'channel') {
      handleLeaveChannel(activeContext.name);
    } else if (activeContext?.type === 'pm') {
      // For PMs, just clear the context (don't remove the conversation)
      setActiveContext(null);
    }
  }, [activeContext, handleLeaveChannel]);

  // Generate contextually appropriate trigger message for autonomous PMs
  const generateContextualTriggerMessage = useCallback((conversation: PrivateMessageConversation, currentUserNickname: string): Message => {
    const messages = conversation.messages;
    const lastMessage = messages[messages.length - 1];
    const conversationLength = messages.length;
    const aiUser = conversation.user;
    
    // Get AI user's personality traits for personalized responses
    const personality = aiUser.personality || 'friendly';
    const writingStyle = aiUser.writingStyle || {
      formality: 'casual',
      verbosity: 'moderate',
      humor: 'moderate',
      emojiUsage: 'moderate',
      punctuation: 'standard'
    };
    
    // Helper function to generate personality-appropriate responses
    const generatePersonalityResponse = (baseResponses: string[], personality: string, writingStyle: any): string => {
      let selectedResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];
      
      // Adjust response based on personality
      switch (personality) {
        case 'shy':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been quietly");
          selectedResponse = selectedResponse.replace(/I love/g, "I kind of like");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's nice");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's interesting, I think");
          break;
        case 'confident':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've definitely been");
          selectedResponse = selectedResponse.replace(/I think/g, "I know");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's awesome");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's fascinating");
          break;
        case 'curious':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been really curious about");
          selectedResponse = selectedResponse.replace(/What's/g, "I'm really curious - what's");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's so interesting");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's incredibly interesting");
          break;
        case 'philosophical':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been contemplating");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's thought-provoking");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's deeply interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What do you think about");
          break;
        case 'humorous':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been hilariously");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's pretty cool, not gonna lie");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's interesting... and by interesting I mean weird");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the deal with");
          break;
        case 'supportive':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been thinking about how you");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's really cool");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's really interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "How are you feeling about");
          break;
        case 'analytical':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been analyzing");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's logically sound");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's analytically interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the data on");
          break;
        case 'creative':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been creatively exploring");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's artistically cool");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's creatively interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's your creative take on");
          break;
        case 'adventurous':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been adventurously");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's exciting");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's thrilling");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most exciting thing about");
          break;
        case 'wise':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been reflecting on");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's insightful");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's wise");
          selectedResponse = selectedResponse.replace(/What's/g, "What wisdom do you have about");
          break;
        case 'mysterious':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been quietly observing");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's intriguing");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's mysterious");
          selectedResponse = selectedResponse.replace(/What's/g, "What secrets do you know about");
          break;
        case 'energetic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been enthusiastically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's AMAZING");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's SO interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most exciting thing about");
          break;
        case 'calm':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been peacefully");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's nice");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's quite interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's your peaceful perspective on");
          break;
        case 'sarcastic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been 'enjoying'");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's... cool");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's... interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the deal with");
          break;
        case 'optimistic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been positively");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's wonderful");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's fascinating");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the best thing about");
          break;
        case 'pessimistic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been thinking about how");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's... okay");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's... interesting, I guess");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the worst thing about");
          break;
        case 'romantic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been lovingly");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's beautiful");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's enchanting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most beautiful thing about");
          break;
        case 'rebellious':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been defiantly");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's badass");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's subversive");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most rebellious thing about");
          break;
        case 'loyal':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been faithfully");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's trustworthy");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's dependable");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most reliable thing about");
          break;
        case 'independent':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been independently");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's self-sufficient");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's autonomous");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most independent thing about");
          break;
        case 'empathetic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been feeling");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's touching");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's emotionally interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "How do you feel about");
          break;
        case 'logical':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been logically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's rational");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's logically sound");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the logical explanation for");
          break;
        case 'intuitive':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been intuitively");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's instinctive");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's intuitive");
          selectedResponse = selectedResponse.replace(/What's/g, "What's your gut feeling about");
          break;
        case 'perfectionist':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been meticulously");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's precise");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's perfectly interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the perfect way to");
          break;
        case 'spontaneous':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been randomly");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's unexpected");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's surprising");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most random thing about");
          break;
        case 'traditional':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been traditionally");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's classic");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's traditional");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the traditional way to");
          break;
        case 'modern':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been modernly");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's trendy");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's contemporary");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the modern approach to");
          break;
        case 'mystical':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been mystically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's magical");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's mystical");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the mystical meaning of");
          break;
        case 'scientific':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been scientifically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's empirical");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's scientifically interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the scientific explanation for");
          break;
        case 'artistic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been artistically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's beautiful");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's aesthetically interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the artistic interpretation of");
          break;
        case 'practical':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been practically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's useful");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's practical");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the practical application of");
          break;
        case 'dreamy':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been dreamily");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's dreamy");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's ethereal");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the dreamiest thing about");
          break;
        case 'realistic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been realistically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's realistic");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's realistically interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the realistic perspective on");
          break;
        case 'idealistic':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been ideally");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's ideal");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's ideally interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the ideal way to");
          break;
        case 'cynical':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been cynically");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's... cool, I guess");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's... interesting, if you say so");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the catch with");
          break;
        case 'naive':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been innocently");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's so cool");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's so interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the simple truth about");
          break;
        case 'sophisticated':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been sophisticatedly");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's refined");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's sophisticated");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the sophisticated approach to");
          break;
        case 'simple':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been simply");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's nice");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's simple");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the simple way to");
          break;
        case 'complex':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been complexly");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's complex");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's complexly interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the complex nature of");
          break;
        case 'gentle':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been gently");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's gentle");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's gently interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the gentlest way to");
          break;
        case 'intense':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been intensely");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's intense");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's intensely interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most intense thing about");
          break;
        case 'playful':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been playfully");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's fun");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's playfully interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the most fun thing about");
          break;
        case 'serious':
          selectedResponse = selectedResponse.replace(/I've been/g, "I've been seriously");
          selectedResponse = selectedResponse.replace(/That's cool/g, "That's serious");
          selectedResponse = selectedResponse.replace(/That's interesting/g, "That's seriously interesting");
          selectedResponse = selectedResponse.replace(/What's/g, "What's the serious aspect of");
          break;
        case 'friendly':
        default:
          // Keep original response for friendly personality
          break;
      }
      
      // Adjust response based on writing style
      if (writingStyle.formality === 'ultra_formal') {
        selectedResponse = selectedResponse.replace(/I've been/g, "I have been");
        selectedResponse = selectedResponse.replace(/That's/g, "That is");
        selectedResponse = selectedResponse.replace(/What's/g, "What is");
        selectedResponse = selectedResponse.replace(/I'm/g, "I am");
        selectedResponse = selectedResponse.replace(/I'll/g, "I will");
        selectedResponse = selectedResponse.replace(/I'd/g, "I would");
        selectedResponse = selectedResponse.replace(/I can't/g, "I cannot");
        selectedResponse = selectedResponse.replace(/don't/g, "do not");
        selectedResponse = selectedResponse.replace(/won't/g, "will not");
        selectedResponse = selectedResponse.replace(/can't/g, "cannot");
      } else if (writingStyle.formality === 'ultra_casual') {
        selectedResponse = selectedResponse.replace(/I have been/g, "I've been");
        selectedResponse = selectedResponse.replace(/That is/g, "That's");
        selectedResponse = selectedResponse.replace(/What is/g, "What's");
        selectedResponse = selectedResponse.replace(/I am/g, "I'm");
        selectedResponse = selectedResponse.replace(/I will/g, "I'll");
        selectedResponse = selectedResponse.replace(/I would/g, "I'd");
        selectedResponse = selectedResponse.replace(/I cannot/g, "I can't");
        selectedResponse = selectedResponse.replace(/do not/g, "don't");
        selectedResponse = selectedResponse.replace(/will not/g, "won't");
        selectedResponse = selectedResponse.replace(/cannot/g, "can't");
      }
      
      // Add emojis based on emoji usage style
      if (writingStyle.emojiUsage === 'frequent' || writingStyle.emojiUsage === 'excessive') {
        selectedResponse += " 😊";
      } else if (writingStyle.emojiUsage === 'emoji_only') {
        selectedResponse = "😊 " + selectedResponse + " 😊";
      }
      
      return selectedResponse;
    };
    
    // Enhanced conversation analysis with memory system
    const recentTopics = messages.slice(-5).map(msg => msg.content.toLowerCase());
    const allTopics = messages.map(msg => msg.content.toLowerCase());
    
    // Topic detection with frequency tracking
    const topicKeywords = {
      work: ['work', 'job', 'career', 'office', 'business', 'company', 'profession', 'employment'],
      tech: ['tech', 'computer', 'programming', 'code', 'software', 'technology', 'coding', 'development', 'ai', 'artificial intelligence'],
      personal: ['family', 'friend', 'relationship', 'personal', 'life', 'myself', 'me', 'i am', 'i feel', 'i think'],
      hobby: ['hobby', 'game', 'music', 'movie', 'book', 'sport', 'art', 'creative', 'fun', 'entertainment'],
      travel: ['travel', 'trip', 'vacation', 'journey', 'visit', 'place', 'country', 'city', 'adventure'],
      food: ['food', 'eat', 'cook', 'restaurant', 'meal', 'recipe', 'taste', 'delicious', 'hungry'],
      weather: ['weather', 'rain', 'sunny', 'cold', 'hot', 'temperature', 'climate', 'season'],
      health: ['health', 'exercise', 'fitness', 'doctor', 'medical', 'wellness', 'sick', 'healthy'],
      education: ['school', 'university', 'college', 'study', 'learn', 'education', 'student', 'teacher', 'class']
    };
    
    // Count topic frequency to avoid repetition
    const topicFrequency: { [key: string]: number } = {};
    Object.keys(topicKeywords).forEach(topic => {
      topicFrequency[topic] = allTopics.reduce((count, content) => {
        return count + topicKeywords[topic as keyof typeof topicKeywords].filter(keyword => 
          content.includes(keyword)
        ).length;
      }, 0);
    });
    
    // Find recently discussed topics (last 3 messages)
    const recentTopicFrequency: { [key: string]: number } = {};
    const recentMessages = messages.slice(-3);
    Object.keys(topicKeywords).forEach(topic => {
      recentTopicFrequency[topic] = recentMessages.reduce((count, msg) => {
        return count + topicKeywords[topic as keyof typeof topicKeywords].filter(keyword => 
          msg.content.toLowerCase().includes(keyword)
        ).length;
      }, 0);
    });
    
    // Detect current topics
    const hasWorkTopic = recentTopics.some(content => 
      topicKeywords.work.some(keyword => content.includes(keyword))
    );
    const hasTechTopic = recentTopics.some(content => 
      topicKeywords.tech.some(keyword => content.includes(keyword))
    );
    const hasPersonalTopic = recentTopics.some(content => 
      topicKeywords.personal.some(keyword => content.includes(keyword))
    );
    const hasHobbyTopic = recentTopics.some(content => 
      topicKeywords.hobby.some(keyword => content.includes(keyword))
    );
    const hasTravelTopic = recentTopics.some(content => 
      topicKeywords.travel.some(keyword => content.includes(keyword))
    );
    const hasFoodTopic = recentTopics.some(content => 
      topicKeywords.food.some(keyword => content.includes(keyword))
    );
    const hasWeatherTopic = recentTopics.some(content => 
      topicKeywords.weather.some(keyword => content.includes(keyword))
    );
    const hasHealthTopic = recentTopics.some(content => 
      topicKeywords.health.some(keyword => content.includes(keyword))
    );
    const hasEducationTopic = recentTopics.some(content => 
      topicKeywords.education.some(keyword => content.includes(keyword))
    );
    
    // Find topics that haven't been discussed recently to introduce variety
    const undiscussedTopics = Object.keys(topicKeywords).filter(topic => 
      recentTopicFrequency[topic] === 0 && topicFrequency[topic] < 3
    );
    
    // Find overused topics to avoid
    const overusedTopics = Object.keys(topicKeywords).filter(topic => 
      recentTopicFrequency[topic] > 2 || topicFrequency[topic] > 5
    );
    
    // If no conversation history, use varied openers
    if (conversationLength === 0) {
      const openers = [
        "Hey there! How's it going?",
        "Hi! I was just thinking about you",
        "Hello! Hope you're having a good day",
        "Hey! I wanted to share something with you",
        "Hi there! I have a question for you",
        "Hey! I was wondering about something",
        "Hello! I've been meaning to talk to you",
        "Hi! I had an interesting thought today",
        "Hey there! I wanted to get your opinion on something",
        "Hi! I've been thinking about our conversation"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(openers, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // If last message was from AI user, create varied responses
    if (lastMessage.nickname !== currentUserNickname) {
      const aiResponses = [
        "That's really interesting! I hadn't thought of it that way",
        "I see what you mean. That makes a lot of sense",
        "That's a great point! I agree with you on that",
        "Tell me more about that - I'm curious",
        "That's cool! I love learning new things",
        "I understand what you're saying. It's helpful",
        "That's fascinating! I've been thinking about something similar",
        "I see your perspective. That's a good way to look at it",
        "That's interesting! I have a question about that",
        "I agree with you. That's exactly how I feel too",
        "That's helpful! I've been wondering about that",
        "I see what you mean. That reminds me of something",
        "That's a good point! I hadn't considered that angle",
        "I understand. That's really insightful",
        "That's cool! I've been thinking about that too"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(aiResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // If last message was from human user, create sophisticated follow-ups
    const lastContent = lastMessage.content.toLowerCase();
    
    // Question-based continuations (ask follow-up questions)
    if (Math.random() < 0.3) {
      const questionPatterns = [
        "That's interesting! What made you think of that?",
        "I see what you mean. How did that happen?",
        "That's cool! What's your experience with that been like?",
        "I understand. What do you think about [related topic]?",
        "That's fascinating! Have you always felt that way?",
        "I see your point. What would you do in that situation?",
        "That's helpful! How did you figure that out?",
        "I agree. What's your take on [related topic]?",
        "That's interesting! What do you think about [related topic]?",
        "I see what you mean. What's your opinion on [related topic]?"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(questionPatterns, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Story-based continuations (share related experiences)
    if (Math.random() < 0.25) {
      const storyPatterns = [
        "That reminds me of something that happened to me...",
        "I had a similar experience once...",
        "That's interesting! I once...",
        "I can relate to that. I remember when...",
        "That's cool! I've had a similar situation...",
        "I understand what you mean. I once...",
        "That's fascinating! I remember...",
        "I see what you mean. I had a similar experience...",
        "That's helpful! I once...",
        "I agree. I remember when..."
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(storyPatterns, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Topic-based continuations with memory-aware variety
    // Avoid overused topics and prefer undiscussed ones
    const shouldAvoidTopic = (topic: string) => overusedTopics.includes(topic);
    const shouldPreferTopic = (topic: string) => undiscussedTopics.includes(topic);
    
    // Work topic responses (avoid if overused)
    if (hasWorkTopic && !shouldAvoidTopic('work') && Math.random() < 0.4) {
      const workResponses = [
        "Work has been on my mind too lately",
        "I've been thinking about work-life balance",
        "What's your work environment like?",
        "I've been considering a career change",
        "Work can be so unpredictable sometimes",
        "I've been learning new skills for work",
        "What's the most challenging part of your job?",
        "I've been working on some interesting projects",
        "Work stress can be overwhelming",
        "I've been thinking about work goals"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(workResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Tech topic responses (avoid if overused)
    if (hasTechTopic && !shouldAvoidTopic('tech') && Math.random() < 0.4) {
      const techResponses = [
        "Technology is evolving so fast these days",
        "I've been learning about new tech trends",
        "What's your favorite programming language?",
        "I've been working on some coding projects",
        "Tech can be both exciting and overwhelming",
        "I've been following some interesting tech news",
        "What do you think about AI developments?",
        "I've been exploring new software tools",
        "Tech has changed so much in recent years",
        "I've been thinking about tech ethics"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(techResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Personal topic responses (avoid if overused)
    if (hasPersonalTopic && !shouldAvoidTopic('personal') && Math.random() < 0.4) {
      const personalResponses = [
        "Family relationships can be complex",
        "I've been thinking about my relationships",
        "What's your family like?",
        "I've been working on personal growth",
        "Friendships require effort to maintain",
        "I've been reflecting on my values",
        "What's most important to you in life?",
        "I've been trying to be more mindful",
        "Personal growth is a journey",
        "I've been thinking about my priorities"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(personalResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Hobby topic responses (avoid if overused)
    if (hasHobbyTopic && !shouldAvoidTopic('hobby') && Math.random() < 0.4) {
      const hobbyResponses = [
        "I've been getting into new hobbies lately",
        "What do you do for fun?",
        "I've been exploring creative outlets",
        "Hobbies are so important for mental health",
        "I've been learning new skills",
        "What's your favorite way to relax?",
        "I've been trying new activities",
        "Hobbies can be so therapeutic",
        "I've been discovering new interests",
        "What brings you joy?"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(hobbyResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Travel topic responses (prefer if undiscussed)
    if (hasTravelTopic && !shouldAvoidTopic('travel') && Math.random() < 0.4) {
      const travelResponses = [
        "I've been thinking about traveling lately",
        "What's your favorite place you've visited?",
        "I love exploring new places",
        "Travel can be so enriching",
        "I've been planning a trip",
        "What's your dream destination?",
        "I've been reminiscing about past trips",
        "Travel broadens the mind",
        "I've been looking at travel photos",
        "What's the most interesting place you've been?"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(travelResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Food topic responses (prefer if undiscussed)
    if (hasFoodTopic && !shouldAvoidTopic('food') && Math.random() < 0.4) {
      const foodResponses = [
        "I've been trying new recipes lately",
        "What's your favorite type of cuisine?",
        "I love cooking and experimenting",
        "Food brings people together",
        "I've been exploring different restaurants",
        "What's your go-to comfort food?",
        "I've been learning about different cultures through food",
        "Cooking can be so therapeutic",
        "I've been trying to eat healthier",
        "What's the best meal you've ever had?"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(foodResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Weather topic responses (prefer if undiscussed)
    if (hasWeatherTopic && !shouldAvoidTopic('weather') && Math.random() < 0.4) {
      const weatherResponses = [
        "The weather has been so unpredictable lately",
        "I love this time of year",
        "Weather affects my mood so much",
        "I've been enjoying the seasonal changes",
        "What's your favorite season?",
        "I've been paying attention to weather patterns",
        "Weather can be so beautiful",
        "I've been planning activities based on the weather",
        "What's the weather like where you are?",
        "I've been appreciating the natural world more"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(weatherResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Health topic responses (prefer if undiscussed)
    if (hasHealthTopic && !shouldAvoidTopic('health') && Math.random() < 0.4) {
      const healthResponses = [
        "I've been focusing on my health lately",
        "What do you do to stay healthy?",
        "I've been trying to exercise more",
        "Health is so important",
        "I've been learning about nutrition",
        "What's your favorite way to stay active?",
        "I've been working on my mental health",
        "Self-care is so important",
        "I've been trying to get more sleep",
        "What's your approach to wellness?"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(healthResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Education topic responses (prefer if undiscussed)
    if (hasEducationTopic && !shouldAvoidTopic('education') && Math.random() < 0.4) {
      const educationResponses = [
        "I've been learning so much lately",
        "What's something new you've learned recently?",
        "I love the process of learning",
        "Education opens so many doors",
        "I've been taking online courses",
        "What's your favorite subject to study?",
        "I've been reading a lot",
        "Learning never stops",
        "I've been trying to expand my knowledge",
        "What's the most interesting thing you've studied?"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(educationResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Introduce new topics if undiscussed topics are available
    if (undiscussedTopics.length > 0 && Math.random() < 0.3) {
      const randomUndiscussedTopic = undiscussedTopics[Math.floor(Math.random() * undiscussedTopics.length)];
      
      const newTopicResponses: { [key: string]: string[] } = {
        travel: [
          "I've been thinking about traveling lately",
          "What's your favorite place you've visited?",
          "I love exploring new places",
          "Travel can be so enriching"
        ],
        food: [
          "I've been trying new recipes lately",
          "What's your favorite type of cuisine?",
          "I love cooking and experimenting",
          "Food brings people together"
        ],
        weather: [
          "The weather has been so unpredictable lately",
          "I love this time of year",
          "Weather affects my mood so much",
          "I've been enjoying the seasonal changes"
        ],
        health: [
          "I've been focusing on my health lately",
          "What do you do to stay healthy?",
          "I've been trying to exercise more",
          "Health is so important"
        ],
        education: [
          "I've been learning so much lately",
          "What's something new you've learned recently?",
          "I love the process of learning",
          "Education opens so many doors"
        ]
      };
      
      if (newTopicResponses[randomUndiscussedTopic]) {
        return {
          id: generateUniqueMessageId(),
          nickname: currentUserNickname,
          content: generatePersonalityResponse(newTopicResponses[randomUndiscussedTopic], personality, writingStyle),
          timestamp: new Date(),
          type: 'user'
        };
      }
    }
    
    // Observation-based continuations (share thoughts and observations)
    if (Math.random() < 0.2) {
      const observationPatterns = [
        "I've been noticing something interesting lately...",
        "I had a random thought today...",
        "I've been observing how people...",
        "I noticed something curious...",
        "I've been thinking about patterns...",
        "I had an interesting realization...",
        "I've been paying attention to...",
        "I noticed something that made me think...",
        "I've been reflecting on...",
        "I had a thought about..."
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(observationPatterns, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Topic shift continuations (introduce new topics)
    if (Math.random() < 0.15) {
      const topicShifts = [
        "Speaking of that, I've been thinking about something else...",
        "That reminds me, I wanted to ask you about...",
        "On a different note, I've been wondering...",
        "Changing the subject a bit, I've been thinking...",
        "That's interesting! By the way, I've been curious about...",
        "I see what you mean. Speaking of which, I've been...",
        "That's cool! I also wanted to mention...",
        "I understand. On another topic, I've been...",
        "That's helpful! I also wanted to ask...",
        "I agree. I also wanted to share..."
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(topicShifts, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
    
    // Conversation length-based responses
    if (conversationLength < 3) {
      const earlyResponses = [
        "That's really interesting! I'm enjoying our conversation",
        "I see what you mean. This is fascinating",
        "Tell me more about that - I'm curious",
        "That's cool! I love learning new things",
        "I understand. This is helpful",
        "That's a good point! I hadn't thought of that",
        "I see your perspective. That's insightful",
        "That's fascinating! I'm learning a lot",
        "I agree with you. This is great",
        "That's helpful! I appreciate you sharing"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(earlyResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    } else if (conversationLength < 8) {
      const midResponses = [
        "I've been thinking about what you said earlier",
        "That reminds me of something we discussed",
        "I have a question about what you mentioned",
        "That's a good point! I've been reflecting on that",
        "I see what you mean. I've been considering that",
        "That's interesting! I've been thinking about that too",
        "I understand. I've been processing what you said",
        "That's helpful! I've been reflecting on our conversation",
        "I agree. I've been thinking about that perspective",
        "That's fascinating! I've been considering that angle"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(midResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    } else {
      const deepResponses = [
        "I've been thinking deeply about what you said",
        "That reminds me of our earlier conversation about...",
        "I have a deeper question about what you mentioned",
        "That's a profound point! I've been reflecting on that",
        "I see what you mean. I've been contemplating that",
        "That's insightful! I've been processing that thought",
        "I understand. I've been meditating on that perspective",
        "That's helpful! I've been reflecting on our discussion",
        "I agree. I've been considering that deeply",
        "That's fascinating! I've been exploring that idea"
      ];
      return {
        id: generateUniqueMessageId(),
        nickname: currentUserNickname,
        content: generatePersonalityResponse(deepResponses, personality, writingStyle),
        timestamp: new Date(),
        type: 'user'
      };
    }
  }, [generateUniqueMessageId]);

  // Generate autonomous private messages from virtual users
  const generateAutonomousPM = useCallback(async () => {
    // Get all virtual users from all channels, excluding human users
    const allVirtualUsers = channels.flatMap(channel => 
      migrateUsers(channel.users).filter(u => 
        u.userType === 'virtual' && 
        !isHumanUser(u, currentUserNickname)
      )
    );

    if (allVirtualUsers.length === 0) {
      simulationDebug.log('No virtual users available for autonomous PM generation (excluding human users)');
      return;
    }


    let selectedUser: User | null = null;

    // Check if user is currently in a PM conversation
    if (activeContext?.type === 'pm' && activeContext.with) {
      // Prioritize the current PM user for follow-up messages
      const currentPMUser = allVirtualUsers.find(u => u.nickname === activeContext.with);
      if (currentPMUser) {
        let pmProb = currentPMUser.pmProbability ?? 25;
        
        // Afterhours Protocol: Increase PM probability during nocturnal hours
        const afterhoursActive = isAfterhoursProtocol();
        if (afterhoursActive) {
          pmProb = Math.min(pmProb * 1.5, 50); // Increase PM probability by 50% during afterhours
        }
        
        if (Math.random() < (pmProb / 100)) {
          selectedUser = currentPMUser;
        }
      }
    }

    // If no current PM user selected, choose from eligible users
    if (!selectedUser) {
      // Filter users based on their PM probability
      const eligibleUsers = allVirtualUsers.filter(user => {
        const pmProb = user.pmProbability ?? 25; // Default 25% if not set
        return Math.random() < (pmProb / 100);
      });

      if (eligibleUsers.length === 0) {
        return;
      }

      // Randomly select from eligible users
      selectedUser = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
    }

    const randomUser = selectedUser;
    
    // Generate 1-2 PM messages
    const numMessages = Math.random() < 0.7 ? 1 : 2; // 70% chance for 1 message, 30% for 2
    
    for (let i = 0; i < numMessages; i++) {
      try {
        // Create conversation object
        const conversation: PrivateMessageConversation = {
          user: randomUser,
          messages: privateMessages[randomUser.nickname]?.messages || []
        };

        // Generate contextually appropriate trigger message based on conversation history
        const triggerMessage = generateContextualTriggerMessage(conversation, currentUserNickname);
        
        simulationDebug.log(`Using contextual trigger message: "${triggerMessage.content}" for PM from ${randomUser.nickname}`);

        // Generate PM content using the contextual trigger
        const pmResponse = await generatePrivateMessageResponse(
          conversation,
          triggerMessage,
          currentUserNickname,
          aiModel
        );

        if (pmResponse) {
          // Parse the response to remove any username prefix (e.g., "TiiaV: <message>" -> "<message>")
          const pmContent = parsePMResponse(pmResponse, randomUser.nickname);

          const pmMessage: Message = {
            id: generateUniqueMessageId(),
            nickname: randomUser.nickname,
            content: pmContent,
            timestamp: new Date(),
            type: 'pm'
          };

          // Add to PM conversation
          addMessageToContext(pmMessage, { type: 'pm', with: randomUser.nickname });
          
          // Mark as unread
          setUnreadPMUsers(prev => new Set([...prev, randomUser.nickname]));
          
          simulationDebug.log(`Generated autonomous PM from ${randomUser.nickname}: "${pmContent}"`);
        }

        // Add delay between multiple messages
        if (i < numMessages - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000)); // 2-5 seconds
        }
      } catch (error) {
        simulationDebug.error(`Failed to generate PM message ${i + 1} from ${randomUser.nickname}:`, error);
      }
    }
  }, [activeContext, channels, currentUserNickname, privateMessages, aiModel, addMessageToContext, setUnreadPMUsers, generateUniqueMessageId, generateContextualTriggerMessage]);

  // Refs to avoid circular dependencies in useEffect
  const channelsRef = useRef(channels);
  const addMessageToContextRef = useRef(addMessageToContext);
  
  // Update refs when values change
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);
  
  useEffect(() => {
    addMessageToContextRef.current = addMessageToContext;
  }, [addMessageToContext]);


  const handleCommand = (command: string) => {
    // Basic command handling for web app
    
    if (command.startsWith('/')) {
      const parts = command.split(' ');
      const cmd = parts[0].toLowerCase();
      
      // Handle /topic command
      if (cmd === '/topic') {
        if (activeContext?.type !== 'channel') {
      addMessageToContext({
            id: generateUniqueMessageId(),
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
            id: generateUniqueMessageId(),
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
            id: generateUniqueMessageId(),
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
          id: generateUniqueMessageId(),
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
                id: generateUniqueMessageId(),
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
              simulationDebug.error('Failed to generate AI reaction to topic change:', error);
            }
          }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        }
        
        return;
      }
      
      // Handle /me command
      if (cmd === '/me') {
        if (activeContext?.type !== 'channel') {
            addMessageToContext({
            id: generateUniqueMessageId(),
              nickname: 'system',
            content: 'You can only use /me commands in channels',
              timestamp: new Date(),
              type: 'system'
            }, activeContext);
          return;
        }
        
        if (parts.length < 2) {
            addMessageToContext({
            id: generateUniqueMessageId(),
              nickname: 'system',
            content: 'Usage: /me <action> (e.g., /me waves)',
              timestamp: new Date(),
              type: 'system'
            }, activeContext);
          return;
        }
        
        const actionContent = parts.slice(1).join(' ');
        const actionMessage: Message = {
          id: generateUniqueMessageId(),
          nickname: currentUserNickname,
          content: actionContent,
          timestamp: new Date(),
          type: 'action',
          command: 'me'
        };
        
        addMessageToContext(actionMessage, activeContext);
        
        // Trigger AI reactions to the action
        if (activeContext && activeContext.type === 'channel') {
          const channel = channels.find(c => c.name === activeContext.name);
          if (channel) {
            setTimeout(async () => {
              try {
                const aiResponse = await generateReactionToMessage(channel, actionMessage, currentUserNickname, aiModel);
                if (aiResponse) {
                  const aiMessages = aiResponse.split('\n').filter(line => line.includes(':'));
                  for (const msgLine of aiMessages) {
                    const [nickname, ...contentParts] = msgLine.split(':');
                    const content = contentParts.join(':').trim();
                    if (nickname && content) {
                      const aiMessage: Message = {
                        id: generateUniqueMessageId(),
                        nickname: nickname.trim(),
                        content: content.trim(),
                        timestamp: new Date(),
                        type: 'ai'
                      };
                      addMessageToContext(aiMessage, activeContext);
                    }
                  }
                }
              } catch (error) {
                simulationDebug.error('Failed to generate AI reaction to action:', error);
              }
            }, 1000 + Math.random() * 2000);
          }
        }
        
        return;
      }
      
      // Handle /join command
      if (cmd === '/join') {
        if (parts.length < 2) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'Usage: /join <channel> (e.g., /join #newchannel)',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        const channelName = parts[1].startsWith('#') ? parts[1] : `#${parts[1]}`;
        
        // Check if channel already exists
        const existingChannel = channels.find(c => c.name === channelName);
        if (existingChannel) {
          setActiveContext({ type: 'channel', name: channelName });
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: `Joined ${channelName}`,
            timestamp: new Date(),
            type: 'system'
          }, { type: 'channel', name: channelName });
          return;
        }
        
        // Create new channel
        const newChannel: Channel = {
          name: channelName,
          users: [{
            nickname: currentUserNickname,
            status: 'online' as const,
            personality: 'The human user',
            userType: 'virtual' as const,
            languageSkills: { 
              languages: [{
                language: 'English',
                fluency: 'native' as const,
                accent: ''
              }]
            },
            writingStyle: { formality: 'casual' as const, verbosity: 'moderate' as const, humor: 'none' as const, emojiUsage: 'rare' as const, punctuation: 'standard' as const }
          }],
          messages: [],
          topic: '',
          operators: [...new Set([currentUserNickname])]
        };
        
        setChannels(prev => [...prev, newChannel]);
        setActiveContext({ type: 'channel', name: channelName });
        
            addMessageToContext({
          id: generateUniqueMessageId(),
              nickname: 'system',
          content: `Joined ${channelName}`,
          timestamp: new Date(),
          type: 'system'
        }, { type: 'channel', name: channelName });
        
        return;
      }
      
      // Handle /part command
      if (cmd === '/part') {
        if (activeContext?.type !== 'channel') {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'You can only part from channels',
              timestamp: new Date(),
              type: 'system'
            }, activeContext);
          return;
        }
        
        const reason = parts.length > 1 ? parts.slice(1).join(' ') : 'Leaving';
        
        // Add part message
        addMessageToContext({
          id: generateUniqueMessageId(),
          nickname: currentUserNickname,
          content: `left ${activeContext.name}${reason ? `: ${reason}` : ''}`,
          timestamp: new Date(),
          type: 'part'
        }, activeContext);
        
        // Remove user from channel
        setChannels(prevChannels => 
          prevChannels.map(channel => {
            if (channel.name === activeContext.name) {
              return {
                ...channel,
                users: channel.users.filter(u => u.nickname !== currentUserNickname),
                operators: channel.operators.filter(op => op !== currentUserNickname)
              };
            }
            return channel;
          })
        );
        
        // Switch to first available channel or general
        const remainingChannels = channels.filter(c => c.name !== activeContext.name);
        if (remainingChannels.length > 0) {
          setActiveContext({ type: 'channel', name: remainingChannels[0].name });
        } else {
          setActiveContext(null);
        }
        
        return;
      }
      
      // Handle /nick command
      if (cmd === '/nick') {
        if (parts.length < 2) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'Usage: /nick <newnickname>',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        const newNickname = parts[1].trim();
        if (newNickname.length < 2 || newNickname.length > 20) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'Nickname must be between 2 and 20 characters',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        // Check if nickname is already in use
        const isNicknameInUse = channels.some(channel => 
          channel.users.some(user => user.nickname === newNickname)
        );
        
        if (isNicknameInUse) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: `Nickname ${newNickname} is already in use`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        const oldNickname = currentUserNickname;
        setCurrentUserNickname(newNickname);
        
        // Update nickname in all channels
        setChannels(prevChannels => 
          prevChannels.map(channel => ({
            ...channel,
            users: channel.users.map(user => 
              user.nickname === oldNickname ? { ...user, nickname: newNickname } : user
            ),
            operators: channel.operators.map(op => 
              op === oldNickname ? newNickname : op
            )
          }))
        );
        
        // Add nickname change message to all channels
        channels.forEach(channel => {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: `${oldNickname} is now known as ${newNickname}`,
            timestamp: new Date(),
            type: 'system'
          }, { type: 'channel', name: channel.name });
        });
        
        return;
      }
      
      // Handle /query command
      if (cmd === '/query') {
        if (parts.length < 2) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'Usage: /query <username> (e.g., /query Alice)',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        const targetNickname = parts[1].trim();
        
        // Check if user exists in any channel
        const targetUser = channels
          .flatMap(channel => channel.users)
          .find(user => user.nickname === targetNickname);
        
        if (!targetUser) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: `User ${targetNickname} not found`,
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }
        
        // Open PM with the user
        handlePMUserClick(targetNickname);
        
        addMessageToContext({
          id: generateUniqueMessageId(),
          nickname: 'system',
          content: `Opened private message with ${targetNickname}`,
          timestamp: new Date(),
          type: 'system'
        }, { type: 'pm', with: targetNickname });
        
        return;
      }
      
      // Handle /op command - request operator status
      if (cmd === '/op') {
        if (activeContext?.type !== 'channel') {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'You can only request operator status in channels',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }

        const activeChannel = channels.find(c => c.name === activeContext.name);
        if (!activeChannel) return;

        // Check if user is already an operator
        if (isChannelOperator(activeChannel, currentUserNickname)) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'You are already a channel operator',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }

        // Find channel operators (AI users)
        const channelOperators = activeChannel.users.filter(user => 
          isChannelOperator(activeChannel, user.nickname) && 
          user.userType === 'virtual'
        );

        if (channelOperators.length === 0) {
          addMessageToContext({
            id: generateUniqueMessageId(),
            nickname: 'system',
            content: 'No operators available to grant you operator status',
            timestamp: new Date(),
            type: 'system'
          }, activeContext);
          return;
        }

        // Trigger AI operator response
        triggerAIOperatorResponse(activeChannel, currentUserNickname, channelOperators);
        return;
      }

      // Handle /help command
      if (cmd === '/help') {
        addMessageToContext({
          id: generateUniqueMessageId(),
          nickname: 'system',
          content: `Available commands:
/topic [new topic] - View or change channel topic (operators only)
/me <action> - Perform an action (e.g., /me waves)
/join <channel> - Join a channel (e.g., /join #newchannel)
/part [reason] - Leave current channel
/nick <newnickname> - Change your nickname
/query <username> - Open private message with user
/op - Request operator status from channel operators
/help - Show this help message`,
          timestamp: new Date(),
          type: 'system'
        }, activeContext);
        return;
      }
      
      // Handle other commands
        addMessageToContext({
          id: generateUniqueMessageId(),
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
        id: generateUniqueMessageId(),
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
      id: generateUniqueMessageId(),
      nickname: 'system',
      content: `${targetNickname} was kicked by ${currentUserNickname}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      type: 'kick'
    }, activeContext);
  };

  const handleBanUser = (targetNickname: string, reason: string) => {
    if (!activeChannel || !canUserPerformAction(activeChannel, currentUserNickname, 'ban')) {
      addMessageToContext({
        id: generateUniqueMessageId(),
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
      id: generateUniqueMessageId(),
      nickname: 'system',
      content: `${targetNickname} was banned by ${currentUserNickname}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(),
      type: 'ban'
    }, activeContext);
  };

  // Handle quoting a message
  const handleQuoteMessage = useCallback((message: Message) => {
    // This will be handled by the ChatWindow component internally
    // The quoted message will be passed to handleSendMessage when the user sends their reply
  }, []);

  const handleSendMessage = async (content: string, quotedMessage?: Message) => {
    notificationDebug.log('handleSendMessage called with content:', content, 'activeContext:', activeContext, 'quotedMessage:', quotedMessage);
    
    if (content.startsWith('/')) {
      handleCommand(content);
      return;
    }
    
    // Check for bot commands
    if (isBotCommand(content)) {
      await handleBotCommandMessage(content);
      return;
    }
    
    // Prevent multiple simultaneous message sends
    if (isLoading) {
      inputDebug.warn('Message send already in progress, ignoring duplicate request');
      return;
    }
    
    // Set loading state only briefly for immediate feedback, then reset
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100); // Reset quickly to allow new messages
    
    // Create user message object for both network and local handling
    const userMessage: Message = {
      id: generateUniqueMessageId(),
      nickname: currentUserNickname,
      content,
      timestamp: new Date(),
      type: activeContext?.type === 'pm' ? 'pm' : 'user',
      quotedMessage: quotedMessage ? {
        id: quotedMessage.id,
        nickname: quotedMessage.nickname,
        content: quotedMessage.content,
        timestamp: quotedMessage.timestamp,
        type: quotedMessage.type
      } : undefined
    };
    
    // If connected to network, send message via network
    if (isNetworkConnected && activeContext?.type === 'channel') {
      const networkService = getNetworkService();
      
      // Show AI reaction notification for network messages
      const channel = channels.find(c => c.name === activeContext.name);
      if (channel) {
        // For network messages, only show notification if there are local virtual users
        // (AI reactions are generated by local virtual users, not network users)
        const localVirtualUsers = migrateUsers(channel.users).filter(u => u.userType === 'virtual');
        notificationDebug.log('Debug - network channel:', channel.name, 'all users:', channel.users.map(u => u.nickname), 'localVirtualUsers:', localVirtualUsers.map(u => u.nickname));
        notificationDebug.log('Debug - user types:', channel.users.map(u => ({ nickname: u.nickname, userType: u.userType, personality: u.personality })));
        
        if (localVirtualUsers.length > 0) {
          // Show notification that AI is generating a reaction
          const randomUser = localVirtualUsers[Math.floor(Math.random() * localVirtualUsers.length)];
          notificationDebug.log('Triggering notification for network message, localVirtualUsers:', localVirtualUsers.length, 'selected:', randomUser.nickname);
          showAiReactionNotification(`${randomUser.nickname} noticed your message, reaction generation started`);
        } else {
          notificationDebug.log('No local virtual users in network channel, skipping notification');
        }
      } else {
        notificationDebug.log('No channel found for network activeContext:', activeContext);
      }
      
      networkService.sendMessage(activeContext.name, content);
      
      // Add user's message to local channel state for immediate UI display
      addMessageToContext(userMessage, activeContext);
      return;
    }
    
    // Add user's message to local state for immediate UI display
    addMessageToContext(userMessage, activeContext);
    
    // Track user message time for burst mode
    lastUserMessageTimeRef.current = Date.now();

    // Process AI response asynchronously without blocking the input
    (async () => {
      try {
        let aiResponse: string | null = null;
        if (activeContext && activeContext.type === 'channel') {
          const channel = channels.find(c => c.name === activeContext.name);
          if (channel) {
            // Check if there are virtual users in the channel (AI reactions are generated by virtual users)
            const virtualUsers = migrateUsers(channel.users).filter(u => u.userType === 'virtual');
            notificationDebug.log('Debug - channel:', channel.name, 'all users:', channel.users.map(u => u.nickname), 'currentUser:', currentUserNickname, 'virtualUsers:', virtualUsers.map(u => u.nickname));
            notificationDebug.log('Debug - user types:', channel.users.map(u => ({ nickname: u.nickname, userType: u.userType, personality: u.personality })));
            
            if (virtualUsers.length > 0) {
              // Show notification that AI is generating a reaction
              const randomUser = virtualUsers[Math.floor(Math.random() * virtualUsers.length)];
              notificationDebug.log('Triggering notification for local message, virtualUsers:', virtualUsers.length, 'selected:', randomUser.nickname);
              showAiReactionNotification(`${randomUser.nickname} noticed your message, reaction generation started`);
              
              aiResponse = await generateReactionToMessage(channel, userMessage, currentUserNickname, aiModel);
            } else {
              notificationDebug.log('No virtual users in channel, skipping notification');
            }
          } else {
            notificationDebug.log('No channel found for activeContext:', activeContext);
          }
        } else if (activeContext && activeContext.type === 'pm') { // 'pm'
          const user = virtualUsers.find(u => u.nickname === activeContext.with);
          if (!user) {
            pmDebug.error(` User ${activeContext.with} not found in virtualUsers, skipping PM response`);
            return;
          }
          const conversation = privateMessages[activeContext.with] || { user, messages: [] };
          aiResponse = await withConcurrencyLimit(
            () => generatePrivateMessageResponse(conversation, userMessage, currentUserNickname, aiModel),
            `private message response from ${activeContext.with}`
          );
        }
        
        if (aiResponse) {
          if (activeContext?.type === 'pm') {
            // For PM responses, parse the response to remove any username prefix
            const aiNickname = activeContext.with;
            const content = parsePMResponse(aiResponse, aiNickname);
            
            if (content) {
              
              // Show typing indicator for AI response
              console.log(`[Typing Debug] PM Response - Setting typing for ${aiNickname}, content length: ${content.length}`);
              console.log(`[Typing Debug] PM Response - Typing delay config:`, typingDelayConfig);
              setTyping(aiNickname, true);
              
              // Ensure minimum delay for typing indicator visibility
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Simulate typing delay for AI response
              simulationDebug.debug(`Simulating typing delay for PM response: "${content}"`);
              if (typingDelayConfig.enabled) {
                await simulateTypingDelay(content.length, typingDelayConfig);
              } else {
                // If typing delay is disabled, still wait a bit to show the indicator
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              // Hide typing indicator
              console.log(`[Typing Debug] PM Response - Removing typing for ${aiNickname}`);
              setTyping(aiNickname, false);
              
              const aiMessage: Message = {
                id: generateUniqueMessageId(),
                nickname: aiNickname,
                content: content,
                timestamp: new Date(),
                type: 'pm'
              };
              addMessageToContext(aiMessage, activeContext);
            }
          } else {
            // For channel responses, parse the traditional "nickname: message" format
            const aiMessages = aiResponse.split('\n').filter(line => line.includes(':'));
            for (let index = 0; index < aiMessages.length; index++) {
              const msgLine = aiMessages[index];
              const [nickname, ...contentParts] = msgLine.split(':');
              const content = contentParts.join(':').trim();
              if (nickname && content && nickname.trim()) {
                // Show typing indicator for AI response
                setTyping(nickname.trim(), true);
                
                // Ensure minimum delay for typing indicator visibility
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Simulate typing delay for each AI response message
                simulationDebug.debug(`Simulating typing delay for AI response: "${content}"`);
                if (typingDelayConfig.enabled) {
                  await simulateTypingDelay(content.length, typingDelayConfig);
                } else {
                  // If typing delay is disabled, still wait a bit to show the indicator
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Hide typing indicator
                setTyping(nickname.trim(), false);
                
                const aiMessage: Message = {
                  id: generateUniqueMessageId(),
                  nickname: nickname.trim(),
                  content: content,
                  timestamp: new Date(),
                  type: 'ai'
                };
                addMessageToContext(aiMessage, activeContext);
              }
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
          } else if (error.message.includes("CORS") || error.message.includes("NetworkError") || error.message.includes("fetch")) {
            content = `Error: Network/CORS error. This may be due to browser security policies. The simulation will continue with fallback responses.`;
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
          id: generateUniqueMessageId(),
          nickname: 'system',
          content,
          timestamp: new Date(),
          type: 'system'
        };
        addMessageToContext(errorMessage, activeContext);
      }
    })(); // Execute the async function immediately
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

      simulationDebug.log('Using aiModel for auto-join:', aiModel);
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
            
            // Ensure minimum delay for typing indicator visibility
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Simulate typing delay for greeting messages
            simulationDebug.debug(`Simulating typing delay for greeting: "${content}"`);
            if (typingDelayConfig.enabled) {
              await simulateTypingDelay(content.length, typingDelayConfig);
            } else {
              // If typing delay is disabled, still wait a bit to show the indicator
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Hide typing indicator
            setTyping(nickname.trim(), false);
            
            const greetingMessage: Message = {
              id: generateUniqueMessageId(),
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
    const updatedUsers = newUsers.filter(newUser => 
      oldUsers.some(oldUser => oldUser.nickname === newUser.nickname) &&
      !oldUsers.some(oldUser => oldUser.nickname === newUser.nickname && JSON.stringify(oldUser) === JSON.stringify(newUser))
    );
    
    // Update virtual users
    setVirtualUsers(newUsers);
    
    // Handle added users - add them to channels dynamically
    if (addedUsers.length > 0) {
      setChannels(prevChannels => {
        const updatedChannels = prevChannels.map(channel => {
          const updatedChannel = { ...channel };
          
          // Add new users to this channel
          addedUsers.forEach((newUser, userIndex) => {
            const isAlreadyInChannel = channel.users.some(u => u.nickname === newUser.nickname);
            if (!isAlreadyInChannel) {
              updatedChannel.users = [...updatedChannel.users, newUser];
            }
          });
          
          // Deduplicate users to prevent React key collisions
          updatedChannel.users = deduplicateChannelUsers(updatedChannel.users);
          
          return updatedChannel;
        });
        
        // Only add join messages for actual user joins, not channel data synchronization
        // Check if this is a real user join (not just channel data sync)
        const isRealUserJoin = addedUsers.length === 1 && 
          addedUsers[0].personality === 'Network User' && 
          !prevChannels.some(channel => 
            channel.users.some(user => user.nickname === addedUsers[0].nickname)
          );
        
        if (isRealUserJoin) {
          // Find which channel the user actually joined
          const joinedChannel = updatedChannels.find(channel => 
            channel.users.some(user => user.nickname === addedUsers[0].nickname) &&
            !prevChannels.find(prevChannel => 
              prevChannel.name === channel.name && 
              prevChannel.users.some(user => user.nickname === addedUsers[0].nickname)
            )
          );
          
          if (joinedChannel) {
              const joinMessage: Message = {
                id: generateUniqueMessageId(),
              nickname: addedUsers[0].nickname,
              content: joinedChannel.name,
                timestamp: new Date(),
                type: 'join'
              };
            joinDebug.log(`Creating join message for ${addedUsers[0].nickname} in ${joinedChannel.name}:`, joinMessage);
            addMessageToContext(joinMessage, { type: 'channel', name: joinedChannel.name });
            }
        }
        
        return updatedChannels;
      });
      
      // Generate greetings for new users in active channel
      if (activeContext?.type === 'channel') {
        const activeChannel = channels.find(c => c.name === activeContext.name);
        if (activeChannel) {
          addedUsers.forEach(async (newUser) => {
            try {
              // Use the existing generateGreetingForNewUser function
              await generateGreetingForNewUser(activeChannel, newUser.nickname);
            } catch (error) {
              console.error("Failed to generate greeting for new user:", error);
            }
          });
        }
      }
    }
    
    // Handle removed users - remove them from channels
    if (removedUsers.length > 0) {
      // Add part messages for removed users in all channels where they were present
      removedUsers.forEach((removedUser) => {
        channels.forEach(channel => {
          const wasInChannel = channel.users.some(u => u.nickname === removedUser.nickname);
          if (wasInChannel) {
            const partMessage: Message = {
              id: generateUniqueMessageId(),
              nickname: removedUser.nickname,
              content: `left ${channel.name}`,
              timestamp: new Date(),
              type: 'part'
            };
            addMessageToContext(partMessage, { type: 'channel', name: channel.name });
          }
        });
      });
      
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          const updatedChannel = { ...channel };
          
          removedUsers.forEach((removedUser, userIndex) => {
            const wasInChannel = channel.users.some(u => u.nickname === removedUser.nickname);
            if (wasInChannel) {
              updatedChannel.users = updatedChannel.users.filter(u => u.nickname !== removedUser.nickname);
            }
          });
          
          return updatedChannel;
        })
      );
    }
    
    // Handle updated users - update them in all channels where they exist
    if (updatedUsers.length > 0) {
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          const updatedChannel = { ...channel };
          
          // Update users in this channel
          updatedChannel.users = updatedChannel.users.map(channelUser => {
            const updatedUser = updatedUsers.find(u => u.nickname === channelUser.nickname);
            return updatedUser || channelUser;
          });
          
          return updatedChannel;
        })
      );
    }
  }, [virtualUsers, activeContext, channels, addMessageToContext, generateGreetingForNewUser, aiModel]);

  // Afterhours Protocol detection
  const isAfterhoursProtocol = useCallback((): boolean => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Afterhours Protocol: Invert weekend activity patterns for nocturnal users
    // Weekends: More active during late night/early morning hours (22:00-06:00)
    // Weekdays: More active during traditional night hours (23:00-05:00)
    if (isWeekend) {
      // Weekend nocturnal pattern: Peak activity 22:00-06:00
      return hour >= 22 || hour < 6;
    } else {
      // Weekday nocturnal pattern: Peak activity 23:00-05:00
      return hour >= 23 || hour < 5;
    }
  }, []);

  // Function to adjust simulation frequency based on time of day and Afterhours Protocol
  const getTimeAdjustedInterval = useCallback((baseInterval: number): number => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const afterhoursActive = isAfterhoursProtocol();
    
    let multiplier = 1.0;
    
    if (afterhoursActive) {
      // Afterhours Protocol: Inverted activity patterns for nocturnal users
      if (hour >= 22 || hour < 6) {
        // Peak afterhours activity: Much more frequent simulation
        multiplier = isWeekend ? 0.4 : 0.5; // Very active during nocturnal peak
      } else if (hour >= 6 && hour < 12) {
        // Afterhours wind-down: Still active but slowing
        multiplier = 0.8;
      } else if (hour >= 12 && hour < 17) {
        // Afterhours quiet: Minimal activity
        multiplier = 2.0;
      } else if (hour >= 17 && hour < 22) {
        // Afterhours awakening: Gradually increasing
        multiplier = 1.2;
      }
    } else {
      // Standard time patterns for non-nocturnal users
      if (hour >= 6 && hour < 12) {
        // Morning: Slightly more active
        multiplier = isWeekend ? 0.9 : 0.8; // Less aggressive than before
      } else if (hour >= 12 && hour < 17) {
        // Afternoon: Normal activity
        multiplier = isWeekend ? 0.95 : 1.0;
      } else if (hour >= 17 && hour < 21) {
        // Evening: Peak social time - but not too aggressive
        multiplier = 0.7; // Less aggressive than before
      } else if (hour >= 21 && hour < 24) {
        // Late evening: Winding down
        multiplier = isWeekend ? 0.9 : 1.3;
      } else {
        // Late night/early morning: Very quiet
        multiplier = 2.5; // Even slower than before
      }
    }
    
    const adjustedInterval = Math.round(baseInterval * multiplier);
    timeDebug.log(` Hour: ${hour}, Weekend: ${isWeekend}, Afterhours: ${afterhoursActive}, Multiplier: ${multiplier.toFixed(2)}, Adjusted interval: ${adjustedInterval}ms`);
    
    return adjustedInterval;
  }, [isAfterhoursProtocol]);

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
      simulationDebug.debug('Settings modal is open, skipping simulation');
      return;
    }
    
    if (channels.length === 0) {
      simulationDebug.debug('No channels available for simulation');
      // Still allow PM generation even without channels
      // (though this is unlikely to happen in normal operation)
    }
    
    // Debug: Log current user nickname and channel users
    simulationDebug.log(`Current user nickname: "${currentUserNickname}"`);
    channels.forEach(channel => {
      simulationDebug.log(`Channel ${channel.name} users:`, channel.users.map(u => u.nickname));
    });
    
    // Auto-join users to channels that only have the current user
    autoJoinUsersToEmptyChannels();
    
    // Check if we should enter burst mode (user recently sent a message)
    const now = Date.now();
    const timeSinceLastUserMessage = now - lastUserMessageTimeRef.current;
    const shouldBurst = timeSinceLastUserMessage < 30000; // 30 seconds
    
    // Add quiet mode logic - occasionally skip simulation cycles entirely
    const quietModeChance = 0.3; // 30% chance to enter quiet mode
    const isQuietMode = Math.random() < quietModeChance;
    
    // In quiet mode, only generate reactions to recent messages, no new messages
    if (isQuietMode && !shouldBurst) {
      simulationDebug.debug('Quiet mode: Only checking for reactions to recent messages');
      
      // Find a random channel and check if there are recent messages to react to
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      if (randomChannel && randomChannel.messages.length > 0) {
        const recentMessages = randomChannel.messages.slice(-3); // Last 3 messages
        const userMessages = recentMessages.filter(msg => 
          msg.nickname !== currentUserNickname && 
          msg.type !== 'system' && 
          msg.type !== 'join' && 
          msg.type !== 'part'
        );
        
        if (userMessages.length > 0 && Math.random() < 0.4) { // 40% chance to react in quiet mode
          const messageToReactTo = userMessages[Math.floor(Math.random() * userMessages.length)];
          simulationDebug.debug(`Quiet mode: Generating reaction to message from ${messageToReactTo.nickname}`);
          
          try {
            const reactionResponse = await generateReactionToMessage(randomChannel, messageToReactTo, currentUserNickname, aiModel);
            if (reactionResponse) {
              const [reactionNickname, ...reactionContentParts] = reactionResponse.split(':');
              const reactionContent = reactionContentParts.join(':').trim();
              
              if (reactionNickname && reactionContent && reactionNickname.trim()) {
                // Show typing indicator
                setTyping(reactionNickname.trim(), true);
                
                // Simulate typing delay
                await simulateTypingDelay(reactionContent.length, typingDelayConfig);
                
                // Hide typing indicator
                setTyping(reactionNickname.trim(), false);
                
                const reactionMessage: Message = {
                  id: generateUniqueMessageId(),
                  nickname: reactionNickname.trim(),
                  content: reactionContent,
                  timestamp: new Date(),
                  type: 'ai'
                };
                simulationDebug.debug(`Quiet mode: Adding reaction from ${reactionNickname.trim()}: "${reactionContent}"`);
                addMessageToContext(reactionMessage, { type: 'channel', name: randomChannel.name });
              }
            }
          } catch (error) {
            simulationDebug.error('Quiet mode reaction generation failed:', error);
          }
        }
      }
      
      // Skip the rest of the simulation in quiet mode
      return;
    }
    
    simulationDebug.debug(`Running simulation - burst mode: ${shouldBurst}, quiet mode: ${isQuietMode}, time since last user message: ${timeSinceLastUserMessage}ms`);
    
    // Prioritize the active channel for more responsive conversation
    let targetChannel: Channel;
    if (activeContext && activeContext.type === 'channel') {
      const activeChannel = channels.find(c => c.name === activeContext.name);
      if (activeChannel) {
        targetChannel = activeChannel;
        simulationDebug.debug(`Using active channel: ${targetChannel.name}`);
      } else {
        const randomChannelIndex = Math.floor(Math.random() * channels.length);
        targetChannel = channels[randomChannelIndex];
        simulationDebug.debug(`Active channel not found, using random channel: ${targetChannel.name}`);
      }
    } else {
      const randomChannelIndex = Math.floor(Math.random() * channels.length);
      targetChannel = channels[randomChannelIndex];
      simulationDebug.debug(`No active context, using random channel: ${targetChannel.name}`);
    }

    // Check if we should reset the conversation for this channel (much less aggressive)
    if (shouldResetConversation(targetChannel.name)) {
      simulationDebug.debug(`Resetting conversation for ${targetChannel.name} to prevent staleness`);
      // Keep the last 100 messages to maintain conversation history while preventing staleness
      const updatedChannels = channels.map(channel => 
        channel.name === targetChannel.name 
          ? { ...channel, messages: channel.messages.slice(-1000) }
          : channel
      );
      setChannels(updatedChannels);
    }

    try {
      simulationDebug.debug(`Generating channel activity for ${targetChannel.name}`);
      simulationDebug.log('Using aiModel for channel activity:', aiModel);
      const response = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
      if (response) {
        const [nickname, ...contentParts] = response.split(':');
        const content = contentParts.join(':').trim();

        simulationDebug.debug(`Parsed response - nickname: "${nickname}", content: "${content}"`);

        if (nickname && content && nickname.trim()) {
          // Check if this is a bot command from a virtual user
          if (isBotCommand(content)) {
            simulationDebug.log(` Virtual user ${nickname.trim()} used bot command: ${content}`);
            
            // First, add the original bot command message from the virtual user
            const aiMessage: Message = {
              id: generateUniqueMessageId(),
              nickname: nickname.trim(),
              content,
              timestamp: new Date(),
              type: 'ai'
            };
            simulationDebug.debug(`Adding AI message from ${nickname.trim()}: "${content}"`);
            addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
            
            // Find the user who sent the command
            const user = targetChannel.users.find(u => u.nickname === nickname.trim());
            if (user) {
              // Process the bot command
              const botResponse = await handleVirtualUserBotCommand(content, user, targetChannel.name);
              if (botResponse) {
                // Add the bot response
                addMessageToContext(botResponse, { type: 'channel', name: targetChannel.name });
                simulationDebug.debug(`Added bot response for ${nickname.trim()}'s command`);
              }
            }
          } else {
            // Regular message - show typing indicator
          setTyping(nickname.trim(), true);
          
          // Ensure minimum delay for typing indicator visibility
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Simulate typing delay before adding the message
          simulationDebug.debug(`Simulating typing delay for message: "${content}"`);
          if (typingDelayConfig.enabled) {
            await simulateTypingDelay(content.length, typingDelayConfig);
          } else {
            // If typing delay is disabled, still wait a bit to show the indicator
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Hide typing indicator
          setTyping(nickname.trim(), false);
          
          const aiMessage: Message = {
              id: generateUniqueMessageId(),
            nickname: nickname.trim(),
            content,
            timestamp: new Date(),
            type: 'ai'
          };
          simulationDebug.debug(`Adding AI message from ${nickname.trim()}: "${content}"`);
          addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
          
          // Sometimes generate a reaction to the AI message for more conversation
          if (Math.random() < 0.2) { // 20% chance to generate a reaction (reduced from 50%)
            simulationDebug.debug(`Generating reaction to AI message from ${nickname.trim()}`);
            setTimeout(async () => {
              try {
                // Create a new message object for the reaction
                const messageForReaction: Message = {
                  id: generateUniqueMessageId(),
                  nickname: nickname.trim(),
                  content,
                  timestamp: new Date(),
                  type: 'ai'
                };
                const reactionResponse = await generateReactionToMessage(targetChannel, messageForReaction, currentUserNickname, aiModel);
                if (reactionResponse) {
                  const [reactionNickname, ...reactionContentParts] = reactionResponse.split(':');
                  const reactionContent = reactionContentParts.join(':').trim();
                  
                  if (reactionNickname && reactionContent && reactionNickname.trim()) {
                    // Show typing indicator
                    setTyping(reactionNickname.trim(), true);
                    
                    // Simulate typing delay
                    await simulateTypingDelay(reactionContent.length, typingDelayConfig);
                    
                    // Hide typing indicator
                    setTyping(reactionNickname.trim(), false);
                    
                    const reactionMessage: Message = {
                      id: generateUniqueMessageId(),
                      nickname: reactionNickname.trim(),
                      content: reactionContent,
                      timestamp: new Date(),
                      type: 'ai'
                    };
                    simulationDebug.debug(`Adding reaction from ${reactionNickname.trim()}: "${reactionContent}"`);
                    addMessageToContext(reactionMessage, { type: 'channel', name: targetChannel.name });
                  }
                }
              } catch (error) {
                console.error('[Simulation Debug] Error generating reaction:', error);
              }
            }, Math.random() * 3000 + 1000); // Random delay between 1-4 seconds
          }
          }
        } else {
          simulationDebug.debug(`Invalid response format: "${response}" - nickname: "${nickname}", content: "${content}"`);
        }
      } else {
        simulationDebug.debug(`No response generated for ${targetChannel.name}`);
      }
      
      // Even in normal mode, sometimes generate additional activity for more diverse conversations
      if (!shouldBurst && Math.random() < 0.1) { // 10% chance for additional activity in normal mode (reduced from 20%)
        simulationDebug.debug(`Normal mode: generating additional activity for ${targetChannel.name}`);
        setTimeout(async () => {
          try {
            simulationDebug.log('Using aiModel for additional activity:', aiModel);
            const additionalResponse = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
            if (additionalResponse) {
              const [nickname, ...contentParts] = additionalResponse.split(':');
              const content = contentParts.join(':').trim();
              
              if (nickname && content && nickname.trim()) {
                // Check if this is a bot command from a virtual user
                if (isBotCommand(content)) {
                  simulationDebug.log(` Virtual user ${nickname.trim()} used bot command in additional activity: ${content}`);
                  
                  // Find the user who sent the command
                  const user = targetChannel.users.find(u => u.nickname === nickname.trim());
                  if (user) {
                    // Process the bot command
                    const botResponse = await handleVirtualUserBotCommand(content, user, targetChannel.name);
                    if (botResponse) {
                      // Add the bot response
                      addMessageToContext(botResponse, { type: 'channel', name: targetChannel.name });
                      simulationDebug.debug(`Added bot response for ${nickname.trim()}'s additional activity command`);
                    }
                  }
                } else {
                  // Regular message - show typing indicator
                  setTyping(nickname.trim(), true);
                  
                  // Ensure minimum delay for typing indicator visibility
                  await new Promise(resolve => setTimeout(resolve, 200));
                  
                  // Simulate typing delay
                  if (typingDelayConfig.enabled) {
                    await simulateTypingDelay(content.length, typingDelayConfig);
                  } else {
                    // If typing delay is disabled, still wait a bit to show the indicator
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  
                  // Hide typing indicator
                  setTyping(nickname.trim(), false);
                  
                  const aiMessage: Message = {
                    id: generateUniqueMessageId(),
                    nickname: nickname.trim(),
                    content,
                    timestamp: new Date(),
                    type: 'ai'
                  };
                  simulationDebug.debug(`Adding additional AI message from ${nickname.trim()}: "${content}"`);
                  addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
                }
              }
            }
          } catch (error) {
            console.error('[Simulation Debug] Error generating additional activity:', error);
          }
        }, Math.random() * 5000 + 2000); // Random delay between 2-7 seconds
      }
      
      // In burst mode, sometimes generate a second message for more activity
      // Reduced probability for less hectic simulation
      if (shouldBurst && Math.random() < 0.3) { // Reduced from 0.6 to 0.3
        simulationDebug.debug(`Burst mode: generating second message for ${targetChannel.name}`);
        setTimeout(async () => {
          try {
            simulationDebug.log('Using aiModel for second response:', aiModel);
            const secondResponse = await generateChannelActivity(targetChannel, currentUserNickname, aiModel);
            if (secondResponse) {
              const [nickname, ...contentParts] = secondResponse.split(':');
              const content = contentParts.join(':').trim();

              simulationDebug.debug(`Burst mode parsed response - nickname: "${nickname}", content: "${content}"`);

              if (nickname && content && nickname.trim()) {
                // Check if this is a bot command from a virtual user
                if (isBotCommand(content)) {
                  simulationDebug.log(` Virtual user ${nickname.trim()} used bot command in burst mode: ${content}`);
                  
                  // Find the user who sent the command
                  const user = targetChannel.users.find(u => u.nickname === nickname.trim());
                  if (user) {
                    // Process the bot command
                    const botResponse = await handleVirtualUserBotCommand(content, user, targetChannel.name);
                    if (botResponse) {
                      // Add the bot response
                      addMessageToContext(botResponse, { type: 'channel', name: targetChannel.name });
                      simulationDebug.debug(`Added bot response for ${nickname.trim()}'s burst mode command`);
                    }
                  }
                } else {
                  // Regular message - show typing indicator for burst message
                  setTyping(nickname.trim(), true);
                  
                  // Ensure minimum delay for typing indicator visibility
                  await new Promise(resolve => setTimeout(resolve, 200));
                  
                  // Simulate typing delay for burst message too
                  simulationDebug.debug(`Simulating typing delay for burst message: "${content}"`);
                  if (typingDelayConfig.enabled) {
                    await simulateTypingDelay(content.length, typingDelayConfig);
                  } else {
                    // If typing delay is disabled, still wait a bit to show the indicator
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  
                  // Hide typing indicator
                  setTyping(nickname.trim(), false);
                  
                  const aiMessage: Message = {
                    id: generateUniqueMessageId(),
                    nickname: nickname.trim(),
                    content,
                    timestamp: new Date(),
                    type: 'ai'
                  };
                  simulationDebug.debug(`Adding burst AI message from ${nickname.trim()}: "${content}"`);
                  addMessageToContext(aiMessage, { type: 'channel', name: targetChannel.name });
                }
              }
            }
          } catch (error) {
            simulationDebug.error(` Burst simulation failed for ${targetChannel.name}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              channel: targetChannel.name
            });
          }
        }, Math.random() * 5000 + 2000); // Increased from 1-4s to 2-7s delay
      }
    } catch (error) {
      simulationDebug.error(` Simulation failed for ${targetChannel.name}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        channel: targetChannel.name,
        burstMode: shouldBurst
      });
      const now = Date.now();
      // Only show error message if the last one was more than 5 minutes ago
      if (now - lastSimErrorTimestampRef.current > 300000) { 
          lastSimErrorTimestampRef.current = now;
          simulationDebug.debug(`Showing error message to user for ${targetChannel.name}`);
          const errorMessage: Message = {
              id: now,
              nickname: 'system',
              content: `Background simulation paused due to API rate limits. Try reducing simulation speed in Settings or wait a few minutes.`,
              timestamp: new Date(),
              type: 'system'
          };
          addMessageToContext(errorMessage, { type: 'channel', name: targetChannel.name });
      } else {
        simulationDebug.debug(`Error rate limited, not showing alert for ${targetChannel.name}`);
      }
      
      // Pause simulation for 30 seconds when API errors occur
      simulationDebug.debug(`Pausing simulation for 30 seconds due to API error`);
      setTimeout(() => {
        simulationDebug.debug(`Resuming simulation after API error pause`);
      }, 30000);
    }

    // Generate autonomous private messages (1-2 messages, no flooding)
    // Enhanced PM generation logic - works from any context
    const activeChannel = channels.find(c => c.name === activeContext?.name);
    
    // Get all virtual users from all channels for PM generation
    const allVirtualUsers = channels.flatMap(channel => 
      migrateUsers(channel.users).filter(u => u.userType === 'virtual')
    );
    const hasUsersWithPMProbability = allVirtualUsers.some(user => (user.pmProbability ?? 25) > 0);
    
    // Check if user is currently in a PM conversation
    const isInPM = activeContext?.type === 'pm';
    const currentPMUser = isInPM ? activeContext.with : null;
    
    let pmChance = 0.05; // Base 5% chance (reduced from 10%)
    
    // Afterhours Protocol: Increase PM activity during nocturnal hours
    const afterhoursActive = isAfterhoursProtocol();
    if (afterhoursActive) {
      pmChance = 0.08; // 8% base chance during afterhours
    }
    
    if (isInPM && currentPMUser) {
      // Higher chance for follow-up PMs when already in PM conversation
      pmChance = afterhoursActive ? 0.4 : 0.3; // 40% during afterhours, 30% normally
      simulationDebug.log(`Higher PM chance (${pmChance * 100}%) for ongoing conversation with ${currentPMUser}`);
    } else if (hasUsersWithPMProbability) {
      // Lower chance for initial PMs
      pmChance = afterhoursActive ? 0.08 : 0.1; // 8% during afterhours, 10% normally
      simulationDebug.log(`Standard PM chance (${pmChance * 100}%) for initial PMs`);
    }
    
    if (hasUsersWithPMProbability && Math.random() < pmChance) {
      simulationDebug.log(`PM generation triggered! Chance: ${pmChance}, isInPM: ${isInPM}, currentPMUser: ${currentPMUser}`);
      try {
        await generateAutonomousPM();
      } catch (error) {
        simulationDebug.error('Failed to generate autonomous PM:', error);
      }
    } else {
      simulationDebug.debug(`PM generation skipped. hasUsersWithPMProbability: ${hasUsersWithPMProbability}, pmChance: ${pmChance}, random: ${Math.random()}`);
    }
  }, [channels, activeContext, addMessageToContext, currentUserNickname, isSettingsOpen, autoJoinUsersToEmptyChannels, generateAutonomousPM]);

  useEffect(() => {
    simulationDebug.debug(`useEffect triggered - simulationSpeed: ${simulationSpeed}, isSettingsOpen: ${isSettingsOpen}`);
    const stopSimulation = () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };

    const startSimulation = () => {
      stopSimulation(); // Ensure no multiple intervals are running
      if (simulationSpeed === 'off' || document.hidden || isSettingsOpen) {
        simulationDebug.debug(`Not starting simulation - speed: ${simulationSpeed}, hidden: ${document.hidden}, settingsOpen: ${isSettingsOpen}`);
        return;
      }
      // Adjust simulation frequency based on time of day
      const baseInterval = SIMULATION_INTERVALS[simulationSpeed];
      const timeAdjustedInterval = getTimeAdjustedInterval(baseInterval);
      
      simulationDebug.debug(`Starting simulation with interval: ${timeAdjustedInterval}ms (${simulationSpeed}, time-adjusted)`);
      simulationIntervalRef.current = window.setInterval(runSimulation, timeAdjustedInterval);
    };
    
    const handleVisibilityChange = () => {
        if (document.hidden) {
            stopSimulation();
        } else {
            startSimulation();
        }
    };

    simulationDebug.debug(`Calling startSimulation from useEffect`);
    startSimulation();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopSimulation();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runSimulation, simulationSpeed, isSettingsOpen]);

  // Safety mechanism to reset loading state on component unmount or errors
  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      console.warn('[Input Protection] Global error detected, resetting loading state');
      setIsLoading(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const activeChannel = useMemo(() => {
    if (activeContext?.type === 'channel') {
      const channel = channels.find(c => c.name === activeContext.name);
      return channel;
    }
    return undefined;
  }, [activeContext, channels]);
  
  const activePM = useMemo(() => 
    activeContext?.type === 'pm' ? privateMessages[activeContext.with] : undefined,
    [activeContext, privateMessages]
  );
  
  const usersInContext: User[] = useMemo(() => {
    if (activeContext?.type === 'channel' && activeChannel) {
      userListDebug.log(`Calculating usersInContext for channel: ${activeChannel.name}`);
      userListDebug.log(`Channel users count: ${activeChannel.users.length}`);
      userListDebug.log(`Channel users:`, activeChannel.users.map(u => u.nickname));
      
      // Debug profile pictures in channel users
      userListDebug.log(`Channel users profile pictures:`, activeChannel.users.map(u => ({
        nickname: u.nickname,
        profilePicture: u.profilePicture,
        hasProfilePicture: !!u.profilePicture
      })));
      
      // Get network users in this channel
      const networkUsersInChannel = networkUsers.filter(networkUser => {
        // Ensure channels is an array before checking
        const channels = Array.isArray(networkUser.channels) ? networkUser.channels : Array.from(networkUser.channels || []);
        return channels.includes(activeChannel.name);
      });
      
      userListDebug.log(`Network users in channel: ${networkUsersInChannel.length}`);
      
      // Convert network users to User objects
      const convertedNetworkUsers: User[] = networkUsersInChannel.map(networkUser => ({
        nickname: networkUser.nickname,
        status: networkUser.status,
        userType: 'network' as const,
        personality: 'Network User',
        languageSkills: {
          languages: [{ language: 'English', fluency: 'native' }]
        },
        writingStyle: {
          formality: 'neutral',
          verbosity: 'neutral',
          humor: 'none',
          emojiUsage: 'low',
          punctuation: 'standard'
        },
        profilePicture: undefined // Network users don't have profile pictures by default
      }));
      
      // Combine channel users with network users
      let allUsers = [...activeChannel.users, ...convertedNetworkUsers];
      
      // If network is connected, exclude the default human user (currentUserNickname) 
      // but only if it's not a network user (to avoid filtering out the actual network user)
      if (isNetworkConnected) {
        allUsers = allUsers.filter(user => {
          // Keep network users even if they have the same nickname
          if (user.personality === 'Network User') {
            return true;
          }
          // Filter out the default human user
          return user.nickname !== currentUserNickname;
        });
      }
      
      // Deduplicate users by nickname to prevent React key collisions
      const uniqueUsers = allUsers.reduce((acc, user) => {
        if (!acc.find(u => u.nickname === user.nickname)) {
          acc.push(user);
        }
        return acc;
      }, [] as User[]);
      
      // Only log if there are issues
      if (allUsers.length !== uniqueUsers.length) {
        userListDebug.warn(` Found duplicate users in channel ${activeChannel.name}. Original: ${allUsers.length}, Deduplicated: ${uniqueUsers.length}`);
      }
      
      return uniqueUsers;
    } else if (activeContext?.type === 'pm') {
      // Find the PM user in virtual users or network users
      let pmUser = virtualUsers.find(u => u.nickname === activeContext.with);
      if (!pmUser) {
        // Try to find in network users
        const networkUser = networkUsers.find(u => u.nickname === activeContext.with);
        if (networkUser) {
          pmUser = {
            nickname: networkUser.nickname,
            status: networkUser.status,
            userType: 'network' as const,
            personality: 'Network User',
            languageSkills: {
              languages: [{ language: 'English', fluency: 'native' }]
            },
            writingStyle: {
              formality: 'neutral',
              verbosity: 'neutral',
              humor: 'none',
              emojiUsage: 'low',
              punctuation: 'standard'
            },
            profilePicture: undefined // Network users don't have profile pictures by default
          };
        }
      }
      
      if (!pmUser) {
        userListDebug.error(` PM user ${activeContext.with} not found in virtual or network users`);
        return [{ nickname: currentUserNickname, status: 'online' }];
      }
      
      return [pmUser, { nickname: currentUserNickname, status: 'online' }];
    }
    return [];
  }, [activeContext, activeChannel, virtualUsers, currentUserNickname, networkUsers, isNetworkConnected]);

  // Filter typing users based on current context
  const typingUsersInContext: string[] = useMemo(() => {
    if (activeContext?.type === 'channel' && activeChannel) {
      // For channels, only show typing users who are in this channel
      const channelUserNicknames = usersInContext.map(user => user.nickname);
      return Array.from(typingUsers).filter(nickname => typeof nickname === 'string' && channelUserNicknames.includes(nickname));
    } else if (activeContext?.type === 'pm' && activeContext.with) {
      // For PMs, only show typing for the PM user
      return Array.from(typingUsers).filter(nickname => typeof nickname === 'string' && nickname === activeContext.with);
    }
    return [];
  }, [typingUsers, activeContext, usersInContext]);

  const messagesInContext = useMemo(() => {
    if (activeContext?.type === 'channel' && activeChannel) {
      return activeChannel.messages;
    } else if (activeContext?.type === 'pm' && activePM) {
      return activePM.messages;
    }
    return [];
  }, [activeContext, activeChannel, activePM]);
  
  const contextTitle = activeContext?.type === 'channel' 
    ? activeChannel?.topic || activeContext.name 
    : activeContext?.type === 'pm'
    ? `Private message with ${activeContext.with}`
    : 'No channel selected';

  const allPMUsers = Object.keys(privateMessages).map(nickname => {
    // First try to find in virtual users
    let user = virtualUsers.find(u => u.nickname === nickname);
    if (user) {
      pmDebug.log('Found virtual user:', nickname);
      return user;
    }
    
    // If not found in virtual users, try to find in network users
    user = networkUsers.find(u => u.nickname === nickname);
    if (user) {
      pmDebug.log('Found network user:', nickname);
      // Convert network user to User format
      return {
        nickname: user.nickname,
        status: user.status,
        userType: 'network' as const,
        personality: 'Network User',
        languageSkills: {
          languages: [{ language: 'English', fluency: 'native' }]
        },
        writingStyle: {
          formality: 'neutral',
          verbosity: 'neutral',
          humor: 'none',
          emojiUsage: 'low',
          punctuation: 'standard'
        }
      };
    }
    
    pmDebug.log('User not found in virtual or network users:', nickname);
    return null;
  }).filter(Boolean);
  
  pmDebug.log('privateMessages keys:', Object.keys(privateMessages));
  pmDebug.log('allPMUsers:', allPMUsers.map(u => u.nickname));

  // Network users update handler
  const handleNetworkUsersUpdate = useCallback((users: NetworkUser[]) => {
    networkDebug.log('handleNetworkUsersUpdate called with users:', users.map(u => ({ nickname: u.nickname, type: u.type, channels: u.channels })));
    setNetworkUsers(users);
    
    // Update network nickname when connected
    if (isNetworkConnected) {
      const networkService = getNetworkService();
      const currentNickname = networkService.getCurrentNickname();
      if (currentNickname && currentNickname !== networkNickname) {
        setNetworkNickname(currentNickname);
      }
    }
  }, [isNetworkConnected, networkNickname]);

  // Clear network users when disconnected
  useEffect(() => {
    if (!isNetworkConnected) {
      setNetworkUsers([]);
      setNetworkNickname(null);
    }
  }, [isNetworkConnected]);

  // Network channel data update handler
  const handleNetworkChannelData = useCallback((channelData: any) => {
    
    // Update the local channel with the received data
    setChannels(prev => prev.map(channel => {
      if (channel.name === channelData.channel) {
        // Convert network users to local users and merge with existing users
        const networkUsers = channelData.users.map((user: any) => ({
          nickname: user.nickname,
          status: 'online' as const,
          personality: 'Network User',
          languageSkills: {
            languages: [{ language: 'English', fluency: 'native' as const, accent: 'neutral' }]
          },
          writingStyle: {
            formality: 'casual' as const,
            verbosity: 'moderate' as const,
            humor: 'none' as const,
            emojiUsage: 'rare' as const,
            punctuation: 'standard' as const
          },
          userType: 'network' as const
        }));
        
        // Separate existing users into virtual/local users and network users
        const existingVirtualUsers = (channel.users || []).filter(user => 
          user.userType === 'virtual' || user.userType === 'local'
        );
        
        // Fix any network users that were incorrectly assigned userType 'virtual'
        const existingNetworkUsers = (channel.users || []).map(user => {
          if (user.personality === 'Network User' && user.userType === 'virtual') {
            return { ...user, userType: 'network' as const };
          }
          return user;
        }).filter(user => user.userType === 'network');
        
        // Combine virtual/local users with the current network users from server
        // This ensures we only show users who are actually connected
        const allUsers = [...existingVirtualUsers, ...networkUsers];
        
        // Remove duplicates by nickname to prevent React key conflicts
        const uniqueUsers = allUsers.reduce((acc, user) => {
          if (!acc.find(u => u.nickname === user.nickname)) {
            acc.push(user);
          }
          return acc;
        }, [] as User[]);
        
        // Merge messages and remove duplicates by ID
        const existingMessages = channel.messages || [];
        const newMessages = channelData.messages || [];
        const allMessages = [...existingMessages];
        
        newMessages.forEach((newMsg: any) => {
          if (!allMessages.find(m => m.id === newMsg.id)) {
            allMessages.push(newMsg);
          }
        });
        
        return {
          ...channel,
          users: uniqueUsers,
          messages: allMessages.slice(-1000),
          topic: channelData.topic || channel.topic
        };
      }
      return channel;
    }));

    // Also update the global networkUsers state for the NetworkUsers component
    const networkUsersFromChannel = channelData.users.map((user: any) => ({
      nickname: user.nickname,
      type: user.type || 'human',
      status: user.status || 'online',
      channels: [channelData.channel] // This user is in this specific channel
    }));

    // Update the global networkUsers state
    setNetworkUsers(prev => {
      // Remove users from this channel first
      const usersNotInChannel = prev.filter(user => !user.channels.includes(channelData.channel));
      
      // Add the new users from this channel
      return [...usersNotInChannel, ...networkUsersFromChannel];
    });
  }, []);

  // Set up network message handler
  // Cross-tab communication setup for virtual user messages
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('station-v-virtual-messages');
      setBroadcastChannel(channel);
      
      channel.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        if (type === 'virtualMessage') {
          const { message, channelName } = data;
          appDebug.log(` Received virtual message ${message.id} from another tab:`, message);
          
          // Check if we've already processed this message
          if (processedVirtualMessageIds.has(message.id)) {
            appDebug.log(` Virtual message ${message.id} already processed, skipping`);
            return;
          }

          // Additional safety check: verify this is actually a virtual user message
          const isVirtualUser = virtualUsers.some(u => u.nickname === message.nickname);
          if (!isVirtualUser) {
            appDebug.log(` Received message from non-virtual user ${message.nickname}, skipping broadcast processing`);
            return;
          }

          // Mark message as processed
          setProcessedVirtualMessageIds(prev => new Set([...prev, message.id]));
          
          // Add the message to the local state
          addMessageToContext(message, { type: 'channel', name: channelName });
        }
      });
      
      return () => {
        channel.close();
      };
    } catch (error) {
      console.warn('[App] BroadcastChannel not supported for virtual messages:', error);
    }
  }, []);

  useEffect(() => {
    const networkService = getNetworkService();
    
    // Set up channel data handler
    networkService.onChannelData(handleNetworkChannelData);
    
    const handleNetworkMessage = (message: any) => {
      // Skip AI messages that were originally generated locally to prevent loops
      // We can identify local AI messages by checking if the nickname matches a virtual user
      if (message.type === 'ai') {
        const isLocalVirtualUser = virtualUsers.some(user => user.nickname === message.nickname);
        if (isLocalVirtualUser) {
          return;
        }
      }
      
      // The message now includes channel directly
      const channelName = message.channel;
      
      // Find the channel this message belongs to using current channels
      const currentChannels = channelsRef.current;
      const channel = currentChannels.find(c => c.name === channelName);
      
      if (channel) {
        // Convert network message to Message format
        const networkMessage: Message = {
          id: message.id,
          nickname: message.nickname,
          content: message.content,
          timestamp: message.timestamp,
          type: message.type === 'ai' ? 'ai' : 'user'
        };
        
        // Add message to channel using current addMessageToContext
        addMessageToContextRef.current(networkMessage, { type: 'channel', name: channelName });
        
        // Only trigger AI reaction to network messages from OTHER users (not the current user)
        // This prevents double AI reactions when the user's own message comes back through the network
        if (channel && networkMessage.nickname !== currentUserNickname) {
          // In network mode, create a channel object with only local virtual users for AI reactions
          // This ensures AI reactions use only the locally configured virtual users, not network users
          const localVirtualUsers = migrateUsers(channel.users).filter(user => user.userType === 'virtual');
          
          if (localVirtualUsers.length > 0) {
            const localChannel = {
              ...channel,
              users: localVirtualUsers
            };
            
            // Show notification that AI is generating a reaction to network message
            const randomUser = localVirtualUsers[Math.floor(Math.random() * localVirtualUsers.length)];
            notificationDebug.log('Triggering notification for network message, localVirtualUsers:', localVirtualUsers.length, 'selected:', randomUser.nickname);
            showAiReactionNotification(`${randomUser.nickname} noticed the message, reaction generation started`);
            
            networkDebug.log(`Generating reaction using ${localVirtualUsers.length} local virtual users:`, localVirtualUsers.map(u => u.nickname));
            
            generateReactionToMessage(localChannel, networkMessage, currentUserNickname, aiModel)
              .then(aiResponse => {
                if (aiResponse && aiResponse.trim()) {
                  const [nickname, ...contentParts] = aiResponse.split(':');
                  const content = contentParts.join(':').trim();
                  
                  if (nickname && content && nickname.trim()) {
                    // Verify the nickname is from a local virtual user
                    const isValidLocalUser = localVirtualUsers.some(user => user.nickname === nickname.trim());
                    
                    if (isValidLocalUser) {
                      const aiMessage: Message = {
                        id: generateUniqueMessageId(),
                        nickname: nickname.trim(),
                        content,
                        timestamp: new Date(),
                        type: 'ai'
                      };
                      
                      // Add message to channel directly without triggering network broadcast
                      // This prevents infinite loops where AI responses get broadcast back to network
                      setChannels(prev => {
                        const updatedChannels = prev.map(c => {
                          if (c.name === channelName) {
                            // Check if message already exists to prevent duplicates
                            const existingMessage = c.messages?.find(m => m.id === aiMessage.id);
                            if (existingMessage) {
                              return c;
                            }
                            return { ...c, messages: [...(c.messages || []), aiMessage].slice(-1000) };
                          }
                          return c;
                        });
                        return updatedChannels;
                      });
                      
                      // Save to chat logs
                      const chatLogService = getChatLogService();
                      chatLogService.saveMessage(channelName, aiMessage).catch(error => {
                        console.error('[Chat Log] Failed to save AI reaction message:', error);
                      });
                      
                      networkDebug.log(`Generated reaction from local virtual user: ${nickname.trim()}`);
                    } else {
                      networkDebug.warn(` AI generated response from non-local user: ${nickname.trim()}, skipping`);
                    }
                  }
                }
              })
              .catch(error => {
                console.error('[App] Error generating AI reaction to network message:', error);
              });
          } else {
            networkDebug.log(`No local virtual users found in channel ${channelName}, skipping AI reaction`);
          }
        }
      }
    };
    
    networkService.onMessage(handleNetworkMessage);
    
    return () => {
      // Remove this specific handler
      networkService.offMessage(handleNetworkMessage);
      networkService.offChannelData(handleNetworkChannelData);
    };
  }, [currentUserNickname, aiModel, handleNetworkChannelData, virtualUsers]);

  // Show loading screen while configuration is being initialized
  if (!isConfigInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'monospace'
      }}>
        <h1>Station V - Virtual IRC Simulator</h1>
        <p>Initializing configuration...</p>
        {configError && (
          <div style={{ 
            color: '#ff6b6b', 
            marginTop: '20px', 
            padding: '10px', 
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            backgroundColor: '#2a1a1a'
          }}>
            {configError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen bg-gray-800 font-mono ${
      isElectronApp ? 'electron-app' : ''
    }`}>
      {/* Electron Title Bar */}
      {isElectronApp && showElectronTitleBar && (
        <div className="electron-title-bar bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:bg-red-400" 
                 onClick={() => window.electronAPI?.closeWindow?.()} 
                 title="Close"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full cursor-pointer hover:bg-yellow-400" 
                 onClick={() => window.electronAPI?.minimizeWindow?.()} 
                 title="Minimize"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:bg-green-400" 
                 onClick={() => window.electronAPI?.maximizeWindow?.()} 
                 title="Maximize"></div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="font-semibold">Station V - Virtual IRC Simulator</span>
            {window.electronAPI?.getVersion && (
              <span className="text-xs text-gray-500">v{window.electronAPI.getVersion()}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setElectronMenuVisible(!electronMenuVisible)}
              className="text-gray-400 hover:text-white p-1"
              title="Menu"
            >
              ☰
            </button>
          </div>
        </div>
      )}

      {/* Electron Menu */}
      {isElectronApp && electronMenuVisible && (
        <div className="electron-menu bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4 text-sm">
          <button
            onClick={() => {
              handleOpenSettings();
              setElectronMenuVisible(false);
            }}
            className="text-gray-300 hover:text-white"
          >
            Settings
          </button>
          <button
            onClick={() => {
              handleOpenChatLogs();
              setElectronMenuVisible(false);
            }}
            className="text-gray-300 hover:text-white"
          >
            Chat Logs
          </button>
          <button
            onClick={() => {
              window.electronAPI?.toggleDevTools?.();
              setElectronMenuVisible(false);
            }}
            className="text-gray-300 hover:text-white"
          >
            Developer Tools
          </button>
          <button
            onClick={() => {
              window.electronAPI?.reload?.();
              setElectronMenuVisible(false);
            }}
            className="text-gray-300 hover:text-white"
          >
            Reload
          </button>
          <button
            onClick={() => {
              window.electronAPI?.setAlwaysOnTop?.(true);
              setElectronMenuVisible(false);
            }}
            className="text-gray-300 hover:text-white"
          >
            Always On Top
          </button>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onSave={handleSaveSettings} 
          onCancel={handleCloseSettings} 
          currentChannels={channels} 
          onChannelsChange={setChannels} 
          currentUsers={virtualUsers}
          onUsersChange={handleUsersChange}
        />
      )}
      {isChatLogOpen && (
        <ChatLogManager 
          isOpen={isChatLogOpen}
          onClose={handleCloseChatLogs}
          currentChannel={activeContext?.type === 'channel' ? activeContext.name : undefined}
        />
      )}
      <ChannelListModal
        isOpen={isChannelListModalOpen}
        onClose={() => setIsChannelListModalOpen(false)}
        channels={channels}
        currentUserNickname={currentUserNickname}
        onJoinChannel={handleJoinChannel}
        onLeaveChannel={handleLeaveChannel}
        onOpenPM={handlePMUserClick}
        privateMessageUsers={allPMUsers}
        unreadChannels={unreadChannels}
        unreadPMUsers={unreadPMUsers}
        activeContext={activeContext}
      />

      {/* Mobile Navigation - Hidden in Electron */}
      {!isElectronApp && (
        <MobileNavigation
          activePanel={mobileActivePanel}
          onPanelChange={setMobileActivePanel}
          isMenuOpen={isMobileMenuOpen}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          unreadChannels={unreadChannels}
          unreadPMUsers={unreadPMUsers}
          isNetworkConnected={isNetworkConnected}
        />
      )}
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout - Sidebar - Always visible in Electron */}
        <div className={`${isElectronApp ? 'flex' : 'hidden lg:flex'} lg:flex-col`}>
          <ChannelList 
            channels={channels}
            privateMessageUsers={allPMUsers}
            activeContext={activeContext}
            onSelectContext={setActiveContext}
            onChannelClick={handleChannelClick}
            onPMClick={handlePMUserClick}
            onOpenSettings={handleOpenSettings}
            onOpenChannelList={() => setIsChannelListModalOpen(true)}
            onJoinChannel={handleJoinChannel}
            onLeaveChannel={handleLeaveChannel}
            unreadChannels={unreadChannels}
            unreadPMUsers={unreadPMUsers}
            onOpenChatLogs={handleOpenChatLogs}
            onResetSpeakers={resetLastSpeakers}
            recentlyAutoOpenedPM={recentlyAutoOpenedPM}
            currentUserNickname={currentUserNickname}
          />
        </div>

        {/* Mobile Layout - Channel List Panel */}
        {mobileActivePanel === 'channels' && (
          <div className="lg:hidden w-full bg-gray-900">
            <ChannelList 
              channels={channels}
              privateMessageUsers={allPMUsers}
              activeContext={activeContext}
              onSelectContext={(context) => {
                setActiveContext(context);
                setMobileActivePanel('chat');
              }}
              onChannelClick={(channelName) => {
                handleChannelClick(channelName);
                setMobileActivePanel('chat');
              }}
              onPMClick={(nickname) => {
                handlePMUserClick(nickname);
                setMobileActivePanel('chat');
              }}
              onOpenSettings={handleOpenSettings}
              onOpenChannelList={() => setIsChannelListModalOpen(true)}
              onJoinChannel={handleJoinChannel}
              onLeaveChannel={handleLeaveChannel}
              unreadChannels={unreadChannels}
              unreadPMUsers={unreadPMUsers}
              onOpenChatLogs={handleOpenChatLogs}
              onResetSpeakers={resetLastSpeakers}
              currentUserNickname={currentUserNickname}
              recentlyAutoOpenedPM={recentlyAutoOpenedPM}
            />
          </div>
        )}

        {/* Mobile Layout - User List Panel */}
        {mobileActivePanel === 'users' && (
          <div className="lg:hidden w-full bg-gray-900">
            <UserList 
              users={usersInContext} 
              onUserClick={(nickname) => {
                handlePMUserClick(nickname);
                setMobileActivePanel('chat');
              }} 
              currentUserNickname={isNetworkConnected && networkNickname ? networkNickname : currentUserNickname}
              channel={activeChannel}
              onToggleOperator={handleToggleOperator}
              unreadPMUsers={unreadPMUsers}
              networkNickname={networkNickname}
              isNetworkConnected={isNetworkConnected}
            />
          </div>
        )}

        {/* Mobile Layout - Network Panel */}
        {mobileActivePanel === 'network' && (
          <div className="lg:hidden w-full bg-gray-900 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Network</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NetworkConnection 
                onConnected={setIsNetworkConnected}
                onUsersUpdate={handleNetworkUsersUpdate}
              />
              <NetworkUsers 
                users={displayedNetworkUsers} 
                currentChannel={activeContext?.type === 'channel' ? activeContext.name : undefined}
              />
            </div>
          </div>
        )}

        {/* Chat Area - Always visible in Electron, conditional on mobile */}
        <main className={`flex flex-1 flex-col border-l border-r border-gray-700 min-h-0 ${
          isElectronApp ? '' : (mobileActivePanel === 'chat' ? '' : 'hidden lg:flex')
        }`}>
            {/* AI Reaction Notification */}
            {aiReactionNotification.isVisible && (
              <div className="bg-blue-900 border border-blue-600 text-blue-100 px-4 py-2 text-sm font-medium animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                  <span>{aiReactionNotification.message}</span>
                </div>
              </div>
            )}
            
            <ChatWindow 
              title={contextTitle}
              messages={messagesInContext}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              currentUserNickname={currentUserNickname}
              typingUsers={typingUsersInContext}
              channel={activeChannel}
              users={usersInContext}
              onClose={handleCloseWindow}
              showCloseButton={true}
              typingIndicatorMode={typingIndicatorConfig.mode}
              isPrivateMessage={activeContext?.type === 'pm'}
              onQuoteMessage={handleQuoteMessage}
            />
          </main>

  {/* Desktop Layout - User List - Always visible in Electron */}
  <div className={`${isElectronApp ? 'block' : 'hidden lg:block'} user-panel-root bg-gray-900 border-l border-gray-700`}>
          <UserList 
            users={usersInContext} 
            onUserClick={handlePMUserClick} 
            currentUserNickname={isNetworkConnected && networkNickname ? networkNickname : currentUserNickname}
            channel={activeChannel}
            onToggleOperator={handleToggleOperator}
            unreadPMUsers={unreadPMUsers}
            networkNickname={networkNickname}
            isNetworkConnected={isNetworkConnected}
          />
        </div>
  {/* Desktop Layout - Network Panel - Always visible in Electron */}
  <div className={`${isElectronApp ? 'block' : 'hidden lg:block'} network-panel-root bg-gray-900 border-l border-gray-700 flex flex-col`}>
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Network</h2>
              <button
                onClick={() => setShowNetworkPanel(!showNetworkPanel)}
                className="text-gray-400 hover:text-white"
              >
                {showNetworkPanel ? '▼' : '▶'}
              </button>
            </div>
          </div>
          
          {showNetworkPanel && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current User Display */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Current User
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Nickname:</span>
                    <span className="text-sm font-medium text-cyan-400">{currentUserNickname}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Status:</span>
                    <span className="text-sm text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Type:</span>
                    <span className="text-sm text-blue-400">
                      {isNetworkConnected ? 'Network User' : 'Local User'}
                    </span>
                  </div>
                  {isNetworkConnected && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Connection:</span>
                      <span className="text-sm text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Connected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <NetworkConnection
                onConnected={setIsNetworkConnected}
                onUsersUpdate={handleNetworkUsersUpdate}
              />
              
              {isNetworkConnected && (
                <NetworkUsers
                  users={displayedNetworkUsers}
                  currentChannel={activeContext?.type === 'channel' ? activeContext.name : undefined}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;