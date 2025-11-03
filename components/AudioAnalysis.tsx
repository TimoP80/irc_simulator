import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getAudioService, getAvailableAudioModels } from '../services/audioService';

import { User } from '../types';

interface AudioAnalysisProps {
  onClose: () => void;
  onAnalysisComplete: (transcript: string, user: User | null) => void;
  virtualUsers: User[];
  audioAttachment?: File;
}

export const AudioAnalysis: React.FC<AudioAnalysisProps> = ({ onClose, onAnalysisComplete, virtualUsers, audioAttachment }) => {
  const [audio, setAudio] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      const availableModels = await getAvailableAudioModels();
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
    if (audioAttachment) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudio(reader.result as string);
      };
      reader.readAsDataURL(audioAttachment);
    }
  }, [audioAttachment]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudio(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Error accessing microphone.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!audio) return;

    setIsLoading(true);
    setError('');
    setTranscript('');

    const audioService = getAudioService(selectedModel);
    const base64Audio = audio.split(',')[1];
    const response = await audioService.analyzeAudio({ audioData: base64Audio });

    setIsLoading(false);

    if (response.success && response.transcript) {
      setTranscript(response.transcript);
      onAnalysisComplete(response.transcript, selectedUser);
    } else {
      setError(response.error || 'Failed to analyze audio.');
    }
  }, [audio, onAnalysisComplete, selectedModel, selectedUser]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">Audio Analysis</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {!audioAttachment && (
              <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`bg-${isRecording ? 'red' : 'blue'}-600 hover:bg-${isRecording ? 'red' : 'blue'}-500 text-white font-bold py-2 px-4 rounded`}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
            )}
            {audio && <audio src={audio} controls className="w-full" />}
          </div>
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
            <button onClick={handleAnalyze} disabled={!audio || isLoading || !selectedModel || !selectedUser} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
              {isLoading ? 'Analyzing...' : `Analyze as ${selectedUser?.nickname}`}
            </button>
          </div>
          {transcript && (
            <div className="text-white mt-4 p-4 bg-gray-700 rounded-md">
              <p>{transcript}</p>
              <button
                onClick={() => onAnalysisComplete(transcript, selectedUser)}
                className="mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded"
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