import React, { useState, useRef } from 'react';
import type { Channel } from '../types';
import { exportChannelsToJSON, importChannelsFromJSON } from '../utils/channelImportExport';
import { downloadFile, readFileAsText } from '../utils/importExport';

interface ChannelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  onImport: (importedChannels: Channel[]) => void;
}

export const ChannelImportExportModal: React.FC<ChannelImportExportModalProps> = ({ isOpen, onClose, channels, onImport }) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChannelSelection = (channelName: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelName)
        ? prev.filter(name => name !== channelName)
        : [...prev, channelName]
    );
  };

  const handleExport = () => {
    const channelsToExport = channels.filter(c => selectedChannels.includes(c.name));
    if (channelsToExport.length === 0) {
      alert('Please select at least one channel to export.');
      return;
    }
    const jsonContent = exportChannelsToJSON(channelsToExport);
    downloadFile(jsonContent, 'channels-export.json', 'application/json');
    onClose();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const jsonContent = await readFileAsText(file);
        const importedChannels = importChannelsFromJSON(jsonContent);
        onImport(importedChannels);
        onClose();
      } catch (error) {
        console.error('Failed to import channels:', error);
        alert('Failed to import channels. Please check the file format.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Import/Export Channels</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Export Channels</h3>
          <p className="text-sm text-gray-400 mb-3">Select channels to export to a JSON file.</p>
          <div className="max-h-48 overflow-y-auto bg-gray-700 p-2 rounded">
            {channels.map(channel => (
              <div key={channel.name} className="flex items-center">
                <input
                  type="checkbox"
                  id={`channel-${channel.name}`}
                  checked={selectedChannels.includes(channel.name)}
                  onChange={() => handleChannelSelection(channel.name)}
                  className="h-4 w-4 bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <label htmlFor={`channel-${channel.name}`} className="ml-2 text-gray-300">{channel.name}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Export Selected</button>
        </div>
        <div className="border-t border-gray-600 pt-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Import Channels</h3>
          <p className="text-sm text-gray-400 mb-3">Import channels from a JSON file.</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".json"
          />
          <button onClick={handleImportClick} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Import from File</button>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Close</button>
        </div>
      </div>
    </div>
  );
};
