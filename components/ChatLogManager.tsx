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
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal' | 'compact' | 'webclient'>('modern');

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
    
    try {
      const [channelsData, statsData, storageData] = await Promise.all([
        chatLogService.getAllChannels(),
        chatLogService.getStats(),
        chatLogService.getStorageSize()
      ]);
      
      
      setChannels(channelsData);
      setStats(statsData);
      setStorageInfo(storageData);
      
      // Set initial channel selection - always select a channel if available
      if (channelsData.length > 0) {
        if (currentChannel && channelsData.some(c => c.channelName === currentChannel)) {
          setSelectedChannel(currentChannel);
        } else {
          setSelectedChannel(channelsData[0].channelName);
        }
      } else {
        setSelectedChannel('');
      }
    } catch (error) {
      console.error('Failed to load chat log data:', error);
      setSelectedChannel('');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const loadMessages = async (channelName: string) => {
    // Don't set loading state for message loading to prevent button flashing
    try {
      const messagesData = await chatLogService.getMessages(channelName, 500);
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

  // Template system for different HTML export styles
  const getTemplateStyles = (template: string) => {
    const templates = {
      modern: {
        name: 'Modern Dark',
        description: 'Dark theme with gradients and modern styling',
        styles: `
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #e2e8f0; margin: 0; padding: 20px; line-height: 1.6; min-height: 100vh;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); border: 1px solid #4b5563;
          }
          .header h1 { margin: 0; color: #f8fafc; font-size: 2.5rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
          .channel {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            margin-bottom: 40px; border-radius: 12px; overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); border: 1px solid #4b5563;
          }
          .message {
            margin-bottom: 20px; padding: 15px 20px; border-radius: 10px;
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
            border-left: 5px solid #4b5563; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .message:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }
          .message.ai { border-left-color: #10b981; background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); }
          .message.user { border-left-color: #3b82f6; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }
          .message.system { border-left-color: #f59e0b; background: linear-gradient(135deg, #451a03 0%, #2d1b00 100%); }
          .nickname { font-weight: 700; color: #fbbf24; font-size: 1.1rem; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); }
          .timestamp { color: #94a3b8; font-size: 0.9rem; font-weight: 500; }
          .content { color: #e2e8f0; word-wrap: break-word; font-size: 1rem; line-height: 1.7; }
          .message-image { max-width: 100%; max-height: 400px; height: auto; border-radius: 8px; border: 2px solid #4b5563; margin: 8px 0; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
          .message-image:hover { transform: scale(1.02); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3); border-color: #60a5fa; }
        `
      },
      classic: {
        name: 'Classic Light',
        description: 'Clean light theme with traditional styling',
        styles: `
          * { box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', serif; background: #ffffff; color: #333333;
            margin: 0; padding: 20px; line-height: 1.6; min-height: 100vh;
          }
          .container { max-width: 1000px; margin: 0 auto; }
          .header {
            background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;
            text-align: center; border: 2px solid #dee2e6; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header h1 { margin: 0; color: #212529; font-size: 2.2rem; font-weight: bold; }
          .channel {
            background: #ffffff; margin-bottom: 30px; border-radius: 8px; overflow: hidden;
            border: 1px solid #dee2e6; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .message {
            margin-bottom: 15px; padding: 12px 16px; border-radius: 4px;
            background: #f8f9fa; border-left: 4px solid #6c757d; border: 1px solid #e9ecef;
          }
          .message.ai { border-left-color: #28a745; background: #d4edda; }
          .message.user { border-left-color: #007bff; background: #d1ecf1; }
          .message.system { border-left-color: #ffc107; background: #fff3cd; }
          .nickname { font-weight: bold; color: #495057; font-size: 1rem; }
          .timestamp { color: #6c757d; font-size: 0.85rem; }
          .content { color: #212529; word-wrap: break-word; font-size: 0.95rem; line-height: 1.5; }
          .message-image { max-width: 100%; max-height: 300px; height: auto; border-radius: 4px; border: 1px solid #dee2e6; margin: 6px 0; cursor: pointer; }
        `
      },
      minimal: {
        name: 'Minimal Clean',
        description: 'Ultra-minimal design with focus on content',
        styles: `
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fafafa; color: #2d3748; margin: 0; padding: 40px 20px; line-height: 1.6;
          }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
          .header h1 { margin: 0; color: #1a202c; font-size: 2rem; font-weight: 300; }
          .channel { margin-bottom: 50px; }
          .message {
            margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #f7fafc;
            display: flex; gap: 12px; align-items: flex-start;
          }
          .message-header { display: flex; gap: 8px; align-items: center; min-width: 200px; }
          .nickname { font-weight: 600; color: #2d3748; font-size: 0.9rem; }
          .timestamp { color: #718096; font-size: 0.8rem; }
          .content { color: #4a5568; word-wrap: break-word; font-size: 0.9rem; line-height: 1.5; flex: 1; }
          .message-image { max-width: 200px; height: auto; border-radius: 4px; margin: 4px 0; }
        `
      },
      compact: {
        name: 'Compact Table',
        description: 'Dense table-like layout for maximum information density',
        styles: `
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace; background: #1a1a1a; color: #e0e0e0;
            margin: 0; padding: 10px; line-height: 1.4; font-size: 12px;
          }
          .container { max-width: 1400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; padding: 15px; background: #2d2d2d; border-radius: 4px; }
          .header h1 { margin: 0; color: #ffffff; font-size: 1.5rem; font-weight: bold; }
          .channel { margin-bottom: 25px; background: #2d2d2d; border-radius: 4px; overflow: hidden; }
          .channel-header { background: #404040; padding: 8px 12px; border-bottom: 1px solid #555; }
          .channel-header h2 { margin: 0; color: #ffffff; font-size: 1.1rem; }
          .messages { padding: 8px; }
          .message {
            margin-bottom: 2px; padding: 4px 8px; border-radius: 2px;
            background: #333333; border-left: 2px solid #666; display: flex; gap: 8px;
          }
          .message.ai { border-left-color: #00ff00; background: #1a331a; }
          .message.user { border-left-color: #0080ff; background: #1a1a33; }
          .message.system { border-left-color: #ff8000; background: #331a00; }
          .nickname { font-weight: bold; color: #ffff00; font-size: 11px; min-width: 80px; }
          .timestamp { color: #888; font-size: 10px; min-width: 120px; }
          .content { color: #e0e0e0; word-wrap: break-word; font-size: 11px; flex: 1; }
          .message-image { max-width: 150px; height: auto; border-radius: 2px; margin: 2px 0; }
        `
      },
      webclient: {
        name: 'Web Client Style',
        description: 'Mimics the actual web client interface with colored nicknames',
        styles: `
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1f2937; color: #e5e7eb; margin: 0; padding: 20px; line-height: 1.5;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          .header {
            background: #374151; padding: 20px; border-radius: 8px; margin-bottom: 20px;
            text-align: center; border: 1px solid #4b5563;
          }
          .header h1 { margin: 0; color: #f9fafb; font-size: 1.8rem; font-weight: 600; }
          .header p { margin: 10px 0 0 0; color: #d1d5db; font-size: 0.9rem; }
          .channel {
            background: #1f2937; margin-bottom: 30px; border-radius: 8px;
            border: 1px solid #374151; overflow: hidden;
          }
          .channel-header {
            background: #374151; padding: 15px 20px; border-bottom: 1px solid #4b5563;
          }
          .channel-header h2 { margin: 0; color: #f9fafb; font-size: 1.3rem; font-weight: 600; }
          .channel-header .stats { margin-top: 5px; color: #9ca3af; font-size: 0.85rem; }
          .messages { padding: 20px; background: #1f2937; }
          .message {
            margin-bottom: 8px; display: flex; gap: 16px; align-items: flex-start;
            font-size: 0.875rem; line-height: 1.4;
          }
          .message-header { display: flex; gap: 8px; align-items: center; min-width: 200px; }
          .timestamp {
            color: #6b7280; font-weight: 600; font-size: 0.75rem;
            min-width: 60px; text-align: right; flex-shrink: 0;
          }
          .nickname {
            font-weight: bold; font-size: 0.875rem; margin-right: 8px;
          }
          .content {
            color: #e5e7eb; word-wrap: break-word; white-space: pre-wrap; flex: 1;
          }
          .message-image {
            max-width: 100%; max-height: 300px; height: auto; border-radius: 4px;
            border: 1px solid #4b5563; margin: 8px 0; cursor: pointer;
            transition: opacity 0.2s;
          }
          .message-image:hover { opacity: 0.8; }
          .message-link { color: #60a5fa; text-decoration: underline; }
          .message-link:hover { color: #93c5fd; }
          
          /* System messages */
          .message.system {
            align-items: center; color: #9ca3af; font-style: italic;
          }
          .message.system .content { color: #9ca3af; }
          
          /* Action messages (/me) */
          .message.action .content {
            font-style: italic;
          }
          .message.action .content::before { content: '* '; }
          
          /* Notice messages */
          .message.notice .content {
            color: #fbbf24; font-style: italic;
          }
          .message.notice .content::before { content: '-'; }
          .message.notice .content::after { content: '-'; }
          
          /* Join messages */
          .message.join .content { color: #10b981; }
          .message.join .content::after { content: ' joined the channel'; }
          
          /* Part messages */
          .message.part .content { color: #ef4444; }
          .message.part .content::after { content: ' left the channel'; }
          
          /* Quit messages */
          .message.quit .content { color: #ef4444; }
          .message.quit .content::after { content: ' quit'; }
          
          /* Topic messages */
          .message.topic .content { color: #8b5cf6; }
          .message.topic .content::after { content: ' changed the topic to: '; }
          
          /* Bot messages */
          .message.ai .content {
            background: #374151; padding: 8px; border-radius: 4px;
            border-left: 3px solid #f59e0b; margin-top: 4px;
          }
          .bot-badge {
            background: #92400e; color: #fbbf24; padding: 2px 6px;
            border-radius: 3px; font-size: 0.7rem; font-weight: bold;
            margin-left: 4px;
          }
          
          /* Nickname colors - matching web client */
          .nickname-color-0 { color: #10b981; } /* green-400 */
          .nickname-color-1 { color: #fbbf24; } /* yellow-400 */
          .nickname-color-2 { color: #60a5fa; } /* blue-400 */
          .nickname-color-3 { color: #a78bfa; } /* purple-400 */
          .nickname-color-4 { color: #f472b6; } /* pink-400 */
          .nickname-color-5 { color: #fb923c; } /* orange-400 */
          .nickname-current { color: #22d3ee; } /* cyan-400 */
          .nickname-system { color: #6b7280; } /* gray-500 */
          .nickname-bot { color: #f59e0b; } /* amber-400 */
        `
      }
    };
    return templates[template as keyof typeof templates] || templates.modern;
  };

  const generateHTMLContent = async (channelName?: string, template: string = 'modern') => {
    const exportData = await chatLogService.exportLogs(channelName);
    const sortedData = exportData.sort((a, b) => 
      new Date(a.message.timestamp).getTime() - new Date(b.message.timestamp).getTime()
    );
    
    const templateInfo = getTemplateStyles(template);
    
    // Helper function to render content with links and images
    const renderContent = (content: string, links?: string[], images?: string[]) => {
      let renderedContent = content;
      
      if (images && images.length > 0) {
        images.forEach(imageUrl => {
          const imageRegex = new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          renderedContent = renderedContent.replace(imageRegex, 
            `<div class="image-container">
              <img src="${imageUrl}" alt="Shared image" class="message-image" onclick="window.open('${imageUrl}', '_blank')" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
              <a href="${imageUrl}" target="_blank" class="image-fallback" style="display: none;">${imageUrl}</a>
            </div>`
          );
        });
      }
      
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      renderedContent = renderedContent.replace(urlRegex, (url) => {
        if (images && images.some(img => img === url)) return url;
        return `<a href="${url}" target="_blank" class="message-link">${url}</a>`;
      });
      
      return renderedContent;
    };

    // Group messages by channel
    const channels = new Map<string, typeof sortedData>();
    sortedData.forEach(entry => {
      if (!channels.has(entry.channelName)) {
        channels.set(entry.channelName, []);
      }
      channels.get(entry.channelName)!.push(entry);
    });

    // Generate HTML content based on template
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Log Export - ${channelName || 'All Channels'} (${templateInfo.name})</title>
    <style>${templateInfo.styles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Chat Log Export</h1>
            <p>Station V - Virtual Chat Simulator | ${templateInfo.name} Template</p>
            <div style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">
              <strong>Exported:</strong> ${new Date().toLocaleString()} | 
              <strong>Scope:</strong> ${channelName ? `Channel: #${channelName}` : `All Channels (${channels.size} channels)`} | 
              <strong>Messages:</strong> ${sortedData.length.toLocaleString()}
            </div>
        </div>
`;

    // Add each channel
    channels.forEach((messages, channelName) => {
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.message.timestamp).getTime() - new Date(b.message.timestamp).getTime()
      );
      
      const messageTypes = sortedMessages.reduce((acc, entry) => {
        acc[entry.message.type] = (acc[entry.message.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const typeStats = Object.entries(messageTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(' • ');
      
      htmlContent += `
        <div class="channel">
          <div class="channel-header">
            <h2>#${channelName}</h2>
            <div style="font-size: 0.85rem; margin-top: 5px; opacity: 0.8;">${sortedMessages.length} messages • ${typeStats}</div>
          </div>
          <div class="messages">
`;

      sortedMessages.forEach((entry, index) => {
        const timestamp = new Date(entry.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const renderedContent = renderContent(
          entry.message.content, 
          entry.message.links, 
          entry.message.images
        );
        
        // Generate nickname color class for webclient template
        const getNicknameColorClass = (nickname: string, type: string) => {
          if (template === 'webclient') {
            if (type === 'system') return 'nickname-system';
            if (nickname.endsWith('Bot') || nickname.includes('Bot') || type === 'ai') return 'nickname-bot';
            // Use a simple hash to assign consistent colors
            let hash = 0;
            for (let i = 0; i < nickname.length; i++) {
              hash = ((hash << 5) - hash + nickname.charCodeAt(i)) & 0xffffffff;
            }
            return `nickname-color-${Math.abs(hash) % 6}`;
          }
          return '';
        };
        
        const nicknameColorClass = getNicknameColorClass(entry.message.nickname, entry.message.type);
        
        // For webclient template, use different message structure
        if (template === 'webclient') {
          if (entry.message.type === 'system') {
            htmlContent += `
              <div class="message system" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">-- ${renderedContent}</div>
              </div>
`;
          } else if (entry.message.type === 'action') {
            htmlContent += `
              <div class="message action" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  ${renderedContent}
                </div>
              </div>
`;
          } else if (entry.message.type === 'notice') {
            htmlContent += `
              <div class="message notice" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  ${renderedContent}
                </div>
              </div>
`;
          } else if (entry.message.type === 'join') {
            htmlContent += `
              <div class="message join" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                </div>
              </div>
`;
          } else if (entry.message.type === 'part') {
            htmlContent += `
              <div class="message part" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  ${renderedContent ? ': ' + renderedContent : ''}
                </div>
              </div>
`;
          } else if (entry.message.type === 'quit') {
            htmlContent += `
              <div class="message quit" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  ${renderedContent ? ': ' + renderedContent : ''}
                </div>
              </div>
`;
          } else if (entry.message.type === 'topic') {
            htmlContent += `
              <div class="message topic" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  ${renderedContent}
                </div>
              </div>
`;
          } else if (entry.message.type === 'ai' || entry.message.nickname.endsWith('Bot') || entry.message.nickname.includes('Bot')) {
            htmlContent += `
              <div class="message ai" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  <span class="bot-badge">🤖 BOT</span>
                  <div class="content">${renderedContent}</div>
                </div>
              </div>
`;
          } else {
            // Regular user message
            htmlContent += `
              <div class="message user" data-message-id="${entry.id}" data-index="${index}">
                <span class="timestamp">${timestamp}</span>
                <div class="content">
                  <span class="nickname ${nicknameColorClass}">${entry.message.nickname}</span>
                  <div class="content">${renderedContent}</div>
                </div>
              </div>
`;
          }
        } else {
          // Original template structure for other templates
          const typeIndicator = entry.message.type === 'ai' ? '🤖' : 
                               entry.message.type === 'user' ? '👤' : 
                               entry.message.type === 'system' ? '⚙️' : 
                               entry.message.type === 'action' ? '🎭' : 
                               entry.message.type === 'notice' ? '📢' : 
                               entry.message.type === 'topic' ? '📌' : 
                               entry.message.type === 'join' ? '➕' : 
                               entry.message.type === 'part' ? '➖' : 
                               entry.message.type === 'quit' ? '👋' : '💬';
          
          htmlContent += `
            <div class="message ${entry.message.type}" data-message-id="${entry.id}" data-index="${index}">
              <div class="message-header">
                <span class="nickname">${typeIndicator} ${entry.message.nickname}</span>
                <span class="timestamp">${timestamp}</span>
              </div>
              <div class="content">${renderedContent}</div>
            </div>
`;
        }
      });

      htmlContent += `
          </div>
        </div>
`;
    });

    htmlContent += `
        <div style="text-align: center; margin-top: 40px; padding: 20px; color: #666; border-top: 1px solid #ddd;">
          <p>Generated by Station V - Virtual Chat Simulator</p>
          <p style="margin-top: 10px; font-size: 0.9rem;">Template: ${templateInfo.name} | ${templateInfo.description}</p>
        </div>
      </div>
    </body>
</html>`;

    return htmlContent;
  };

  const handlePreviewHTML = async (channelName?: string) => {
    try {
      const htmlContent = await generateHTMLContent(channelName, selectedTemplate);
      setPreviewContent(htmlContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const handleExportHTML = async (channelName?: string) => {
    try {
      const htmlContent = await generateHTMLContent(channelName, selectedTemplate);
      
      const dataBlob = new Blob([htmlContent], { type: 'text/html' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-logs-${channelName || 'all'}-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.html`;
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

            {/* HTML Export Template Selection */}
            <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-600">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">HTML Export Template</h3>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as any)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm"
              >
                <option value="modern">Modern Dark - Dark theme with gradients</option>
                <option value="classic">Classic Light - Clean light theme</option>
                <option value="minimal">Minimal Clean - Ultra-minimal design</option>
                <option value="compact">Compact Table - Dense table layout</option>
                <option value="webclient">Web Client Style - Mimics actual web client interface</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {getTemplateStyles(selectedTemplate).description}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => selectedChannel && handleExport(selectedChannel)}
                disabled={!selectedChannel || isLoading}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!selectedChannel ? "Select a channel first" : isLoading ? "Loading..." : ""}
              >
                Export Channel (JSON)
              </button>
              <button
                onClick={handleExportAll}
                disabled={isLoading || channels.length === 0}
                className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={channels.length === 0 ? "No channels available" : isLoading ? "Loading..." : ""}
              >
                Export All Channels (JSON)
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
              
              {/* HTML Export with Preview */}
              <div className="border-t border-gray-600 pt-2">
                <div className="text-xs text-gray-400 mb-2 font-semibold">HTML Export ({selectedTemplate})</div>
                <button
                  onClick={() => selectedChannel && handlePreviewHTML(selectedChannel)}
                  disabled={!selectedChannel || isLoading}
                  className="w-full bg-cyan-600 text-white py-2 px-3 rounded text-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                  title={!selectedChannel ? "Select a channel first" : isLoading ? "Loading..." : "Preview HTML export"}
                >
                  Preview Channel (HTML)
                </button>
                <button
                  onClick={() => handlePreviewHTML()}
                  disabled={isLoading || channels.length === 0}
                  className="w-full bg-teal-600 text-white py-2 px-3 rounded text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                  title={channels.length === 0 ? "No channels available" : isLoading ? "Loading..." : "Preview all channels as HTML"}
                >
                  Preview All (HTML)
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
              </div>
              
              <div className="border-t border-gray-600 pt-2">
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

      {/* HTML Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[95vh] overflow-hidden border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">HTML Export Preview - {getTemplateStyles(selectedTemplate).name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([previewContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `chat-logs-preview-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.html`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700"
                >
                  Download Preview
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded text-sm hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={previewContent}
                className="w-full h-full border-0"
                title="HTML Export Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
