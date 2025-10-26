import { app, BrowserWindow } from 'electron';

// Configure Electron before app is ready
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');

console.log('Starting minimal Electron app...');

app.whenReady().then(() => {
  console.log('App ready');
  
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.loadURL('data:text/html,<h1>Hello Electron!</h1><p>This is a minimal test.</p>');
  
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Page finished loading');
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('Minimal app setup complete');
