
import type { AppConfig, User, Channel } from '../types';
import { DEFAULT_NICKNAME, DEFAULT_VIRTUAL_USERS, DEFAULT_CHANNELS } from '../constants';

const CONFIG_STORAGE_KEY = 'gemini-irc-simulator-config';

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
                status: 'online'
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
            // Create a semi-random selection of users for each channel
            const usersForChannel = [...allVirtualUsers]
              .sort(() => 0.5 - Math.random())
              .slice(0, 4 + (index % 3)); 

            return {
                name: name.trim(),
                topic: topicParts.join(',').trim(),
                users: [{ nickname: currentUserNickname, status: 'online' }, ...usersForChannel],
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
    const channels = config.channels ? parseChannels(config.channels, virtualUsers, nickname) : DEFAULT_CHANNELS.map(c => ({
        ...c,
        users: c.users.map(u => u.nickname === DEFAULT_NICKNAME ? { ...u, nickname } : u)
    }));
    const simulationSpeed = config.simulationSpeed || 'normal';

    return { nickname, virtualUsers, channels, simulationSpeed };
};
