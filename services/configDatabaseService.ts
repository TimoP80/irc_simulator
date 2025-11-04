import type { AppConfig } from '../types.js';

/**
 * Configuration Database Service
 * Provides unified configuration storage across web and Electron platforms
 * Uses IndexedDB for web and file-based storage for Electron
 */

const DB_NAME = 'station-v-config-db';
const STORE_NAME = 'configurations';
const CONFIG_KEY = 'app-config';

interface ConfigRecord {
  id: string;
  config: AppConfig;
  timestamp: number;
  version: number;
}

/**
 * Check if IndexedDB is available
 */
const isIndexedDBAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.indexedDB;
  } catch {
    return false;
  }
};

/**
 * Initialize IndexedDB database
 */
const initializeIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save configuration to IndexedDB
 */
export const saveConfigToDatabase = async (config: AppConfig): Promise<boolean> => {
  try {
    if (!isIndexedDBAvailable()) {
      console.warn('[ConfigDB] IndexedDB not available, falling back to localStorage');
      return false;
    }

    const db = await initializeIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record: ConfigRecord = {
      id: CONFIG_KEY,
      config,
      timestamp: Date.now(),
      version: 1
    };

    const request = store.put(record);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('[ConfigDB] Failed to save config to IndexedDB:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('[ConfigDB] Config saved to IndexedDB successfully');
        resolve(true);
      };
    });
  } catch (error) {
    console.error('[ConfigDB] Error saving config to IndexedDB:', error);
    return false;
  }
};

/**
 * Load configuration from IndexedDB
 */
export const loadConfigFromDatabase = async (): Promise<AppConfig | null> => {
  try {
    if (!isIndexedDBAvailable()) {
      console.warn('[ConfigDB] IndexedDB not available');
      return null;
    }

    const db = await initializeIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(CONFIG_KEY);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('[ConfigDB] Failed to load config from IndexedDB:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const record = request.result as ConfigRecord | undefined;
        if (record) {
          console.log('[ConfigDB] Config loaded from IndexedDB');
          resolve(record.config);
        } else {
          console.log('[ConfigDB] No config found in IndexedDB');
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('[ConfigDB] Error loading config from IndexedDB:', error);
    return null;
  }
};

/**
 * Clear all configurations from database
 */
export const clearConfigDatabase = async (): Promise<boolean> => {
  try {
    if (!isIndexedDBAvailable()) {
      return false;
    }

    const db = await initializeIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('[ConfigDB] Database cleared successfully');
        resolve(true);
      };
    });
  } catch (error) {
    console.error('[ConfigDB] Error clearing database:', error);
    return false;
  }
};

/**
 * Get database statistics
 */
export const getConfigDatabaseStats = async (): Promise<{
  available: boolean;
  recordCount: number;
  lastModified: number | null;
} | null> => {
  try {
    if (!isIndexedDBAvailable()) {
      return null;
    }

    const db = await initializeIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();
    const getRequest = store.get(CONFIG_KEY);

    return new Promise((resolve, reject) => {
      let recordCount = 0;
      let lastModified: number | null = null;

      countRequest.onerror = () => reject(countRequest.error);
      countRequest.onsuccess = () => {
        recordCount = countRequest.result;
      };

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const record = getRequest.result as ConfigRecord | undefined;
        if (record) {
          lastModified = record.timestamp;
        }
        resolve({
          available: true,
          recordCount,
          lastModified
        });
      };
    });
  } catch (error) {
    console.error('[ConfigDB] Error getting database stats:', error);
    return null;
  }
};

