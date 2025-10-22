
import React from 'react';
import type { Message } from '../types';

interface MessageProps {
  message: Message;
  currentUserNickname: string;
}

const userColorMap: { [key: string]: string } = {};
const colors = [
  'text-green-400', 'text-yellow-400', 'text-blue-400',
  'text-purple-400', 'text-pink-400', 'text-orange-400',
];
let colorIndex = 0;

const getUserColor = (nickname: string, currentUserNickname: string) => {
  if (nickname === currentUserNickname) return 'text-cyan-400';
  if (nickname === 'system') return 'text-gray-500';
  if (!userColorMap[nickname]) {
    userColorMap[nickname] = colors[colorIndex % colors.length];
    colorIndex++;
  }
  return userColorMap[nickname];
};


export const MessageEntry: React.FC<MessageProps> = ({ message, currentUserNickname }) => {
  const { nickname, content, timestamp, type, command } = message;
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (type === 'system') {
    return (
      <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0">{time}</span>
        <p className="text-gray-500 italic break-words">-- {content}</p>
      </div>
    );
  }

  const nicknameColor = getUserColor(nickname, currentUserNickname);

  // Handle action messages (/me)
  if (type === 'action') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-gray-500 italic break-words">
            * <span className={`${nicknameColor} font-bold`}>{nickname}</span> {content}
          </span>
        </div>
      </div>
    );
  }

  // Handle notice messages
  if (type === 'notice') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-orange-400 font-semibold">Notice from {nickname}:</span>
          <span className="text-gray-200 break-words whitespace-pre-wrap ml-2">{content}</span>
        </div>
      </div>
    );
  }

  // Handle topic changes
  if (type === 'topic') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-purple-400 font-semibold">Topic changed by {nickname}:</span>
          <span className="text-gray-200 break-words whitespace-pre-wrap ml-2">{content}</span>
        </div>
      </div>
    );
  }

  // Handle kick messages
  if (type === 'kick') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-red-400 font-semibold">
            {nickname} kicked {message.target || 'someone'}{content ? `: ${content}` : ''}
          </span>
        </div>
      </div>
    );
  }

  // Handle ban messages
  if (type === 'ban') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-red-500 font-semibold">
            {nickname} banned {message.target || 'someone'}{content ? `: ${content}` : ''}
          </span>
        </div>
      </div>
    );
  }

  // Handle join messages
  if (type === 'join') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-green-400 font-semibold">
            {nickname} joined {content}
          </span>
        </div>
      </div>
    );
  }

  // Handle part messages
  if (type === 'part') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-yellow-400 font-semibold">
            {nickname} left{content ? `: ${content}` : ''}
          </span>
        </div>
      </div>
    );
  }

  // Handle quit messages
  if (type === 'quit') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-gray-400 font-semibold">
            {nickname} quit{content ? `: ${content}` : ''}
          </span>
        </div>
      </div>
    );
  }

  // Default message display
  return (
    <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
      <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
      <div className="flex-1">
        <span className={`${nicknameColor} font-bold mr-2`}>{nickname}</span>
        <span className="text-gray-200 break-words whitespace-pre-wrap">{content}</span>
      </div>
    </div>
  );
};
