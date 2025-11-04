# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

## 1.21.0 - 2025-11-04

### ✨ Features & Major Updates

-   **Configuration Database Storage System**: Implemented a comprehensive multi-tier configuration storage system that enables seamless syncing between web app and Electron executable:
    -   **IndexedDB Storage**: Primary storage for web mode with automatic fallback to localStorage
    -   **Electron File Storage**: Persistent JSON-based configuration storage in user data directory
    -   **Cross-Tab Sync**: BroadcastChannel API for instant synchronization across browser tabs
    -   **Bidirectional IPC Sync**: Electron IPC handlers for syncing configurations between renderer and main process
    -   **Priority-Based Loading**: Intelligent loading chain (Electron → IndexedDB → localStorage) ensures data is never lost

-   **PM Response Delay Fix**: Fixed an issue where private message responses were generated immediately without simulating realistic typing delays when in degraded mode (API quota exhausted):
    -   Restructured degraded mode handling to show typing indicators
    -   Implemented typing delay simulation for fallback responses
    -   Applied fix to all response generation functions (PM, channel activity, reactions, operator responses)
    -   Maintains immersive conversation experience even during API failures

### 🔧 Technical Improvements

-   **Async Configuration Operations**: Made all configuration loading and saving operations asynchronous to support database operations
-   **Electron IPC Handlers**: Added `config:save`, `config:load`, and `config:changed` handlers for main process communication
-   **Config Sync Service**: Created orchestration layer for managing all sync mechanisms (BroadcastChannel, IPC, database)
-   **Enhanced Preload Bridge**: Extended Electron preload script with `invoke()` and `removeListener()` methods for full IPC support

### 📝 Documentation

-   **CONFIG_SYNC_QUICK_START.md**: Quick start guide for using the new configuration sync system
-   **CONFIG_SYNC_TESTING_GUIDE.md**: Comprehensive testing guide with 8 detailed test scenarios
-   **CONFIG_SYNC_IMPLEMENTATION_SUMMARY.md**: Technical documentation covering architecture, data flow, and implementation details

### 🐛 Bug Fixes

-   **Typing Delay in Degraded Mode**: Fixed PM responses showing immediately without typing delay when API quota is exhausted
-   **Build Cache Issue**: Removed stale compiled types.js file that was interfering with Vite build process

### 📁 New Files

-   `services/configDatabaseService.ts` - IndexedDB wrapper for web storage
-   `services/electronConfigSync.ts` - Electron IPC communication layer
-   `services/configSyncService.ts` - Cross-platform sync orchestration
-   `CONFIG_SYNC_QUICK_START.md` - Quick start guide
-   `CONFIG_SYNC_TESTING_GUIDE.md` - Testing guide
-   `CONFIG_SYNC_IMPLEMENTATION_SUMMARY.md` - Technical documentation

### 📋 Modified Files

-   `utils/config.ts` - Made async, added priority-based loading and sync broadcasting
-   `App.tsx` - Integrated sync service initialization and config update listeners
-   `components/SettingsModal.tsx` - Updated for async config operations
-   `electron/main.ts` - Added IPC handlers and file-based storage
-   `electron/preload.ts` - Extended IPC API exposure
-   `services/geminiService.ts` - Fixed typing delay for degraded mode responses
-   `package.json` - Version bump to 1.21.0

### ✅ Testing

-   All configuration changes persist after page refresh
-   Cross-tab sync works instantly without page refresh
-   Electron app syncs with web app bidirectionally
-   Fallback mechanisms work when primary storage is unavailable
-   Build completes successfully with no errors

## 1.20.10 - 2025-11-04

### 🐛 Bug Fixes & Improvements

-   **API Key Environment Variable Issue**: Fixed a critical issue where a system environment variable `GEMINI_API_KEY` was overriding the `.env.local` file, causing the application to use an incorrect API key with zero quota. Added documentation for users to remove conflicting system environment variables.
-   **Quiet Mode Optimization**: Reduced quiet mode frequency from 30% to 15%, resulting in 85% of simulation cycles generating new messages (up from 70%), making conversations more active and engaging.
-   **Background Simulation Startup**: Eliminated the initial delay when starting background simulation. The first simulation cycle now runs immediately instead of waiting for the full interval, providing instant feedback when the app loads.
-   **Enhanced Fallback Responses**: Significantly improved fallback messages used when AI API calls fail:
    -   Increased variety from 10 to 20 diverse options
    -   Added personality-aware variations (emoji usage, verbosity, formality)
    -   Implemented terse shortcuts ("ikr", "fr") for concise users
    -   Added natural additions for verbose users ("you know what I mean?")
-   **Vite Environment Loading**: Updated `vite.config.ts` to use `process.cwd()` instead of `'.'` for more reliable environment variable loading, and added detailed logging to help diagnose API key loading issues.

### 📝 Documentation

-   **Environment Variable Troubleshooting**: Added guidance for identifying and resolving conflicts between system environment variables and `.env` files, including step-by-step instructions for removing system-level `GEMINI_API_KEY` variables on Windows.

## 1.20.9 - 2025-11-03

### 🐛 Bug Fixes & Improvements

-   **Electron File Loading**: Fixed an issue where the packaged Electron app failed to load `index-electron.html` due to an incorrect relative path, resulting in an `ERR_FILE_NOT_FOUND` error.

## 1.20.8 - 2025-11-03

### 🐛 Bug Fixes & Improvements

-   **Mass Add Users GUI**: Improved error handling and user feedback in the Mass Add Users modal.
-   **Personality Description Length**: Reduced the requested length of AI-generated personality descriptions to prevent overly long text in the UI.
-   **AI Username Generation Fallback**: Enhanced the `generateUniqueNickname` logic to prioritize AI-generated usernames and provide a more robust fallback mechanism.

## 1.20.7 - 2025-11-03

### ✨ Features & Major Updates

-   **DALL-E Image Generation Integration**: Integrated DALL-E as a new image generation provider, allowing for higher quality and more diverse AI-generated images.
-   **Improved Image Generation Typing State**: Fixed an issue where the bot would enter a typing state for image generation but only produce text. The bot now correctly generates and displays images when using DALL-E.

### 🐛 Bug Fixes & Improvements

-   **Default Image Provider**: Changed the default image provider for the `!image` command from `gemini` to `dalle` for improved image generation quality.
-   **Electron Build Fix**: Resolved an issue where the Electron build failed due to a mismatch in the main entry file extension (`.js` vs `.cjs`) after file renaming during the build process.

## 1.20.6 - 2025-11-03

### ✨ Features & Major Updates

-   **User WHOIS Lookup**: Implemented a `/whois` command and UI to allow channel moderators to view detailed information (real name, hostname) about users in their channel.

## 1.20.5 - 2025-11-03

### 🐛 Bug Fixes & Improvements

-   **Image Command Fix**: Resolved an issue where the `!image` command would generate duplicate images. The command now correctly displays a single image.
-   **Configuration Clarity**: Improved error messaging for the `!image` command to clarify when an image generation provider is not configured, preventing confusion about placeholder images.

## 1.20.4 - 2025-11-03

### ✨ Features & Major Updates

-   **User Profile Picture Upload**: Users can now upload a profile picture from the settings modal. The picture is displayed in the channel list next to the user's nickname.

## 1.20.3 - 2025-11-03

### ✨ Features & Major Updates

-   **Increased Personality Description Limit**: The character limit for AI personality descriptions has been increased from 500 to 1000 characters, allowing for more detailed and nuanced virtual user profiles.

## 1.20.2 - 2025-11-03

### ✨ Features & Major Updates

-   **Private Messaging**: Implemented private messaging functionality, allowing users to engage in one-on-one conversations. This includes proper chat message list updates and state management for private messages.

## 1.20.1 - 2025-10-27

### ✨ Features & Major Updates

-   **Multiplatform Standalone Executable**: The application can now be built as a standalone executable for Windows, macOS, and Linux, with no Node.js installation required.
-   **Enhanced Build System**: Implemented a robust, cross-platform build system with enhanced error handling, verification, and platform-specific optimizations.
-   **Comprehensive Documentation**: Added extensive documentation for multiplatform builds, network mode, troubleshooting, and Electron integration.

### 🐛 Bug Fixes & Improvements

-   **Critical Build Fixes**: Resolved numerous Electron build issues, including ES module compatibility errors, silent script failures, variable naming conflicts, and incorrect file packaging.
-   **Data Import & Serialization**: Fixed a critical bug preventing data import (`savelog is not a function`) and resolved a date serialization crash in the relationship memory service.
-   **Bot Command Display**: Cleaned up the chat interface by preventing raw bot commands (e.g., `!image`) from appearing in the chat history for virtual users.
-   **Windows Executable Stability**: Addressed critical startup and exit issues, including the ICU (International Components for Unicode) data error.

## 1.20.0 - 2025-10-27

### 🚨 Build Restoration & Documentation Overhaul

-   **Restored from backup**: The project has been restored from a previous backup due to a critical code breakage that occurred during a refactoring attempt.
-   **Documentation Rewrite**: All project documentation has been rewritten from the ground up to ensure accuracy and clarity. This includes the `README.md`, `CHANGELOG.md`, and all supplementary guides.
-   **Stability**: This version is a stable build from before the breakage. Development will resume from this point.

## 1.19.8 - 2025-10-27 (Changes Lost in Restoration)

-   **Note**: The changes in this version were lost during the restoration.
-   Fixed bot command message display bug.
-   Fixed date serialization error in relationship memory service.
-   Addressed a critical blank screen issue in the Windows Electron build.

## 1.19.7 - 2025-10-27

-   **Complete Distribution Build**: Successfully built and packaged the Windows executable, including all recent bug fixes.
-   **Build Improvements**: Cleaned up the electron-builder configuration and updated dependencies for a more reliable build process.

## 1.19.2 - 2025-10-26

-   **Critical Bug Fixes**: Addressed several critical bugs, including a UI disappearing issue, a `TypeError` in the relationship memory service, and network connection timeouts.
-   **Network Mode Improvements**: Fixed server port configuration and created comprehensive documentation for using network mode in the desktop application.

## 1.19.0 - 2025-10-26

-   **Discord-Style Quoting**: Implemented a message quoting system for more interactive conversations.
-   **Enhanced AI Memory**: Introduced a relationship tracking system that allows AI users to remember past interactions and build relationships over time.

---

*For a more detailed history of changes prior to version 1.19.0, please refer to the project's Git history.*