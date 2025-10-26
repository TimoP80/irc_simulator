# Repository Setup Guide

## Overview

This guide helps you set up the `station_v_executable` repository for separate distribution of the Station V desktop application.

## Quick Setup

### 1. Initialize Repository
```bash
npm run setup:repo
```

This will:
- Initialize git repository (if not already done)
- Add all files to git
- Create initial commit
- Provide next steps

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `station_v_executable`
3. Description: "Station V - Virtual IRC Simulator Desktop Executable"
4. Make it public or private as needed
5. **Don't** initialize with README, .gitignore, or license (we already have these)

### 3. Update Repository URLs

**Important**: The repository URLs have been updated to use the TimoP80 GitHub repository.

#### package.json
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/TimoP80/station_v_executable.git"
  },
  "homepage": "https://github.com/TimoP80/station_v_executable#readme",
  "bugs": {
    "url": "https://github.com/TimoP80/station_v_executable/issues"
  }
}
```

#### README.md
Update these sections:
- Clone URL in Quick Start section
- Original repository link in the note section
- Any other GitHub URLs

### 4. Connect to GitHub

```bash
# Add remote origin
git remote add origin https://github.com/TimoP80/station_v_executable.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## Repository Structure

```
station_v_executable/
├── README.md                    # Desktop-focused documentation
├── DESKTOP_DISTRIBUTION_GUIDE.md # Comprehensive desktop build guide
├── package.json                 # Updated with desktop repository info
├── scripts/
│   ├── setup-repository.js     # Repository setup script
│   ├── build-windows-dist.js   # Windows build script
│   ├── create-portable-exe.js  # Portable distribution script
│   └── create-single-exe.js    # Single executable script
├── electron/                    # Electron main process
├── dist/                       # Built React application
├── dist-electron/              # Built Electron files
├── release/                    # Built executables and distributions
└── ...                         # All other Station V files
```

## Key Differences from Main Repository

### Focus Areas
- **Desktop Application Development** - Electron-specific features
- **Cross-Platform Builds** - Windows, macOS, Linux executables
- **Distribution Methods** - Portable, installers, single executables
- **Native Desktop Features** - Menus, shortcuts, system integration

### Documentation
- **Desktop-First README** - Emphasizes desktop capabilities
- **Comprehensive Build Guide** - Complete desktop distribution instructions
- **Repository Setup Guide** - This file for easy setup

### Scripts
- **Desktop Build Scripts** - Optimized for executable creation
- **Distribution Scripts** - Portable and single executable creation
- **Repository Setup** - Automated git repository initialization

## Development Workflow

### Desktop Development
```bash
# Development with Electron
npm run electron:dev

# Build Windows executable
npm run electron:build:win

# Create portable distribution
npm run electron:build:portable

# Test executable
npm run electron:test
```

### Web Development (Still Available)
```bash
# Web development
npm run dev

# Full development with server
npm run dev:full
```

## Distribution

### Ready-to-Distribute Files
- `Station-V-Portable.zip` - Complete portable distribution (~138 MB)
- `release/win-unpacked/` - Unpacked executable directory
- Build scripts for creating single executables

### Distribution Methods
1. **ZIP Distribution** - Immediate distribution, no installation
2. **Single Executable** - Using Enigma Virtual Box, BoxedApp Packer, etc.
3. **Future Installers** - When Windows permissions are resolved

## Maintenance

### Updating from Main Repository
When the main Station V repository is updated:

1. **Check for relevant updates** in the main repository
2. **Merge desktop-specific changes** into this repository
3. **Update version numbers** and changelog
4. **Test desktop builds** to ensure compatibility
5. **Update documentation** if needed

### Version Management
- **Follow semantic versioning** (major.minor.patch)
- **Update package.json version** for releases
- **Update README version** in the title
- **Create git tags** for releases

## Success Criteria

✅ **Repository Setup Complete**:
- Git repository initialized
- GitHub repository created
- Remote origin configured
- Initial commit pushed

✅ **Documentation Updated**:
- README reflects desktop focus
- Repository URLs updated
- Setup guide created
- Build instructions clear

✅ **Build Process Working**:
- Desktop executable builds successfully
- Portable distribution creates correctly
- All scripts function properly
- Documentation is accurate

## Next Steps

1. **Complete repository setup** using the steps above
2. **Test the build process** to ensure everything works
3. **Create first release** with proper versioning
4. **Share the repository** for desktop distribution
5. **Maintain separation** from main web repository

This desktop repository provides a focused, clean environment for desktop application development and distribution while maintaining all the functionality of the original Station V application.
