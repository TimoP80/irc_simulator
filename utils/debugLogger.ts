/**
 * Debug logging utility for Station V - Virtual IRC Simulator
 * Provides centralized control over debug logging with different log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  categories: {
    ai: boolean;
    simulation: boolean;
    config: boolean;
    username: boolean;
  };
}

// Default debug configuration
const DEFAULT_CONFIG: DebugConfig = {
  enabled: true,
  level: 'debug',
  categories: {
    ai: true,
    simulation: true,
    config: true,
    username: true
  }
};

// Load configuration from localStorage or use defaults
const loadDebugConfig = (): DebugConfig => {
  try {
    const saved = localStorage.getItem('station-v-debug-config');
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.warn('[Debug Logger] Failed to load debug config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
};

// Save configuration to localStorage
const saveDebugConfig = (config: DebugConfig): void => {
  try {
    localStorage.setItem('station-v-debug-config', JSON.stringify(config));
  } catch (error) {
    console.warn('[Debug Logger] Failed to save debug config to localStorage:', error);
  }
};

// Get current debug configuration
let currentConfig = loadDebugConfig();

// Update debug configuration
export const updateDebugConfig = (updates: Partial<DebugConfig>): void => {
  currentConfig = { ...currentConfig, ...updates };
  saveDebugConfig(currentConfig);
  console.log('[Debug Logger] Debug configuration updated:', currentConfig);
};

// Get current debug configuration
export const getDebugConfig = (): DebugConfig => currentConfig;

// Check if logging is enabled for a category and level
const shouldLog = (category: keyof DebugConfig['categories'], level: LogLevel): boolean => {
  if (!currentConfig.enabled) return false;
  if (!currentConfig.categories[category]) return false;
  
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(currentConfig.level);
  const messageLevelIndex = levels.indexOf(level);
  
  return messageLevelIndex >= currentLevelIndex;
};

// Debug logger class
class DebugLogger {
  private category: keyof DebugConfig['categories'];
  private prefix: string;

  constructor(category: keyof DebugConfig['categories']) {
    this.category = category;
    this.prefix = `[${category.charAt(0).toUpperCase() + category.slice(1)} Debug]`;
  }

  debug(message: string, ...args: any[]): void {
    if (shouldLog(this.category, 'debug')) {
      console.log(`${this.prefix} ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (shouldLog(this.category, 'info')) {
      console.info(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (shouldLog(this.category, 'warn')) {
      console.warn(`${this.prefix} ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (shouldLog(this.category, 'error')) {
      console.error(`${this.prefix} ${message}`, ...args);
    }
  }
}

// Create logger instances for each category
export const aiLogger = new DebugLogger('ai');
export const simulationLogger = new DebugLogger('simulation');
export const configLogger = new DebugLogger('config');
export const usernameLogger = new DebugLogger('username');

// Utility function to enable/disable all debug logging
export const setDebugEnabled = (enabled: boolean): void => {
  updateDebugConfig({ enabled });
};

// Utility function to set log level
export const setLogLevel = (level: LogLevel): void => {
  updateDebugConfig({ level });
};

// Utility function to toggle specific categories
export const toggleCategory = (category: keyof DebugConfig['categories'], enabled: boolean): void => {
  updateDebugConfig({
    categories: {
      ...currentConfig.categories,
      [category]: enabled
    }
  });
};

// Log current debug configuration
console.log('[Debug Logger] Debug logging initialized with config:', currentConfig);
