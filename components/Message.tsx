import React from 'react';
import type { Message, User } from '../types';
import { parseFormattedText } from '../utils/textFormatter';
import { ProfilePicture } from './ProfilePicture';

interface MessageProps {
  message: Message;
  currentUserNickname: string;
  user?: User; // Optional user object for profile picture
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
  if (nickname.endsWith('Bot') || nickname.includes('Bot')) return 'text-amber-400'; // Special color for bots
  if (!userColorMap[nickname]) {
    userColorMap[nickname] = colors[colorIndex % colors.length];
    colorIndex++;
  }
  return userColorMap[nickname];
};

export const MessageEntry: React.FC<MessageProps> = ({ message, currentUserNickname, user }) => {
  const { nickname, content, timestamp, type, command, images, links, botCommand } = message;
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Check if this is a bot message
  const isBotMessage = type === 'bot' || nickname.endsWith('Bot') || nickname.includes('Bot');

  // Helper function to render images from the extracted images array
  const renderImages = () => {
    if (!images || images.length === 0) return null;
    
    return images.map((imageUrl, index) => (
      <div key={`image-${index}`} className="my-2">
        <img 
          src={imageUrl} 
          alt="Shared image" 
          className="max-w-full h-auto rounded border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.open(imageUrl, '_blank')}
          onError={(e) => {
            // Fallback to link if image fails to load
            e.currentTarget.style.display = 'none';
            const linkElement = document.createElement('a');
            linkElement.href = imageUrl;
            linkElement.textContent = imageUrl;
            linkElement.className = 'text-blue-400 hover:text-blue-300 underline break-all';
            linkElement.target = '_blank';
            e.currentTarget.parentNode?.appendChild(linkElement);
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.tagName === 'VIDEO' || img.tagName === 'AUDIO') {
              img.pause?.();
            }
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    ));
  };

  // Helper function to render links from the extracted links array
  const renderLinks = () => {
    if (!links || links.length === 0) return null;
    
    return links.map((linkUrl, index) => (
      <a key={`link-${index}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline break-all">
        {linkUrl}
      </a>
    ));
  };

  // Helper function to render content with links, images, and text formatting
  const renderContent = (text: string) => {
    // Split content by URLs to handle them separately
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const dataUrlRegex = /(data:[^;]+;base64,[^\s]+)/gi;
    const combinedRegex = new RegExp(`(${urlRegex.source}|${dataUrlRegex.source})`, 'gi');
    const parts = text.split(combinedRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Check if this URL is already handled by the images/links arrays
        // Use more robust matching to handle URL variations
        const normalizeUrl = (url: string) => url.toLowerCase().replace(/\/$/, ''); // Remove trailing slash and normalize case
        const normalizedPart = normalizeUrl(part);
        
        const isHandledImage = images && images.some(img => normalizeUrl(img) === normalizedPart);
        const isHandledLink = links && links.some(link => normalizeUrl(link) === normalizedPart);
        
        
        if (isHandledLink || isHandledImage) {
          // Skip this URL as it's already handled by the dedicated links/images arrays
          return <span key={index}></span>; // Render empty span to prevent duplicate display
        }
        
        // Don't skip images - let them render normally in the content
        // The dedicated renderImages() function will handle them separately
        
        // Check if it's an image URL (more flexible detection)
        const imageRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i;
        const isImageHostingService = /(gyazo\.com|prnt\.sc|imgbb\.com|postimg\.cc|imgbox\.com|imgchest\.com|freeimage\.host)\/[a-zA-Z0-9]+/i.test(part);
        if (imageRegex.test(part) || isImageHostingService) {
          // Check if URL is safe (not from ad networks or tracking services)
          const isUnsafeUrl = /(3lift\.com|ads\.assemblyexchange\.com|doubleclick\.net|googlesyndication\.com|amazon-adsystem\.com)/i.test(part);
          
          if (isUnsafeUrl) {
            // Show warning for unsafe URLs
            return (
              <div key={index} className="my-2 p-2 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-sm">
                <span className="font-semibold">⚠️ Unsafe URL blocked:</span> {part}
                <br />
                <span className="text-xs">This URL appears to be from an ad network and has been blocked for security.</span>
              </div>
            );
          }
          
          // Check for incomplete Imgur URLs that might redirect to front page
          const isIncompleteImgur = /imgur\.com\/[a-zA-Z0-9]+(?:\?.*)?$/.test(part) && !part.includes('i.imgur.com/') && !part.includes('/a/');
          if (isIncompleteImgur) {
            // Try to fix the URL
            const match = part.match(/imgur\.com\/([a-zA-Z0-9]+)(?:\?.*)?$/);
            if (match) {
              const fixedUrl = `https://i.imgur.com/${match[1]}.jpg`;
              return (
                <div key={index} className="my-2">
                  <img 
                    src={fixedUrl} 
                    alt="Shared image" 
                    className="max-w-full h-auto rounded border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(fixedUrl, '_blank')}
                    onError={(e) => {
                      // Fallback to link if image fails to load
                      e.currentTarget.style.display = 'none';
                      const linkElement = document.createElement('a');
                      linkElement.href = fixedUrl;
                      linkElement.textContent = fixedUrl;
                      linkElement.className = 'text-blue-400 hover:text-blue-300 underline break-all';
                      linkElement.target = '_blank';
                      e.currentTarget.parentNode?.appendChild(linkElement);
                    }}
                    crossOrigin="anonymous"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Fixed URL: {fixedUrl}
                  </div>
                </div>
              );
            }
          }
          
          // Check if this is any Imgur URL (block all Imgur URLs to prevent JavaScript issues)
          const isImgurUrl = part.includes('imgur.com/') || part.includes('i.imgur.com/');
          if (isImgurUrl) {
            return (
              <div key={index} className="my-2 p-2 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
                <span className="font-semibold">⚠️ Imgur URL blocked:</span> {part}
                <br />
                <span className="text-xs">Imgur URLs are blocked to prevent JavaScript errors and audio/video issues. Please use other image hosting services like gyazo.com, prnt.sc, or imgbb.com</span>
              </div>
            );
          }
          
          return (
            <div key={index} className="my-2">
              <img 
                src={part} 
                alt="Shared image" 
                className="max-w-full h-auto rounded border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(part, '_blank')}
                onError={(e) => {
                  // Fallback to link if image fails to load
                  e.currentTarget.style.display = 'none';
                  const linkElement = document.createElement('a');
                  linkElement.href = part;
                  linkElement.textContent = part;
                  linkElement.className = 'text-blue-400 hover:text-blue-300 underline break-all';
                  linkElement.target = '_blank';
                  e.currentTarget.parentNode?.appendChild(linkElement);
                }}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.tagName === 'VIDEO' || img.tagName === 'AUDIO') {
                    img.pause?.();
                  }
                }}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        } else {
          // Regular link
          return (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline break-all">
              {part}
            </a>
          );
        }
      } else if (dataUrlRegex.test(part)) {
        // Handle data URLs (base64 images) - check if they're already in the images array
        const isHandledImage = images && images.includes(part);
        if (isHandledImage) {
          // Skip this data URL as it's already handled by the images array
          return <span key={index}></span>;
        } else {
          // Show placeholder for data URLs not in images array
          return <span key={index} className="text-gray-500 italic">[Generated Image]</span>;
        }
      } else {
        // Apply text formatting to non-URL parts
        return <span key={index}>{parseFormattedText(part)}</span>;
      }
    });
  };

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
            * <span className={`${nicknameColor} font-bold`}>{nickname}</span> <span className="text-gray-200">{renderContent(content)}</span>
          </span>
          {/* Render extracted images */}
          {renderImages()}
          {/* Render extracted links */}
          {renderLinks()}
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
          <span className="text-yellow-400 italic break-words">
            -{nickname}- {renderContent(content)}
          </span>
        </div>
      </div>
    );
  }

  // Handle join messages
  if (type === 'join') {
    return (
      <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0">{time}</span>
        <p className="text-green-400 break-words">
          <span className={`${nicknameColor} font-bold`}>{nickname}</span> joined the channel
        </p>
      </div>
    );
  }

  // Handle part messages
  if (type === 'part') {
    return (
      <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0">{time}</span>
        <p className="text-red-400 break-words">
          <span className={`${nicknameColor} font-bold`}>{nickname}</span> left the channel{content ? `: ${content}` : ''}
        </p>
      </div>
    );
  }

  // Handle quit messages
  if (type === 'quit') {
    return (
      <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0">{time}</span>
        <p className="text-red-400 break-words">
          <span className={`${nicknameColor} font-bold`}>{nickname}</span> quit{content ? `: ${content}` : ''}
        </p>
      </div>
    );
  }

  // Handle topic messages
  if (type === 'topic') {
    return (
      <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0">{time}</span>
        <p className="text-purple-400 break-words">
          <span className={`${nicknameColor} font-bold`}>{nickname}</span> changed the topic to: {renderContent(content)}
        </p>
      </div>
    );
  }

  // Handle bot messages
  if (isBotMessage) {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${nicknameColor} font-bold`}>{nickname}</span>
            <span className="text-amber-500 text-xs bg-amber-900 px-2 py-0.5 rounded">🤖 BOT</span>
            {botCommand && (
              <span className="text-blue-400 text-xs bg-blue-900 px-2 py-0.5 rounded">
                {botCommand.toUpperCase()}
              </span>
            )}
            {message.botResponse?.status === 'generating' && (
              <span className="text-yellow-400 text-xs bg-yellow-900 px-2 py-0.5 rounded flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                GENERATING
              </span>
            )}
          </div>
          <div className="text-gray-200 break-words whitespace-pre-wrap bg-gray-800 p-2 rounded border-l-2 border-amber-500">
            {renderContent(content)}
          </div>
          {/* Render extracted images */}
          {renderImages()}
          {/* Render extracted links */}
          {renderLinks()}
        </div>
      </div>
    );
  }

  // Handle command messages
  if (type === 'command') {
    return (
      <div className="flex items-start gap-2 lg:gap-4 text-xs lg:text-sm">
        <span className="text-gray-600 font-semibold flex-shrink-0 w-12 lg:w-14 text-right">{time}</span>
        <div className="flex-1">
          <span className="text-gray-500 italic break-words">
            <span className="text-gray-400">/</span><span className="text-blue-400">{command}</span> {renderContent(content)}
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
        <div className="flex items-center gap-2 mb-1">
          {user && (
            <ProfilePicture user={user} size="sm" className="flex-shrink-0" />
          )}
          <span className={`${nicknameColor} font-bold`}>{nickname}</span>
        </div>
        <div className="text-gray-200 break-words whitespace-pre-wrap">
          {renderContent(content)}
        </div>
        {/* Render extracted images */}
        {renderImages()}
        {/* Render extracted links */}
        {renderLinks()}
      </div>
    </div>
  );
};