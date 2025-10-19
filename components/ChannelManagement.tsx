import React, { useState } from 'react';
import { AddChannelModal } from './AddChannelModal';

interface Channel {
  name: string;
  topic: string;
}

interface ChannelManagementProps {
  channels: Channel[];
  onChannelsChange: (channels: Channel[]) => void;
}

export const ChannelManagement: React.FC<ChannelManagementProps> = ({ channels, onChannelsChange }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const handleAddChannel = (name: string, topic: string) => {
    const newChannel: Channel = { name, topic };
    onChannelsChange([...channels, newChannel]);
  };

  const handleUpdateChannel = (oldName: string, newName: string, topic: string) => {
    const updatedChannels = channels.map(channel => 
      channel.name === oldName 
        ? { name: newName, topic }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Channels</h3>
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
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{channel.topic}</p>
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
    </div>
  );
};
