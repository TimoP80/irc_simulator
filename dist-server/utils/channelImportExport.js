export const exportChannelsToCSV = (channels) => {
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
export const importChannelsFromCSV = (csvContent) => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    if (lines.length < 2)
        return [];
    const channels = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        if (values.length < headers.length)
            continue;
        const channel = {
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
export const exportChannelsToJSON = (channels) => {
    // Full export of channel data, including users and messages.
    // JSON.stringify will automatically convert Date objects to ISO 8601 strings.
    return JSON.stringify(channels, null, 2);
};
export const importChannelsFromJSON = (jsonContent) => {
    try {
        const data = JSON.parse(jsonContent);
        if (Array.isArray(data)) {
            return data.map((channelData) => {
                // Reconstruct message objects with Date objects
                const messages = (channelData.messages || []).map((msg) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                    ...(msg.quotedMessage && {
                        quotedMessage: {
                            ...msg.quotedMessage,
                            timestamp: new Date(msg.quotedMessage.timestamp)
                        }
                    })
                }));
                const channel = {
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
    }
    catch (error) {
        console.error('Failed to parse JSON:', error);
        return [];
    }
};
export const downloadFile = (content, filename, mimeType) => {
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
    }
    catch (error) {
        console.error('Error in downloadFile:', error);
        throw error;
    }
};
export const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result);
            }
            else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
