# Test Wrapper Setup - Complete Guide

## Overview

A lightweight exe wrapper has been added to the Station V IRC Simulator project to make testing easier. This wrapper provides simple commands to run common development and testing tasks.

## What Was Added

### 1. **Core Wrapper Script**
- **File**: `scripts/test-wrapper.js`
- **Purpose**: Main Node.js script that provides CLI commands
- **Features**:
  - Colored console output
  - Progress indicators
  - Error handling
  - 5 main commands: dev, electron, build, package, test

### 2. **Build Script**
- **File**: `scripts/build-test-wrapper.js`
- **Purpose**: Packages the wrapper as a standalone exe using `pkg`
- **Output**: `dist-wrapper/station-v-test.exe`

### 3. **Wrapper Launchers**
- **Batch File**: `test-wrapper.bat` - For Windows Command Prompt
- **PowerShell**: `test-wrapper.ps1` - For Windows PowerShell
- **Both**: Provide easy access to wrapper commands

### 4. **Documentation**
- **TEST_WRAPPER_README.md** - Detailed wrapper documentation
- **QUICK_TEST_GUIDE.md** - Quick start guide for testing
- **TEST_WRAPPER_SETUP.md** - This file

### 5. **NPM Scripts**
Added to `package.json`:
```json
"test:wrapper": "node scripts/test-wrapper.js",
"build:wrapper": "node scripts/build-test-wrapper.js"
```

## Quick Start

### Option 1: Using npm (Recommended for Development)

```bash
# Start development servers
npm run test:wrapper dev

# Start Electron
npm run test:wrapper electron

# Build application
npm run test:wrapper build

# Package as exe
npm run test:wrapper package

# Run tests
npm run test:wrapper test
```

### Option 2: Using Batch File (Windows)

```bash
# Show help
test-wrapper.bat help

# Start development
test-wrapper.bat dev

# Start Electron
test-wrapper.bat electron
```

### Option 3: Using PowerShell

```powershell
# Show help
.\test-wrapper.ps1 help

# Start development
.\test-wrapper.ps1 dev

# Start Electron
.\test-wrapper.ps1 electron
```

### Option 4: Using Standalone Exe (No Node.js Required)

```bash
# First, build the exe
npm run build:wrapper

# Then use it
dist-wrapper/station-v-test.exe dev
dist-wrapper/station-v-test.exe electron
dist-wrapper/station-v-test.exe build
```

## Available Commands

### `dev`
Starts development servers:
- WebSocket server on port 8081
- Vite dev server on port 3000
- Open http://localhost:3000 in browser

### `electron`
Starts Electron development:
- Builds the application
- Launches Electron with hot reload
- Opens developer tools

### `build`
Builds for production:
- Compiles TypeScript
- Bundles with Vite
- Creates optimized dist/ directory

### `package`
Creates Windows executable:
- Builds application
- Packages with electron-builder
- Creates installer and portable exe in release/

### `test`
Runs automated tests:
- Verifies executable works
- Checks startup and basic functionality

### `help`
Shows help message with all commands

## File Structure

```
project-root/
├── scripts/
│   ├── test-wrapper.js           # Main wrapper script
│   └── build-test-wrapper.js     # Build script for exe
├── test-wrapper.bat              # Windows batch launcher
├── test-wrapper.ps1              # PowerShell launcher
├── TEST_WRAPPER_README.md        # Detailed documentation
├── QUICK_TEST_GUIDE.md           # Quick start guide
├── TEST_WRAPPER_SETUP.md         # This file
└── dist-wrapper/                 # Output directory (created by build)
    └── station-v-test.exe        # Standalone executable
```

## Building the Standalone Exe

To create a standalone executable that doesn't require Node.js:

```bash
npm run build:wrapper
```

This:
1. Checks for `pkg` (installs if needed)
2. Compiles the wrapper script
3. Creates `dist-wrapper/station-v-test.exe`
4. Compresses with Brotli for smaller file size

The resulting exe can be:
- Distributed to testers
- Run on any Windows machine
- Used in CI/CD pipelines
- Packaged with installers

## Usage Examples

### Development Workflow

```bash
# 1. Start dev servers
npm run test:wrapper dev

# 2. Open http://localhost:3000
# 3. Make changes to code
# 4. Changes auto-reload in browser
# 5. Press Ctrl+C to stop
```

### Testing Workflow

```bash
# 1. Build the application
npm run test:wrapper build

# 2. Run tests
npm run test:wrapper test

# 3. Check console output for results
```

### Distribution Workflow

```bash
# 1. Build the wrapper exe
npm run build:wrapper

# 2. Distribute dist-wrapper/station-v-test.exe to testers

# 3. Testers can run:
station-v-test.exe dev
station-v-test.exe electron
station-v-test.exe build
```

## Troubleshooting

### "npm: command not found"
Install Node.js from https://nodejs.org/

### "Port 3000 already in use"
```bash
# Kill the process using the port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "pkg not found"
The build script will automatically install it:
```bash
npm run build:wrapper
```

### Batch file won't run
Make sure you're in the project root directory:
```bash
cd c:\path\to\project
test-wrapper.bat dev
```

### PowerShell execution policy error
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Integration with CI/CD

The wrapper can be used in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Build with wrapper
  run: npm run test:wrapper build

- name: Package with wrapper
  run: npm run test:wrapper package

- name: Test with wrapper
  run: npm run test:wrapper test
```

## Extending the Wrapper

To add new commands:

1. Add a new async function in `scripts/test-wrapper.js`:
```javascript
async function cmdMyCommand() {
  logSection('My Command');
  try {
    await runCommand('npm', ['run', 'my-script']);
  } catch (error) {
    log(`Failed: ${error.message}`, 'red');
    process.exit(1);
  }
}
```

2. Add a case in the switch statement:
```javascript
case 'mycommand':
  await cmdMyCommand();
  break;
```

3. Update the help text in `showHelp()`

4. Rebuild the exe:
```bash
npm run build:wrapper
```

## Performance

- **Wrapper startup**: < 100ms
- **Dev server startup**: ~3-5 seconds
- **Electron startup**: ~5-10 seconds
- **Build time**: ~30-60 seconds
- **Package time**: ~2-5 minutes

## Support

For issues or questions:
1. Check `TEST_WRAPPER_README.md` for detailed docs
2. Check `QUICK_TEST_GUIDE.md` for common tasks
3. Review `scripts/test-wrapper.js` for implementation
4. Check project README for general help

## Summary

The test wrapper provides:
✅ Simple commands for common tasks
✅ Colored output for better readability
✅ Standalone exe for easy distribution
✅ Works with npm, batch, PowerShell, and exe
✅ Easy to extend with new commands
✅ No external dependencies required

Happy testing! 🚀

