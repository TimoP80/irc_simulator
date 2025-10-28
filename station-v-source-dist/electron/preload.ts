import { contextBridge, ipcRenderer } from 'electron';

// Error tracking
const logError = (error: Error) => {
  console.error('[Renderer Error]:', error);
  ipcRenderer.send('renderer-error', {
    message: error.message,
    stack: error.stack
  });
};

// Handle uncaught errors in renderer
window.addEventListener('error', (event) => {
  logError(event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason);
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),

  // Menu actions
  onMenuNewChannel: (callback: () => void) => {
    ipcRenderer.on('menu-new-channel', callback);
  },
  onMenuAddUser: (callback: () => void) => {
    ipcRenderer.on('menu-add-user', callback);
  },
  onMenuSettings: (callback: () => void) => {
    ipcRenderer.on('menu-settings', callback);
  },
  onMenuAbout: (callback: () => void) => {
    ipcRenderer.on('menu-about', callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // IPC communication methods
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

