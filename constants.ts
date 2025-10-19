
import type { User, Channel } from './types';

// Default nickname for the user if not configured.
export const DEFAULT_NICKNAME = "you";

// Intervals for background simulation in milliseconds.
export const SIMULATION_INTERVALS: Record<'fast' | 'normal' | 'slow', number> = {
  fast: 15000,
  normal: 30000,
  slow: 60000,
};

// Default list of virtual users for the simulation.
export const DEFAULT_VIRTUAL_USERS: User[] = [
  { nickname: 'nova', status: 'online', personality: 'A very curious and tech-savvy individual, loves discussing new gadgets and programming.' },
  { nickname: 'seraph', status: 'online', personality: 'Calm, wise, and often speaks in philosophical or poetic terms.' },
  { nickname: 'jinx', status: 'online', personality: 'A chaotic, funny, and unpredictable prankster who loves jokes and memes.' },
  { nickname: 'rex', status: 'online', personality: 'Gruff but helpful, an expert in system administration and network security.' },
  { nickname: 'luna', status: 'online', personality: 'An artist who is dreamy, creative, and talks about music, art, and nature.' },
  { nickname: 'cypher', status: 'online', personality: 'Mysterious and speaks in cryptic messages, interested in privacy and cryptography.' },
  { nickname: 'glitch', status: 'online', personality: 'Excitable and easily distracted, often making typos and using internet slang.' },
  { nickname: 'root', status: 'online', personality: 'The silent observer, only speaks when something is very important.' },
];

// Default channels for the simulation.
export const DEFAULT_CHANNELS: Channel[] = [
  {
    name: '#general',
    topic: 'General chit-chat about anything and everything.',
    users: [
      { nickname: DEFAULT_NICKNAME, status: 'online' }, 
      ...DEFAULT_VIRTUAL_USERS.slice(0, 5)
    ],
    messages: [
      { id: 1, nickname: 'system', content: `You have joined #general`, timestamp: new Date(), type: 'system' },
      { id: 2, nickname: 'nova', content: 'Hey everyone, welcome!', timestamp: new Date(), type: 'ai' }
    ]
  },
  {
    name: '#tech-talk',
    topic: 'Discussing the latest in technology and software development.',
    users: [
      { nickname: DEFAULT_NICKNAME, status: 'online' },
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'nova')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'rex')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'cypher')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'glitch')!,
    ],
    messages: [
      { id: 3, nickname: 'system', content: 'You have joined #tech-talk', timestamp: new Date(), type: 'system' },
      { id: 4, nickname: 'rex', content: 'Did anyone see the latest kernel update? Some interesting patches.', timestamp: new Date(), type: 'ai' }
    ]
  },
  {
    name: '#random',
    topic: 'For off-topic conversations and random thoughts.',
    users: [
      { nickname: DEFAULT_NICKNAME, status: 'online' },
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'jinx')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'luna')!,
      DEFAULT_VIRTUAL_USERS.find(u => u.nickname === 'seraph')!,
    ],
    messages: [
      { id: 5, nickname: 'system', content: 'You have joined #random', timestamp: new Date(), type: 'system' },
      { id: 6, nickname: 'jinx', content: 'Why do they call it oven when you of in the cold food of out hot eat the food?', timestamp: new Date(), type: 'ai' }
    ]
  }
];
