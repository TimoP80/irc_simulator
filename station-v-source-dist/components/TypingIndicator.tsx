import React from 'react';

interface TypingIndicatorProps {
  users: string[];
  mode: 'all' | 'private_only' | 'none';
  isPrivateMessage: boolean;
}

export const TypingIndicator = React.memo(({ users, mode, isPrivateMessage }: TypingIndicatorProps) => {
  if (!users.length) return null;
  if (mode !== 'all' && (!isPrivateMessage || mode !== 'private_only')) return null;

  return (
    <div className="text-gray-400 italic text-sm px-3 py-2 flex items-center gap-2 bg-gray-800/50 rounded-lg mx-2 my-1 border border-gray-600/30">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-gray-300">
        {users.length === 1 
          ? `${users[0]} is typing...`
          : `${users.join(', ')} are typing...`
        }
      </span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';