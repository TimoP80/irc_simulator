# 🌍 Station V - Multiplatform Standalone Executable

## 🎯 **Overview**

Station V can now be built as a standalone executable for Windows, macOS, and Linux platforms. The application includes the IRC server and runs completely independently without requiring Node.js installation.

## 🚀 **Build Commands**

### **Current Platform Build**
```bash
npm run electron:build          # Build for current platform
```

### **Specific Platform Builds**
```bash
npm run electron:build:win     # Windows (NSIS installer + Portable)
npm run electron:build:mac      # macOS (DMG + ZIP)
npm run electron:build:linux    # Linux (AppImage + DEB + RPM)
```

### **All Platforms Build**
```bash
npm run electron:build:all     # Build for all platforms
```

## 📱 **Platform Support**

### **Windows**
- **NSIS Installer**: Full installer with desktop/start menu shortcuts
- **Portable**: Single executable that runs without installation
- **Architectures**: x64, ia32 (32-bit)
- **Features**: Auto-start server, native Windows menus

### **macOS**
- **DMG**: Disk image installer for easy installation
- **ZIP**: Portable archive for direct execution
- **Architectures**: x64 (Intel), arm64 (Apple Silicon)
- **Features**: Native macOS integration, proper app bundle

### **Linux**
- **AppImage**: Universal Linux executable
- **DEB**: Debian/Ubuntu package
- **RPM**: Red Hat/Fedora package
- **Architecture**: x64
- **Features**: Desktop integration, proper Linux packaging

## 🔧 **Standalone Features**

### **Self-Contained**
- ✅ **No Node.js Required**: Includes all dependencies
- ✅ **Auto-Start Server**: IRC server starts automatically
- ✅ **Portable**: Runs from any location
- ✅ **Cross-Platform**: Works on Windows, macOS, Linux

### **Platform Optimizations**
- **Windows**: Hidden menu bar, Windows-style title bar
- **macOS**: Native macOS title bar, proper app bundle structure
- **Linux**: Desktop integration, proper package management

## 📁 **Build Output**

After building, check the `dist-electron` directory for:

### **Windows**
- `Station V - Virtual IRC Simulator Setup.exe` (NSIS installer)
- `Station V - Virtual IRC Simulator.exe` (Portable executable)

### **macOS**
- `Station V - Virtual IRC Simulator.dmg` (Disk image)
- `Station V - Virtual IRC Simulator.zip` (Portable archive)

### **Linux**
- `Station V - Virtual IRC Simulator.AppImage` (Universal executable)
- `Station V - Virtual IRC Simulator.deb` (Debian package)
- `Station V - Virtual IRC Simulator.rpm` (Red Hat package)

## 🛠️ **Development**

### **Development Mode**
```bash
npm run electron:dev            # Start development environment
```

### **Testing**
```bash
npm run electron:test           # Test Electron build
npm run electron:clean          # Clean build artifacts
npm run electron:rebuild         # Clean rebuild
```

## 🔒 **Security Features**

- **Context Isolation**: Secure renderer process
- **No Node Integration**: Disabled in renderer for security
- **External Link Protection**: Opens external links in default browser
- **Navigation Restriction**: Prevents navigation to external URLs

## 📋 **System Requirements**

### **Windows**
- Windows 10/11 (x64 or x86)
- 100MB free disk space
- No additional software required

### **macOS**
- macOS 10.14+ (Intel) or macOS 11+ (Apple Silicon)
- 100MB free disk space
- No additional software required

### **Linux**
- Ubuntu 18.04+, Fedora 30+, or equivalent
- 100MB free disk space
- No additional software required

## 🎉 **Usage**

1. **Download** the appropriate installer for your platform
2. **Install** (or run portable version)
3. **Launch** Station V
4. **Server starts automatically** - no configuration needed
5. **Enjoy** your virtual IRC simulator!

## 🔧 **Troubleshooting**

### **Server Won't Start**
- Check that ports 3000 and 8080 are available
- Ensure firewall allows the application
- Run as administrator if needed (Windows)

### **Build Issues**
- Ensure all dependencies are installed: `npm install`
- Clean previous builds: `npm run electron:clean`
- Check Node.js version (18+ recommended)

### **Platform-Specific Issues**
- **Windows**: Run as administrator if port access is denied
- **macOS**: Allow the app in Security & Privacy settings
- **Linux**: Ensure executable permissions: `chmod +x`

---

**Station V is now a true multiplatform standalone application! 🎉**
