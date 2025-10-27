
import React from 'react';
import type { Channel, User, ActiveContext } from '../types';
import { UserIcon, HashtagIcon, SettingsIcon } from './icons';
import { ProfilePicture } from './ProfilePicture';

interface ChannelListProps {
  channels: Channel[];
  privateMessageUsers: User[];
  activeContext: ActiveContext;
  onSelectContext: (context: ActiveContext) => void;
  onChannelClick?: (channelName: string) => void;
  onPMClick?: (nickname: string) => void;
  onOpenSettings: () => void;
  onOpenChatLogs?: () => void;
  onOpenChannelList?: () => void;
  onResetSpeakers?: () => void;
  onJoinChannel?: (channelName: string) => void;
  onLeaveChannel?: (channelName: string) => void;
  unreadChannels?: Set<string>;
  unreadPMUsers?: Set<string>;
  currentUserNickname: string;
  recentlyAutoOpenedPM?: string | null;
}

export const ChannelList: React.FC<ChannelListProps> = ({ channels, privateMessageUsers, activeContext, onSelectContext, onChannelClick, onPMClick, onOpenSettings, onOpenChatLogs, onOpenChannelList, onResetSpeakers, onJoinChannel, onLeaveChannel, unreadChannels, unreadPMUsers, currentUserNickname, recentlyAutoOpenedPM }) => {
  const getButtonClass = (isActive: boolean) => 
    `w-full text-left px-4 py-2 text-sm truncate flex items-center gap-2 rounded-md transition-colors duration-150 ${
      isActive ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;

  // Show all channels with join status
  const allChannels = channels;
  const joinedChannels = channels.filter(channel => 
    channel.users.some(user => user.nickname === currentUserNickname)
  );

  return (
    <aside className="channel-list-root bg-gray-900 p-3 lg:p-4 flex flex-col border-r border-gray-700 lg:border-b-0 border-b h-full lg:h-auto lg:flex-1">
      <div className="flex justify-between items-center mb-3 lg:mb-4 flex-shrink-0">
        <h2 className="text-base lg:text-lg font-bold text-gray-100">IRC Simulator</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto -mr-2 lg:-mr-4 pr-2 lg:pr-4">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 lg:mb-2 px-2">Channels</h3>
        <div className="flex flex-col gap-1 lg:gap-1 mb-4 lg:mb-6">
          {allChannels.map(channel => {
            const isActive = activeContext?.type === 'channel' && activeContext.name === channel.name;
            const hasUnread = unreadChannels?.has(channel.name) || false;
            const isJoined = channel.users.some(user => user.nickname === currentUserNickname);
            
            return (
              <div key={channel.name} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (isJoined) {
                      // If joined, open the channel
                      if (onChannelClick) {
                        onChannelClick(channel.name);
                      } else {
                        onSelectContext({ type: 'channel', name: channel.name });
                      }
                    } else if (onJoinChannel) {
                      // If not joined, join the channel
                      onJoinChannel(channel.name);
                    }
                  }}
                  className={`flex-1 text-left px-3 lg:px-4 py-3 lg:py-2 text-sm lg:text-sm truncate flex items-center gap-2 lg:gap-2 rounded-md transition-colors duration-150 touch-manipulation ${
                    isActive 
                      ? 'bg-indigo-500 text-white' 
                      : hasUnread 
                        ? 'text-yellow-300 hover:bg-gray-700 active:bg-gray-600' 
                        : isJoined
                          ? 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                          : 'text-gray-500 hover:bg-gray-700 active:bg-gray-600'
                  }`}
                >
                  <HashtagIcon className="h-4 w-4 lg:h-4 lg:w-4 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                  {hasUnread && (
                    <span className="text-yellow-400 text-sm font-bold ml-auto">●</span>
                  )}
                  {!isJoined && (
                    <span className="text-gray-500 text-xs ml-auto">(not joined)</span>
                  )}
                </button>
                
                {isJoined && onLeaveChannel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeaveChannel(channel.name);
                    }}
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors duration-150 touch-manipulation"
                    title="Leave channel"
                  >
                    ×
                  </button>
                )}
                
                {!isJoined && onJoinChannel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinChannel(channel.name);
                    }}
                    className="px-2 py-1 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded transition-colors duration-150 touch-manipulation"
                    title="Join channel"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 lg:mb-2 px-2">Private Messages</h3>
        <div className="flex flex-col gap-1 lg:gap-1">
          {privateMessageUsers.map(user => {
            const isActive = activeContext?.type === 'pm' && activeContext.with === user.nickname;
            const hasUnread = unreadPMUsers?.has(user.nickname) || false;
            const isRecentlyAutoOpened = recentlyAutoOpenedPM === user.nickname;
            
            return (
              <button
                key={user.nickname}
                onClick={() => {
                  if (onPMClick) {
                    onPMClick(user.nickname);
                  } else {
                    onSelectContext({ type: 'pm', with: user.nickname });
                  }
                }}
                className={`w-full text-left px-3 lg:px-4 py-3 lg:py-2 text-sm lg:text-sm truncate flex items-center gap-2 lg:gap-2 rounded-md transition-all duration-300 touch-manipulation ${
                  isActive 
                    ? 'bg-indigo-500 text-white' 
                    : isRecentlyAutoOpened
                      ? 'bg-green-600/30 border border-green-500/50 text-green-200 hover:bg-green-500/40 animate-pulse'
                      : hasUnread 
                        ? 'text-yellow-300 hover:bg-gray-700 active:bg-gray-600' 
                        : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                }`}
              >
                <ProfilePicture user={user} size="sm" className="flex-shrink-0" />
                <span className="truncate">{user.nickname}</span>
                {hasUnread && (
                  <span className="text-yellow-400 text-sm font-bold ml-auto">●</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0 space-y-2">
        {onOpenChannelList && (
          <button 
            onClick={onOpenChannelList} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 lg:py-2 text-sm rounded-md transition-colors duration-150 bg-indigo-700 text-indigo-300 hover:bg-indigo-600 active:bg-indigo-500 touch-manipulation"
            aria-label="Open channel list to join/leave channels"
          >
            <HashtagIcon className="h-5 w-5" />
            <span>Channel List</span>
          </button>
        )}
        <button 
          onClick={onOpenSettings} 
          className="w-full flex items-center justify-center gap-2 px-4 py-3 lg:py-2 text-sm rounded-md transition-colors duration-150 bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500 touch-manipulation"
          aria-label="Open settings to configure channels and users"
        >
          <SettingsIcon className="h-5 w-5" />
          <span>Configure Simulation</span>
        </button>
        {onOpenChatLogs && (
          <button 
            onClick={onOpenChatLogs} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 lg:py-2 text-sm rounded-md transition-colors duration-150 bg-blue-700 text-blue-300 hover:bg-blue-600 active:bg-blue-500 touch-manipulation"
            aria-label="Open chat logs to view message history"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Chat Logs</span>
          </button>
        )}
        {onResetSpeakers && (
          <button 
            onClick={onResetSpeakers} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 lg:py-2 text-sm rounded-md transition-colors duration-150 bg-orange-700 text-orange-300 hover:bg-orange-600 active:bg-orange-500 touch-manipulation"
            aria-label="Reset user selection to force more diverse conversations"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset Speakers</span>
          </button>
        )}
      </div>
    </aside>
  );
};
