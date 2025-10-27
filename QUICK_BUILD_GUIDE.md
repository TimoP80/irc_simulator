# ⚡ Quick Build Guide - Station V EXE

## 🚀 Build Portable EXE (Recommended)

**One command to build everything:**
```bash
npm run electron:build:all
```

**What it does:**
1. Builds the React application
2. Compiles the Electron main process  
3. Packages everything into a Windows executable
4. Creates a portable ZIP distribution

**Output:**
- `release/win-unpacked/Station V - Virtual IRC Simulator.exe` - The executable
- `release/Station-V-Portable.zip` - Portable ZIP file (ready to distribute)

---

## 📦 What Users Get

Users receive a ZIP file that contains:
- `Station V - Virtual IRC Simulator.exe` - The main executable
- All dependencies bundled
- Configuration files

**User Instructions:**
1. Extract the ZIP file
2. Run the `.exe` file
3. Done! No installation required.

---

## 🛠️ Step-by-Step Commands

If you prefer to run steps separately:

### Step 1: Build the Application
```bash
npm run electron:build:win
```

### Step 2: Create Portable Distribution
```bash
npm run electron:build:portable
```

---

## 📝 Available Build Scripts

| Command | Description |
|---------|-------------|
| `npm run electron:build:all` | Build everything + create ZIP |
| `npm run electron:build:win` | Build Windows executable only |
| `npm run electron:build:portable` | Create ZIP from existing build |
| `npm run electron:build:single` | Create single exe guides |
| `npm run electron:clean` | Clean build artifacts |
| `npm run electron:test` | Test the built executable |
| `npm run electron:dev` | Development mode with hot reload |

---

## 🎯 Different Build Options

### Option 1: Development Build
```bash
npm run electron:dev
```
- Hot reload enabled
- Developer tools available
- Faster iteration

### Option 2: Production Build
```bash
npm run electron:build:all
```
- Optimized build
- Portable ZIP ready
- Production-ready executable

### Option 3: Custom Build
```bash
# Clean first
npm run electron:clean

# Build application
npm run build

# Package as executable
npx electron-builder --win --config package-electron.json
```

---

## 📂 Output Structure

After running `npm run electron:build:all`:

```
release/
├── win-unpacked/                          # Unpacked executable (use this for testing)
│   ├── Station V - Virtual IRC Simulator.exe
│   └── ... (all dependencies)
│
├── Station-V-Portable.zip                # ⭐ Distribution file
├── README-Portable.txt                    # User instructions
└── Station-V-Launcher.bat                # Launcher script
```

---

## ⚠️ Troubleshooting

### Build Fails?
```bash
# Clean up running processes first
npm run electron:cleanup

# Then try building again
npm run electron:build:all
```

### Permission Errors?
```bash
# Close Electron processes
taskkill /F /IM electron.exe

# Or use the cleanup script
npm run electron:cleanup

# Then build
npm run electron:build:all
```

See `TROUBLESHOOTING_PERMISSIONS.md` for detailed help.

### Code Signing Warnings?
**These are expected and safe to ignore.** The build script automatically suppresses most warnings. See `CODE_SIGNING_GUIDE.md` for details.

### Executable Won't Start?
1. Check `release/win-unpacked/` folder exists
2. Try running the exe directly
3. Check Windows Defender isn't blocking it
4. Run as administrator if needed

---

## 🎨 Testing Your Build

### Test the Built Executable
```bash
npm run electron:test
```

### Manual Test
Navigate to `release/win-unpacked/` and double-click:
```
Station V - Virtual IRC Simulator.exe
```

---

## 📊 File Sizes

Approximate sizes:
- **Unpacked folder**: ~145 MB
- **ZIP file**: ~50-100 MB (compressed)
- **Single executable**: ~150-200 MB (requires external tools)

---

## 💡 Tips

### For Distribution
- Share the `Station-V-Portable.zip` file
- Users extract and run - no installation needed
- Works from USB drive
- No admin privileges required

### For Testing
- Use `release/win-unpacked/` folder directly
- Test all features before distributing
- Check that all assets load correctly

### For Development
- Use `npm run electron:dev` for fastest iteration
- Hot reload works on save
- Developer tools available

---

## 📖 Additional Documentation

- **Detailed Guide**: `BUILD_EXE_MANUAL_GUIDE.md`
- **Code Signing**: `CODE_SIGNING_GUIDE.md`  
- **Distribution**: `DESKTOP_DISTRIBUTION_GUIDE.md`

---

## ✅ Success Indicators

You'll know the build succeeded when you see:

```
✅ Executable created successfully
📁 Location: release/win-unpacked/Station V - Virtual IRC Simulator.exe
🎉 Portable distribution created successfully!
📄 Station-V-Portable.zip
```

Then you can:
1. Test it: `release/win-unpacked/Station V - Virtual IRC Simulator.exe`
2. Distribute: `release/Station-V-Portable.zip`
3. Done! 🎉

