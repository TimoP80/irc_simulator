import electron = require('electron');
import path = require('path');

const { app, BrowserWindow, dialog } = electron;

let mainWindow: electron.BrowserWindow | null;

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
    const filePath = path.join(__dirname, '../index-electron.html');
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
