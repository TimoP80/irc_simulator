// Emoji converter utility
// Converts text emoticons to actual emojis

export const emojiMap: Record<string, string> = {
  ':)': '😊',
  ':-)': '😊',
  ':D': '😃',
  ':-D': '😃',
  ':(': '😢',
  ':-(': '😢',
  ':P': '😛',
  ':-P': '😛',
  ':o': '😮',
  ':-o': '😮',
  ';)': '😉',
  ';-)': '😉',
  ':|': '😐',
  ':-|': '😐',
  ':x': '😷',
  ':-x': '😷',
  ':*': '😘',
  ':-*': '😘',
  ':/': '😕',
  ':-/': '😕',
  ':\\': '😕',
  ':-\\': '😕',
  '>(': '😠',
  '>:-(': '😠',
  'D:': '😱',
  'o_O': '😵',
  'O_O': '😵',
  'o.o': '😵',
  'O.o': '😵',
  '^_^': '😊',
  '^^': '😊',
  'T_T': '😭',
  'T.T': '😭',
  'xD': '😆',
  'XD': '😆',
  '<3': '❤️',
  '</3': '💔',
  '>:)': '😈',
  '>:-)': '😈',
  '>:D': '😈',
  '>:-D': '😈'
};

export function convertEmoticonsToEmojis(text: string): string {
  // URL regex pattern to identify URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split text into parts: URLs and non-URLs
  const parts: Array<{ text: string; isUrl: boolean }> = [];
  let lastIndex = 0;
  let match;
  
  // Find all URLs and create parts array
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isUrl: false
      });
    }
    
    // Add URL
    parts.push({
      text: match[0],
      isUrl: true
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isUrl: false
    });
  }
  
  // If no URLs found, process entire text
  if (parts.length === 0) {
    parts.push({ text, isUrl: false });
  }
  
  // Process each part
  const processedParts = parts.map(part => {
    if (part.isUrl) {
      // Don't process URLs - return as-is
      return part.text;
    } else {
      // Process non-URL text for emoticon conversion
      let result = part.text;
      
      // Sort by length (longest first) to avoid partial matches
      const sortedEntries = Object.entries(emojiMap).sort((a, b) => b[0].length - a[0].length);
      
      for (const [emoticon, emoji] of sortedEntries) {
        // Escape special regex characters
        const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use simple global replacement without word boundaries for emoticons
        const regex = new RegExp(escapedEmoticon, 'g');
        result = result.replace(regex, emoji);
      }
      
      return result;
    }
  });
  
  return processedParts.join('');
}

export function convertEmojisToEmoticons(text: string): string {
  // URL regex pattern to identify URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split text into parts: URLs and non-URLs
  const parts: Array<{ text: string; isUrl: boolean }> = [];
  let lastIndex = 0;
  let match;
  
  // Find all URLs and create parts array
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        isUrl: false
      });
    }
    
    // Add URL
    parts.push({
      text: match[0],
      isUrl: true
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      isUrl: false
    });
  }
  
  // If no URLs found, process entire text
  if (parts.length === 0) {
    parts.push({ text, isUrl: false });
  }
  
  // Process each part
  const processedParts = parts.map(part => {
    if (part.isUrl) {
      // Don't process URLs - return as-is
      return part.text;
    } else {
      // Process non-URL text for emoji to emoticon conversion
      let result = part.text;
      
      // Create reverse mapping from emoji to emoticon
      const reverseMap: Record<string, string> = {};
      for (const [emoticon, emoji] of Object.entries(emojiMap)) {
        reverseMap[emoji] = emoticon;
      }
      
      // Sort by length (longest first) to avoid partial matches
      const sortedEntries = Object.entries(reverseMap).sort((a, b) => b[0].length - a[0].length);
      
      for (const [emoji, emoticon] of sortedEntries) {
        // Use simple global replacement for emojis
        const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        result = result.replace(regex, emoticon);
      }
      
      return result;
    }
  });
  
  return processedParts.join('');
}