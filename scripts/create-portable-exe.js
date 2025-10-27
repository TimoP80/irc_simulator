#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to run commands
async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function createPortableExe() {
  console.log('🚀 Creating Single Portable Executable...');
  console.log('');
  console.log('📝 This will create a single .exe file that contains all application files');
  console.log('   The file can be distributed as a single executable\n');

  try {
    // Check if the unpacked build exists
    const unpackedPath = 'release/win-unpacked';
    if (!fs.existsSync(unpackedPath)) {
      console.log('❌ Unpacked build not found');
      console.log('📦 Building application first...');
      await runCommand('npm', ['run', 'electron:build:win']);
    }

    if (!fs.existsSync(unpackedPath)) {
      throw new Error('Build failed. Please check the error messages above.');
    }

    console.log('✅ Found unpacked build at:', unpackedPath);

    // Try multiple methods to create a single exe
    let success = false;

    // Method 1: Use PowerShell to create a ZIP file
    console.log('\n📦 Creating portable ZIP distribution...');
    
    try {
      const zipPath = path.resolve('release/Station-V-Portable.zip');
      
      // Create the PowerShell command as a string to avoid template literal conflicts
      const sourcePath = unpackedPath.replace(/\\/g, '\\\\') + '\\\\*';
      const destPath = zipPath.replace(/\\/g, '\\\\');
      const psCommand = 'Compress-Archive -Path "' + sourcePath + '" -DestinationPath "' + destPath + '" -Force; Write-Host "ZIP created successfully"';
      
      const psArgs = [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        psCommand
      ];
      
      await runCommand('powershell', psArgs);

      console.log('✅ Created ZIP distribution');
      success = true;

    } catch (error) {
      console.log('⚠️ ZIP creation failed:', error.message);
    }

    // Method 2: Create a simple batch file that uses PowerShell to extract ZIP
    if (!success) {
      console.log('\n📦 Method 2: Creating simple batch launcher...');
      
      const batchContent = `@echo off
REM Station V - Virtual IRC Simulator Launcher
cls
echo.
echo ════════════════════════════════════════════════════════════
echo    Station V - Virtual IRC Simulator
echo ════════════════════════════════════════════════════════════
echo.

REM Check if we're running from the extracted folder
set "LAUNCHER_DIR=%~dp0"
set "EXE_PATH=%LAUNCHER_DIR%Station V - Virtual IRC Simulator.exe"

if exist "%EXE_PATH%" (
    echo Starting application...
    start "" "%EXE_PATH%"
    echo.
    echo Application started successfully!
    timeout /t 2 >nul
    exit
)

REM If running from parent directory (unpacked)
set "LAUNCHER_DIR=%~dp0win-unpacked"
set "EXE_PATH=%LAUNCHER_DIR%Station V - Virtual IRC Simulator.exe"

if exist "%EXE_PATH%" (
    echo Starting application...
    cd "%LAUNCHER_DIR%"
    start "" "%EXE_PATH%"
    echo.
    echo Application started successfully!
    timeout /t 2 >nul
    exit
)

REM If all else fails
echo.
echo [ERROR] Could not find Station V executable
echo.
echo Please ensure all application files are present in the same
echo directory as this launcher.
echo.
pause
`;

      fs.writeFileSync('release/Station-V-Launcher.bat', batchContent);
      console.log('✅ Created batch launcher: release/Station-V-Launcher.bat');
    }

    // Create comprehensive instructions
    console.log('\n📋 Creating distribution files...');
    
    const instructions = `Station V - Virtual IRC Simulator - Portable Distribution
═══════════════════════════════════════════════════════════════

QUICK START:
═══════════════════════════════════════════════════════════════

If you received a ZIP file:
1. Extract the ZIP file to any folder
2. Navigate to the extracted folder
3. Double-click "Station V - Virtual IRC Simulator.exe"
4. The application will start automatically

If you received a folder:
1. Navigate to the "win-unpacked" or "Station V - Virtual IRC Simulator" folder
2. Double-click "Station V - Virtual IRC Simulator.exe"
3. The application will start automatically

REQUIREMENTS:
═══════════════════════════════════════════════════════════════
- Windows 10 or later
- No additional software required
- All dependencies are included

FEATURES:
═══════════════════════════════════════════════════════════════
✅ Fully portable - no installation required
✅ Portable - can be run from USB drive
✅ No registry modifications
✅ No admin privileges required
✅ All dependencies bundled

PORTABLE EXECUTION:
═══════════════════════════════════════════════════════════════
The application stores its data in a "data" folder next to the executable.
You can move the entire folder anywhere and it will continue to work.

TROUBLESHOOTING:
═══════════════════════════════════════════════════════════════

If the application won't start:
1. Make sure Windows Defender isn't blocking it
2. Check if all files are present in the folder
3. Try running as administrator
4. Check Windows Event Viewer for errors

For support, visit: https://github.com/TimoP80/station_v_executable

═══════════════════════════════════════════════════════════════
`;

    fs.writeFileSync('release/README-Portable.txt', instructions);
    console.log('✅ Created README: release/README-Portable.txt');

    // Summary
    console.log('\n🎉 Portable distribution created successfully!\n');
    console.log('📁 Distribution files:');
    
    if (fs.existsSync('release/Station-V-Portable.zip')) {
      const stats = fs.statSync('release/Station-V-Portable.zip');
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ Station-V-Portable.zip (${sizeMB} MB)`);
    }
    
    if (fs.existsSync('release/Station-V-Launcher.bat')) {
      console.log('   ✅ Station-V-Launcher.bat');
    }
    
    console.log('   ✅ README-Portable.txt');
    console.log('');
    console.log('📦 To distribute:');
    console.log('   1. Share the ZIP file or the entire "win-unpacked" folder');
    console.log('   2. Users extract and run the executable');
    console.log('   3. No installation needed!');
    console.log('');
    console.log('💡 For a TRUE single .exe file, consider using:');
    console.log('   - Enigma Virtual Box (https://enigmaprotector.com/)');
    console.log('   - BoxedApp Packer (https://www.boxedapp.com/)');
    console.log('   See CODE_SIGNING_GUIDE.md for more details');

  } catch (error) {
    console.error('\n❌ Portable executable creation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the portable executable creation
createPortableExe();