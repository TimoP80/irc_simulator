export interface User {
  nickname: string;
  status: 'online' | 'away';
  userType: 'virtual' | 'bot'; // Distinguish between virtual users and bots
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
    formality: 'ultra_casual' | 'very_casual' | 'casual' | 'semi_formal' | 'formal' | 'very_formal' | 'ultra_formal';
    verbosity: 'terse' | 'brief' | 'moderate' | 'detailed' | 'verbose' | 'extremely_verbose' | 'novel_length';
    humor: 'none' | 'dry' | 'mild' | 'moderate' | 'witty' | 'sarcastic' | 'absurd' | 'chaotic' | 'unhinged';
    emojiUsage: 'none' | 'rare' | 'occasional' | 'moderate' | 'frequent' | 'excessive' | 'emoji_only';
    punctuation: 'minimal' | 'standard' | 'expressive' | 'dramatic' | 'chaotic' | 'artistic' | 'experimental';
  };
  pmProbability?: number; // Probability (0-100) for autonomous private messages
  assignedChannels?: string[]; // Track which channels this user is assigned to
  profilePicture?: string; // URL or data URL for profile picture
  // Bot-specific properties
  botCommands?: string[]; // Available bot commands
  botDescription?: string; // Description of what the bot does
  botCapabilities?: string[]; // What the bot can do (image generation, weather, etc.)
  // Enhanced AI memory system
  relationshipMemory?: UserRelationshipMemory; // Track relationships with other users
}

export type MessageType = 'system' | 'user' | 'ai' | 'pm' | 'action' | 'notice' | 'topic' | 'kick' | 'ban' | 'join' | 'part' | 'quit' | 'bot';

// Bot command types
export type BotCommandType = 'image' | 'weather' | 'time' | 'info' | 'help' | 'quote' | 'joke' | 'fact' | 'translate' | 'calc' | 'search';

// Enhanced AI memory system interfaces
export interface UserRelationshipMemory {
  relationships: Record<string, UserRelationship>; // Key: other user's nickname
  lastUpdated: Date;
}

export interface UserRelationship {
  nickname: string; // The other user's nickname
  relationshipLevel: 'stranger' | 'acquaintance' | 'friendly' | 'close' | 'enemy';
  sharedChannels: string[]; // Channels where they've interacted
  interactionCount: number; // Total number of interactions
  lastInteraction: Date; // When they last interacted
  firstMet: Date; // When they first met
  sharedTopics: string[]; // Topics they've discussed together
  interactionHistory: InteractionRecord[]; // Recent interaction records
  personalityNotes?: string; // AI's notes about this user's personality
  relationshipNotes?: string; // AI's notes about the relationship dynamic
}

export interface InteractionRecord {
  timestamp: Date;
  channel: string;
  interactionType: 'message_exchange' | 'topic_discussion' | 'reaction' | 'quote' | 'pm';
  context: string; // Brief context of the interaction
  sentiment?: 'positive' | 'neutral' | 'negative'; // How the AI perceived the interaction
}

export interface Message {
   id: number;
   nickname: string;
   content: string;
   timestamp: Date;
   type: MessageType;
   command?: string; // For commands like 'me', 'notice', 'topic', etc.
   target?: string; // For commands that target specific users or channels
   links?: string[]; // Array of URLs that were mentioned in the message
   images?: string[]; // Array of image URLs that were mentioned in the message
   audio?: string[]; // Array of audio URLs that were mentioned in the message
   // Bot-specific message properties
   botCommand?: BotCommandType; // Type of bot command that generated this message
   botResponse?: any; // Bot response data (image URL, weather data, etc.)
   // Progress tracking for long-running operations like image generation
   progress?: {
     status: 'generating' | 'completed' | 'failed';
     progress: number; // 0-100
     message?: string; // Optional progress message
   };
   // Quote/reply functionality
   quotedMessage?: {
     id: number;
     nickname: string;
     content: string;
     timestamp: Date;
     type: MessageType;
   }; // Reference to the message being quoted/replied to
 }

export interface Channel {
  name: string;
  topic: string;
  users: User[];
  messages: Message[];
  operators: string[]; // Array of user nicknames who are channel operators
  dominantLanguage?: string; // Optional explicit dominant language for the channel
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
  // Typing indicator configuration
  typingIndicator: {
    mode: 'all' | 'private_only' | 'none'; // Show in all windows, only private messages, or never
  };
  // Store full user objects for proper persistence of language skills and writing styles
  userObjects?: User[];
  // Store full channel objects for proper persistence of user assignments
  channelObjects?: Channel[];
  // Image generation configuration
  imageGeneration?: {
    provider: 'nano-banana' | 'imagen' | 'placeholder' | 'dalle';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };
  // IRC Export configuration
  ircExport?: {
    enabled: boolean;
    server: string;
    port: number;
    nickname: string;
    realname: string;
    channel: string;
    ssl: boolean;
  };
  // UI Theme configuration
  theme?: {
    id: string;
    customColors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
      accent?: string;
    };
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
  return languageSkills && 
         typeof languageSkills === 'object' &&
         'languages' in languageSkills && 
         Array.isArray(languageSkills.languages) && 
         languageSkills.languages.length > 0 && 
         typeof languageSkills.languages[0] === 'object' && 
         languageSkills.languages[0] !== null &&
         'language' in languageSkills.languages[0];
};

export const isLegacyFormat = (languageSkills: User['languageSkills']): languageSkills is { fluency: 'beginner' | 'intermediate' | 'advanced' | 'native'; languages: string[]; accent?: string; } => {
  return languageSkills && 
         typeof languageSkills === 'object' &&
         'fluency' in languageSkills && 
         'languages' in languageSkills && 
         Array.isArray(languageSkills.languages) &&
         languageSkills.languages.length > 0 &&
         typeof languageSkills.languages[0] === 'string';
};

// Utility functions for working with language skills
export const getLanguageFluency = (languageSkills: User['languageSkills'], language: string = 'English'): 'beginner' | 'intermediate' | 'advanced' | 'native' => {
  if (!languageSkills) {
    return 'native';
  }
  
  if (isPerLanguageFormat(languageSkills)) {
    const lang = languageSkills.languages.find(l => l.language.toLowerCase() === language.toLowerCase());
    return lang?.fluency || 'native';
  } else if (isLegacyFormat(languageSkills)) {
    return languageSkills.fluency;
  }
  // Fallback for malformed data
  return 'native';
};

export const getAllLanguages = (languageSkills: User['languageSkills']): string[] => {
  if (!languageSkills) {
    return ['English'];
  }
  
  if (isPerLanguageFormat(languageSkills)) {
    const languages = languageSkills.languages.map(l => l.language);
    // Safety check: if no languages, return English
    return languages.length > 0 ? languages : ['English'];
  } else if (isLegacyFormat(languageSkills)) {
    // Safety check: if no languages, return English
    return languageSkills.languages.length > 0 ? languageSkills.languages : ['English'];
  }
  
  // Fallback for malformed data - try to extract languages if possible
  if (languageSkills && typeof languageSkills === 'object' && 'languages' in languageSkills) {
    const languages = (languageSkills as any).languages;
    if (Array.isArray(languages)) {
      const filtered = languages.filter(lang => typeof lang === 'string');
      return filtered.length > 0 ? filtered : ['English'];
    }
  }
  
  return ['English'];
};

export const getLanguageAccent = (languageSkills: User['languageSkills'], language: string = 'English'): string => {
  if (!languageSkills) {
    return '';
  }
  
  if (isPerLanguageFormat(languageSkills)) {
    const lang = languageSkills.languages.find(l => l.language.toLowerCase() === language.toLowerCase());
    return lang?.accent || '';
  } else if (isLegacyFormat(languageSkills)) {
    return languageSkills.accent || '';
  }
  // Fallback for malformed data
  return '';
};

// Channel operator utility functions
export const isChannelOperator = (channel: Channel, nickname: string): boolean => {
  return (channel.operators || []).includes(nickname);
};

export const addChannelOperator = (channel: Channel, nickname: string): Channel => {
  const operators = channel.operators || [];
  if (!operators.includes(nickname)) {
    return {
      ...channel,
      operators: [...operators, nickname]
    };
  }
  return channel;
};

export const removeChannelOperator = (channel: Channel, nickname: string): Channel => {
  const operators = channel.operators || [];
  return {
    ...channel,
    operators: operators.filter(op => op !== nickname)
  };
};

export const canUserPerformAction = (channel: Channel, nickname: string, action: 'kick' | 'ban' | 'topic' | 'mode'): boolean => {
  return isChannelOperator(channel, nickname);
};

// Migration functions for enhanced writing style attributes
export const migrateWritingStyle = (oldStyle: any): User['writingStyle'] => {
  if (!oldStyle || typeof oldStyle !== 'object') {
    return {
      formality: 'semi_formal',
      verbosity: 'moderate',
      humor: 'none',
      emojiUsage: 'rare',
      punctuation: 'standard'
    };
  }

  // Map old formality values to new ones
  const formalityMap: { [key: string]: User['writingStyle']['formality'] } = {
    'very_informal': 'ultra_casual',
    'informal': 'very_casual',
    'neutral': 'semi_formal',
    'formal': 'formal',
    'very_formal': 'very_formal'
  };

  // Map old verbosity values to new ones
  const verbosityMap: { [key: string]: User['writingStyle']['verbosity'] } = {
    'very_terse': 'terse',
    'terse': 'brief',
    'neutral': 'moderate',
    'verbose': 'detailed',
    'very_verbose': 'verbose'
  };

  // Map old humor values to new ones
  const humorMap: { [key: string]: User['writingStyle']['humor'] } = {
    'none': 'none',
    'dry': 'dry',
    'sarcastic': 'sarcastic',
    'witty': 'witty',
    'slapstick': 'moderate'
  };

  // Map old emoji usage values to new ones
  const emojiUsageMap: { [key: string]: User['writingStyle']['emojiUsage'] } = {
    'none': 'none',
    'low': 'rare',
    'medium': 'occasional',
    'high': 'frequent',
    'excessive': 'excessive'
  };

  // Map old punctuation values to new ones
  const punctuationMap: { [key: string]: User['writingStyle']['punctuation'] } = {
    'minimal': 'minimal',
    'standard': 'standard',
    'creative': 'expressive',
    'excessive': 'dramatic'
  };

  return {
    formality: formalityMap[oldStyle.formality] || 'semi_formal',
    verbosity: verbosityMap[oldStyle.verbosity] || 'moderate',
    humor: humorMap[oldStyle.humor] || 'none',
    emojiUsage: emojiUsageMap[oldStyle.emojiUsage] || 'rare',
    punctuation: punctuationMap[oldStyle.punctuation] || 'standard'
  };
};

// Helper function to safely get writing style with migration
export const getWritingStyle = (user: User): User['writingStyle'] => {
  if (!user.writingStyle) {
    return {
      formality: 'semi_formal',
      verbosity: 'moderate',
      humor: 'none',
      emojiUsage: 'rare',
      punctuation: 'standard'
    };
  }

  // Check if this is an old format that needs migration
  const oldFormalityValues = ['very_informal', 'informal', 'neutral', 'formal', 'very_formal'];
  const oldVerbosityValues = ['very_terse', 'terse', 'neutral', 'verbose', 'very_verbose'];
  const oldHumorValues = ['none', 'dry', 'sarcastic', 'witty', 'slapstick'];
  const oldEmojiValues = ['none', 'low', 'medium', 'high', 'excessive'];
  const oldPunctuationValues = ['minimal', 'standard', 'creative', 'excessive'];

  const needsMigration = 
    oldFormalityValues.includes(user.writingStyle.formality) ||
    oldVerbosityValues.includes(user.writingStyle.verbosity) ||
    oldHumorValues.includes(user.writingStyle.humor) ||
    oldEmojiValues.includes(user.writingStyle.emojiUsage) ||
    oldPunctuationValues.includes(user.writingStyle.punctuation);

  if (needsMigration) {
    return migrateWritingStyle(user.writingStyle);
  }

  return user.writingStyle;
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

// Electron API types
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getAppName: () => Promise<string>;
  onMenuNewChannel: (callback: () => void) => void;
  onMenuAddUser: (callback: () => void) => void;
  onMenuSettings: (callback: () => void) => void;
  onMenuAbout: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

// Extend Window interface to include Electron API
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    process?: {
      type: 'renderer' | 'main';
    };
  }
}