import type { User } from '../types';

export interface PersonalityTemplate {
  id: string;
  name: string;
  description: string;
  baseUser: Partial<User>;
}

export const PERSONALITY_TEMPLATES: PersonalityTemplate[] = [
  {
    id: 'chatterbox',
    name: 'Chatterbox',
    description: 'Talkative and social, loves to keep conversations going',
    baseUser: {
      personality: 'Extremely talkative and social, always has something to say and loves keeping conversations active',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'verbose',
        humor: 'light',
        emojiUsage: 'frequent',
        punctuation: 'excessive'
      }
    }
  },
  {
    id: 'polite_academic',
    name: 'Polite Academic',
    description: 'Formal, well-educated, and always respectful',
    baseUser: {
      personality: 'Highly educated and formal, always polite and respectful in conversations',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'verbose',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'sarcastic_gamer',
    name: 'Sarcastic Gamer',
    description: 'Witty gamer with a sharp tongue and gaming references',
    baseUser: {
      personality: 'Sarcastic and witty gamer who makes clever references and has a sharp sense of humor',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'moderate',
        humor: 'heavy',
        emojiUsage: 'minimal',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'mysterious_cypher',
    name: 'Mysterious Cypher',
    description: 'Cryptic and secretive, speaks in riddles',
    baseUser: {
      personality: 'Mysterious and cryptic, often speaks in riddles and keeps information close to the chest',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'concise',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'minimal'
      }
    }
  },
  {
    id: 'cheerful_artist',
    name: 'Cheerful Artist',
    description: 'Creative and optimistic, loves art and beauty',
    baseUser: {
      personality: 'Creative and optimistic artist who sees beauty in everything and loves discussing art and creativity',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'verbose',
        humor: 'light',
        emojiUsage: 'frequent',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'tech_expert',
    name: 'Tech Expert',
    description: 'Knowledgeable about technology, direct and efficient',
    baseUser: {
      personality: 'Highly knowledgeable about technology and programming, direct and efficient in communication',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'mixed',
        verbosity: 'moderate',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'minimal'
      }
    }
  },
  {
    id: 'friendly_newcomer',
    name: 'Friendly Newcomer',
    description: 'Eager to learn, asks lots of questions',
    baseUser: {
      personality: 'New to the community and eager to learn, asks lots of questions and is very friendly',
      languageSkills: {
        fluency: 'intermediate',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'moderate',
        humor: 'light',
        emojiUsage: 'frequent',
        punctuation: 'excessive'
      }
    }
  },
  {
    id: 'wise_elder',
    name: 'Wise Elder',
    description: 'Experienced and philosophical, gives advice',
    baseUser: {
      personality: 'Wise and experienced, often gives philosophical advice and shares life lessons',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'verbose',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  }
];

export const TRAIT_POOLS = {
  personalities: [
    'curious and inquisitive',
    'sarcastic and witty',
    'friendly and outgoing',
    'mysterious and secretive',
    'creative and artistic',
    'technical and logical',
    'philosophical and deep',
    'humorous and playful',
    'serious and focused',
    'optimistic and cheerful',
    'pessimistic and cynical',
    'helpful and supportive',
    'competitive and driven',
    'laid-back and relaxed',
    'perfectionist and detail-oriented'
  ],
  interests: [
    'technology and programming',
    'gaming and entertainment',
    'art and creativity',
    'music and culture',
    'science and research',
    'philosophy and spirituality',
    'sports and fitness',
    'cooking and food',
    'travel and adventure',
    'books and literature',
    'movies and TV shows',
    'nature and environment',
    'business and finance',
    'education and learning',
    'social causes and activism'
  ],
  languages: [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi',
    'Dutch', 'Swedish', 'Norwegian', 'Finnish', 'Polish', 'Czech'
  ],
  accents: [
    'British', 'American Southern', 'Australian', 'Canadian', 'Irish',
    'Scottish', 'New York', 'California', 'Texas', 'Boston',
    'Cockney', 'Geordie', 'Welsh', 'Quebecois', 'Kiwi'
  ]
};

export const generateRandomNickname = (): string => {
  // Fallback to traditional generation for immediate use
  const prefixes = ['nova', 'cyber', 'digital', 'virtual', 'quantum', 'neon', 'crystal', 'shadow', 'phoenix', 'cosmic', 'stellar', 'lunar', 'solar', 'atomic', 'mystic', 'arcane', 'prism', 'echo', 'pulse', 'flux'];
  const suffixes = ['byte', 'code', 'link', 'node', 'core', 'wave', 'beam', 'stream', 'flow', 'glow', 'spark', 'flash', 'blaze', 'storm', 'wind', 'fire', 'ice', 'star', 'moon', 'sun'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${prefix}${suffix}${number}`;
};

export const generateRandomNicknameAsync = async (avoidDuplicates: string[] = []): Promise<string> => {
  try {
    const { generateAUsernames } = await import('../services/usernameGeneration');
    const usernames = await generateAUsernames({
      count: 1,
      style: 'mixed',
      avoidDuplicates
    });
    return usernames[0] || generateRandomNickname();
  } catch (error) {
    console.error('Failed to generate AI nickname:', error);
    return generateRandomNickname();
  }
};

export const generateRandomUser = (): User => {
  const personality = TRAIT_POOLS.personalities[Math.floor(Math.random() * TRAIT_POOLS.personalities.length)];
  const interest = TRAIT_POOLS.interests[Math.floor(Math.random() * TRAIT_POOLS.interests.length)];
  const languages = TRAIT_POOLS.languages.slice(0, Math.floor(Math.random() * 3) + 1);
  const accent = Math.random() > 0.7 ? TRAIT_POOLS.accents[Math.floor(Math.random() * TRAIT_POOLS.accents.length)] : '';
  
  const fluencyLevels = ['beginner', 'intermediate', 'advanced', 'native'] as const;
  const formalityLevels = ['casual', 'formal', 'mixed'] as const;
  const verbosityLevels = ['concise', 'moderate', 'verbose'] as const;
  const humorLevels = ['none', 'light', 'heavy'] as const;
  const emojiLevels = ['none', 'minimal', 'frequent'] as const;
  const punctuationLevels = ['minimal', 'standard', 'excessive'] as const;
  
  return {
    nickname: generateRandomNickname(),
    status: 'online',
    personality: `${personality}, interested in ${interest}`,
    languageSkills: {
      fluency: fluencyLevels[Math.floor(Math.random() * fluencyLevels.length)],
      languages: languages,
      accent: accent
    },
    writingStyle: {
      formality: formalityLevels[Math.floor(Math.random() * formalityLevels.length)],
      verbosity: verbosityLevels[Math.floor(Math.random() * verbosityLevels.length)],
      humor: humorLevels[Math.floor(Math.random() * humorLevels.length)],
      emojiUsage: emojiLevels[Math.floor(Math.random() * emojiLevels.length)],
      punctuation: punctuationLevels[Math.floor(Math.random() * punctuationLevels.length)]
    }
  };
};

export const generateRandomUserAsync = async (avoidDuplicates: string[] = []): Promise<User> => {
  const personality = TRAIT_POOLS.personalities[Math.floor(Math.random() * TRAIT_POOLS.personalities.length)];
  const interest = TRAIT_POOLS.interests[Math.floor(Math.random() * TRAIT_POOLS.interests.length)];
  const languages = TRAIT_POOLS.languages.slice(0, Math.floor(Math.random() * 3) + 1);
  const accent = Math.random() > 0.7 ? TRAIT_POOLS.accents[Math.floor(Math.random() * TRAIT_POOLS.accents.length)] : '';
  
  const fluencyLevels = ['beginner', 'intermediate', 'advanced', 'native'] as const;
  const formalityLevels = ['casual', 'formal', 'mixed'] as const;
  const verbosityLevels = ['concise', 'moderate', 'verbose'] as const;
  const humorLevels = ['none', 'light', 'heavy'] as const;
  const emojiLevels = ['none', 'minimal', 'frequent'] as const;
  const punctuationLevels = ['minimal', 'standard', 'excessive'] as const;
  
  const nickname = await generateRandomNicknameAsync(avoidDuplicates);
  
  return {
    nickname,
    status: 'online',
    personality: `${personality}, interested in ${interest}`,
    languageSkills: {
      fluency: fluencyLevels[Math.floor(Math.random() * fluencyLevels.length)],
      languages: languages,
      accent: accent
    },
    writingStyle: {
      formality: formalityLevels[Math.floor(Math.random() * formalityLevels.length)],
      verbosity: verbosityLevels[Math.floor(Math.random() * verbosityLevels.length)],
      humor: humorLevels[Math.floor(Math.random() * humorLevels.length)],
      emojiUsage: emojiLevels[Math.floor(Math.random() * emojiLevels.length)],
      punctuation: punctuationLevels[Math.floor(Math.random() * punctuationLevels.length)]
    }
  };
};
