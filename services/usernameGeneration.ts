import { GoogleGenAI } from '@google/genai';
import { withRateLimitAndRetries } from '../utils/config';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface UsernameGenerationOptions {
  count: number;
  style?: 'tech' | 'gaming' | 'creative' | 'realistic' | 'mixed';
  personality?: string;
  avoidDuplicates?: string[];
}

export interface UsernameCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export const USERNAME_CATEGORIES: UsernameCategory[] = [
  {
    id: 'tech',
    name: 'Tech/Programming',
    description: 'Technology and programming related usernames',
    examples: ['CodeMaster', 'ByteWizard', 'DataNinja', 'CloudGuru', 'DevOpsHero']
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gaming and fantasy themed usernames',
    examples: ['DragonSlayer', 'PixelWarrior', 'QuestSeeker', 'MysticMage', 'ShadowHunter']
  },
  {
    id: 'creative',
    name: 'Creative/Artistic',
    description: 'Creative and artistic themed usernames',
    examples: ['ArtSoul', 'ColorDreamer', 'MusicMaker', 'PoetryWriter', 'DesignGenius']
  },
  {
    id: 'realistic',
    name: 'Realistic/Personal',
    description: 'Realistic and personal sounding usernames',
    examples: ['Alex_M', 'SarahJ', 'Mike_Dev', 'Emma_Creative', 'John_Tech']
  },
  {
    id: 'abstract',
    name: 'Abstract/Unique',
    description: 'Abstract and unique usernames',
    examples: ['EchoVoid', 'PrismLight', 'QuantumLeap', 'StellarDust', 'MysticWave']
  }
];

/**
 * Generates creative usernames using AI
 */
export const generateAUsernames = async (options: UsernameGenerationOptions): Promise<string[]> => {
  console.log(`[AI Debug] generateAUsernames called with options:`, options);
  
  const { count, style = 'mixed', personality, avoidDuplicates = [] } = options;
  
  const styleDescription = getStyleDescription(style);
  const personalityContext = personality ? `The user has this personality: "${personality}". ` : '';
  const avoidContext = avoidDuplicates.length > 0 ? `Avoid these existing usernames: ${avoidDuplicates.join(', ')}. ` : '';
  
  const prompt = `
Generate ${count} unique and creative IRC usernames for virtual users in a chat simulation.

${personalityContext}${avoidContext}
Style: ${styleDescription}

Requirements:
- Each username should be 3-15 characters long
- Use only letters, numbers, underscores, and hyphens
- Make them sound natural and memorable
- Avoid offensive or inappropriate content
- Ensure each username is unique
- Consider the personality and style when generating names
- Mix different naming patterns for variety

Return only the usernames, one per line, no additional text or formatting.
`;

  try {
    console.log(`[AI Debug] Sending request to Gemini for username generation (${count} usernames, style: ${style})`);
    const response = await withRateLimitAndRetries(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          maxOutputTokens: 200,
          thinkingConfig: { thinkingBudget: 0 },
        },
      })
    );

    console.log(`[AI Debug] Successfully received response from Gemini for username generation`);
    const usernames = response.text
      .trim()
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0 && name.length <= 15)
      .filter(name => /^[a-zA-Z0-9_-]+$/.test(name))
      .filter(name => !avoidDuplicates.includes(name.toLowerCase()));

    // If we didn't get enough unique names, generate more
    if (usernames.length < count) {
      console.log(`[AI Debug] Generated ${usernames.length} usernames, need ${count}. Generating additional ${count - usernames.length} usernames.`);
      const additionalCount = count - usernames.length;
      const additionalUsernames = await generateAUsernames({
        count: additionalCount,
        style,
        personality,
        avoidDuplicates: [...avoidDuplicates, ...usernames.map(u => u.toLowerCase())]
      });
      usernames.push(...additionalUsernames);
    }

    const result = usernames.slice(0, count);
    console.log(`[AI Debug] Successfully generated ${result.length} usernames:`, result);
    return result;
  } catch (error) {
    console.error(`[AI Debug] Error generating usernames:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      options: options
    });
    // Fallback to traditional generation
    return generateFallbackUsernames(count, avoidDuplicates);
  }
};

/**
 * Generates usernames based on personality templates
 */
export const generateUsernamesForPersonality = async (
  personality: string,
  count: number,
  avoidDuplicates: string[] = []
): Promise<string[]> => {
  // Determine style based on personality keywords
  let style: UsernameGenerationOptions['style'] = 'mixed';
  
  if (personality.toLowerCase().includes('tech') || personality.toLowerCase().includes('programming')) {
    style = 'tech';
  } else if (personality.toLowerCase().includes('gaming') || personality.toLowerCase().includes('game')) {
    style = 'gaming';
  } else if (personality.toLowerCase().includes('creative') || personality.toLowerCase().includes('art')) {
    style = 'creative';
  } else if (personality.toLowerCase().includes('formal') || personality.toLowerCase().includes('professional')) {
    style = 'realistic';
  }

  return generateAUsernames({
    count,
    style,
    personality,
    avoidDuplicates
  });
};

/**
 * Generates usernames for batch user creation
 */
export const generateBatchUsernames = async (
  count: number,
  existingUsers: string[] = []
): Promise<string[]> => {
  const avoidDuplicates = existingUsers.map(u => u.toLowerCase());
  
  // Mix different styles for variety
  const styles: UsernameGenerationOptions['style'][] = ['tech', 'gaming', 'creative', 'realistic', 'mixed'];
  const usernames: string[] = [];
  
  const perStyle = Math.ceil(count / styles.length);
  
  for (const style of styles) {
    const remaining = count - usernames.length;
    if (remaining <= 0) break;
    
    const styleCount = Math.min(perStyle, remaining);
    const styleUsernames = await generateAUsernames({
      count: styleCount,
      style,
      avoidDuplicates: [...avoidDuplicates, ...usernames.map(u => u.toLowerCase())]
    });
    
    usernames.push(...styleUsernames);
  }
  
  return usernames.slice(0, count);
};

/**
 * Gets style description for prompts
 */
function getStyleDescription(style: UsernameGenerationOptions['style']): string {
  const descriptions = {
    tech: 'Technology and programming themed (e.g., CodeMaster, ByteWizard, DataNinja)',
    gaming: 'Gaming and fantasy themed (e.g., DragonSlayer, PixelWarrior, QuestSeeker)',
    creative: 'Creative and artistic themed (e.g., ArtSoul, ColorDreamer, MusicMaker)',
    realistic: 'Realistic and personal sounding (e.g., Alex_M, SarahJ, Mike_Dev)',
    abstract: 'Abstract and unique (e.g., EchoVoid, PrismLight, QuantumLeap)',
    mixed: 'Mix of all styles for maximum variety'
  };
  
  return descriptions[style];
}

/**
 * Fallback username generation when AI fails
 */
function generateFallbackUsernames(count: number, avoidDuplicates: string[] = []): string[] {
  const prefixes = [
    'nova', 'cyber', 'digital', 'virtual', 'quantum', 'neon', 'crystal', 'shadow', 'phoenix',
    'cosmic', 'stellar', 'lunar', 'solar', 'atomic', 'mystic', 'arcane', 'prism', 'echo',
    'pulse', 'flux', 'code', 'data', 'byte', 'pixel', 'wave', 'beam', 'stream', 'flow'
  ];
  
  const suffixes = [
    'byte', 'code', 'link', 'node', 'core', 'wave', 'beam', 'stream', 'flow', 'glow',
    'spark', 'flash', 'blaze', 'storm', 'wind', 'fire', 'ice', 'star', 'moon', 'sun',
    'master', 'wizard', 'ninja', 'hero', 'legend', 'pro', 'expert', 'guru', 'ace'
  ];
  
  const usernames: string[] = [];
  const used = new Set(avoidDuplicates.map(u => u.toLowerCase()));
  
  while (usernames.length < count) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const nickname = `${prefix}${suffix}${number}`;
    
    if (!used.has(nickname.toLowerCase())) {
      usernames.push(nickname);
      used.add(nickname.toLowerCase());
    }
  }
  
  return usernames;
}
