import React, { useState, useEffect, useRef } from 'react';
import { getDebugConfig, updateDebugConfig } from '../utils/debugLogger';

interface DebugLogWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DebugLogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
}

export const DebugLogWindow: React.FC<DebugLogWindowProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxLogs, setMaxLogs] = useState(1000);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [debugConfig, setDebugConfig] = useState(getDebugConfig());
  const logQueueRef = useRef<DebugLogEntry[]>([]);
  const originalConsoleRef = useRef<{
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  } | null>(null);

  // Process queued logs to avoid setState during render
  useEffect(() => {
    if (logQueueRef.current.length > 0) {
      const newLogs = [...logQueueRef.current];
      logQueueRef.current = [];
      
      setLogs(prev => {
        const combined = [...prev, ...newLogs];
        return combined.slice(-maxLogs); // Keep only the last maxLogs entries
      });
    }
  }, [maxLogs]);

  // Capture console logs using a more React-friendly approach
  useEffect(() => {
    if (!isOpen) return;

    // Store original console methods
    originalConsoleRef.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };

    const captureLog = (level: 'debug' | 'info' | 'warn' | 'error', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Extract category from message (e.g., "[AI Debug]" -> "AI")
      const categoryMatch = message.match(/^\[([^\]]+)\]/);
      const category = categoryMatch ? categoryMatch[1] : 'General';

      const logEntry: DebugLogEntry = {
        id: Date.now() + Math.random().toString(36),
        timestamp: new Date(),
        level,
        category,
        message: message.replace(/^\[[^\]]+\]\s*/, ''), // Remove category prefix
        data: args.length > 1 ? args.slice(1) : undefined
      };

      // Queue the log instead of calling setState directly
      logQueueRef.current.push(logEntry);
    };

    // Override console methods with proper async handling
    console.log = (...args) => {
      originalConsoleRef.current?.log(...args);
      captureLog('info', args);
    };

    console.warn = (...args) => {
      originalConsoleRef.current?.warn(...args);
      captureLog('warn', args);
    };

    console.error = (...args) => {
      originalConsoleRef.current?.error(...args);
      captureLog('error', args);
    };

    console.info = (...args) => {
      originalConsoleRef.current?.info(...args);
      captureLog('info', args);
    };

    console.debug = (...args) => {
      originalConsoleRef.current?.debug(...args);
      captureLog('debug', args);
    };

    return () => {
      // Restore original console methods
      if (originalConsoleRef.current) {
        console.log = originalConsoleRef.current.log;
        console.warn = originalConsoleRef.current.warn;
        console.error = originalConsoleRef.current.error;
        console.info = originalConsoleRef.current.info;
        console.debug = originalConsoleRef.current.debug;
        originalConsoleRef.current = null;
      }
    };
  }, [isOpen, maxLogs]);

  // Process queued logs asynchronously to avoid setState during render
  useEffect(() => {
    const processLogs = () => {
      if (logQueueRef.current.length > 0) {
        const newLogs = [...logQueueRef.current];
        logQueueRef.current = [];
        
        setLogs(prev => {
          const combined = [...prev, ...newLogs];
          return combined.slice(-maxLogs);
        });
      }
    };

    // Process logs on next tick to avoid setState during render
    const timeoutId = setTimeout(processLogs, 0);
    
    return () => clearTimeout(timeoutId);
  }, [maxLogs]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesFilter && matchesLevel && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(logs.map(log => log.category))).sort();

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Export logs
  const exportLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      logs: filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        category: log.category,
        message: log.message,
        data: log.data
      }))
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Debug Log Window</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear
            </button>
            <button
              onClick={exportLogs}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Export
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Search:</label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter messages..."
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Level:</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="all">All</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              >
                <option value="all">All</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Max Logs:</label>
              <input
                type="number"
                value={maxLogs}
                onChange={(e) => setMaxLogs(parseInt(e.target.value) || 1000)}
                min="100"
                max="10000"
                className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm w-20"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Auto-scroll:</label>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No logs to display</div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 p-2 rounded ${
                    log.level === 'error' ? 'bg-red-900/20' :
                    log.level === 'warn' ? 'bg-yellow-900/20' :
                    log.level === 'info' ? 'bg-blue-900/20' :
                    'bg-gray-800/20'
                  }`}
                >
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {log.timestamp.toLocaleTimeString()}
                  </div>
                  <div className={`flex-shrink-0 text-xs font-bold ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    log.level === 'info' ? 'text-blue-400' :
                    'text-green-400'
                  }`}>
                    [{log.level.toUpperCase()}]
                  </div>
                  <div className="flex-shrink-0 text-xs text-purple-400">
                    [{log.category}]
                  </div>
                  <div className="flex-1 text-gray-200 break-words">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="flex-shrink-0">
                      <summary className="text-xs text-gray-400 cursor-pointer">Data</summary>
                      <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 text-sm text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>
    </div>
  );
};
