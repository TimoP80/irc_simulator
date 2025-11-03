import { Channel, Message, User, ActiveContext, PrivateMessageConversation, AppConfig } from '../types';
import { NetworkUser } from '../services/networkService';

export type { ChatState };
interface ChatState {
  currentUserNickname: string;
  virtualUsers: User[];
  channels: Channel[];
  privateMessages: Record<string, PrivateMessageConversation>;
  unreadPMUsers: Set<string>;
  unreadChannels: Set<string>;
  activeContext: ActiveContext | null;
  simulationSpeed: AppConfig['simulationSpeed'];
  aiModel: AppConfig['aiModel'];
  isLoading: boolean;
  isSettingsOpen: boolean;
  isChatLogOpen: boolean;
  isChannelListModalOpen: boolean;
  isDebugLogOpen: boolean;
  isAudioAnalysisOpen: boolean;
  isVisionAnalysisOpen: boolean;
  isBatchUserModalOpen: boolean;
  isDocumentationOpen: boolean;
  mobileActivePanel: 'chat' | 'channels' | 'users' | 'network';
  isMobileMenuOpen: boolean;
  isElectronApp: boolean;
  electronWindowState: 'maximized' | 'normal' | 'minimized';
  showElectronTitleBar: boolean;
  electronMenuVisible: boolean;
  typingUsers: Set<string>;
  networkUsers: NetworkUser[];
  isNetworkConnected: boolean;
  showNetworkPanel: boolean;
  networkNickname: string | null;
  theme: AppConfig['theme'];
}

export type { ChatAction };
type ChatAction =
  | { type: 'SET_CURRENT_USER_NICKNAME'; payload: string }
  | { type: 'SET_VIRTUAL_USERS'; payload: User[] }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'ADD_CHANNEL'; payload: Channel }
  | { type: 'UPDATE_CHANNEL'; payload: Partial<Channel> & { name: string } }
  | { type: 'REMOVE_CHANNEL'; payload: string }
  | { type: 'JOIN_CHANNEL_FAILED'; payload: { channelName: string; error: string } }
  | { type: 'ADD_MESSAGE_TO_CHANNEL'; payload: { channelName: string; message: Message } }
  | { type: 'ADD_MESSAGE_TO_PM'; payload: { nickname: string; message: Message } }
  | { type: 'UPDATE_MESSAGE_IN_CHANNEL'; payload: { channelName: string; message: Message } }
  | { type: 'UPDATE_MESSAGE_IN_PM'; payload: { nickname: string; message: Message } }
  | { type: 'CLEAR_MESSAGES'; payload: { context: ActiveContext } }
  | { type: 'SET_UNREAD_PM'; payload: { nickname: string; hasUnread: boolean } }
  | { type: 'SET_ACTIVE_CONTEXT'; payload: ActiveContext | null }
  | { type: 'SET_SIMULATION_SPEED'; payload: AppConfig['simulationSpeed'] }
  | { type: 'SET_AI_MODEL'; payload: AppConfig['aiModel'] }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SETTINGS_MODAL'; payload: boolean }
  | { type: 'TOGGLE_DOCUMENTATION_MODAL'; payload: boolean }
  | { type: 'CREATE_PM_CONVERSATION'; payload: { nickname: string; user: User } }
  | { type: 'SET_PM_MESSAGES'; payload: { nickname: string; messages: Message[] } }
  | { type: 'CLEAR_UNREAD_PM'; payload: string }
  | { type: 'ADD_UNREAD_PM_USER'; payload: string }
  | { type: 'CLEAR_UNREAD_CHANNEL'; payload: string }
  | { type: 'ADD_UNREAD_CHANNEL'; payload: string }
  | { type: 'RESET_RECENT_SPEAKERS' }
  | { type: 'UPDATE_CURRENT_USER_NICKNAME_IN_CHANNELS'; payload: string }
  | { type: 'SET_IS_ELECTRON_APP'; payload: boolean }
  | { type: 'SET_ELECTRON_WINDOW_STATE'; payload: 'maximized' | 'normal' | 'minimized' }
  | { type: 'TOGGLE_DEBUG_LOG'; payload?: boolean }
  | { type: 'SET_MOBILE_ACTIVE_PANEL'; payload: 'chat' | 'channels' | 'users' | 'network' }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'SET_SHOW_ELECTRON_TITLE_BAR'; payload: boolean }
  | { type: 'SET_ELECTRON_MENU_VISIBLE'; payload: boolean }
  | { type: 'SET_TYPING_USER'; payload: { nickname: string; isTyping: boolean } }
  | { type: 'SET_PRIVATE_MESSAGES'; payload: Record<string, PrivateMessageConversation> }
  | { type: 'SET_UNREAD_PM_USERS'; payload: Set<string> }
  | { type: 'SET_UNREAD_CHANNELS'; payload: Set<string> }
  | { type: 'TOGGLE_BATCH_USER_MODAL'; payload: boolean }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'TOGGLE_CHAT_LOG'; payload: boolean }
  | { type: 'ADD_CHANNEL_OPERATOR'; payload: { channelName: string; nickname: string } }
  | { type: 'REMOVE_CHANNEL_OPERATOR'; payload: { channelName: string; nickname: string } }
  | { type: 'ADD_USER_TO_CHANNEL'; payload: { channelName: string; user: User } }
  | { type: 'ADD_USERS_TO_CHANNEL'; payload: { channelName: string; users: User[] } }
  | { type: 'REMOVE_USER_FROM_CHANNEL'; payload: { channelName: string; nickname: string } }
  | { type: 'SET_CHANNEL_TOPIC'; payload: { channelName: string; topic: string } }
  | { type: 'UPDATE_NICKNAME_IN_CHANNELS'; payload: { oldNickname: string; newNickname: string } }
  | { type: 'ADD_USERS_TO_CHANNELS'; payload: { addedUsers: User[] } }
  | { type: 'REMOVE_USERS_FROM_CHANNELS'; payload: User[] }
  | { type: 'UPDATE_USERS_IN_CHANNELS'; payload: { updatedUsers: User[]; oldUsers: User[] } }
  | { type: 'SET_NETWORK_USERS'; payload: NetworkUser[] }
  | { type: 'SET_NETWORK_NICKNAME'; payload: string | null }
  | { type: 'UPDATE_CHANNEL_DATA'; payload: any }
  | { type: 'TOGGLE_AUDIO_ANALYSIS'; payload: boolean }
  | { type: 'TOGGLE_VISION_ANALYSIS'; payload: boolean }
  | { type: 'TOGGLE_CHANNEL_LIST_MODAL'; payload: boolean }
  | { type: 'TOGGLE_SHOW_NETWORK_PANEL' }
  | { type: 'CLEAR_CHANNEL_MESSAGES'; payload: string }
  | { type: 'CLEAR_PM_MESSAGES'; payload: string };

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CURRENT_USER_NICKNAME':
      return { ...state, currentUserNickname: action.payload };
    case 'SET_VIRTUAL_USERS':
      return { ...state, virtualUsers: action.payload };
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload };
    case 'ADD_CHANNEL':
      if (state.channels.some(channel => channel.name === action.payload.name)) {
        return state;
      }
      return { ...state, channels: [...state.channels, action.payload] };
    case 'UPDATE_CHANNEL':
      return {
        ...state,
        channels: state.channels.map(channel =>
          channel.name === action.payload.name
            ? { ...channel, ...action.payload }
            : channel
        ),
      };
    case 'REMOVE_CHANNEL':
      return {
        ...state,
        channels: state.channels.filter(channel => channel.name !== action.payload),
      };
    case 'JOIN_CHANNEL_FAILED':
      return {
        ...state,
        channels: state.channels.map(channel =>
          channel.name === action.payload.channelName
            ? { ...channel, joinError: action.payload.error }
            : channel
        ),
      };
    case 'ADD_MESSAGE_TO_CHANNEL':
      console.log(`[chatReducer] ADD_MESSAGE_TO_CHANNEL:`, action.payload);
      return {
        ...state,
        channels: state.channels.map(channel =>
          channel.name === action.payload.channelName
            ? { ...channel, messages: [...channel.messages, action.payload.message] }
            : channel
        ),
      };
    case 'ADD_MESSAGE_TO_PM': {
      const { nickname, message } = action.payload;
      const conversation = state.privateMessages[nickname] || {
        user:
          state.virtualUsers.find(u => u.nickname === nickname) ||
          ((): User => {
            const networkUser = state.networkUsers.find(u => u.nickname === nickname);
            if (networkUser) {
              return {
                ...networkUser,
                userType: 'network',
                personality: '',
                languageSkills: { fluency: 'native', languages: ['English'] },
                writingStyle: {
                  formality: 'casual',
                  verbosity: 'moderate',
                  humor: 'none',
                  emojiUsage: 'none',
                  punctuation: 'standard',
                },
              };
            }
            return {
              nickname,
              status: 'online',
              userType: 'network',
              personality: '',
              languageSkills: { fluency: 'native', languages: ['English'] },
              writingStyle: {
                formality: 'casual',
                verbosity: 'moderate',
                humor: 'none',
                emojiUsage: 'none',
                punctuation: 'standard',
              },
            };
          })(),
        messages: [],
      };
      return {
        ...state,
        privateMessages: {
          ...state.privateMessages,
          [nickname]: {
            ...conversation,
            messages: [...conversation.messages, message],
          },
        },
      };
    }
    case 'UPDATE_MESSAGE_IN_CHANNEL': {
      return {
        ...state,
        channels: state.channels.map(c =>
          c.name === action.payload.channelName
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === action.payload.message.id ? action.payload.message : m
                ),
              }
            : c
        ),
      };
    }
    case 'UPDATE_MESSAGE_IN_PM': {
      const { nickname, message } = action.payload;
      const conversation = state.privateMessages[nickname];
      if (conversation) {
        return {
          ...state,
          privateMessages: {
            ...state.privateMessages,
            [nickname]: {
              ...conversation,
              messages: conversation.messages.map(m =>
                m.id === message.id ? message : m
              ),
            },
          },
        };
      }
      return state;
    }
    case 'CLEAR_MESSAGES': {
      const { context } = action.payload;
      if (!context) return state;

      if (context.type === 'channel') {
        return {
          ...state,
          channels: state.channels.map(channel =>
            channel.name === context.name ? { ...channel, messages: [] } : channel
          ),
        };
      } else if (context.type === 'pm') {
        const newPrivateMessages = { ...state.privateMessages };
        if (newPrivateMessages[context.with]) {
          newPrivateMessages[context.with].messages = [];
        }
        return { ...state, privateMessages: newPrivateMessages };
      }
      return state;
    }
    case 'SET_UNREAD_PM': {
      const newUnreadPMUsers = new Set(state.unreadPMUsers);
      if (action.payload.hasUnread) {
        newUnreadPMUsers.add(action.payload.nickname);
      } else {
        newUnreadPMUsers.delete(action.payload.nickname);
      }
      return { ...state, unreadPMUsers: newUnreadPMUsers };
    }
    case 'SET_ACTIVE_CONTEXT':
      return { ...state, activeContext: action.payload };
    case 'SET_SIMULATION_SPEED':
      return { ...state, simulationSpeed: action.payload };
    case 'SET_AI_MODEL':
      return { ...state, aiModel: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_SETTINGS_MODAL':
      return { ...state, isSettingsOpen: action.payload };
    case 'TOGGLE_DOCUMENTATION_MODAL':
      return { ...state, isDocumentationOpen: action.payload };
    case 'CREATE_PM_CONVERSATION':
      if (state.privateMessages[action.payload.nickname]) {
        return state;
      }
      return {
        ...state,
        privateMessages: {
          ...state.privateMessages,
          [action.payload.nickname]: {
            user: action.payload.user,
            messages: [],
          },
        },
      };
    case 'SET_PM_MESSAGES':
      return {
        ...state,
        privateMessages: {
          ...state.privateMessages,
          [action.payload.nickname]: {
            ...state.privateMessages[action.payload.nickname],
            messages: action.payload.messages,
          },
        },
      };
    case 'CLEAR_UNREAD_PM': {
      const newUnreadPMUsers = new Set(state.unreadPMUsers);
      newUnreadPMUsers.delete(action.payload);
      return { ...state, unreadPMUsers: newUnreadPMUsers };
    }
    case 'ADD_UNREAD_PM_USER': {
        const newUnreadPMUsers = new Set(state.unreadPMUsers);
        newUnreadPMUsers.add(action.payload);
        return { ...state, unreadPMUsers: newUnreadPMUsers };
    }
    case 'CLEAR_UNREAD_CHANNEL': {
        const newUnreadChannels = new Set(state.unreadChannels);
        newUnreadChannels.delete(action.payload);
        return { ...state, unreadChannels: newUnreadChannels };
    }
    case 'ADD_UNREAD_CHANNEL': {
        const newUnreadChannels = new Set(state.unreadChannels);
        newUnreadChannels.add(action.payload);
        return { ...state, unreadChannels: newUnreadChannels };
    }
    case 'RESET_RECENT_SPEAKERS':
        return state;
    case 'UPDATE_CURRENT_USER_NICKNAME_IN_CHANNELS':
        return {
            ...state,
            channels: state.channels.map(channel => ({
                ...channel,
                users: channel.users.map(u => u.nickname === state.currentUserNickname ? { ...u, nickname: action.payload } : u)
            }))
        };
    case 'SET_IS_ELECTRON_APP':
        return { ...state, isElectronApp: action.payload };
    case 'SET_ELECTRON_WINDOW_STATE':
        return { ...state, electronWindowState: action.payload };
    case 'TOGGLE_DEBUG_LOG':
        return { ...state, isDebugLogOpen: action.payload ?? !state.isDebugLogOpen };
    case 'SET_MOBILE_ACTIVE_PANEL':
        return { ...state, mobileActivePanel: action.payload };
    case 'TOGGLE_MOBILE_MENU':
        return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'SET_SHOW_ELECTRON_TITLE_BAR':
        return { ...state, showElectronTitleBar: action.payload };
    case 'SET_ELECTRON_MENU_VISIBLE':
        return { ...state, electronMenuVisible: action.payload };
    case 'SET_TYPING_USER': {
        const newTypingUsers = new Set(state.typingUsers);
        if (action.payload.isTyping) {
            newTypingUsers.add(action.payload.nickname);
        } else {
            newTypingUsers.delete(action.payload.nickname);
        }
        return { ...state, typingUsers: newTypingUsers };
    }
    case 'SET_PRIVATE_MESSAGES':
        return { ...state, privateMessages: action.payload };
    case 'SET_UNREAD_PM_USERS':
        return { ...state, unreadPMUsers: action.payload };
    case 'SET_UNREAD_CHANNELS':
        return { ...state, unreadChannels: action.payload };
    case 'TOGGLE_BATCH_USER_MODAL':
        return { ...state, isBatchUserModalOpen: action.payload };
    case 'SET_THEME':
        return { ...state, theme: action.payload as 'dark' | 'light' };
    case 'TOGGLE_CHAT_LOG':
        return { ...state, isChatLogOpen: action.payload };
    case 'ADD_CHANNEL_OPERATOR':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channelName ? { ...c, operators: [...c.operators, action.payload.nickname] } : c)
        };
    case 'REMOVE_CHANNEL_OPERATOR':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channelName ? { ...c, operators: c.operators.filter(op => op !== action.payload.nickname) } : c)
        };
    case 'ADD_USER_TO_CHANNEL':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channelName ? { ...c, users: [...c.users, action.payload.user] } : c)
        };
    case 'ADD_USERS_TO_CHANNEL':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channelName ? { ...c, users: [...c.users, ...action.payload.users] } : c)
        };
    case 'REMOVE_USER_FROM_CHANNEL':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channelName ? { ...c, users: c.users.filter(u => u.nickname !== action.payload.nickname) } : c)
        };
    case 'SET_CHANNEL_TOPIC':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channelName ? { ...c, topic: action.payload.topic } : c)
        };
    case 'UPDATE_NICKNAME_IN_CHANNELS':
        return {
            ...state,
            channels: state.channels.map(channel => ({
                ...channel,
                users: channel.users.map(u => u.nickname === action.payload.oldNickname ? { ...u, nickname: action.payload.newNickname } : u)
            }))
        };
    case 'ADD_USERS_TO_CHANNELS':
        return {
            ...state,
            channels: state.channels.map(channel => ({
                ...channel,
                users: [...channel.users, ...action.payload.addedUsers.filter(newUser => !channel.users.some(existingUser => existingUser.nickname === newUser.nickname))]
            }))
        };
    case 'REMOVE_USERS_FROM_CHANNELS':
        return {
            ...state,
            channels: state.channels.map(channel => ({
                ...channel,
                users: channel.users.filter(user => !action.payload.some(removedUser => removedUser.nickname === user.nickname))
            }))
        };
    case 'UPDATE_USERS_IN_CHANNELS':
        return {
            ...state,
            channels: state.channels.map(channel => ({
                ...channel,
                users: channel.users.map(user => action.payload.updatedUsers.find(updated => updated.nickname === user.nickname) || user)
            }))
        };
    case 'SET_NETWORK_USERS':
        return { ...state, networkUsers: action.payload };
    case 'SET_NETWORK_NICKNAME':
        return { ...state, networkNickname: action.payload };
    case 'UPDATE_CHANNEL_DATA':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload.channel ? { ...c, ...action.payload } : c)
        };
    case 'TOGGLE_AUDIO_ANALYSIS':
        return { ...state, isAudioAnalysisOpen: action.payload };
    case 'TOGGLE_VISION_ANALYSIS':
        return { ...state, isVisionAnalysisOpen: action.payload };
    case 'TOGGLE_CHANNEL_LIST_MODAL':
        return { ...state, isChannelListModalOpen: action.payload };
    case 'TOGGLE_SHOW_NETWORK_PANEL':
        return { ...state, showNetworkPanel: !state.showNetworkPanel };
    case 'CLEAR_CHANNEL_MESSAGES':
        return {
            ...state,
            channels: state.channels.map(c => c.name === action.payload ? { ...c, messages: [] } : c)
        };
    case 'CLEAR_PM_MESSAGES': {
        const newPrivateMessages = { ...state.privateMessages };
        if (newPrivateMessages[action.payload]) {
            newPrivateMessages[action.payload].messages = [];
        }
        return { ...state, privateMessages: newPrivateMessages };
    }
    default:
      return state;
  }
};