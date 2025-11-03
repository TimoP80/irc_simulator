# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

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