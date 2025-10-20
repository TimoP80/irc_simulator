import React, { useState, useRef } from 'react';
import { User } from '../types';
import { exportUsersToCSV, exportUsersToJSON, importUsersFromCSV, importUsersFromJSON, downloadFile, readFileAsText } from '../utils/importExport';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onImportUsers: (users: User[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  users,
  onImportUsers
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExportCSV = () => {
    const csvContent = exportUsersToCSV(users);
    downloadFile(csvContent, `station-v-users-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonContent = exportUsersToJSON(users);
    downloadFile(jsonContent, `station-v-users-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    try {
      const content = await readFileAsText(file);
      let importedUsers: User[] = [];

      if (importFormat === 'csv') {
        importedUsers = importUsersFromCSV(content);
      } else {
        importedUsers = importUsersFromJSON(content);
      }

      if (importedUsers.length === 0) {
        setImportError('No valid users found in the file');
        return;
      }

      onImportUsers(importedUsers);
      setImportSuccess(`Successfully imported ${importedUsers.length} users`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import users. Please check the file format.');
    }
  };

  const handleClose = () => {
    setImportError('');
    setImportSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          Import / Export Users
        </h3>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Import
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Export Users</h4>
              <p className="text-gray-400 mb-6">
                Export your current {users.length} users to a file for backup or sharing.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="p-4 rounded-lg border-2 border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 hover:bg-green-900/20 hover:text-green-200 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-semibold">Export as CSV</div>
                    <div className="text-sm opacity-75">Spreadsheet format</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="p-4 rounded-lg border-2 border-gray-600 bg-gray-700 text-gray-300 hover:border-blue-500 hover:bg-blue-900/20 hover:text-blue-200 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📄</div>
                    <div className="font-semibold">Export as JSON</div>
                    <div className="text-sm opacity-75">Structured data format</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Import Users</h4>
              <p className="text-gray-400 mb-6">
                Import users from a CSV or JSON file. This will add the imported users to your current list.
              </p>
              
              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">File Format</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="csv"
                      checked={importFormat === 'csv'}
                      onChange={(e) => setImportFormat(e.target.value as 'csv')}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-gray-300">CSV</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="json"
                      checked={importFormat === 'json'}
                      onChange={(e) => setImportFormat(e.target.value as 'json')}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-gray-300">JSON</span>
                  </label>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={importFormat === 'csv' ? '.csv' : '.json'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:border-indigo-500 hover:text-indigo-200 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📁</div>
                    <div className="font-semibold">Choose File</div>
                    <div className="text-sm opacity-75">
                      Click to select a {importFormat.toUpperCase()} file
                    </div>
                  </div>
                </button>
              </div>

              {/* Status Messages */}
              {importError && (
                <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
                  {importError}
                </div>
              )}
              
              {importSuccess && (
                <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-200">
                  {importSuccess}
                </div>
              )}

              {/* Format Help */}
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h5 className="font-semibold text-gray-200 mb-2">Expected Format</h5>
                <div className="text-sm text-gray-400">
                  {importFormat === 'csv' ? (
                    <div>
                      <p>CSV files should have these columns:</p>
                      <code className="block mt-2 p-2 bg-gray-800 rounded text-xs">
                        nickname,personality,fluency,languages,accent,formality,verbosity,humor,emojiUsage,punctuation
                      </code>
                      <p className="mt-2">Languages should be separated by semicolons (;)</p>
                    </div>
                  ) : (
                    <div>
                      <p>JSON files should contain an array of user objects with:</p>
                      <code className="block mt-2 p-2 bg-gray-800 rounded text-xs">
                        {`[{"nickname":"user1","personality":"...","languageSkills":{...},"writingStyle":{...}}]`}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
          <button
            type="button"
            onClick={handleClose}
            className="bg-gray-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
