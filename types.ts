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
    formality: 'very_informal' | 'informal' | 'neutral' | 'formal' | 'very_formal';
    verbosity: 'very_terse' | 'terse' | 'neutral' | 'verbose' | 'very_verbose';
    humor: 'none' | 'dry' | 'sarcastic' | 'witty' | 'slapstick';
    emojiUsage: 'none' | 'low' | 'medium' | 'high' | 'excessive';
    punctuation: 'minimal' | 'standard' | 'creative' | 'excessive';
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
  aiModel: string; // Now supports any model ID from the API
  typingDelay: {
    enabled: boolean;
    baseDelay: number; // Base delay in milliseconds
    maxDelay: number; // Maximum delay in milliseconds
  };
}

export interface GeminiModel {
  name: string;
  baseModelId: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  thinking: boolean;
  temperature: number;
  maxTemperature: number;
  topP: number;
  topK: number;
}

export interface ModelsListResponse {
  models: GeminiModel[];
  nextPageToken?: string;
}

/**
 * Defines the structure for the AI-generated random world configuration.
 */
export interface RandomWorldConfig {
  users: User[];
  channels: { name: string; topic: string; }[];
}