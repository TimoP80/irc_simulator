import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
  existingNicknames: string[];
  editingUser?: User | null;
  onUpdateUser?: (oldNickname: string, newUser: User) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  existingNicknames,
  editingUser,
  onUpdateUser
}) => {
  const [nickname, setNickname] = useState('');
  const [personality, setPersonality] = useState('');
  const [languageSkills, setLanguageSkills] = useState({
    fluency: 'native' as 'beginner' | 'intermediate' | 'advanced' | 'native',
    languages: ['English'],
    accent: ''
  });
  const [writingStyle, setWritingStyle] = useState({
    formality: 'casual' as 'casual' | 'formal' | 'mixed',
    verbosity: 'moderate' as 'concise' | 'moderate' | 'verbose',
    humor: 'light' as 'none' | 'light' | 'heavy',
    emojiUsage: 'minimal' as 'none' | 'minimal' | 'frequent',
    punctuation: 'standard' as 'minimal' | 'standard' | 'excessive'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = !!editingUser;

  // Reset form when modal opens/closes or when editing user changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setNickname(editingUser.nickname);
        setPersonality(editingUser.personality);
        setLanguageSkills(editingUser.languageSkills);
        setWritingStyle(editingUser.writingStyle);
      } else {
        setNickname('');
        setPersonality('');
        setLanguageSkills({
          fluency: 'native',
          languages: ['English'],
          accent: ''
        });
        setWritingStyle({
          formality: 'casual',
          verbosity: 'moderate',
          humor: 'light',
          emojiUsage: 'minimal',
          punctuation: 'standard'
        });
      }
      setErrors({});
    }
  }, [isOpen, editingUser]);

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

    if (isEditing && editingUser && onUpdateUser) {
      onUpdateUser(editingUser.nickname, newUser);
    } else {
      onAddUser(newUser);
    }
    
    onClose();
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
      formality: 'casual',
      verbosity: 'moderate',
      humor: 'light',
      emojiUsage: 'minimal',
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
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`w-full bg-gray-700 border rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.nickname ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g., nova, seraph, jinx"
                maxLength={20}
              />
              {errors.nickname && (
                <p className="text-red-400 text-xs mt-1">{errors.nickname}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Letters, numbers, underscores, and hyphens only. 2-20 characters.
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
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="mixed">Mixed</option>
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
                  <option value="concise">Concise</option>
                  <option value="moderate">Moderate</option>
                  <option value="verbose">Verbose</option>
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
                  <option value="light">Light</option>
                  <option value="heavy">Heavy</option>
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
                  <option value="minimal">Minimal</option>
                  <option value="frequent">Frequent</option>
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
                  <option value="excessive">Excessive</option>
                </select>
              </div>
            </div>
          </div>

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
