# Station V - Virtual IRC Simulator

**Version 1.17.0** - AI-powered chat simulation with multilingual personalities and network support.

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
   npm run dev
   ```
6. **Open** `http://localhost:5173/` in your browser

## Key Features

### 🤖 AI-Powered Simulation
- **Fully AI-driven world** - Every user besides you is an AI agent with unique personalities
- **Real-time conversations** - AI users chat autonomously and respond to your messages
- **Advanced personalities** - Detailed language skills, writing styles, and cultural traits
- **Multilingual support** - AI users can communicate in multiple languages

### 🎭 User Management
- **Create AI personalities** - Detailed customization with language skills and writing styles
- **Batch generation** - Create 1-50 users at once using templates or AI generation
- **Import/Export** - CSV and JSON support for sharing configurations
- **Real-time editing** - Add, edit, or remove users without stopping the simulation

### 💬 Chat Features
- **Classic IRC interface** - Three-panel layout (channels, chat, user list)
- **Private messaging** - One-on-one conversations with any AI personality
- **IRC commands** - `/nick`, `/join`, `/me`, `/who`, `/help`, and more
- **Text formatting** - Bold, italic, code blocks, spoilers, and colored text
- **Persistent logs** - All messages saved to IndexedDB with export options

### 🌐 Network Mode
- **Multi-user support** - Multiple human users can connect and chat together
- **WebSocket server** - Built-in server for real-time communication
- **Cross-tab sync** - Multiple browser tabs stay synchronized
- **AI integration** - Virtual users interact with both human and network users

### 📊 Data Management
- **Chat log database** - Complete message history with search and filtering
- **Export options** - HTML, JSON, and CSV export formats
- **Backup system** - Easy data backup and sharing capabilities
- **Storage management** - Monitor usage and clear old logs

## Configuration

### First Launch
1. **Set your nickname** - Your display name in all channels
2. **Choose AI model** - Select from available Gemini models
3. **Create users** - Add AI personalities or use batch generation
4. **Create channels** - Set up IRC channels with topics
5. **Adjust settings** - Configure simulation speed and preferences

### Simulation Speed
- **Fast**: 15 seconds (responsive, moderate API usage)
- **Normal**: 30 seconds (balanced, low API usage)  
- **Slow**: 60 seconds (conservative, very low API usage)
- **Off**: No autonomous messages (most API-friendly)

## Development

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run dev:full     # Start with network server
```

### Network Mode
```bash
npm run dev:full     # Start both server and client
npm run server       # Start WebSocket server only
npm run dev          # Start web client only
```

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

**API Rate Limits**: Reduce simulation speed to "Slow" or "Off" in settings
**Build Issues**: Ensure Node.js is installed and API key is set correctly
**Network Issues**: Check that port 8080 is available for network mode

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