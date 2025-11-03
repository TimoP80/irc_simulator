import React, { useState, useCallback, useEffect } from 'react';
import { getVisionService, getAvailableVisionModels } from '../services/visionService';

import { User, Attachment } from '../types';

interface VisionAnalysisProps {
  onClose: () => void;
  onAnalysisComplete: (description: string, user: User | null) => void;
  virtualUsers: User[];
  attachment?: Attachment | null;
}

export const VisionAnalysis: React.FC<VisionAnalysisProps> = ({ onClose, onAnalysisComplete, virtualUsers, attachment = null }) => {
  const [image, setImage] = useState<string | null>(attachment?.url || null);
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      const availableModels = await getAvailableVisionModels();
      setModels(availableModels);
      if (availableModels.length > 0) {
        setSelectedModel(availableModels[0]);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (virtualUsers.length > 0) {
      setSelectedUser(virtualUsers[0]);
    }
  }, [virtualUsers]);

  useEffect(() => {
    if (attachment) {
      setImage(attachment.url);
    }
  }, [attachment]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!image) return;

    setIsLoading(true);
    setError('');
    setDescription('');

    const visionService = getVisionService(selectedModel);
    const base64Image = image.split(',')[1];
    const response = await visionService.analyzeImage({ imageData: base64Image });

    setIsLoading(false);

    if (response.success && response.description) {
      setDescription(response.description);
      onAnalysisComplete(response.description, selectedUser); // Pass the description and user back to the parent
    } else {
      setError(response.error || 'Failed to analyze image.');
    }
  }, [image, onAnalysisComplete, selectedUser, selectedModel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">Image Analysis</h2>
        <div className="flex flex-col gap-4">
          {!attachment && <input type="file" accept="image/*" onChange={handleImageUpload} className="text-white" />}
          {image && <img src={image} alt="Uploaded" className="max-w-full h-auto rounded-md" />}
          <div className="flex items-center gap-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
              disabled={isLoading}
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <select
              value={selectedUser?.nickname || ''}
              onChange={(e) => {
                const user = virtualUsers.find(u => u.nickname === e.target.value);
                setSelectedUser(user || null);
              }}
              className="bg-gray-700 text-white p-2 rounded"
              disabled={isLoading}
            >
              {virtualUsers.map((user) => (
                <option key={user.nickname} value={user.nickname}>
                  {user.nickname}
                </option>
              ))}
            </select>
            <button onClick={handleAnalyze} disabled={!image || isLoading || !selectedModel || !selectedUser} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
              {isLoading ? 'Analyzing...' : `Analyze as ${selectedUser?.nickname}`}
            </button>
          </div>
          {description && (
            <div className="text-white mt-4 p-4 bg-gray-700 rounded-md flex flex-col">
              <div className="max-h-48 overflow-y-auto pr-2 mb-2">
                <p className="whitespace-pre-wrap">{description}</p>
              </div>
              <button
                onClick={() => onAnalysisComplete(description, selectedUser)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded self-start"
              >
                Insert into Chat
              </button>
            </div>
          )}
          {error && <div className="text-red-500 mt-4">{error}</div>}
        </div>
        <button onClick={onClose} className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">
          Close
        </button>
      </div>
    </div>
  );
};