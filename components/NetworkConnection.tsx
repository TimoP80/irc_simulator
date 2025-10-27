import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNetworkService, type NetworkConfig, type NetworkUser } from '../services/networkService';
import { networkDebug } from '../utils/debugLogger';

interface NetworkConnectionProps {
  onConnected: (connected: boolean) => void;
  onUsersUpdate: (users: NetworkUser[]) => void;
}

export const NetworkConnection: React.FC<NetworkConnectionProps> = ({ onConnected, onUsersUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<NetworkConfig>({
    serverHost: 'localhost',
    serverPort: 8080,
    nickname: 'Guest',
    autoJoinChannels: ['#general']
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const networkService = getNetworkService();
  const onConnectedRef = useRef(onConnected);
  const onUsersUpdateRef = useRef(onUsersUpdate);

  // Update refs when props change
  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

  useEffect(() => {
    onUsersUpdateRef.current = onUsersUpdate;
  }, [onUsersUpdate]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    networkDebug.log('Connection status changed:', connected);
    setIsConnected(connected);
    onConnectedRef.current(connected);
  }, []);

  const handleUsersUpdate = useCallback((users: NetworkUser[]) => {
    networkDebug.log('Users updated:', users.length, 'users:', users.map(u => u.nickname));
    onUsersUpdateRef.current(users);
  }, []);

  useEffect(() => {
    // Set up event handlers
    networkService.onConnection(handleConnectionChange);
    networkService.onUsers(handleUsersUpdate);

    // Load saved config
    const savedConfig = localStorage.getItem('station_v_network_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        networkDebug.error('Failed to load network config:', error);
      }
    }

    return () => {
      networkService.offConnection(handleConnectionChange);
      networkService.offUsers(handleUsersUpdate);
    };
  }, [handleConnectionChange, handleUsersUpdate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const success = await networkService.connect(config);
      if (success) {
        // Save config
        localStorage.setItem('station_v_network_config', JSON.stringify(config));
        setShowConfig(false);
      } else {
        setError('Failed to connect to server');
      }
    } catch (error) {
      let errorMessage = 'Connection failed';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout - server not responding. Please ensure the server is running on port ' + config.serverPort;
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused - server is not running on ' + config.serverHost + ':' + config.serverPort;
        } else if (error.message.includes('NetworkError') || error.message.includes('net::ERR')) {
          errorMessage = 'Network error - cannot reach server. Please check if the server is running and accessible.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      networkDebug.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    networkService.disconnect();
  };

  const handleConfigChange = (field: keyof NetworkConfig, value: string | number | string[]) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChannelInput = (value: string) => {
    const channels = value.split(',').map(ch => ch.trim()).filter(ch => ch);
    handleConfigChange('autoJoinChannels', channels);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Network Connection</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {!isConnected && (
        <div className="space-y-4">
          {showConfig ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Server Host
                </label>
                <input
                  type="text"
                  value={config.serverHost}
                  onChange={(e) => handleConfigChange('serverHost', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="localhost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Server Port
                </label>
                <input
                  type="number"
                  value={config.serverPort}
                  onChange={(e) => handleConfigChange('serverPort', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8080"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={config.nickname}
                  onChange={(e) => handleConfigChange('nickname', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="YourNickname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Auto-join Channels (comma-separated)
                </label>
                <input
                  type="text"
                  value={config.autoJoinChannels.join(', ')}
                  onChange={(e) => handleChannelInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#general, #random"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-300">
                Server: {config.serverHost}:{config.serverPort}
              </div>
              <div className="text-sm text-gray-300">
                Nickname: {config.nickname}
              </div>
              <div className="text-sm text-gray-300">
                Channels: {config.autoJoinChannels.join(', ')}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
                <button
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Configure
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isConnected && (
        <div className="space-y-2">
          <div className="text-sm text-gray-300">
            Connected to {config.serverHost}:{config.serverPort}
          </div>
          <div className="text-sm text-gray-300">
            Nickname: {config.nickname}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
