// Add global declaration for window.scrollToBottom
declare global {
  interface Window {
    scrollToBottom?: () => void;
  }
}

import React, { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect, Suspense } from 'react';
// Simple error boundary for ChatWindow
interface ChatWindowErrorBoundaryProps {
  children: React.ReactNode;
}
interface ChatWindowErrorBoundaryState {
  hasError: boolean;
  error: any;
}
class ChatWindowErrorBoundary extends React.Component<ChatWindowErrorBoundaryProps, ChatWindowErrorBoundaryState> {
  declare state: ChatWindowErrorBoundaryState;
  declare props: ChatWindowErrorBoundaryProps;
  constructor(props: ChatWindowErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log errorInfo here if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 24, borderRadius: 8, margin: 16 }}>
          <h2>Something went wrong in ChatWindow.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { startTransition, useTransition } from 'react';
import type { Message, User } from '../types';
import { SendIcon, PaperclipIcon } from './icons';
import { convertEmoticonsToEmojis, convertEmojisToEmoticons } from '../utils/emojiConverter';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

// Performance configuration
const PERF_CONFIG = {
  SCROLL_THROTTLE: 100, // ms
  MESSAGE_CHUNK_SIZE: 50,
  RESIZE_DEBOUNCE: 150, // ms
  MESSAGE_HEIGHT: 60, // px
  OVERSCAN_COUNT: 5 // items
} as const;

function useThrottledCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const lastCall = useRef(0);
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      callback(...args);
      lastCall.current = now;
    }
  }, [callback, delay]);
}


const useDebounce = (fn: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
};

interface ChatWindowProps {
   title: string;
   messages: Message[];
   onSendMessage: (content: string, quotedMessage?: Message, messageData?: any) => void;
   isLoading: boolean;
   currentUserNickname: string;
   typingUsers: string[];
   channel?: { operators: string[] };
   users?: User[]; // Optional users array for profile pictures
   onClose?: () => void;
   showCloseButton?: boolean;
   typingIndicatorMode?: 'all' | 'private_only' | 'none'; // Typing indicator display mode
   isPrivateMessage?: boolean; // Whether this is a private message window
   onQuoteMessage?: (message: Message) => void; // Callback for quoting a message
 }


// (removed duplicate PERF_CONFIG)

// Remove unused chunkArray function

const ChatWindowComponent = React.memo(({
  title,
  messages,
  onSendMessage,
  isLoading,
  currentUserNickname,
  typingUsers,
  channel,
  users,
  onClose,
  showCloseButton = false,
  typingIndicatorMode = 'all',
  isPrivateMessage = false,
  onQuoteMessage
}: ChatWindowProps) => {
  // Core state
  const [input, setInput] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  // Attachment state
  const [attachments, setAttachments] = useState<{ type: 'image' | 'audio'; url: string; file?: File }[]>([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  // Layout state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'height' | 'width-left' | 'width-right' | null>(null);
  const [chatHeight, setChatHeight] = useState<number | null>(null);
  const [chatWidth, setChatWidth] = useState<number | null>(null);
  const [chatLeft, setChatLeft] = useState<number | null>(null);

  // Performance optimization state
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  // For short message lists, disable virtualization
  // Always default users to an empty array if not provided
  const safeUsers = users || [];
  const disableVirtualization = messages.length < 20;
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: disableVirtualization ? messages.length : 50 });

  // Throttled handlers (hooks must be at top level)
  const throttledHandleScroll = useThrottledCallback(() => {
    if (chatWindowRef.current) {
      const target = chatWindowRef.current;
      // If virtualization is disabled, always allow scroll to bottom
      if (disableVirtualization) {
        setShouldScrollToBottom(true);
        setShowScrollToLatest(false);
        return;
      }
      const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
      setShouldScrollToBottom(isAtBottom);
      setShowScrollToLatest(!isAtBottom);
    }
  }, PERF_CONFIG.SCROLL_THROTTLE);

  const handleResize = useThrottledCallback(() => {
    if (chatWindowRef.current) {
      const target = chatWindowRef.current;
      const elementHeight = target.clientHeight;
      const scrollTop = target.scrollTop;
      startTransition(() => {
        if (disableVirtualization) {
          setVisibleRange({ start: 0, end: messages.length });
        } else {
          setVisibleRange({
            start: Math.max(0, Math.floor(scrollTop / PERF_CONFIG.MESSAGE_HEIGHT) - PERF_CONFIG.OVERSCAN_COUNT),
            end: Math.min(
              messages.length,
              Math.ceil((scrollTop + elementHeight) / PERF_CONFIG.MESSAGE_HEIGHT) + PERF_CONFIG.OVERSCAN_COUNT
            )
          });
        }
      });
    }
  }, PERF_CONFIG.RESIZE_DEBOUNCE);

  // Scroll position tracking
  useEffect(() => {
    const target = chatWindowRef.current;
    if (!target) return;

    target.addEventListener('scroll', throttledHandleScroll);
    // Initial check
    throttledHandleScroll();

    return () => target.removeEventListener('scroll', throttledHandleScroll);
  }, [throttledHandleScroll]);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollPositionRef = useRef(0);
  const frameRequestRef = useRef<number>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const leftResizeHandleRef = useRef<HTMLDivElement>(null);
  const rightResizeHandleRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setShouldScrollToBottom(true);
    setShowScrollToLatest(false);
  }, []);
  // Expose scrollToBottom globally for image onLoad
  React.useEffect(() => {
    window.scrollToBottom = scrollToBottom;
    return () => {
      if (window.scrollToBottom === scrollToBottom) {
        delete window.scrollToBottom;
      }
    };
  }, []);

  // Track last message id to detect new messages
  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const lastMsgId = lastMsg ? lastMsg.id : null;
    const prevLastMsgId = lastMessageIdRef.current;

    // Only auto-scroll for short lists, or if user is at bottom, or if a new message arrives from another user and user was at bottom
    const isNewMessage = lastMsgId && lastMsgId !== prevLastMsgId;
    const isFromOtherUser = isNewMessage && lastMsg && lastMsg.nickname !== currentUserNickname;

    if (disableVirtualization || shouldScrollToBottom || (isNewMessage && isFromOtherUser && shouldScrollToBottom)) {
      scrollToBottom();
    }
    lastMessageIdRef.current = lastMsgId;
  }, [messages, typingUsers, disableVirtualization, shouldScrollToBottom, currentUserNickname, scrollToBottom]);

    // Optimized scroll handling with debounce and RAF
  useEffect(() => {
    if (messages.length > 0 && (disableVirtualization || shouldScrollToBottom)) {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      frameRequestRef.current = requestAnimationFrame(() => {
        if (chatWindowRef.current) {
          const target = chatWindowRef.current;
          startTransition(() => {
            target.scrollTo({
              top: target.scrollHeight,
              behavior: 'smooth'
            });
          });
        }
      });
    }
  }, [messages, shouldScrollToBottom, disableVirtualization]);

  // Handle layout calculations
  useLayoutEffect(() => {
    // Initial calculation
    handleResize();
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, messages.length]);

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Close formatting help when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFormattingHelp && !(event.target as Element).closest('.formatting-help-container')) {
        startTransition(() => {
          setShowFormattingHelp(false);
        });
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

  // Handle quoting a message
  const handleQuoteMessage = useCallback((message: Message) => {
    setQuotedMessage(message);
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Call the parent callback if provided
    if (onQuoteMessage) {
      onQuoteMessage(message);
    }
  }, [onQuoteMessage]);

  // Handle removing quoted message
  const handleRemoveQuote = useCallback(() => {
    setQuotedMessage(null);
  }, []);

  // Handle file selection for attachments
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            const attachment = {
              type: file.type.startsWith('image/') ? 'image' as const : 'audio' as const,
              url: result,
              file
            };
            setAttachments(prev => [...prev, attachment]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    event.target.value = '';
  }, []);

  // Handle URL input for attachments
  const handleUrlAttachment = useCallback((url: string, type: 'image' | 'audio') => {
    if (url.trim()) {
      setAttachments(prev => [...prev, { type, url: url.trim() }]);
    }
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      // Convert emoticons to emojis before sending
      const convertedInput = convertEmoticonsToEmojis(input.trim());

      // Prepare message data with attachments
      const messageData = {
        content: convertedInput,
        images: attachments.filter(att => att.type === 'image').map(att => att.url),
        audio: attachments.filter(att => att.type === 'audio').map(att => att.url),
        quotedMessage: quotedMessage || undefined
      };

      onSendMessage(convertedInput, quotedMessage || undefined, messageData);
      // Always clear input after sending, but do not trigger extra scroll or re-render
      setInput('');
      setQuotedMessage(null); // Clear quoted message after sending
      setAttachments([]); // Clear attachments after sending
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

  // Optimized scroll handling with virtual list
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (disableVirtualization) return; // No-op for short lists

    // Clear existing scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    setIsScrolling(true);
    lastScrollPositionRef.current = target.scrollTop;
    setScrollPosition(target.scrollTop);

    // Calculate visible range for virtualization
    const elementHeight = target.clientHeight;
    const scrollTop = target.scrollTop;

    const itemHeight = 60; // Approximate height of a message
    const overscanCount = 5; // Number of items to render above/below viewport

    const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
    const visibleEndIndex = Math.min(
      messages.length,
      Math.ceil((scrollTop + elementHeight) / itemHeight) + overscanCount
    );

    // Prevent unnecessary re-renders by checking if range actually changed
    setVisibleRange(prevRange => {
      if (prevRange.start === visibleStartIndex && prevRange.end === visibleEndIndex) {
        return prevRange; // No change, return same object to prevent re-render
      }
      return { start: visibleStartIndex, end: visibleEndIndex };
    });

    // Debounce scroll end detection
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, PERF_CONFIG.SCROLL_THROTTLE);
  }, [messages.length, disableVirtualization]);

  // Memoize the message rendering with virtualization
  const renderMessages = useCallback(() => {
    if (disableVirtualization) {
      // Render all messages directly for short lists (e.g., PMs), let height be auto and remove any fixed height/minHeight
      return (
        <div>
          {messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: 8 }}>
              <MessageItem
                message={msg}
                currentUserNickname={currentUserNickname}
                user={safeUsers.find(u => u.nickname === msg.nickname)}
                onQuote={msg.type !== 'system' && onQuoteMessage ? handleQuoteMessage : undefined}
              />
            </div>
          ))}
        </div>
      );
    }
    // Only render messages within the visible range (virtualized)
    const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
    const totalHeight = messages.length * PERF_CONFIG.MESSAGE_HEIGHT; // Total scrollable height
    const topPadding = visibleRange.start * PERF_CONFIG.MESSAGE_HEIGHT; // Padding before visible items

    return (
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: topPadding, left: 0, right: 0 }}>
          {visibleMessages.map((msg) => {
            const user = safeUsers.find(u => u.nickname === msg.nickname);
            return (
                  <div key={msg.id} className="group" style={{ height: PERF_CONFIG.MESSAGE_HEIGHT, display: 'block' }}>
                <MessageItem
                  message={msg}
                  currentUserNickname={currentUserNickname}
                  user={user}
                  onQuote={msg.type !== 'system' && onQuoteMessage ? handleQuoteMessage : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
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

  // Patch: When sending a message, include attachments in the message object
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    // Prepare message data
    const messageData: any = {};
    if (attachments.length > 0) {
      messageData.images = attachments.filter(a => a.type === 'image').map(a => a.url);
      messageData.audio = attachments.filter(a => a.type === 'audio').map(a => a.url);
    }
    onSendMessage(input, quotedMessage || undefined, messageData);
    setInput('');
    setQuotedMessage(null);
    setAttachments([]);
  }, [input, attachments, quotedMessage, onSendMessage]);
  }, [messages, visibleRange, safeUsers, currentUserNickname, onQuoteMessage, handleQuoteMessage, disableVirtualization]);

  // Remove duplicate message chunking logic - using renderMessages() instead

  // Remove duplicate renderedMessages - using renderMessages() instead
  
  // Memoized typing indicator
  const typingIndicatorElement = useMemo(() => {
    if (typingUsers.length === 0) return null;
    const shouldShow = 
      typingIndicatorMode === 'all' || 
      (typingIndicatorMode === 'private_only' && isPrivateMessage);
    
    if (!shouldShow) return null;
    
    return (
      <TypingIndicator
        users={typingUsers}
        mode={typingIndicatorMode}
        isPrivateMessage={isPrivateMessage}
      />
    );
  }, [typingUsers, typingIndicatorMode, isPrivateMessage]);

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

      <div 
        className="flex-1 p-3 lg:p-4 overflow-y-auto min-h-0 overscroll-contain will-change-scroll relative"
        style={{ minHeight: 0, overflowAnchor: 'auto' }}
        onScroll={handleScroll}
      >
        {showScrollToLatest && (
          <button
            className="absolute right-4 bottom-4 z-20 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg hover:bg-indigo-500 transition-colors"
            onClick={scrollToBottom}
            title="Scroll to latest message"
          >
            Scroll to latest
          </button>
        )}
        {renderMessages()}
        {typingIndicatorElement}
        <div ref={messagesEndRef} style={{ height: 0 }} />
      </div>

      <footer className="p-3 lg:p-4 border-t border-gray-700 bg-gray-900">
        {/* Quoted message preview */}
        {quotedMessage && (
          <div className="mb-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-gray-300">Replying to {quotedMessage.nickname}</span>
              </div>
              <button
                onClick={handleRemoveQuote}
                className="text-gray-400 hover:text-white transition-colors"
                title="Remove quote"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-300 break-words">
              {quotedMessage.content.length > 150 
                ? `${quotedMessage.content.substring(0, 150)}...` 
                : quotedMessage.content
              }
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
           <div className="flex-1 relative">
             {/* Attachment previews */}
             {attachments.length > 0 && (
               <div className="mb-2 flex flex-wrap gap-2">
                 {attachments.map((attachment, index) => (
                   <div key={index} className="relative bg-gray-600 rounded-lg p-2 flex items-center gap-2 max-w-xs">
                     {attachment.type === 'image' ? (
                       <img src={attachment.url} alt="Attachment" className="w-8 h-8 object-cover rounded" />
                     ) : (
                       <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
                         <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
                     <span className="text-xs text-gray-300 truncate flex-1">
                       {attachment.type === 'image' ? 'Image' : 'Audio'}
                     </span>
                     <button
                       type="button"
                       onClick={() => removeAttachment(index)}
                       className="text-gray-400 hover:text-white"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   </div>
                 ))}
               </div>
             )}

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

          <div className="relative">
            <input
              type="file"
              accept="image/*,audio/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Attach files"
            />
            <button
              type="button"
              className="px-3 py-3 lg:py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg transition-colors duration-200 min-h-[48px] touch-manipulation"
              title="Attach files"
            >
              <PaperclipIcon className="h-5 w-5 lg:h-5 lg:w-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
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
});

// Export with error boundary
export const ChatWindow = (props: ChatWindowProps) => (
  <ChatWindowErrorBoundary>
    <ChatWindowComponent {...props} />
  </ChatWindowErrorBoundary>
);
