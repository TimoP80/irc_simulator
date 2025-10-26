import { contextBridge, ipcRenderer } from 'electron';

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
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getAppName: () => Promise<string>;
      onMenuNewChannel: (callback: () => void) => void;
      onMenuAddUser: (callback: () => void) => void;
      onMenuSettings: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
