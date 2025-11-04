# Station V - Test Wrapper

A lightweight CLI wrapper for easily testing the IRC simulator. This wrapper can be packaged as a standalone executable for easy distribution and testing.

## Quick Start

### Using Node.js directly

```bash
# Start development servers
npm run test:wrapper dev

# Start Electron development
npm run test:wrapper electron

# Build the application
npm run test:wrapper build

# Package as Windows executable
npm run test:wrapper package

# Run tests
npm run test:wrapper test

# Show help
npm run test:wrapper help
```

### Using the standalone executable

First, build the wrapper as an exe:

```bash
npm run build:wrapper
```

This creates `dist-wrapper/station-v-test.exe` which can be run independently:

```bash
# Start development servers
station-v-test.exe dev

# Start Electron development
station-v-test.exe electron

# Build the application
station-v-test.exe build

# Package as Windows executable
station-v-test.exe package

# Run tests
station-v-test.exe test
```

## Commands

### `dev`
Starts the development servers:
- WebSocket server on port 8081
- Vite dev server on port 3000

**Use this for:** Web development and testing

### `electron`
Starts Electron development mode with hot reload.

**Use this for:** Desktop application development and testing

### `build`
Builds the application for production.

**Use this for:** Creating optimized production builds

### `package`
Packages the application as a Windows executable.

**Use this for:** Creating distributable exe files

### `test`
Runs the executable tests.

**Use this for:** Verifying the built executable works correctly

### `help`
Shows the help message with all available commands.

## Building the Wrapper Executable

The test wrapper can be packaged as a standalone exe using `pkg`:

```bash
npm run build:wrapper
```

This creates a portable executable at `dist-wrapper/station-v-test.exe` that:
- Requires no Node.js installation
- Can be distributed to testers
- Includes all necessary dependencies
- Supports all wrapper commands

## Distribution

Once built, you can distribute `dist-wrapper/station-v-test.exe` to testers who can then:

1. Run it directly without installing Node.js
2. Use any of the available commands
3. Get colored console output with progress indicators
4. See helpful error messages if something goes wrong

## Features

- ✅ Colored console output for better readability
- ✅ Progress indicators and status messages
- ✅ Error handling with helpful messages
- ✅ Can be packaged as standalone exe
- ✅ No external dependencies required
- ✅ Cross-platform compatible (when not packaged as exe)

## Troubleshooting

### "pkg not found"
The build script will automatically install `pkg` globally if it's not found.

### "Command failed"
Check that you're in the correct directory (repository root) and that all dependencies are installed:

```bash
npm install
```

### Executable won't run
Make sure you have the latest version of the wrapper:

```bash
npm run build:wrapper
```

## Development

The wrapper is defined in `scripts/test-wrapper.js` and can be modified to add new commands or change behavior.

To add a new command:

1. Add a new `async function cmd<CommandName>()` in `test-wrapper.js`
2. Add a case in the switch statement in the `main()` function
3. Update the help text in `showHelp()`

## License

Same as Station V - Virtual IRC Simulator

