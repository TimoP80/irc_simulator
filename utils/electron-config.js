import { spawn } from 'child_process';
import os from 'os';

// Cross-platform build configuration
export const buildConfig = {
  platforms: {
    win32: {
      name: 'Windows',
      targets: ['nsis', 'portable'],
      arch: ['x64', 'ia32'],
      icon: 'favicon.ico'
    },
    darwin: {
      name: 'macOS',
      targets: ['dmg', 'zip'],
      arch: ['x64', 'arm64'],
      icon: 'favicon.ico'
    },
    linux: {
      name: 'Linux',
      targets: ['AppImage', 'deb', 'rpm'],
      arch: ['x64'],
      icon: 'favicon.ico'
    }
  },
  
  // Get current platform configuration
  getCurrentPlatform() {
    const platform = process.platform;
    return this.platforms[platform] || null;
  },
  
  // Get all supported platforms
  getAllPlatforms() {
    return Object.keys(this.platforms);
  },
  
  // Check if platform is supported
  isPlatformSupported(platform) {
    return platform in this.platforms;
  }
};

// Cross-platform path utilities
export const pathUtils = {
  // Get resource path for current platform
  getResourcePath(relativePath) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      return `${process.resourcesPath}/${relativePath}`;
    } else {
      return `../${relativePath}`;
    }
  },
  
  // Get server path
  getServerPath() {
    return this.getResourcePath('server/station-v-server-simple.js');
  },
  
  // Get server directory
  getServerDir() {
    return this.getResourcePath('server');
  }
};

// Platform-specific optimizations
export const platformOptimizations = {
  // Get window options for current platform
  getWindowOptions() {
    const platform = process.platform;
    const baseOptions = {
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      show: false
    };
    
    switch (platform) {
      case 'win32':
        return {
          ...baseOptions,
          titleBarStyle: 'default',
          autoHideMenuBar: true
        };
      case 'darwin':
        return {
          ...baseOptions,
          titleBarStyle: 'hiddenInset'
        };
      case 'linux':
        return {
          ...baseOptions,
          titleBarStyle: 'default'
        };
      default:
        return baseOptions;
    }
  },
  
  // Get menu template for current platform
  getMenuTemplate() {
    const platform = process.platform;
    const isMac = platform === 'darwin';
    
    return [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Channel',
            accelerator: isMac ? 'Cmd+N' : 'Ctrl+N',
            click: () => {
              // Handle new channel
            }
          },
          {
            label: 'Add User',
            accelerator: isMac ? 'Cmd+U' : 'Ctrl+U',
            click: () => {
              // Handle add user
            }
          },
          { type: 'separator' },
          {
            label: 'Settings',
            accelerator: isMac ? 'Cmd+,' : 'Ctrl+,',
            click: () => {
              // Handle settings
            }
          },
          { type: 'separator' },
          {
            label: isMac ? 'Quit' : 'Exit',
            accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              // Handle quit
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
              // Handle about
            }
          }
        ]
      }
    ];
  }
};

// Build utilities
export const buildUtils = {
  // Run command with platform-specific handling
  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  },
  
  // Get build command for platform
  getBuildCommand(platform) {
    switch (platform) {
      case 'win32':
        return ['electron-builder', '--win'];
      case 'darwin':
        return ['electron-builder', '--mac'];
      case 'linux':
        return ['electron-builder', '--linux'];
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
};

export default {
  buildConfig,
  pathUtils,
  platformOptimizations,
  buildUtils
};
