# Test Wrapper - Quick Reference

## 🚀 Quick Start (Choose One)

### Option 1: npm (Recommended)
```bash
npm run test:wrapper dev
```

### Option 2: Batch File
```bash
test-wrapper.bat dev
```

### Option 3: PowerShell
```powershell
.\test-wrapper.ps1 dev
```

### Option 4: Standalone Exe
```bash
npm run build:wrapper
dist-wrapper/station-v-test.exe dev
```

---

## 📋 All Commands

```bash
# Development
npm run test:wrapper dev          # Start dev servers (port 3000 & 8081)
npm run test:wrapper electron     # Start Electron app

# Building
npm run test:wrapper build        # Build for production
npm run test:wrapper package      # Create Windows exe

# Testing
npm run test:wrapper test         # Run tests

# Help
npm run test:wrapper help         # Show help
npm run test:wrapper              # Show help (default)
```

---

## 🎯 Common Workflows

### Web Development
```bash
npm run test:wrapper dev
# Open http://localhost:3000
# Edit code → Auto-reload in browser
```

### Desktop App Testing
```bash
npm run test:wrapper electron
# Test Electron window
# Check functionality
```

### Building for Release
```bash
npm run test:wrapper build
npm run test:wrapper package
# Check release/ directory
```

### Creating Standalone Exe
```bash
npm run build:wrapper
# Find exe at: dist-wrapper/station-v-test.exe
# Distribute to testers
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| npm not found | Install Node.js from nodejs.org |
| Batch won't run | Make sure you're in project root |
| PowerShell error | Run as Admin, then `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Exe won't run | Run `npm run build:wrapper` first |

---

## 📁 File Locations

```
project-root/
├── scripts/
│   ├── test-wrapper.js           ← Main wrapper
│   └── build-test-wrapper.js     ← Build script
├── test-wrapper.bat              ← Batch launcher
├── test-wrapper.ps1              ← PowerShell launcher
├── dist-wrapper/
│   └── station-v-test.exe        ← Standalone exe (after build)
└── Documentation:
    ├── QUICK_TEST_GUIDE.md       ← Start here
    ├── TEST_WRAPPER_README.md    ← Full docs
    ├── TEST_WRAPPER_SETUP.md     ← Setup guide
    └── WRAPPER_QUICK_REFERENCE.md ← This file
```

---

## 🌐 Server Ports

| Service | Port | URL |
|---------|------|-----|
| WebSocket Server | 8081 | ws://localhost:8081 |
| Web UI | 3000 | http://localhost:3000 |

---

## 📊 Performance

| Task | Time |
|------|------|
| Wrapper startup | < 100ms |
| Dev server startup | ~3-5s |
| Electron startup | ~5-10s |
| Build | ~30-60s |
| Package | ~2-5m |

---

## 🎨 Output Colors

```
🟦 Blue   - Information messages
🟨 Yellow - Commands being run
🟩 Green  - Success messages
🟥 Red    - Error messages
🟦 Cyan   - Section headers
```

---

## 💡 Tips & Tricks

### Tip 1: Keep Dev Server Running
```bash
npm run test:wrapper dev
# Keep this running in one terminal
# Make changes in another terminal
# Changes auto-reload in browser
```

### Tip 2: Check Logs
```bash
# Dev server logs appear in terminal
# Check browser console for client errors
# Check terminal for server errors
```

### Tip 3: Distribute Exe
```bash
npm run build:wrapper
# Share dist-wrapper/station-v-test.exe with testers
# They can run it without Node.js installed
```

### Tip 4: Add to PATH
```bash
# Add dist-wrapper to Windows PATH
# Then run from anywhere: station-v-test.exe dev
```

---

## 🔗 Related Documentation

- **Getting Started**: `QUICK_TEST_GUIDE.md`
- **Full Documentation**: `TEST_WRAPPER_README.md`
- **Setup & Integration**: `TEST_WRAPPER_SETUP.md`
- **Implementation Details**: `WRAPPER_IMPLEMENTATION_SUMMARY.md`

---

## ❓ FAQ

**Q: Do I need Node.js to run the exe?**
A: No! The standalone exe includes Node.js.

**Q: Can I use this in CI/CD?**
A: Yes! Use `npm run test:wrapper build` in your pipeline.

**Q: How do I add new commands?**
A: Edit `scripts/test-wrapper.js` and add a new function.

**Q: What if a command fails?**
A: Check the error message and see troubleshooting section.

**Q: Can I run multiple commands?**
A: Yes, but dev/electron servers need separate terminals.

---

## 🚀 Ready to Go!

```bash
# Start here:
npm run test:wrapper dev

# Then open:
http://localhost:3000
```

Happy testing! 🎉

