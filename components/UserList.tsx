
import React from 'react';
import type { User, Channel } from '../types';
import { isChannelOperator } from '../types';

interface UserListProps {
  users: User[];
  onUserClick: (nickname: string) => void;
  currentUserNickname: string;
  channel?: Channel;
  onToggleOperator?: (nickname: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onUserClick, currentUserNickname, channel, onToggleOperator }) => {
  const isOperator = (nickname: string) => channel && isChannelOperator(channel, nickname);
  
  return (
    <aside className="w-56 bg-gray-900 p-4 border-l border-gray-700 overflow-y-auto">
      <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 px-2">Users ({users.length})</h3>
      
      {channel && (
        <div className="mb-3 p-2 bg-gray-800 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-300">Channel Operators</span>
                    <span className="text-xs text-gray-500">{(channel.operators || []).length}</span>
          </div>
          <div className="text-xs text-gray-400">
            Hover over users to manage operator status
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-1">
        {users.map(user => (
          user.nickname === currentUserNickname ? (
            <div key={user.nickname} className="px-3 py-1.5 text-sm text-cyan-400 font-bold flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{user.nickname} (You)</span>
              {isOperator(user.nickname) && (
                <span className="text-yellow-400 text-xs">@</span>
              )}
            </div>
          ) : (
            <div key={user.nickname} className="flex items-center gap-2 group">
              <button
                onClick={() => onUserClick(user.nickname)}
                className="flex-1 text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded-md flex items-center gap-2 transition-colors"
              >
                <span className={`h-2 w-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span>{user.nickname}</span>
                {isOperator(user.nickname) && (
                  <span className="text-yellow-400 text-xs">@</span>
                )}
              </button>
              {channel && onToggleOperator && (
                <button
                  onClick={() => onToggleOperator(user.nickname)}
                  className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                    isOperator(user.nickname) 
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-yellow-100' 
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  }`}
                  title={isOperator(user.nickname) ? 'Remove operator privileges' : 'Make operator (can kick/ban users)'}
                >
                  {isOperator(user.nickname) ? '👑 OP' : '👤 User'}
                </button>
              )}
            </div>
          )
        ))}
      </div>
    </aside>
  );
};
