import React, { useState } from 'react';
import { User, Channel } from '../types';
import { AddBotModal } from './AddBotModal';

interface BotManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  aiModel: string;
  channels: Channel[];
  currentUserNickname: string;
  onChannelsChange?: (channels: Channel[]) => void;
}

export const BotManagement: React.FC<BotManagementProps> = ({
  users,
  onUsersChange,
  aiModel,
  channels,
  currentUserNickname,
  onChannelsChange
}) => {
  const [isAddBotModalOpen, setIsAddBotModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<User | null>(null);

  // Filter bots from users
  const bots = users.filter(user => user.userType === 'bot');
  const virtualUsers = users.filter(user => user.userType === 'virtual');

  const handleAddBot = () => {
    setEditingBot(null);
    setIsAddBotModalOpen(true);
  };

  const handleEditBot = (bot: User) => {
    setEditingBot(bot);
    setIsAddBotModalOpen(true);
  };

  const handleDeleteBot = (botNickname: string) => {
    if (window.confirm(`Are you sure you want to delete bot "${botNickname}"?`)) {
      const updatedUsers = users.filter(user => user.nickname !== botNickname);
      onUsersChange(updatedUsers);
    }
  };

  const handleSaveBot = (bot: User) => {
    if (editingBot) {
      // Update existing bot
      const updatedUsers = users.map(user => 
        user.nickname === editingBot.nickname ? bot : user
      );
      onUsersChange(updatedUsers);
    } else {
      // Add new bot
      onUsersChange([...users, bot]);
    }
    setIsAddBotModalOpen(false);
    setEditingBot(null);
  };

  const getBotCapabilityIcon = (capability: string) => {
    const icons: { [key: string]: string } = {
      'image_generation': '🖼️',
      'visual_content': '🎨',
      'weather': '🌤️',
      'time': '🕐',
      'information': 'ℹ️',
      'help': '❓',
      'quotes': '💭',
      'jokes': '😄',
      'facts': '🧠',
      'entertainment': '🎭',
      'translation': '🌍',
      'calculation': '🧮',
      'search': '🔍',
      'utilities': '🔧'
    };
    return icons[capability] || '🤖';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Bot Management</h3>
        <button
          onClick={handleAddBot}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Bot
        </button>
      </div>

      {bots.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🤖</div>
          <p>No bots configured yet.</p>
          <p className="text-sm">Add bots to provide AI-powered services like image generation, weather, and more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div key={bot.nickname} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 font-bold text-lg">🤖 {bot.nickname}</span>
                    <span className="text-xs bg-amber-900 text-amber-200 px-2 py-1 rounded">BOT</span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{bot.personality}</p>
                  
                  {bot.botDescription && (
                    <p className="text-gray-400 text-xs mb-2">{bot.botDescription}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    {bot.botCommands?.map((command, index) => (
                      <span key={index} className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                        {command}
                      </span>
                    ))}
                  </div>

                  {bot.botCapabilities && bot.botCapabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bot.botCapabilities.map((capability, index) => (
                        <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                          {getBotCapabilityIcon(capability)} {capability.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditBot(bot)}
                    className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBot(bot.nickname)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddBotModalOpen && (
        <AddBotModal
          bot={editingBot}
          onSave={handleSaveBot}
          onCancel={() => {
            setIsAddBotModalOpen(false);
            setEditingBot(null);
          }}
          aiModel={aiModel}
          channels={channels}
          currentUserNickname={currentUserNickname}
          onChannelsChange={onChannelsChange}
        />
      )}
    </div>
  );
};
