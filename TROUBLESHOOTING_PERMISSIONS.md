# 🔒 Permission Error Troubleshooting Guide

## Quick Fix

**If you encounter permission errors during build:**

```bash
# 1. Clean up running processes
npm run electron:cleanup

# 2. Close all Electron/Station V windows manually
# 3. Close file explorers in the release directory
# 4. Try building again
npm run electron:build:all
```

---

## Common Causes

### 1. **Running Electron Processes**
Electron keeps files locked while the app is running.

**Fix:**
```bash
# Close all Electron processes
taskkill /F /IM electron.exe

# Or use our cleanup script
npm run electron:cleanup
```

### 2. **Open File Explorers**
File Explorer windows in the release directory lock files.

**Fix:**
- Close all File Explorer windows
- Or navigate to a different folder in File Explorer

### 3. **Antivirus Software**
Antivirus may be scanning and locking files.

**Fix:**
- Temporarily disable real-time scanning
- Add the release directory to exclusions
- Wait for scan to complete

### 4. **Code Editor Access**
Your code editor may have files open.

**Fix:**
- Close files in the release directory
- Or temporarily close the editor
- Use a different editor for the build

### 5. **Previous Build Processes**
Old build processes may still be running.

**Fix:**
```bash
# Check for Node.js processes
tasklist /FI "IMAGENAME eq node.exe"

# Kill specific processes if needed
taskkill /F /IM node.exe
```

---

## Step-by-Step Resolution

### Step 1: Clean Up Processes
```bash
# Run automatic cleanup
npm run electron:cleanup

# Or manually close processes
taskkill /F /IM electron.exe
taskkill /F /IM "Station V - Virtual IRC Simulator.exe"
```

### Step 2: Close External Programs
- Close all Electron windows
- Close all "Station V" applications
- Close File Explorer windows in `release/` directory
- Close VSCode/Cursor files in `release/` directory

### Step 3: Clean Build Artifacts
```bash
# Clean everything
npm run electron:clean
npm run clean

# Or remove the release directory manually
rmdir /s /q release
```

### Step 4: Run Build Again
```bash
npm run electron:build:all
```

---

## Advanced Solutions

### Run as Administrator
Sometimes you need elevated permissions:

1. Right-click PowerShell or Command Prompt
2. Select "Run as administrator"
3. Navigate to project directory
4. Run build command

### Check File Permissions
If files are still locked:

```bash
# Check what's locking the files
handle.exe release

# Or use Process Monitor (ProcMon)
# Download from: https://docs.microsoft.com/en-us/sysinternals/downloads/procmon
```

### Disable Windows Defender Temporarily
Windows Defender may be locking files:

1. Open Windows Security
2. Go to "Virus & threat protection"
3. Turn off "Real-time protection" temporarily
4. Run build
5. Turn it back on

### Add Exclusions
Permanently exclude the project directory:

1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Manage settings"
4. Add exclusions for:
   - Project directory
   - `node_modules`
   - `release` directory

---

## Prevention

### Before Building

1. **Close all Electron apps:**
   ```bash
   taskkill /F /IM electron.exe
   ```

2. **Close file explorers in release directory**

3. **Use cleanup script:**
   ```bash
   npm run electron:cleanup
   ```

### During Build

- Don't open the release directory in File Explorer
- Don't run the built executable while building
- Don't have multiple build processes running

### After Build

- Test the executable in a different location
- Don't keep it open while rebuilding
- Close the app before next build

---

## Build Scripts with Cleanup

New npm scripts added:

```json
{
  "electron:cleanup": "node scripts/cleanup-processes.js",
  "electron:prebuild": "npm run electron:cleanup"
}
```

### Usage

**Manual cleanup:**
```bash
npm run electron:cleanup
```

**Build with automatic cleanup:**
```bash
# Runs cleanup before building
npm run electron:prebuild
npm run electron:build:all
```

Or integrate into your workflow:
```bash
npm run electron:cleanup && npm run electron:build:all
```

---

## Error Messages You Might See

### EPERM: operation not permitted
**Cause:** File is locked by another process
**Fix:** Close Electron windows, file explorers, code editors

### EACCES: permission denied
**Cause:** Insufficient permissions
**Fix:** Run terminal as administrator

### EBUSY: resource busy or locked
**Cause:** File is currently in use
**Fix:** Close programs using the file

### ENOTEMPTY: directory not empty
**Cause:** Directory can't be removed
**Fix:** Close processes accessing the directory

### Cannot delete file
**Cause:** File is locked
**Fix:** Use Task Manager to end the process

---

## Automated Cleanup Script

The cleanup script (`scripts/cleanup-processes.js`) automatically:

1. ✅ Detects running Electron processes
2. ✅ Attempts to close them gracefully
3. ✅ Checks for Node.js processes
4. ✅ Identifies locked files
5. ✅ Provides helpful guidance

### Run it anytime:
```bash
npm run electron:cleanup
```

---

## Still Having Issues?

### Last Resort Options

1. **Restart your computer** - Clears all locks
2. **Run build in safe mode** - Minimal processes running
3. **Use a different terminal** - Powershell, CMD, or Git Bash
4. **Rebuild from scratch:**
   ```bash
   npm run clean:all
   npm install
   npm run electron:build:all
   ```

### Get More Help

Check the build logs for specific errors:
```bash
npm run electron:build:all 2>&1 | tee build.log
```

Then share the error message or check:
- [GitHub Issues](https://github.com/TimoP80/station_v_executable/issues)
- [Desktop Distribution Guide](DESKTOP_DISTRIBUTION_GUIDE.md)

---

## Summary

**Quick Reference Card:**

```bash
# Clean up and build
npm run electron:cleanup && npm run electron:build:all

# If that fails, try:
taskkill /F /IM electron.exe
npm run electron:build:all

# Or go nuclear:
npm run clean:all
npm install
npm run electron:build:all
```

**Most Common Issue:** Running Electron processes locking files
**Most Common Fix:** Close Electron windows and try again

---

## Tips

- ✅ Always close the app before rebuilding
- ✅ Don't open release directory while building
- ✅ Use cleanup script before builds
- ✅ Run builds in a fresh terminal
- ✅ Check for running processes regularly

- ❌ Don't build while app is running
- ❌ Don't keep file explorers open in release directory
- ❌ Don't have multiple build processes
- ❌ Don't ignore cleanup warnings

