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
  let result = text;
  
  // Sort by length (longest first) to avoid partial matches
  const sortedEntries = Object.entries(emojiMap).sort((a, b) => b[0].length - a[0].length);
  
  for (const [emoticon, emoji] of sortedEntries) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    result = result.replace(regex, emoji);
  }
  
  return result;
}
