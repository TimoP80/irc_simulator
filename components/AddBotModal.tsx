import React, { useState, useEffect } from 'react';
import { User, Channel } from '../types';
import { generateRandomWorldConfiguration } from '../services/geminiService';

interface AddBotModalProps {
  bot?: User | null;
  onSave: (bot: User) => void;
  onCancel: () => void;
  aiModel: string;
  channels: Channel[];
  currentUserNickname: string;
  onChannelsChange?: (channels: Channel[]) => void;
}

const BOT_TEMPLATES = [
  {
    name: 'ImageBot',
    personality: 'A helpful bot that generates AI images and provides visual content.',
    description: 'Generates AI images based on text prompts',
    commands: ['!image', '!img'],
    capabilities: ['image_generation', 'visual_content']
  },
  {
    name: 'InfoBot',
    personality: 'An informative bot that provides weather, time, and general information.',
    description: 'Provides weather, time, and informational services',
    commands: ['!weather', '!time', '!info', '!help'],
    capabilities: ['weather', 'time', 'information', 'help']
  },
  {
    name: 'FunBot',
    personality: 'A fun and entertaining bot that tells jokes, shares quotes, and provides amusement.',
    description: 'Provides entertainment with quotes, jokes, and interesting facts',
    commands: ['!quote', '!joke', '!fact'],
    capabilities: ['quotes', 'jokes', 'facts', 'entertainment']
  },
  {
    name: 'UtilBot',
    personality: 'A utility bot that helps with calculations, translations, and searches.',
    description: 'Provides utility functions like translation, calculation, and search',
    commands: ['!translate', '!calc', '!search'],
    capabilities: ['translation', 'calculation', 'search', 'utilities']
  }
];

const AVAILABLE_COMMANDS = [
  '!image', '!img', '!weather', '!time', '!info', '!help',
  '!quote', '!joke', '!fact', '!translate', '!calc', '!search'
];

const AVAILABLE_CAPABILITIES = [
  'image_generation', 'visual_content', 'weather', 'time', 'information', 'help',
  'quotes', 'jokes', 'facts', 'entertainment', 'translation', 'calculation', 'search', 'utilities'
];

export const AddBotModal: React.FC<AddBotModalProps> = ({
  bot,
  onSave,
  onCancel,
  aiModel,
  channels,
  currentUserNickname,
  onChannelsChange
}) => {
  const [nickname, setNickname] = useState(bot?.nickname || '');
  const [personality, setPersonality] = useState(bot?.personality || '');
  const [description, setDescription] = useState(bot?.botDescription || '');
  const [selectedCommands, setSelectedCommands] = useState<string[]>(bot?.botCommands || []);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(bot?.botCapabilities || []);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTemplateSelect = (templateName: string) => {
    const template = BOT_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setNickname(template.name);
      setPersonality(template.personality);
      setDescription(template.description);
      setSelectedCommands(template.commands);
      setSelectedCapabilities(template.capabilities);
      setSelectedTemplate(templateName);
    }
  };

  const handleCommandToggle = (command: string) => {
    setSelectedCommands(prev => 
      prev.includes(command) 
        ? prev.filter(c => c !== command)
        : [...prev, command]
    );
  };

  const handleCapabilityToggle = (capability: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capability) 
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    );
  };

  const handleGenerateBot = async () => {
    if (!nickname.trim()) {
      alert('Please enter a bot nickname first.');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedBot = await generateRandomWorldConfiguration(aiModel, {
        userCount: 1,
        channelCount: 1,
        includePersonalities: true,
        includeWritingStyles: true,
        includeLanguageSkills: true,
        primaryLanguage: 'English'
      });

      if (generatedBot.users && generatedBot.users.length > 0) {
        const generatedUser = generatedBot.users[0];
        setPersonality(generatedUser.personality || personality);
        setDescription(generatedUser.personality || description);
      }
    } catch (error) {
      console.error('Failed to generate bot:', error);
      alert('Failed to generate bot personality. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!nickname.trim()) {
      alert('Please enter a bot nickname.');
      return;
    }

    if (selectedCommands.length === 0) {
      alert('Please select at least one bot command.');
      return;
    }

    const newBot: User = {
      nickname: nickname.trim(),
      status: 'online',
      userType: 'bot',
      personality: personality.trim() || 'A helpful bot that provides various services.',
      languageSkills: {
        languages: [{ 
          language: 'English', 
          fluency: 'native', 
          accent: '' 
        }]
      },
      writingStyle: {
        formality: 'neutral',
        verbosity: 'neutral',
        humor: 'none',
        emojiUsage: 'medium',
        punctuation: 'standard'
      },
      botCommands: selectedCommands,
      botDescription: description.trim(),
      botCapabilities: selectedCapabilities
    };

    onSave(newBot);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {bot ? 'Edit Bot' : 'Add New Bot'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Bot Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BOT_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateSelect(template.name)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedTemplate === template.name
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium text-white">{template.name}</div>
                    <div className="text-xs text-gray-400">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Nickname *
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ImageBot, InfoBot"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerateBot}
                  disabled={isGenerating || !nickname.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isGenerating ? 'Generating...' : '🤖 Generate Personality'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What does this bot do?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Personality
              </label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                placeholder="Describe the bot's personality and behavior..."
              />
            </div>

            {/* Bot Commands */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Commands *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_COMMANDS.map((command) => (
                  <label key={command} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCommands.includes(command)}
                      onChange={() => handleCommandToggle(command)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{command}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bot Capabilities */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bot Capabilities
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_CAPABILITIES.map((capability) => (
                  <label key={capability} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCapabilities.includes(capability)}
                      onChange={() => handleCapabilityToggle(capability)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{capability.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {bot ? 'Update Bot' : 'Add Bot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
