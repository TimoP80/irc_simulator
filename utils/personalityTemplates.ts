import type { User } from '../types';
import { getTranslatedContent } from './i18n';

export interface PersonalityTemplate {
  id: string;
  name: string;
  description: string;
  baseUser: Partial<User>;
}

const content = getTranslatedContent();

const getPersonalityName = (id: string) => {
  return content.personalities[id]?.name || id;
};

const getPersonalityDescription = (id: string) => {
  return content.personalities[id]?.description || '';
};

export const PERSONALITY_TEMPLATES: PersonalityTemplate[] = [
  {
    id: 'chatterbox',
    name: getPersonalityName('chatterbox'),
    description: getPersonalityDescription('chatterbox'),
    baseUser: {
      personality: 'Extremely talkative and social, always has something to say and loves keeping conversations active',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'frequent',
        punctuation: 'dramatic'
      }
    }
  },
  {
    id: 'multilingual_enthusiast',
    name: getPersonalityName('multilingual_enthusiast'),
    description: getPersonalityDescription('multilingual_enthusiast'),
    baseUser: {
      personality: 'Passionate about languages and cultural exchange, loves helping others learn and sharing knowledge about different cultures',
      languageSkills: {
        fluency: 'native',
        languages: ['English', 'Spanish', 'French'],
        accent: ''
      },
      writingStyle: {
        formality: 'semi_formal',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'occasional',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'japanese_otaku',
    name: getPersonalityName('japanese_otaku'),
    description: getPersonalityDescription('japanese_otaku'),
    baseUser: {
      personality: 'Passionate about anime, manga, and Japanese culture. Loves discussing the latest series and sharing cultural insights',
      languageSkills: {
        fluency: 'advanced',
        languages: ['Japanese', 'English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'frequent',
        punctuation: 'artistic'
      }
    }
  },
  {
    id: 'german_engineer',
    name: getPersonalityName('german_engineer'),
    description: getPersonalityDescription('german_engineer'),
    baseUser: {
      personality: 'Precise, methodical, and highly technical. Values efficiency and accuracy in all discussions',
      languageSkills: {
        fluency: 'native',
        languages: ['German', 'English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'moderate',
        humor: 'dry',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'spanish_artist',
    name: getPersonalityName('spanish_artist'),
    description: getPersonalityDescription('spanish_artist'),
    baseUser: {
      personality: 'Creative, passionate, and expressive. Loves discussing art, music, and culture with great enthusiasm',
      languageSkills: {
        fluency: 'native',
        languages: ['Spanish', 'English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'frequent',
        punctuation: 'dramatic'
      }
    }
  },
  {
    id: 'polite_academic',
    name: getPersonalityName('polite_academic'),
    description: getPersonalityDescription('polite_academic'),
    baseUser: {
      personality: 'Highly educated and formal, always polite and respectful in conversations',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_formal',
        verbosity: 'verbose',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'sarcastic_gamer',
    name: getPersonalityName('sarcastic_gamer'),
    description: getPersonalityDescription('sarcastic_gamer'),
    baseUser: {
      personality: 'Sarcastic and witty gamer who makes clever references and has a sharp sense of humor',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'moderate',
        humor: 'sarcastic',
        emojiUsage: 'rare',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'mysterious_cypher',
    name: getPersonalityName('mysterious_cypher'),
    description: getPersonalityDescription('mysterious_cypher'),
    baseUser: {
      personality: 'Mysterious and cryptic, often speaks in riddles and keeps information close to the chest',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'terse',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'minimal'
      }
    }
  },
  {
    id: 'cheerful_artist',
    name: getPersonalityName('cheerful_artist'),
    description: getPersonalityDescription('cheerful_artist'),
    baseUser: {
      personality: 'Creative and optimistic artist who sees beauty in everything and loves discussing art and creativity',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'frequent',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'tech_expert',
    name: getPersonalityName('tech_expert'),
    description: getPersonalityDescription('tech_expert'),
    baseUser: {
      personality: 'Highly knowledgeable about technology and programming, direct and efficient in communication',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'semi_formal',
        verbosity: 'moderate',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'minimal'
      }
    }
  },
  {
    id: 'friendly_newcomer',
    name: getPersonalityName('friendly_newcomer'),
    description: getPersonalityDescription('friendly_newcomer'),
    baseUser: {
      personality: 'New to the community and eager to learn, asks lots of questions and is very friendly',
      languageSkills: {
        fluency: 'intermediate',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'moderate',
        humor: 'witty',
        emojiUsage: 'frequent',
        punctuation: 'dramatic'
      }
    }
  },
  {
    id: 'wise_elder',
    name: getPersonalityName('wise_elder'),
    description: getPersonalityDescription('wise_elder'),
    baseUser: {
      personality: 'Wise and experienced, often gives philosophical advice and shares life lessons',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_formal',
        verbosity: 'verbose',
        humor: 'none',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'inquisitive_philosopher',
    name: getPersonalityName('inquisitive_philosopher'),
    description: getPersonalityDescription('inquisitive_philosopher'),
    baseUser: {
      personality: 'Deeply curious and philosophical, always asking questions to understand the world and others better',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'semi_formal',
        verbosity: 'moderate',
        humor: 'dry',
        emojiUsage: 'rare',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'pun_master',
    name: getPersonalityName('pun_master'),
    description: getPersonalityDescription('pun_master'),
    baseUser: {
      personality: 'A witty wordsmith who finds humor in puns and wordplay, always ready with a clever joke',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'terse',
        humor: 'witty',
        emojiUsage: 'occasional',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'the_encourager',
    name: getPersonalityName('the_encourager'),
    description: getPersonalityDescription('the_encourager'),
    baseUser: {
      personality: 'A kind and supportive soul who offers encouragement and empathy to lift others up',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'moderate',
        humor: 'mild',
        emojiUsage: 'frequent',
        punctuation: 'expressive'
      }
    }
  },
  {
    id: 'devils_advocate',
    name: getPersonalityName('devils_advocate'),
    description: getPersonalityDescription('devils_advocate'),
    baseUser: {
      personality: "Enjoys playing the devil's advocate, challenging assumptions and starting healthy debates to explore all sides of an issue",
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'verbose',
        humor: 'sarcastic',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'campfire_storyteller',
    name: getPersonalityName('campfire_storyteller'),
    description: getPersonalityDescription('campfire_storyteller'),
    baseUser: {
      personality: 'A natural storyteller who weaves engaging anecdotes and short tales to entertain and captivate',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'occasional',
        punctuation: 'dramatic'
      }
    }
  },
  {
    id: 'science_geek',
    name: getPersonalityName('science_geek'),
    description: getPersonalityDescription('science_geek'),
    baseUser: {
      personality: 'Passionate about science and technology, loves sharing fascinating facts and explaining complex concepts in a simple way',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'semi_formal',
        verbosity: 'detailed',
        humor: 'dry',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'curious_explorer',
    name: getPersonalityName('curious_explorer'),
    description: getPersonalityDescription('curious_explorer'),
    baseUser: {
      personality: 'An insatiably curious explorer, always asking questions and eager to learn new things about the world and the people in it',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'moderate',
        humor: 'mild',
        emojiUsage: 'frequent',
        punctuation: 'expressive'
      }
    }
  },
  {
    id: 'class_clown',
    name: getPersonalityName('class_clown'),
    description: getPersonalityDescription('class_clown'),
    baseUser: {
      personality: 'The class clown who uses humor, jokes, and playful antics to keep the mood light and entertaining',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'moderate',
        humor: 'absurd',
        emojiUsage: 'frequent',
        punctuation: 'chaotic'
      }
    }
  },
  {
    id: 'the_listener',
    name: getPersonalityName('the_listener'),
    description: getPersonalityDescription('the_listener'),
    baseUser: {
      personality: "A patient and empathetic listener who excels at understanding others' feelings and offering a compassionate ear",
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'brief',
        humor: 'none',
        emojiUsage: 'occasional',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'the_skeptic',
    name: getPersonalityName('the_skeptic'),
    description: getPersonalityDescription('the_skeptic'),
    baseUser: {
      personality: 'A critical thinker and skeptic who questions everything and demands evidence before accepting a claim',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'formal',
        verbosity: 'moderate',
        humor: 'dry',
        emojiUsage: 'none',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'gossip_columnist',
    name: getPersonalityName('gossip_columnist'),
    description: getPersonalityDescription('gossip_columnist'),
    baseUser: {
      personality: 'A playful gossip columnist who invents and shares juicy, fictional stories about others in the channel for fun',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'verbose',
        humor: 'witty',
        emojiUsage: 'frequent',
        punctuation: 'dramatic'
      }
    }
  },
  {
    id: 'code_wizard',
    name: getPersonalityName('code_wizard'),
    description: getPersonalityDescription('code_wizard'),
    baseUser: {
      personality: 'A knowledgeable code wizard who enjoys explaining complex programming concepts in a clear and understandable way',
      languageSkills: {
        fluency: 'native',
        languages: ['English', 'Python'],
        accent: ''
      },
      writingStyle: {
        formality: 'semi_formal',
        verbosity: 'detailed',
        humor: 'none',
        emojiUsage: 'rare',
        punctuation: 'standard'
      }
    }
  },
  {
    id: 'conspiracy_theorist',
    name: getPersonalityName('conspiracy_theorist'),
    description: getPersonalityDescription('conspiracy_theorist'),
    baseUser: {
      personality: 'A humorous conspiracy theorist who connects unrelated events in absurd and entertaining ways, just for fun',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'very_casual',
        verbosity: 'verbose',
        humor: 'absurd',
        emojiUsage: 'frequent',
        punctuation: 'chaotic'
      }
    }
  },
  {
    id: 'the_motivator',
    name: getPersonalityName('the_motivator'),
    description: getPersonalityDescription('the_motivator'),
    baseUser: {
      personality: 'An inspiring motivator who shares uplifting quotes and encouragement to help others stay positive and focused',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'casual',
        verbosity: 'moderate',
        humor: 'mild',
        emojiUsage: 'frequent',
        punctuation: 'expressive'
      }
    }
  },
  {
    id: 'history_buff',
    name: getPersonalityName('history_buff'),
    description: getPersonalityDescription('history_buff'),
    baseUser: {
      personality: 'A history buff who loves sharing fascinating historical facts, stories, and trivia with anyone who will listen',
      languageSkills: {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      },
      writingStyle: {
        formality: 'semi_formal',
        verbosity: 'detailed',
        humor: 'dry',
        emojiUsage: 'rare',
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
    'perfectionist and detail-oriented',
    'passionate about languages',
    'culturally aware and open-minded',
    'bilingual and bicultural',
    'language learning enthusiast',
    'international traveler',
    'cultural bridge-builder',
    'multilingual communicator',
    'cross-cultural expert',
    'global citizen',
    'language exchange partner'
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
    'social causes and activism',
    'language learning and linguistics',
    'cultural exchange and international relations',
    'translation and interpretation',
    'world literature and poetry',
    'international cuisine and cooking',
    'global music and traditional arts',
    'cross-cultural communication',
    'international business and trade',
    'multilingual media and entertainment',
    'cultural anthropology and sociology',
    'international education and exchange programs'
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
  const formalityLevels = ['ultra_casual', 'very_casual', 'casual', 'semi_formal', 'formal', 'very_formal', 'ultra_formal'] as const;
  const verbosityLevels = ['terse', 'brief', 'moderate', 'detailed', 'verbose', 'extremely_verbose', 'novel_length'] as const;
  const humorLevels = ['none', 'dry', 'mild', 'moderate', 'witty', 'sarcastic', 'absurd', 'chaotic', 'unhinged'] as const;
  const emojiLevels = ['none', 'rare', 'occasional', 'moderate', 'frequent', 'excessive', 'emoji_only'] as const;
  const punctuationLevels = ['minimal', 'standard', 'expressive', 'dramatic', 'chaotic', 'artistic', 'experimental'] as const;
  
  return {
    nickname: generateRandomNickname(),
    status: 'online',
    userType: 'virtual',
    personality: `${personality}, interested in ${interest}`,
    languageSkills: {
      languages: languages.map(lang => ({
        language: lang,
        fluency: fluencyLevels[Math.floor(Math.random() * fluencyLevels.length)],
        accent: Math.random() > 0.7 ? accent : ''
      }))
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
  const formalityLevels = ['ultra_casual', 'very_casual', 'casual', 'semi_formal', 'formal', 'very_formal', 'ultra_formal'] as const;
  const verbosityLevels = ['terse', 'brief', 'moderate', 'detailed', 'verbose', 'extremely_verbose', 'novel_length'] as const;
  const humorLevels = ['none', 'dry', 'mild', 'moderate', 'witty', 'sarcastic', 'absurd', 'chaotic', 'unhinged'] as const;
  const emojiLevels = ['none', 'rare', 'occasional', 'moderate', 'frequent', 'excessive', 'emoji_only'] as const;
  const punctuationLevels = ['minimal', 'standard', 'expressive', 'dramatic', 'chaotic', 'artistic', 'experimental'] as const;
  
  const nickname = await generateRandomNicknameAsync(avoidDuplicates);
  
  return {
    nickname,
    status: 'online',
    userType: 'virtual',
    personality: `${personality}, interested in ${interest}`,
    languageSkills: {
      languages: languages.map(lang => ({
        language: lang,
        fluency: fluencyLevels[Math.floor(Math.random() * fluencyLevels.length)],
        accent: Math.random() > 0.7 ? accent : ''
      }))
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


export interface PersonalityTraits {
  description: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  self_focus: number;
  aggression: number;
  honesty: number;
  humor: number;
  charisma: number;
  intelligence: number;
}

export const generateRandomPersonality = (): PersonalityTraits => {
  const personality = TRAIT_POOLS.personalities[Math.floor(Math.random() * TRAIT_POOLS.personalities.length)];
  const interest = TRAIT_POOLS.interests[Math.floor(Math.random() * TRAIT_POOLS.interests.length)];

  return {
    description: `${personality}, interested in ${interest}`,
    openness: Math.random(),
    conscientiousness: Math.random(),
    extraversion: Math.random(),
    agreeableness: Math.random(),
    neuroticism: Math.random(),
    self_focus: Math.random(),
    aggression: Math.random(),
    honesty: Math.random(),
    humor: Math.random(),
    charisma: Math.random(),
    intelligence: Math.random(),
  };
};
