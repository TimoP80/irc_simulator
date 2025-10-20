export interface User {
  nickname: string;
  status: 'online' | 'away';
  personality: string;
  languageSkills: {
    fluency: 'beginner' | 'intermediate' | 'advanced' | 'native';
    languages: string[];
    accent?: string;
  };
  writingStyle: {
    formality: 'casual' | 'formal' | 'mixed';
    verbosity: 'concise' | 'moderate' | 'verbose';
    humor: 'none' | 'light' | 'heavy';
    emojiUsage: 'none' | 'minimal' | 'frequent';
    punctuation: 'minimal' | 'standard' | 'excessive';
  };
}

export type MessageType = 'system' | 'user' | 'ai' | 'pm' | 'action' | 'notice' | 'topic' | 'kick' | 'ban' | 'join' | 'part' | 'quit';

export interface Message {
  id: number;
  nickname: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  command?: string; // For IRC commands like 'me', 'notice', 'topic', etc.
  target?: string; // For commands that target specific users or channels
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
  | { type: 'pm'; with: string }
  | null;

/**
 * Defines the structure for user-configurable settings.
 */
export interface AppConfig {
  currentUserNickname: string;
  // Store users and channels as raw strings for easy editing in a textarea.
  virtualUsers: string; 
  channels: string;
  simulationSpeed: 'fast' | 'normal' | 'slow' | 'off';
  aiModel: 'gemini-2.5-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
}

/**
 * Defines the structure for the AI-generated random world configuration.
 */
export interface RandomWorldConfig {
  users: User[];
  channels: { name: string; topic: string; }[];
}