export interface User {
  nickname: string;
  status: 'online' | 'away';
  personality: string;
  languageSkills: {
    fluency: 'beginner' | 'intermediate' | 'advanced' | 'native';
    languages: string[];
    accent?: string;
  } | {
    // Per-language fluency format (World Editor compatible)
    languages: Array<{
      language: string;
      fluency: 'beginner' | 'intermediate' | 'advanced' | 'native';
      accent?: string;
    }>;
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
  operators: string[]; // Array of user nicknames who are channel operators
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

// Type guards for language skills
export const isPerLanguageFormat = (languageSkills: User['languageSkills']): languageSkills is { languages: Array<{ language: string; fluency: 'beginner' | 'intermediate' | 'advanced' | 'native'; accent?: string; }> } => {
  return 'languages' in languageSkills && Array.isArray(languageSkills.languages) && languageSkills.languages.length > 0 && 'language' in languageSkills.languages[0];
};

export const isLegacyFormat = (languageSkills: User['languageSkills']): languageSkills is { fluency: 'beginner' | 'intermediate' | 'advanced' | 'native'; languages: string[]; accent?: string; } => {
  return 'fluency' in languageSkills && 'languages' in languageSkills && Array.isArray(languageSkills.languages);
};

// Utility functions for working with language skills
export const getLanguageFluency = (languageSkills: User['languageSkills'], language: string = 'English'): 'beginner' | 'intermediate' | 'advanced' | 'native' => {
  if (isPerLanguageFormat(languageSkills)) {
    const lang = languageSkills.languages.find(l => l.language.toLowerCase() === language.toLowerCase());
    return lang?.fluency || 'native';
  } else if (isLegacyFormat(languageSkills)) {
    return languageSkills.fluency;
  }
  return 'native';
};

export const getAllLanguages = (languageSkills: User['languageSkills']): string[] => {
  if (isPerLanguageFormat(languageSkills)) {
    return languageSkills.languages.map(l => l.language);
  } else if (isLegacyFormat(languageSkills)) {
    return languageSkills.languages;
  }
  return ['English'];
};

export const getLanguageAccent = (languageSkills: User['languageSkills'], language: string = 'English'): string => {
  if (isPerLanguageFormat(languageSkills)) {
    const lang = languageSkills.languages.find(l => l.language.toLowerCase() === language.toLowerCase());
    return lang?.accent || '';
  } else if (isLegacyFormat(languageSkills)) {
    return languageSkills.accent || '';
  }
  return '';
};

// Channel operator utility functions
export const isChannelOperator = (channel: Channel, nickname: string): boolean => {
  return channel.operators.includes(nickname);
};

export const addChannelOperator = (channel: Channel, nickname: string): Channel => {
  if (!channel.operators.includes(nickname)) {
    return {
      ...channel,
      operators: [...channel.operators, nickname]
    };
  }
  return channel;
};

export const removeChannelOperator = (channel: Channel, nickname: string): Channel => {
  return {
    ...channel,
    operators: channel.operators.filter(op => op !== nickname)
  };
};

export const canUserPerformAction = (channel: Channel, nickname: string, action: 'kick' | 'ban' | 'topic' | 'mode'): boolean => {
  return isChannelOperator(channel, nickname);
};

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