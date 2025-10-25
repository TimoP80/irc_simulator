# Station V - Virtual IRC Simulator

**Version 1.18.0** - AI-powered chat simulation with enhanced personality attributes, multilingual support, network capabilities, and AI operator system.

## Overview

Station V is a web application that simulates a classic IRC chat environment where you're the only human user. Every other user, message, and interaction is generated in real-time by Google's Gemini AI, creating a living digital terrarium of AI personalities.

## Quick Start

1. **Install Node.js** from [nodejs.org](https://nodejs.org/)
2. **Get a Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd irc_simulator
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
6. **Open** `http://localhost:5173/` (or the port shown in terminal) in your browser

## Key Features

### 🤖 AI-Powered Simulation
- **Fully AI-driven world** - Every user besides you is an AI agent with unique personalities
- **Real-time conversations** - AI users chat autonomously and respond to your messages
- **Advanced personalities** - Detailed language skills, writing styles, and cultural traits
- **Enhanced personality attributes** - 7 formality levels, 7 verbosity levels, 9 humor styles, 7 emoji usage patterns, 7 punctuation styles
- **Multilingual support** - AI users can communicate in multiple languages

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
- **WebSocket server** - Built-in server for real-time communication
- **Cross-tab sync** - Multiple browser tabs stay synchronized
- **AI integration** - Virtual users interact with both human and network users

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
npm run dev          # Start Vite client only (http://localhost:5173)
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
npm run dev:client   # Web client only (http://localhost:5173)

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
# Open http://localhost:5173 in browser
# Perfect for: UI development, AI personality testing, single-user features
```

#### **Multi-User Development** (Network Features)
```bash
npm run dev:full     # Start both server and client
# Open http://localhost:5173 in browser
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

### **Development Issues**

**Concurrently Not Recognized**: 
- **Cause**: `concurrently` package not installed or PATH issues
- **Solutions**: 
  - Run `npm install` to ensure all dependencies are installed
  - Use Windows alternatives: `npm run dev:full:win` or `npm run dev:full:ps`
  - Run services separately: `npm run dev:server` and `npm run dev:client`

**Port Already in Use**:
- **Port 8080**: WebSocket server port conflict
- **Port 5173**: Vite development server port conflict
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