# Quick Test Guide - Station V IRC Simulator

This guide shows you how to quickly test the Station V IRC Simulator using the new lightweight test wrapper.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Repository cloned and dependencies installed (`npm install`)

## Option 1: Using npm scripts (Recommended for Development)

### Start Development Servers

```bash
npm run test:wrapper dev
```

This starts:
- **WebSocket Server**: http://localhost:8081
- **Web UI**: http://localhost:3000

Open your browser to `http://localhost:3000` to test the simulator.

### Start Electron Desktop App

```bash
npm run test:wrapper electron
```

This builds and launches the Electron desktop application with hot reload.

## Option 2: Using the Standalone Executable (Recommended for Distribution)

### Step 1: Build the Wrapper Executable

```bash
npm run build:wrapper
```

This creates `dist-wrapper/station-v-test.exe` - a standalone executable that requires no Node.js installation.

### Step 2: Run Commands with the Executable

```bash
# Start development servers
dist-wrapper/station-v-test.exe dev

# Start Electron
dist-wrapper/station-v-test.exe electron

# Build the application
dist-wrapper/station-v-test.exe build

# Package as Windows exe
dist-wrapper/station-v-test.exe package

# Run tests
dist-wrapper/station-v-test.exe test
```

## Common Testing Workflows

### Web Development Testing

```bash
npm run test:wrapper dev
```

Then:
1. Open http://localhost:3000 in your browser
2. Create users, channels, and bots
3. Test chat functionality
4. Check console for any errors

### Desktop Application Testing

```bash
npm run test:wrapper electron
```

Then:
1. Test the Electron window opens correctly
2. Verify all UI elements render properly
3. Test chat functionality in the desktop app
4. Check for any console errors

### Building for Distribution

```bash
npm run test:wrapper build
```

This creates an optimized production build in the `dist/` directory.

### Creating Windows Installer

```bash
npm run test:wrapper package
```

This creates a Windows installer and portable exe in the `release/` directory.

### Running Automated Tests

```bash
npm run test:wrapper test
```

This runs the executable test suite to verify everything works.

## Troubleshooting

### Port Already in Use

If you get an error about port 3000 or 8081 being in use:

```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Not Installed

```bash
npm install
```

### Build Fails

```bash
npm run test:wrapper build
```

Check the console output for specific errors.

### Executable Won't Run

Make sure you built it first:

```bash
npm run build:wrapper
```

## What's New

The test wrapper provides:

✅ **Simple Commands** - Easy-to-remember commands for common tasks
✅ **Colored Output** - Better readability with color-coded messages
✅ **Standalone Exe** - Can be packaged and distributed without Node.js
✅ **Progress Indicators** - See what's happening at each step
✅ **Error Handling** - Clear error messages when something goes wrong

## Next Steps

1. **For Development**: Use `npm run test:wrapper dev` to start coding
2. **For Testing**: Use `npm run test:wrapper electron` to test the desktop app
3. **For Distribution**: Use `npm run build:wrapper` to create a standalone exe
4. **For CI/CD**: Use the wrapper in your build pipeline

## More Information

- See `TEST_WRAPPER_README.md` for detailed documentation
- See `scripts/test-wrapper.js` for the wrapper implementation
- See `scripts/build-test-wrapper.js` for the build script

## Support

If you encounter issues:

1. Check that Node.js 18+ is installed: `node --version`
2. Reinstall dependencies: `npm install`
3. Clear cache: `npm run clean`
4. Try again: `npm run test:wrapper dev`

Happy testing! 🚀

