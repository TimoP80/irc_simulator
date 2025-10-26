# Main Active Codebase - Station V Desktop Executable

## 📌 This is Your Main Active Codebase

**Repository**: `https://github.com/TimoP80/station_v_executable`  
**Status**: ✅ Active Development  
**Last Updated**: January 2025  
**Version**: 1.19.0  

---

## 🎯 Purpose

This is the **main active development repository** for the Station V Desktop Executable project. This codebase is actively maintained and contains the current working implementation.

### What This Repository Contains

- ✅ Complete React + TypeScript application
- ✅ Electron desktop application build system
- ✅ AI-powered IRC chat simulation
- ✅ Cross-platform executable builds (Windows, macOS, Linux)
- ✅ Recent bug fixes and feature improvements
- ✅ Updated repository references

---

## 🗂️ Repository Structure

```
station_v_executable/
├── components/          # React components (ChatWindow, UserList, etc.)
├── services/           # Business logic (AI, network, config)
├── electron/           # Electron main process files
├── scripts/            # Build and development scripts
├── server/             # WebSocket server
├── utils/               # Utility functions
├── App.tsx             # Main application entry
├── README.md           # Comprehensive documentation
├── package.json        # Project configuration
└── vite.config.ts      # Vite build configuration
```

---

## 🚀 Getting Started

### Development

```bash
# Clone the repository
git clone https://github.com/TimoP80/station_v_executable.git
cd station_v_executable

# Install dependencies
npm install

# Start development
npm run dev:full
```

### Build Desktop Executable

```bash
# Build Windows executable
npm run electron:build:win

# Create portable distribution
npm run electron:build:portable

# Test the executable
npm run electron:test
```

---

## 📚 Active Documentation

The following documentation is current and actively maintained:

- **`README.md`** - Main project documentation and getting started guide
- **`DESKTOP_DISTRIBUTION_GUIDE.md`** - Building desktop executables
- **`REPOSITORY_SETUP_GUIDE.md`** - Repository setup instructions
- **`NETWORK_SETUP.md`** - Network functionality guide

---

## 🐛 Recent Fixes

### v1.19.0 (Latest)

- ✅ **Bug Fix**: Fixed UI disappearing while typing messages (App.tsx line 5349)
- ✅ **Repository Update**: Updated all GitHub repository references to TimoP80/station_v_executable
- ✅ **Code Quality**: Resolved merge conflicts and improved documentation

---

## 🔗 Related Repositories

- **Main Web Application**: [station-v-virtual-chat-simulator](https://github.com/TimoP80/station-v-virtual-chat-simulator) - Original web-based Station V
- **This Repository**: [station_v_executable](https://github.com/TimoP80/station_v_executable) - Desktop-focused distribution

---

## 📝 Development Guidelines

### Code Standards

- **TypeScript** with strict mode enabled
- **React 19** with functional components
- **Tailwind CSS** for styling
- **ESLint** for code quality

### Git Workflow

- **Main Branch**: `main`
- **Commits**: Descriptive commit messages
- **Documentation**: Keep README updated with changes

### Testing

- Test locally before pushing to GitHub
- Build executables before major releases
- Verify cross-platform compatibility when possible

---

## ⚠️ Archive Notice

Older documentation and reference files have been archived. This repository represents the current active state of the project.

For archived files and historical reference, see: `ARCHIVE/` directory (if created).

---

## 👤 Contact

**Timo Pitkänen**
- Email: timbor@saunagames.fi
- Website: https://www.saunagames.fi/timbor
- GitHub: https://github.com/TimoP80

---

*This document serves as the primary reference for the active Station V Desktop Executable codebase. Last updated: January 2025*

