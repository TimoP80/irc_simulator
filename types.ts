
export interface User {
  nickname: string;
  status: 'online' | 'away';
  personality?: string;
}

export type MessageType = 'system' | 'user' | 'ai' | 'pm';

export interface Message {
  id: number;
  nickname: string;
  content: string;
  timestamp: Date;
  type: MessageType;
}

export interface Channel {
  name: string;
  topic: string;
  users: User[];
  messages: Message[];
}

export interface PrivateMessageConversation {
    user: User;
    messages: Message[];
}

export type ActiveContext = 
  | { type: 'channel'; name: string }
  | { type: 'pm'; with: string };

/**
 * Defines the structure for user-configurable settings.
 */
export interface AppConfig {
  currentUserNickname: string;
  // Store users and channels as raw strings for easy editing in a textarea.
  virtualUsers: string; 
  channels: string;
  simulationSpeed: 'fast' | 'normal' | 'slow' | 'off';
}
