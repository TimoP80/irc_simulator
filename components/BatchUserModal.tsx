import React, { useState, useEffect } from 'react';
import { User, isLegacyFormat } from '../types';
import { PERSONALITY_TEMPLATES, generateRandomUser, generateRandomUserAsync, TRAIT_POOLS } from '../utils/personalityTemplates';
import { generateBatchUsers } from '../services/geminiService';
// usernameGeneration functions are imported dynamically to avoid mixed import warnings

// Local username categories to avoid dynamic import issues
const USERNAME_CATEGORIES = [
  {
    id: 'tech',
    name: 'Tech/Programming',
    description: 'Technology and programming related usernames',
    examples: ['CodeMaster', 'ByteWizard', 'DataNinja', 'CloudGuru', 'DevOpsHero']
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gaming and fantasy themed usernames',
    examples: ['DragonSlayer', 'PixelWarrior', 'QuestSeeker', 'ShadowMage', 'BattleLord']
  },
  {
    id: 'creative',
    name: 'Creative/Artistic',
    description: 'Creative and artistic themed usernames',
    examples: ['ArtSoul', 'ColorDreamer', 'MusicMaker', 'PoetWriter', 'DesignMuse']
  },
  {
    id: 'realistic',
    name: 'Realistic',
    description: 'Realistic and personal sounding usernames',
    examples: ['Alex_M', 'SarahJ', 'Mike_Dev', 'Emma_C', 'John_2024']
  },
  {
    id: 'mixed',
    name: 'Mixed',
    description: 'Combination of different styles for variety',
    examples: ['TechGamer', 'CreativeDev', 'ArtWarrior', 'CodeArtist', 'PixelPoet']
  }
];

interface BatchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUsers: (users: User[]) => void;
  existingNicknames: string[];
  aiModel: string;
}

export const BatchUserModal: React.FC<BatchUserModalProps> = ({
  isOpen,
  onClose,
  onAddUsers,
  existingNicknames,
  aiModel
}) => {
  const [generationMode, setGenerationMode] = useState<'template' | 'random' | 'ai'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [userCount, setUserCount] = useState(5);
  const [previewUsers, setPreviewUsers] = useState<User[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [randomizationSettings, setRandomizationSettings] = useState({
    randomizePersonality: true,
    randomizeWritingStyle: true,
    randomizeLanguages: true,
    randomizeAccent: true
  });
  const [usernameStyle, setUsernameStyle] = useState<'mixed' | 'tech' | 'gaming' | 'creative' | 'realistic' | 'abstract'>('mixed');
  const [forcePrimaryLanguage, setForcePrimaryLanguage] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('English');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGenerationMode('template');
      setSelectedTemplate('');
      setUserCount(5);
      setPreviewUsers([]);
      setRandomizationSettings({
        randomizePersonality: true,
        randomizeWritingStyle: true,
        randomizeLanguages: true,
        randomizeAccent: true
      });
      setForcePrimaryLanguage(false);
      setPrimaryLanguage('English');
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const generateUsers = async (): Promise<User[]> => {
    if (generationMode === 'ai') {
      try {
        setIsGenerating(true);
        const users = await generateBatchUsers(userCount, aiModel);
        return users;
      } catch (error) {
        console.error('Failed to generate AI users:', error);
        // Fallback to random generation
        return generateRandomUsers();
      } finally {
        setIsGenerating(false);
      }
    } else {
      return await generateRandomUsers();
    }
  };

  const generateRandomUsers = async (): Promise<User[]> => {
    const users: User[] = [];
    const usedNicknames = new Set<string>(existingNicknames.map(n => n.toLowerCase()));

    // Generate AI usernames for better variety
    let aiUsernames: string[] = [];
    try {
      if (generationMode === 'template' && selectedTemplate) {
        const template = PERSONALITY_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template?.baseUser.personality) {
          const { generateUsernamesForPersonality } = await import('../services/usernameGeneration');
          aiUsernames = await generateUsernamesForPersonality(
            template.baseUser.personality,
            userCount,
            Array.from(usedNicknames)
          );
        }
      }
      
      if (aiUsernames.length === 0) {
        const { generateAUsernames } = await import('../services/usernameGeneration');
        aiUsernames = await generateAUsernames({
          count: userCount,
          style: usernameStyle,
          avoidDuplicates: Array.from(usedNicknames)
        });
      }
    } catch (error) {
      console.error('Failed to generate AI usernames:', error);
      // Fallback to traditional generation
    }

    for (let i = 0; i < userCount; i++) {
      let user: User;
      
      if (generationMode === 'template' && selectedTemplate) {
        const template = PERSONALITY_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template) {
          // Convert legacy languageSkills format to per-language format
          let languageSkills;
          if (template.baseUser.languageSkills) {
            if (isLegacyFormat(template.baseUser.languageSkills)) {
              // Convert legacy format to per-language format
              languageSkills = {
                languages: template.baseUser.languageSkills.languages.map(lang => ({
                  language: lang,
                  fluency: template.baseUser.languageSkills!.fluency,
                  accent: template.baseUser.languageSkills!.accent || ''
                }))
              };
            } else {
              // Already in per-language format
              languageSkills = template.baseUser.languageSkills;
            }
          } else {
            // Default fallback
            languageSkills = {
              languages: [{ language: 'English', fluency: 'native', accent: '' }]
            };
          }

          user = {
            nickname: aiUsernames[i] || generateUniqueNickname(usedNicknames),
            status: 'online',
            personality: template.baseUser.personality || '',
            languageSkills,
            writingStyle: template.baseUser.writingStyle || {
              formality: 'casual',
              verbosity: 'moderate',
              humor: 'light',
              emojiUsage: 'minimal',
              punctuation: 'standard'
            }
          };
        } else {
          user = await generateRandomUserAsync(Array.from(usedNicknames));
        }
      } else {
        user = await generateRandomUserAsync(Array.from(usedNicknames));
        if (aiUsernames[i]) {
          user.nickname = aiUsernames[i];
        }
      }

      // Apply randomization settings
      if (randomizationSettings.randomizePersonality) {
        const randomPersonality = TRAIT_POOLS.personalities[Math.floor(Math.random() * TRAIT_POOLS.personalities.length)];
        const randomInterest = TRAIT_POOLS.interests[Math.floor(Math.random() * TRAIT_POOLS.interests.length)];
        user.personality = `${randomPersonality}, interested in ${randomInterest}`;
      }

      if (randomizationSettings.randomizeWritingStyle) {
        const formalityLevels = ['casual', 'formal', 'mixed'] as const;
        const verbosityLevels = ['concise', 'moderate', 'verbose'] as const;
        const humorLevels = ['none', 'light', 'heavy'] as const;
        const emojiLevels = ['none', 'minimal', 'frequent'] as const;
        const punctuationLevels = ['minimal', 'standard', 'excessive'] as const;

        user.writingStyle = {
          formality: formalityLevels[Math.floor(Math.random() * formalityLevels.length)],
          verbosity: verbosityLevels[Math.floor(Math.random() * verbosityLevels.length)],
          humor: humorLevels[Math.floor(Math.random() * humorLevels.length)],
          emojiUsage: emojiLevels[Math.floor(Math.random() * emojiLevels.length)],
          punctuation: punctuationLevels[Math.floor(Math.random() * punctuationLevels.length)]
        };
      }

      if (randomizationSettings.randomizeLanguages) {
        const numLanguages = Math.floor(Math.random() * 3) + 1;
        const shuffledLanguages = [...TRAIT_POOLS.languages].sort(() => 0.5 - Math.random());
        const fluencyLevels = ['beginner', 'intermediate', 'advanced', 'native'] as const;
        
        let selectedLanguages = shuffledLanguages.slice(0, numLanguages);
        
        // Force primary language if enabled
        if (forcePrimaryLanguage && primaryLanguage) {
          // Remove primary language from random selection if it's there
          selectedLanguages = selectedLanguages.filter(lang => lang !== primaryLanguage);
          // Add primary language as the first language with native fluency
          selectedLanguages.unshift(primaryLanguage);
        }
        
        user.languageSkills = {
          languages: selectedLanguages.map((lang, index) => ({
            language: lang,
            fluency: forcePrimaryLanguage && index === 0 ? 'native' : fluencyLevels[Math.floor(Math.random() * fluencyLevels.length)],
            accent: ''
          }))
        };
      }

      if (randomizationSettings.randomizeAccent && Math.random() > 0.7) {
        const randomAccent = TRAIT_POOLS.accents[Math.floor(Math.random() * TRAIT_POOLS.accents.length)];
        // Apply accent to the first language
        if (user.languageSkills.languages.length > 0) {
          user.languageSkills.languages[0].accent = randomAccent;
        }
      }

      users.push(user);
      usedNicknames.add(user.nickname.toLowerCase());
    }

    return users;
  };

  const generateUniqueNickname = (usedNicknames: Set<string>): string => {
    let nickname: string;
    let attempts = 0;
    do {
      nickname = generateRandomUser().nickname;
      attempts++;
    } while (usedNicknames.has(nickname.toLowerCase()) && attempts < 100);
    
    if (attempts >= 100) {
      nickname = `user${Date.now()}`;
    }
    
    return nickname;
  };

  const handlePreview = async () => {
    const users = await generateUsers();
    setPreviewUsers(users.slice(0, 3)); // Show first 3 as preview
  };

  const handleGenerate = async () => {
    const users = await generateUsers();
    onAddUsers(users);
    onClose();
  };

  const handleCancel = () => {
    setPreviewUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          Mass Add Users
        </h3>
        
        <div className="space-y-6">
          {/* Generation Mode Selection */}
          <div>
            <h4 className="text-lg font-semibold text-gray-200 mb-4">Generation Mode</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setGenerationMode('template')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  generationMode === 'template'
                    ? 'border-indigo-500 bg-indigo-900/20 text-indigo-200'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎭</div>
                  <div className="font-semibold">Templates</div>
                  <div className="text-sm opacity-75">Use predefined personality archetypes</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setGenerationMode('random')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  generationMode === 'random'
                    ? 'border-indigo-500 bg-indigo-900/20 text-indigo-200'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎲</div>
                  <div className="font-semibold">Random</div>
                  <div className="text-sm opacity-75">Generate completely random personalities</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setGenerationMode('ai')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  generationMode === 'ai'
                    ? 'border-indigo-500 bg-indigo-900/20 text-indigo-200'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-semibold">AI Generated</div>
                  <div className="text-sm opacity-75">Let AI create unique personalities</div>
                </div>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          {generationMode === 'template' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Select Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERSONALITY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-900/20 text-indigo-200'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">{template.name}</div>
                    <div className="text-sm opacity-75">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Count */}
          <div>
            <h4 className="text-lg font-semibold text-gray-200 mb-4">Number of Users</h4>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="50"
                value={userCount}
                onChange={(e) => setUserCount(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-2xl font-bold text-white min-w-[3rem] text-center">
                {userCount}
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Generate between 1 and 50 users at once
            </div>
          </div>

          {/* Randomization Settings */}
          {(generationMode === 'template' || generationMode === 'random') && (
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Randomization Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={randomizationSettings.randomizePersonality}
                    onChange={(e) => setRandomizationSettings(prev => ({
                      ...prev,
                      randomizePersonality: e.target.checked
                    }))}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-300">Personality</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={randomizationSettings.randomizeWritingStyle}
                    onChange={(e) => setRandomizationSettings(prev => ({
                      ...prev,
                      randomizeWritingStyle: e.target.checked
                    }))}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-300">Writing Style</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={randomizationSettings.randomizeLanguages}
                    onChange={(e) => setRandomizationSettings(prev => ({
                      ...prev,
                      randomizeLanguages: e.target.checked
                    }))}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-300">Languages</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={randomizationSettings.randomizeAccent}
                    onChange={(e) => setRandomizationSettings(prev => ({
                      ...prev,
                      randomizeAccent: e.target.checked
                    }))}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-300">Accent</span>
                </label>
              </div>
              
              {/* Primary Language Selection */}
              <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="forcePrimaryLanguage"
                    checked={forcePrimaryLanguage}
                    onChange={(e) => setForcePrimaryLanguage(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="forcePrimaryLanguage" className="text-gray-300 font-medium">
                    Force Primary Language
                  </label>
                </div>
                {forcePrimaryLanguage && (
                  <div className="ml-6">
                    <label htmlFor="primaryLanguage" className="block text-sm text-gray-400 mb-2">
                      Primary Language
                    </label>
                    <select
                      id="primaryLanguage"
                      value={primaryLanguage}
                      onChange={(e) => setPrimaryLanguage(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TRAIT_POOLS.languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      All generated users will have this as their primary language with native fluency
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Username Style Selection */}
          <div>
            <h4 className="text-lg font-semibold text-gray-200 mb-4">Username Style</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {USERNAME_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setUsernameStyle(category.id as any)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    usernameStyle === category.id
                      ? 'border-indigo-500 bg-indigo-900/20 text-indigo-200'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold text-sm">{category.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{category.description}</div>
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Choose the style for generated usernames. AI will create names that match the selected style.
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-200">Preview</h4>
              <button
                type="button"
                onClick={handlePreview}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-500 transition-colors"
              >
                Generate Preview
              </button>
            </div>
            
            {previewUsers.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {previewUsers.map((user, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded-lg p-3 border border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{user.nickname}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        {user.languageSkills.fluency}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{user.personality}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Languages:</span>
                        <p className="text-gray-300">{user.languageSkills.languages.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Style:</span>
                        <p className="text-gray-300 capitalize">{user.writingStyle.formality} • {user.writingStyle.verbosity}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {userCount > 3 && (
                  <div className="text-center text-gray-400 text-sm">
                    ... and {userCount - 3} more users
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (generationMode === 'template' && !selectedTemplate)}
              className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : `Generate ${userCount} Users`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
