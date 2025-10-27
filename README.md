# Station V - Virtual IRC Simulator (Desktop Executable)

**Version 1.19.0** - Desktop-focused distribution of Station V with AI-powered chat simulation, Discord-style quoting, enhanced AI memory system, multilingual support, network capabilities, and **cross-platform desktop compilation**.

> 📌 **This is the Main Active Codebase** - See [MAIN_CODEBASE.md](MAIN_CODEBASE.md) for repository status and recent updates.

## 🖥️ Desktop Application Ready!

**This is the desktop executable version of Station V!** Build standalone executables for Windows, macOS, and Linux with a single command.

### Quick Desktop Build
```bash
# Build Windows executable
npm run electron:build:win

# Create portable distribution
npm run electron:build:portable

# Create single executable options
npm run electron:build:single
```

**Result**: Fully functional desktop application with native UI, no browser required!

## Overview

Station V is a **cross-platform application** that simulates a classic IRC chat environment where you're the only human user. Every other user, message, and interaction is generated in real-time by Google's Gemini AI, creating a living digital terrarium of AI personalities with realistic relationships and memory.

**Available as both web application and standalone desktop executable.**

> **Note**: This is the **desktop executable version** of Station V. For the main web application, visit the [original Station V repository](https://github.com/TimoP80/station-v-virtual-chat-simulator).

## Quick Start

1. **Install Node.js** from [nodejs.org](https://nodejs.org/)
2. **Get a Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Clone and setup:**
   ```bash
   git clone https://github.com/TimoP80/station_v_executable.git
   cd station_v_executable
   npm install
   ```
4. **Create `.env` file:**
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
5. **Start the app:**
   ```bash
   # For single-user development (recommended for beginners)
   npm run dev
   
   # For multi-user/network development
   npm run dev:full
   
   # Windows users having issues with concurrently
   npm run dev:full:win
   ```
6. **Open** `http://localhost:3000/` (or the port shown in terminal) in your browser

## Key Features

### 🤖 AI-Powered Simulation
- **Fully AI-driven world** - Every user besides you is an AI agent with unique personalities
- **Real-time conversations** - AI users chat autonomously and respond to your messages
- **Enhanced AI Memory** - Virtual users remember relationships and interactions across channels
- **Advanced personalities** - Detailed language skills, writing styles, and cultural traits
- **Enhanced personality attributes** - 7 formality levels, 7 verbosity levels, 9 humor styles, 7 emoji usage patterns, 7 punctuation styles
- **Multilingual support** - AI users can communicate in multiple languages

### 💬 Discord-Style Quoting System
- **Message Quoting** - Reply to any message with Discord-style quote rendering
- **Interactive Controls** - Hover-to-show reply buttons on all messages
- **Quote Preview** - See quoted message preview before sending your reply
- **Cross-User Support** - Both virtual and human users can quote messages
- **Network Compatibility** - Full quote support in both local and network modes

### 🧠 AI Memory & Relationships
- **Relationship Tracking** - AI users remember their relationships with you across channels
- **5-Level Progression** - Relationships evolve from stranger → acquaintance → friendly → close → enemy
- **Channel Memory** - AI remembers which channels you've interacted in together
- **Topic Memory** - Tracks shared interests and conversation topics
- **Sentiment Analysis** - AI analyzes interaction sentiment for realistic relationship building
- **Memory Decay** - Relationships naturally cool down after periods of inactivity

### 🎭 User Management
- **Create AI personalities** - Detailed customization with language skills and writing styles
- **Batch generation** - Create 1-50 users at once using templates or AI generation
- **Import/Export** - CSV and JSON support for sharing configurations
- **Real-time editing** - Add, edit, or remove users without stopping the simulation

### 💬 Chat Features
- **Classic IRC interface** - Three-panel layout (channels, chat, user list)
- **Private messaging** - One-on-one conversations with any AI personality
- **IRC commands** - `/nick`, `/join`, `/me`, `/who`, `/op`, `/help`, and more
- **Operator privileges** - Request operator status from AI operators using `/op` command
- **Text formatting** - Bold, italic, code blocks, spoilers, and colored text
- **Persistent logs** - All messages saved to IndexedDB with export options

### 🌐 Network Mode
- **Multi-user support** - Multiple human users can connect and chat together
- **WebSocket server** - Built-in server for real-time communication (auto-starts in EXE)
- **Cross-tab sync** - Multiple browser tabs stay synchronized
- **AI integration** - Virtual users interact with both human and network users

📖 **Using Network Mode in the EXE**: See [NETWORK_MODE_EXE_GUIDE.md](NETWORK_MODE_EXE_GUIDE.md) for detailed instructions.

### 👑 Operator System
- **AI operator responses** - AI operators can grant or deny operator privileges
- **Multilingual support** - Operator responses in 30+ languages with authentic terminology
- **Intelligent decisions** - AI operators consider user behavior, trustworthiness, and channel needs
- **Request operator status** - Use `/op` command to request operator privileges from AI operators
- **Language-specific terminology** - Authentic IRC terms for each supported language
- **Personality-driven responses** - Each AI operator responds based on their unique personality

### 🎨 Enhanced Personality Attributes

Station V offers unprecedented control over AI personality traits with 7 distinct attribute categories:

#### **Formality Levels (7 levels)**
- **Ultra Casual** - Most informal, slang-heavy communication
- **Very Casual** - Very informal, relaxed tone
- **Casual** - Informal, friendly approach
- **Semi-formal** - Balanced, professional but approachable
- **Formal** - Professional, structured communication
- **Very Formal** - Highly professional, academic tone
- **Ultra Formal** - Most formal, ceremonial style

#### **Verbosity Levels (7 levels)**
- **Terse** - Very brief, minimal words
- **Brief** - Concise, to the point
- **Moderate** - Balanced length responses
- **Detailed** - Thorough explanations
- **Verbose** - Long, comprehensive responses
- **Extremely Verbose** - Very long, extensive responses
- **Novel-length** - Extremely long, narrative style

#### **Humor Styles (9 levels)**
- **None** - No humor in communication
- **Dry** - Subtle, understated humor
- **Mild** - Light, gentle humor
- **Moderate** - Balanced humor
- **Witty** - Clever, quick humor
- **Sarcastic** - Sharp, ironic humor
- **Absurd** - Bizarre, surreal humor
- **Chaotic** - Random, unpredictable humor
- **Unhinged** - Extreme, wild humor

#### **Emoji Usage Patterns (7 levels)**
- **None** - No emojis used
- **Rare** - Occasional emoji use
- **Occasional** - Some emojis in responses
- **Moderate** - Regular emoji usage
- **Frequent** - Many emojis in messages
- **Excessive** - Overuse of emojis
- **Emoji-only responses** - Primarily emoji communication

#### **Punctuation Styles (7 levels)**
- **Minimal** - Basic punctuation only
- **Standard** - Normal punctuation usage
- **Expressive** - Enhanced punctuation for emphasis
- **Dramatic** - Exaggerated punctuation
- **Chaotic** - Random, inconsistent punctuation
- **Artistic** - Creative punctuation patterns
- **Experimental** - Unconventional punctuation use

### 💬 Discord-Style Quoting System
- **Reply to Messages** - Click the "Reply" button that appears on hover over any message
- **Quote Preview** - See a preview of the quoted message above your input field
- **Remove Quotes** - Click the X button to remove a quote before sending
- **Cross-User Support** - Both virtual users and human users can quote messages
- **Network Compatibility** - Quote functionality works in both local and network modes
- **Visual Design** - Beautiful Discord-style quote rendering with left border and user information

### 🧠 AI Memory & Relationship System
- **Relationship Progression** - AI users build relationships with you over time:
  - **Stranger** - First-time interactions
  - **Acquaintance** - After 5+ interactions
  - **Friendly** - After 20+ interactions over multiple days
  - **Close** - After 50+ interactions with shared topics
  - **Enemy** - Rare, based on negative sentiment patterns
- **Channel Memory** - AI remembers which channels you've interacted in together
- **Topic Tracking** - AI tracks shared interests like programming, gaming, music, etc.
- **Sentiment Analysis** - AI analyzes whether interactions are positive, neutral, or negative
- **Memory Decay** - Relationships cool down after 7+ days of inactivity
- **Contextual Responses** - AI users reference past conversations and shared experiences

### 📊 Data Management
- **Chat log database** - Complete message history with search and filtering
- **Export options** - HTML, JSON, and CSV export formats
- **Backup system** - Easy data backup and sharing capabilities
- **Storage management** - Monitor usage and clear old logs
- **Clear channel logs** - Use Configure Simulation → Clear logs (from the Channels section) to clear past chats

## Configuration

### First Launch
1. **Set your nickname** - Your display name in all channels
2. **Choose AI model** - Select from available Gemini models
3. **Create users** - Add AI personalities or use batch generation
4. **Create channels** - Set up IRC channels with topics
5. **Adjust settings** - Configure simulation speed and preferences

### 💡 Quick Tips
- **Clear channel logs**: Use Configure Simulation → Clear logs (from the Channels section) to reset chat history
- **Export conversations**: Use the chat log manager to export conversations in various formats
- **Batch user creation**: Create multiple AI personalities at once using the batch generation feature
- **Request operator status**: Use `/op` command in any channel to request operator privileges from AI operators
- **Multilingual operators**: AI operators respond in their configured language with authentic IRC terminology
- **Enhanced personality control**: Use the new 7-level attribute system for precise AI personality customization
- **Cursor AI development**: Open `DevelopmentCommands_CursorAI.html` for comprehensive AI development command reference

### Simulation Speed
- **Fast**: 15 seconds (responsive, moderate API usage)
- **Normal**: 30 seconds (balanced, low API usage)  
- **Slow**: 60 seconds (conservative, very low API usage)
- **Off**: No autonomous messages (most API-friendly)

## 🖥️ Desktop Development

### Building Desktop Executables

Station V can be compiled to standalone desktop applications using Electron:

```bash
# Development with Electron
npm run electron:dev

# Build Windows executable
npm run electron:build:win

# Create portable distribution (ZIP)
npm run electron:build:portable

# Create single executable options
npm run electron:build:single

# Test the built executable
npm run electron:test

# Clean build artifacts
npm run electron:clean
```

### Desktop Features

- **Native Window Controls** - Custom title bar with minimize/maximize/close
- **Desktop-Optimized UI** - Always-visible sidebar and panels
- **Keyboard Shortcuts** - Ctrl+Shift+D (DevTools), F11 (Fullscreen), Alt+F4 (Close)
- **Menu System** - Access settings, logs, and developer tools
- **Portable Distribution** - Single ZIP file, no installation required
- **Cross-Platform** - Windows, macOS, and Linux support

### Distribution Options

1. **ZIP Distribution** (Ready to use):
   - Creates `Station-V-Portable.zip` (~138 MB)
   - Users extract and run the executable
   - No installation required

2. **Single Executable Options**:
   - Enigma Virtual Box (Free) - Creates virtual file system
   - BoxedApp Packer (Commercial) - Professional single exe
   - VMProtect (Commercial) - Packed and protected executable

**Current Working Solution**: The ZIP file provides immediate distribution with no installation required.

📖 **Detailed Guide**: See [DESKTOP_DISTRIBUTION_GUIDE.md](DESKTOP_DISTRIBUTION_GUIDE.md) for comprehensive desktop build instructions.

📋 **Repository Setup**: See [REPOSITORY_SETUP_GUIDE.md](REPOSITORY_SETUP_GUIDE.md) for setting up this desktop-focused repository.

## Development

### Development Commands

#### **Basic Commands**
```bash
npm install          # Install all dependencies
npm run build        # Build for production
npm run preview      # Preview production build
```

#### **Development Server Options**
```bash
# Single service development
npm run dev          # Start Vite client only (http://localhost:3000)
npm run dev:server   # Start WebSocket server only (ws://localhost:8080)
npm run dev:client   # Alias for 'npm run dev'

# Full development environment (recommended)
npm run dev:full     # Start both server and client using concurrently
npm start            # Alias for 'npm run dev:full'
```

#### **Windows-Specific Alternatives**
```bash
# If concurrently fails on Windows, use these alternatives:
npm run dev:full:win # Windows batch file (opens separate windows)
npm run dev:full:ps  # PowerShell script (colored output, separate windows)
```

#### **Utility Commands**
```bash
npm run install:all  # Install dependencies and build project
```

### Network Mode Development

For multi-user development and testing:

```bash
# Full network environment (recommended)
npm run dev:full     # Start both WebSocket server and web client
npm start            # Alias for dev:full

# Individual services
npm run dev:server   # WebSocket server only (ws://localhost:8080)
npm run dev:client   # Web client only (http://localhost:3000)

# Windows alternatives if concurrently fails
npm run dev:full:win # Batch file launcher
npm run dev:full:ps  # PowerShell launcher
```

**Network Mode Features:**
- **WebSocket Server**: Real-time communication between multiple clients
- **Cross-tab Sync**: Multiple browser tabs stay synchronized
- **Multi-user Support**: Multiple human users can connect simultaneously
- **AI Integration**: Virtual users interact with both human and network users

### Development Workflow

#### **Single-User Development** (Most Common)
```bash
npm run dev          # Start Vite client only
# Open http://localhost:3000 in browser
# Perfect for: UI development, AI personality testing, single-user features
```

#### **Multi-User Development** (Network Features)
```bash
npm run dev:full     # Start both server and client
# Open http://localhost:3000 in browser
# Perfect for: Network features, multi-user testing, WebSocket development
```

#### **Windows Development** (If concurrently fails)
```bash
npm run dev:full:win # Batch file launcher
# OR
npm run dev:full:ps  # PowerShell launcher
# Perfect for: Windows users experiencing concurrently issues
```

#### **Individual Service Development**
```bash
# Terminal 1: WebSocket server
npm run dev:server

# Terminal 2: Vite client  
npm run dev:client
# Perfect for: Debugging specific services, custom development setups
```

### Electron Build Development

#### **Building Standalone Executables**
```bash
# Build Windows executable
npm run electron:build:win

# Build for current platform
npm run electron:build

# Build for all platforms
npm run electron:build:all

# Test Electron build
npm run electron:test

# Clean build artifacts
npm run electron:clean
```

#### **Enhanced Development Commands** (Based on Working Test App)
```bash
# Development with DevTools control
npm run dev:clean          # Development without DevTools
npm run dev:debug          # Development with DevTools open
npm run dev:vite           # Vite dev server on port 3000
npm run dev:vite:debug     # Vite dev server with debug mode

# Electron development
npm run dev:electron        # Wait for Vite, then start Electron
npm run dev:electron:clean # Electron without DevTools
npm run dev:electron:debug # Electron with DevTools open
```

#### **Distribution Commands** (Improved Build Process)
```bash
# Standard builds
npm run build              # Build both Vite and Electron
npm run build:vite         # Build Vite only
npm run build:electron     # Build Electron only
npm run build:all          # Build and create distribution

# Windows-specific builds
npm run dist:win           # Windows installer + portable
npm run dist:win:dir       # Windows directory only
npm run dist:win:portable  # Portable executable only
npm run dist:win:no-sign   # Windows build without code signing

# Cross-platform builds
npm run dist:mac           # macOS builds
npm run dist:linux         # Linux builds
npm run pack               # Pack without installer
npm run pack:win           # Windows pack only
```

#### **Utility Commands** (Troubleshooting & Maintenance)
```bash
# Troubleshooting
npm run troubleshoot        # Run Windows build diagnostics
npm run check:ports        # Check if ports 3000/5173 are in use
npm run kill:dev          # Kill all Node.js and Electron processes

# Cleanup
npm run clean              # Clean dist and release directories
npm run clean:all          # Clean everything including Vite cache

# Type checking
npm run type-check         # TypeScript type checking without emit
```

#### **Portable Executable Creation**

**Yes, single portable executables are possible!** We've created several distribution options:

1. **ZIP Distribution** (Ready to use):
   ```bash
   npm run electron:build:portable
   ```
   - Creates `Station-V-Portable.zip` (~145 MB)
   - Users extract and run the executable
   - No installation required

2. **Single Executable Options**:
   ```bash
   npm run electron:build:single
   ```
   - Creates launcher scripts and guides
   - Provides instructions for true single executable tools

3. **Recommended Tools for Single Executable**:
   - **Enigma Virtual Box** (Free) - Creates virtual file system
   - **BoxedApp Packer** (Commercial) - Professional single exe
   - **VMProtect** (Commercial) - Packed and protected executable

**Current Working Solution**: The ZIP file provides immediate distribution with no installation required.

**Note**: Installer creation is currently limited by Windows permissions, but ZIP distribution provides a complete solution for immediate distribution.

#### **The Debugging Process** 🐛
The multiplatform executable build required extensive debugging over 2-3 hours to resolve critical issues:

**Phase 1: Silent Failures**
- Build script was exiting with no output
- No error messages or build logs
- Empty release directories
- Required debugging ES module detection

**Phase 2: Configuration Errors**
- Electron-builder rejecting configuration files
- Invalid properties causing build failures
- File extension mismatches
- Required cleaning up package-electron.json

**Phase 3: Cross-Platform Issues**
- PowerShell command syntax problems
- Variable naming conflicts
- Path handling issues
- Required platform-specific fixes

**Result**: Comprehensive error handling, step-by-step logging, and reliable cross-platform builds.

### Cursor AI Development

For developers using Cursor AI to improve and enhance the codebase:

#### **Development Commands Reference**
- **File**: `DevelopmentCommands_CursorAI.html`
- **Purpose**: Comprehensive reference for Cursor AI development commands
- **Location**: Project root directory
- **Usage**: Open in browser for easy reference while coding

#### **Available Cursor AI Commands**
- **`/UI_update`**: Update user interface components and styling
- **`/module_update`**: Modify business logic, services, and core functionality
- **`/doc_update`**: Update documentation, README, and changelog files
- **`/project_update`**: Make project-wide changes to configuration and scripts

#### **Development Workflow with Cursor AI**
1. **Identify the area** you want to improve (UI, logic, documentation, project config)
2. **Open `DevelopmentCommands_CursorAI.html`** in your browser for command reference
3. **Use the appropriate command** with specific details about your changes
4. **Test your changes** using the development commands above
5. **Update documentation** if needed using `/doc_update`

#### **Best Practices**
- **Be specific** when describing what you want to change
- **Include context** about the current behavior and desired outcome
- **Test changes** in both single-user and multi-user modes
- **Update documentation** to reflect any new features or changes
- **Use version control** to track and review AI-generated changes

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **AI**: Google Gemini API
- **Storage**: IndexedDB for persistent data
- **Network**: WebSocket for multi-user support

## Requirements

- **Node.js** 16+ and npm
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Google Gemini API key** (free credits available)

## Troubleshooting

### **Electron Build Issues** (Recently Resolved)

**Build Script Exits Silently**: 
- **Cause**: ES module detection failures in build scripts
- **Solution**: Fixed with proper `fileURLToPath` usage in `scripts/build-windows-dist.js`
- **Prevention**: Always use Node.js ES module utilities for path handling

**"Cannot access 'process' before initialization" Error**:
- **Cause**: Variable naming conflict with global `process` object
- **Solution**: Renamed variables to `childProcess` to avoid conflicts
- **Prevention**: Never use global object names as variable names

**Electron Builder Configuration Errors**:
- **Cause**: Invalid properties in `package-electron.json` (name, version, author)
- **Solution**: Cleaned configuration to only include electron-builder valid properties
- **Prevention**: Use electron-builder documentation to verify configuration properties

**"Application entry file does not exist" Error**:
- **Cause**: File extension mismatch between build output (.cjs) and configuration (.js)
- **Solution**: Updated package.json main field to use `.cjs` extension
- **Prevention**: Ensure file extensions match between build output and configuration

**PowerShell Command Syntax Errors**:
- **Cause**: Using bash-style `&&` operators in PowerShell
- **Solution**: Use PowerShell-appropriate syntax with semicolons or separate commands
- **Prevention**: Use platform-appropriate command syntax

### **Development Issues**

**Concurrently Not Recognized**: 
- **Cause**: `concurrently` package not installed or PATH issues
- **Solutions**: 
  - Run `npm install` to ensure all dependencies are installed
  - Use Windows alternatives: `npm run dev:full:win` or `npm run dev:full:ps`
  - Run services separately: `npm run dev:server` and `npm run dev:client`

**Port Already in Use**:
- **Port 8080**: WebSocket server port conflict
- **Port 3000**: Vite development server port conflict
- **Solutions**: 
  - Kill existing processes using the ports
  - Vite will automatically try alternative ports (3000, 3001, 3002, etc.)
  - Check `netstat -ano | findstr :8080` on Windows

**Build Issues**: 
- Ensure Node.js 16+ is installed
- Verify API key is set correctly in `.env` file
- Run `npm install` to ensure all dependencies are installed

### **Application Issues**

**API Rate Limits**: Reduce simulation speed to "Slow" or "Off" in settings
**Clear Past Chats**: To clear channel message history, go to Configure Simulation → Clear logs (from the Channels section)
**Network Connection**: Check that port 8080 is available for network mode

## Recent Updates

### v1.19.7 - Complete Distribution Build
- 🎉 **Complete Windows EXE build** - Successfully built and tested
- 📦 **Distribution ready** - Station-V-Portable.zip (138.51 MB) created
- 🔧 **Fixed** Electron builder configuration errors
- ✅ **All fixes applied** - UI blank, network timeout, and date conversion fixes included

### v1.19.6 - Dependency Updates
- ⬆️ **Updated** @vitejs/plugin-react to 5.1.0
- ⬆️ **Updated** TypeScript to 5.9.3
- ⬆️ **Updated** cross-env to 10.1.0
- ⬆️ **Updated** electron-builder to 25.1.8
- ⬆️ **Updated** wait-on to 8.0.5
- ⬆️ **Updated** @types/electron to 1.6.12
- ✨ **Improved** Development experience with latest tooling
- ✅ **Verified** All components using modern React patterns (hooks, functional components)
- ✅ **Ready** For latest React 19.2.0 features
- 🎉 **Distribution ready** - Complete Windows EXE build tested and verified

### v1.19.5 - Network Connection Improvements
- 🔧 **Fixed** Network connection timeout issues - connections now timeout after 10 seconds
- ✨ **Improved** Error messages for failed network connections
- 🐛 **Fixed** Hanging connections when server is not running
- 📝 **Enhanced** Error handling to distinguish between timeout, refused, and network errors

### v1.19.4 - Date Conversion Fix
- 🔧 **Fixed** TypeError "firstMet.getTime is not a function" in relationship memory service
- ✨ **Improved** Date handling in relationship memory to properly convert date strings from storage
- 🐛 **Prevented** UI from going blank when relationship data is loaded from storage

### v1.19.3 - Critical UI Blank Fix
- 🐛 **Fixed** Critical bug where UI would go completely blank after sending messages in web mode
- 🔧 **Enhanced** PM conversation creation to handle network users and unknown users gracefully
- ✨ **Improved** Error handling in `addMessageToContext` to prevent UI disappearing
- 📝 **Updated** CHANGELOG with comprehensive bug fix details

### v1.19.2 - UI Disappearing Bug Fix
- 🐛 **Fixed** UI disappearing bug when attempting to write a message to a user in private messages
- ✨ **Improved** Private message handling with fallback user creation when user not found
- 📝 **Updated** CHANGELOG with detailed bug fix information

### v1.19.1 - Main Codebase Documentation Update
- 📌 **Added** `MAIN_CODEBASE.md` - Documents this as the main active codebase
- 🔧 **Fixed** UI disappearing bug while typing messages (App.tsx)
- 📝 **Updated** README with active codebase notice
- 🗂️ **Created** ARCHIVE folder for old documentation
- ✅ **Verified** all repository references point to correct GitHub repo

### v1.19.0 - Desktop Executable Repository (Major Milestone)
- **Dedicated desktop repository** - Separated from main web application for focused development
- **Standalone Windows executable** - Complete desktop application with auto-starting IRC server
- **Cross-platform support** - Windows, macOS, and Linux builds with portable distribution
- **Enhanced build process** - Robust error handling and comprehensive logging
- **Critical debugging resolved** - Fixed multiple silent failures and configuration issues
- **Desktop-focused development** - Optimized for Electron and native desktop features

#### **The 2-3 Hour Debugging Marathon** 🐛
The multiplatform executable build required extensive debugging to resolve several critical issues:

**Silent Script Failures**: The build script was exiting with no output, leaving empty release directories. This was caused by ES module detection failures that required proper `fileURLToPath` usage instead of string concatenation.

**Variable Naming Conflicts**: Build process was failing with "Cannot access 'process' before initialization" errors due to using `process` as a variable name, conflicting with the global `process` object.

**Electron Builder Configuration Errors**: The electron-builder was rejecting configuration files with "unknown property" errors because `package-electron.json` contained non-electron-builder properties like `name`, `version`, and `author`.

**File Extension Mismatches**: The main entry point referenced `.js` files but the build process renamed them to `.cjs` for ES module compatibility, causing "file not found" errors in the packaged application.

**PowerShell Command Syntax**: Cross-platform command issues where bash-style `&&` operators don't work in PowerShell environments.

**Result**: After extensive debugging, the build process now works reliably with comprehensive error handling, step-by-step logging, and proper cross-platform compatibility.

#### **Future Development Plans** 🚀

This **desktop executable repository** focuses exclusively on:

- **Desktop Application Features** - Native menus, system integration, and platform-specific optimizations
- **Cross-Platform Builds** - Windows, macOS, and Linux executable creation
- **Distribution Methods** - Portable distributions, installers, and app store packages
- **Electron-Specific Enhancements** - Performance optimizations and native integrations

The main Station V web application continues to be developed in the [original repository](https://github.com/TimoP80/station-v-virtual-chat-simulator), while this repository focuses on desktop distribution and Electron-specific features.

### v1.17.0 - Text Formatting & UI Improvements
- **Rich text formatting** - Bold, italic, code blocks, spoilers, and colored text
- **Mobile optimization** - Responsive design for smartphones and tablets
- **User list fixes** - Proper user display when joining channels
- **Channel management** - Improved close button behavior and channel list

### v1.16.0 - Multilingual Support
- **Multilingual personalities** - Write descriptions in any language
- **Cultural authenticity** - AI generates culturally appropriate responses
- **Enhanced templates** - New personality archetypes for different cultures
- **Language diversity** - Support for 25+ languages with proper fluency levels

## License

Open source - see project files for details.

## Contact

**Timo Pitkänen**
- Email: timbor@saunagames.fi
- Website: [www.saunagames.fi/timbor](https://www.saunagames.fi/timbor)

---

*Station V - Where AI personalities come to life in a classic IRC environment.*
