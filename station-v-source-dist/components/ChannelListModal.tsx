import React, { useState, useEffect } from 'react';
import type { Channel, User, ActiveContext } from '../types';
import { HashtagIcon, UserIcon } from './icons';
import { ProfilePicture } from './ProfilePicture';

interface ChannelListModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  currentUserNickname: string;
  onJoinChannel: (channelName: string) => void;
  onLeaveChannel: (channelName: string) => void;
  onOpenPM: (nickname: string) => void;
  privateMessageUsers: User[];
  unreadChannels?: Set<string>;
  unreadPMUsers?: Set<string>;
  activeContext?: ActiveContext | null; // Add active context to track currently open channel/PM
}

export const ChannelListModal: React.FC<ChannelListModalProps> = ({
  isOpen,
  onClose,
  channels,
  currentUserNickname,
  onJoinChannel,
  onLeaveChannel,
  onOpenPM,
  privateMessageUsers,
  unreadChannels,
  unreadPMUsers,
  activeContext
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [filteredPMUsers, setFilteredPMUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChannels(filtered);
  }, [channels, searchTerm]);

  useEffect(() => {
    const filtered = privateMessageUsers.filter(user =>
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPMUsers(filtered);
  }, [privateMessageUsers, searchTerm]);

  if (!isOpen) return null;

  const handleJoinChannel = (channelName: string) => {
    onJoinChannel(channelName);
    onClose();
  };

  const handleLeaveChannel = (channelName: string) => {
    onLeaveChannel(channelName);
    onClose();
  };

  const handleOpenPM = (nickname: string) => {
    onOpenPM(nickname);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Channel List</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-150"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search channels and users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Channels Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <HashtagIcon className="w-5 h-5" />
              Channels ({filteredChannels.length})
            </h3>
            <div className="space-y-2">
              {filteredChannels.map(channel => {
                const hasUnread = unreadChannels?.has(channel.name) || false;
                const userCount = channel.users?.length || 0;
                const isJoined = userCount > 0;
                const isActive = activeContext?.type === 'channel' && activeContext.name === channel.name;
                
                return (
                  <div
                    key={channel.name}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-150 ${
                      isActive 
                        ? 'bg-indigo-600 border border-indigo-500' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium truncate ${isActive ? 'text-white' : 'text-white'}`}>
                          {channel.name}
                        </span>
                        {hasUnread && (
                          <span className="text-yellow-400 text-sm font-bold">●</span>
                        )}
                        {isActive && (
                          <span className="text-indigo-200 text-xs bg-indigo-500 px-2 py-1 rounded">
                            Active
                          </span>
                        )}
                        {isJoined && !isActive && (
                          <span className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">
                            Joined
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {channel.topic}
                      </p>
                      <p className={`text-xs mt-1 ${isActive ? 'text-indigo-300' : 'text-gray-500'}`}>
                        {userCount} user{userCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      {isActive ? (
                        <span className="px-3 py-1 bg-indigo-500 text-indigo-100 text-sm rounded">
                          Current
                        </span>
                      ) : isJoined ? (
                        <button
                          onClick={() => handleLeaveChannel(channel.name)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors duration-150"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinChannel(channel.name)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors duration-150"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredChannels.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  {searchTerm ? 'No channels found matching your search.' : 'No channels available.'}
                </p>
              )}
            </div>
          </div>

          {/* Private Messages Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Private Messages ({filteredPMUsers.length})
            </h3>
            <div className="space-y-2">
              {filteredPMUsers.map(user => {
                const hasUnread = unreadPMUsers?.has(user.nickname) || false;
                const isActive = activeContext?.type === 'pm' && activeContext.with === user.nickname;
                
                return (
                  <div
                    key={user.nickname}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-150 ${
                      isActive 
                        ? 'bg-indigo-600 border border-indigo-500' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ProfilePicture user={user} size="sm" className="flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isActive ? 'text-white' : 'text-white'}`}>
                            {user.nickname}
                          </span>
                          {hasUnread && (
                            <span className="text-yellow-400 text-sm font-bold">●</span>
                          )}
                          {isActive && (
                            <span className="text-indigo-200 text-xs bg-indigo-500 px-2 py-1 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {user.personality}
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="px-3 py-1 bg-indigo-500 text-indigo-100 text-sm rounded">
                        Current
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenPM(user.nickname)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors duration-150"
                      >
                        Open PM
                      </button>
                    )}
                  </div>
                );
              })}
              {filteredPMUsers.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  {searchTerm ? 'No users found matching your search.' : 'No private message users available.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
