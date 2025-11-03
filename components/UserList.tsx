
import React, { useState, useEffect } from 'react';
import type { User, Channel } from '../types';
import { isChannelOperator } from '../types';
import { ProfilePicture } from './ProfilePicture';

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
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nickname: string } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, nickname: string) => {
    if (!channel || !onToggleOperator) return;
    event.preventDefault();
    setContextMenu({
      x: event.pageX,
      y: event.pageY,
      nickname: nickname,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
    };
    if (contextMenu) {
      document.addEventListener('click', handleClick);
    }
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu]);
  
  return (
    <aside className="w-full lg:w-56 bg-gray-900 p-3 lg:p-4 border-l border-gray-700 lg:border-t-0 border-t overflow-y-auto h-full lg:h-auto lg:flex-1 relative">
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1"
        >
          <ul className="text-sm text-gray-200">
            <li
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleOperator) {
                  onToggleOperator(contextMenu.nickname);
                }
                closeContextMenu();
              }}
            >
              {isOperator(contextMenu.nickname) ? 'Remove Operator' : 'Make Operator'}
            </li>
          </ul>
        </div>
      )}
      <h3 className="text-sm font-bold uppercase text-gray-500 mb-2 lg:mb-2 px-2">Users ({users.length})</h3>
      
      {channel && (
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Channel Operators</span>
            <span className="text-sm text-gray-500">{(channel.operators || []).length}</span>
          </div>
          <div className="text-sm text-gray-400">
            Tap users to manage operator status
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-1 lg:gap-1">
        {users.map((user, index) => {
          const isCurrentUser = user.nickname === currentUserNickname;
          const isNetworkUser = user.personality === 'Network User';
          const isCurrentNetworkUser = isNetworkConnected && networkNickname && user.nickname === networkNickname;
          const hasUnreadPM = unreadPMUsers?.has(user.nickname) || false;
          
          return isCurrentUser ? (
            <div key={`${user.nickname}-current`} className={`px-3 lg:px-3 py-3 lg:py-2.5 text-sm lg:text-sm rounded-md font-bold flex items-center gap-2 lg:gap-2 ${
              isCurrentNetworkUser 
                ? 'bg-blue-900/40 border border-blue-500/50 text-blue-200' 
                : 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-300'
            }`}>
              <ProfilePicture user={user} size="sm" className="flex-shrink-0" />
              <span className="truncate flex items-center gap-1">
                <span className="font-bold">{user.nickname}</span>
                <span className={`text-sm font-normal ${
                  isCurrentNetworkUser ? 'text-blue-300' : 'text-cyan-400'
                }`}>
                  {isCurrentNetworkUser ? '(Network)' : '(You)'}
                </span>
              </span>
              {isNetworkUser && (
                <span className="text-blue-400 text-sm">🌐</span>
              )}
              {isCurrentNetworkUser && (
                <span className="text-blue-300 text-sm">🔗</span>
              )}
              {isOperator(user.nickname) && (
                <span className="text-yellow-400 text-sm">@</span>
              )}
            </div>
          ) : (
            <div key={user.nickname} className="flex items-center gap-2 lg:gap-2 group">
              <button
                onClick={() => onUserClick(user.nickname)}
                onContextMenu={(e) => handleContextMenu(e, user.nickname)}
                className={`flex-1 text-left px-3 lg:px-3 py-3 lg:py-1.5 text-sm lg:text-sm rounded-md flex items-center gap-2 lg:gap-2 transition-colors touch-manipulation ${
                  hasUnreadPM 
                    ? 'bg-orange-900/40 border border-orange-500/50 text-orange-200 hover:bg-orange-800/50 active:bg-orange-700/50' 
                    : 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                }`}
              >
                <ProfilePicture user={user} size="sm" className="flex-shrink-0" />
                <span className="truncate">{user.nickname}</span>
                {hasUnreadPM && (
                  <span className="text-orange-400 text-sm font-bold">●</span>
                )}
                {isNetworkUser && (
                  <span className="text-blue-400 text-sm">🌐</span>
                )}
                {isCurrentNetworkUser && (
                  <span className="text-blue-300 text-sm">🔗</span>
                )}
                {isOperator(user.nickname) && (
                  <span className="text-yellow-400 text-sm">@</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
