import React, { useState, useEffect } from 'react';
import { getChatLogService, ChatLogEntry, ChannelLog, LogStats } from '../services/chatLogService';

interface ChatLogManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentChannel?: string;
}

export const ChatLogManager: React.FC<ChatLogManagerProps> = ({ isOpen, onClose, currentChannel }) => {
  const [channels, setChannels] = useState<ChannelLog[]>([]);
  const [messages, setMessages] = useState<ChatLogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number } | null>(null);

  const chatLogService = getChatLogService();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel);
    }
  }, [selectedChannel]);

  const loadData = async () => {
    setIsLoading(true);
    // Clear selection immediately to ensure buttons are disabled during loading
    setSelectedChannel('');
    
    try {
      const [channelsData, statsData, storageData] = await Promise.all([
        chatLogService.getAllChannels(),
        chatLogService.getStats(),
        chatLogService.getStorageSize()
      ]);
      
      setChannels(channelsData);
      setStats(statsData);
      setStorageInfo(storageData);
      
      // Set initial channel selection
      if (currentChannel && channelsData.some(c => c.channelName === currentChannel)) {
        setSelectedChannel(currentChannel);
      } else if (channelsData.length > 0) {
        setSelectedChannel(channelsData[0].channelName);
      } else {
        setSelectedChannel('');
      }
    } catch (error) {
      console.error('Failed to load chat log data:', error);
      setSelectedChannel('');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (channelName: string) => {
    setIsLoading(true);
    try {
      const messagesData = await chatLogService.getMessages(channelName, 100);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChannel = async (channelName: string) => {
    if (!confirm(`Are you sure you want to clear all logs for ${channelName}?`)) {
      return;
    }

    try {
      await chatLogService.clearChannel(channelName);
      
      // Reload data and handle channel selection
      setIsLoading(true);
      try {
        const [channelsData, statsData, storageData] = await Promise.all([
          chatLogService.getAllChannels(),
          chatLogService.getStats(),
          chatLogService.getStorageSize()
        ]);
        
        setChannels(channelsData);
        setStats(statsData);
        setStorageInfo(storageData);
        
        // If we cleared the currently selected channel, select a new one
        if (selectedChannel === channelName) {
          setMessages([]);
          if (channelsData.length > 0) {
            // Select the first available channel
            setSelectedChannel(channelsData[0].channelName);
          } else {
            setSelectedChannel('');
          }
        }
      } catch (error) {
        console.error('Failed to reload data after clearing channel:', error);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to clear channel logs:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL chat logs? This cannot be undone.')) {
      return;
    }

    try {
      await chatLogService.clearAllLogs();
      await loadData();
      setMessages([]);
      setSelectedChannel(''); // Clear selection since all channels are empty
    } catch (error) {
      console.error('Failed to clear all logs:', error);
    }
  };

  const handleExport = async (channelName?: string) => {
    try {
      const exportData = await chatLogService.exportLogs(channelName);
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-logs-${channelName || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const handleExportAll = async () => {
    await handleExport(); // Export all channels
  };

  const handleExportCSV = async (channelName?: string) => {
    try {
      const exportData = await chatLogService.exportLogs(channelName);
      
      // Convert to CSV format
      const csvHeaders = 'Timestamp,Channel,Nickname,Type,Content\n';
      const csvRows = exportData.map(entry => {
        const timestamp = new Date(entry.message.timestamp).toISOString();
        const channel = entry.channelName;
        const nickname = entry.message.nickname;
        const type = entry.message.type;
        const content = entry.message.content.replace(/"/g, '""'); // Escape quotes
        return `"${timestamp}","${channel}","${nickname}","${type}","${content}"`;
      }).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-logs-${channelName || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV logs:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-gray-700">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-gray-900 p-4 border-r border-gray-700 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Chat Logs</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Statistics</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Total Messages: {stats.totalMessages.toLocaleString()}</div>
                  <div>Channels: {stats.totalChannels}</div>
                  {stats.oldestMessage && (
                    <div>Oldest: {formatDate(stats.oldestMessage)}</div>
                  )}
                  {stats.newestMessage && (
                    <div>Newest: {formatDate(stats.newestMessage)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Storage Info */}
            {storageInfo && (
              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Storage</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Used: {formatBytes(storageInfo.used)}</div>
                  <div>Available: {formatBytes(storageInfo.available)}</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(storageInfo.used / storageInfo.available) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Channels */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Channels</h3>
              <div className="space-y-1">
                {channels.map(channel => (
                  <div
                    key={channel.channelName}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedChannel === channel.channelName
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedChannel(channel.channelName)}
                  >
                    <div className="font-medium">{channel.channelName}</div>
                    <div className="text-xs opacity-75">
                      {channel.messageCount} messages
                    </div>
                    <div className="text-xs opacity-50">
                      Last: {formatDate(channel.lastActivity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => selectedChannel && handleExport(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export Channel
              </button>
              <button
                onClick={handleExportAll}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export All Channels
              </button>
              <button
                onClick={() => selectedChannel && handleExportCSV(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export Channel (CSV)
              </button>
              <button
                onClick={() => handleExportCSV()}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2 px-3 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export All (CSV)
              </button>
              <button
                onClick={() => selectedChannel && handleClearChannel(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Channel
              </button>
              <button
                onClick={handleClearAll}
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All Logs
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {selectedChannel ? `Messages in ${selectedChannel}` : 'Select a channel'}
              </h3>
              {selectedChannel && (
                <p className="text-sm text-gray-400">
                  {messages.length} messages shown
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400">Loading...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400">No messages found</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map(entry => (
                    <div key={entry.id} className="bg-gray-700 p-3 rounded border border-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">
                          {formatDate(entry.message.timestamp)}
                        </span>
                        <span className={`text-sm font-bold ${
                          entry.message.type === 'system' ? 'text-gray-500' :
                          entry.message.type === 'ai' ? 'text-green-400' :
                          entry.message.type === 'user' ? 'text-blue-400' :
                          'text-gray-300'
                        }`}>
                          {entry.message.nickname}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({entry.message.type})
                        </span>
                      </div>
                      <div className="text-gray-200 text-sm whitespace-pre-wrap">
                        {entry.message.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
