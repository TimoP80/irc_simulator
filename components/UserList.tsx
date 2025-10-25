
import React from 'react';
import type { User, Channel } from '../types';
import { isChannelOperator } from '../types';

interface UserListProps {
  users: User[];
  onUserClick: (nickname: string) => void;
  currentUserNickname: string;
  channel?: Channel;
  onToggleOperator?: (nickname: string) => void;
  networkNickname?: string | null;
  isNetworkConnected?: boolean;
  unreadPMUsers?: Set<string>;
}

export const UserList: React.FC<UserListProps> = ({ users, onUserClick, currentUserNickname, channel, onToggleOperator, networkNickname, isNetworkConnected, unreadPMUsers }) => {
  const isOperator = (nickname: string) => channel && isChannelOperator(channel, nickname);
  
  return (
    <aside className="w-full lg:w-56 bg-gray-900 p-2 lg:p-4 border-l border-gray-700 lg:border-t-0 border-t overflow-y-auto h-32 lg:h-auto lg:flex-1">
      <h3 className="text-xs font-bold uppercase text-gray-500 mb-1 lg:mb-2 px-2">Users ({users.length})</h3>
      
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
      
      <div className="flex flex-col gap-0.5 lg:gap-1">
        {users.map((user, index) => {
          const isCurrentUser = user.nickname === currentUserNickname;
          const isNetworkUser = user.personality === 'Network User';
          const isCurrentNetworkUser = isNetworkConnected && networkNickname && user.nickname === networkNickname;
          const hasUnreadPM = unreadPMUsers?.has(user.nickname) || false;
          
          return isCurrentUser ? (
            <div key={`${user.nickname}-${index}-current`} className={`px-2 lg:px-3 py-2 lg:py-2.5 text-xs lg:text-sm rounded-md font-bold flex items-center gap-1 lg:gap-2 ${
              isCurrentNetworkUser 
                ? 'bg-blue-900/40 border border-blue-500/50 text-blue-200' 
                : 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-300'
            }`}>
              <span className={`h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full ${
                user.status === 'online' 
                  ? (isNetworkUser ? 'bg-blue-500' : 'bg-green-500')
                  : 'bg-yellow-500'
              }`}></span>
              <span className="truncate flex items-center gap-1">
                <span className="font-bold">{user.nickname}</span>
                <span className={`text-xs font-normal ${
                  isCurrentNetworkUser ? 'text-blue-300' : 'text-cyan-400'
                }`}>
                  {isCurrentNetworkUser ? '(Network)' : '(You)'}
                </span>
              </span>
              {isNetworkUser && (
                <span className="text-blue-400 text-xs">🌐</span>
              )}
              {isCurrentNetworkUser && (
                <span className="text-blue-300 text-xs">🔗</span>
              )}
              {isOperator(user.nickname) && (
                <span className="text-yellow-400 text-xs">@</span>
              )}
            </div>
          ) : (
            <div key={user.nickname} className="flex items-center gap-1 lg:gap-2 group">
              <button
                onClick={() => onUserClick(user.nickname)}
                className={`flex-1 text-left px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm rounded-md flex items-center gap-1 lg:gap-2 transition-colors ${
                  hasUnreadPM 
                    ? 'bg-orange-900/40 border border-orange-500/50 text-orange-200 hover:bg-orange-800/50' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className={`h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full ${
                  user.status === 'online' 
                    ? (isNetworkUser ? 'bg-blue-500' : 'bg-green-500')
                    : 'bg-yellow-500'
                }`}></span>
                <span className="truncate">{user.nickname}</span>
                {hasUnreadPM && (
                  <span className="text-orange-400 text-xs font-bold">●</span>
                )}
                {isNetworkUser && (
                  <span className="text-blue-400 text-xs">🌐</span>
                )}
                {isCurrentNetworkUser && (
                  <span className="text-blue-300 text-xs">🔗</span>
                )}
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
          );
        })}
      </div>
    </aside>
  );
};
