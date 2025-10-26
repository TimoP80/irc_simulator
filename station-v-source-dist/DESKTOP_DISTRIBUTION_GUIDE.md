# Desktop Distribution Guide

## Overview

Station V - Virtual IRC Simulator is now fully compilable to desktop environments using Electron. This guide covers building, testing, and distributing the desktop application.

## Quick Start

### Build Desktop Executable
```bash
# Build Windows executable
npm run electron:build:win

# Create portable distribution
npm run electron:build:portable

# Test the executable
npm run electron:test
```

## Build Process

### 1. Development Build
```bash
# Start development with Electron
npm run electron:dev
```

### 2. Production Build
```bash
# Build complete application
npm run electron:build:win
```

This creates:
- `dist/` - React application build
- `dist-electron/` - Electron main process
- `release/win-unpacked/` - Complete executable package

### 3. Distribution Options

#### ZIP Distribution (Recommended)
```bash
npm run electron:build:portable
```
- Creates `Station-V-Portable.zip` (~138 MB)
- Users extract and run `Station V - Virtual IRC Simulator.exe`
- No installation required
- Fully portable

#### Single Executable Options
```bash
npm run electron:build:single
```
- Creates guides for single executable tools
- Provides instructions for Enigma Virtual Box, BoxedApp Packer, etc.

## Desktop Features

### Native UI Elements
- **Custom Title Bar** - Minimize, maximize, close controls
- **Desktop Menu** - Settings, logs, developer tools
- **Always-Visible Layout** - Sidebar and panels always shown
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+D` - Toggle Developer Tools
  - `Ctrl+R` - Reload application
  - `F11` - Toggle fullscreen
  - `Alt+F4` - Close window

### Configuration
- **Automatic Config Initialization** - Creates default config if none exists
- **Portable Settings** - Settings stored locally with the application
- **Fallback System** - Graceful handling of missing dependencies

## File Structure

```
Station V - Virtual IRC Simulator/
├── Station V - Virtual IRC Simulator.exe    # Main executable
├── resources/
│   └── app/
│       ├── dist/                            # React application
│       ├── dist-electron/                   # Electron main process
│       ├── server/                          # WebSocket server
│       └── default-config.json              # Default configuration
├── icudtl.dat                               # ICU data
├── chrome_100_percent.pak                   # Chrome resources
├── chrome_200_percent.pak
├── resources.pak
└── snapshot_blob.bin
```

## Distribution Methods

### 1. ZIP Distribution (Current)
- **File**: `Station-V-Portable.zip`
- **Size**: ~138 MB
- **Usage**: Extract anywhere, run executable
- **Benefits**: No installation, fully portable

### 2. Single Executable Tools

#### Enigma Virtual Box (Free)
- Creates virtual file system
- Single executable file
- No extraction needed
- Download: https://enigmaprotector.com/

#### BoxedApp Packer (Commercial)
- Professional single executable
- Designed for Electron apps
- High-quality results
- Website: https://www.boxedapp.com/

#### VMProtect (Commercial)
- Packed and protected executable
- Single file distribution
- Website: https://vmpsoft.com/

## Troubleshooting

### Build Issues
```bash
# Clean build artifacts
npm run electron:clean

# Troubleshoot Windows build
npm run troubleshoot

# Test executable
npm run electron:test
```

### Common Issues
1. **Missing Files**: Ensure `npm run build` completes successfully
2. **Permission Errors**: Run as administrator if needed
3. **Port Conflicts**: Check if ports 8080-8083 are available

### File Verification
The build process creates these essential files:
- `dist-electron/main.cjs` - Electron main process
- `dist/index-electron.html` - Application entry point
- `default-config.json` - Default configuration
- `server/` - WebSocket server files

## Development Notes

### Scripts Available
- `electron:build:win` - Build Windows executable
- `electron:build:portable` - Create ZIP distribution
- `electron:build:single` - Create single exe guides
- `electron:test` - Test built executable
- `electron:clean` - Clean build artifacts

### Configuration Files
- `package-electron.json` - Electron Builder configuration
- `tsconfig.electron.json` - TypeScript config for Electron
- `vite.config.ts` - Vite build configuration

## Success Indicators

✅ **Build Success**:
- `release/win-unpacked/` directory created
- `Station V - Virtual IRC Simulator.exe` present
- Application starts without errors
- UI displays correctly with embedded CSS

✅ **Distribution Success**:
- ZIP file created (~138 MB)
- Executable runs on target machine
- All features functional
- No external dependencies required

## Future Enhancements

1. **Code Signing** - Add digital signatures for security
2. **Auto-Updater** - Implement automatic update system
3. **Installer Creation** - Resolve Windows permissions for NSIS
4. **Cross-Platform Builds** - macOS and Linux executables
5. **Performance Optimization** - Reduce executable size

## Support

For issues with desktop builds:
1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Ensure Node.js and npm are up to date
4. Check Windows permissions for build tools

The desktop application provides a complete, standalone experience with all the features of the web version plus native desktop capabilities.
