import type { AppConfig, User, Channel } from '../types';
import { DEFAULT_NICKNAME, DEFAULT_VIRTUAL_USERS, DEFAULT_CHANNELS, DEFAULT_TYPING_DELAY } from '../constants';

const CONFIG_STORAGE_KEY = 'gemini-irc-simulator-config';
const CHANNEL_LOGS_STORAGE_KEY = 'station-v-channel-logs';

/**
 * Loads the application configuration from localStorage.
 * @returns The saved AppConfig or null if none is found.
 */
export const loadConfig = (): AppConfig | null => {
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!savedConfig) return null;
    
    const parsed = JSON.parse(savedConfig);
    return {
      ...parsed,
      typingDelay: parsed.typingDelay || DEFAULT_TYPING_DELAY
    };
  } catch (error) {
    console.error("Failed to load config from localStorage:", error);
    return null;
  }
};

/**
 * Saves the application configuration to localStorage.
 * @param config The AppConfig object to save.
 */
export const saveConfig = (config: AppConfig) => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save config to localStorage:", error);
  }
};

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000; // 2 seconds

const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED");
  }
  return false;
};

/**
 * Wraps an API call with exponential backoff for rate limit errors.
 * @param apiCall The function that returns a promise for the API call.
 * @returns The result of the API call.
 * @throws Throws an error if retries are exhausted or a non-rate-limit error occurs.
 */
export const withRateLimitAndRetries = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      return await apiCall();
    } catch (error) {
      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        attempt++;
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Exhausted retries for API call.");
};


/**
 * Parses the raw string configuration for virtual users into an array of User objects.
 * Format: one user per line, "nickname, personality".
 * @param usersString The raw string from the settings textarea.
 * @returns An array of User objects.
 */
const parseVirtualUsers = (usersString: string): User[] => {
    return usersString.split('\n')
        .map(line => line.trim())
        .filter(line => line.includes(','))
        .map(line => {
            const [nickname, ...personalityParts] = line.split(',');
            return {
                nickname: nickname.trim(),
                personality: personalityParts.join(',').trim(),
                status: 'online' as const,
                languageSkills: {
                    languages: [{
                        language: 'English',
                        fluency: 'native' as const,
                        accent: ''
                    }]
                },
                writingStyle: {
                    formality: 'informal' as const,
                    verbosity: 'neutral' as const,
                    humor: 'none' as const,
                    emojiUsage: 'low' as const,
                    punctuation: 'standard' as const
                }
            };
        });
};

/**
 * Parses the raw string configuration for channels into an array of Channel objects.
 * Format: one channel per line, "#channel, topic".
 * @param channelsString The raw string from the settings textarea.
 * @param allVirtualUsers The list of all available virtual users to populate the channels with.
 * @param currentUserNickname The nickname of the main user.
 * @returns An array of Channel objects.
 */
const parseChannels = (channelsString: string, allVirtualUsers: User[], currentUserNickname: string): Channel[] => {
    return channelsString.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('#') && line.includes(','))
        .map((line, index) => {
            // Check if line has dominant language (format: "#channel, topic | language")
            const hasLanguage = line.includes(' | ');
            let name: string, topic: string, dominantLanguage: string | undefined;
            
            if (hasLanguage) {
                const [channelPart, dominantLanguagePart] = line.split(' | ');
                const [namePart, ...topicParts] = channelPart.split(',');
                name = namePart.trim();
                topic = topicParts.join(',').trim();
                dominantLanguage = dominantLanguagePart.trim();
            } else {
                // Legacy format without dominant language
                const [namePart, ...topicParts] = line.split(',');
                name = namePart.trim();
                topic = topicParts.join(',').trim();
                dominantLanguage = undefined;
            }
            
            // Start with empty channel (only current user) - users will be assigned through UI
            // This allows for proper channel-specific user management
            return {
                name,
                topic,
                dominantLanguage,
                users: [
                    { 
                        nickname: currentUserNickname, 
                        status: 'online' as const,
                        personality: 'The human user',
                        languageSkills: { 
                            languages: [{
                                language: 'English',
                                fluency: 'native' as const,
                                accent: ''
                            }]
                        },
                        writingStyle: { formality: 'informal' as const, verbosity: 'neutral' as const, humor: 'none' as const, emojiUsage: 'low' as const, punctuation: 'standard' as const }
                    }
                ],
                messages: [
                    { id: Date.now() + index, nickname: 'system', content: `You have joined ${name}`, timestamp: new Date(), type: 'system' }
                ],
                operators: [] // New channels start with no operators
            };
        });
};


/**
 * Initializes the application state from a saved or new configuration.
 * @param config The AppConfig object.
 * @returns An object containing the initialized nickname, users, and channels.
 */
export const initializeStateFromConfig = (config: AppConfig) => {
    const nickname = config.currentUserNickname || DEFAULT_NICKNAME;
    // Use userObjects if available (for proper persistence), otherwise fall back to text parsing
    const virtualUsers = config.userObjects || (config.virtualUsers ? parseVirtualUsers(config.virtualUsers) : DEFAULT_VIRTUAL_USERS);
    
    // Use channel objects if available (preserves user assignments), otherwise parse from text
    let channels: Channel[];
    if (config.channelObjects && config.channelObjects.length > 0) {
        // Use saved channel objects to preserve user assignments
        channels = config.channelObjects.map(c => ({
            ...c,
            users: c.users.map(user => 
                user.nickname === DEFAULT_NICKNAME ? {
                    nickname, 
                    status: 'online' as const,
                    personality: 'The human user',
                    languageSkills: { 
                        languages: [{
                            language: 'English',
                            fluency: 'native' as const,
                            accent: ''
                        }]
                    },
                    writingStyle: { formality: 'informal' as const, verbosity: 'neutral' as const, humor: 'none' as const, emojiUsage: 'low' as const, punctuation: 'standard' as const }
                } : user
            )
        }));
    } else if (config.channels && config.channels.trim()) {
        channels = parseChannels(config.channels, virtualUsers, nickname);
    } else {
        // Use default channels but ensure they have the correct current user nickname
        channels = DEFAULT_CHANNELS.map(c => ({
            ...c,
            users: [
                { 
                    nickname, 
                    status: 'online' as const,
                    personality: 'The human user',
                    languageSkills: { 
                        languages: [{
                            language: 'English',
                            fluency: 'native' as const,
                            accent: ''
                        }]
                    },
                    writingStyle: { formality: 'informal' as const, verbosity: 'neutral' as const, humor: 'none' as const, emojiUsage: 'low' as const, punctuation: 'standard' as const }
                },
                ...c.users.filter(u => u.nickname !== DEFAULT_NICKNAME) // Keep original channel users, just update current user
            ]
        }));
    }
    
    const simulationSpeed = config.simulationSpeed || 'normal';
    const aiModel = config.aiModel || 'gemini-2.5-flash';
    const typingDelay = config.typingDelay || DEFAULT_TYPING_DELAY;

    return { nickname, virtualUsers, channels, simulationSpeed, aiModel, typingDelay };
};

/**
 * Saves channel logs to localStorage.
 * @param channels Array of Channel objects to save.
 */
export const saveChannelLogs = (channels: Channel[]) => {
  try {
    // Convert Date objects to strings for JSON serialization
    const serializedChannels = channels.map(channel => ({
      ...channel,
      messages: channel.messages.map(message => ({
        ...message,
        timestamp: message.timestamp instanceof Date 
          ? message.timestamp.toISOString() 
          : new Date(message.timestamp).toISOString()
      }))
    }));
    
    localStorage.setItem(CHANNEL_LOGS_STORAGE_KEY, JSON.stringify(serializedChannels));
  } catch (error) {
    console.error("Failed to save channel logs to localStorage:", error);
  }
};

/**
 * Loads channel logs from localStorage.
 * @returns Array of Channel objects or null if none found.
 */
export const loadChannelLogs = (): Channel[] | null => {
  try {
    const savedLogs = localStorage.getItem(CHANNEL_LOGS_STORAGE_KEY);
    if (!savedLogs) return null;
    
    const parsedChannels = JSON.parse(savedLogs);
    
    // Convert timestamp strings back to Date objects
    return parsedChannels.map((channel: any) => ({
      ...channel,
      messages: channel.messages.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }))
    }));
  } catch (error) {
    console.error("Failed to load channel logs from localStorage:", error);
    return null;
  }
};

/**
 * Clears all saved channel logs from localStorage.
 */
export const clearChannelLogs = () => {
  try {
    localStorage.removeItem(CHANNEL_LOGS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear channel logs from localStorage:", error);
  }
};

/**
 * Generates a random typing delay to simulate human typing time.
 * @param messageLength The length of the message being typed
 * @param config Optional typing delay configuration
 * @returns Promise that resolves after the calculated delay
 */
export const simulateTypingDelay = async (
  messageLength: number, 
  config?: { enabled: boolean; baseDelay: number; maxDelay: number }
): Promise<void> => {
  // Use provided config or defaults
  const typingConfig = config || DEFAULT_TYPING_DELAY;
  
  // If typing delay is disabled, return immediately
  if (!typingConfig.enabled) {
    return Promise.resolve();
  }
  
  // Calculate delay based on message length (longer messages take more time to type)
  const lengthFactor = Math.min(messageLength / 100, 3); // Cap at 3x for very long messages
  const randomFactor = 0.5 + Math.random() * 1.5; // Random factor between 0.5 and 2.0
  
  // Calculate final delay: base + (length factor * random factor)
  const calculatedDelay = Math.min(
    typingConfig.baseDelay + (lengthFactor * 500 * randomFactor),
    typingConfig.maxDelay
  );
  
  // Add some randomness to make it feel more natural
  const finalDelay = calculatedDelay + (Math.random() * 500 - 250); // ±250ms variation
  
  return new Promise(resolve => setTimeout(resolve, Math.max(finalDelay, 200))); // Minimum 200ms delay
};