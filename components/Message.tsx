
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
  const { nickname, content, timestamp, type } = message;
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (type === 'system') {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 font-semibold">{time}</span>
        <p className="text-gray-500 italic">-- {content}</p>
      </div>
    );
  }

  const nicknameColor = getUserColor(nickname, currentUserNickname);

  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="text-gray-600 font-semibold flex-shrink-0 w-14 text-right">{time}</span>
      <div className="flex-1">
        <span className={`${nicknameColor} font-bold mr-2`}>{nickname}</span>
        <span className="text-gray-200 break-words whitespace-pre-wrap">{content}</span>
      </div>
    </div>
  );
};
