
import React from 'react';
import type { User } from '../types';

interface UserListProps {
  users: User[];
  onUserClick: (nickname: string) => void;
  currentUserNickname: string;
}

export const UserList: React.FC<UserListProps> = ({ users, onUserClick, currentUserNickname }) => {
  return (
    <aside className="w-56 bg-gray-900 p-4 border-l border-gray-700 overflow-y-auto">
      <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 px-2">Users ({users.length})</h3>
      <div className="flex flex-col gap-1">
        {users.map(user => (
          user.nickname === currentUserNickname ? (
            <div key={user.nickname} className="px-3 py-1.5 text-sm text-cyan-400 font-bold flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{user.nickname} (You)</span>
            </div>
          ) : (
            <button
              key={user.nickname}
              onClick={() => onUserClick(user.nickname)}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 rounded-md flex items-center gap-2 transition-colors"
            >
              <span className={`h-2 w-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span>{user.nickname}</span>
            </button>
          )
        ))}
      </div>
    </aside>
  );
};
