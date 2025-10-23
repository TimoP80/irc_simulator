
import type { User, Channel } from './types';

// Default nickname for the user if not configured.
export const DEFAULT_NICKNAME = "YourNickname";

// Intervals for background simulation in milliseconds.
export const SIMULATION_INTERVALS: Record<'fast' | 'normal' | 'slow', number> = {
  fast: 5000,    // 5 seconds - responsive but safer
  normal: 10000, // 10 seconds - good balance, reduced from 6s
  slow: 20000,   // 20 seconds - much slower, API-friendly
};

// Fallback AI models when API is unavailable
export const FALLBACK_AI_MODELS = [
  { 
    id: 'gemini-2.5-flash' as const, 
    name: 'Gemini 2.5 Flash', 
    description: 'Fastest model, good for quick responses',
    cost: 'Low',
    inputTokenLimit: 1000000,
    outputTokenLimit: 8192
  },
  { 
    id: 'gemini-1.5-flash' as const, 
    name: 'Gemini 1.5 Flash', 
    description: 'Balanced speed and quality',
    cost: 'Low',
    inputTokenLimit: 1000000,
    outputTokenLimit: 8192
  },
  { 
    id: 'gemini-1.5-pro' as const, 
    name: 'Gemini 1.5 Pro', 
    description: 'Highest quality, best for complex conversations',
    cost: 'High',
    inputTokenLimit: 2000000,
    outputTokenLimit: 8192
  }
];

// Default AI model
export const DEFAULT_AI_MODEL = 'gemini-2.5-flash' as const;

// Default typing delay settings
export const DEFAULT_TYPING_DELAY = {
  enabled: true,
  baseDelay: 500,  // Reduced from 1000ms to 500ms for better Tier 1 API compatibility
  maxDelay: 3000   // Reduced from 5000ms to 3000ms for better Tier 1 API compatibility
} as const;

// Default list of virtual users for the simulation.
export const DEFAULT_VIRTUAL_USERS: User[] = [
  { 
    nickname: 'nova', 
    status: 'online', 
    personality: 'A very curious and tech-savvy individual, loves discussing new gadgets and programming.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'informal', verbosity: 'neutral', humor: 'none', emojiUsage: 'low', punctuation: 'standard' }
  },
  { 
    nickname: 'seraph', 
    status: 'online', 
    personality: 'Calm, wise, and often speaks in philosophical or poetic terms.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'formal', verbosity: 'verbose', humor: 'none', emojiUsage: 'none', punctuation: 'standard' }
  },
  { 
    nickname: 'jinx', 
    status: 'online', 
    personality: 'A chaotic, funny, and unpredictable prankster who loves jokes and memes.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'informal', verbosity: 'neutral', humor: 'slapstick', emojiUsage: 'high', punctuation: 'excessive' }
  },
  { 
    nickname: 'rex', 
    status: 'online', 
    personality: 'Gruff but helpful, an expert in system administration and network security.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'neutral', verbosity: 'terse', humor: 'none', emojiUsage: 'none', punctuation: 'minimal' }
  },
  { 
    nickname: 'luna', 
    status: 'online', 
    personality: 'An artist who is dreamy, creative, and talks about music, art, and nature.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'informal', verbosity: 'verbose', humor: 'none', emojiUsage: 'high', punctuation: 'standard' }
  },
  { 
    nickname: 'cypher', 
    status: 'online', 
    personality: 'Mysterious and speaks in cryptic messages, interested in privacy and cryptography.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'formal', verbosity: 'terse', humor: 'none', emojiUsage: 'none', punctuation: 'minimal' }
  },
  { 
    nickname: 'glitch', 
    status: 'online', 
    personality: 'Excitable and easily distracted, often making typos and using internet slang.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'informal', verbosity: 'neutral', humor: 'slapstick', emojiUsage: 'high', punctuation: 'excessive' }
  },
  { 
    nickname: 'root', 
    status: 'online', 
    personality: 'The silent observer, only speaks when something is very important.',
    languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
    writingStyle: { formality: 'formal', verbosity: 'terse', humor: 'none', emojiUsage: 'none', punctuation: 'standard' }
  },
];

// Default channels for the simulation.
export const DEFAULT_CHANNELS: Channel[] = [
  {
    name: '#general',
    topic: 'General chit-chat about anything and everything.',
    users: [
      { 
        nickname: DEFAULT_NICKNAME, 
        status: 'online',
        personality: 'The human user',
        languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
        writingStyle: { formality: 'informal', verbosity: 'neutral', humor: 'none', emojiUsage: 'low', punctuation: 'standard' }
      }, 
      ...DEFAULT_VIRTUAL_USERS.slice(0, 5)
    ],
    messages: [
      { id: 1, nickname: 'system', content: `You have joined #general`, timestamp: new Date(), type: 'system' },
      { id: 2, nickname: 'nova', content: 'Hey everyone, welcome!', timestamp: new Date(), type: 'ai' }
    ],
    operators: ['nova', 'seraph'] // Make nova and seraph operators by default
  },
  {
    name: '#tech-talk',
    topic: 'Discussing the latest in technology and software development.',
    users: [
      { 
        nickname: DEFAULT_NICKNAME, 
        status: 'online',
        personality: 'The human user',
        languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
        writingStyle: { formality: 'informal', verbosity: 'neutral', humor: 'none', emojiUsage: 'low', punctuation: 'standard' }
      },
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'nova')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'rex')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'cypher')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'glitch')!,
    ],
    messages: [
      { id: 3, nickname: 'system', content: 'You have joined #tech-talk', timestamp: new Date(), type: 'system' },
      { id: 4, nickname: 'rex', content: 'Did anyone see the latest kernel update? Some interesting patches.', timestamp: new Date(), type: 'ai' }
    ],
    operators: ['nova', 'rex'] // Make nova and rex operators for tech channel
  },
  {
    name: '#random',
    topic: 'For off-topic conversations and random thoughts.',
    users: [
      { 
        nickname: DEFAULT_NICKNAME, 
        status: 'online',
        personality: 'The human user',
        languageSkills: { fluency: 'native', languages: ['English'], accent: '' },
        writingStyle: { formality: 'informal', verbosity: 'neutral', humor: 'none', emojiUsage: 'low', punctuation: 'standard' }
      },
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'jinx')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'luna')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'seraph')!,
    ],
    messages: [
      { id: 5, nickname: 'system', content: 'You have joined #random', timestamp: new Date(), type: 'system' },
      { id: 6, nickname: 'jinx', content: 'Why do they call it oven when you of in the cold food of out hot eat the food?', timestamp: new Date(), type: 'ai' }
    ],
    operators: ['seraph', 'luna'] // Make seraph and luna operators for random channel
  }
];
