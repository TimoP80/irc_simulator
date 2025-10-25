
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Message, User } from '../types';
import { MessageEntry } from './Message';
import { SendIcon } from './icons';
import { convertEmoticonsToEmojis, convertEmojisToEmoticons } from '../utils/emojiConverter';

interface ChatWindowProps {
  title: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  currentUserNickname: string;
  typingUsers: string[];
  channel?: { operators: string[] };
  users?: User[]; // Optional users array for profile pictures
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ title, messages, onSendMessage, isLoading, currentUserNickname, typingUsers, channel, users, onClose, showCloseButton = false }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'height' | 'width-left' | 'width-right' | null>(null);
  const [chatHeight, setChatHeight] = useState<number | null>(null);
  const [chatWidth, setChatWidth] = useState<number | null>(null);
  const [chatLeft, setChatLeft] = useState<number | null>(null);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
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

  // Close formatting help when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFormattingHelp && !(event.target as Element).closest('.formatting-help-container')) {
        setShowFormattingHelp(false);
      }
    };

    if (showFormattingHelp) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFormattingHelp]);

  // Process pasted text to preserve formatting (single line)
  const processPastedText = useCallback((text: string): string => {
    return text
      // Preserve line breaks by converting to spaces (IRC style)
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      // Preserve multiple spaces (convert to single space for readability)
      .replace(/\s+/g, ' ')
      // Preserve special characters and formatting
      .replace(/\t/g, ' ') // Convert tabs to spaces
      // Preserve URLs (they should remain intact)
      .replace(/(https?:\/\/[^\s]+)/g, '$1')
      // Preserve markdown-style formatting
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Convert **bold** to *bold*
      .replace(/\*(.*?)\*/g, '*$1*') // Keep *italic* as is
      .replace(/__(.*?)__/g, '_$1_') // Convert __underline__ to _underline_
      .replace(/_(.*?)_/g, '_$1_') // Keep _underline_ as is
      .replace(/~~(.*?)~~/g, '~$1~') // Convert ~~strikethrough~~ to ~strikethrough~
      .replace(/`(.*?)`/g, '`$1`') // Keep `code` as is
      .replace(/```(.*?)```/gs, '`$1`') // Convert ```code blocks``` to `code`
      // Preserve quotes
      .replace(/^>/gm, '> ') // Ensure quote formatting
      // Clean up any remaining formatting artifacts
      .trim();
  }, []);

  // Process pasted text to preserve formatting (multi-line)
  const processPastedTextMultiLine = useCallback((text: string): string => {
    return text
      // Preserve line breaks for multi-line input
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Normalize multiple spaces but preserve single spaces
      .replace(/[ \t]+/g, ' ')
      // Preserve special characters and formatting
      .replace(/\t/g, ' ') // Convert tabs to spaces
      // Preserve URLs (they should remain intact)
      .replace(/(https?:\/\/[^\s]+)/g, '$1')
      // Preserve markdown-style formatting
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Convert **bold** to *bold*
      .replace(/\*(.*?)\*/g, '*$1*') // Keep *italic* as is
      .replace(/__(.*?)__/g, '_$1_') // Convert __underline__ to _underline_
      .replace(/_(.*?)_/g, '_$1_') // Keep _underline_ as is
      .replace(/~~(.*?)~~/g, '~$1~') // Convert ~~strikethrough~~ to ~strikethrough~
      .replace(/`(.*?)`/g, '`$1`') // Keep `code` as is
      .replace(/```(.*?)```/gs, '`$1`') // Convert ```code blocks``` to `code`
      // Preserve quotes
      .replace(/^>/gm, '> ') // Ensure quote formatting
      // Clean up any remaining formatting artifacts
      .trim();
  }, []);

  // Get display input with emoji conversion
  const displayInput = convertEmoticonsToEmojis(input);
  
  // Handle input change with cursor position preservation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    // Convert emojis back to emoticons for internal state
    const rawValue = convertEmojisToEmoticons(value);
    setInput(rawValue);
    
    // Restore cursor position after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }, []);

  // Handle paste events to preserve formatting
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    
    if (!pastedText) return;
    
    // Process the pasted text to preserve formatting (but keep line breaks for multi-line)
    const processedText = processPastedTextMultiLine(pastedText);
    
    // Get current cursor position
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;
    
    // Insert processed text at cursor position
    const newValue = currentValue.substring(0, start) + processedText + currentValue.substring(end);
    
    // Convert emojis back to emoticons for internal state
    const rawValue = convertEmojisToEmoticons(newValue);
    setInput(rawValue);
    
    // Set cursor position after the pasted text
    const newCursorPosition = start + processedText.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // Convert emoticons to emojis before sending
      const convertedInput = convertEmoticonsToEmojis(input.trim());
      onSendMessage(convertedInput);
      setInput('');
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  // Handle key events for Ctrl+Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

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
      <header className="px-3 lg:px-6 py-3 lg:py-3 border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            <h1 className="text-lg lg:text-lg font-semibold text-white truncate">{title}</h1>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>as {currentUserNickname}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="ml-2 p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors duration-150"
                title="Close window"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile current user indicator */}
      <div className="sm:hidden px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Chatting as {currentUserNickname}</span>
        </div>
      </div>

      <div className="flex-1 p-3 lg:p-4 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-3 lg:gap-3">
          {messages.map((msg) => {
            // Find user for profile picture
            const user = users?.find(u => u.nickname === msg.nickname);
            
            // Debug logging for user lookup
            if (msg.nickname && !user) {
              console.log(`ChatWindow: User not found for message from ${msg.nickname}`);
              console.log(`Available users:`, users?.map(u => u.nickname));
            } else if (user) {
              console.log(`ChatWindow: Found user for ${msg.nickname}:`, {
                nickname: user.nickname,
                profilePicture: user.profilePicture,
                hasProfilePicture: !!user.profilePicture
              });
            }
            
            return (
              <MessageEntry 
                key={msg.id} 
                message={msg} 
                currentUserNickname={currentUserNickname} 
                user={user}
              />
            );
          })}
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
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={displayInput}
              onChange={handleInputChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (try /nick, /join, /who or !image, !weather, !help) - Emoticons like :) will auto-convert to emojis - Use Ctrl+Enter to send"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 lg:px-4 py-3 lg:py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base lg:text-base resize-none min-h-[48px] max-h-[120px] touch-manipulation"
              disabled={isLoading}
              rows={1}
              style={{ 
                height: 'auto',
                minHeight: '48px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            
            {/* Formatting Help Tooltip */}
            {showFormattingHelp && (
              <div className="formatting-help-container absolute bottom-full left-0 mb-2 p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-w-sm">
                <div className="text-sm text-gray-200">
                  <div className="font-semibold text-gray-100 mb-2">Text Formatting Help</div>
                  <div className="space-y-1 text-xs">
                    <div><strong className="text-gray-100">**bold**</strong> or <strong className="text-gray-100">*bold*</strong> → <strong>bold</strong></div>
                    <div><em className="text-gray-100">_italic_</em> or <em className="text-gray-100">/italic/</em> → <em>italic</em></div>
                    <div><span className="underline text-gray-100">__underline__</span> → <span className="underline">underline</span></div>
                    <div><span className="line-through text-gray-100">~~strike~~</span> → <span className="line-through">strike</span></div>
                    <div><code className="bg-gray-700 text-green-400 px-1 rounded">`code`</code> → <code className="bg-gray-700 text-green-400 px-1 rounded">code</code></div>
                    <div><span className="text-gray-100">```code block```</span> → Code block</div>
                    <div><span className="text-gray-100">||spoiler||</span> → <span className="bg-gray-700 text-gray-700 hover:text-gray-200 px-1 rounded cursor-pointer">spoiler</span></div>
                    <div><span className="text-gray-100">{`{color:text}`}</span> → <span className="text-red-400">colored text</span></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Click outside to close
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowFormattingHelp(!showFormattingHelp)}
            className="px-3 py-3 lg:py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg transition-colors duration-200 min-h-[48px] touch-manipulation"
            title="Formatting help"
          >
            <span className="text-sm font-bold">?</span>
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white rounded-lg px-4 lg:px-4 py-3 lg:py-2 flex items-center justify-center disabled:bg-indigo-800 disabled:cursor-not-allowed hover:bg-indigo-500 active:bg-indigo-700 transition-colors touch-manipulation min-h-[48px]"
          >
            <SendIcon className="h-5 w-5 lg:h-5 lg:w-5"/>
          </button>
        </form>
      </footer>
      
      {/* Bottom resize handle (height) - Hidden on mobile */}
      <div
        ref={resizeHandleRef}
        onMouseDown={(e) => handleMouseDown(e, 'height')}
        className={`hidden lg:block absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-gray-600 hover:bg-gray-500 transition-colors ${
          isResizing && resizeType === 'height' ? 'bg-indigo-500' : ''
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>

      {/* Left resize handle (width) - Hidden on mobile */}
      <div
        ref={leftResizeHandleRef}
        onMouseDown={(e) => handleMouseDown(e, 'width-left')}
        className={`hidden lg:block absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize bg-gray-600 hover:bg-gray-500 transition-colors ${
          isResizing && resizeType === 'width-left' ? 'bg-indigo-500' : ''
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>

      {/* Right resize handle (width) - Hidden on mobile */}
      <div
        ref={rightResizeHandleRef}
        onMouseDown={(e) => handleMouseDown(e, 'width-right')}
        className={`hidden lg:block absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize bg-gray-600 hover:bg-gray-500 transition-colors ${
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
