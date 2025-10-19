
import React from 'react';
import type { Channel, User, ActiveContext } from '../types';
import { UserIcon, HashtagIcon, SettingsIcon } from './icons';

interface ChannelListProps {
  channels: Channel[];
  privateMessageUsers: User[];
  activeContext: ActiveContext;
  onSelectContext: (context: ActiveContext) => void;
  onOpenSettings: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({ channels, privateMessageUsers, activeContext, onSelectContext, onOpenSettings }) => {
  const getButtonClass = (isActive: boolean) => 
    `w-full text-left px-4 py-2 text-sm truncate flex items-center gap-2 rounded-md transition-colors duration-150 ${
      isActive ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;

  return (
    <aside className="w-64 bg-gray-900 p-4 flex flex-col border-r border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-100">IRC Simulator</h2>
        <button onClick={onOpenSettings} className="text-gray-400 hover:text-white transition-colors" aria-label="Open settings">
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>
      
      <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 px-2">Channels</h3>
      <div className="flex flex-col gap-1 mb-6">
        {channels.map(channel => (
          <button
            key={channel.name}
            onClick={() => onSelectContext({ type: 'channel', name: channel.name })}
            className={getButtonClass(activeContext.type === 'channel' && activeContext.name === channel.name)}
          >
            <HashtagIcon className="h-4 w-4" />
            <span>{channel.name}</span>
          </button>
        ))}
      </div>
      
      <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 px-2">Private Messages</h3>
      <div className="flex flex-col gap-1">
        {privateMessageUsers.map(user => (
          <button
            key={user.nickname}
            onClick={() => onSelectContext({ type: 'pm', with: user.nickname })}
            className={getButtonClass(activeContext.type === 'pm' && activeContext.with === user.nickname)}
          >
            <UserIcon className="h-4 w-4" />
            <span>{user.nickname}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};
