import React, { useState, useEffect } from 'react';
import type { AppConfig, User, GeminiModel, Channel } from '../types';
import { loadConfig } from '../utils/config';
import { DEFAULT_NICKNAME, FALLBACK_AI_MODELS, DEFAULT_AI_MODEL, DEFAULT_TYPING_DELAY, DEFAULT_TYPING_INDICATOR } from '../constants';
import { generateRandomWorldConfiguration, listAvailableModels } from '../services/geminiService';
import { UserManagement } from './UserManagement';
import { BotManagement } from './BotManagement';
import { ChannelManagement } from './ChannelManagement';
import { getDebugConfig, updateDebugConfig, setDebugEnabled, setLogLevel, toggleCategory } from '../utils/debugLogger';
import { DataExportModal } from './DataExportModal';
import { DebugLogWindow } from './DebugLogWindow';
import { ThemeSelector } from './ThemeSelector';
import { getUIThemeService } from '../services/uiThemeService';

interface SettingsModalProps {
  onSave: (config: AppConfig) => void;
  onCancel: () => void;
  currentChannels?: Channel[];
  onChannelsChange?: (channels: Channel[]) => void;
  currentUsers?: User[];
  onUsersChange?: (users: User[]) => void;
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
  onUsersChange
}) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const savedConfig = loadConfig();
    const aiModel = savedConfig?.aiModel || DEFAULT_AI_MODEL;
    return {
      currentUserNickname: savedConfig?.currentUserNickname || DEFAULT_NICKNAME,
      virtualUsers: savedConfig?.virtualUsers || DEFAULT_USERS_TEXT,
      channels: savedConfig?.channels || DEFAULT_CHANNELS_TEXT,
      simulationSpeed: savedConfig?.simulationSpeed || 'normal',
      aiModel: aiModel || DEFAULT_AI_MODEL, // Ensure it's never undefined
      typingDelay: savedConfig?.typingDelay || DEFAULT_TYPING_DELAY,
      typingIndicator: savedConfig?.typingIndicator || DEFAULT_TYPING_INDICATOR,
      userObjects: savedConfig?.userObjects,
      imageGeneration: savedConfig?.imageGeneration || {
        provider: 'placeholder',
        apiKey: '',
        model: 'stable-diffusion-xl',
        baseUrl: 'https://api.nanobanana.ai'
      },
    };
  });
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
  const [debugConfig, setDebugConfig] = useState(getDebugConfig());
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const [showDebugLogWindow, setShowDebugLogWindow] = useState(false);
  

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
    const themeService = getUIThemeService();
    const configToSave = {
      ...config,
      virtualUsers: formatUsersToText(users),
      channels: formatChannelsToText(channels),
      // Store the full user objects for proper persistence
      userObjects: users,
      // Store the full channel objects to preserve user assignments
      channelObjects: currentChannels || channels,
      // Store the current theme settings
      theme: {
        id: themeService.getCurrentTheme().id
      }
    };
    
    // Notify parent component about channel changes
    onChannelsChange?.(channels);
    
    onSave(configToSave);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for AI model selection to ensure we use the model ID
    if (name === 'aiModel') {
      setConfig(prev => ({ ...prev, [name]: value }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
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
    const newConfig = { ...debugConfig, ...updates };
    setDebugConfig(newConfig);
    updateDebugConfig(newConfig);
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
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Simulation Configuration</h2>
        <p className="text-gray-400 mb-6 text-sm lg:text-base">Customize the channels, virtual users, and your nickname. Changes are saved locally.</p>
        
        <div className="space-y-6">
          <ThemeSelector />

          <div>
            <label htmlFor="currentUserNickname" className="block text-sm font-medium text-gray-300 mb-2">Your Nickname</label>
            <input
              type="text"
              id="currentUserNickname"
              name="currentUserNickname"
              value={config.currentUserNickname}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 lg:px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
            />
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
          
          
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Background Simulation Speed</label>
            <div className="grid grid-cols-2 lg:flex lg:items-center lg:space-x-6 gap-2">
              {(['off', 'slow', 'normal', 'fast'] as const).map((speed) => (
                <label key={speed} className="flex items-center text-sm text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="simulationSpeed"
                    value={speed}
                    checked={config.simulationSpeed === speed}
                    onChange={handleChange}
                    className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 capitalize">{speed}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">"Off" disables autonomous AI messages to conserve API quota. Simulation also pauses when the tab is not visible.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Model
              {isLoadingModels && <span className="ml-2 text-blue-400">(Loading...)</span>}
            </label>
            <select
              name="aiModel"
              value={config.aiModel || DEFAULT_AI_MODEL}
              onChange={handleChange}
              disabled={isLoadingModels}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 lg:px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm lg:text-base"
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
            <p className="text-xs text-gray-500 mt-1">
              Selected model ID: {config.aiModel}
            </p>
            {modelsError && (
              <p className="text-xs text-red-400 mt-1">
                ⚠️ {modelsError} (Using fallback models)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Choose the AI model for message generation. Models are fetched dynamically from the Gemini API.
              {availableModels.length > 0 && (
                <span> Found {availableModels.length} available models.</span>
              )}
            </p>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Typing Settings</h3>
            <p className="text-sm text-gray-400 mb-4">Configure typing delays and indicator display preferences for a more realistic chat experience.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Enable Typing Delay</label>
                <input
                  type="checkbox"
                  checked={config.typingDelay.enabled}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    typingDelay: { ...prev.typingDelay, enabled: e.target.checked }
                  }))}
                  className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded"
                />
              </div>
              
              {config.typingDelay.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>200ms (Fast)</span>
                      <span>3000ms (Slow)</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1000ms (1s)</span>
                      <span>30000ms (30s)</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-400">
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
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-200 mb-3">Typing Indicator Display</h4>
              <p className="text-sm text-gray-400 mb-4">Choose when to show typing indicators to indicate when AI users are composing messages.</p>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="typingIndicatorMode"
                    value="all"
                    checked={config.typingIndicator?.mode === 'all'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      typingIndicator: { ...prev.typingIndicator, mode: e.target.value as 'all' | 'private_only' | 'none' }
                    }))}
                    className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Show in all windows</div>
                    <div className="text-xs text-gray-400">Display typing indicators in both channels and private messages</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="typingIndicatorMode"
                    value="private_only"
                    checked={config.typingIndicator?.mode === 'private_only'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      typingIndicator: { ...prev.typingIndicator, mode: e.target.value as 'all' | 'private_only' | 'none' }
                    }))}
                    className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Show only in private messages</div>
                    <div className="text-xs text-gray-400">Display typing indicators only in private message windows (recommended)</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="typingIndicatorMode"
                    value="none"
                    checked={config.typingIndicator?.mode === 'none'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      typingIndicator: { ...prev.typingIndicator, mode: e.target.value as 'all' | 'private_only' | 'none' }
                    }))}
                    className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-300">Don't show at all</div>
                    <div className="text-xs text-gray-400">Never display typing indicators</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">🖼️ Image Generation Settings</h3>
            <p className="text-sm text-gray-400 mb-4">Configure image generation for bot commands like !image. Choose your preferred service and API key.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image Generation Provider</label>
                <select
                  value={config.imageGeneration?.provider || 'nano-banana'}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    imageGeneration: {
                      ...prev.imageGeneration,
                      provider: e.target.value as 'nano-banana' | 'imagen' | 'placeholder' | 'dalle'
                    }
                  }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nano-banana">Gemini AI (Default - Real AI-generated images)</option>
                  <option value="placeholder">Placeholder (Simple placeholder images)</option>
                  <option value="imagen">Google Imagen (Coming Soon)</option>
                  <option value="dalle">OpenAI DALLE (Coming Soon)</option>
                </select>
              </div>
              
              {config.imageGeneration?.provider !== 'placeholder' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your API key"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                    <input
                      type="text"
                      value={config.imageGeneration?.model || 'stable-diffusion-xl'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        imageGeneration: {
                          ...prev.imageGeneration,
                          model: e.target.value
                        }
                      }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Model name (e.g., stable-diffusion-xl)"
                    />
                  </div>
                  
                  {config.imageGeneration?.provider === 'nano-banana' && (
                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                      <p className="text-xs text-blue-300">
                        <strong>ℹ️ Nano Banana Info:</strong> Nano Banana uses the Google GenAI SDK with the <code className="bg-gray-800 px-1 rounded">gemini-2.0-flash-exp</code> model. 
                        No base URL configuration needed - it uses Google's infrastructure directly.
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400">
                  <strong>Image Generation Services:</strong><br/>
                  • <strong>Gemini AI:</strong> Real AI-generated images using Google's Gemini model (requires API key)<br/>
                  • <strong>Placeholder:</strong> Simple placeholder images (no API key needed, no CORS issues)<br/>
                  • <strong>Imagen:</strong> Google's dedicated image generation (coming soon)<br/>
                  • <strong>DALLE:</strong> OpenAI's image generation (coming soon)
                </p>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                <p className="text-xs text-blue-300">
                  <strong>ℹ️ Gemini AI Info:</strong> Gemini AI uses the Google GenAI SDK with the <code className="bg-gray-800 px-1 rounded">gemini-2.5-flash-image-preview</code> model. 
                  This provides real AI-generated images based on your prompts. If you encounter issues, the system will automatically fall back to placeholder images.
                </p>
              </div>
              
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
                <p className="text-xs text-red-300">
                  <strong>🚫 Browser Limitation:</strong> Direct browser requests to external APIs are blocked by CORS. 
                  To use external APIs, you need to set up a proxy server or use server-side rendering.
                </p>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                <p className="text-xs text-blue-300">
                  <strong>Test Image Generation:</strong> Try typing <code className="bg-gray-800 px-1 rounded">!image a sunset</code> in a channel with a bot to test image generation.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Debug Logging</h3>
            <p className="text-sm text-gray-400 mb-4">Control debug logging for troubleshooting and monitoring. Logs appear in the browser console.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Enable Debug Logging</label>
                <input
                  type="checkbox"
                  checked={debugConfig.enabled}
                  onChange={(e) => handleDebugConfigChange({ enabled: e.target.checked })}
                  className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Log Level</label>
                <select
                  value={debugConfig.level}
                  onChange={(e) => handleDebugConfigChange({ level: e.target.value as any })}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="debug">Debug (All)</option>
                  <option value="info">Info</option>
                  <option value="warn">Warnings</option>
                  <option value="error">Errors Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Log Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(debugConfig.categories).map(([category, enabled]) => (
                    <label key={category} className="flex items-center text-sm text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleDebugCategoryToggle(category as keyof typeof debugConfig.categories)}
                        className="h-4 w-4 bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 rounded mr-2"
                      />
                      <span className="capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Debug Tools</h3>
            <p className="text-sm text-gray-400 mb-4">Additional tools for debugging and monitoring the application.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Debug Log Window</p>
                  <p className="text-xs text-gray-400">Open a separate window to view debug logs in real-time</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDebugLogWindow(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Open Debug Logs
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Data Management</h3>
            <p className="text-sm text-gray-400 mb-4">Export all your data (channels, messages, configuration) to a JSON file for backup, or import previously exported data.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Backup & Restore</p>
                  <p className="text-xs text-gray-400">Export all data to JSON file or import from backup</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDataExportModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Manage Data
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end pt-2 gap-3 sm:gap-4">
             <button
              type="button"
              onClick={handleRandomize}
              disabled={isRandomizing}
              className="bg-gray-600 text-white rounded-lg px-4 lg:px-6 py-2 font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-700 disabled:cursor-wait flex items-center justify-center gap-2 text-sm lg:text-base touch-manipulation"
            >
              {isRandomizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 lg:h-5 lg:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              className="bg-gray-600 text-white rounded-lg px-4 lg:px-6 py-2 font-semibold hover:bg-gray-500 transition-colors text-sm lg:text-base touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-indigo-600 text-white rounded-lg px-4 lg:px-6 py-2 font-semibold hover:bg-indigo-500 transition-colors text-sm lg:text-base touch-manipulation"
            >
              Save and Start
            </button>
          </div>
        </div>
      </div>
      
      <DataExportModal 
        isOpen={showDataExportModal}
        onClose={() => setShowDataExportModal(false)}
      />
      
      <DebugLogWindow 
        isOpen={showDebugLogWindow}
        onClose={() => setShowDebugLogWindow(false)}
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