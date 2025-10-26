import React, { useState, useEffect } from 'react';
import { User, Channel, isPerLanguageFormat, isLegacyFormat, getAllLanguages } from '../types';
import { AddUserModal } from './AddUserModal';
import { BatchUserModal } from './BatchUserModal';
import { ImportExportModal } from './ImportExportModal';

interface UserManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  aiModel: string;
  channels: Channel[];
  currentUserNickname: string;
  onChannelsChange?: (channels: Channel[]) => void;
}

// Helper function to convert internal values to display text
const formatWritingStyleValue = (value: string, type: 'formality' | 'verbosity' | 'humor' | 'emojiUsage' | 'punctuation'): string => {
  const mappings = {
    formality: {
      'very_informal': 'Very Informal',
      'informal': 'Informal',
      'neutral': 'Neutral',
      'formal': 'Formal',
      'very_formal': 'Very Formal'
    },
    verbosity: {
      'very_terse': 'Very Terse',
      'terse': 'Terse',
      'neutral': 'Neutral',
      'verbose': 'Verbose',
      'very_verbose': 'Very Verbose'
    },
    humor: {
      'none': 'None',
      'dry': 'Dry',
      'sarcastic': 'Sarcastic',
      'witty': 'Witty',
      'slapstick': 'Slapstick'
    },
    emojiUsage: {
      'none': 'None',
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'excessive': 'Excessive'
    },
    punctuation: {
      'minimal': 'Minimal',
      'standard': 'Standard',
      'creative': 'Creative',
      'excessive': 'Excessive'
    }
  };
  
  return mappings[type][value as keyof typeof mappings[typeof type]] || value;
};

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUsersChange, aiModel, channels, currentUserNickname, onChannelsChange }) => {
  // Deduplicate users by nickname to prevent React key collisions
  const uniqueUsers = users.reduce((acc, user) => {
    if (!acc.find(u => u.nickname === user.nickname)) {
      acc.push(user);
    }
    return acc;
  }, [] as User[]);
  
  // Debug logging to help identify duplicate issues
  if (users.length !== uniqueUsers.length) {
    console.warn(`[UserManagement] Found duplicate users. Original: ${users.length}, Deduplicated: ${uniqueUsers.length}`);
    console.warn('[UserManagement] Duplicate users:', users.map(u => u.nickname));
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Listen for custom event to open channel log export
  useEffect(() => {
    const handleOpenChannelLogExport = () => {
      setIsImportExportModalOpen(true);
    };

    window.addEventListener('openChannelLogExport', handleOpenChannelLogExport);
    return () => {
      window.removeEventListener('openChannelLogExport', handleOpenChannelLogExport);
    };
  }, []);

  const handleAddUser = (user: User) => {
    onUsersChange([...users, user]);
  };

  const handleUpdateUser = (oldNickname: string, newUser: User) => {
    const updatedUsers = users.map(user => 
      user.nickname === oldNickname ? newUser : user
    );
    onUsersChange(updatedUsers);
    setEditingUser(null);
  };

  const handleDeleteUser = (nickname: string) => {
    if (window.confirm(`Are you sure you want to delete the user "${nickname}"?`)) {
      onUsersChange(users.filter(user => user.nickname !== nickname));
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddModalOpen(true);
  };

  const handleAddUsers = (newUsers: User[]) => {
    onUsersChange([...users, ...newUsers]);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingUser(null);
  };

  const handleCloseBatchModal = () => {
    setIsBatchModalOpen(false);
  };

  const handleCloseImportExportModal = () => {
    setIsImportExportModalOpen(false);
  };

  const handleImportUsers = (importedUsers: User[]) => {
    onUsersChange([...users, ...importedUsers]);
  };

  // Get channels where a user is assigned
  const getUserChannels = (user: User): Channel[] => {
    return channels.filter(channel => 
      channel.users && channel.users.some(channelUser => channelUser.nickname === user.nickname)
    );
  };

  // Assign user to a channel
  const assignUserToChannel = (user: User, channelName: string) => {
    if (!onChannelsChange) return;
    
    const updatedChannels = channels.map(channel => {
      if (channel.name === channelName) {
        // Check if user is already in this channel
        const isAlreadyInChannel = channel.users && channel.users.some(u => u.nickname === user.nickname);
        if (!isAlreadyInChannel) {
          return {
            ...channel,
            users: [...(channel.users || []), user]
          };
        }
      }
      return channel;
    });
    
    onChannelsChange(updatedChannels);
  };

  // Remove user from a channel
  const removeUserFromChannel = (user: User, channelName: string) => {
    if (!onChannelsChange) return;
    
    const updatedChannels = channels.map(channel => {
      if (channel.name === channelName) {
        return {
          ...channel,
          users: (channel.users || []).filter(u => u.nickname !== user.nickname)
        };
      }
      return channel;
    });
    
    onChannelsChange(updatedChannels);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Virtual Users</h3>
        <div className="flex items-center gap-2">
          {uniqueUsers.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to clear all ${uniqueUsers.length} users? This action cannot be undone.`)) {
                  onUsersChange([]);
                }
              }}
              className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-red-500 transition-colors flex items-center gap-2"
              title="Clear all users"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsImportExportModalOpen(true)}
            className="bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-orange-500 transition-colors flex items-center gap-2"
            title="Import or export users"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Data Export
          </button>
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-purple-500 transition-colors flex items-center gap-2"
            title="Add multiple users at once"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mass Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {uniqueUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-lg font-medium mb-2">No users yet</p>
          <p className="text-sm">Add your first virtual user to get started</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {uniqueUsers.map((user, index) => (
            <div
              key={`${user.nickname}-${index}`}
              className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white text-lg">{user.nickname}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                      AI User
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                      {user.languageSkills?.languages?.[0]?.fluency || 'unknown'}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">{user.personality}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-gray-400 font-medium">Languages:</span>
                      <p className="text-gray-300">
                        {isPerLanguageFormat(user.languageSkills) 
                          ? user.languageSkills.languages.map(lang => `${lang.language} (${lang.fluency})`).join(', ')
                          : getAllLanguages(user.languageSkills).join(', ') || 'Not specified'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Style:</span>
                      <p className="text-gray-300">{formatWritingStyleValue(user.writingStyle?.formality || 'neutral', 'formality')} • {formatWritingStyleValue(user.writingStyle?.verbosity || 'neutral', 'verbosity')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Accents:</span>
                      <p className="text-gray-300">
                        {(() => {
                          const languages = isPerLanguageFormat(user.languageSkills) ? user.languageSkills.languages : [];
                          const accents = languages.filter(lang => lang.accent).map(lang => `${lang.language} (${lang.accent})`);
                          return accents.length > 0 ? accents.join(', ') : 'None';
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Humor:</span>
                      <p className="text-gray-300">{formatWritingStyleValue(user.writingStyle?.humor || 'none', 'humor')}</p>
                    </div>
                  </div>

                  {/* Channel Assignments */}
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 font-medium text-xs">Channel Assignments:</span>
                      {onChannelsChange && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              assignUserToChannel(user, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-gray-600 text-white text-xs rounded px-2 py-1 border border-gray-500"
                          defaultValue=""
                        >
                          <option value="">Add to channel...</option>
                          {channels
                            .filter(channel => !channel.users || !channel.users.some(u => u.nickname === user.nickname))
                            .map(channel => (
                              <option key={channel.name} value={channel.name}>
                                {channel.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getUserChannels(user).map(channel => (
                        <span
                          key={channel.name}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200"
                        >
                          {channel.name}
                          {onChannelsChange && (
                            <button
                              onClick={() => removeUserFromChannel(user, channel.name)}
                              className="ml-1 text-indigo-300 hover:text-indigo-100"
                              title={`Remove from ${channel.name}`}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {getUserChannels(user).length === 0 && (
                        <span className="text-gray-500 text-xs italic">Not assigned to any channels</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit user"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user.nickname)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete user"
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

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        existingNicknames={users.map(u => u.nickname)}
        editingUser={editingUser}
        channels={channels}
        onChannelsChange={onChannelsChange}
      />

      <BatchUserModal
        isOpen={isBatchModalOpen}
        onClose={handleCloseBatchModal}
        onAddUsers={handleAddUsers}
        existingNicknames={users.map(u => u.nickname)}
        aiModel={aiModel}
      />

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={handleCloseImportExportModal}
        users={users}
        channels={channels}
        currentUserNickname={currentUserNickname}
        onImportUsers={handleImportUsers}
      />
    </div>
  );
};
