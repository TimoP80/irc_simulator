import React, { useState, useEffect } from 'react';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (name: string, topic: string, dominantLanguage?: string) => void;
  existingChannelNames: string[];
  editingChannel?: { name: string; topic: string; dominantLanguage?: string } | null;
  onUpdateChannel?: (oldName: string, newName: string, topic: string, dominantLanguage?: string) => void;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  existingChannelNames,
  editingChannel,
  onUpdateChannel
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [dominantLanguage, setDominantLanguage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; topic?: string }>({});

  const isEditing = !!editingChannel;

  // Reset form when modal opens/closes or when editing channel changes
  useEffect(() => {
    if (isOpen) {
      if (editingChannel) {
        setName(editingChannel.name);
        setTopic(editingChannel.topic);
        setDominantLanguage(editingChannel.dominantLanguage || '');
      } else {
        setName('');
        setTopic('');
        setDominantLanguage('');
      }
      setErrors({});
    }
  }, [isOpen, editingChannel]);

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
    const newErrors: { name?: string; topic?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Channel name is required';
    } else if (!name.startsWith('#')) {
      newErrors.name = 'Channel name must start with #';
    } else if (name.length < 2) {
      newErrors.name = 'Channel name must be at least 2 characters';
    } else if (name.length > 30) {
      newErrors.name = 'Channel name must be 30 characters or less';
    } else if (!/^#[a-zA-Z0-9_-]+$/.test(name)) {
      newErrors.name = 'Channel name can only contain letters, numbers, underscores, and hyphens after #';
    } else if (!isEditing && existingChannelNames.includes(name.toLowerCase())) {
      newErrors.name = 'This channel already exists';
    } else if (isEditing && editingChannel && name.toLowerCase() !== editingChannel.name.toLowerCase() && existingChannelNames.includes(name.toLowerCase())) {
      newErrors.name = 'This channel already exists';
    }

    if (!topic.trim()) {
      newErrors.topic = 'Channel topic is required';
    } else if (topic.length < 5) {
      newErrors.topic = 'Topic must be at least 5 characters';
    } else if (topic.length > 150) {
      newErrors.topic = 'Topic must be 150 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isEditing && editingChannel && onUpdateChannel) {
      onUpdateChannel(editingChannel.name, name.trim(), topic.trim(), dominantLanguage || undefined);
    } else {
      onAddChannel(name.trim(), topic.trim(), dominantLanguage || undefined);
    }
    
    onClose();
  };

  const handleCancel = () => {
    setName('');
    setTopic('');
    setErrors({});
    onClose();
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
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4">
          {isEditing ? 'Edit Channel' : 'Add New Channel'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="channelName" className="block text-sm font-medium text-gray-300 mb-2">
              Channel Name
            </label>
            <input
              type="text"
              id="channelName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-gray-700 border rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="e.g., #general, #tech-talk, #random"
              maxLength={30}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Must start with #. Letters, numbers, underscores, and hyphens only. 2-30 characters.
            </p>
          </div>

          <div>
            <label htmlFor="channelTopic" className="block text-sm font-medium text-gray-300 mb-2">
              Channel Topic
            </label>
            <textarea
              id="channelTopic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              className={`w-full bg-gray-700 border rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                errors.topic ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Describe what this channel is for and what kind of discussions happen here..."
              maxLength={150}
            />
            {errors.topic && (
              <p className="text-red-400 text-xs mt-1">{errors.topic}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {topic.length}/150 characters. Be descriptive about the channel's purpose.
            </p>
          </div>

          <div>
            <label htmlFor="channelLanguage" className="block text-sm font-medium text-gray-300 mb-2">
              Dominant Language
            </label>
            <select
              id="channelLanguage"
              value={dominantLanguage}
              onChange={(e) => setDominantLanguage(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Auto-detect from users</option>
              <option value="English">English</option>
              <option value="Finnish">Finnish</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
              <option value="Italian">Italian</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Russian">Russian</option>
              <option value="Chinese">Chinese</option>
              <option value="Korean">Korean</option>
              <option value="Arabic">Arabic</option>
              <option value="Dutch">Dutch</option>
              <option value="Swedish">Swedish</option>
              <option value="Norwegian">Norwegian</option>
              <option value="Danish">Danish</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">
              Set the primary language for this channel. AI users will respond in this language.
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
              {isEditing ? 'Update Channel' : 'Add Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
