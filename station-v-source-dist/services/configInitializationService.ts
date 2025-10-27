import { AppConfig } from '../types';
import { DEFAULT_NICKNAME, DEFAULT_TYPING_DELAY, DEFAULT_TYPING_INDICATOR } from '../constants';

/**
 * Configuration initialization service for executable builds
 * Handles importing configuration from JSON files and fallback initialization
 */
export class ConfigInitializationService {
  private static instance: ConfigInitializationService;
  private defaultConfig: AppConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigInitializationService {
    if (!ConfigInitializationService.instance) {
      ConfigInitializationService.instance = new ConfigInitializationService();
    }
    return ConfigInitializationService.instance;
  }

  /**
   * Loads default configuration from JSON file
   * @param configPath Path to the default configuration JSON file
   * @returns Promise<AppConfig | null>
   */
  public async loadDefaultConfig(configPath: string = './default-config.json'): Promise<AppConfig | null> {
    try {
      // Try to fetch the default config file
      const response = await fetch(configPath);
      if (!response.ok) {
        console.warn(`[ConfigInit] Could not load default config from ${configPath}:`, response.statusText);
        return null;
      }

      const configData = await response.json();
      console.log('[ConfigInit] Loaded default config from JSON:', configData);
      
      // Validate and normalize the config
      const normalizedConfig = this.normalizeConfig(configData);
      this.defaultConfig = normalizedConfig;
      
      return normalizedConfig;
    } catch (error) {
      console.error('[ConfigInit] Error loading default config:', error);
      return null;
    }
  }

  /**
   * Creates a fallback configuration when no data is available
   * @returns AppConfig with minimal default values
   */
  public createFallbackConfig(): AppConfig {
    console.log('[ConfigInit] Creating fallback configuration');
    
    const fallbackConfig: AppConfig = {
      currentUserNickname: DEFAULT_NICKNAME,
      virtualUsers: `nova, A curious tech-savvy individual who loves gadgets.
seraph, Calm, wise, and often speaks in poetic terms.
jinx, A chaotic, funny, and unpredictable prankster.
rex, Gruff but helpful, an expert in system administration.
luna, An artist who is dreamy, creative, and talks about music.`,
      channels: `#general, General chit-chat about anything and everything.
#tech-talk, Discussing the latest in technology and software.
#random, For off-topic conversations and random thoughts.
#help, Ask for help with the simulator here.`,
      simulationSpeed: 'normal',
      aiModel: 'gemini-1.5-flash',
      typingDelay: DEFAULT_TYPING_DELAY,
      typingIndicator: DEFAULT_TYPING_INDICATOR,
      imageGeneration: {
        provider: 'placeholder',
        apiKey: '',
        model: 'stable-diffusion-xl',
        baseUrl: 'https://api.nanobanana.ai'
      }
    };

    console.log('[ConfigInit] Created fallback config:', fallbackConfig);
    return fallbackConfig;
  }

  /**
   * Gets the best available configuration (saved > default > fallback)
   * @param savedConfig Previously saved configuration from localStorage
   * @returns AppConfig
   */
  public getBestConfig(savedConfig: AppConfig | null): AppConfig {
    if (savedConfig) {
      console.log('[ConfigInit] Using saved configuration');
      return this.normalizeConfig(savedConfig);
    }

    if (this.defaultConfig) {
      console.log('[ConfigInit] Using default configuration from JSON');
      return this.defaultConfig;
    }

    console.log('[ConfigInit] Using fallback configuration');
    return this.createFallbackConfig();
  }

  /**
   * Clean model path by removing any 'models/' prefix
   * @param modelPath The raw model path to clean
   * @returns Cleaned model path string
   */
  private cleanModelPath(modelPath: string): string {
    // Remove 'models/' prefix if it exists
    return modelPath.replace(/^models\//, '');
  }

  /**
   * Normalizes and validates a configuration object
   * @param config Raw configuration object
   * @returns Normalized AppConfig
   */
  private normalizeConfig(config: any): AppConfig {
    const normalized: AppConfig = {
      currentUserNickname: config.currentUserNickname || DEFAULT_NICKNAME,
      virtualUsers: config.virtualUsers || '',
      channels: config.channels || '',
      simulationSpeed: config.simulationSpeed || 'normal',
      // Clean model path when storing in config
      aiModel: this.cleanModelPath(config.aiModel || 'gemini-1.5-flash'),
      typingDelay: config.typingDelay || DEFAULT_TYPING_DELAY,
      typingIndicator: config.typingIndicator || DEFAULT_TYPING_INDICATOR,
      imageGeneration: {
        provider: config.imageGeneration?.provider || 'placeholder',
        apiKey: config.imageGeneration?.apiKey || '',
        // Clean model path for image generation model as well
        model: this.cleanModelPath(config.imageGeneration?.model || 'stable-diffusion-xl'),
        baseUrl: config.imageGeneration?.baseUrl || 'https://api.nanobanana.ai'
      }
    };

    // Add optional fields if they exist
    if (config.userObjects) {
      normalized.userObjects = config.userObjects;
    }
    if (config.channelObjects) {
      normalized.channelObjects = config.channelObjects;
    }

    return normalized;
  }

  /**
   * Initializes configuration for the application
   * This is the main entry point for config initialization
   * @param savedConfig Previously saved configuration
   * @param configPath Path to default config JSON file
   * @returns Promise<AppConfig>
   */
  public async initializeConfig(savedConfig: AppConfig | null, configPath?: string): Promise<AppConfig> {
    console.log('[ConfigInit] Initializing configuration...');
    
    // Try to load default config from JSON if not already loaded
    if (!this.defaultConfig && configPath) {
      await this.loadDefaultConfig(configPath);
    }

    // Get the best available configuration
    const config = this.getBestConfig(savedConfig);
    
    console.log('[ConfigInit] Configuration initialized successfully');
    return config;
  }

  /**
   * Checks if localStorage is available and working
   * @returns boolean
   */
  public isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('[ConfigInit] localStorage not available:', error);
      return false;
    }
  }

  /**
   * Saves configuration to localStorage if available
   * @param config Configuration to save
   * @returns boolean indicating success
   */
  public saveConfig(config: AppConfig): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('[ConfigInit] Cannot save config - localStorage not available');
      return false;
    }

    try {
      localStorage.setItem('station-v-config', JSON.stringify(config));
      console.log('[ConfigInit] Configuration saved to localStorage');
      return true;
    } catch (error) {
      console.error('[ConfigInit] Failed to save configuration:', error);
      return false;
    }
  }

  /**
   * Loads configuration from localStorage if available
   * @returns AppConfig | null
   */
  public loadSavedConfig(): AppConfig | null {
    if (!this.isLocalStorageAvailable()) {
      console.warn('[ConfigInit] Cannot load config - localStorage not available');
      return null;
    }

    try {
      const savedConfig = localStorage.getItem('station-v-config');
      if (!savedConfig) {
        console.log('[ConfigInit] No saved configuration found');
        return null;
      }

      const config = JSON.parse(savedConfig);
      console.log('[ConfigInit] Loaded saved configuration');
      return this.normalizeConfig(config);
    } catch (error) {
      console.error('[ConfigInit] Failed to load saved configuration:', error);
      return null;
    }
  }
}

// Export singleton instance
export const configInitService = ConfigInitializationService.getInstance();
