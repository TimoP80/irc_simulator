import React, { useState, useEffect } from 'react';
import { IRCExportConfig, IRCExportStatus, getIRCExportService, getDefaultIRCExportConfig } from '../services/ircExportService';

interface IRCExportSettingsProps {
  config: IRCExportConfig;
  onConfigChange: (config: IRCExportConfig) => void;
  status: IRCExportStatus;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export const IRCExportSettings: React.FC<IRCExportSettingsProps> = ({
  config,
  onConfigChange,
  status,
  onConnect,
  onDisconnect
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } catch (error) {
      console.error('IRC Export connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } catch (error) {
      console.error('IRC Export disconnect failed:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConfigChange = (field: keyof IRCExportConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🌐 IRC Export</h3>
      <p className="text-gray-300 text-sm mb-4">
        Export your AI personalities to a real IRC channel so friends can chat with them!
      </p>
      
      <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded">
        <p className="text-sm text-blue-200">
          <strong>Note:</strong> IRC Export requires the local proxy server to be running.
          <br />
          Start it with: <code className="bg-gray-800 px-1 rounded">node irc-proxy-server.js</code>
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Status:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">
              {status.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {status.connected && (
          <div className="mt-2 text-xs text-gray-400">
            <div>Server: {status.server}</div>
            <div>Channel: {status.channel}</div>
            <div>Nickname: {status.nickname}</div>
            {status.lastActivity && (
              <div>Last Activity: {status.lastActivity.toLocaleTimeString()}</div>
            )}
          </div>
        )}
        
        {status.error && (
          <div className="mt-2 text-xs text-red-400">
            Error: {status.error}
          </div>
        )}
      </div>

      {/* IRC Configuration */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">IRC Server</label>
            <input
              type="text"
              value={config.server}
              onChange={(e) => handleConfigChange('server', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="irc.libera.chat"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="6667"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bot Nickname</label>
            <input
              type="text"
              value={config.nickname}
              onChange={(e) => handleConfigChange('nickname', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="StationV-Export"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Real Name</label>
            <input
              type="text"
              value={config.realname}
              onChange={(e) => handleConfigChange('realname', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Station V IRC Export"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Target Channel</label>
          <input
            type="text"
            value={config.channel}
            onChange={(e) => handleConfigChange('channel', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#station-v-export"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.ssl}
              onChange={(e) => handleConfigChange('ssl', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-300">Use SSL</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        {!status.connected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              '🚀 Start IRC Export'
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isDisconnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Disconnecting...
              </>
            ) : (
              '🛑 Stop IRC Export'
            )}
          </button>
        )}
      </div>

      {/* Usage Instructions */}
      {status.connected && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md">
          <h4 className="text-sm font-medium text-blue-300 mb-2">📋 How to use:</h4>
          <ol className="text-xs text-blue-200 space-y-1">
            <li>1. Share the channel <code className="bg-blue-800 px-1 rounded">{status.channel}</code> with your friends</li>
            <li>2. Your AI personalities will appear as real IRC users</li>
            <li>3. Friends can chat with them normally in IRC</li>
            <li>4. Messages flow both ways between Station V and IRC</li>
          </ol>
        </div>
      )}
    </div>
  );
};
