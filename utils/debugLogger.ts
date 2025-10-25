/**
 * Centralized debug logging system
 * Allows turning off all debug logging for better performance
 */

// Debug logging configuration
interface DebugConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  categories: {
    ai: boolean;
    simulation: boolean;
    network: boolean;
    settings: boolean;
    pm: boolean;
    rateLimiter: boolean;
    urlFilter: boolean;
    userList: boolean;
    join: boolean;
    config: boolean;
    chatLog: boolean;
    ircExport: boolean;
    bot: boolean;
    image: boolean;
    dataExport: boolean;
    app: boolean;
    message: boolean;
    time: boolean;
    input: boolean;
    notification: boolean;
    context: boolean;
    unread: boolean;
    content: boolean;
    media: boolean;
    irc: boolean;
    all: boolean; // Master switch for all categories
  };
}

// Default configuration - debug logging enabled by default
const defaultDebugConfig: DebugConfig = {
  enabled: true,
  level: 'debug',
  categories: {
    ai: true,
    simulation: true,
    network: true,
    settings: true,
    pm: true,
    rateLimiter: true,
    urlFilter: true,
    userList: true,
    join: true,
    config: true,
    chatLog: true,
    ircExport: true,
    bot: true,
    image: true,
    dataExport: true,
    app: true,
    message: true,
    time: true,
    input: true,
    notification: true,
    context: true,
    unread: true,
    content: true,
    media: true,
    irc: true,
    all: true
  }
};

// Load configuration from localStorage or use default
const loadDebugConfig = (): DebugConfig => {
  try {
    const saved = localStorage.getItem('station-v-debug-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultDebugConfig, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load debug config from localStorage:', error);
  }
  return defaultDebugConfig;
};

// Save configuration to localStorage
const saveDebugConfig = (config: DebugConfig) => {
  try {
    localStorage.setItem('station-v-debug-config', JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save debug config to localStorage:', error);
  }
};

// Global debug configuration
let debugConfig = loadDebugConfig();

// Update debug configuration
export const updateDebugConfig = (newConfig: Partial<DebugConfig>) => {
  debugConfig = { ...debugConfig, ...newConfig };
  saveDebugConfig(debugConfig);
  
  // Dispatch event to notify components of config change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debugConfigChanged'));
  }
};

// Get current debug configuration
export const getDebugConfig = (): DebugConfig => debugConfig;

// Reset debug configuration to defaults
export const resetDebugConfig = () => {
  debugConfig = defaultDebugConfig;
  saveDebugConfig(debugConfig);
};

// Disable all debug logging for performance
export const disableAllDebugLogging = () => {
  debugConfig = {
    enabled: false,
    level: 'debug',
    categories: {
      ai: false,
      simulation: false,
      network: false,
      settings: false,
      pm: false,
      rateLimiter: false,
      urlFilter: false,
      userList: false,
      join: false,
      config: false,
      chatLog: false,
      ircExport: false,
      bot: false,
      image: false,
      dataExport: false,
      app: false,
      message: false,
      time: false,
      input: false,
      notification: false,
      context: false,
      unread: false,
      content: false,
      media: false,
      irc: false,
      all: false
    }
  };
  saveDebugConfig(debugConfig);
};

// Enable all debug logging
export const enableAllDebugLogging = () => {
  debugConfig = defaultDebugConfig;
  saveDebugConfig(debugConfig);
};

// Set debug enabled state
export const setDebugEnabled = (enabled: boolean) => {
  debugConfig.enabled = enabled;
  saveDebugConfig(debugConfig);
  
  // Dispatch event to notify components of config change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debugConfigChanged'));
  }
};

// Set log level
export const setLogLevel = (level: 'debug' | 'info' | 'warn' | 'error') => {
  debugConfig.level = level;
  saveDebugConfig(debugConfig);
  
  // Dispatch event to notify components of config change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debugConfigChanged'));
  }
};

// Toggle category
export const toggleCategory = (category: keyof DebugConfig['categories']) => {
  debugConfig.categories[category] = !debugConfig.categories[category];
  saveDebugConfig(debugConfig);
  
  // Dispatch event to notify components of config change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debugConfigChanged'));
  }
};

// Check if debug logging is enabled for a category
const isDebugEnabled = (category: keyof DebugConfig['categories']): boolean => {
  if (!debugConfig.enabled) return false;
  if (debugConfig.categories.all) return true;
  return debugConfig.categories[category];
};

// Debug logger class
class DebugLogger {
  private category: keyof DebugConfig['categories'];

  constructor(category: keyof DebugConfig['categories']) {
    this.category = category;
  }

  log(...args: any[]): void {
    if (isDebugEnabled(this.category)) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (isDebugEnabled(this.category)) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (isDebugEnabled(this.category)) {
      console.error(...args);
    }
  }

  info(...args: any[]): void {
    if (isDebugEnabled(this.category)) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (isDebugEnabled(this.category)) {
      console.debug(...args);
    }
  }
}

// Create debug loggers for different categories
export const aiDebug = new DebugLogger('ai');
export const simulationDebug = new DebugLogger('simulation');
export const networkDebug = new DebugLogger('network');
export const settingsDebug = new DebugLogger('settings');
export const pmDebug = new DebugLogger('pm');
export const rateLimiterDebug = new DebugLogger('rateLimiter');
export const urlFilterDebug = new DebugLogger('urlFilter');
export const userListDebug = new DebugLogger('userList');
export const joinDebug = new DebugLogger('join');
export const configDebug = new DebugLogger('config');
export const chatLogDebug = new DebugLogger('chatLog');
export const ircExportDebug = new DebugLogger('ircExport');
export const botDebug = new DebugLogger('bot');
export const imageDebug = new DebugLogger('image');
export const appDebug = new DebugLogger('app');
export const messageDebug = new DebugLogger('message');
export const timeDebug = new DebugLogger('time');
export const inputDebug = new DebugLogger('input');
export const notificationDebug = new DebugLogger('notification');
export const contextDebug = new DebugLogger('context');
export const unreadDebug = new DebugLogger('unread');
export const contentDebug = new DebugLogger('content');
export const mediaDebug = new DebugLogger('media');
export const ircDebug = new DebugLogger('irc');
export const dataExportDebug = new DebugLogger('dataExport');

// Convenience function to check if any debug logging is enabled
export const isAnyDebugEnabled = (): boolean => {
  return debugConfig.enabled && (
    debugConfig.categories.all || 
    Object.values(debugConfig.categories).some(enabled => enabled)
  );
};

// Performance monitoring
export const performanceDebug = {
  log: (...args: any[]) => {
    if (isDebugEnabled('ai')) {
      console.log('[Performance]', ...args);
    }
  },
  
  time: (label: string) => {
    if (isDebugEnabled('ai')) {
      console.time(`[Performance] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDebugEnabled('ai')) {
      console.timeEnd(`[Performance] ${label}`);
    }
  }
};

// Global functions for easy access from console
if (typeof window !== 'undefined') {
  (window as any).disableAllDebugLogging = disableAllDebugLogging;
  (window as any).enableAllDebugLogging = enableAllDebugLogging;
  (window as any).getDebugConfig = getDebugConfig;
  (window as any).updateDebugConfig = updateDebugConfig;
}