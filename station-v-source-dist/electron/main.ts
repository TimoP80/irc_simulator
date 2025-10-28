// --- Unconditional debug logging for packaging and path resolution ---
// (uses ES import for join)
const isPackagedEarly = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
const execPathEarly = typeof process !== 'undefined' ? process.execPath : 'undefined';
let exeDirEarly = 'undefined';
let nodeExeWinEarly = 'undefined';
try {
  // join is imported below, so this works after the import
  // @ts-ignore
  exeDirEarly = typeof process !== 'undefined' && typeof join !== 'undefined' ? join(execPathEarly, '..') : 'undefined';
  // @ts-ignore
  nodeExeWinEarly = typeof process !== 'undefined' && typeof join !== 'undefined' ? join(exeDirEarly, 'node.exe') : 'undefined';
} catch (e) {}
console.log(`[EARLY DEBUG] isPackaged: ${isPackagedEarly}`);
console.log(`[EARLY DEBUG] process.execPath: ${execPathEarly}`);
console.log(`[EARLY DEBUG] exeDir: ${exeDirEarly}`);
console.log(`[EARLY DEBUG] nodeExeWin: ${nodeExeWinEarly}`);
// --- End unconditional debug logging ---
import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { spawn } from 'child_process';
import process from 'process';
import { existsSync, writeFileSync, appendFileSync } from 'fs';

// Check if we're in a packaged app more safely
const isPackaged = app && app.isPackaged ? app.isPackaged : false;
const isDev = !isPackaged;
const isProd = isPackaged;

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
  // In packaged app, don't exit on uncaught exception - try to continue
  if (isPackaged) {
    logInfo('Packaged app - continuing after uncaught exception');
  } else {
    // In development, exit on uncaught exception
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection:', reason);
  // In packaged app, don't exit on unhandled rejection
  if (!isPackaged) {
    process.exit(1);
  }
});

// Get the correct path for resources
function getResourcePath(relativePath: string): string {
  if (isPackaged) {
    // Special case: for server files, always resolve to unpacked resources directory
    if (relativePath.startsWith('server/')) {
      // process.resourcesPath points to the unpacked resources dir
      return join(process.resourcesPath, relativePath);
    }
    // All other resources (icons, HTML, etc) can use app.getAppPath()
    return join(app.getAppPath(), relativePath);
  } else {
    // In development, use the project root
    return join(__dirname, '..', relativePath);
  }
}

// Ensure correct working directory for ICU data access
function ensureCorrectWorkingDirectory(): void {
  if (isPackaged) {
    // In packaged app with ASAR, the executable is in win-unpacked directory
    // ICU files are in the same directory as the executable
    const exeDir = join(process.execPath, '..');
    logInfo(`Packaged app - executable directory: ${exeDir}`);
    logInfo(`Packaged app - current working directory: ${process.cwd()}`);
    logInfo(`Packaged app - resources path: ${process.resourcesPath}`);

    // For packaged apps, ensure we're in the executable's directory
    // This is where ICU data files are located
    if (process.cwd() !== exeDir) {
      try {
        process.chdir(exeDir);
        logInfo(`Packaged app - working directory set to executable directory: ${process.cwd()}`);
      } catch (error) {
        logError(`Failed to set working directory to executable directory ${exeDir}:`, error);
        // Continue with current working directory
      }
    } else {
      logInfo(`Packaged app - already in correct working directory: ${process.cwd()}`);
    }
  } else {
    // For unpacked builds, we need to be in the win-unpacked directory
    if (process.cwd().includes('win-unpacked')) {
      // We're already in the correct directory for unpacked builds
      logInfo(`Unpacked build - using current working directory: ${process.cwd()}`);
    } else {
      // In development, set working directory to project root
      const targetDir = join(__dirname, '..');
      logInfo(`Setting working directory to: ${targetDir}`);
      try {
        process.chdir(targetDir);
        logInfo(`Working directory set successfully to: ${process.cwd()}`);
      } catch (error) {
        logError(`Failed to set working directory to ${targetDir}:`, error);
        // Continue with current working directory
      }
    }
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
        webSecurity: true,
        backgroundThrottling: false
      },
      icon: getResourcePath('favicon.ico'),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false, // Don't show until ready
      autoHideMenuBar: process.platform === 'win32', // Hide menu bar on Windows for cleaner look
      backgroundColor: '#1a1a1a', // Dark background to prevent white flash
      paintWhenInitiallyHidden: true // Render while hidden to speed up show
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
        // Try multiple possible paths for the HTML file
        const possiblePaths = [
          join(__dirname, '..', 'dist', 'index-electron.html'),
          join(process.cwd(), 'dist', 'index-electron.html'),
          join(process.resourcesPath, 'app', 'dist', 'index-electron.html')
        ];
        
        let htmlPath = '';
        for (const path of possiblePaths) {
          logInfo(`Checking HTML path: ${path}`);
          if (existsSync(path)) {
            htmlPath = path;
            break;
          }
        }
        
        if (htmlPath) {
          logInfo(`HTML file path: ${htmlPath}`);
          mainWindow.loadFile(htmlPath);
          logInfo('Production HTML file loaded successfully');
        } else {
          logError(`HTML file not found in any of the expected locations`);
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

  // Monitor renderer process status with improved handling
  let lastPing = Date.now();
  let freezeCount = 0;
  let pingInterval: NodeJS.Timeout;

  // Function to start ping monitoring
  const startPingMonitoring = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }

    pingInterval = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        clearInterval(pingInterval);
        return;
      }

      try {
        mainWindow.webContents.send('ping');
        // If no ping response for 30 seconds, consider UI frozen (increased timeout)
        if (Date.now() - lastPing > 30000) {
          freezeCount++;
          logError(`UI appears to be frozen (attempt ${freezeCount}), attempting recovery...`);

          try {
            if (freezeCount === 1) {
              // First attempt: Try garbage collection and memory cleanup
              if (global.gc) {
                global.gc();
              }
              mainWindow.webContents.send('gc-request');
              logInfo('Sent garbage collection request to renderer');
            } else if (freezeCount === 2) {
              // Second attempt: Soft reload
              logInfo('Attempting soft reload...');
              mainWindow.webContents.reload();
            } else if (freezeCount === 3) {
              // Third attempt: Hard reload with cache clearing
              logInfo('Attempting hard reload with cache clearing...');
              mainWindow.webContents.reloadIgnoringCache();
            } else if (freezeCount >= 4 && freezeCount <= 6) {
              // Multiple attempts: Try to recover by sending recovery signal
              logInfo('Sending recovery signal to renderer...');
              mainWindow.webContents.send('recover-ui');
            } else if (freezeCount > 6) {
              // Final attempt: Recreate window after multiple failures
              logError('Multiple recovery attempts failed, recreating window...');
              const bounds = mainWindow.getBounds();
              mainWindow.destroy();
              createWindow();
              if (mainWindow) {
                mainWindow.setBounds(bounds);
              }
              freezeCount = 0;
              return; // Exit early after recreation
            }
          } catch (error) {
            logError('Failed to recover from frozen UI:', error);
          }
        }
      } catch (error) {
        logError('Error during ping monitoring:', error);
      }
    }, 10000); // Check every 10 seconds (less frequent)
  };

  // Start ping monitoring
  startPingMonitoring();

  // Reset freeze count on successful ping
  ipcMain.on('pong', () => {
    lastPing = Date.now();
    if (freezeCount > 0) {
      logInfo('UI recovered from freeze');
      freezeCount = 0;
    }
  });

  // Handle recovery confirmation from renderer
  ipcMain.on('recovery-complete', () => {
    logInfo('Renderer confirmed recovery from freeze');
    lastPing = Date.now();
    freezeCount = 0;
  });

  // Handle renderer freeze detection
  ipcMain.on('renderer-frozen', () => {
    logError('Renderer reported frozen state');
    lastPing = Date.now() - 35000; // Force recovery attempt
  });

  // Add diagnostic logging for window state changes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    logError(`Render process gone: ${details.reason}, exitCode: ${details.exitCode}`);
  });

  mainWindow.webContents.on('unresponsive', () => {
    logError('Renderer process became unresponsive');
  });

  mainWindow.webContents.on('responsive', () => {
    logInfo('Renderer process became responsive again');
  });

  // Handle renderer process errors
  ipcMain.on('renderer-error', (event, error) => {
    logError('Renderer process error:', error);
    // If critical error, try to reload
    if (error.message && (error.message.includes('blank') || error.message.includes('frozen') || error.message.includes('crash'))) {
      try {
        logInfo('Attempting to reload after renderer error...');
        mainWindow?.webContents.reload();
      } catch (reloadError) {
        logError('Failed to reload after renderer error:', reloadError);
        // Try hard reload as fallback
        try {
          mainWindow?.webContents.reloadIgnoringCache();
        } catch (hardReloadError) {
          logError('Failed hard reload after renderer error:', hardReloadError);
        }
      }
    }
  });

  // Handle channel log update issues
  ipcMain.on('channel-log-update-failed', (event, data) => {
    logError('Channel log update failed:', data);
    // Send recovery signal to renderer
    mainWindow?.webContents.send('recover-channel-logs');
  });

  // Handle UI freeze detection from renderer
  ipcMain.on('ui-frozen', (event, data) => {
    logError('UI freeze detected by renderer:', data);
    // Force recovery attempt
    lastPing = Date.now() - 35000;
  });

  // Handle memory pressure warnings
  ipcMain.on('memory-pressure', (event, data) => {
    logInfo(`Memory pressure detected: ${JSON.stringify(data)}`);
    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
      mainWindow?.webContents.send('gc-completed');
    }
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
    // If it's a critical load failure, try to recover
    if (errorCode === -2 || errorCode === -6) { // ERR_FAILED or ERR_FILE_NOT_FOUND
      logInfo('Critical load failure detected, attempting recovery...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reload();
        }
      }, 2000);
    }
  });

  // Handle crashed renderer process
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    logError(`Renderer process crashed: ${details.reason}, exitCode: ${details.exitCode}`);
    // Attempt to recover from renderer crash
    if (details.reason === 'crashed' || details.reason === 'killed') {
      logInfo('Attempting to recover from renderer crash...');
      setTimeout(() => {
        if (mainWindow && mainWindow.isDestroyed()) {
          createWindow();
        } else if (mainWindow) {
          mainWindow.webContents.reload();
        }
      }, 1000);
    }
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
  
  // Try different ports if 8080 is busy
  const ports = [8080, 8081, 8082, 8083];
  let serverStarted = false;
  

  // Unconditional debug logging for path resolution
  logInfo(`[DEBUG] isPackaged: ${isPackaged}`);
  logInfo(`[DEBUG] process.execPath: ${process.execPath}`);
  const exeDir = join(process.execPath, '..');
  logInfo(`[DEBUG] exeDir: ${exeDir}`);
  const nodeExeWin = join(exeDir, 'node.exe');
  logInfo(`[DEBUG] nodeExeWin: ${nodeExeWin}`);
  let nodeExec = process.execPath;
  if (isPackaged) {
    if (existsSync(nodeExeWin)) {
      nodeExec = nodeExeWin;
      logInfo(`Using node.exe for server: ${nodeExec}`);
    } else {
      const errorMsg = `Could not find node.exe for server process. Please ensure node.exe is present in: ${exeDir}`;
      logError(errorMsg);
      if (mainWindow) {
        dialog.showErrorBox('Station V Startup Error', errorMsg + '\n\nThe app cannot start the server without node.exe.');
      }
      return;
    }
  }

  for (const port of ports) {
    try {
      serverProcess = spawn(nodeExec, [serverPath, port.toString()], {
        stdio: 'pipe',
        cwd: serverDir,
        env: {
          ...process.env,
          NODE_ENV: isPackaged ? 'production' : 'development',
          PORT: port.toString()
        }
      });
      
      serverProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString().trim();
        logInfo(`Server stdout: ${output}`);
        // Check if server started successfully
        if (output.includes('Station V Server started')) {
          serverStarted = true;
        }
      });

      serverProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString().trim();
        logError(`Server stderr: ${error}`);
        // If port is in use, try next port
        if (error.includes('EADDRINUSE')) {
          logInfo(`Port ${port} is busy, trying next port...`);
          serverProcess = null;
        }
      });

      serverProcess.on('close', (code: number) => {
        logInfo(`Server process exited with code ${code}`);
        serverProcess = null;
      });

      // Give the server a moment to start
      setTimeout(() => {
        if (serverStarted) {
          logInfo(`Server started successfully on port ${port}`);
        } else if (serverProcess && !serverStarted) {
          logInfo(`Server failed to start on port ${port}, trying next port...`);
          serverProcess.kill();
          serverProcess = null;
        }
      }, 1000);
      
      break; // Exit the loop after starting the server
    } catch (error) {
      logError(`Failed to start server on port ${port}:`, error);
      continue;
    }
  }

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
logInfo(`App packaged: ${isPackaged}`);
logInfo(`App path: ${app.getAppPath()}`);
logInfo(`User data path: ${app.getPath('userData')}`);
logInfo(`Executable path: ${process.execPath}`);
logInfo(`Resources path: ${process.resourcesPath}`);

// Ensure correct working directory for ICU data access
ensureCorrectWorkingDirectory();

// Configure Electron before app is ready
if (app && app.commandLine) {
  if (process.platform === 'win32') {
    // Windows-specific optimizations
    app.commandLine.appendSwitch('--enable-gpu-rasterization');
    app.commandLine.appendSwitch('--enable-zero-copy');
    app.commandLine.appendSwitch('--ignore-gpu-blocklist');
    app.commandLine.appendSwitch('--enable-hardware-overlays', 'single-fullscreen');
  } else {
    // Other platforms
    app.commandLine.appendSwitch('--disable-gpu-sandbox');
  }

  // Security settings
  app.commandLine.appendSwitch('--no-sandbox');
  app.commandLine.appendSwitch('--disable-web-security');
  app.commandLine.appendSwitch('--ignore-certificate-errors');
}

// App event handlers
app.whenReady().then(async () => {
  try {
    logInfo('Electron app ready');
    logInfo(`Log file location: ${logFilePath}`);

    // Add delay for packaged apps to ensure stability
    if (isPackaged) {
      logInfo('Packaged app - adding startup delay...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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
