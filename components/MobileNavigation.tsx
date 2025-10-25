import React from 'react';
import { HashtagIcon, UserIcon, WifiIcon, MessageSquareIcon, MenuIcon, XIcon } from './icons';

interface MobileNavigationProps {
  activePanel: 'chat' | 'channels' | 'users' | 'network';
  onPanelChange: (panel: 'chat' | 'channels' | 'users' | 'network') => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  unreadChannels?: Set<string>;
  unreadPMUsers?: Set<string>;
  isNetworkConnected?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activePanel,
  onPanelChange,
  isMenuOpen,
  onMenuToggle,
  unreadChannels,
  unreadPMUsers,
  isNetworkConnected
}) => {
  const navItems = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquareIcon, hasUnread: false },
    { id: 'channels' as const, label: 'Channels', icon: HashtagIcon, hasUnread: unreadChannels && unreadChannels.size > 0 },
    { id: 'users' as const, label: 'Users', icon: UserIcon, hasUnread: unreadPMUsers && unreadPMUsers.size > 0 },
    { id: 'network' as const, label: 'Network', icon: WifiIcon, hasUnread: false }
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onMenuToggle}
          className="p-2 text-gray-400 hover:text-white transition-colors duration-150"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
        
        <h1 className="text-lg font-semibold text-white">IRC Simulator</h1>
        
        <div className="w-10 h-10 flex items-center justify-center">
          {isNetworkConnected && (
            <div className="w-3 h-3 bg-green-500 rounded-full" title="Connected to network" />
          )}
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden bg-gray-800 border-b border-gray-700 flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPanelChange(item.id)}
              className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors duration-150 relative ${
                isActive 
                  ? 'text-indigo-400 bg-indigo-900/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.hasUnread && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onMenuToggle}>
          <div className="absolute right-0 top-0 h-full w-80 bg-gray-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Menu</h2>
                <button
                  onClick={onMenuToggle}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  onPanelChange('channels');
                  onMenuToggle();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-150"
              >
                <HashtagIcon className="w-5 h-5" />
                <span>Channel List</span>
                {unreadChannels && unreadChannels.size > 0 && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full ml-auto" />
                )}
              </button>
              
              <button
                onClick={() => {
                  onPanelChange('users');
                  onMenuToggle();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-150"
              >
                <UserIcon className="w-5 h-5" />
                <span>User List</span>
                {unreadPMUsers && unreadPMUsers.size > 0 && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full ml-auto" />
                )}
              </button>
              
              <button
                onClick={() => {
                  onPanelChange('network');
                  onMenuToggle();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-150"
              >
                <WifiIcon className="w-5 h-5" />
                <span>Network</span>
                {isNetworkConnected && (
                  <div className="w-2 h-2 bg-green-400 rounded-full ml-auto" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
