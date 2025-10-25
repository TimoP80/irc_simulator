import React from 'react';

// Text formatting patterns for IRC-style formatting
const FORMATTING_PATTERNS = {
  // Bold text: **text** or *text*
  bold: /\*\*([^*]+)\*\*|\*([^*]+)\*/g,
  // Italic text: _text_ or /text/
  italic: /_([^_]+)_|\/([^/]+)\//g,
  // Underline text: __text__
  underline: /__([^_]+)__/g,
  // Strikethrough text: ~~text~~
  strikethrough: /~~([^~]+)~~/g,
  // Inline code: `code`
  code: /`([^`]+)`/g,
  // Code block: ```code```
  codeBlock: /```([^`]+)```/g,
  // Spoiler text: ||text||
  spoiler: /\|\|([^|]+)\|\|/g,
  // Color text: {color:text} (limited color support)
  color: /\{([a-z]+):([^}]+)\}/g,
};

// Color mapping for text colors
const COLOR_MAP: { [key: string]: string } = {
  red: 'text-red-400',
  green: 'text-green-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  pink: 'text-pink-400',
  orange: 'text-orange-400',
  cyan: 'text-cyan-400',
  gray: 'text-gray-400',
  white: 'text-white',
  black: 'text-black',
};

// Parse and format text with IRC-style formatting
export const parseFormattedText = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Split text by all formatting patterns while preserving the patterns
  const parts: Array<{ text: string; type: string; content: string }> = [];
  let lastIndex = 0;

  // Find all formatting matches
  const allMatches: Array<{ match: RegExpExecArray; type: string }> = [];
  
  Object.entries(FORMATTING_PATTERNS).forEach(([type, pattern]) => {
    let match;
    const regex = new RegExp(pattern.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({ match, type });
    }
  });

  // Sort matches by position
  allMatches.sort((a, b) => a.match.index! - b.match.index!);

  // Process matches and build parts array
  allMatches.forEach(({ match, type }) => {
    const start = match.index!;
    const end = start + match[0].length;
    
    // Add text before this match
    if (start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, start),
        type: 'text',
        content: text.slice(lastIndex, start)
      });
    }

    // Add the formatted match
    const content = match[1] || match[2] || '';
    parts.push({
      text: match[0],
      type,
      content
    });

    lastIndex = end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  // Render parts as React elements
  return parts.map((part, index) => {
    if (part.type === 'text') {
      return React.createElement('span', { key: index }, part.content);
    }

    switch (part.type) {
      case 'bold':
        return React.createElement('strong', { 
          key: index, 
          className: 'font-bold text-gray-100' 
        }, part.content);
      
      case 'italic':
        return React.createElement('em', { 
          key: index, 
          className: 'italic text-gray-200' 
        }, part.content);
      
      case 'underline':
        return React.createElement('span', { 
          key: index, 
          className: 'underline decoration-gray-400' 
        }, part.content);
      
      case 'strikethrough':
        return React.createElement('span', { 
          key: index, 
          className: 'line-through text-gray-500' 
        }, part.content);
      
      case 'code':
        return React.createElement('code', { 
          key: index, 
          className: 'bg-gray-800 text-green-400 px-1 py-0.5 rounded text-sm font-mono' 
        }, part.content);
      
      case 'codeBlock':
        return React.createElement('pre', { 
          key: index, 
          className: 'bg-gray-800 text-green-400 p-2 rounded text-sm font-mono whitespace-pre-wrap my-2' 
        }, part.content);
      
      case 'spoiler':
        return React.createElement('span', { 
          key: index, 
          className: 'bg-gray-700 text-gray-700 hover:text-gray-200 transition-colors duration-200 cursor-pointer px-1 rounded',
          title: 'Click to reveal spoiler',
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('text-gray-700')) {
              target.classList.remove('text-gray-700');
              target.classList.add('text-gray-200');
            } else {
              target.classList.add('text-gray-700');
              target.classList.remove('text-gray-200');
            }
          }
        }, part.content);
      
      case 'color':
        const colorMatch = part.text.match(/\{([a-z]+):([^}]+)\}/);
        if (colorMatch) {
          const colorName = colorMatch[1];
          const colorText = colorMatch[2];
          const colorClass = COLOR_MAP[colorName] || 'text-gray-200';
          return React.createElement('span', { 
            key: index, 
            className: colorClass 
          }, colorText);
        }
        return React.createElement('span', { key: index }, part.content);
      
      default:
        return React.createElement('span', { key: index }, part.content);
    }
  });
};

// Helper function to check if text contains formatting
export const hasFormatting = (text: string): boolean => {
  return Object.values(FORMATTING_PATTERNS).some(pattern => pattern.test(text));
};

// Helper function to strip formatting from text
export const stripFormatting = (text: string): string => {
  let stripped = text;
  Object.values(FORMATTING_PATTERNS).forEach(pattern => {
    stripped = stripped.replace(pattern, '$1$2'); // Remove formatting markers
  });
  return stripped;
};
