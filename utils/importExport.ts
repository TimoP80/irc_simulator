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
  try {
    console.log('Creating download for file:', filename, 'size:', content.length, 'mimeType:', mimeType);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Download completed successfully');
  } catch (error) {
    console.error('Error in downloadFile:', error);
    throw error;
  }
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

// HTML Export Functions - Simple version for testing
export const exportChannelToHTML = (channel: Channel, currentUserNickname: string): string => {
  console.log('Starting HTML export for channel:', channel.name);
  console.log('Channel messages count:', channel.messages.length);
  console.log('Current user nickname:', currentUserNickname);
  
  // Simple HTML export for testing
  const messages = channel.messages.map(msg => 
    `<div><strong>${msg.nickname}:</strong> ${msg.content}</div>`
  ).join('');
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>Station V - ${channel.name}</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px; }
    .message { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>Station V - ${channel.name}</h1>
  <p>Channel: ${channel.name}</p>
  <p>Topic: ${channel.topic || 'No topic'}</p>
  <p>Messages: ${channel.messages.length}</p>
  <div class="messages">${messages}</div>
</body>
</html>`;
};

export const exportAllChannelsToHTML = (channels: Channel[], currentUserNickname: string): string => {
  console.log('Starting HTML export for all channels, count:', channels.length);
  console.log('Current user nickname:', currentUserNickname);
  
  // Simple HTML export for all channels
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
  
  const messages = allMessages.map(({ message, channelName }) => 
    `<div><strong>[${channelName}] ${message.nickname}:</strong> ${message.content}</div>`
  ).join('');

  const totalMessages = allMessages.length;
  const totalUsers = new Set(channels.flatMap(c => c.users.map(u => u.nickname))).size;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Station V - All Channels</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px; }
    .message { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>Station V - All Channels</h1>
  <p>Channels: ${channels.length}</p>
  <p>Total Messages: ${totalMessages}</p>
  <p>Unique Users: ${totalUsers}</p>
  <div class="messages">${messages}</div>
</body>
</html>`;
};
