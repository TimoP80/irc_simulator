import type { AppConfig } from '../types.js';
import { sendConfigToMain, onConfigUpdate, notifyConfigChange } from './electronConfigSync.js';

/**
 * Configuration Sync Service
 * Handles syncing configurations across web tabs and between web and Electron
 */

// BroadcastChannel for web cross-tab sync
let broadcastChannel: BroadcastChannel | null = null;

// Listeners for config updates
const configUpdateListeners: Set<(config: AppConfig) => void> = new Set();

// Initialize BroadcastChannel if available
const initializeBroadcastChannel = (): void => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('app-config-sync');
      
      broadcastChannel.onmessage = (event) => {
        console.log('[ConfigSync] Received config update from another tab:', event.data);
        notifyAllListeners(event.data);
      };
      
      console.log('[ConfigSync] BroadcastChannel initialized for cross-tab sync');
    } else {
      console.log('[ConfigSync] BroadcastChannel not available in this browser');
    }
  } catch (error) {
    console.warn('[ConfigSync] Failed to initialize BroadcastChannel:', error);
  }
};

// Initialize Electron config update listener
const initializeElectronListener = (): (() => void) => {
  return onConfigUpdate((config: AppConfig) => {
    console.log('[ConfigSync] Received config update from Electron main process');
    notifyAllListeners(config);
  });
};

// Notify all registered listeners
const notifyAllListeners = (config: AppConfig): void => {
  configUpdateListeners.forEach(listener => {
    try {
      listener(config);
    } catch (error) {
      console.error('[ConfigSync] Error calling config update listener:', error);
    }
  });
};

// Initialize sync service
let electronUnsubscribe: (() => void) | null = null;

export const initializeConfigSync = (): void => {
  console.log('[ConfigSync] Initializing configuration sync service...');
  
  // Initialize web cross-tab sync
  initializeBroadcastChannel();
  
  // Initialize Electron listener
  electronUnsubscribe = initializeElectronListener();
  
  console.log('[ConfigSync] Configuration sync service initialized');
};

/**
 * Broadcast config update to all tabs and Electron
 */
export const broadcastConfigUpdate = async (config: AppConfig): Promise<void> => {
  try {
    console.log('[ConfigSync] Broadcasting config update...');
    
    // Broadcast to other tabs via BroadcastChannel
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(config);
        console.log('[ConfigSync] Config broadcasted to other tabs');
      } catch (error) {
        console.warn('[ConfigSync] Failed to broadcast to other tabs:', error);
      }
    }
    
    // Notify Electron main process
    await notifyConfigChange(config);
    console.log('[ConfigSync] Config update broadcasted successfully');
  } catch (error) {
    console.error('[ConfigSync] Error broadcasting config update:', error);
  }
};

/**
 * Register a listener for config updates
 */
export const onConfigUpdated = (callback: (config: AppConfig) => void): (() => void) => {
  configUpdateListeners.add(callback);
  console.log('[ConfigSync] Config update listener registered');
  
  // Return unsubscribe function
  return () => {
    configUpdateListeners.delete(callback);
    console.log('[ConfigSync] Config update listener unregistered');
  };
};

/**
 * Cleanup sync service
 */
export const cleanupConfigSync = (): void => {
  console.log('[ConfigSync] Cleaning up configuration sync service...');
  
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
  
  if (electronUnsubscribe) {
    electronUnsubscribe();
    electronUnsubscribe = null;
  }
  
  configUpdateListeners.clear();
  console.log('[ConfigSync] Configuration sync service cleaned up');
};

