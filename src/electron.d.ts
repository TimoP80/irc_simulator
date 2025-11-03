export interface IElectronAPI {
  toggleDevTools: () => void;
  reload: () => void;
  toggleFullscreen: () => void;
  closeWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  onWindowStateChange: (callback: (state: 'maximized' | 'normal' | 'minimized') => void) => void;
  getVersion: () => string;
  setAlwaysOnTop: (isAlwaysOnTop: boolean) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}