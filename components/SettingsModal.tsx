import React, { useState, useEffect } from 'react';
import type { AppConfig, User, GeminiModel, Channel } from '../types';
import { loadConfig, saveConfig } from '../utils/config';
import { DEFAULT_NICKNAME, FALLBACK_AI_MODELS, DEFAULT_AI_MODEL, DEFAULT_TYPING_DELAY, DEFAULT_TYPING_INDICATOR } from '../constants';
import { generateRandomWorldConfiguration, listAvailableModels, validateAPIKey } from '../services/geminiService';
import { UserManagement } from './UserManagement';
import { BotManagement } from './BotManagement';
import { ChannelManagement } from './ChannelManagement';
import { getDebugConfig, updateDebugConfig, setDebugEnabled, setLogLevel, toggleCategory } from '../utils/debugLogger';
import { DataExportModal } from './DataExportModal';
import { ChannelImportExportModal } from './ChannelImportExportModal';
import { getAvailableImageModels } from '../services/imageGenerationService';
import { ProfilePicture } from './ProfilePicture';
import { ThemeEditor, type CustomTheme } from './ThemeEditor';
import { applyCustomTheme } from '../utils/themeUtils';

interface SettingsModalProps {
  onSave: (config: AppConfig) => void;
  onCancel: () => void;
  currentChannels?: Channel[];
  onChannelsChange?: (channels: Channel[]) => void;
  currentUsers?: User[];
  onUsersChange?: (users: User[]) => void;
  onImport: (config: Partial<AppConfig>) => void;
  onThemeChange?: (theme: string) => void;
}

const DEFAULT_USERS_TEXT = `nova, A curious tech-savvy individual who loves gadgets.
seraph, Calm, wise, and often speaks in poetic terms.
jinx, A chaotic, funny, and unpredictable prankster.
rex, Gruff but helpful, an expert in system administration.
luna, An artist who is dreamy, creative, and talks about music.`;

const DEFAULT_CHANNELS_TEXT = `#general, General chit-chat about anything and everything.
#tech-talk, Discussing the latest in technology and software.
#random, For off-topic conversations and random thoughts.
#help, Ask for help with the simulator here.`;

// Helper functions to convert between text format and user objects
const parseUsersFromText = (text: string): User[] => {
  return text.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [nickname, ...personalityParts] = line.split(',');
      return {
        nickname: nickname.trim(),
        status: 'online' as const,
        personality: personalityParts.join(',').trim(),
        userType: 'virtual' as const,
        languageSkills: {
          languages: [{ 
            language: 'English', 
            fluency: 'native' as const, 
            accent: '' 
          }]
        },
        writingStyle: {
          formality: 'casual' as const,
          verbosity: 'moderate' as const,
          humor: 'witty' as const,
          emojiUsage: 'rare' as const,
          punctuation: 'standard' as const
        }
      };
    });
};

const formatUsersToText = (users: User[]) => {
  return users.map(user => `${user.nickname}, ${user.personality}`).join('\n');
};

// Helper functions to convert between text format and channel objects
const parseChannelsFromText = (text: string) => {
  return text.split('\n')
    .filter(line => line.trim())
    .map(line => {
      // Check if line has dominant language (format: "#channel, topic | language")
      const hasLanguage = line.includes(' | ');
      if (hasLanguage) {
        const [channelPart, dominantLanguage] = line.split(' | ');
        const [name, ...topicParts] = channelPart.split(',');
        return {
          name: name.trim(),
          topic: topicParts.join(',').trim(),
          dominantLanguage: dominantLanguage.trim()
        };
      } else {
        // Legacy format without dominant language
        const [name, ...topicParts] = line.split(',');
        return {
          name: name.trim(),
          topic: topicParts.join(',').trim()
        };
      }
    });
};

const formatChannelsToText = (channels: { name: string; topic: string; dominantLanguage?: string }[]) => {
  return channels.map(channel => {
    const base = `${channel.name}, ${channel.topic}`;
    return channel.dominantLanguage ? `${base} | ${channel.dominantLanguage}` : base;
  }).join('\n');
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onSave,
  onCancel,
  currentChannels,
  onChannelsChange,
  currentUsers,
  onUsersChange,
  onImport,
  onThemeChange
}) => {
  const [config, setConfig] = useState<AppConfig>({
    currentUserNickname: DEFAULT_NICKNAME,
    virtualUsers: DEFAULT_USERS_TEXT,
    channels: DEFAULT_CHANNELS_TEXT,
    simulationSpeed: 'normal',
    aiModel: DEFAULT_AI_MODEL,
    typingDelay: DEFAULT_TYPING_DELAY,
    typingIndicator: DEFAULT_TYPING_INDICATOR,
    imageGeneration: {
      provider: 'placeholder',
      apiKey: '',
      model: 'gemini-1.5-pro',
      baseUrl: 'https://api.nanobanana.ai'
    },
    theme: 'dark',
    ircExport: {
      enabled: false,
      server: 'irc.libera.chat',
      port: 6697,
      nickname: 'station-v-user',
      realname: 'Station V User',
      channel: '#station-v-testing',
      ssl: true
    },
    perspectives: ['First Person', 'Third Person'],
  });

  // Load config from database on mount
  useEffect(() => {
    const loadInitialConfig = async () => {
      const savedConfig = await loadConfig();
      if (savedConfig) {
        const aiModel = savedConfig.aiModel || DEFAULT_AI_MODEL;
        setConfig({
          currentUserNickname: savedConfig.currentUserNickname || DEFAULT_NICKNAME,
          currentUserProfilePicture: savedConfig.currentUserProfilePicture,
          virtualUsers: savedConfig.virtualUsers || DEFAULT_USERS_TEXT,
          channels: savedConfig.channels || DEFAULT_CHANNELS_TEXT,
          simulationSpeed: savedConfig.simulationSpeed || 'normal',
          aiModel: aiModel || DEFAULT_AI_MODEL,
          typingDelay: savedConfig.typingDelay || DEFAULT_TYPING_DELAY,
          typingIndicator: savedConfig.typingIndicator || DEFAULT_TYPING_INDICATOR,
          userObjects: savedConfig.userObjects,
          imageGeneration: savedConfig.imageGeneration || {
            provider: 'placeholder',
            apiKey: '',
            model: 'gemini-1.5-pro',
            baseUrl: 'https://api.nanobanana.ai'
          },
          theme: savedConfig.theme || 'dark',
          ircExport: savedConfig.ircExport || {
            enabled: false,
            server: 'irc.libera.chat',
            port: 6697,
            nickname: 'station-v-user',
            realname: 'Station V User',
            channel: '#station-v-testing',
            ssl: true
          },
          perspectives: savedConfig.perspectives || ['First Person', 'Third Person'],
        });
      }
    };
    loadInitialConfig();
  }, []);

  const [perspectives, setPerspectives] = useState<string[]>(config.perspectives || ['First Person', 'Third Person']);
  const [selectedPerspective, setSelectedPerspective] = useState<string | null>(null);
  const [editingPerspective, setEditingPerspective] = useState<string>('');

  const [users, setUsers] = useState<User[]>(() => {
    // Use currentUsers if available (from main app state), otherwise use userObjects, otherwise parse from text
    return currentUsers || config.userObjects || parseUsersFromText(config.virtualUsers);
  });

  // Update users when currentUsers prop changes
  useEffect(() => {
    if (currentUsers) {
      setUsers(currentUsers);
    }
  }, [currentUsers]);
  const [channels, setChannels] = useState(() => currentChannels || parseChannelsFromText(config.channels));
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [debugConfig, setDebugConfig] = useState(() => {
    const initialConfig = getDebugConfig();
    return {
      ...initialConfig,
      categories: initialConfig.categories || {},
    };
  });
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [apiKeyWarning, setApiKeyWarning] = useState<string | null>(null);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const [showChannelImportExportModal, setShowChannelImportExportModal] = useState(false);
  const [imageModels, setImageModels] = useState<string[]>([]);
  const [isLoadingImageModels, setIsLoadingImageModels] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Fetch available models on component mount
  // Validate API key when component mounts or when settings change
  useEffect(() => {
    const validateKey = async () => {
      setIsValidatingApiKey(true);
      try {
        const result = await validateAPIKey();
        if (!result.valid) {
          setApiKeyWarning(result.error || 'API key validation failed');
        } else {
          setApiKeyWarning(null);
        }
      } catch (error) {
        console.error('Error validating API key:', error);
        setApiKeyWarning('Could not validate API key');
      } finally {
        setIsValidatingApiKey(false);
      }
    };

    // Validate on mount
    validateKey();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelsError(null);
      try {
        const models = await listAvailableModels();
        // Process API models to add baseModelId property
        const processedModels = models.map(model => ({
          ...model,
          baseModelId: model.name, // Use the name as baseModelId
        }));
        setAvailableModels(processedModels);
      } catch (error) {
        console.error('Failed to fetch available models:', error);
        setModelsError(error instanceof Error ? error.message : 'Failed to fetch models');
        // Fall back to static models if API fails
        const fallbackModels = FALLBACK_AI_MODELS.map(model => ({
          name: model.id,
          baseModelId: model.id,
          version: model.id.includes('2.5') ? '2.5' : '1.5',
          displayName: model.name,
          description: model.description,
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit,
          supportedGenerationMethods: ['generateContent'],
          thinking: false,
          temperature: 0.7,
          maxTemperature: 1.0,
          topP: 0.95,
          topK: 40
        }));
        setAvailableModels(fallbackModels);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();

    const fetchImageModels = async () => {
      setIsLoadingImageModels(true);
      const models = await getAvailableImageModels();
      setImageModels(models);
      setIsLoadingImageModels(false);
    };
    fetchImageModels();
  }, []);

  // Ensure AI model is valid when models are loaded
  useEffect(() => {
    if (availableModels.length > 0) {
      const currentModel = availableModels.find(model => model.baseModelId === config.aiModel);
      if (!currentModel) {
        // If current model is not found, reset to the first available model
        const firstModel = availableModels[0];
        const newModelId = firstModel?.baseModelId || DEFAULT_AI_MODEL;
        setConfig(prev => ({ ...prev, aiModel: newModelId }));
      }
    }
  }, [availableModels]);


  const handleSave = () => {
    const configToSave = {
      ...config,
      virtualUsers: formatUsersToText(users),
      channels: formatChannelsToText(channels),
      // Store the full user objects for proper persistence
      userObjects: users,
      // Store the full channel objects to preserve user assignments
      channelObjects: currentChannels || channels,
      perspectives,
    };
    
    // Notify parent component about channel changes
    onChannelsChange?.(channels);
    
    onSave(configToSave);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for AI model selection to ensure we use the model ID
    if (name === 'aiModel') {
      setConfig(prev => ({ ...prev, [name]: value }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'theme') {
      onThemeChange?.(value);
    }
  };

  const handleRandomize = async () => {
    setIsRandomizing(true);
    try {
      const randomConfig = await generateRandomWorldConfiguration();
      setUsers(randomConfig.users);
      setChannels(randomConfig.channels);
      
      // Notify parent component about channel changes immediately
      onChannelsChange?.(randomConfig.channels);
    } catch (error) {
      console.error("An error occurred during randomization:", error);
      // Show user-friendly error message
      alert(`Failed to generate random world configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRandomizing(false);
    }
  };

  const handleDebugConfigChange = (updates: Partial<typeof debugConfig>) => {
    const newConfig = {
      ...debugConfig,
      ...updates,
      categories: {
        ...debugConfig.categories,
        ...updates.categories,
      },
    };
    setDebugConfig(newConfig);
    updateDebugConfig(newConfig);
  };

  const handleValidateApiKey = async () => {
    setIsValidatingApiKey(true);
    try {
      const result = await validateAPIKey();
      if (result.valid) {
        setApiKeyWarning(null);
        alert('✅ API key is valid!');
      } else {
        setApiKeyWarning(result.error || 'API key validation failed');
        alert(`❌ ${result.error || 'API key validation failed'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setApiKeyWarning(`Validation error: ${errorMsg}`);
      alert(`❌ Error validating API key: ${errorMsg}`);
    } finally {
      setIsValidatingApiKey(false);
    }
  };


  const handleDebugCategoryToggle = (category: keyof typeof debugConfig.categories) => {
    const newConfig = {
      ...debugConfig,
      categories: {
        ...debugConfig.categories,
        [category]: !debugConfig.categories[category]
      }
    };
    setDebugConfig(newConfig);
    updateDebugConfig(newConfig);
  };

  // Add error boundary for debugging
  try {
    return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-4 lg:p-8 w-full max-w-4xl border border-gray-700 max-h-[95vh] overflow-y-auto">
        <h2 className="text-lg lg:text-xl font-bold text-white mb-3">Simulation Configuration</h2>
        <p className="text-gray-400 mb-4 text-xs lg:text-sm">Customize the channels, virtual users, and your nickname. Changes are saved locally.</p>

        {apiKeyWarning && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
              <div className="flex-grow">
                <p className="text-red-300 font-semibold text-xs mb-1">API Key Issue Detected</p>
                <p className="text-red-200 text-[10px] mb-2">{apiKeyWarning}</p>
                <button
                  onClick={handleValidateApiKey}
                  disabled={isValidatingApiKey}
                  className="text-[10px] bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                >
                  {isValidatingApiKey ? 'Validating...' : 'Validate & Fix'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="currentUserNickname" className="block text-xs font-medium text-gray-300 mb-1">Your Nickname</label>
            <input
              type="text"
              id="currentUserNickname"
              name="currentUserNickname"
              value={config.currentUserNickname}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 lg:px-3 py-1.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs lg:text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <ProfilePicture
                user={{
                  nickname: config.currentUserNickname,
                  profilePicture: config.currentUserProfilePicture,
                }}
                size="lg"
              />
            </div>
            <div className="flex-grow">
              <label htmlFor="currentUserProfilePicture" className="block text-xs font-medium text-gray-300 mb-1">Profile Picture</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="currentUserProfilePicture"
                  name="currentUserProfilePicture"
                  value={config.currentUserProfilePicture || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, currentUserProfilePicture: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  placeholder="Enter image URL or upload"
                />
                <input
                  type="file"
                  id="profilePictureUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setConfig(prev => ({ ...prev, currentUserProfilePicture: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('profilePictureUpload')?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  Upload
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Enter a URL or upload an image for your profile picture.</p>
            </div>
          </div>

          <div>
            <label htmlFor="theme" className="block text-xs font-medium text-gray-300 mb-1">Theme</label>
            <div className="flex gap-2">
              <select
                id="theme"
                name="theme"
                value={config.theme}
                onChange={handleChange}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 lg:px-3 py-1.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs lg:text-sm"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="custom">Custom</option>
              </select>
              <button
                type="button"
                onClick={() => setShowThemeEditor(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 text-xs font-medium whitespace-nowrap"
              >
                🎨 Customize
              </button>
            </div>
            {config.theme === 'custom' && config.customTheme && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Using custom theme: {config.customTheme.name}
              </p>
            )}
          </div>
          
          <UserManagement
            users={users}
            onUsersChange={onUsersChange || setUsers} 
            aiModel={config.aiModel}
            channels={currentChannels || channels}
            currentUserNickname={config.currentUserNickname}
            onChannelsChange={(newChannels) => {
              setChannels(newChannels);
              onChannelsChange?.(newChannels);
            }}
          />
          
          <BotManagement 
            users={users} 
            onUsersChange={onUsersChange || setUsers} 
            aiModel={config.aiModel}
            channels={currentChannels || channels}
            currentUserNickname={config.currentUserNickname}
            onChannelsChange={(newChannels) => {
              setChannels(newChannels);
              onChannelsChange?.(newChannels);
            }}
          />
          
          <ChannelManagement 
            channels={channels} 
            onChannelsChange={(newChannels) => {
              setChannels(newChannels);
              onChannelsChange?.(newChannels);
            }} 
            allUsers={users} 
          />
          
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">🎭 Perspective Configuration</h3>
            <p className="text-xs text-gray-400 mb-3">Manage the different narrative perspectives available for AI users.</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-300 mb-1">Available Perspectives</label>
                  <ul className="bg-gray-700 border border-gray-600 rounded-lg p-2 space-y-1 h-32 overflow-y-auto text-xs">
                    {perspectives.map((p, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedPerspective(p);
                          setEditingPerspective(p);
                        }}
                        className={`p-1.5 rounded-md cursor-pointer ${selectedPerspective === p ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-300 mb-1">Edit Perspective</label>
                  <input
                    type="text"
                    value={editingPerspective}
                    onChange={(e) => setEditingPerspective(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 text-xs"
                    placeholder="Select or create a perspective"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (editingPerspective && !perspectives.includes(editingPerspective)) {
                          setPerspectives([...perspectives, editingPerspective]);
                          setEditingPerspective('');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs"
                    >
                      Add New
                    </button>
                    <button
                      onClick={() => {
                        if (selectedPerspective) {
                          setPerspectives(perspectives.filter(p => p !== selectedPerspective));
                          setSelectedPerspective(null);
                          setEditingPerspective('');
                        }
                      }}
                      disabled={!selectedPerspective}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Background Simulation Speed</label>
            <div className="grid grid-cols-2 lg:flex lg:items-center lg:space-x-4 gap-1.5">
              {(['off', 'slow', 'normal', 'fast'] as const).map((speed) => (
                <label key={speed} className="flex items-center text-xs text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="simulationSpeed"
                    value={speed}
                    checked={config.simulationSpeed === speed}
                    onChange={handleChange}
                    className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-1.5 capitalize">{speed}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">"Off" disables autonomous AI messages to conserve API quota. Simulation also pauses when the tab is not visible.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              AI Model
              {isLoadingModels && <span className="ml-2 text-blue-400 text-[10px]">(Loading...)</span>}
            </label>
            <select
              name="aiModel"
              value={config.aiModel || DEFAULT_AI_MODEL}
              onChange={handleChange}
              disabled={isLoadingModels}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 lg:px-3 py-1.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-xs lg:text-sm"
            >
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <option key={model.name} value={model.baseModelId}>
                    {model.displayName} - {model.description}
                    {model.inputTokenLimit && ` (Input: ${Math.floor(model.inputTokenLimit / 1000)}k tokens)`}
                  </option>
                ))
              ) : (
                <option value={DEFAULT_AI_MODEL}>Loading models...</option>
              )}
            </select>
            {/* Debug info */}
            <p className="text-[10px] text-gray-500 mt-0.5">
              Selected model ID: {config.aiModel}
            </p>
            {modelsError && (
              <p className="text-[10px] text-red-400 mt-0.5">
                ⚠️ {modelsError} (Using fallback models)
              </p>
            )}
            {apiKeyWarning && (
              <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-2 mt-2">
                <p className="text-[10px] text-red-300 font-semibold mb-1">
                  🔑 API Key Issue
                </p>
                <p className="text-[10px] text-red-200 mb-2">
                  {apiKeyWarning}
                </p>
                <button
                  onClick={handleValidateApiKey}
                  disabled={isValidatingApiKey}
                  className="text-[10px] bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                >
                  {isValidatingApiKey ? 'Validating...' : 'Validate API Key'}
                </button>
              </div>
            )}
            <p className="text-[10px] text-gray-500 mt-1">
              Choose the AI model for message generation. Models are fetched dynamically from the Gemini API.
              {availableModels.length > 0 && (
                <span> Found {availableModels.length} available models.</span>
              )}
            </p>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Typing Settings</h3>
            <p className="text-xs text-gray-400 mb-3">Configure typing delays and indicator display preferences for a more realistic chat experience.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">Enable Typing Delay</label>
                <input
                  type="checkbox"
                  checked={config.typingDelay.enabled}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    typingDelay: { ...prev.typingDelay, enabled: e.target.checked }
                  }))}
                  className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded"
                />
              </div>

              {config.typingDelay.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Base Delay: {config.typingDelay.baseDelay}ms
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="3000"
                      step="100"
                      value={config.typingDelay.baseDelay}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        typingDelay: { ...prev.typingDelay, baseDelay: parseInt(e.target.value) }
                      }))}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                      <span>200ms (Fast)</span>
                      <span>3000ms (Slow)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Maximum Delay: {config.typingDelay.maxDelay}ms ({Math.round(config.typingDelay.maxDelay / 1000)}s)
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="30000"
                      step="500"
                      value={config.typingDelay.maxDelay}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        typingDelay: { ...prev.typingDelay, maxDelay: parseInt(e.target.value) }
                      }))}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                      <span>1000ms (1s)</span>
                      <span>30000ms (30s)</span>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-400">
                      <strong>How it works:</strong> AI users will wait a random amount of time before sending messages.
                      Longer messages take more time to "type". The delay is calculated as:
                      base delay + (message length factor × random factor), capped at the maximum delay.
                      <br /><br />
                      <strong>Realistic typing:</strong> For very long messages (like detailed explanations or stories),
                      the maximum delay can now be set up to 30 seconds to simulate realistic human typing patterns.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Typing Indicator Configuration */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-200 mb-2">Typing Indicator Display</h4>
              <p className="text-xs text-gray-400 mb-3">Choose when to show typing indicators to indicate when AI users are composing messages.</p>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="typingIndicatorMode"
                    value="all"
                    checked={config.typingIndicator?.mode === 'all'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      typingIndicator: { ...prev.typingIndicator, mode: e.target.value as 'all' | 'private_only' | 'none' }
                    }))}
                    className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-300">Show in all windows</div>
                    <div className="text-[10px] text-gray-400">Display typing indicators in both channels and private messages</div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="typingIndicatorMode"
                    value="private_only"
                    checked={config.typingIndicator?.mode === 'private_only'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      typingIndicator: { ...prev.typingIndicator, mode: e.target.value as 'all' | 'private_only' | 'none' }
                    }))}
                    className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-300">Show only in private messages</div>
                    <div className="text-[10px] text-gray-400">Display typing indicators only in private message windows (recommended)</div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="typingIndicatorMode"
                    value="none"
                    checked={config.typingIndicator?.mode === 'none'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      typingIndicator: { ...prev.typingIndicator, mode: e.target.value as 'all' | 'private_only' | 'none' }
                    }))}
                    className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-300">Don't show at all</div>
                    <div className="text-[10px] text-gray-400">Never display typing indicators</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">🖼️ Image Generation Settings</h3>
            <p className="text-xs text-gray-400 mb-3">Configure image generation for bot commands like !image. Choose your preferred service and API key.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Image Generation Provider</label>
                <select
                  value={config.imageGeneration?.provider || 'gemini'}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    imageGeneration: {
                      ...prev.imageGeneration,
                      provider: e.target.value as 'gemini' | 'imagen' | 'placeholder' | 'dalle'
                    }
                  }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="gemini">Gemini AI (Default - Real AI-generated images)</option>
                  <option value="placeholder">Placeholder (Simple placeholder images)</option>
                  <option value="imagen">Google Imagen (Coming Soon)</option>
                  <option value="dalle">OpenAI DALLE (Coming Soon)</option>
                </select>
              </div>

              {config.imageGeneration?.provider !== 'placeholder' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">API Key</label>
                    <input
                      type="password"
                      value={config.imageGeneration?.apiKey || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        imageGeneration: {
                          ...prev.imageGeneration,
                          apiKey: e.target.value
                        }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="Enter your API key"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Model</label>
                    <select
                      value={config.imageGeneration?.model || 'gemini-1.5-pro'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        imageGeneration: {
                          ...prev.imageGeneration,
                          model: e.target.value
                        }
                      }))}
                      disabled={isLoadingImageModels}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      {isLoadingImageModels ? (
                        <option>Loading models...</option>
                      ) : (
                        imageModels.map(modelName => (
                          <option key={modelName} value={modelName}>
                            {modelName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {config.imageGeneration?.provider === 'gemini' && (
                    <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg">
                      <p className="text-[10px] text-blue-300">
                        <strong>ℹ️ Gemini AI Info:</strong> Gemini AI uses the Google GenAI SDK.
                        No base URL configuration is needed as it connects directly to Google's infrastructure.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="bg-gray-700 p-2 rounded-lg">
                <p className="text-[10px] text-gray-400">
                  <strong>Image Generation Services:</strong><br/>
                  • <strong>Gemini AI:</strong> Provides real AI-generated images using Google's Gemini model (requires an API key).<br/>
                  • <strong>Placeholder:</strong> Displays simple placeholder images (no API key needed and avoids CORS issues).<br/>
                  • <strong>Imagen & DALLE:</strong> Support for Google's Imagen and OpenAI's DALLE is coming soon.
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600/50 p-2 rounded-lg">
                <p className="text-[10px] text-yellow-300">
                  <strong>💡 API Key Troubleshooting:</strong><br/>
                  If you see a 400 error or models won't load, your API key may be invalid. Common issues:<br/>
                  • API key is expired or revoked<br/>
                  • API key has incorrect permissions<br/>
                  • API key is for the wrong service<br/>
                  <br/>
                  <strong>Solution:</strong> Get a fresh API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">Google AI Studio</a> and paste it above.
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-2 rounded-lg">
                <p className="text-[10px] text-blue-300">
                  <strong>Test Image Generation:</strong> Try typing <code className="bg-gray-800 px-1 rounded">!image a sunset</code> in a channel with a bot to test image generation.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">🌐 IRC Export Settings</h3>
            <p className="text-xs text-gray-400 mb-3">Export chat simulation to a real IRC server for monitoring or integration.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">Enable IRC Export</label>
                <input
                  type="checkbox"
                  checked={config.ircExport?.enabled || false}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    ircExport: { ...prev.ircExport, enabled: e.target.checked }
                  }))}
                  className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded"
                />
              </div>

              {config.ircExport?.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">IRC Server</label>
                    <input
                      type="text"
                      value={config.ircExport?.server || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ircExport: { ...prev.ircExport, server: e.target.value }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="e.g., irc.libera.chat"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Port</label>
                    <input
                      type="number"
                      value={config.ircExport?.port || 6697}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ircExport: { ...prev.ircExport, port: parseInt(e.target.value) }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300">Use SSL</label>
                    <input
                      type="checkbox"
                      checked={config.ircExport?.ssl || true}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ircExport: { ...prev.ircExport, ssl: e.target.checked }
                      }))}
                      className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Bot Nickname</label>
                    <input
                      type="text"
                      value={config.ircExport?.nickname || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ircExport: { ...prev.ircExport, nickname: e.target.value }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="e.g., station-v-bot"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Bot Real Name</label>
                    <input
                      type="text"
                      value={config.ircExport?.realname || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ircExport: { ...prev.ircExport, realname: e.target.value }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="e.g., Station V Bot"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Channel to Join</label>
                    <input
                      type="text"
                      value={config.ircExport?.channel || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ircExport: { ...prev.ircExport, channel: e.target.value }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="e.g., #station-v-testing"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Debug Logging</h3>
            <p className="text-xs text-gray-400 mb-3">Control debug logging for troubleshooting and monitoring. Logs appear in the browser console.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">Enable Debug Logging</label>
                <input
                  type="checkbox"
                  checked={debugConfig.enabled}
                  onChange={(e) => handleDebugConfigChange({ enabled: e.target.checked })}
                  className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Log Level</label>
                <select
                  value={debugConfig.level}
                  onChange={(e) => handleDebugConfigChange({ level: e.target.value as any })}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="debug">Debug (All)</option>
                  <option value="info">Info</option>
                  <option value="warn">Warnings</option>
                  <option value="error">Errors Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Log Categories</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(debugConfig.categories).map(([category, enabled]) => (
                    <label key={category} className="flex items-center text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleDebugCategoryToggle(category as keyof typeof debugConfig.categories)}
                        className="h-3 w-3 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded mr-1.5"
                      />
                      <span className="capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>


          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Data Management</h3>
            <p className="text-xs text-gray-400 mb-3">Export or import data for backup and sharing.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-300">Channel Import/Export</p>
                  <p className="text-[10px] text-gray-400">Export selected channels or import from a file.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChannelImportExportModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  Manage Channels
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-300">Full Backup & Restore</p>
                  <p className="text-[10px] text-gray-400">Export all data to a JSON file or import from a backup.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDataExportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  Manage Full Backup
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end pt-2 gap-2 sm:gap-3">
             <button
              type="button"
              onClick={handleRandomize}
              disabled={isRandomizing}
              className="bg-gray-600 text-white rounded-lg px-3 lg:px-4 py-1.5 font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-700 disabled:cursor-wait flex items-center justify-center gap-1.5 text-xs lg:text-sm touch-manipulation"
            >
              {isRandomizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 lg:h-4 lg:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                '🎲 Randomize World'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 text-white rounded-lg px-3 lg:px-4 py-1.5 font-semibold hover:bg-gray-500 transition-colors text-xs lg:text-sm touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-indigo-600 text-white rounded-lg px-3 lg:px-4 py-1.5 font-semibold hover:bg-indigo-500 transition-colors text-xs lg:text-sm touch-manipulation"
            >
              Save and Start
            </button>
          </div>
        </div>
      </div>
      
      <DataExportModal
        isOpen={showDataExportModal}
        onClose={() => setShowDataExportModal(false)}
        onImport={onImport}
      />

      <ChannelImportExportModal
        isOpen={showChannelImportExportModal}
        onClose={() => setShowChannelImportExportModal(false)}
        channels={currentChannels || channels}
        onImport={(importedChannels) => {
          const existingChannelNames = (currentChannels || channels).map(c => c.name);
          const newChannels = importedChannels.filter(ic => !existingChannelNames.includes(ic.name));
          const updatedChannels = [...(currentChannels || channels), ...newChannels];
          setChannels(updatedChannels);
          onChannelsChange?.(updatedChannels);
        }}
      />

      {/* Theme Editor Modal */}
      <ThemeEditor
        isOpen={showThemeEditor}
        onClose={() => setShowThemeEditor(false)}
        currentTheme={config.customTheme}
        onSave={async (theme: CustomTheme) => {
          // Update local state
          const newConfig = {
            ...config,
            theme: 'custom' as const,
            customTheme: theme,
          };
          setConfig(newConfig);

          // Apply theme immediately (before saving settings)
          applyCustomTheme(theme);
          document.documentElement.classList.remove('dark');

          // Save to database and localStorage immediately so theme persists
          const configToSave = {
            ...newConfig,
            virtualUsers: formatUsersToText(users),
            channels: formatChannelsToText(channels),
            userObjects: users,
            channelObjects: currentChannels || channels,
            perspectives,
          };
          await saveConfig(configToSave);

          // Trigger theme change
          onThemeChange?.('custom');
          setShowThemeEditor(false);
        }}
      />

    </div>
    );
  } catch (error) {
    console.error('Error rendering SettingsModal:', error);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-4xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-400 mb-4">An error occurred while loading the settings interface.</p>
          <p className="text-gray-400 mb-6">Please try refreshing the page or contact support if the issue persists.</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
};
