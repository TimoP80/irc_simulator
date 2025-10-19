import React, { useState } from 'react';
import type { AppConfig } from '../types';
import { loadConfig } from '../utils/config';
import { DEFAULT_NICKNAME } from '../constants';
import { generateRandomWorldConfiguration } from '../services/geminiService';

interface SettingsModalProps {
  onSave: (config: AppConfig) => void;
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

export const SettingsModal: React.FC<SettingsModalProps> = ({ onSave }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const savedConfig = loadConfig();
    return {
      currentUserNickname: savedConfig?.currentUserNickname || DEFAULT_NICKNAME,
      virtualUsers: savedConfig?.virtualUsers || DEFAULT_USERS_TEXT,
      channels: savedConfig?.channels || DEFAULT_CHANNELS_TEXT,
      simulationSpeed: savedConfig?.simulationSpeed || 'normal',
    };
  });
  const [isRandomizing, setIsRandomizing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRandomize = async () => {
    setIsRandomizing(true);
    try {
      const randomConfig = await generateRandomWorldConfiguration();
      const usersString = randomConfig.users
        .map(u => `${u.nickname}, ${u.personality}`)
        .join('\n');
      const channelsString = randomConfig.channels
        .map(c => `${c.name}, ${c.topic}`)
        .join('\n');
      
      setConfig(prev => ({
        ...prev,
        virtualUsers: usersString,
        channels: channelsString,
      }));
    } catch (error) {
      console.error("An error occurred during randomization:", error);
      // TODO: Consider showing a user-facing error message here.
    } finally {
      setIsRandomizing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Simulation Configuration</h2>
        <p className="text-gray-400 mb-6">Customize the channels, virtual users, and your nickname. Changes are saved locally.</p>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="currentUserNickname" className="block text-sm font-medium text-gray-300 mb-2">Your Nickname</label>
            <input
              type="text"
              id="currentUserNickname"
              name="currentUserNickname"
              value={config.currentUserNickname}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="virtualUsers" className="block text-sm font-medium text-gray-300 mb-2">Virtual Users (nickname, personality)</label>
            <textarea
              id="virtualUsers"
              name="virtualUsers"
              value={config.virtualUsers}
              onChange={handleChange}
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="e.g., nova, A curious tech expert"
            />
          </div>
          <div>
            <label htmlFor="channels" className="block text-sm font-medium text-gray-300 mb-2">Channels (#channel, topic)</label>
            <textarea
              id="channels"
              name="channels"
              value={config.channels}
              onChange={handleChange}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="e.g., #general, A place for general chat"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Background Simulation Speed</label>
            <div className="flex items-center space-x-6">
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
          <div className="flex justify-end pt-2 gap-4">
             <button
              type="button"
              onClick={handleRandomize}
              disabled={isRandomizing}
              className="bg-gray-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-700 disabled:cursor-wait flex items-center gap-2"
            >
              {isRandomizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              type="submit"
              className="bg-indigo-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-indigo-500 transition-colors"
            >
              Save and Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};