import type { AppConfig, User, Channel } from '../types';
import { DEFAULT_NICKNAME, DEFAULT_VIRTUAL_USERS, DEFAULT_CHANNELS, DEFAULT_TYPING_DELAY } from '../constants';

const CONFIG_STORAGE_KEY = 'gemini-irc-simulator-config';
const CHANNEL_LOGS_STORAGE_KEY = 'station-v-channel-logs';

/**
 * Checks localStorage quota and estimates available space
 */
const checkLocalStorageQuota = (): { available: number; used: number; total: number } => {
  try {
    // Estimate total localStorage size
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    
    // Most browsers have 5-10MB limit, we'll assume 5MB for safety
    const estimatedTotal = 5 * 1024 * 1024; // 5MB
    const available = estimatedTotal - totalSize;
    
    return {
      available,
      used: totalSize,
      total: estimatedTotal
    };
  } catch (error) {
    console.warn('Could not check localStorage quota:', error);
    return { available: 0, used: 0, total: 0 };
  }
};

/**
 * Loads the application configuration from localStorage.
 * @returns The saved AppConfig or null if none is found.
 */
export const loadConfig = (): AppConfig | null => {
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    console.log('[Config Debug] loadConfig called, savedConfig exists:', !!savedConfig);
    if (!savedConfig) {
      console.log('[Config Debug] No saved config found, returning null');
      return null;
    }
    
    const parsed = JSON.parse(savedConfig);
    console.log('[Config Debug] Loaded config:', parsed);
    console.log('[Config Debug] Loaded config aiModel:', parsed.aiModel);
    console.log('[Config Debug] Loaded config simulationSpeed:', parsed.simulationSpeed);
    
    const result = {
      ...parsed,
      typingDelay: parsed.typingDelay || DEFAULT_TYPING_DELAY
    };
    
    console.log('[Config Debug] Returning processed config:', result);
    return result;
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
    console.log('[Config Debug] saveConfig called with config:', config);
    console.log('[Config Debug] Config keys:', Object.keys(config));
    console.log('[Config Debug] Config aiModel:', config.aiModel);
    console.log('[Config Debug] Config simulationSpeed:', config.simulationSpeed);
    
    const configString = JSON.stringify(config);
    console.log('[Config Debug] Serialized config length:', configString.length);
    
    localStorage.setItem(CONFIG_STORAGE_KEY, configString);
    console.log('[Config Debug] Config saved successfully to localStorage');
    
    // Verify the save worked
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      console.log('[Config Debug] Config verification successful, saved config exists');
    } else {
      console.error('[Config Debug] Config verification failed, no saved config found');
    }
  } catch (error) {
    console.error("Failed to save config to localStorage:", error);
  }
};

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000; // 2 seconds

const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("429") || 
           error.message.includes("RESOURCE_EXHAUSTED") ||
           error.message.includes("quota") ||
           error.message.includes("rate limit") ||
           error.message.includes("too many requests") ||
           error.message.includes("503") ||
           error.message.includes("overloaded") ||
           error.message.includes("UNAVAILABLE");
  }
  return false;
};

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("NetworkError") || 
           error.message.includes("CORS") || 
           error.message.includes("fetch") ||
           error.message.includes("Failed to fetch");
  }
  return false;
};

/**
 * Wraps an API call with exponential backoff for rate limit errors.
 * @param apiCall The function that returns a promise for the API call.
 * @returns The result of the API call.
 * @throws Throws an error if retries are exhausted or a non-rate-limit error occurs.
 */
export const withRateLimitAndRetries = async <T>(apiCall: () => Promise<T>, context?: string): Promise<T> => {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`[API Error] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed${context ? ` for ${context}` : ''}:`, error);
      
      if (isNetworkError(error)) {
        console.warn(`[API Error] Network/CORS error detected. This may be due to browser security policies.`);
        // For network errors, we don't retry as they're likely persistent
        throw new Error(`Network error: Unable to connect to AI service. This may be due to CORS restrictions or network issues. Please check your internet connection and try again.`);
      }
      
      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        attempt++;
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Provide specific error messages for different types of errors
        if (error instanceof Error) {
          if (error.message.includes("RESOURCE_EXHAUSTED")) {
            throw new Error(`AI service quota exhausted. Please try again later or check your API key limits.`);
          } else if (error.message.includes("quota")) {
            throw new Error(`AI service quota exceeded. Please try again later.`);
          } else if (error.message.includes("429")) {
            throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
          } else if (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("UNAVAILABLE")) {
            throw new Error(`AI service is temporarily overloaded. Please try again in a few moments.`);
          }
        }
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
                userType: 'virtual' as const,
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
                        userType: 'virtual' as const,
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
                    userType: 'virtual' as const,
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
                    userType: 'virtual' as const,
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
    // Check quota before attempting to save
    const quota = checkLocalStorageQuota();
    console.log(`[Config Debug] localStorage quota: ${Math.round(quota.used / 1024)}KB used, ${Math.round(quota.available / 1024)}KB available`);
    
    // Convert Date objects to strings for JSON serialization
    const serializedChannels = channels.map(channel => ({
      ...channel,
      messages: channel.messages.map(message => ({
        ...message,
        timestamp: message.timestamp instanceof Date 
          ? message.timestamp.toISOString() 
          : (() => {
              try {
                const date = new Date(message.timestamp);
                if (isNaN(date.getTime())) {
                  console.warn('Invalid timestamp found, using current time:', message.timestamp);
                  return new Date().toISOString();
                }
                return date.toISOString();
              } catch (error) {
                console.warn('Error parsing timestamp, using current time:', message.timestamp, error);
                return new Date().toISOString();
              }
            })()
      }))
    }));
    
    const dataToSave = JSON.stringify(serializedChannels);
    const dataSize = new Blob([dataToSave]).size;
    
    // Check if data is too large for localStorage
    const maxSize = 4 * 1024 * 1024; // 4MB limit (leave 1MB buffer)
    
    if (dataSize > maxSize || dataSize > quota.available) {
      console.warn(`Channel logs data is too large (${Math.round(dataSize / 1024)}KB), compressing...`);
      
      // Clean up old logs first
      cleanupOldLogs();
      
      // Compress data by limiting message history
      const compressedChannels = channels.map(channel => ({
        ...channel,
        messages: channel.messages.slice(-500) // Keep only last 500 messages per channel
      }));
      
      const compressedData = JSON.stringify(compressedChannels.map(channel => ({
        ...channel,
        messages: channel.messages.map(message => ({
          ...message,
          timestamp: message.timestamp instanceof Date 
            ? message.timestamp.toISOString() 
            : new Date(message.timestamp).toISOString()
        }))
      })));
      
      const compressedSize = new Blob([compressedData]).size;
      console.log(`Compressed data size: ${Math.round(compressedSize / 1024)}KB`);
      
      if (compressedSize > maxSize) {
        console.warn('Data still too large after compression, using ultra-compression...');
        
        // Try with even more aggressive compression
        const ultraCompressedChannels = channels.map(channel => ({
          ...channel,
          messages: channel.messages.slice(-100) // Keep only last 100 messages per channel
        }));
        
        const ultraCompressedData = JSON.stringify(ultraCompressedChannels.map(channel => ({
          ...channel,
          messages: channel.messages.map(message => ({
            ...message,
            timestamp: message.timestamp instanceof Date 
              ? message.timestamp.toISOString() 
              : new Date(message.timestamp).toISOString()
          }))
        })));
        
        localStorage.setItem(CHANNEL_LOGS_STORAGE_KEY, ultraCompressedData);
        console.log('Saved ultra-compressed channel logs');
        return;
      }
      
      localStorage.setItem(CHANNEL_LOGS_STORAGE_KEY, compressedData);
      console.log('Saved compressed channel logs');
      return;
    }
    
    localStorage.setItem(CHANNEL_LOGS_STORAGE_KEY, dataToSave);
    console.log(`Successfully saved channel logs (${Math.round(dataSize / 1024)}KB)`);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, attempting to clear old data and retry...');
      
      // Clear old logs and try again with compressed data
      clearChannelLogs();
      
      try {
        // Try with compressed data
        const compressedChannels = channels.map(channel => ({
          ...channel,
          messages: channel.messages.slice(-200) // Keep only last 200 messages per channel
        }));
        
        const compressedData = JSON.stringify(compressedChannels.map(channel => ({
          ...channel,
          messages: channel.messages.map(message => ({
            ...message,
            timestamp: message.timestamp instanceof Date 
              ? message.timestamp.toISOString() 
              : new Date(message.timestamp).toISOString()
          }))
        })));
        
        localStorage.setItem(CHANNEL_LOGS_STORAGE_KEY, compressedData);
        console.log('Successfully saved compressed channel logs after quota exceeded');
      } catch (retryError) {
        console.error("Failed to save channel logs even after compression:", retryError);
      }
    } else {
      console.error("Failed to save channel logs to localStorage:", error);
    }
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
 * Automatically cleans up old channel logs to prevent quota exceeded errors
 */
export const cleanupOldLogs = () => {
  try {
    const quota = checkLocalStorageQuota();
    const quotaThreshold = 0.8; // Clean up when 80% full
    
    if (quota.used / quota.total > quotaThreshold) {
      console.log('localStorage quota is getting full, cleaning up old logs...');
      
      const savedLogs = localStorage.getItem(CHANNEL_LOGS_STORAGE_KEY);
      if (savedLogs) {
        const channels = JSON.parse(savedLogs);
        
        // Keep only recent messages (last 200 per channel)
        const cleanedChannels = channels.map((channel: any) => ({
          ...channel,
          messages: channel.messages.slice(-200)
        }));
        
        const cleanedData = JSON.stringify(cleanedChannels);
        localStorage.setItem(CHANNEL_LOGS_STORAGE_KEY, cleanedData);
        
        console.log(`Cleaned up old logs, reduced from ${Math.round(quota.used / 1024)}KB to ${Math.round(new Blob([cleanedData]).size / 1024)}KB`);
      }
    }
  } catch (error) {
    console.error("Failed to cleanup old logs:", error);
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