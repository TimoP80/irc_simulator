
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { MessageEntry } from './Message';
import { SendIcon } from './icons';

interface ChatWindowProps {
  title: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  currentUserNickname: string;
  typingUsers: string[];
  channel?: { operators: string[] };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ title, messages, onSendMessage, isLoading, currentUserNickname, typingUsers, channel }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-800 h-full min-h-0">
      <header className="px-4 lg:px-6 py-2 lg:py-3 border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-base lg:text-lg font-semibold text-white truncate">{title}</h1>
          {channel && (channel.operators || []).length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-400 hidden sm:inline">Ops:</span>
              <div className="flex gap-1 flex-wrap">
                {[...new Set(channel.operators || [])].map(op => (
                  <span key={op} className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                    @{op}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 p-2 lg:p-4 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-2 lg:gap-3">
          {messages.map((msg) => (
            <MessageEntry key={msg.id} message={msg} currentUserNickname={currentUserNickname} />
          ))}
          {typingUsers.length > 0 && (
            <div className="text-gray-400 italic text-sm px-2 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.join(', ')} are typing...`
                }
              </span>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-3 lg:p-4 border-t border-gray-700 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (try /nick, /join, /who)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 lg:px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white rounded-lg px-3 lg:px-4 py-2 flex items-center justify-center disabled:bg-indigo-800 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors touch-manipulation"
          >
            <SendIcon className="h-4 w-4 lg:h-5 lg:w-5"/>
          </button>
        </form>
      </footer>
    </div>
  );
};
