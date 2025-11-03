import type { Channel } from '../types';

export interface ChannelExportData {
  name: string;
  topic: string;
  messageCount: number;
  userCount: number;
}

export const exportChannelsToCSV = (channels: Channel[]): string => {
  const headers = [
    'name',
    'topic',
    'messageCount',
    'userCount'
  ];

  const csvContent = [
    headers.join(','),
    ...channels.map(channel => [
      `"${channel.name}"`,
      `"${channel.topic || ''}"`,
      `"${(channel.messages || []).length}"`,
      `"${(channel.users || []).length}"`
    ].join(','))
  ].join('\n');

  return csvContent;
};

export const importChannelsFromCSV = (csvContent: string): Channel[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  if (lines.length < 2) return [];

  const channels: Channel[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    
    if (values.length < headers.length) continue;

    const channel: Channel = {
      name: values[0] || `#channel${i}`,
      topic: values[1] || 'Imported channel',
      users: [],
      messages: [],
      operators: []
    };

    // Validate channel name format
    if (!channel.name.startsWith('#')) {
      channel.name = '#' + channel.name.replace(/^#/, '');
    }

    channels.push(channel);
  }

  return channels;
};

export const exportChannelsToJSON = (channels: Channel[]): string => {
  // Full export of channel data, including users and messages.
  // JSON.stringify will automatically convert Date objects to ISO 8601 strings.
  return JSON.stringify(channels, null, 2);
};

export const importChannelsFromJSON = (jsonContent: string): Channel[] => {
  try {
    const data = JSON.parse(jsonContent);
    
    if (Array.isArray(data)) {
      return data.map((channelData: any) => {
        // Reconstruct message objects with Date objects
        const messages = (channelData.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          ...(msg.quotedMessage && {
            quotedMessage: {
              ...msg.quotedMessage,
              timestamp: new Date(msg.quotedMessage.timestamp)
            }
          })
        }));

        const channel: Channel = {
          name: channelData.name || `#channel${Math.random().toString(36).substr(2, 9)}`,
          topic: channelData.topic || 'Imported channel',
          users: channelData.users || [],
          messages: messages,
          operators: channelData.operators || [],
          dominantLanguage: channelData.dominantLanguage
        };

        // Validate channel name format
        if (!channel.name.startsWith('#')) {
          channel.name = '#' + channel.name.replace(/^#/, '');
        }

        return channel;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
};

const generateHTMLHeader = (title: string): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #e0e0e0; margin: 0; padding: 2rem; }
      .container { max-width: 800px; margin: auto; background-color: #1e1e1e; border-radius: 8px; padding: 2rem; border: 1px solid #333; }
      h1, h2, h3 { color: #fff; border-bottom: 2px solid #444; padding-bottom: 0.5rem; }
      .message { margin-bottom: 1rem; padding: 1rem; border-radius: 6px; border: 1px solid #2c2c2c; background-color: #252525; }
      .message.highlight { background-color: #3a3a3a; border-color: #555; }
      .meta { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
      .nick { font-weight: bold; }
      .content { white-space: pre-wrap; word-wrap: break-word; }
      .channel-section { margin-bottom: 3rem; }
    </style>
  </head>
  <body>
    <div class="container">
`;

const generateHTMLFooter = (): string => `
    </div>
  </body>
  </html>
`;

export const exportChannelToHTML = (channel: Channel, currentUserNickname: string): string => {
  let messagesHTML = (channel.messages || []).map(msg => {
    const isCurrentUser = msg.nickname === currentUserNickname;
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const textContent = msg.content.replace(/</g, "<").replace(/>/g, ">");
    return `
      <div class="message ${isCurrentUser ? 'highlight' : ''}">
        <div class="meta">
          <span class="nick">${msg.nickname.replace(/</g, "<").replace(/>/g, ">")}</span>
          <span class="timestamp"> - ${timestamp}</span>
        </div>
        <div class="content">${textContent}</div>
      </div>
    `;
  }).join('');

  if (!messagesHTML) {
    messagesHTML = '<p>No messages in this channel.</p>';
  }

  const channelHTML = `
    <div class="channel-section">
      <h1>Channel: ${channel.name.replace(/</g, "<").replace(/>/g, ">")}</h1>
      <h2>Topic: ${channel.topic ? channel.topic.replace(/</g, "<").replace(/>/g, ">") : 'No topic set'}</h2>
      ${messagesHTML}
    </div>
  `;

  return generateHTMLHeader(`Chat Log - ${channel.name}`) + channelHTML + generateHTMLFooter();
};

export const exportAllChannelsToHTML = (channels: Channel[], currentUserNickname: string): string => {
  const allChannelsHTML = channels.map(channel => {
    let messagesHTML = (channel.messages || []).map(msg => {
      const isCurrentUser = msg.nickname === currentUserNickname;
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const textContent = msg.content.replace(/</g, "<").replace(/>/g, ">");
      return `
        <div class="message ${isCurrentUser ? 'highlight' : ''}">
          <div class="meta">
            <span class="nick">${msg.nickname.replace(/</g, "<").replace(/>/g, ">")}</span>
            <span class="timestamp"> - ${timestamp}</span>
          </div>
          <div class="content">${textContent}</div>
        </div>
      `;
    }).join('');

    if (!messagesHTML) {
      messagesHTML = '<p>No messages in this channel.</p>';
    }

    return `
      <div class="channel-section">
        <h2>Channel: ${channel.name.replace(/</g, "<").replace(/>/g, ">")}</h2>
        <h3>Topic: ${channel.topic ? channel.topic.replace(/</g, "<").replace(/>/g, ">") : 'No topic set'}</h3>
        ${messagesHTML}
      </div>
    `;
  }).join('');

  const mainHTML = `
    <h1>All Channel Chat Logs</h1>
    ${allChannelsHTML}
  `;

  return generateHTMLHeader('All Chat Logs') + mainHTML + generateHTMLFooter();
};
