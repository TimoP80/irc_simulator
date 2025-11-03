import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { chatReducer, ChatState } from './chatReducer';
import { getNetworkService } from '../services/networkService';
import { DEFAULT_CHANNELS, DEFAULT_VIRTUAL_USERS, DEFAULT_NICKNAME, DEFAULT_AI_MODEL } from '../constants';

const initialState: ChatState = {
  currentUserNickname: DEFAULT_NICKNAME,
  virtualUsers: DEFAULT_VIRTUAL_USERS,
  channels: DEFAULT_CHANNELS,
  privateMessages: {},
  unreadPMUsers: new Set(),
  unreadChannels: new Set(),
  activeContext: null,
  simulationSpeed: 'normal',
  aiModel: DEFAULT_AI_MODEL,
  isLoading: false,
  isSettingsOpen: false,
  isChatLogOpen: false,
  isChannelListModalOpen: false,
  isDebugLogOpen: false,
  isAudioAnalysisOpen: false,
  isVisionAnalysisOpen: false,
  isBatchUserModalOpen: false,
  isDocumentationOpen: false,
  mobileActivePanel: 'chat',
  isMobileMenuOpen: false,
  isElectronApp: false,
  electronWindowState: 'normal',
  showElectronTitleBar: true,
  electronMenuVisible: false,
  typingUsers: new Set(),
  networkUsers: [],
  isNetworkConnected: false,
  showNetworkPanel: false,
  networkNickname: null,
  theme: 'dark',
};

const ChatStateContext = createContext<ChatState | undefined>(undefined);
const ChatDispatchContext = createContext<React.Dispatch<any> | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  useEffect(() => {
    const networkService = getNetworkService();
    const handleChannelJoined = (channel: any) => {
      dispatch({ type: 'ADD_CHANNEL', payload: channel });
    };

    const handleChannelJoinFailed = (error: any) => {
      dispatch({ type: 'JOIN_CHANNEL_FAILED', payload: error });
    };

    networkService.onChannelJoined(handleChannelJoined);
    networkService.onChannelJoinFailed(handleChannelJoinFailed);

    return () => {
      networkService.offChannelJoined(handleChannelJoined);
      networkService.offChannelJoinFailed(handleChannelJoinFailed);
    };
  }, [dispatch]);

  return (
    <ChatStateContext.Provider value={state}>
      <ChatDispatchContext.Provider value={dispatch}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatStateContext.Provider>
  );
};

export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error('useChatState must be used within a ChatProvider');
  }
  return context;
};

export const useChatDispatch = () => {
  const context = useContext(ChatDispatchContext);
  if (context === undefined) {
    throw new Error('useChatDispatch must be used within a ChatProvider');
  }
  return context;
};