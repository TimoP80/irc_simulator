
import React from 'react';
import type { User, Channel, isChannelOperator } from '../types';

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
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded transition-opacity"
                  title={isOperator(user.nickname) ? 'Remove operator' : 'Make operator'}
                >
                  {isOperator(user.nickname) ? '👑' : '👤'}
                </button>
              )}
            </div>
          )
        ))}
      </div>
    </aside>
  );
};
