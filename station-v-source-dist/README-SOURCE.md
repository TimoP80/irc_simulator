# Station V - Source Distribution

## 📦 What is This?

This is a **complete source code distribution** of Station V - Virtual IRC Simulator, containing all files necessary to build the desktop application from source.

## 🗂️ Contents

### Core Application Files
- **`App.tsx`** - Main application component
- **`index.tsx`** - Application entry point
- **`types.ts`** - TypeScript type definitions
- **`constants.ts`** - Application constants

### Source Directories
- **`components/`** - React UI components (24 components)
- **`services/`** - Business logic services (10 services)
- **`utils/`** - Utility functions (8 utilities)
- **`electron/`** - Electron desktop application files
- **`scripts/`** - Build and development scripts
- **`server/`** - WebSocket server files
- **`src/`** - CSS stylesheets

### Configuration Files
- **`package.json`** - Node.js package configuration
- **`package-electron.json`** - Electron-specific configuration
- **`vite.config.ts`** - Vite build configuration
- **`tsconfig.json`** - TypeScript configuration
- **`tsconfig.electron.json`** - Electron TypeScript configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration
- **`default-config.json`** - Default application configuration
- **`metadata.json`** - Application metadata

### Documentation
- **`README.md`** - Main project documentation
- **`MAIN_CODEBASE.md`** - Repository status and documentation
- **`DESKTOP_DISTRIBUTION_GUIDE.md`** - Desktop build guide
- **`NETWORK_SETUP.md`** - Network setup instructions
- **`REPOSITORY_SETUP_GUIDE.md`** - Repository setup guide
- **`CHANGELOG.md`** - Version history

---

## 🚀 Building from Source

### Prerequisites

1. **Node.js** 16+ and npm
2. **Google Gemini API key** (free credits available)
3. **Modern development environment**

### Installation

```bash
# Install dependencies
npm install

# Create environment file
echo GEMINI_API_KEY=your_api_key_here > .env
```

### Development

```bash
# Single user development
npm run dev

# Full development with server
npm run dev:full

# Electron development
npm run electron:dev
```

### Building Desktop Executables

```bash
# Build Windows executable
npm run electron:build:win

# Create portable distribution
npm run electron:build:portable

# Test the executable
npm run electron:test
```

### Building Web Application

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Project Structure

```
station-v-source-dist/
├── components/         # React UI components
├── services/          # Business logic
├── utils/            # Utility functions
├── electron/         # Desktop application
├── scripts/          # Build scripts
├── server/           # WebSocket server
├── src/              # Stylesheets
├── App.tsx           # Main application
├── index.tsx         # Entry point
├── types.ts          # TypeScript types
├── constants.ts      # Constants
├── package.json      # Dependencies
└── vite.config.ts    # Build config
```

---

## 🔧 Development Commands

### Basic Commands
```bash
npm install           # Install dependencies
npm run build         # Build for production
npm run preview       # Preview production build
npm run dev           # Start development server
```

### Development Options
```bash
npm run dev           # Vite client only
npm run dev:server    # WebSocket server only
npm run dev:client    # Alias for 'npm run dev'
npm run dev:full      # Both server and client
```

### Electron Commands
```bash
npm run electron:dev           # Electron development
npm run electron:build:win    # Build Windows executable
npm run electron:build:portable # Create portable ZIP
npm run electron:test          # Test built executable
npm run electron:clean        # Clean build artifacts
```

### Utility Commands
```bash
npm run clean                  # Clean dist and release
npm run clean:all             # Clean everything
npm run type-check            # TypeScript type checking
npm run troubleshoot          # Run diagnostics
```

---

## 🐛 Troubleshooting

### Build Issues
- Ensure Node.js 16+ is installed
- Verify API key is set in `.env` file
- Run `npm install` to ensure all dependencies are installed
- Check `npm run troubleshoot` for diagnostics

### Development Issues
- Port already in use: Kill existing processes using ports 3000/8080
- Concurrently not working: Use `npm run dev:full:win` on Windows
- Build failures: Run `npm run clean` and rebuild

### Electron Build Issues
- Missing files: Ensure `npm run build` completes successfully
- Permission errors: Run as administrator if needed
- Code signing errors: Normal, doesn't affect the executable

---

## 📚 Documentation

### Main Documentation
- **`README.md`** - Complete project documentation
- **`MAIN_CODEBASE.md`** - Repository status and quick reference

### Build Guides
- **`DESKTOP_DISTRIBUTION_GUIDE.md`** - Desktop executable build guide
- **`NETWORK_SETUP.md`** - Network functionality setup
- **`REPOSITORY_SETUP_GUIDE.md`** - Repository setup instructions

### Version History
- **`CHANGELOG.md`** - Complete version history

---

## 🎯 Project Features

### AI-Powered Simulation
- Fully AI-driven virtual users
- Real-time conversations
- Enhanced AI memory system
- Advanced personality customization

### Desktop Application
- Native window controls
- Cross-platform support (Windows, macOS, Linux)
- Portable distribution
- Standalone executables

### Network Mode
- Multi-user support
- WebSocket server
- Real-time communication
- Cross-tab synchronization

### Rich Features
- Discord-style quoting
- Relationship memory system
- Text formatting support
- Chat log management
- User management
- Channel management

---

## 🔗 Repository Information

**GitHub**: https://github.com/TimoP80/station_v_executable  
**Version**: 1.19.1  
**License**: See LICENSE.txt

---

## 📧 Contact

**Timo Pitkänen**
- Email: timbor@saunagames.fi
- Website: https://www.saunagames.fi/timbor

---

*This source distribution contains all files necessary to build Station V from source. Last updated: January 2025*

