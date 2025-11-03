# Station V - Virtual IRC Simulator (Desktop Executable)

**Version 1.20.1**

## Overview

Station V is a cross-platform desktop application that simulates a classic IRC chat environment where you are the only human. Every other user, message, and interaction is generated in real-time by Google's Gemini AI, creating a living digital terrarium of AI personalities with realistic relationships and memory.

This repository is specifically for the **standalone desktop executable** version of Station V, built with Electron.

## Quick Start

1.  **Install Node.js** (v16+).
2.  **Get a Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey).
3.  **Clone and install:**
    ```bash
    git clone https://github.com/TimoP80/station_v_executable.git
    cd station_v_executable
    npm install
    ```
4.  **Create a `.env` file** in the root directory and add your API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
5.  **Run the application in development mode:**
    ```bash
    npm run dev
    ```

## Key Features

-   **AI-Powered Simulation:** A fully autonomous chat world driven by AI agents with unique, customizable personalities and long-term memory.
-   **Cross-Platform Desktop App:** Standalone executables for Windows, macOS, and Linux. No browser or Node.js installation required.
-   **Network Mode:** Connect multiple users (human and AI) in a shared chat environment via a built-in WebSocket server.
-   **Advanced User Management:** Create, edit, and manage AI personalities in real-time. Import/export configurations via JSON or CSV.
-   **Rich Chat Experience:** Supports private messaging, IRC commands (`/nick`, `/join`, `/me`), message quoting, and text formatting.
-   **Persistent Data:** All chat logs and configurations are saved locally to IndexedDB, with options for export.

## Desktop Application

This repository is focused on building and distributing Station V as a desktop application using Electron.

### Building the Executable

You can build a distributable version of the application for multiple platforms.

```bash
# Build for your current platform
npm run package
```

Build artifacts, including installers and portable executables, will be located in the `release/` directory.

### Development

For development, the following scripts are available:

-   `npm run dev`: Run the app in development mode with hot-reloading and DevTools enabled.
-   `npm run package`: Build and package the application for the current platform.
-   `npm run clean`: Clean all build artifacts.

For more detailed build instructions, see the [Quick Build Guide](QUICK_BUILD_GUIDE.md).

## Development Scripts

This project includes a comprehensive set of npm scripts for development, building, and testing.

-   **`npm run dev`**: Starts the Vite development server for the web client only.
-   **`npm run dev:full`**: Starts both the Vite client and the WebSocket server for network mode development.
-   **`npm run build`**: Creates a production build of the React application.
-   **`npm run test`**: (If configured) Runs automated tests.

## Technology Stack

-   **Frontend:** React 18, TypeScript, Tailwind CSS
-   **Build Tool:** Vite
-   **Desktop Framework:** Electron
-   **AI:** Google Gemini API
-   **Local Storage:** IndexedDB
-   **Networking:** WebSocket

## Troubleshooting

If you encounter issues with building or running the application, please refer to our comprehensive troubleshooting guides:

-   [Electron Build Troubleshooting Guide](ELECTRON_TROUBLESHOOTING.md)
-   [Multiplatform Build Guide](MULTIPLATFORM_GUIDE.md)
-   [Network Mode Guide](NETWORK_MODE_EXE_GUIDE.md)

## Changelog

For a detailed list of changes, see the [CHANGELOG.md](CHANGELOG.md) file.

### 1.20.1 - 2025-10-27

#### ✨ Features & Major Updates

-   **Multiplatform Standalone Executable**: The application can now be built as a standalone executable for Windows, macOS, and Linux, with no Node.js installation required.
-   **Enhanced Build System**: Implemented a robust, cross-platform build system with enhanced error handling, verification, and platform-specific optimizations.
-   **Comprehensive Documentation**: Added extensive documentation for multiplatform builds, network mode, troubleshooting, and Electron integration.

#### 🐛 Bug Fixes & Improvements

-   **Critical Build Fixes**: Resolved numerous Electron build issues, including ES module compatibility errors, silent script failures, variable naming conflicts, and incorrect file packaging.
-   **Data Import & Serialization**: Fixed a critical bug preventing data import (`savelog is not a function`) and resolved a date serialization crash in the relationship memory service.
-   **Bot Command Display**: Cleaned up the chat interface by preventing raw bot commands (e.g., `!image`) from appearing in the chat history for virtual users.
-   **Windows Executable Stability**: Addressed critical startup and exit issues, including the ICU (International Components for Unicode) data error.

### 1.20.0 - 2025-10-27

#### 🚨 Build Restoration & Documentation Overhaul

-   **Restored from backup**: The project has been restored from a previous backup due to a critical code breakage that occurred during a refactoring attempt.
-   **Documentation Rewrite**: All project documentation has been rewritten from the ground up to ensure accuracy and clarity. This includes the `README.md`, `CHANGELOG.md`, and all supplementary guides.
-   **Stability**: This version is a stable build from before the breakage. Development will resume from this point.

### 1.19.8 - 2025-10-27 (Changes Lost in Restoration)

-   **Note**: The changes in this version were lost during the restoration.
-   Fixed bot command message display bug.
-   Fixed date serialization error in relationship memory service.
-   Addressed a critical blank screen issue in the Windows Electron build.

### 1.19.7 - 2025-10-27

-   **Complete Distribution Build**: Successfully built and packaged the Windows executable, including all recent bug fixes.
-   **Build Improvements**: Cleaned up the electron-builder configuration and updated dependencies for a more reliable build process.

### 1.19.2 - 2025-10-26

-   **Critical Bug Fixes**: Addressed several critical bugs, including a UI disappearing issue, a `TypeError` in the relationship memory service, and network connection timeouts.
-   **Network Mode Improvements**: Fixed server port configuration and created comprehensive documentation for using network mode in the desktop application.

### 1.19.0 - 2025-10-26

-   **Discord-Style Quoting**: Implemented a message quoting system for more interactive conversations.
-   **Enhanced AI Memory**: Introduced a relationship tracking system that allows AI users to remember past interactions and build relationships over time.

---

*For a more detailed history of changes prior to version 1.19.0, please refer to the project's Git history.*

## License

This project is open source. See the `LICENSE.txt` file for details.
