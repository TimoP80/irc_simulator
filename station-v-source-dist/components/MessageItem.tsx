import React from 'react';
import type { Message, User } from '../types';
import { MessageEntry } from './Message';

interface MessageItemProps {
  message: Message;
  currentUserNickname: string;
  user?: User;
  onQuoteMessage?: (message: Message) => void;
}

export const MessageItem = React.memo(({
  message,
  currentUserNickname,
  user,
  onQuoteMessage
}: MessageItemProps) => {
  return (
    <div className="group relative px-2 py-1 min-h-[2rem] box-border">
      <MessageEntry
        message={message}
        currentUserNickname={currentUserNickname}
        user={user}
      />
      {message.type !== 'system' && onQuoteMessage && (
        <button
          onClick={() => onQuoteMessage(message)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10"
          title="Reply to this message"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Reply
        </button>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';