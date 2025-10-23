/**
 * Chat Log Service - Lightweight database for storing chat logs using IndexedDB
 * Provides persistent storage for messages, channels, and user data
 */

export interface ChatLogEntry {
  id: string;
  channelName: string;
  message: {
    id: number;
    nickname: string;
    content: string;
    timestamp: Date;
    type: 'system' | 'user' | 'ai' | 'pm' | 'action' | 'notice' | 'topic' | 'kick' | 'ban' | 'join' | 'part' | 'quit';
    command?: string;
    target?: string;
  };
  createdAt: Date;
}

export interface ChannelLog {
  channelName: string;
  messageCount: number;
  lastActivity: Date;
  firstMessage: Date;
}

export interface LogStats {
  totalMessages: number;
  totalChannels: number;
  oldestMessage: Date | null;
  newestMessage: Date | null;
  messagesByType: Record<string, number>;
}

class ChatLogService {
  private dbName = 'StationVChatLogs';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Chat log database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('channelName', 'channelName', { unique: false });
          messageStore.createIndex('timestamp', 'message.timestamp', { unique: false });
          messageStore.createIndex('messageType', 'message.type', { unique: false });
        }

        // Create channels store for metadata
        if (!db.objectStoreNames.contains('channels')) {
          const channelStore = db.createObjectStore('channels', { keyPath: 'channelName' });
          channelStore.createIndex('lastActivity', 'lastActivity', { unique: false });
        }

        console.log('Database schema created');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  async saveMessage(channelName: string, message: any): Promise<void> {
    const db = await this.ensureDB();
    
    const logEntry: ChatLogEntry = {
      id: `${channelName}-${message.id}-${Date.now()}`,
      channelName,
      message: {
        ...message,
        timestamp: new Date(message.timestamp)
      },
      createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages', 'channels'], 'readwrite');
      const messageStore = transaction.objectStore('messages');
      const channelStore = transaction.objectStore('channels');

      // Save message
      const messageRequest = messageStore.put(logEntry);
      messageRequest.onsuccess = () => {
        // Update channel metadata
        this.updateChannelMetadata(channelStore, channelName, message.timestamp)
          .then(() => resolve())
          .catch(reject);
      };
      messageRequest.onerror = () => reject(messageRequest.error);
    });
  }

  private async updateChannelMetadata(channelStore: IDBObjectStore, channelName: string, messageTimestamp: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const getRequest = channelStore.get(channelName);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        const now = new Date();
        
        const channelData: ChannelLog = {
          channelName,
          messageCount: (existing?.messageCount || 0) + 1,
          lastActivity: now,
          firstMessage: existing?.firstMessage || now
        };

        const putRequest = channelStore.put(channelData);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async updateChannelMetadataStandalone(channelName: string, messageCount: number, lastActivity: Date): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['channels'], 'readwrite');
      const channelStore = transaction.objectStore('channels');
      
      const getRequest = channelStore.get(channelName);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        
        const channelData: ChannelLog = {
          channelName,
          messageCount,
          lastActivity,
          firstMessage: existing?.firstMessage || lastActivity
        };

        const putRequest = channelStore.put(channelData);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getMessages(channelName: string, limit: number = 100, offset: number = 0): Promise<ChatLogEntry[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('channelName');
      const range = IDBKeyRange.only(channelName);
      
      const request = index.openCursor(range, 'prev'); // Most recent first
      const results: ChatLogEntry[] = [];
      let count = 0;
      let skipped = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllChannels(): Promise<ChannelLog[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['channels'], 'readonly');
      const store = transaction.objectStore('channels');
      const request = store.getAll();

      request.onsuccess = () => {
        const channels = request.result.sort((a, b) => 
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );
        resolve(channels);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getStats(): Promise<LogStats> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();

      request.onsuccess = () => {
        const messages = request.result;
        const stats: LogStats = {
          totalMessages: messages.length,
          totalChannels: new Set(messages.map(m => m.channelName)).size,
          oldestMessage: null,
          newestMessage: null,
          messagesByType: {}
        };

        if (messages.length > 0) {
          const timestamps = messages.map(m => new Date(m.message.timestamp));
          stats.oldestMessage = new Date(Math.min(...timestamps.map(t => t.getTime())));
          stats.newestMessage = new Date(Math.max(...timestamps.map(t => t.getTime())));

          messages.forEach(m => {
            const type = m.message.type;
            stats.messagesByType[type] = (stats.messagesByType[type] || 0) + 1;
          });
        }

        resolve(stats);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearChannel(channelName: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const messageStore = transaction.objectStore('messages');
      
      const index = messageStore.index('channelName');
      const range = IDBKeyRange.only(channelName);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Keep channel metadata but update it to reflect empty state
          this.updateChannelMetadataStandalone(channelName, 0, new Date()).then(() => {
            resolve();
          }).catch(reject);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllLogs(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages', 'channels'], 'readwrite');
      const messageStore = transaction.objectStore('messages');
      const channelStore = transaction.objectStore('channels');
      
      const clearMessages = messageStore.clear();
      const clearChannels = channelStore.clear();

      Promise.all([
        new Promise((res, rej) => {
          clearMessages.onsuccess = () => res(undefined);
          clearMessages.onerror = () => rej(clearMessages.error);
        }),
        new Promise((res, rej) => {
          clearChannels.onsuccess = () => res(undefined);
          clearChannels.onerror = () => rej(clearChannels.error);
        })
      ]).then(() => resolve()).catch(reject);
    });
  }

  async exportLogs(channelName?: string): Promise<ChatLogEntry[]> {
    if (channelName) {
      return this.getMessages(channelName, 10000); // Large limit for export
    }
    
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();

      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => 
          new Date(a.message.timestamp).getTime() - new Date(b.message.timestamp).getTime()
        );
        resolve(messages);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageSize(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      };
    }
    
    return { used: 0, available: 0 };
  }
}

// Singleton instance
let chatLogService: ChatLogService | null = null;

export const getChatLogService = (): ChatLogService => {
  if (!chatLogService) {
    chatLogService = new ChatLogService();
  }
  return chatLogService;
};

export const initializeChatLogs = async (): Promise<void> => {
  const service = getChatLogService();
  await service.init();
  console.log('Chat log service initialized');
};
