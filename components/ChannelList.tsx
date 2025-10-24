
import React from 'react';
import type { Channel, User, ActiveContext } from '../types';
import { UserIcon, HashtagIcon, SettingsIcon } from './icons';

interface ChannelListProps {
  channels: Channel[];
  privateMessageUsers: User[];
  activeContext: ActiveContext;
  onSelectContext: (context: ActiveContext) => void;
  onOpenSettings: () => void;
  onOpenChatLogs?: () => void;
  onResetSpeakers?: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({ channels, privateMessageUsers, activeContext, onSelectContext, onOpenSettings, onOpenChatLogs, onResetSpeakers }) => {
  const getButtonClass = (isActive: boolean) => 
    `w-full text-left px-4 py-2 text-sm truncate flex items-center gap-2 rounded-md transition-colors duration-150 ${
      isActive ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;

  return (
    <aside className="w-full lg:w-64 bg-gray-900 p-2 lg:p-4 flex flex-col border-r border-gray-700 lg:border-b-0 border-b h-48 lg:h-auto lg:flex-1">
      <div className="flex justify-between items-center mb-2 lg:mb-4 flex-shrink-0">
        <h2 className="text-sm lg:text-lg font-bold text-gray-100">IRC Simulator</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto -mr-2 lg:-mr-4 pr-2 lg:pr-4">
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-1 lg:mb-2 px-2">Channels</h3>
        <div className="flex flex-col gap-0.5 lg:gap-1 mb-3 lg:mb-6">
          {channels.map(channel => (
            <button
              key={channel.name}
              onClick={() => onSelectContext({ type: 'channel', name: channel.name })}
              className={`w-full text-left px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm truncate flex items-center gap-1 lg:gap-2 rounded-md transition-colors duration-150 ${
                activeContext?.type === 'channel' && activeContext.name === channel.name ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <HashtagIcon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
        
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-1 lg:mb-2 px-2">Private Messages</h3>
        <div className="flex flex-col gap-0.5 lg:gap-1">
          {privateMessageUsers.map(user => (
            <button
              key={user.nickname}
              onClick={() => onSelectContext({ type: 'pm', with: user.nickname })}
              className={`w-full text-left px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm truncate flex items-center gap-1 lg:gap-2 rounded-md transition-colors duration-150 ${
                activeContext?.type === 'pm' && activeContext.with === user.nickname ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <UserIcon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
              <span className="truncate">{user.nickname}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0 space-y-2">
        <button 
          onClick={onOpenSettings} 
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md transition-colors duration-150 bg-gray-700 text-gray-300 hover:bg-gray-600"
          aria-label="Open settings to configure channels and users"
        >
          <SettingsIcon className="h-5 w-5" />
          <span>Configure Simulation</span>
        </button>
        {onOpenChatLogs && (
          <button 
            onClick={onOpenChatLogs} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md transition-colors duration-150 bg-blue-700 text-blue-300 hover:bg-blue-600"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md transition-colors duration-150 bg-orange-700 text-orange-300 hover:bg-orange-600"
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
