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
  const [isInitialized, setIsInitialized] = useState(false);
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
    console.log('[ChatLogManager] loadData called');
    setIsLoading(true);
    
    try {
      const [channelsData, statsData, storageData] = await Promise.all([
        chatLogService.getAllChannels(),
        chatLogService.getStats(),
        chatLogService.getStorageSize()
      ]);
      
      console.log('[ChatLogManager] Loaded data:', { 
        channelsCount: channelsData.length, 
        currentChannel, 
        channels: channelsData.map(c => c.channelName) 
      });
      
      setChannels(channelsData);
      setStats(statsData);
      setStorageInfo(storageData);
      
      // Set initial channel selection - always select a channel if available
      if (channelsData.length > 0) {
        if (currentChannel && channelsData.some(c => c.channelName === currentChannel)) {
          console.log('[ChatLogManager] Selecting current channel:', currentChannel);
          setSelectedChannel(currentChannel);
        } else {
          console.log('[ChatLogManager] Selecting first channel:', channelsData[0].channelName);
          setSelectedChannel(channelsData[0].channelName);
        }
      } else {
        console.log('[ChatLogManager] No channels available');
        setSelectedChannel('');
      }
    } catch (error) {
      console.error('Failed to load chat log data:', error);
      setSelectedChannel('');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      console.log('[ChatLogManager] loadData completed, selectedChannel:', selectedChannel);
    }
  };

  const loadMessages = async (channelName: string) => {
    // Don't set loading state for message loading to prevent button flashing
    console.log('[ChatLogManager] loadMessages called for channel:', channelName);
    try {
      const messagesData = await chatLogService.getMessages(channelName, 500);
      console.log('[ChatLogManager] Loaded messages:', messagesData.length, 'for channel:', channelName);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
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

  const handleExportHTML = async (channelName?: string) => {
    try {
      const exportData = await chatLogService.exportLogs(channelName);
      
      // Helper function to render content with links and images
      const renderContent = (content: string, links?: string[], images?: string[]) => {
        let renderedContent = content;
        
        // Replace image URLs with img tags
        if (images && images.length > 0) {
          images.forEach(imageUrl => {
            const imageRegex = new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            renderedContent = renderedContent.replace(imageRegex, 
              `<img src="${imageUrl}" alt="Shared image" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #ccc; margin: 4px 0; cursor: pointer;" onclick="window.open('${imageUrl}', '_blank')" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
               <a href="${imageUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; display: none;">${imageUrl}</a>`
            );
          });
        }
        
        // Replace other URLs with clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        renderedContent = renderedContent.replace(urlRegex, (url) => {
          // Skip if it's already an image
          if (images && images.some(img => img === url)) {
            return url;
          }
          return `<a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: underline;">${url}</a>`;
        });
        
        return renderedContent;
      };

      // Group messages by channel
      const channels = new Map<string, typeof exportData>();
      exportData.forEach(entry => {
        if (!channels.has(entry.channelName)) {
          channels.set(entry.channelName, []);
        }
        channels.get(entry.channelName)!.push(entry);
      });

      // Generate HTML content
      let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Log Export - ${channelName || 'All Channels'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #1f2937;
            color: #e5e7eb;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background-color: #374151;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #f9fafb;
            font-size: 2rem;
        }
        .header p {
            margin: 10px 0 0 0;
            color: #d1d5db;
        }
        .channel {
            background-color: #374151;
            margin-bottom: 30px;
            border-radius: 8px;
            overflow: hidden;
        }
        .channel-header {
            background-color: #4b5563;
            padding: 15px 20px;
            border-bottom: 1px solid #6b7280;
        }
        .channel-header h2 {
            margin: 0;
            color: #f9fafb;
            font-size: 1.5rem;
        }
        .channel-header .stats {
            margin-top: 5px;
            color: #d1d5db;
            font-size: 0.9rem;
        }
        .messages {
            padding: 20px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
            background-color: #2d3748;
            border-left: 4px solid #4b5563;
        }
        .message.system {
            border-left-color: #f59e0b;
            background-color: #451a03;
        }
        .message.user {
            border-left-color: #3b82f6;
            background-color: #1e3a8a;
        }
        .message.ai {
            border-left-color: #10b981;
            background-color: #064e3b;
        }
        .message.action {
            border-left-color: #8b5cf6;
            background-color: #4c1d95;
        }
        .message.notice {
            border-left-color: #f97316;
            background-color: #7c2d12;
        }
        .message.topic {
            border-left-color: #06b6d4;
            background-color: #164e63;
        }
        .message.join, .message.part, .message.quit {
            border-left-color: #6b7280;
            background-color: #374151;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .nickname {
            font-weight: bold;
            color: #fbbf24;
        }
        .timestamp {
            color: #9ca3af;
            font-size: 0.85rem;
        }
        .content {
            color: #e5e7eb;
            word-wrap: break-word;
        }
        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid #6b7280;
            margin: 8px 0;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .content img:hover {
            opacity: 0.8;
        }
        .content a {
            color: #60a5fa;
            text-decoration: underline;
        }
        .content a:hover {
            color: #93c5fd;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #9ca3af;
            border-top: 1px solid #4b5563;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Chat Log Export</h1>
        <p>Exported on ${new Date().toLocaleString()} | ${channelName ? `Channel: ${channelName}` : `All Channels (${channels.size} channels)`}</p>
      </div>
`;

      // Add each channel
      channels.forEach((messages, channelName) => {
        htmlContent += `
      <div class="channel">
        <div class="channel-header">
          <h2>#${channelName}</h2>
          <div class="stats">${messages.length} messages</div>
        </div>
        <div class="messages">
`;

        // Add each message
        messages.forEach(entry => {
          const timestamp = new Date(entry.message.timestamp).toLocaleString();
          const renderedContent = renderContent(
            entry.message.content, 
            entry.message.links, 
            entry.message.images
          );
          
          htmlContent += `
          <div class="message ${entry.message.type}">
            <div class="message-header">
              <span class="nickname">${entry.message.nickname}</span>
              <span class="timestamp">${timestamp}</span>
            </div>
            <div class="content">${renderedContent}</div>
          </div>
`;
        });

        htmlContent += `
        </div>
      </div>
`;
      });

      htmlContent += `
    <div class="footer">
      <p>Generated by Station V - Virtual Chat Simulator</p>
    </div>
  </body>
</html>`;

      const dataBlob = new Blob([htmlContent], { type: 'text/html' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-logs-${channelName || 'all'}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export HTML logs:', error);
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
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[95vh] overflow-hidden border border-gray-700 flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-full lg:w-80 bg-gray-900 p-4 border-r border-gray-700 flex flex-col min-h-0">
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
            <div className="flex-1 overflow-y-auto min-h-0">
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
                title={!selectedChannel ? "Select a channel first" : isLoading ? "Loading..." : ""}
              >
                Export Channel
              </button>
              <button
                onClick={handleExportAll}
                disabled={isLoading || channels.length === 0}
                className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={channels.length === 0 ? "No channels available" : isLoading ? "Loading..." : ""}
              >
                Export All Channels
              </button>
              <button
                onClick={() => selectedChannel && handleExportCSV(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!selectedChannel ? "Select a channel first" : isLoading ? "Loading..." : ""}
              >
                Export Channel (CSV)
              </button>
              <button
                onClick={() => handleExportCSV()}
                disabled={isLoading || channels.length === 0}
                className="w-full bg-indigo-600 text-white py-2 px-3 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={channels.length === 0 ? "No channels available" : isLoading ? "Loading..." : ""}
              >
                Export All (CSV)
              </button>
              <button
                onClick={() => selectedChannel && handleExportHTML(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-orange-600 text-white py-2 px-3 rounded text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!selectedChannel ? "Select a channel first" : isLoading ? "Loading..." : "Export as HTML with images and links"}
              >
                Export Channel (HTML)
              </button>
              <button
                onClick={() => handleExportHTML()}
                disabled={isLoading || channels.length === 0}
                className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={channels.length === 0 ? "No channels available" : isLoading ? "Loading..." : "Export all channels as HTML with images and links"}
              >
                Export All (HTML)
              </button>
              <button
                onClick={() => selectedChannel && handleClearChannel(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!selectedChannel ? "Select a channel first" : isLoading ? "Loading..." : ""}
              >
                Clear Channel
              </button>
              <button
                onClick={handleClearAll}
                disabled={isLoading || channels.length === 0}
                className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={channels.length === 0 ? "No channels available" : isLoading ? "Loading..." : ""}
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

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400">Loading...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400">No messages found</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-full overflow-y-auto">
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
                      <div className="text-gray-200 text-sm whitespace-pre-wrap break-words">
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
