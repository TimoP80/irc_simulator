
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
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ title, messages, onSendMessage, isLoading, currentUserNickname }) => {
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
    <div className="flex-1 flex flex-col bg-gray-800 h-full">
      <header className="px-6 py-3 border-b border-gray-700 bg-gray-900">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <MessageEntry key={msg.id} message={msg} currentUserNickname={currentUserNickname} />
          ))}
          {isLoading && <div className="text-gray-400 italic text-sm px-2">AI is typing...</div>}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t border-gray-700 bg-gray-900">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (try /nick, /join, /who)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center justify-center disabled:bg-indigo-800 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
          >
            <SendIcon className="h-5 w-5"/>
          </button>
        </form>
      </footer>
    </div>
  );
};
