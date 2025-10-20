import type { User, Channel, Message } from '../types';

export interface UserExportData {
  nickname: string;
  personality: string;
  fluency: string;
  languages: string;
  accent: string;
  formality: string;
  verbosity: string;
  humor: string;
  emojiUsage: string;
  punctuation: string;
}

export const exportUsersToCSV = (users: User[]): string => {
  const headers = [
    'nickname',
    'personality',
    'fluency',
    'languages',
    'accent',
    'formality',
    'verbosity',
    'humor',
    'emojiUsage',
    'punctuation'
  ];

  const csvContent = [
    headers.join(','),
    ...users.map(user => [
      `"${user.nickname}"`,
      `"${user.personality}"`,
      `"${user.languageSkills.fluency}"`,
      `"${user.languageSkills.languages.join(';')}"`,
      `"${user.languageSkills.accent || ''}"`,
      `"${user.writingStyle.formality}"`,
      `"${user.writingStyle.verbosity}"`,
      `"${user.writingStyle.humor}"`,
      `"${user.writingStyle.emojiUsage}"`,
      `"${user.writingStyle.punctuation}"`
    ].join(','))
  ].join('\n');

  return csvContent;
};

export const importUsersFromCSV = (csvContent: string): User[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  if (lines.length < 2) return [];

  const users: User[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    
    if (values.length < headers.length) continue;

    const user: User = {
      nickname: values[0] || `user${i}`,
      status: 'online',
      personality: values[1] || 'Imported user',
      languageSkills: {
        fluency: (values[2] as any) || 'native',
        languages: values[3] ? values[3].split(';').filter(l => l.trim()) : ['English'],
        accent: values[4] || ''
      },
      writingStyle: {
        formality: (values[5] as any) || 'casual',
        verbosity: (values[6] as any) || 'moderate',
        humor: (values[7] as any) || 'light',
        emojiUsage: (values[8] as any) || 'minimal',
        punctuation: (values[9] as any) || 'standard'
      }
    };

    users.push(user);
  }

  return users;
};

export const exportUsersToJSON = (users: User[]): string => {
  return JSON.stringify(users, null, 2);
};

export const importUsersFromJSON = (jsonContent: string): User[] => {
  try {
    const data = JSON.parse(jsonContent);
    
    if (Array.isArray(data)) {
      return data.map(user => ({
        ...user,
        status: 'online' as const
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// HTML Export Functions
export const exportChannelToHTML = (channel: Channel, currentUserNickname: string): string => {
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatMessage = (message: Message): string => {
    const timestamp = formatTimestamp(message.timestamp);
    const isCurrentUser = message.nickname === currentUserNickname;
    const userClass = isCurrentUser ? 'current-user' : 'other-user';
    
    let messageContent = '';
    let messageClass = 'message';
    
    switch (message.type) {
      case 'system':
        messageClass += ' system-message';
        messageContent = `<span class="system-text">${message.content}</span>`;
        break;
      case 'action':
        messageClass += ' action-message';
        messageContent = `<span class="action-text">* ${message.nickname} ${message.content}</span>`;
        break;
      case 'notice':
        messageClass += ' notice-message';
        messageContent = `<span class="notice-text">-${message.nickname}- ${message.content}</span>`;
        break;
      case 'topic':
        messageClass += ' topic-message';
        messageContent = `<span class="topic-text">${message.nickname} changed the topic to: ${message.content}</span>`;
        break;
      case 'join':
        messageClass += ' join-message';
        messageContent = `<span class="join-text">${message.nickname} joined the channel</span>`;
        break;
      case 'part':
        messageClass += ' part-message';
        messageContent = `<span class="part-text">${message.nickname} left the channel</span>`;
        break;
      case 'quit':
        messageClass += ' quit-message';
        messageContent = `<span class="quit-text">${message.nickname} quit IRC</span>`;
        break;
      case 'kick':
        messageClass += ' kick-message';
        messageContent = `<span class="kick-text">${message.nickname} was kicked by ${message.target}</span>`;
        break;
      case 'ban':
        messageClass += ' ban-message';
        messageContent = `<span class="ban-text">${message.nickname} was banned by ${message.target}</span>`;
        break;
      case 'pm':
        messageClass += ' pm-message';
        messageContent = `<span class="pm-text">[PM] ${message.nickname}: ${message.content}</span>`;
        break;
      default:
        messageContent = message.content;
    }

    return `
      <div class="${messageClass}">
        <span class="timestamp">${timestamp}</span>
        <span class="nickname ${userClass}">${message.nickname}</span>
        <span class="content">${messageContent}</span>
      </div>
    `;
  };

  const messagesHTML = channel.messages.map(formatMessage).join('\n');
  const userList = channel.users.map(user => 
    `<span class="user-item ${user.nickname === currentUserNickname ? 'current-user' : ''}">${user.nickname}</span>`
  ).join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Station V - ${channel.name} Chat Log</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            background-color: #1a1a1a;
            color: #e0e0e0;
            line-height: 1.4;
        }
        
        .header {
            background-color: #2d2d2d;
            padding: 20px;
            border-bottom: 2px solid #404040;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .channel-info {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .info-item {
            background-color: #333;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .info-label {
            color: #888;
            font-weight: bold;
        }
        
        .info-value {
            color: #fff;
        }
        
        .chat-container {
            display: flex;
            height: calc(100vh - 120px);
        }
        
        .messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background-color: #1a1a1a;
        }
        
        .message {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        
        .timestamp {
            color: #666;
            font-size: 12px;
            min-width: 80px;
            flex-shrink: 0;
        }
        
        .nickname {
            font-weight: bold;
            min-width: 120px;
            flex-shrink: 0;
        }
        
        .nickname.current-user {
            color: #4ade80;
        }
        
        .nickname.other-user {
            color: #60a5fa;
        }
        
        .content {
            flex: 1;
            word-wrap: break-word;
        }
        
        .system-message .content {
            color: #fbbf24;
            font-style: italic;
        }
        
        .action-message .content {
            color: #a78bfa;
            font-style: italic;
        }
        
        .notice-message .content {
            color: #fb7185;
        }
        
        .topic-message .content {
            color: #34d399;
            font-weight: bold;
        }
        
        .join-message .content {
            color: #4ade80;
        }
        
        .part-message .content {
            color: #f87171;
        }
        
        .quit-message .content {
            color: #f87171;
        }
        
        .kick-message .content {
            color: #fbbf24;
            font-weight: bold;
        }
        
        .ban-message .content {
            color: #ef4444;
            font-weight: bold;
        }
        
        .pm-message .content {
            color: #a78bfa;
            font-style: italic;
        }
        
        .sidebar {
            width: 250px;
            background-color: #2d2d2d;
            padding: 20px;
            border-left: 2px solid #404040;
        }
        
        .sidebar h3 {
            color: #fff;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .user-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .user-item {
            background-color: #333;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .user-item.current-user {
            background-color: #065f46;
            color: #4ade80;
        }
        
        .footer {
            background-color: #2d2d2d;
            padding: 10px 20px;
            border-top: 2px solid #404040;
            text-align: center;
            color: #888;
            font-size: 12px;
        }
        
        @media (max-width: 768px) {
            .chat-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                border-left: none;
                border-top: 2px solid #404040;
            }
            
            .channel-info {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Station V - Virtual IRC Simulator</h1>
        <div class="channel-info">
            <div class="info-item">
                <span class="info-label">Channel:</span>
                <span class="info-value">${channel.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Topic:</span>
                <span class="info-value">${channel.topic || 'No topic set'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Messages:</span>
                <span class="info-value">${channel.messages.length}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Users:</span>
                <span class="info-value">${channel.users.length}</span>
            </div>
        </div>
    </div>
    
    <div class="chat-container">
        <div class="messages">
            ${messagesHTML}
        </div>
        
        <div class="sidebar">
            <h3>Users (${channel.users.length})</h3>
            <div class="user-list">
                ${userList}
            </div>
        </div>
    </div>
    
    <div class="footer">
        Generated by Station V - Virtual IRC Simulator on ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
};

export const exportAllChannelsToHTML = (channels: Channel[], currentUserNickname: string): string => {
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatMessage = (message: Message, channelName: string): string => {
    const timestamp = formatTimestamp(message.timestamp);
    const isCurrentUser = message.nickname === currentUserNickname;
    const userClass = isCurrentUser ? 'current-user' : 'other-user';
    
    let messageContent = '';
    let messageClass = 'message';
    
    switch (message.type) {
      case 'system':
        messageClass += ' system-message';
        messageContent = `<span class="system-text">${message.content}</span>`;
        break;
      case 'action':
        messageClass += ' action-message';
        messageContent = `<span class="action-text">* ${message.nickname} ${message.content}</span>`;
        break;
      case 'notice':
        messageClass += ' notice-message';
        messageContent = `<span class="notice-text">-${message.nickname}- ${message.content}</span>`;
        break;
      case 'topic':
        messageClass += ' topic-message';
        messageContent = `<span class="topic-text">${message.nickname} changed the topic to: ${message.content}</span>`;
        break;
      case 'join':
        messageClass += ' join-message';
        messageContent = `<span class="join-text">${message.nickname} joined the channel</span>`;
        break;
      case 'part':
        messageClass += ' part-message';
        messageContent = `<span class="part-text">${message.nickname} left the channel</span>`;
        break;
      case 'quit':
        messageClass += ' quit-message';
        messageContent = `<span class="quit-text">${message.nickname} quit IRC</span>`;
        break;
      case 'kick':
        messageClass += ' kick-message';
        messageContent = `<span class="kick-text">${message.nickname} was kicked by ${message.target}</span>`;
        break;
      case 'ban':
        messageClass += ' ban-message';
        messageContent = `<span class="ban-text">${message.nickname} was banned by ${message.target}</span>`;
        break;
      case 'pm':
        messageClass += ' pm-message';
        messageContent = `<span class="pm-text">[PM] ${message.nickname}: ${message.content}</span>`;
        break;
      default:
        messageContent = message.content;
    }

    return `
      <div class="${messageClass}">
        <span class="timestamp">${timestamp}</span>
        <span class="channel">${channelName}</span>
        <span class="nickname ${userClass}">${message.nickname}</span>
        <span class="content">${messageContent}</span>
      </div>
    `;
  };

  // Collect all messages from all channels and sort by timestamp
  const allMessages: Array<{ message: Message; channelName: string; timestamp: Date }> = [];
  
  channels.forEach(channel => {
    channel.messages.forEach(message => {
      allMessages.push({
        message,
        channelName: channel.name,
        timestamp: message.timestamp
      });
    });
  });
  
  allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  const messagesHTML = allMessages.map(({ message, channelName }) => 
    formatMessage(message, channelName)
  ).join('\n');

  const totalMessages = allMessages.length;
  const totalUsers = new Set(channels.flatMap(c => c.users.map(u => u.nickname))).size;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Station V - All Channels Chat Log</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            background-color: #1a1a1a;
            color: #e0e0e0;
            line-height: 1.4;
        }
        
        .header {
            background-color: #2d2d2d;
            padding: 20px;
            border-bottom: 2px solid #404040;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .stat-item {
            background-color: #333;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .stat-label {
            color: #888;
            font-weight: bold;
        }
        
        .stat-value {
            color: #fff;
        }
        
        .messages {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .message {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        
        .timestamp {
            color: #666;
            font-size: 12px;
            min-width: 80px;
            flex-shrink: 0;
        }
        
        .channel {
            color: #888;
            font-size: 12px;
            min-width: 100px;
            flex-shrink: 0;
            font-weight: bold;
        }
        
        .nickname {
            font-weight: bold;
            min-width: 120px;
            flex-shrink: 0;
        }
        
        .nickname.current-user {
            color: #4ade80;
        }
        
        .nickname.other-user {
            color: #60a5fa;
        }
        
        .content {
            flex: 1;
            word-wrap: break-word;
        }
        
        .system-message .content {
            color: #fbbf24;
            font-style: italic;
        }
        
        .action-message .content {
            color: #a78bfa;
            font-style: italic;
        }
        
        .notice-message .content {
            color: #fb7185;
        }
        
        .topic-message .content {
            color: #34d399;
            font-weight: bold;
        }
        
        .join-message .content {
            color: #4ade80;
        }
        
        .part-message .content {
            color: #f87171;
        }
        
        .quit-message .content {
            color: #f87171;
        }
        
        .kick-message .content {
            color: #fbbf24;
            font-weight: bold;
        }
        
        .ban-message .content {
            color: #ef4444;
            font-weight: bold;
        }
        
        .pm-message .content {
            color: #a78bfa;
            font-style: italic;
        }
        
        .footer {
            background-color: #2d2d2d;
            padding: 10px 20px;
            border-top: 2px solid #404040;
            text-align: center;
            color: #888;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Station V - Virtual IRC Simulator</h1>
        <div class="stats">
            <div class="stat-item">
                <span class="stat-label">Channels:</span>
                <span class="stat-value">${channels.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Messages:</span>
                <span class="stat-value">${totalMessages}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Unique Users:</span>
                <span class="stat-value">${totalUsers}</span>
            </div>
        </div>
    </div>
    
    <div class="messages">
        ${messagesHTML}
    </div>
    
    <div class="footer">
        Generated by Station V - Virtual IRC Simulator on ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
};
