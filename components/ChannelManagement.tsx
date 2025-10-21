import React, { useState } from 'react';
import { AddChannelModal } from './AddChannelModal';
import { ChannelImportExportModal } from './ChannelImportExportModal';
import { Channel, User, addChannelOperator, removeChannelOperator, isChannelOperator } from '../types';
import { clearChannelLogs } from '../utils/config';

interface ChannelManagementProps {
  channels: Channel[];
  onChannelsChange: (channels: Channel[]) => void;
  allUsers?: User[];
}

export const ChannelManagement: React.FC<ChannelManagementProps> = ({ channels, onChannelsChange, allUsers = [] }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const handleAddChannel = (name: string, topic: string, dominantLanguage?: string) => {
    const newChannel: Channel = { 
      name, 
      topic, 
      users: [], 
      messages: [],
      operators: [],
      dominantLanguage
    };
    onChannelsChange([...channels, newChannel]);
  };

  const handleUpdateChannel = (oldName: string, newName: string, topic: string, dominantLanguage?: string) => {
    const updatedChannels = channels.map(channel => 
      channel.name === oldName 
        ? { ...channel, name: newName, topic, dominantLanguage }
        : channel
    );
    onChannelsChange(updatedChannels);
    setEditingChannel(null);
  };

  const handleDeleteChannel = (name: string) => {
    if (window.confirm(`Are you sure you want to delete the channel "${name}"?`)) {
      onChannelsChange(channels.filter(channel => channel.name !== name));
    }
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingChannel(null);
  };

  const handleCloseImportExportModal = () => {
    setIsImportExportModalOpen(false);
  };

  const handleToggleOperator = (channelName: string, nickname: string) => {
    const updatedChannels = channels.map(channel => {
      if (channel.name === channelName) {
        if (isChannelOperator(channel, nickname)) {
          return removeChannelOperator(channel, nickname);
        } else {
          return addChannelOperator(channel, nickname);
        }
      }
      return channel;
    });
    onChannelsChange(updatedChannels);
  };

  const handleImportChannels = (importedChannels: Channel[]) => {
    onChannelsChange([...channels, ...importedChannels]);
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all channel logs? This will remove all message history from all channels. This action cannot be undone.')) {
      // Clear logs from localStorage
      clearChannelLogs();
      
      // Clear messages from all channels but keep the channels themselves
      const clearedChannels = channels.map(channel => ({
        ...channel,
        messages: []
      }));
      
      onChannelsChange(clearedChannels);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Channels</h3>
        <div className="flex items-center gap-2">
          {channels.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleClearLogs}
                className="bg-orange-600 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-orange-500 transition-colors flex items-center gap-2"
                title="Clear all channel message logs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Logs
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to clear all ${channels.length} channels? This action cannot be undone.`)) {
                    onChannelsChange([]);
                  }
                }}
                className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-red-500 transition-colors flex items-center gap-2"
                title="Clear all channels"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsImportExportModalOpen(true)}
            className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-500 transition-colors flex items-center gap-2"
            title="Import or export channels"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import/Export
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Channel
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium mb-2">No channels yet</p>
          <p className="text-sm">Add your first channel to get started</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {channels.map((channel, index) => (
            <div
              key={`${channel.name}-${index}`}
              className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-indigo-400 text-lg">{channel.name}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                      Channel
                    </span>
                    {channel.messages && channel.messages.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                        {channel.messages.length} messages
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">{channel.topic}</p>
                  
                  {/* Dominant Language Setting */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Dominant Language
                    </label>
                    <select
                      value={channel.dominantLanguage || ''}
                      onChange={(e) => {
                        const updatedChannels = channels.map(c => 
                          c.name === channel.name 
                            ? { ...c, dominantLanguage: e.target.value || undefined }
                            : c
                        );
                        onChannelsChange(updatedChannels);
                      }}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Auto-detect from users</option>
                      <option value="English">English</option>
                      <option value="Finnish">Finnish</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Russian">Russian</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Korean">Korean</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Dutch">Dutch</option>
                      <option value="Swedish">Swedish</option>
                      <option value="Norwegian">Norwegian</option>
                      <option value="Danish">Danish</option>
                    </select>
                  </div>
                  
                  {/* Operator Management */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">Channel Operators ({(channel.operators || []).length})</span>
                    </div>
                    
                    {(channel.operators || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(channel.operators || []).map(operator => (
                          <span key={operator} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-600 text-yellow-100">
                            @{operator}
                            <button
                              onClick={() => handleToggleOperator(channel.name, operator)}
                              className="text-yellow-200 hover:text-yellow-100"
                              title="Remove operator"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Operator Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleToggleOperator(channel.name, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-gray-600 text-white text-xs rounded px-2 py-1 border border-gray-500"
                        defaultValue=""
                      >
                        <option value="">Add operator...</option>
                        {allUsers
                          .filter(user => !isChannelOperator(channel, user.nickname))
                          .map(user => (
                            <option key={user.nickname} value={user.nickname}>
                              {user.nickname}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEditChannel(channel)}
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit channel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChannel(channel.name)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete channel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAddChannel={handleAddChannel}
        onUpdateChannel={handleUpdateChannel}
        existingChannelNames={channels.map(c => c.name)}
        editingChannel={editingChannel}
      />

      <ChannelImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={handleCloseImportExportModal}
        channels={channels}
        onImportChannels={handleImportChannels}
      />
    </div>
  );
};
