import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import { join } from 'path';
import { spawn } from 'child_process';
import { existsSync, writeFileSync, appendFileSync } from 'fs';

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

let mainWindow: BrowserWindow | null = null;
let serverProcess: any = null;

// Create log file path
const logFilePath = join(process.cwd(), 'station-v-debug.log');

// Enhanced error handling and logging
function logError(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [ERROR] ${message}`;
  console.error(logMessage);
  if (error) {
    console.error(`[ERROR] Details:`, error);
  }
  
  // Write to log file
  try {
    appendFileSync(logFilePath, logMessage + '\n');
    if (error) {
      appendFileSync(logFilePath, `[ERROR] Details: ${JSON.stringify(error)}\n`);
    }
  } catch (writeError) {
    console.error('Failed to write to log file:', writeError);
  }
}

function logInfo(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [INFO] ${message}`;
  console.log(logMessage);
  
  // Write to log file
  try {
    appendFileSync(logFilePath, logMessage + '\n');
  } catch (writeError) {
    console.error('Failed to write to log file:', writeError);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
  // Don't exit immediately, try to show error dialog
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection:', reason);
});

// Get the correct path for resources
function getResourcePath(relativePath: string): string {
  if (isProd) {
    // In production, resources are in the app.asar.unpacked directory
    return join(process.resourcesPath, relativePath);
  } else {
    // In development, use the project root
    return join(__dirname, '..', relativePath);
  }
}

// Ensure correct working directory for ICU data access
function ensureCorrectWorkingDirectory(): void {
  if (isProd) {
    // In production, set working directory to the executable directory
    const executableDir = process.resourcesPath.replace('resources', '');
    logInfo(`Setting working directory to: ${executableDir}`);
    process.chdir(executableDir);
  } else {
    // In development, ensure we're in the project root
    const projectRoot = join(__dirname, '..');
    logInfo(`Setting working directory to: ${projectRoot}`);
    process.chdir(projectRoot);
  }
}

// Create the main application window
function createWindow(): void {
  try {
    logInfo('Creating main window...');
    
    // Check if preload file exists
    let preloadPath: string | undefined = join(__dirname, 'preload.js');
    if (!existsSync(preloadPath)) {
      logError(`Preload file not found: ${preloadPath}`);
      // Try alternative path
      const altPreloadPath = join(__dirname, 'preload.cjs');
      if (existsSync(altPreloadPath)) {
        logInfo(`Using alternative preload path: ${altPreloadPath}`);
        preloadPath = altPreloadPath;
      } else {
        logError('No preload file found, continuing without preload');
        preloadPath = undefined;
      }
    }

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
        webSecurity: true
      },
      icon: getResourcePath('favicon.ico'),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false, // Don't show until ready
      autoHideMenuBar: process.platform === 'win32' // Hide menu bar on Windows for cleaner look
    });
    
    logInfo('Main window created successfully');
  } catch (error) {
    logError('Failed to create main window:', error);
    throw error;
  }

  // Load the application
  try {
    if (isDev) {
      logInfo('Loading development URL: http://localhost:3000');
      mainWindow.loadURL('http://localhost:3000');
      // Open DevTools in development
      mainWindow.webContents.openDevTools();
    } else {
      // In production, load the built HTML file
      logInfo('Loading production HTML file');
      try {
        const htmlPath = join(__dirname, '..', 'dist', 'index-electron.html');
        logInfo(`HTML file path: ${htmlPath}`);
        
        if (existsSync(htmlPath)) {
          mainWindow.loadFile(htmlPath);
          logInfo('Production HTML file loaded successfully');
        } else {
          logError(`HTML file not found: ${htmlPath}`);
          // Fallback to test page
          mainWindow.loadURL('data:text/html,<h1>Station V - Virtual IRC Simulator</h1><p>HTML file not found. Please rebuild the application.</p>');
        }
      } catch (error) {
        logError('Failed to load production HTML:', error);
        // Try to show error page
        mainWindow.loadURL('data:text/html,<h1>Error Loading Application</h1><p>An error occurred while loading the application.</p>');
      }
    }
  } catch (error) {
    logError('Failed to load application:', error);
    // Try to show error page
    try {
      mainWindow.loadURL('data:text/html,<h1>Error Loading Application</h1><p>An error occurred while loading the application.</p>');
    } catch (loadError) {
      logError('Failed to load error page:', loadError);
    }
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    logInfo('Window ready to show');
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    logInfo('Main window closed');
    mainWindow = null;
  });

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logError(`Failed to load: ${validatedURL}`);
    logError(`Error: ${errorCode} - ${errorDescription}`);
    
    // If it's a network error (external resource), try to continue
    if (errorCode === -2) { // ERR_FAILED
      logInfo('Network error detected, continuing with local resources only');
    }
  });

  // Handle external resource loading failures
  mainWindow.webContents.on('did-fail-provisional-load', (event, errorCode, errorDescription, validatedURL) => {
    logError(`Provisional load failed: ${validatedURL}`);
    logError(`Error: ${errorCode} - ${errorDescription}`);
  });

  // Handle DOM ready
  mainWindow.webContents.once('dom-ready', () => {
    logInfo('DOM ready');
  });

  // Handle page loaded
  mainWindow.webContents.once('did-finish-load', () => {
    logInfo('Page finished loading');
  });

  // Block external resource loading
  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    
    // Block external CDN resources
    if (url.includes('cdn.tailwindcss.com') || 
        url.includes('aistudiocdn.com') ||
        url.includes('unpkg.com') ||
        url.includes('cdnjs.cloudflare.com')) {
      console.log('Blocking external resource:', url);
      callback({ cancel: true });
      return;
    }
    
    callback({});
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// Start the IRC server process
function startServer(): void {
  if (serverProcess) {
    return; // Server already running
  }

  const serverPath = getResourcePath('server/station-v-server-simple.js');
  const serverDir = getResourcePath('server');

  logInfo(`Starting server from: ${serverPath}`);
  logInfo(`Server directory: ${serverDir}`);
  
  // Check if server file exists
  if (!existsSync(serverPath)) {
    logError(`Server file not found: ${serverPath}`);
    return;
  }
  
  serverProcess = spawn('node', [serverPath], {
    stdio: 'pipe',
    cwd: serverDir,
    env: {
      ...process.env,
      NODE_ENV: isProd ? 'production' : 'development'
    }
  });

  serverProcess.stdout?.on('data', (data: Buffer) => {
    logInfo(`Server stdout: ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data: Buffer) => {
    logError(`Server stderr: ${data.toString().trim()}`);
  });

  serverProcess.on('close', (code: number) => {
    logInfo(`Server process exited with code ${code}`);
    serverProcess = null;
  });

  serverProcess.on('error', (error: Error) => {
    logError('Failed to start server:', error);
    serverProcess = null;
  });
}

// Stop the IRC server process
function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// Create application menu
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Channel',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-channel');
          }
        },
        {
          label: 'Add User',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            mainWindow?.webContents.send('menu-add-user');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Station V',
          click: () => {
            mainWindow?.webContents.send('menu-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize logging
logInfo('Station V - Virtual IRC Simulator starting...');
logInfo(`Process arguments: ${process.argv.join(' ')}`);
logInfo(`Working directory: ${process.cwd()}`);
logInfo(`Node version: ${process.version}`);
logInfo(`Electron version: ${process.versions.electron}`);

// Ensure correct working directory for ICU data access
ensureCorrectWorkingDirectory();

// Configure Electron before app is ready
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--ignore-certificate-errors');
app.commandLine.appendSwitch('--ignore-ssl-errors');
app.commandLine.appendSwitch('--allow-running-insecure-content');

// App event handlers
app.whenReady().then(() => {
  try {
    logInfo('Electron app ready');
    logInfo(`Log file location: ${logFilePath}`);
    
    createWindow();
    createMenu();
    startServer();
    logInfo('Application initialized successfully');
  } catch (error) {
    logError('Failed to initialize application:', error);
    // Try to show error dialog
    app.quit();
  }

  app.on('activate', () => {
    logInfo('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      try {
        createWindow();
      } catch (error) {
        logError('Failed to create window on activate:', error);
      }
    }
  });
});

app.on('window-all-closed', () => {
  logInfo('All windows closed');
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logInfo('App quitting');
  stopServer();
});

// IPC handlers for communication with renderer process
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-name', () => {
  return app.getName();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Handle protocol for deep linking (optional)
app.setAsDefaultProtocolClient('station-v');
