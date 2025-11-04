import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: Electron.BrowserWindow | null;

// Configuration storage path
const getConfigPath = (): string => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config.json');
};

// Load configuration from file
const loadConfigFromFile = (): any => {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(data);
      console.log('[ElectronMain] Config loaded from file');
      return config;
    }
    console.log('[ElectronMain] No config file found');
    return null;
  } catch (error) {
    console.error('[ElectronMain] Error loading config from file:', error);
    return null;
  }
};

// Save configuration to file
const saveConfigToFile = (config: any): boolean => {
  try {
    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);

    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[ElectronMain] Config saved to file');
    return true;
  } catch (error) {
    console.error('[ElectronMain] Error saving config to file:', error);
    return false;
  }
};

function createWindow() {
  console.log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (!mainWindow) {
    return;
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    const errorMessage = `Failed to load URL: ${validatedURL}\nError Code: ${errorCode}\nDescription: ${errorDescription}`;
    console.error(errorMessage);
    dialog.showErrorBox('Load Error', errorMessage);
  });

  if (app.isPackaged) {
    // In packaged app, __dirname is dist-electron, but index-electron.html is in dist
    const filePath = path.join(__dirname, '..', 'dist', 'index-electron.html');
    console.log(`App is packaged. Loading file: ${filePath}`);
    mainWindow.loadFile(filePath);
  } else {
    console.log('App is in development. Loading URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for configuration syncing
ipcMain.handle('config:save', async (_event, config: any) => {
  try {
    const success = saveConfigToFile(config);
    return { success, error: success ? null : 'Failed to save config' };
  } catch (error) {
    console.error('[ElectronMain] Error in config:save handler:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('config:load', async () => {
  try {
    const config = loadConfigFromFile();
    return config;
  } catch (error) {
    console.error('[ElectronMain] Error in config:load handler:', error);
    return null;
  }
});

ipcMain.on('config:changed', (_event, config: any) => {
  try {
    console.log('[ElectronMain] Config changed notification received');
    saveConfigToFile(config);

    // Broadcast to all windows
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config:updated', config);
    }
  } catch (error) {
    console.error('[ElectronMain] Error handling config:changed:', error);
  }
});

app.whenReady().then(() => {
  console.log('App is ready.');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed. Quitting app.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
