import React, { useState, useEffect } from 'react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (nickname: string, personality: string) => void;
  existingNicknames: string[];
  editingUser?: { nickname: string; personality: string } | null;
  onUpdateUser?: (oldNickname: string, newNickname: string, personality: string) => void;
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
  const [errors, setErrors] = useState<{ nickname?: string; personality?: string }>({});

  const isEditing = !!editingUser;

  // Reset form when modal opens/closes or when editing user changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setNickname(editingUser.nickname);
        setPersonality(editingUser.personality);
      } else {
        setNickname('');
        setPersonality('');
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
    const newErrors: { nickname?: string; personality?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isEditing && editingUser && onUpdateUser) {
      onUpdateUser(editingUser.nickname, nickname.trim(), personality.trim());
    } else {
      onAddUser(nickname.trim(), personality.trim());
    }
    
    onClose();
  };

  const handleCancel = () => {
    setNickname('');
    setPersonality('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          {isEditing ? 'Edit User' : 'Add New User'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              rows={4}
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-indigo-500 transition-colors"
            >
              {isEditing ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
