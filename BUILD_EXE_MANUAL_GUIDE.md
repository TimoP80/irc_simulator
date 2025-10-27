# Manual EXE Build Guide - Station V

## ⚡ Quick Start

**For the quickest build and portable distribution:**
```bash
npm run electron:build:all
```
This creates everything you need in `release/` directory.

---

## Quick Build Commands

### Option 1: Full Windows Distribution (Recommended)
```bash
npm run electron:build:win
```
This creates the complete Windows executable in `release/win-unpacked/`

### Option 2: Portable ZIP Distribution (Recommended)
```bash
# Build and create portable distribution in one command
npm run electron:build:all
```
Or separately:
```bash
npm run electron:build:win
npm run electron:build:portable
```

This creates:
- `Station-V-Portable.zip` - ZIP file with all application files
- `README-Portable.txt` - User instructions
- `Station-V-Launcher.bat` - Batch launcher script

**Distribution:** Share the ZIP file. Users extract and run the executable.

### Option 3: Single Executable (with external tools)
```bash
npm run electron:build:win
npm run electron:build:single
```
This creates guides for creating a single .exe file using tools like Enigma Virtual Box.

---

## Detailed Manual Steps

### Step 1: Clean Previous Builds
```bash
npm run electron:clean
```

### Step 2: Build the Application
```bash
npm run build
```
Or build step-by-step:
```bash
npm run build:vite      # Builds React app for Electron
npm run build:electron  # Compiles Electron main process
npm run copy:config     # Copies default-config.json
```

### Step 3: Create Windows Executable
```bash
npm run electron:build:win
```

This runs the script `scripts/build-windows-dist.js` which:
1. Cleans previous builds
2. Builds React application (`npm run build`)
3. Compiles Electron main process
4. Renames .js to .cjs files for ES module compatibility
5. Copies ICU files
6. Builds Windows executable with electron-builder
7. Copies application files to release directory

### Step 4: Find Your Executable
- **Location**: `release/win-unpacked/`
- **Executable**: `Station V - Virtual IRC Simulator.exe`

---

## Available npm Scripts

```json
"electron:build:win"       # Build Windows executable
"electron:build:portable"  # Create ZIP distribution
"electron:build:single"    # Create single exe guides
"electron:test"            # Test the built executable
"electron:clean"           # Clean build artifacts
"electron:dev"             # Development mode with Electron
"electron"                 # Run Electron with current build
```

---

## Build Output Structure

```
release/
├── win-unpacked/
│   ├── Station V - Virtual IRC Simulator.exe
│   ├── resources/
│   │   └── app/
│   │       ├── dist/           # React build
│   │       ├── dist-electron/   # Electron main
│   │       ├── server/          # WebSocket server
│   │       └── default-config.json
│   ├── icudtl.dat
│   └── ... (other Electron files)
└── ... (installer files if created)
```

---

## Code Signing

The build process is configured to **disable code signing** by default. You may see signing-related warnings during the build - these are **expected** and **safe to ignore**.

**Why you see warnings**: Even though signing is disabled, electron-builder attempts to find certificates. Our build scripts automatically suppress these warnings.

See `CODE_SIGNING_GUIDE.md` for detailed information about signing configuration.

## Troubleshooting

### If build fails:
```bash
# Clean everything and rebuild
npm run clean:all
npm install
npm run electron:build:win
```

### If you see signing warnings:
- These are **expected** and **do not affect** the executable
- The build scripts automatically suppress most warnings
- Check if the executable was created in `release/win-unpacked/`
- If the executable exists, the build succeeded!

### If executable doesn't start:
1. Check that all files in `release/win-unpacked/` are present
2. Run `npm run electron:test` to test
3. Check console for missing files

### If files are missing:
The build script manually copies:
- `dist/` → `release/win-unpacked/dist/`
- `dist-electron/` → `release/win-unpacked/dist-electron/`
- `server/` → `release/win-unpacked/server/`
- `default-config.json` → `release/win-unpacked/default-config.json`

---

## Manual Commands (No Scripts)

If you want to manually execute each step:

```bash
# 1. Clean
rimraf dist dist-electron release

# 2. Build React for Electron
cross-env ELECTRON=true vite build

# 3. Build Electron main process
tsc --project tsconfig.electron.json

# 4. Rename .js to .cjs
node scripts/rename-electron-files.js

# 5. Copy config
copy default-config.json dist\default-config.json

# 6. Copy ICU files
node scripts/copy-icu-files.js

# 7. Build with electron-builder
npx electron-builder --win --config package-electron.json

# 8. Manually copy application files
# (Check scripts/build-windows-dist.js for exact commands)
```

---

## Size and Output

- **Unpacked folder**: ~145 MB
- **ZIP file**: ~145 MB (compressed)
- **Single .exe**: ~150-200 MB (requires external tools)

The executable includes:
- React application (built with Vite)
- Electron main process (TypeScript compiled)
- WebSocket server
- All dependencies bundled
- Configuration files

---

## Development vs Production

**Development:**
```bash
npm run electron:dev
```
Runs with hot-reload and development tools.

**Production:**
```bash
npm run electron:build:win
```
Creates optimized production build.

---

## Package File Reference

The build uses `package-electron.json` for electron-builder configuration. Check this file for:
- Windows build targets (NSIS, portable)
- Icon settings
- File inclusion rules
- Distribution settings

