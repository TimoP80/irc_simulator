import type { User, Channel, Message } from '../types';
import { isPerLanguageFormat, isLegacyFormat } from '../types';

// Helper function to parse CSV line properly handling quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

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
  
  if (lines.length < 2) return [];

  // Parse CSV header
  const headers = parseCSVLine(lines[0]);
  
  const users: User[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < headers.length) continue;

    // Validate and set default values for all required properties
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
        formality: (values[5] as any) || 'neutral',
        verbosity: (values[6] as any) || 'neutral',
        humor: (values[7] as any) || 'none',
        emojiUsage: (values[8] as any) || 'low',
        punctuation: (values[9] as any) || 'standard'
      }
    };

    // Validate that all required properties are properly set
    if (!user.languageSkills) {
      user.languageSkills = {
        fluency: 'native',
        languages: ['English'],
        accent: ''
      };
    }
    
    if (!user.writingStyle) {
      user.writingStyle = {
        formality: 'neutral',
        verbosity: 'neutral',
        humor: 'none',
        emojiUsage: 'low',
        punctuation: 'standard'
      };
    }

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
      return data.map(user => {
        // Handle different languageSkills formats from World Editor
        let languageSkills: User['languageSkills'];
        
        if (Array.isArray(user.languageSkills)) {
          // World Editor format: array of {language, fluency, accent} objects
          languageSkills = {
            languages: user.languageSkills.map((lang: any) => ({
              language: lang.language || 'English',
              fluency: (lang.fluency || 'native').toLowerCase(),
              accent: lang.accent || ''
            }))
          };
        } else if (user.languageSkills && typeof user.languageSkills === 'object') {
          // Check if it's already in per-language format
          if (isPerLanguageFormat(user.languageSkills)) {
            languageSkills = user.languageSkills;
          } else if (isLegacyFormat(user.languageSkills)) {
            // Convert legacy format to per-language format
            languageSkills = {
              languages: user.languageSkills.languages.map(lang => ({
                language: lang,
                fluency: user.languageSkills.fluency,
                accent: user.languageSkills.accent || ''
              }))
            };
          } else {
            // Handle malformed data - try to extract what we can
            const languages = (user.languageSkills as any).languages;
            if (Array.isArray(languages) && languages.length > 0) {
              // If languages is an array of strings, convert to per-language format
              if (typeof languages[0] === 'string') {
                languageSkills = {
                  languages: languages.map((lang: string) => ({
                    language: lang,
                    fluency: 'native',
                    accent: ''
                  }))
                };
              } else {
                // Default fallback
                languageSkills = {
                  languages: [{
                    language: 'English',
                    fluency: 'native',
                    accent: ''
                  }]
                };
              }
            } else {
              // Default fallback
              languageSkills = {
                languages: [{
                  language: 'English',
                  fluency: 'native',
                  accent: ''
                }]
              };
            }
          }
        } else {
          // Default fallback
          languageSkills = {
            languages: [{
              language: 'English',
              fluency: 'native',
              accent: ''
            }]
          };
        }

        // Handle different writingStyle formats from World Editor
        let writingStyle: { formality: string; verbosity: string; humor: string; emojiUsage: string; punctuation: string };
        
        if (user.writingStyle && typeof user.writingStyle === 'object') {
          // Convert World Editor format to Station V format
          const convertFormality = (formality: string) => {
            const mapping: { [key: string]: string } = {
              'Very Informal': 'very_informal',
              'Informal': 'informal',
              'Neutral': 'neutral',
              'Formal': 'formal',
              'Very Formal': 'very_formal'
            };
            return mapping[formality] || 'neutral';
          };

          const convertVerbosity = (verbosity: string) => {
            const mapping: { [key: string]: string } = {
              'Very Terse': 'very_terse',
              'Terse': 'terse',
              'Neutral': 'neutral',
              'Verbose': 'verbose',
              'Very Verbose': 'very_verbose'
            };
            return mapping[verbosity] || 'neutral';
          };

          const convertHumor = (humor: string) => {
            const mapping: { [key: string]: string } = {
              'None': 'none',
              'Dry': 'dry',
              'Sarcastic': 'sarcastic',
              'Witty': 'witty',
              'Slapstick': 'slapstick'
            };
            return mapping[humor] || 'none';
          };

          const convertEmojiUsage = (emojiUsage: string) => {
            const mapping: { [key: string]: string } = {
              'None': 'none',
              'Low': 'low',
              'Medium': 'medium',
              'High': 'high',
              'Excessive': 'excessive'
            };
            return mapping[emojiUsage] || 'low';
          };

          const convertPunctuation = (punctuation: string) => {
            const mapping: { [key: string]: string } = {
              'Minimal': 'minimal',
              'Standard': 'standard',
              'Creative': 'creative',
              'Excessive': 'excessive'
            };
            return mapping[punctuation] || 'standard';
          };

          writingStyle = {
            formality: convertFormality(user.writingStyle.formality || 'Neutral'),
            verbosity: convertVerbosity(user.writingStyle.verbosity || 'Neutral'),
            humor: convertHumor(user.writingStyle.humor || 'None'),
            emojiUsage: convertEmojiUsage(user.writingStyle.emojiUsage || 'Low'),
            punctuation: convertPunctuation(user.writingStyle.punctuation || 'Standard')
          };
        } else {
          // Default fallback
          writingStyle = {
            formality: 'neutral',
            verbosity: 'neutral',
            humor: 'none',
            emojiUsage: 'low',
            punctuation: 'standard'
          };
        }

        // Ensure all required properties exist with defaults
        const importedUser: User = {
          nickname: user.nickname || `user${Math.random().toString(36).substr(2, 9)}`,
          status: 'online' as const,
          personality: user.personality || 'Imported user',
          languageSkills,
          writingStyle
        };

        return importedUser;
      });
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

// HTML Export Functions - Beautiful formatted version
export const exportChannelToHTML = (channel: Channel, currentUserNickname: string): string => {
  console.log('Starting HTML export for channel:', channel.name);
  console.log('Channel messages:', channel.messages);
  console.log('Channel messages count:', channel.messages?.length || 0);
  console.log('Current user nickname:', currentUserNickname);
  
  // Ensure messages array exists
  const channelMessages = channel.messages || [];
  
  // Format messages with proper styling and message types
  const messages = channelMessages.map(msg => {
    try {
      const timestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
      const timeStr = timestamp.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      const isCurrentUser = msg.nickname === currentUserNickname;
      const messageClass = isCurrentUser ? 'message current-user' : 'message';
      const nicknameClass = isCurrentUser ? 'nickname current-user' : 'nickname';
      
      let content = msg.content;
      let messageTypeClass = '';
      
      // Handle different message types
      switch (msg.type) {
        case 'action':
          content = `* ${msg.nickname} ${msg.content}`;
          messageTypeClass = 'action';
          break;
        case 'system':
          content = `*** ${msg.content}`;
          messageTypeClass = 'system';
          break;
        case 'join':
          content = `*** ${msg.nickname} joined the channel`;
          messageTypeClass = 'join';
          break;
        case 'part':
          content = `*** ${msg.nickname} left the channel`;
          messageTypeClass = 'part';
          break;
        case 'quit':
          content = `*** ${msg.nickname} quit IRC`;
          messageTypeClass = 'quit';
          break;
        case 'kick':
          content = `*** ${msg.nickname} was kicked from the channel`;
          messageTypeClass = 'kick';
          break;
        case 'ban':
          content = `*** ${msg.nickname} was banned from the channel`;
          messageTypeClass = 'ban';
          break;
        case 'topic':
          content = `*** Topic changed to: ${msg.content}`;
          messageTypeClass = 'topic';
          break;
        case 'notice':
          content = `-${msg.nickname}- ${msg.content}`;
          messageTypeClass = 'notice';
          break;
        case 'pm':
          content = `[PM] ${msg.content}`;
          messageTypeClass = 'pm';
          break;
        default:
          content = `${msg.nickname}: ${msg.content}`;
          break;
      }
      
      return `
        <div class="${messageClass} ${messageTypeClass}">
          <span class="timestamp">${timeStr}</span>
          <span class="${nicknameClass}">${msg.nickname}</span>
          <span class="content">${content}</span>
        </div>`;
    } catch (error) {
      console.error('Error processing message:', error, msg);
      return `
        <div class="message error">
          <span class="timestamp">${new Date().toLocaleTimeString()}</span>
          <span class="content">*** Error processing message</span>
        </div>`;
    }
  }).join('');
  
  const userList = (channel.users || []).map(u => u.nickname).join(', ');
  const exportDate = new Date().toLocaleString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Station V - ${channel.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: #1a1a1a;
      color: #e0e0e0;
      line-height: 1.4;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #2d2d2d;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, #4a5568, #2d3748);
      padding: 20px;
      border-bottom: 2px solid #4a5568;
    }
    
    .header h1 {
      color: #81c784;
      font-size: 2rem;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .channel-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .info-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 10px;
      border-radius: 4px;
      border-left: 3px solid #81c784;
    }
    
    .info-label {
      font-weight: bold;
      color: #a0a0a0;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      color: #ffffff;
      margin-top: 5px;
      font-size: 1.1rem;
    }
    
    .messages-container {
      padding: 20px;
      max-height: 70vh;
      overflow-y: auto;
      background: #1a1a1a;
    }
    
    .message {
      display: flex;
      margin-bottom: 8px;
      padding: 6px 0;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
    
    .message:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .timestamp {
      color: #666;
      font-size: 0.85rem;
      min-width: 80px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    .nickname {
      font-weight: bold;
      min-width: 120px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    .nickname.current-user {
      color: #81c784;
    }
    
    .content {
      flex: 1;
      word-wrap: break-word;
    }
    
    /* Message type styling */
    .message.action {
      font-style: italic;
      color: #ffb74d;
    }
    
    .message.system {
      color: #f48fb1;
      font-weight: bold;
    }
    
    .message.join {
      color: #81c784;
    }
    
    .message.part, .message.quit {
      color: #e57373;
    }
    
    .message.kick, .message.ban {
      color: #ff8a65;
      font-weight: bold;
    }
    
    .message.topic {
      color: #ba68c8;
    }
    
    .message.notice {
      color: #64b5f6;
    }
    
    .message.pm {
      color: #ffd54f;
    }
    
    .message.error {
      color: #f44336;
      background: rgba(244, 67, 54, 0.1);
    }
    
    .footer {
      background: #2d2d2d;
      padding: 15px 20px;
      border-top: 1px solid #4a5568;
      text-align: center;
      color: #a0a0a0;
      font-size: 0.9rem;
    }
    
    /* Scrollbar styling */
    .messages-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .messages-container::-webkit-scrollbar-track {
      background: #2d2d2d;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
      background: #4a5568;
      border-radius: 4px;
    }
    
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #5a6578;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      
      .header h1 {
        font-size: 1.5rem;
      }
      
      .channel-info {
        grid-template-columns: 1fr;
      }
      
      .message {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .timestamp, .nickname {
        min-width: auto;
        margin-right: 0;
        margin-bottom: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Station V - Virtual IRC Simulator</h1>
      <div class="channel-info">
        <div class="info-item">
          <div class="info-label">Channel</div>
          <div class="info-value">${channel.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Topic</div>
          <div class="info-value">${channel.topic || 'No topic set'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Messages</div>
          <div class="info-value">${channelMessages.length}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Users</div>
          <div class="info-value">${(channel.users || []).length}</div>
        </div>
        <div class="info-item">
          <div class="info-label">User List</div>
          <div class="info-value">${userList || 'No users'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Exported</div>
          <div class="info-value">${exportDate}</div>
        </div>
      </div>
    </div>
    
    <div class="messages-container">
      ${messages || '<div class="message system"><span class="content">*** No messages in this channel</span></div>'}
    </div>
    
    <div class="footer">
      Generated by Station V - Virtual IRC Simulator | ${exportDate}
    </div>
  </div>
</body>
</html>`;
};

export const exportAllChannelsToHTML = (channels: Channel[], currentUserNickname: string): string => {
  console.log('Starting HTML export for all channels, count:', channels.length);
  console.log('Current user nickname:', currentUserNickname);
  
  // Collect all messages from all channels with proper sorting
  const allMessages: Array<{ message: Message; channelName: string; timestamp: Date }> = [];
  
  channels.forEach(channel => {
    const channelMessages = channel.messages || [];
    channelMessages.forEach(message => {
      allMessages.push({
        message,
        channelName: channel.name,
        timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
      });
    });
  });
  
  // Sort messages chronologically
  allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Format messages with proper styling and message types
  const messages = allMessages.map(({ message, channelName }) => {
    try {
      const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);
      const timeStr = timestamp.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      
      const isCurrentUser = message.nickname === currentUserNickname;
      const messageClass = isCurrentUser ? 'message current-user' : 'message';
      const nicknameClass = isCurrentUser ? 'nickname current-user' : 'nickname';
      
      let content = message.content;
      let messageTypeClass = '';
      
      // Handle different message types
      switch (message.type) {
        case 'action':
          content = `* ${message.nickname} ${message.content}`;
          messageTypeClass = 'action';
          break;
        case 'system':
          content = `*** ${message.content}`;
          messageTypeClass = 'system';
          break;
        case 'join':
          content = `*** ${message.nickname} joined the channel`;
          messageTypeClass = 'join';
          break;
        case 'part':
          content = `*** ${message.nickname} left the channel`;
          messageTypeClass = 'part';
          break;
        case 'quit':
          content = `*** ${message.nickname} quit IRC`;
          messageTypeClass = 'quit';
          break;
        case 'kick':
          content = `*** ${message.nickname} was kicked from the channel`;
          messageTypeClass = 'kick';
          break;
        case 'ban':
          content = `*** ${message.nickname} was banned from the channel`;
          messageTypeClass = 'ban';
          break;
        case 'topic':
          content = `*** Topic changed to: ${message.content}`;
          messageTypeClass = 'topic';
          break;
        case 'notice':
          content = `-${message.nickname}- ${message.content}`;
          messageTypeClass = 'notice';
          break;
        case 'pm':
          content = `[PM] ${message.content}`;
          messageTypeClass = 'pm';
          break;
        default:
          content = `${message.nickname}: ${message.content}`;
          break;
      }
      
      return `
        <div class="${messageClass} ${messageTypeClass}">
          <span class="timestamp">${timeStr}</span>
          <span class="channel">[${channelName}]</span>
          <span class="${nicknameClass}">${message.nickname}</span>
          <span class="content">${content}</span>
        </div>`;
    } catch (error) {
      console.error('Error processing message:', error, { message, channelName });
      return `
        <div class="message error">
          <span class="timestamp">${new Date().toLocaleTimeString()}</span>
          <span class="channel">[${channelName}]</span>
          <span class="content">*** Error processing message</span>
        </div>`;
    }
  }).join('');

  const totalMessages = allMessages.length;
  const totalUsers = new Set(channels.flatMap(c => (c.users || []).map(u => u.nickname))).size;
  const channelList = channels.map(c => `${c.name} (${(c.messages || []).length} messages)`).join(', ');
  const exportDate = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Station V - All Channels</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: #1a1a1a;
      color: #e0e0e0;
      line-height: 1.4;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #2d2d2d;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, #4a5568, #2d3748);
      padding: 20px;
      border-bottom: 2px solid #4a5568;
    }
    
    .header h1 {
      color: #81c784;
      font-size: 2rem;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .channel-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .info-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 10px;
      border-radius: 4px;
      border-left: 3px solid #81c784;
    }
    
    .info-label {
      font-weight: bold;
      color: #a0a0a0;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      color: #ffffff;
      margin-top: 5px;
      font-size: 1.1rem;
    }
    
    .messages-container {
      padding: 20px;
      max-height: 70vh;
      overflow-y: auto;
      background: #1a1a1a;
    }
    
    .message {
      display: flex;
      margin-bottom: 8px;
      padding: 6px 0;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
    
    .message:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .timestamp {
      color: #666;
      font-size: 0.85rem;
      min-width: 80px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    .channel {
      color: #64b5f6;
      font-weight: bold;
      min-width: 100px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    .nickname {
      font-weight: bold;
      min-width: 120px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    .nickname.current-user {
      color: #81c784;
    }
    
    .content {
      flex: 1;
      word-wrap: break-word;
    }
    
    /* Message type styling */
    .message.action {
      font-style: italic;
      color: #ffb74d;
    }
    
    .message.system {
      color: #f48fb1;
      font-weight: bold;
    }
    
    .message.join {
      color: #81c784;
    }
    
    .message.part, .message.quit {
      color: #e57373;
    }
    
    .message.kick, .message.ban {
      color: #ff8a65;
      font-weight: bold;
    }
    
    .message.topic {
      color: #ba68c8;
    }
    
    .message.notice {
      color: #64b5f6;
    }
    
    .message.pm {
      color: #ffd54f;
    }
    
    .message.error {
      color: #f44336;
      background: rgba(244, 67, 54, 0.1);
    }
    
    .footer {
      background: #2d2d2d;
      padding: 15px 20px;
      border-top: 1px solid #4a5568;
      text-align: center;
      color: #a0a0a0;
      font-size: 0.9rem;
    }
    
    /* Scrollbar styling */
    .messages-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .messages-container::-webkit-scrollbar-track {
      background: #2d2d2d;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
      background: #4a5568;
      border-radius: 4px;
    }
    
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #5a6578;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      
      .header h1 {
        font-size: 1.5rem;
      }
      
      .channel-info {
        grid-template-columns: 1fr;
      }
      
      .message {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .timestamp, .channel, .nickname {
        min-width: auto;
        margin-right: 0;
        margin-bottom: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Station V - Virtual IRC Simulator</h1>
      <div class="channel-info">
        <div class="info-item">
          <div class="info-label">Channels</div>
          <div class="info-value">${channels.length}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Messages</div>
          <div class="info-value">${totalMessages}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Unique Users</div>
          <div class="info-value">${totalUsers}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Channel List</div>
          <div class="info-value">${channelList || 'No channels'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Exported</div>
          <div class="info-value">${exportDate}</div>
        </div>
      </div>
    </div>
    
    <div class="messages-container">
      ${messages || '<div class="message system"><span class="content">*** No messages in any channel</span></div>'}
    </div>
    
    <div class="footer">
      Generated by Station V - Virtual IRC Simulator | ${exportDate}
    </div>
  </div>
</body>
</html>`;
};
