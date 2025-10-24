
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'height' | 'width-left' | 'width-right' | null>(null);
  const [chatHeight, setChatHeight] = useState<number | null>(null);
  const [chatWidth, setChatWidth] = useState<number | null>(null);
  const [chatLeft, setChatLeft] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const leftResizeHandleRef = useRef<HTMLDivElement>(null);
  const rightResizeHandleRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'height' | 'width-left' | 'width-right') => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType(type);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !chatWindowRef.current || !resizeType) return;
    
    const rect = chatWindowRef.current.getBoundingClientRect();
    
    if (resizeType === 'height') {
      const newHeight = window.innerHeight - e.clientY;
      const minHeight = 200; // Minimum height
      const maxHeight = window.innerHeight - 100; // Maximum height (leave some space for other elements)
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setChatHeight(newHeight);
      }
    } else if (resizeType === 'width-left') {
      const newLeft = e.clientX;
      const newWidth = rect.right - e.clientX;
      const minWidth = 300; // Minimum width
      const maxWidth = window.innerWidth - 200; // Maximum width (leave space for sidebars)
      
      if (newWidth >= minWidth && newWidth <= maxWidth && newLeft >= 0) {
        setChatLeft(newLeft);
        setChatWidth(newWidth);
      }
    } else if (resizeType === 'width-right') {
      const newWidth = e.clientX - rect.left;
      const minWidth = 300; // Minimum width
      const maxWidth = window.innerWidth - 200; // Maximum width (leave space for sidebars)
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setChatWidth(newWidth);
      }
    }
  }, [isResizing, resizeType]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeType(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Set cursor based on resize type
      if (resizeType === 'height') {
        document.body.style.cursor = 'ns-resize';
      } else if (resizeType === 'width-left' || resizeType === 'width-right') {
        document.body.style.cursor = 'ew-resize';
      }
      
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeType, handleMouseMove, handleMouseUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div 
      ref={chatWindowRef}
      className="flex-1 flex flex-col bg-gray-800 h-full min-h-0 relative"
      style={{ 
        height: chatHeight ? `${chatHeight}px` : undefined,
        width: chatWidth ? `${chatWidth}px` : undefined,
        left: chatLeft ? `${chatLeft}px` : undefined,
        position: (chatLeft || chatWidth) ? 'absolute' : undefined
      }}
    >
      <header className="px-4 lg:px-6 py-2 lg:py-3 border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base lg:text-lg font-semibold text-white truncate">{title}</h1>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>as {currentUserNickname}</span>
            </div>
          </div>
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

      {/* Mobile current user indicator */}
      <div className="sm:hidden px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          <span>Chatting as {currentUserNickname}</span>
        </div>
      </div>

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
            placeholder="Type your message... (try /nick, /join, /who or !image, !weather, !help)"
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
      
      {/* Bottom resize handle (height) */}
      <div
        ref={resizeHandleRef}
        onMouseDown={(e) => handleMouseDown(e, 'height')}
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-gray-600 hover:bg-gray-500 transition-colors ${
          isResizing && resizeType === 'height' ? 'bg-indigo-500' : ''
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>

      {/* Left resize handle (width) */}
      <div
        ref={leftResizeHandleRef}
        onMouseDown={(e) => handleMouseDown(e, 'width-left')}
        className={`absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize bg-gray-600 hover:bg-gray-500 transition-colors ${
          isResizing && resizeType === 'width-left' ? 'bg-indigo-500' : ''
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>

      {/* Right resize handle (width) */}
      <div
        ref={rightResizeHandleRef}
        onMouseDown={(e) => handleMouseDown(e, 'width-right')}
        className={`absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize bg-gray-600 hover:bg-gray-500 transition-colors ${
          isResizing && resizeType === 'width-right' ? 'bg-indigo-500' : ''
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>
    </div>
  );
};
