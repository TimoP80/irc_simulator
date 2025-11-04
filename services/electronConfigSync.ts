import type { AppConfig } from '../types.js';

/**
 * Electron Configuration Sync Service
 * Handles IPC communication between renderer and main process for config syncing
 */

// Check if we're in Electron renderer process
const isElectronRenderer = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           !!(window as any).electron?.ipcRenderer;
  } catch {
    return false;
  }
};

/**
 * Send configuration to main process for storage
 */
export const sendConfigToMain = async (config: AppConfig): Promise<boolean> => {
  try {
    if (!isElectronRenderer()) {
      console.log('[ElectronSync] Not in Electron renderer, skipping IPC send');
      return false;
    }

    const electron = (window as any).electron;
    if (!electron?.ipcRenderer) {
      console.warn('[ElectronSync] IPC renderer not available');
      return false;
    }

    console.log('[ElectronSync] Sending config to main process...');
    
    // Use invoke for request-response pattern
    const result = await electron.ipcRenderer.invoke('config:save', config);
    
    if (result.success) {
      console.log('[ElectronSync] Config saved in main process successfully');
      return true;
    } else {
      console.warn('[ElectronSync] Main process failed to save config:', result.error);
      return false;
    }
  } catch (error) {
    console.error('[ElectronSync] Error sending config to main process:', error);
    return false;
  }
};

/**
 * Request configuration from main process
 */
export const requestConfigFromMain = async (): Promise<AppConfig | null> => {
  try {
    if (!isElectronRenderer()) {
      console.log('[ElectronSync] Not in Electron renderer, skipping IPC request');
      return null;
    }

    const electron = (window as any).electron;
    if (!electron?.ipcRenderer) {
      console.warn('[ElectronSync] IPC renderer not available');
      return null;
    }

    console.log('[ElectronSync] Requesting config from main process...');
    
    const config = await electron.ipcRenderer.invoke('config:load');
    
    if (config) {
      console.log('[ElectronSync] Config loaded from main process');
      return config;
    } else {
      console.log('[ElectronSync] No config found in main process');
      return null;
    }
  } catch (error) {
    console.error('[ElectronSync] Error requesting config from main process:', error);
    return null;
  }
};

/**
 * Listen for config updates from main process
 */
export const onConfigUpdate = (callback: (config: AppConfig) => void): (() => void) => {
  try {
    if (!isElectronRenderer()) {
      console.log('[ElectronSync] Not in Electron renderer, skipping listener setup');
      return () => {};
    }

    const electron = (window as any).electron;
    if (!electron?.ipcRenderer) {
      console.warn('[ElectronSync] IPC renderer not available');
      return () => {};
    }

    console.log('[ElectronSync] Setting up config update listener...');
    
    const listener = (_event: any, config: AppConfig) => {
      console.log('[ElectronSync] Received config update from main process');
      callback(config);
    };

    electron.ipcRenderer.on('config:updated', listener);

    // Return unsubscribe function
    return () => {
      electron.ipcRenderer.removeListener('config:updated', listener);
    };
  } catch (error) {
    console.error('[ElectronSync] Error setting up config update listener:', error);
    return () => {};
  }
};

/**
 * Notify main process of config changes for syncing
 */
export const notifyConfigChange = async (config: AppConfig): Promise<void> => {
  try {
    if (!isElectronRenderer()) {
      return;
    }

    const electron = (window as any).electron;
    if (!electron?.ipcRenderer) {
      return;
    }

    console.log('[ElectronSync] Notifying main process of config change...');
    
    // Fire and forget - don't wait for response
    electron.ipcRenderer.send('config:changed', config);
  } catch (error) {
    console.error('[ElectronSync] Error notifying main process of config change:', error);
  }
};

