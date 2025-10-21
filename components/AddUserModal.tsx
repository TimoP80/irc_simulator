import React, { useState, useEffect } from 'react';
import { User, Channel } from '../types';
import { generateRandomNicknameAsync } from '../utils/personalityTemplates';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
  existingNicknames: string[];
  editingUser?: User | null;
  onUpdateUser?: (oldNickname: string, newUser: User) => void;
  channels?: Channel[];
  onChannelsChange?: (channels: Channel[]) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  existingNicknames,
  editingUser,
  onUpdateUser,
  channels = [],
  onChannelsChange
}) => {
  const [nickname, setNickname] = useState('');
  const [personality, setPersonality] = useState('');
  const [languageSkills, setLanguageSkills] = useState({
    fluency: 'native' as 'beginner' | 'intermediate' | 'advanced' | 'native',
    languages: ['English'],
    accent: ''
  });
  const [writingStyle, setWritingStyle] = useState({
    formality: 'neutral' as 'very_informal' | 'informal' | 'neutral' | 'formal' | 'very_formal',
    verbosity: 'neutral' as 'very_terse' | 'terse' | 'neutral' | 'verbose' | 'very_verbose',
    humor: 'none' as 'none' | 'dry' | 'sarcastic' | 'witty' | 'slapstick',
    emojiUsage: 'low' as 'none' | 'low' | 'medium' | 'high' | 'excessive',
    punctuation: 'standard' as 'minimal' | 'standard' | 'creative' | 'excessive'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [assignedChannels, setAssignedChannels] = useState<string[]>([]);

  const isEditing = !!editingUser;

  // Reset form when modal opens/closes or when editing user changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setNickname(editingUser.nickname);
        setPersonality(editingUser.personality);
        setLanguageSkills({
          fluency: editingUser.languageSkills?.fluency || 'native',
          languages: editingUser.languageSkills?.languages || ['English'],
          accent: editingUser.languageSkills?.accent || ''
        });
        setWritingStyle({
          formality: editingUser.writingStyle?.formality || 'neutral',
          verbosity: editingUser.writingStyle?.verbosity || 'neutral',
          humor: editingUser.writingStyle?.humor || 'none',
          emojiUsage: editingUser.writingStyle?.emojiUsage || 'low',
          punctuation: editingUser.writingStyle?.punctuation || 'standard'
        });
        // Get channels where this user is assigned
        const userChannels = channels
          .filter(channel => channel.users.some(u => u.nickname === editingUser.nickname))
          .map(channel => channel.name);
        setAssignedChannels(userChannels);
      } else {
        setNickname('');
        setPersonality('');
        setLanguageSkills({
          fluency: 'native',
          languages: ['English'],
          accent: ''
        });
        setWritingStyle({
          formality: 'neutral',
          verbosity: 'neutral',
          humor: 'none',
          emojiUsage: 'low',
          punctuation: 'standard'
        });
        setAssignedChannels([]);
      }
      setErrors({});
    }
  }, [isOpen, editingUser, channels]);

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
    } else if (nickname.length < 2) {
      newErrors.nickname = 'Nickname must be at least 2 characters';
    } else if (nickname.length > 20) {
      newErrors.nickname = 'Nickname must be 20 characters or less';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      newErrors.nickname = 'Nickname can only contain letters, numbers, underscores, and hyphens';
    } else if (!isEditing && existingNicknames.includes(nickname.toLowerCase())) {
      newErrors.nickname = 'This nickname is already taken';
    } else if (isEditing && editingUser && nickname.toLowerCase() !== editingUser.nickname.toLowerCase() && existingNicknames.includes(nickname.toLowerCase())) {
      newErrors.nickname = 'This nickname is already taken';
    }

    if (!personality.trim()) {
      newErrors.personality = 'Personality is required';
    } else if (personality.length < 10) {
      newErrors.personality = 'Personality must be at least 10 characters';
    } else if (personality.length > 200) {
      newErrors.personality = 'Personality must be 200 characters or less';
    }

    if (languageSkills.languages.length === 0) {
      newErrors.languages = 'At least one language must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newUser: User = {
      nickname: nickname.trim(),
      status: 'online',
      personality: personality.trim(),
      languageSkills: {
        ...languageSkills,
        languages: languageSkills.languages.filter(lang => lang.trim() !== '')
      },
      writingStyle
    };

    // Handle channel assignments
    if (onChannelsChange && assignedChannels.length > 0) {
      const updatedChannels = channels.map(channel => {
        if (assignedChannels.includes(channel.name)) {
          // Check if user is already in this channel (for editing)
          const isAlreadyInChannel = channel.users.some(u => u.nickname === newUser.nickname);
          if (!isAlreadyInChannel) {
            return {
              ...channel,
              users: [...channel.users, newUser]
            };
          }
        } else if (isEditing && editingUser) {
          // Remove user from channels they're no longer assigned to
          return {
            ...channel,
            users: channel.users.filter(u => u.nickname !== editingUser.nickname)
          };
        }
        return channel;
      });
      onChannelsChange(updatedChannels);
    }

    if (isEditing && editingUser && onUpdateUser) {
      onUpdateUser(editingUser.nickname, newUser);
    } else {
      onAddUser(newUser);
    }
    
    onClose();
  };

  const handleRandomizeNickname = async () => {
    setIsRandomizing(true);
    try {
      const randomNickname = await generateRandomNicknameAsync(existingNicknames);
      setNickname(randomNickname);
      // Clear any existing nickname errors
      setErrors(prev => ({ ...prev, nickname: '' }));
    } catch (error) {
      console.error('Failed to generate random nickname:', error);
      // Fallback to a simple random nickname
      const fallbackNickname = `user${Date.now()}`;
      setNickname(fallbackNickname);
    } finally {
      setIsRandomizing(false);
    }
  };

  const handleCancel = () => {
    setNickname('');
    setPersonality('');
    setLanguageSkills({
      fluency: 'native',
      languages: ['English'],
      accent: ''
    });
    setWritingStyle({
      formality: 'neutral',
      verbosity: 'neutral',
      humor: 'none',
      emojiUsage: 'low',
      punctuation: 'standard'
    });
    setErrors({});
    onClose();
  };

  const addLanguage = () => {
    setLanguageSkills(prev => ({
      ...prev,
      languages: [...prev.languages, '']
    }));
  };

  const updateLanguage = (index: number, value: string) => {
    setLanguageSkills(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? value : lang)
    }));
  };

  const removeLanguage = (index: number) => {
    setLanguageSkills(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // Channel assignment functions
  const assignToChannel = (channelName: string) => {
    if (!assignedChannels.includes(channelName)) {
      setAssignedChannels(prev => [...prev, channelName]);
    }
  };

  const removeFromChannel = (channelName: string) => {
    setAssignedChannels(prev => prev.filter(name => name !== channelName));
  };

  const getAvailableChannels = () => {
    return channels.filter(channel => !assignedChannels.includes(channel.name));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-6">
          {isEditing ? 'Edit User' : 'Add New User'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">
              Basic Information
            </h4>
            
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                Nickname
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className={`flex-1 bg-gray-700 border rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.nickname ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="e.g., nova, seraph, jinx"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleRandomizeNickname}
                  disabled={isRandomizing}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 min-w-[120px]"
                  title="Generate a random AI-powered username"
                >
                  {isRandomizing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Randomize
                    </>
                  )}
                </button>
              </div>
              {errors.nickname && (
                <p className="text-red-400 text-xs mt-1">{errors.nickname}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Letters, numbers, underscores, and hyphens only. 2-20 characters. Use the randomize button for AI-generated usernames.
              </p>
            </div>

            <div>
              <label htmlFor="personality" className="block text-sm font-medium text-gray-300 mb-2">
                Personality
              </label>
              <textarea
                id="personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={3}
                className={`w-full bg-gray-700 border rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                  errors.personality ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Describe this user's personality, interests, and how they should behave in chat..."
                maxLength={200}
              />
              {errors.personality && (
                <p className="text-red-400 text-xs mt-1">{errors.personality}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {personality.length}/200 characters. Be descriptive about their behavior and interests.
              </p>
            </div>
          </div>

          {/* Language Skills */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">
              Language Skills
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fluency" className="block text-sm font-medium text-gray-300 mb-2">
                  Fluency Level
                </label>
                <select
                  id="fluency"
                  value={languageSkills.fluency}
                  onChange={(e) => setLanguageSkills(prev => ({ ...prev, fluency: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="native">Native</option>
                </select>
              </div>

              <div>
                <label htmlFor="accent" className="block text-sm font-medium text-gray-300 mb-2">
                  Accent/Dialect (Optional)
                </label>
                <input
                  type="text"
                  id="accent"
                  value={languageSkills.accent}
                  onChange={(e) => setLanguageSkills(prev => ({ ...prev, accent: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., British, Southern, Australian"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Languages
              </label>
              <div className="space-y-2">
                {languageSkills.languages.map((lang, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={lang}
                      onChange={(e) => updateLanguage(index, e.target.value)}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Language name"
                    />
                    {languageSkills.languages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="bg-red-600 text-white rounded-lg px-3 py-2 hover:bg-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLanguage}
                  className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-500 transition-colors"
                >
                  Add Language
                </button>
              </div>
              {errors.languages && (
                <p className="text-red-400 text-xs mt-1">{errors.languages}</p>
              )}
            </div>
          </div>

          {/* Writing Style */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">
              Writing Style
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="formality" className="block text-sm font-medium text-gray-300 mb-2">
                  Formality
                </label>
                <select
                  id="formality"
                  value={writingStyle.formality}
                  onChange={(e) => setWritingStyle(prev => ({ ...prev, formality: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="very_informal">Very Informal</option>
                  <option value="informal">Informal</option>
                  <option value="neutral">Neutral</option>
                  <option value="formal">Formal</option>
                  <option value="very_formal">Very Formal</option>
                </select>
              </div>

              <div>
                <label htmlFor="verbosity" className="block text-sm font-medium text-gray-300 mb-2">
                  Verbosity
                </label>
                <select
                  id="verbosity"
                  value={writingStyle.verbosity}
                  onChange={(e) => setWritingStyle(prev => ({ ...prev, verbosity: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="very_terse">Very Terse</option>
                  <option value="terse">Terse</option>
                  <option value="neutral">Neutral</option>
                  <option value="verbose">Verbose</option>
                  <option value="very_verbose">Very Verbose</option>
                </select>
              </div>

              <div>
                <label htmlFor="humor" className="block text-sm font-medium text-gray-300 mb-2">
                  Humor Level
                </label>
                <select
                  id="humor"
                  value={writingStyle.humor}
                  onChange={(e) => setWritingStyle(prev => ({ ...prev, humor: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="dry">Dry</option>
                  <option value="sarcastic">Sarcastic</option>
                  <option value="witty">Witty</option>
                  <option value="slapstick">Slapstick</option>
                </select>
              </div>

              <div>
                <label htmlFor="emojiUsage" className="block text-sm font-medium text-gray-300 mb-2">
                  Emoji Usage
                </label>
                <select
                  id="emojiUsage"
                  value={writingStyle.emojiUsage}
                  onChange={(e) => setWritingStyle(prev => ({ ...prev, emojiUsage: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="excessive">Excessive</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="punctuation" className="block text-sm font-medium text-gray-300 mb-2">
                  Punctuation Style
                </label>
                <select
                  id="punctuation"
                  value={writingStyle.punctuation}
                  onChange={(e) => setWritingStyle(prev => ({ ...prev, punctuation: e.target.value as any }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="minimal">Minimal</option>
                  <option value="standard">Standard</option>
                  <option value="creative">Creative</option>
                  <option value="excessive">Excessive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Channel Assignments */}
          {channels.length > 0 && onChannelsChange && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-200 border-b border-gray-600 pb-2">
                Channel Assignments
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Assign to channels:</span>
                  {getAvailableChannels().length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignToChannel(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-gray-600 text-white text-sm rounded px-3 py-1 border border-gray-500"
                      defaultValue=""
                    >
                      <option value="">Add to channel...</option>
                      {getAvailableChannels().map(channel => (
                        <option key={channel.name} value={channel.name}>
                          {channel.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {assignedChannels.map(channelName => (
                    <span
                      key={channelName}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-900 text-indigo-200"
                    >
                      {channelName}
                      <button
                        type="button"
                        onClick={() => removeFromChannel(channelName)}
                        className="ml-1 text-indigo-300 hover:text-indigo-100"
                        title={`Remove from ${channelName}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {assignedChannels.length === 0 && (
                    <span className="text-gray-500 text-sm italic">Not assigned to any channels</span>
                  )}
                </div>
                
                <p className="text-gray-500 text-xs">
                  Users will only appear in channels they're assigned to. You can assign users to channels later from the main user list.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-indigo-500 transition-colors"
            >
              {isEditing ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
