# Station V - Electron Desktop Application

This document explains how to develop and build the Station V IRC Simulator as a Windows desktop application using Electron.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Windows 10/11 (for Windows builds)

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

To run the application in development mode with hot reload:

```bash
npm run electron:dev
```

This will:
- Start the IRC server
- Start the Vite development server
- Launch Electron with the React app

### 3. Build for Production

To build the Windows executable:

```bash
npm run electron:build:win
```

This will:
- Build the React application
- Compile the Electron main process
- Package everything into a Windows installer

## Available Scripts

- `npm run electron:dev` - Start development environment
- `npm run electron:build` - Build for current platform
- `npm run electron:build:win` - Build Windows executable
- `npm run electron:dist` - Create distribution packages
- `npm run electron:pack` - Package without installer

## Project Structure

```
├── electron/
│   ├── main.ts          # Main Electron process
│   └── preload.ts       # Preload script for security
├── scripts/
│   ├── dev-electron.js  # Development script
│   └── build-electron.js # Build script
├── dist/                # Built React app
├── dist-electron/       # Compiled Electron files
└── tsconfig.electron.json # TypeScript config for Electron
```

## Features

- **Native Windows Application**: Runs as a desktop app
- **Auto-start Server**: IRC server starts automatically
- **Native Menus**: File, Edit, View, Window, Help menus
- **Security**: Context isolation and secure IPC
- **Auto-updater Ready**: Built with electron-builder

## Building Distribution

The built executable will be in the `dist-electron` folder. The Windows installer will be created as an NSIS installer with:

- Custom installation directory selection
- Desktop shortcut creation
- Start menu shortcut creation
- Uninstaller support

## Troubleshooting

### Development Issues

1. **Port conflicts**: Make sure ports 3000 and 8080 are available
2. **TypeScript errors**: Run `npm run build:electron-main` to compile Electron files
3. **Server not starting**: Check that Node.js is in your PATH

### Build Issues

1. **Missing dependencies**: Run `npm install` to ensure all packages are installed
2. **TypeScript compilation**: Check `tsconfig.electron.json` configuration
3. **Electron Builder**: Ensure you have sufficient disk space for the build

## Security Notes

- The app uses context isolation for security
- Node integration is disabled in renderer process
- External links open in default browser
- Navigation is restricted to localhost/file protocols
