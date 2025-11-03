# 🔧 Electron Build Troubleshooting Guide

## 🚨 **Critical Issues Resolved**

This document details the major Electron build issues encountered and their solutions during the Station V multiplatform development.

---

## 🐛 **Issue 1: Silent Script Failures**

### **Symptoms**
- `npm run electron:build:win` exits immediately with no output
- Release directory remains empty
- No error messages or build logs
- Script appears to "hang" or exit silently

### **Root Cause**
ES module detection was failing due to incorrect path comparison. The original code used:
```javascript
if (import.meta.url === `file://${process.argv[1]}`) {
  // This comparison was failing silently
}
```

### **Solution**
Fixed ES module detection using proper Node.js utilities:
```javascript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
if (process.argv[1] === __filename) {
  buildWindowsDistribution().catch(console.error);
}
```

### **Prevention**
- Always use `fileURLToPath()` for ES module path handling
- Test ES module detection logic thoroughly
- Add console.log statements to verify script execution

---

## 🐛 **Issue 2: Variable Naming Conflicts**

### **Symptoms**
```
❌ Build failed: Cannot access 'process' before initialization
Stack trace: ReferenceError: Cannot access 'process' before initialization
```

### **Root Cause**
Using `process` as a variable name conflicted with the global `process` object:
```javascript
const process = spawn(command, args, {
  cwd: process.cwd(), // ❌ This references the variable, not global process
  ...options
});
```

### **Solution**
Renamed the variable to avoid conflicts:
```javascript
const childProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(), // ✅ Now references global process correctly
  ...options
});

childProcess.on('close', (code) => {
  // Handle process events
});
```

### **Prevention**
- Never use global object names as variable names
- Use descriptive variable names (`childProcess`, `spawnedProcess`)
- Be aware of Node.js global objects (`process`, `Buffer`, `console`)

---

## 🐛 **Issue 3: Electron Builder Configuration Errors**

### **Symptoms**
```
⨯ Invalid configuration object. electron-builder 25.1.8 has been initialized using a configuration object that does not match the API schema.
- configuration has an unknown property 'build'. These properties are valid: [...]
```

### **Root Cause**
`package-electron.json` contained non-electron-builder properties:
```json
{
  "name": "station-v-virtual-chat-simulator",  // ❌ Not valid for electron-builder
  "version": "1.19.0",                          // ❌ Not valid for electron-builder
  "author": "Station V Team",                   // ❌ Not valid for electron-builder
  "build": {                                    // ❌ Wrong nesting level
    "appId": "com.stationv.ircsimulator"
  }
}
```

### **Solution**
Cleaned configuration to only include electron-builder valid properties:
```json
{
  "appId": "com.stationv.ircsimulator",
  "productName": "Station V - Virtual IRC Simulator",
  "asar": true,
  "asarUnpack": ["node_modules/electron/dist/**/*"],
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "server/**/*",
    "node_modules/**/*",
    "!node_modules/electron/dist/**/*"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      }
    ],
    "icon": "favicon.ico"
  }
}
```

### **Prevention**
- Use electron-builder documentation to verify configuration properties
- Test configuration with `npx electron-builder --help`
- Keep electron-builder config separate from package.json

---

## 🐛 **Issue 4: File Extension Mismatches**

### **Symptoms**
```
⨯ Application entry file "dist-electron\main.js" in the "app.asar" does not exist. Seems like a wrong configuration.
```

### **Root Cause**
Build process renamed `.js` files to `.cjs` for ES module compatibility, but package.json still referenced `.js`:
```json
{
  "main": "dist-electron/main.js"  // ❌ File was renamed to main.cjs
}
```

### **Solution**
Updated package.json to match actual file extensions:
```json
{
  "main": "dist-electron/main.cjs"  // ✅ Matches renamed file
}
```

### **Prevention**
- Ensure file extensions match between build output and configuration
- Use consistent file naming throughout the build process
- Verify file existence after build steps

---

## 🐛 **Issue 5: PowerShell Command Syntax**

### **Symptoms**
```
The token '&&' is not a valid statement separator in this version.
Expressions are only allowed as the first element of a pipeline.
```

### **Root Cause**
PowerShell doesn't support `&&` operator like bash:
```bash
cd release/win-unpacked && "Station V - Virtual IRC Simulator.exe"  // ❌ Bash syntax
```

### **Solution**
Use PowerShell-appropriate syntax:
```powershell
# Option 1: Semicolon separator
cd release/win-unpacked; "Station V - Virtual IRC Simulator.exe"

# Option 2: Separate commands
cd release/win-unpacked
& "Station V - Virtual IRC Simulator.exe"

# Option 3: PowerShell pipeline
cd release/win-unpacked; & "Station V - Virtual IRC Simulator.exe"
```

### **Prevention**
- Use platform-appropriate command syntax
- Test commands in the target shell environment
- Provide multiple command examples for different shells

---

## 🔍 **Debugging Techniques**

### **1. Enable Verbose Logging**
Add detailed logging to build scripts:
```javascript
console.log('🔨 Building Electron application...');
console.log('📦 Building React application...');
console.log('⚡ Compiling Electron main process...');
console.log('🪟 Building Windows executable...');
```

### **2. Check File Existence**
Verify critical files exist at each step:
```javascript
const distExists = fs.existsSync('dist');
const electronDistExists = fs.existsSync('dist-electron');

if (!distExists) {
  throw new Error('React build failed - dist directory not found');
}
```

### **3. Test Individual Steps**
Run build steps individually to isolate issues:
```bash
npm run build                    # Test React build
npm run build:electron-main      # Test Electron compilation
npx electron-builder --win      # Test electron-builder
```

### **4. Check ES Module Compatibility**
Verify ES module syntax is correct:
```javascript
// Test ES module detection
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);
console.log('Comparison result:', process.argv[1] === __filename);
```

---

## ✅ **Build Success Indicators**

### **Successful Build Output**
```
🚀 Building Station V Windows Distribution...
🧹 Cleaning previous builds...
📦 Building React application...
⚡ Compiling Electron main process...
🔄 Renaming Electron files to .cjs for ES module compatibility...
✅ Verifying build files...
🪟 Building Windows executable...
📋 Copying ICU files manually...
🎉 Windows distribution build complete!
```

### **Expected File Structure**
```
release/
├── win-unpacked/
│   ├── Station V - Virtual IRC Simulator.exe
│   ├── resources/
│   │   ├── app.asar
│   │   └── server/
│   ├── icudtl.dat
│   ├── chrome_100_percent.pak
│   ├── chrome_200_percent.pak
│   ├── resources.pak
│   └── snapshot_blob.bin
└── builder-debug.yml
```

---

## 🚀 **Best Practices**

### **1. Error Handling**
Always wrap build steps in try-catch blocks:
```javascript
try {
  await runCommand('npm', ['run', 'build']);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
```

### **2. File Verification**
Check file existence after each build step:
```javascript
if (!fs.existsSync('dist-electron/main.cjs')) {
  throw new Error('Electron main file not found');
}
```

### **3. Cross-Platform Compatibility**
Use platform-agnostic paths and commands:
```javascript
import path from 'path';
const executablePath = path.join('release', 'win-unpacked', 'Station V - Virtual IRC Simulator.exe');
```

### **4. Configuration Validation**
Validate electron-builder configuration before building:
```bash
npx electron-builder --help
npx electron-builder --config package-electron.json --dry-run
```

---

## 📚 **Additional Resources**

- [Electron Builder Documentation](https://www.electron.build/)
- [ES Modules in Node.js](https://nodejs.org/api/esm.html)
- [PowerShell vs Bash Commands](https://docs.microsoft.com/en-us/powershell/scripting/learn/ps101/01-discover-powershell)
- [TypeScript ES Module Configuration](https://www.typescriptlang.org/docs/handbook/esm-node.html)

---

**Last Updated**: January 2025  
**Status**: All critical issues resolved ✅
