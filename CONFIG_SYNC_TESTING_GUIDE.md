# Configuration Sync Testing Guide

This guide explains how to test the new configuration syncing feature between web app and Electron executable.

## Overview

The configuration sync system now supports:
- **Web Mode**: IndexedDB (primary) + localStorage (fallback)
- **Electron Mode**: File-based storage in user data directory
- **Cross-Tab Sync**: BroadcastChannel API for syncing across browser tabs
- **Cross-Platform Sync**: IPC communication between Electron renderer and main process

## Test Scenarios

### Test 1: Web Mode - Single Tab Configuration Save

**Steps:**
1. Open the web app in a browser
2. Go to Settings
3. Change a configuration (e.g., AI Model, Simulation Speed, Nickname)
4. Click Save
5. Refresh the page

**Expected Result:**
- Configuration should persist after refresh
- Changes should be loaded from IndexedDB (or localStorage as fallback)
- Console should show: `[Config Debug] Loaded config from database`

### Test 2: Web Mode - Cross-Tab Sync

**Steps:**
1. Open the web app in two browser tabs (same browser)
2. In Tab 1: Go to Settings and change a configuration
3. Click Save in Tab 1
4. Switch to Tab 2 and observe

**Expected Result:**
- Tab 2 should automatically update with the new configuration
- Console in Tab 2 should show: `[ConfigSync] Received config update from another tab`
- No page refresh needed

### Test 3: Electron Mode - Configuration Persistence

**Steps:**
1. Build the Electron app: `npm run build`
2. Run the Electron app
3. Go to Settings and change a configuration
4. Click Save
5. Close and reopen the Electron app

**Expected Result:**
- Configuration should persist after reopening
- Config file should be saved at: `%APPDATA%\station-v-executable\config.json` (Windows)
- Console should show: `[ElectronMain] Config saved to file`

### Test 4: Electron to Web Sync

**Steps:**
1. Run the Electron app and change a configuration (e.g., Nickname to "ElectronUser")
2. Click Save
3. Open the web app in a browser
4. Go to Settings

**Expected Result:**
- Web app should load the configuration from Electron
- Nickname should be "ElectronUser"
- Console should show: `[Config Debug] Loaded config from Electron`

### Test 5: Web to Electron Sync

**Steps:**
1. Open the web app and change a configuration (e.g., Nickname to "WebUser")
2. Click Save
3. Open the Electron app
4. Go to Settings

**Expected Result:**
- Electron app should load the configuration from web
- Nickname should be "WebUser"
- Console should show: `[ElectronMain] Config loaded from file`

### Test 6: Configuration Priority Chain

**Steps:**
1. Modify config in Electron: Set Nickname to "ElectronUser"
2. Modify config in Web: Set Nickname to "WebUser"
3. Close Electron app
4. Open Electron app again
5. Check Settings

**Expected Result:**
- Electron should load its own saved config (Nickname = "ElectronUser")
- Priority chain: Electron > IndexedDB > localStorage

### Test 7: Fallback Mechanism

**Steps:**
1. Open web app and save a configuration
2. Open browser DevTools → Application → IndexedDB
3. Delete the "station-v-config-db" database
4. Refresh the page

**Expected Result:**
- Configuration should still load from localStorage
- Console should show: `[Config Debug] No config in database, trying localStorage...`

### Test 8: Multiple Electron Windows (if applicable)

**Steps:**
1. Open Electron app
2. Change configuration in main window
3. Open a second window (if supported)
4. Check if configuration is synced

**Expected Result:**
- Both windows should have the same configuration
- Changes in one window should reflect in the other

## Console Debugging

Enable debug logging to see detailed sync information:

```javascript
// In browser console
localStorage.setItem('DEBUG_CONFIG', 'true');
localStorage.setItem('DEBUG_SYNC', 'true');
```

Look for these log patterns:
- `[Config Debug]` - Configuration loading/saving
- `[ConfigSync]` - Sync service operations
- `[ElectronSync]` - Electron IPC communication
- `[ElectronMain]` - Electron main process operations

## Troubleshooting

### Configuration not persisting
1. Check browser DevTools → Application → IndexedDB
2. Verify localStorage has the config key: `gemini-irc-simulator-config`
3. Check browser console for errors

### Cross-tab sync not working
1. Verify BroadcastChannel is supported in your browser
2. Check that both tabs are on the same origin
3. Look for `[ConfigSync] BroadcastChannel initialized` in console

### Electron config not syncing
1. Check that IPC handlers are registered: `[ElectronMain] Config save/load handler`
2. Verify config file exists at: `%APPDATA%\station-v-executable\config.json`
3. Check Electron console for IPC errors

## Performance Notes

- Configuration saves are asynchronous and non-blocking
- BroadcastChannel updates are instant (no network latency)
- Electron IPC communication is fast (same machine)
- IndexedDB operations are optimized for large configs

## Files Modified

- `services/configDatabaseService.ts` - IndexedDB storage
- `services/electronConfigSync.ts` - Electron IPC communication
- `services/configSyncService.ts` - Cross-platform sync orchestration
- `utils/config.ts` - Configuration loading/saving with sync
- `App.tsx` - Sync service initialization
- `electron/main.ts` - IPC handlers
- `electron/preload.ts` - IPC API exposure

