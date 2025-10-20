import type { AppConfig, User, Channel } from '../types';
import { DEFAULT_NICKNAME, DEFAULT_VIRTUAL_USERS, DEFAULT_CHANNELS } from '../constants';

const CONFIG_STORAGE_KEY = 'gemini-irc-simulator-config';
const CHANNEL_LOGS_STORAGE_KEY = 'station-v-channel-logs';

/**
 * Loads the application configuration from localStorage.
 * @returns The saved AppConfig or null if none is found.
 */
export const loadConfig = (): AppConfig | null => {
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    return savedConfig ? JSON.parse(savedConfig) : null;
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
                    fluency: 'native' as const,
                    languages: ['English'],
                    accent: ''
                },
                writingStyle: {
                    formality: 'casual' as const,
                    verbosity: 'moderate' as const,
                    humor: 'light' as const,
                    emojiUsage: 'minimal' as const,
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
            const [name, ...topicParts] = line.split(',');
            // Use all configured virtual users for each channel
            // This ensures that all configured users are available in the virtual world
            const usersForChannel = [...allVirtualUsers];

            return {
                name: name.trim(),
                topic: topicParts.join(',').trim(),
                users: [
                    { 
                        nickname: currentUserNickname, 
                        status: 'online' as const,
                        personality: 'The human user',
                        languageSkills: { fluency: 'native' as const, languages: ['English'], accent: '' },
                        writingStyle: { formality: 'casual' as const, verbosity: 'moderate' as const, humor: 'light' as const, emojiUsage: 'minimal' as const, punctuation: 'standard' as const }
                    }, 
                    ...usersForChannel
                ],
                messages: [
                    { id: Date.now() + index, nickname: 'system', content: `You have joined ${name.trim()}`, timestamp: new Date(), type: 'system' }
                ]
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
    const virtualUsers = config.virtualUsers ? parseVirtualUsers(config.virtualUsers) : DEFAULT_VIRTUAL_USERS;
    
    // Always use configured channels if they exist, otherwise use default channels
    let channels: Channel[];
    if (config.channels && config.channels.trim()) {
        channels = parseChannels(config.channels, virtualUsers, nickname);
    } else {
        // Use default channels but ensure they have the correct users and nickname
        channels = DEFAULT_CHANNELS.map(c => ({
            ...c,
            users: [
                { 
                    nickname, 
                    status: 'online' as const,
                    personality: 'The human user',
                    languageSkills: { fluency: 'native' as const, languages: ['English'], accent: '' },
                    writingStyle: { formality: 'casual' as const, verbosity: 'moderate' as const, humor: 'light' as const, emojiUsage: 'minimal' as const, punctuation: 'standard' as const }
                },
                ...virtualUsers
            ]
        }));
    }
    
    const simulationSpeed = config.simulationSpeed || 'normal';
    const aiModel = config.aiModel || 'gemini-2.5-flash';

    return { nickname, virtualUsers, channels, simulationSpeed, aiModel };
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
        timestamp: message.timestamp.toISOString()
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