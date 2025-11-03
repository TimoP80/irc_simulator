import React, { useState, useRef } from 'react';
import { AppConfig } from '../types';
import { exportFullConfig, importFullConfig, downloadFile, readFileAsText } from '../utils/importExport';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (config: Partial<AppConfig>) => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const configString = localStorage.getItem('gemini-irc-simulator-config');
    if (configString) {
      const config = JSON.parse(configString);
      const jsonContent = exportFullConfig(config);
      downloadFile(jsonContent, 'station-v-backup.json', 'application/json');
    } else {
      alert('No configuration found to export.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const jsonContent = await readFileAsText(file);
        const importedConfig = importFullConfig(jsonContent);
        onImport(importedConfig);
        onClose();
      } catch (error) {
        console.error('Failed to import configuration:', error);
        alert('Failed to import configuration. Please check the file format.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Full Backup & Restore</h2>
        <p className="text-sm text-gray-400 mb-6">Export all your settings, users, and channels to a single file, or restore from a backup.</p>
        
        <div className="space-y-4">
          <button
            onClick={handleExport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Export Full Backup
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            className="hidden"
            accept=".json"
          />
          <button
            onClick={handleImportClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Import from Backup
          </button>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
