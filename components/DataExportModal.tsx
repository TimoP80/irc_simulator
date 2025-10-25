import React, { useState, useEffect } from 'react';
import { getDataExportService, type ExportedData } from '../services/dataExportService';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dataSummary, setDataSummary] = useState<{
    channels: number;
    privateMessages: number;
    unreadPMUsers: number;
    unreadChannels: number;
    chatLogs: number;
    hasActiveContext: boolean;
    configExists: boolean;
  } | null>(null);

  const dataExportService = getDataExportService();

  useEffect(() => {
    if (isOpen) {
      loadDataSummary();
    }
  }, [isOpen]);

  const loadDataSummary = async () => {
    try {
      const summary = await dataExportService.getDataSummary();
      setDataSummary(summary);
    } catch (error) {
      dataExportDebug.error('Failed to load data summary:', error);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await dataExportService.exportToFile();
      setSuccess('Data exported successfully! Check your downloads folder.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await dataExportService.importFromFile(file);
      setSuccess('Data imported successfully! Please refresh the page to see the changes.');
      await loadDataSummary(); // Refresh summary
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import data');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone!')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await dataExportService.clearAllData();
      setSuccess('All data cleared successfully! Please refresh the page.');
      await loadDataSummary(); // Refresh summary
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clear data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Data Export/Import</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Data Summary */}
        {dataSummary && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Current Data Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Channels:</span>
                <span className="text-white font-mono">{dataSummary.channels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Private Messages:</span>
                <span className="text-white font-mono">{dataSummary.privateMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Unread PM Users:</span>
                <span className="text-white font-mono">{dataSummary.unreadPMUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Unread Channels:</span>
                <span className="text-white font-mono">{dataSummary.unreadChannels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Chat Logs:</span>
                <span className="text-white font-mono">{dataSummary.chatLogs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Context:</span>
                <span className="text-white font-mono">{dataSummary.hasActiveContext ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Configuration:</span>
                <span className="text-white font-mono">{dataSummary.configExists ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Export Data</h3>
          <p className="text-gray-300 text-sm mb-4">
            Export all your data (channels, messages, configuration, etc.) to a JSON file for backup.
          </p>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to File
              </>
            )}
          </button>
        </div>

        {/* Import Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Import Data</h3>
          <p className="text-gray-300 text-sm mb-4">
            Import previously exported data from a JSON file. This will replace all current data.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isLoading}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Choose File to Import
                </>
              )}
            </label>
            <span className="text-gray-400 text-sm">Select a .json backup file</span>
          </div>
        </div>

        {/* Clear Data Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Clear All Data</h3>
          <p className="text-gray-300 text-sm mb-4">
            <span className="text-red-400 font-semibold">Warning:</span> This will permanently delete all your data including channels, messages, and configuration.
          </p>
          <button
            onClick={handleClearAll}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Clearing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All Data
              </>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
            <p className="text-green-200 text-sm">{success}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-gray-400 text-xs">
          <p><strong>Tip:</strong> Export your data regularly to avoid losing your chat history and configuration.</p>
          <p><strong>Note:</strong> After importing data, refresh the page to see all changes take effect.</p>
        </div>
      </div>
    </div>
  );
};
