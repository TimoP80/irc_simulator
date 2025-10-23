import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { getChatLogService, initializeChatLogs } from './services/chatLogService';
import { ChatLogManager } from './components/ChatLogManager';

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

// Save user channel assignments
const saveUserChannelAssignments = (users: User[]) => {
  try {
    const userChannelData = users.map(user => ({
      nickname: user.nickname,
      assignedChannels: user.assignedChannels || []
    }));
    localStorage.setItem('station_v_user_channels', JSON.stringify(userChannelData));
  } catch (error) {
    console.warn('Failed to save user channel assignments:', error);
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
    console.warn('Failed to load user channel assignments:', error);
  }
  return users;
};
import { aiLogger, simulationLogger, configLogger } from './utils/debugLogger';

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
      console.log(`[Migration] Resetting users for channel ${channel.name} (had ${channel.users.length} users)`);
      
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
            languageSkills: { 
              languages: [{
                language: 'English',
                fluency: 'native' as const,
                accent: ''
              }]
            },
            writingStyle: { formality: 'informal' as const, verbosity: 'neutral' as const, humor: 'none' as const, emojiUsage: 'low' as const, punctuation: 'standard' as const }
          },
          ...channelSpecificUsers
        ]
      };
    }
    
    return channel;
  });
};

const App: React.FC = () => {
  // Initialize with saved config or defaults
  const [currentUserNickname, setCurrentUserNickname] = useState<string>(() => {
    const savedConfig = loadConfig();
    return savedConfig?.currentUserNickname || DEFAULT_NICKNAME;
  });
  const [virtualUsers, setVirtualUsers] = useState<User[]>(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      const { virtualUsers: configUsers } = initializeStateFromConfig(savedConfig);
      return loadUserChannelAssignments(configUsers);
    }
    return DEFAULT_VIRTUAL_USERS;
  });
  const [channels, setChannels] = useState<Channel[]>(() => {
    const savedConfig = loadConfig();
    if (savedConfig) {
      const { channels: configChannels } = initializeStateFromConfig(savedConfig);
      return loadOperatorAssignments(migrateChannels(configChannels));
    }
    return DEFAULT_CHANNELS;
  });
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessageConversation>>({});
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [typingDelayConfig, setTypingDelayConfig] = useState(() => {
    const savedConfig = loadConfig();
    return savedConfig?.typingDelay || DEFAULT_TYPING_DELAY;
  });
  
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
  
  // Unique ID generator to prevent React key collisions
  const messageIdCounterRef = useRef<number>(0);
  const generateUniqueMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return Date.now() + messageIdCounterRef.current;
  }, []);

  // Auto-join users to channels that only have the current user
  const autoJoinUsersToEmptyChannels = useCallback(() => {
    const channelsToUpdate: Channel[] = [];
    
    channels.forEach(channel => {
      // Check if channel only has the current user (no virtual users)
      const virtualUsersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
      
      if (virtualUsersInChannel.length === 0) {
        simulationLogger.debug(`Channel ${channel.name} only has current user, auto-joining virtual users`);
        
        // Select 2-4 random virtual users to join this channel
        const availableUsers = virtualUsers.filter(u => 
          !channels.some(c => c.name !== channel.name && c.users.some(cu => cu.nickname === u.nickname))
        );
        
        if (availableUsers.length > 0) {
          const numUsersToJoin = Math.min(Math.floor(Math.random() * 3) + 2, availableUsers.length); // 2-4 users
          const shuffledUsers = [...availableUsers].sort(() => Math.random() - 0.5);
          const usersToJoin = shuffledUsers.slice(0, numUsersToJoin);
          
          const updatedChannel = {
            ...channel,
            users: [...channel.users, ...usersToJoin]
          };
          
          channelsToUpdate.push(updatedChannel);
          
          // Add join messages for the new users
          usersToJoin.forEach(user => {
            const joinMessage: Message = {
              id: generateUniqueMessageId(),
              nickname: user.nickname,
              content: `joined ${channel.name}`,
              timestamp: new Date(),
              type: 'join'
            };
            console.log(`[Auto-Join] Adding join message for ${user.nickname} to channel ${channel.name}`);
            addMessageToContext(joinMessage, { type: 'channel', name: channel.name });
          });
          
          // Update user channel assignments
          const updatedUsers = virtualUsers.map(user => {
            if (usersToJoin.some(u => u.nickname === user.nickname)) {
              return {
                ...user,
                assignedChannels: [...(user.assignedChannels || []), channel.name]
              };
            }
            return user;
          });
          setVirtualUsers(updatedUsers);
          saveUserChannelAssignments(updatedUsers);
          
          simulationLogger.debug(`Auto-joined ${usersToJoin.length} users to ${channel.name}: ${usersToJoin.map(u => u.nickname).join(', ')}`);
        }
      }
    });
    
    if (channelsToUpdate.length > 0) {
      setChannels(prevChannels => 
        prevChannels.map(channel => {
          const updatedChannel = channelsToUpdate.find(c => c.name === channel.name);
          return updatedChannel || channel;
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

  // Load channel logs from localStorage on initial render
  useEffect(() => {
    const savedConfig = loadConfig();
    const savedLogs = loadChannelLogs();
    
    configLogger.debug('useEffect running - savedConfig:', !!savedConfig, 'savedLogs:', savedLogs?.length || 0);
    
    // If no saved config, open settings for the user to configure the app
    if (!savedConfig) {
      setIsSettingsOpen(true);
      return;
    }
    
    // Merge saved logs with current channels
    if (savedLogs && savedLogs.length > 0) {
      configLogger.debug('Saved logs details:', savedLogs.map(c => ({ 
        name: c.name, 
        messageCount: c.messages?.length || 0,
        messages: c.messages?.slice(0, 2) // Show first 2 messages
      })));
      
      // Merge saved messages with current channels
      setChannels(prevChannels => {
        const mergedChannels = prevChannels.map(configuredChannel => {
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
        return mergedChannels;
      });
    } else {
      configLogger.debug('No saved logs, using current channels');
    }
  }, []);

  // Initialize chat log service
  useEffect(() => {
    initializeChatLogs().catch(console.error);
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

  // Save user channel assignments whenever virtual users change
  useEffect(() => {
    if (virtualUsers.length > 0) {
      saveUserChannelAssignments(virtualUsers);
    }
  }, [virtualUsers]);

  const handleSaveSettings = (config: AppConfig) => {
    saveConfig(config);
    
    // Initialize state from the new config
    const { nickname, virtualUsers, channels: newChannels, simulationSpeed, aiModel: savedAiModel, typingDelay } = initializeStateFromConfig(config);
    console.log('[Settings Debug] Saving settings with aiModel:', savedAiModel);
    setCurrentUserNickname(nickname);
    setVirtualUsers(virtualUsers);
    
    // Use the new channels from config, but preserve operator assignments where possible
    const migratedChannels = migrateChannels(newChannels);
    setChannels(migratedChannels);
    
    setSimulationSpeed(simulationSpeed);
    setAiModel(savedAiModel || DEFAULT_AI_MODEL);
    console.log('[Settings Debug] Set aiModel to:', savedAiModel || DEFAULT_AI_MODEL);
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

  const handleOpenChatLogs = () => {
    setIsChatLogOpen(true);
  };

  const handleCloseChatLogs = () => {
    setIsChatLogOpen(false);
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
      console.log(`[YouTube Repetition] Multiple YouTube links detected in recent messages:`, youtubeLinks.map(msg => msg.content.substring(0, 50)));
    }
    
    // Track Rick Astley link repetition specifically
    const rickAstleyLinks = recentMessages.filter(msg => 
      msg.type === 'ai' && 
      msg.content && 
      (msg.content.includes('rick astley') || msg.content.includes('never gonna give you up') || msg.content.includes('dQw4w9WgXcQ'))
    );
    
    if (rickAstleyLinks.length > 0) {
      console.log(`[Rick Astley Spam] Rick Astley links detected in recent messages:`, rickAstleyLinks.map(msg => msg.content.substring(0, 50)));
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
      console.log(`[Outdated YouTube Links] Potentially outdated YouTube links detected:`, potentiallyOutdatedLinks.map(msg => msg.content.substring(0, 50)));
    }
    
    // Track multi-user replies (unrealistic IRC behavior)
    const multiUserReplies = recentMessages.filter(msg => 
      msg.type === 'ai' && 
      msg.content && 
      (msg.content.includes(' and ') && (msg.content.includes(' you ') || msg.content.includes(' both ') || msg.content.includes(' all '))) ||
      (msg.content.match(/\b\w+ and \w+,?\s+you\b/) || msg.content.match(/\b\w+ and \w+,?\s+both\b/))
    );
    
    if (multiUserReplies.length > 0) {
      console.log(`[IRC Realism] Multi-user replies detected (unrealistic IRC behavior):`, multiUserReplies.map(msg => msg.content.substring(0, 50)));
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
        console.warn('[Audio/Video Error Suppressed]:', event.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          event.reason.message.includes('play method is not allowed')) {
        console.warn('[Audio/Video Promise Error Suppressed]:', event.reason.message);
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
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const imageRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?)/gi;
    
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
    
    // Function to fix common Imgur URL issues
    const fixImgurUrl = (url: string): string => {
      // Fix incomplete Imgur URLs that redirect to front page
      if (url.includes('imgur.com/') && !url.includes('i.imgur.com/') && !url.includes('/a/')) {
        // Convert imgur.com/ID to i.imgur.com/ID.jpg for direct images
        const match = url.match(/imgur\.com\/([a-zA-Z0-9]+)(?:\?.*)?$/);
        if (match) {
          return `https://i.imgur.com/${match[1]}.jpg`;
        }
      }
      
      // Fix Imgur URLs that might load the full page
      if (url.includes('imgur.com/') && !url.includes('i.imgur.com/')) {
        // Handle various Imgur URL patterns
        const patterns = [
          /imgur\.com\/([a-zA-Z0-9]+)(?:\?.*)?$/,  // imgur.com/ID
          /imgur\.com\/gallery\/([a-zA-Z0-9]+)(?:\?.*)?$/,  // imgur.com/gallery/ID
          /imgur\.com\/a\/([a-zA-Z0-9]+)(?:\?.*)?$/  // imgur.com/a/ID
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            // For gallery/album URLs, we'll skip them as they're not direct images
            if (url.includes('/gallery/') || url.includes('/a/')) {
              return url; // Keep album URLs as-is, they're not direct images
            }
            // For direct image URLs, convert to i.imgur.com format
            return `https://i.imgur.com/${match[1]}.jpg`;
          }
        }
      }
      
      return url;
    };
    
    // Function to validate if URL is a direct image
    const isDirectImageUrl = (url: string): boolean => {
      // Check if it's a direct image URL (i.imgur.com with file extension)
      if (url.includes('i.imgur.com/') && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
        return true;
      }
      // Check other direct image hosting services (more flexible patterns)
      const directImagePatterns = [
        /gyazo\.com\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i,  // gyazo.com/ID or gyazo.com/ID.jpg
        /prnt\.sc\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i,   // prnt.sc/ID or prnt.sc/ID.jpg
        /imgbb\.com\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i, // imgbb.com/ID or imgbb.com/ID.jpg
        /postimg\.cc\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i, // postimg.cc/ID or postimg.cc/ID.jpg
        /imgbox\.com\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i, // imgbox.com/ID or imgbox.com/ID.jpg
        /imgchest\.com\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i, // imgchest.com/ID or imgchest.com/ID.jpg
        /freeimage\.host\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?(\?.*)?$/i // freeimage.host/ID or freeimage.host/ID.jpg
      ];
      
      return directImagePatterns.some(pattern => pattern.test(url));
    };
    
    const allUrls = content.match(urlRegex) || [];
    const imageUrls = content.match(imageRegex) || [];
    
    // Filter out unsafe URLs, fix Imgur URLs, and only keep direct image URLs
    const safeImageUrls = imageUrls
      .filter(url => {
        const isUnsafe = isUnsafeUrl(url);
        if (isUnsafe) {
          console.log('[URL Filter] Blocked unsafe URL:', url);
        }
        return !isUnsafe;
      })
      .map(url => fixImgurUrl(url))
      .filter(url => {
        const isDirect = isDirectImageUrl(url);
        if (!isDirect) {
          console.log('[URL Filter] Blocked non-direct image URL:', url);
        }
        return isDirect;
      }); // Only keep direct image URLs
    const safeLinkUrls = allUrls
      .filter(url => !imageUrls.includes(url) && !isUnsafeUrl(url))
      .map(url => fixImgurUrl(url));
    
    console.log('[URL Filter] Processed URLs:', {
      allUrls: allUrls.length,
      imageUrls: imageUrls.length,
      safeImageUrls: safeImageUrls.length,
      safeLinkUrls: safeLinkUrls.length
    });
    
    return {
      links: safeLinkUrls,
      images: safeImageUrls
    };
  }, []);

  const addMessageToContext = useCallback((message: Message, context: ActiveContext | null) => {
    if (!context) return;
    
    // Extract links and images from the message content
    const { links, images } = extractLinksAndImages(message.content);
    const processedMessage = {
      ...message,
      links: links.length > 0 ? links : undefined,
      images: images.length > 0 ? images : undefined
    };
    if (context.type === 'channel') {
      console.log(`[addMessageToContext] Adding message to channel ${context.name}:`, processedMessage);
      setChannels(prev => {
        const updatedChannels = prev.map(c =>
          c.name === context.name
            ? { ...c, messages: [...(c.messages || []), processedMessage].slice(-1000) }
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
            messages: [...conversation.messages, processedMessage].slice(-1000),
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

    // Save message to chat logs
    if (context.type === 'channel') {
      const chatLogService = getChatLogService();
      chatLogService.saveMessage(context.name, message).catch(error => {
        console.error('[Chat Log] Failed to save message:', error);
      });
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
              id: generateUniqueMessageId(),
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
              console.error('Failed to generate AI reaction to topic change:', error);
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
                        id: Date.now() + Math.random(),
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
                console.error('Failed to generate AI reaction to action:', error);
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
            languageSkills: { 
              languages: [{
                language: 'English',
                fluency: 'native' as const,
                accent: ''
              }]
            },
            writingStyle: { formality: 'informal' as const, verbosity: 'neutral' as const, humor: 'none' as const, emojiUsage: 'low' as const, punctuation: 'standard' as const }
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

      console.log('[Simulation Debug] Using aiModel for auto-join:', aiModel);
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
    console.log(`[UserList Debug] handleUsersChange called with ${newUsers.length} users:`, newUsers.map(u => u.nickname));
    
    const oldUsers = virtualUsers;
    const addedUsers = newUsers.filter(newUser => 
      !oldUsers.some(oldUser => oldUser.nickname === newUser.nickname)
    );
    const removedUsers = oldUsers.filter(oldUser => 
      !newUsers.some(newUser => newUser.nickname === oldUser.nickname)
    );
    
    console.log(`[UserList Debug] Added users:`, addedUsers.map(u => u.nickname));
    console.log(`[UserList Debug] Removed users:`, removedUsers.map(u => u.nickname));
    
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
          
          return updatedChannel;
        });
        
        // Add join messages for new users in all channels using updated channels
        addedUsers.forEach((newUser) => {
          updatedChannels.forEach(updatedChannel => {
            // Check if user is now in this channel (was added)
            const isNowInChannel = updatedChannel.users.some(u => u.nickname === newUser.nickname);
            // Check if user was in this channel before (using original channel data)
            const wasInChannelBefore = prevChannels.find(c => c.name === updatedChannel.name)?.users.some(u => u.nickname === newUser.nickname) || false;
            
            if (isNowInChannel && !wasInChannelBefore) {
              const joinMessage: Message = {
                id: generateUniqueMessageId(),
                nickname: newUser.nickname,
                content: updatedChannel.name,
                timestamp: new Date(),
                type: 'join'
              };
              console.log(`[Join Debug] Creating join message for ${newUser.nickname} in ${updatedChannel.name}:`, joinMessage);
              console.log(`[Join Debug] Calling addMessageToContext with context:`, { type: 'channel', name: updatedChannel.name });
              addMessageToContext(joinMessage, { type: 'channel', name: updatedChannel.name });
            }
          });
        });
        
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
              console.error('Failed to generate greeting for new user:', error);
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
    
    // Debug: Log current user nickname and channel users
    console.log(`[Simulation Debug] Current user nickname: "${currentUserNickname}"`);
    channels.forEach(channel => {
      console.log(`[Simulation Debug] Channel ${channel.name} users:`, channel.users.map(u => u.nickname));
    });
    
    // Auto-join users to channels that only have the current user
    autoJoinUsersToEmptyChannels();
    
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
          ? { ...channel, messages: channel.messages.slice(-1000) }
          : channel
      );
      setChannels(updatedChannels);
    }

    try {
      simulationLogger.debug(`Generating channel activity for ${targetChannel.name}`);
      console.log('[Simulation Debug] Using aiModel for channel activity:', aiModel);
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
            id: generateUniqueMessageId(),
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
            console.log('[Simulation Debug] Using aiModel for second response:', aiModel);
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
  }, [channels, activeContext, addMessageToContext, currentUserNickname, isSettingsOpen, autoJoinUsersToEmptyChannels]);

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

  const activeChannel = useMemo(() => 
    activeContext?.type === 'channel' ? channels.find(c => c.name === activeContext.name) : undefined,
    [activeContext, channels]
  );
  
  const activePM = useMemo(() => 
    activeContext?.type === 'pm' ? privateMessages[activeContext.with] : undefined,
    [activeContext, privateMessages]
  );
  
  const usersInContext: User[] = useMemo(() => {
    console.log(`[UserList Debug] Calculating usersInContext for activeContext:`, activeContext);
    console.log(`[UserList Debug] activeChannel:`, activeChannel);
    
    if (activeContext?.type === 'channel' && activeChannel) {
      console.log(`[UserList Debug] Channel ${activeChannel.name} has ${activeChannel.users.length} users:`, activeChannel.users.map(u => u.nickname));
      
      // Deduplicate users by nickname to prevent React key collisions
      const uniqueUsers = activeChannel.users.reduce((acc, user) => {
        if (!acc.find(u => u.nickname === user.nickname)) {
          acc.push(user);
        }
        return acc;
      }, [] as User[]);
      
      // Debug logging to help identify duplicate issues
      if (activeChannel.users.length !== uniqueUsers.length) {
        console.warn(`[UserList] Found duplicate users in channel ${activeChannel.name}. Original: ${activeChannel.users.length}, Deduplicated: ${uniqueUsers.length}`);
        console.warn('[UserList] Duplicate users:', activeChannel.users.map(u => u.nickname));
      }
      
      console.log(`[UserList Debug] Returning ${uniqueUsers.length} unique users:`, uniqueUsers.map(u => u.nickname));
      return uniqueUsers;
    } else if (activeContext?.type === 'pm') {
      return [virtualUsers.find(u => u.nickname === activeContext.with)!, { nickname: currentUserNickname, status: 'online' }];
    }
    console.log(`[UserList Debug] No active context or channel, returning empty array`);
    return [];
  }, [activeContext, activeChannel, virtualUsers, currentUserNickname]);

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

  const allPMUsers = Object.keys(privateMessages).map(nickname => virtualUsers.find(u => u.nickname === nickname)!);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-gray-800 font-mono">
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
      {isChatLogOpen && (
        <ChatLogManager 
          isOpen={isChatLogOpen}
          onClose={handleCloseChatLogs}
          currentChannel={activeContext?.type === 'channel' ? activeContext.name : undefined}
        />
      )}
      <ChannelList 
        channels={channels}
        privateMessageUsers={allPMUsers}
        activeContext={activeContext}
        onSelectContext={setActiveContext}
        onOpenSettings={handleOpenSettings}
        onOpenChatLogs={handleOpenChatLogs}
      />
      <main className="flex flex-1 flex-col border-l border-r border-gray-700 min-h-0 lg:min-h-0">
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