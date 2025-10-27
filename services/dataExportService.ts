/**
 * Data Export/Import Service
 * Handles exporting and importing all application data to/from JSON files
 */

import type { AppConfig, Channel, User, PrivateMessageConversation } from '../types';
import { loadConfig, saveConfig } from '../utils/config';
import { getChatLogService } from './chatLogService';
import { getDebugConfig } from '../utils/debugLogger';
import { dataExportDebug } from '../utils/debugLogger';

export interface ExportedData {
  version: string;
  exportDate: string;
  config: AppConfig;
  channels: Channel[];
  privateMessages: Record<string, PrivateMessageConversation>;
  unreadPMUsers: string[];
  unreadChannels: string[];
  activeContext: { type: 'channel' | 'pm'; name: string; with?: string } | null;
  chatLogs: any[];
  debugConfig: any;
}

export class DataExportService {
  private static instance: DataExportService;

  public static getInstance(): DataExportService {
    if (!DataExportService.instance) {
      DataExportService.instance = new DataExportService();
    }
    return DataExportService.instance;
  }

  /**
   * Export all application data to a JSON object
   */
  async exportAllData(): Promise<ExportedData> {
    dataExportDebug.log('Starting data export...');
    
    try {
      // Load configuration
      const config = loadConfig();
      if (!config) {
        throw new Error('No configuration found');
      }

      // Load channel data from localStorage
      const channelData = localStorage.getItem('station-v-channel-logs');
      const channels: Channel[] = channelData ? JSON.parse(channelData) : [];

      // Load private messages
      const pmData = localStorage.getItem('station-v-private-messages');
      const privateMessages: Record<string, PrivateMessageConversation> = pmData ? JSON.parse(pmData) : {};

      // Load unread status
      const unreadPMUsersData = localStorage.getItem('station-v-unread-pm-users');
      const unreadPMUsers: string[] = unreadPMUsersData ? JSON.parse(unreadPMUsersData) : [];

      const unreadChannelsData = localStorage.getItem('station-v-unread-channels');
      const unreadChannels: string[] = unreadChannelsData ? JSON.parse(unreadChannelsData) : [];

      // Load active context
      const activeContextData = localStorage.getItem('station-v-active-context');
      const activeContext = activeContextData ? JSON.parse(activeContextData) : null;

      // Load chat logs from IndexedDB
      const chatLogService = getChatLogService();
      const chatLogs = await chatLogService.exportLogs();

      // Load debug configuration
      const debugConfig = getDebugConfig();

      const exportedData: ExportedData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        config,
        channels,
        privateMessages,
        unreadPMUsers,
        unreadChannels,
        activeContext,
        chatLogs,
        debugConfig
      };

      dataExportDebug.log('Data export completed successfully');
      dataExportDebug.log('Exported data summary:', {
        channels: channels.length,
        privateMessages: Object.keys(privateMessages).length,
        unreadPMUsers: unreadPMUsers.length,
        unreadChannels: unreadChannels.length,
        chatLogs: chatLogs.length,
        hasActiveContext: !!activeContext
      });

      return exportedData;
    } catch (error) {
      dataExportDebug.error('Failed to export data:', error);
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export data to a downloadable JSON file
   */
  async exportToFile(): Promise<void> {
    try {
      const data = await this.exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `station-v-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      dataExportDebug.log('File download initiated');
    } catch (error) {
      dataExportDebug.error('Failed to export to file:', error);
      throw error;
    }
  }

  /**
   * Import data from a JSON file
   */
  async importFromFile(file: File): Promise<void> {
    try {
      dataExportDebug.log('Starting data import from file:', file.name);
      
      const text = await file.text();
      const data: ExportedData = JSON.parse(text);
      
      // Validate data structure
      if (!this.validateExportedData(data)) {
        throw new Error('Invalid data format');
      }
      
      await this.importData(data);
      
      dataExportDebug.log('Data import completed successfully');
    } catch (error) {
      dataExportDebug.error('Failed to import data:', error);
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from a JSON object
   */
  async importData(data: ExportedData): Promise<void> {
    try {
      dataExportDebug.log('Starting data import...');
      
      // Save configuration
      if (data.config) {
        saveConfig(data.config);
        dataExportDebug.log('Configuration saved');
      }
      
      // Save channel data
      if (data.channels && data.channels.length > 0) {
        localStorage.setItem('station-v-channel-logs', JSON.stringify(data.channels));
        dataExportDebug.log('Channel data saved:', data.channels.length, 'channels');
      }
      
      // Save private messages
      if (data.privateMessages) {
        localStorage.setItem('station-v-private-messages', JSON.stringify(data.privateMessages));
        dataExportDebug.log('Private messages saved:', Object.keys(data.privateMessages).length, 'conversations');
      }
      
      // Save unread status
      if (data.unreadPMUsers) {
        localStorage.setItem('station-v-unread-pm-users', JSON.stringify(data.unreadPMUsers));
        dataExportDebug.log('Unread PM users saved:', data.unreadPMUsers.length);
      }
      
      if (data.unreadChannels) {
        localStorage.setItem('station-v-unread-channels', JSON.stringify(data.unreadChannels));
        dataExportDebug.log('Unread channels saved:', data.unreadChannels.length);
      }
      
      // Save active context
      if (data.activeContext) {
        localStorage.setItem('station-v-active-context', JSON.stringify(data.activeContext));
        dataExportDebug.log('Active context saved');
      }
      
      // Save chat logs to IndexedDB
      if (data.chatLogs && data.chatLogs.length > 0) {
        const chatLogService = getChatLogService();
        try {
          for (const log of data.chatLogs) {
            await chatLogService.saveLog(log);
          }
          dataExportDebug.log('Chat logs saved:', data.chatLogs.length, 'logs');
        } catch (error) {
          dataExportDebug.error('Failed to save some chat logs:', error);
          // Continue import even if some logs fail to save
        }
      }
      
      // Save debug configuration
      if (data.debugConfig) {
        localStorage.setItem('station-v-debug-config', JSON.stringify(data.debugConfig));
        dataExportDebug.log('Debug configuration saved');
      }
      
      dataExportDebug.log('Data import completed successfully');
    } catch (error) {
      dataExportDebug.error('Failed to import data:', error);
      throw error;
    }
  }

  /**
   * Validate exported data structure
   */
  private validateExportedData(data: any): data is ExportedData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.exportDate === 'string' &&
      data.config &&
      Array.isArray(data.channels) &&
      typeof data.privateMessages === 'object' &&
      Array.isArray(data.unreadPMUsers) &&
      Array.isArray(data.unreadChannels) &&
      Array.isArray(data.chatLogs)
    );
  }

  /**
   * Clear all application data
   */
  async clearAllData(): Promise<void> {
    try {
      dataExportDebug.log('Clearing all application data...');
      
      // Clear localStorage
      const keysToRemove = [
        'gemini-irc-simulator-config',
        'station-v-channel-logs',
        'station-v-private-messages',
        'station-v-unread-pm-users',
        'station-v-unread-channels',
        'station-v-active-context',
        'station-v-debug-config'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear IndexedDB
      const chatLogService = getChatLogService();
      await chatLogService.clearAllLogs();
      
      dataExportDebug.log('All application data cleared');
    } catch (error) {
      dataExportDebug.error('Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Get data summary for display
   */
  async getDataSummary(): Promise<{
    channels: number;
    privateMessages: number;
    unreadPMUsers: number;
    unreadChannels: number;
    chatLogs: number;
    hasActiveContext: boolean;
    configExists: boolean;
  }> {
    try {
      const config = loadConfig();
      const channelData = localStorage.getItem('station-v-channel-logs');
      const channels: Channel[] = channelData ? JSON.parse(channelData) : [];
      
      const pmData = localStorage.getItem('station-v-private-messages');
      const privateMessages: Record<string, PrivateMessageConversation> = pmData ? JSON.parse(pmData) : {};
      
      const unreadPMUsersData = localStorage.getItem('station-v-unread-pm-users');
      const unreadPMUsers: string[] = unreadPMUsersData ? JSON.parse(unreadPMUsersData) : [];
      
      const unreadChannelsData = localStorage.getItem('station-v-unread-channels');
      const unreadChannels: string[] = unreadChannelsData ? JSON.parse(unreadChannelsData) : [];
      
      const activeContextData = localStorage.getItem('station-v-active-context');
      const activeContext = activeContextData ? JSON.parse(activeContextData) : null;
      
      const chatLogService = getChatLogService();
      const chatLogs = await chatLogService.exportLogs();
      
      return {
        channels: channels.length,
        privateMessages: Object.keys(privateMessages).length,
        unreadPMUsers: unreadPMUsers.length,
        unreadChannels: unreadChannels.length,
        chatLogs: chatLogs.length,
        hasActiveContext: !!activeContext,
        configExists: !!config
      };
    } catch (error) {
      dataExportDebug.error('Failed to get data summary:', error);
      return {
        channels: 0,
        privateMessages: 0,
        unreadPMUsers: 0,
        unreadChannels: 0,
        chatLogs: 0,
        hasActiveContext: false,
        configExists: false
      };
    }
  }
}

// Export singleton instance
export const getDataExportService = (): DataExportService => {
  return DataExportService.getInstance();
};
