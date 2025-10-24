import React from 'react';
import type { NetworkUser } from '../services/networkService';

interface NetworkUsersProps {
  users: NetworkUser[];
  currentChannel?: string;
}

export const NetworkUsers: React.FC<NetworkUsersProps> = ({ users, currentChannel }) => {
  const filteredUsers = currentChannel 
    ? users.filter(user => user.channels.includes(currentChannel))
    : users;

  const humanUsers = filteredUsers.filter(user => user.type === 'human');
  const virtualUsers = filteredUsers.filter(user => user.type === 'virtual');
  const botUsers = filteredUsers.filter(user => user.type === 'bot');

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Network Users {currentChannel && `in ${currentChannel}`}
      </h3>

      {filteredUsers.length === 0 ? (
        <div className="text-gray-400 text-sm">
          No users connected
        </div>
      ) : (
        <div className="space-y-4">
          {humanUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">
                Human Users ({humanUsers.length})
              </h4>
              <div className="space-y-1">
                {humanUsers.map(user => (
                  <div key={user.nickname} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-white">{user.nickname}</span>
                    <span className="text-xs text-gray-400">
                      {user.status === 'away' ? '(away)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {virtualUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">
                Virtual Users ({virtualUsers.length})
              </h4>
              <div className="space-y-1">
                {virtualUsers.map(user => (
                  <div key={user.nickname} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-white">{user.nickname}</span>
                    <span className="text-xs text-gray-400">
                      {user.status === 'away' ? '(away)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {botUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-2">
                Bot Users ({botUsers.length})
              </h4>
              <div className="space-y-1">
                {botUsers.map(user => (
                  <div key={user.nickname} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-white">{user.nickname}</span>
                    <span className="text-xs text-gray-400">
                      {user.status === 'away' ? '(away)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Total: {filteredUsers.length} users
        </div>
        <div className="text-xs text-gray-400">
          Human: {humanUsers.length} | Virtual: {virtualUsers.length} | Bot: {botUsers.length}
        </div>
      </div>
    </div>
  );
};
