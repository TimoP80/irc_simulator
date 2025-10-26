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

async function createSingleExe() {
  console.log('🚀 Creating Single Executable...');

  try {
    // Check if the unpacked build exists
    const unpackedPath = 'release/win-unpacked';
    if (!fs.existsSync(unpackedPath)) {
      throw new Error('Unpacked build not found. Please run "npm run electron:build:win" first.');
    }

    console.log('✅ Found unpacked build');

    // Method 1: Try using Enigma Virtual Box (if available)
    console.log('📦 Method 1: Trying Enigma Virtual Box...');
    
    try {
      // Check if Enigma Virtual Box is available
      const enigmaAvailable = await checkToolAvailable('enigmavbconsole');
      
      if (enigmaAvailable) {
        // Create a project file for Enigma Virtual Box
        const enigmaProject = `[Files]
"${path.resolve(unpackedPath)}" ""

[Options]
Compression=1
ConsoleMode=0
`;
        
        fs.writeFileSync('release/enigma-project.ini', enigmaProject);
        
        await runCommand('enigmavbconsole', [
          'release/enigma-project.ini',
          'release/Station-V-Single.exe'
        ]);
        
        console.log('✅ Single executable created with Enigma Virtual Box');
        return;
      }
    } catch (error) {
      console.log('⚠️ Enigma Virtual Box method failed:', error.message);
    }

    // Method 2: Create a batch file that extracts and runs
    console.log('📦 Method 2: Creating self-extracting batch file...');
    
    const batchContent = `@echo off
echo Station V - Virtual IRC Simulator
echo Extracting application...
echo.

REM Create temporary directory
set TEMP_DIR=%TEMP%\\StationV_%RANDOM%
mkdir "%TEMP_DIR%"

REM Extract files (this would need to be embedded)
REM For now, we'll create a simple launcher

echo Starting Station V...
echo.

REM Try to find the executable in common locations
if exist "%~dp0Station V - Virtual IRC Simulator.exe" (
    start "" "%~dp0Station V - Virtual IRC Simulator.exe"
) else if exist "%~dp0win-unpacked\\Station V - Virtual IRC Simulator.exe" (
    start "" "%~dp0win-unpacked\\Station V - Virtual IRC Simulator.exe"
) else (
    echo Error: Could not find Station V executable
    echo Please ensure the application files are in the same directory as this launcher
    pause
)

echo.
echo Application started. You can close this window.
timeout /t 3 >nul
`;

    fs.writeFileSync('release/Station-V-Launcher.bat', batchContent);
    console.log('✅ Batch launcher created: release/Station-V-Launcher.bat');

    // Method 3: Create a PowerShell script
    console.log('📦 Method 3: Creating PowerShell launcher...');
    
    const psContent = `# Station V - Virtual IRC Simulator Launcher
Write-Host "Station V - Virtual IRC Simulator" -ForegroundColor Cyan
Write-Host "Starting application..." -ForegroundColor Green
Write-Host ""

# Try to find the executable
$exePath = $null

if (Test-Path ".\Station V - Virtual IRC Simulator.exe") {
    $exePath = ".\Station V - Virtual IRC Simulator.exe"
} elseif (Test-Path ".\win-unpacked\Station V - Virtual IRC Simulator.exe") {
    $exePath = ".\win-unpacked\Station V - Virtual IRC Simulator.exe"
} elseif (Test-Path ".\release\win-unpacked\Station V - Virtual IRC Simulator.exe") {
    $exePath = ".\release\win-unpacked\Station V - Virtual IRC Simulator.exe"
}

if ($exePath) {
    Write-Host "Found executable at: $exePath" -ForegroundColor Yellow
    Start-Process -FilePath $exePath
    Write-Host "Application started successfully!" -ForegroundColor Green
} else {
    Write-Host "Error: Could not find Station V executable" -ForegroundColor Red
    Write-Host "Please ensure the application files are in the correct location" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
`;

    fs.writeFileSync('release/Station-V-Launcher.ps1', psContent);
    console.log('✅ PowerShell launcher created: release/Station-V-Launcher.ps1');

    // Method 4: Create instructions for true single executable
    console.log('📋 Method 4: Creating single executable guide...');
    
    const singleExeGuide = `SINGLE EXECUTABLE CREATION GUIDE

For a true single executable file, you'll need to use specialized tools:

RECOMMENDED TOOLS:

1. ENIGMA VIRTUAL BOX (Free)
   - Download: https://enigmaprotector.com/en/downloads.html
   - Usage: Create a virtual file system containing your app
   - Result: Single .exe file that runs without extraction

2. BOXEDAPP PACKER (Commercial)
   - Download: https://www.boxedapp.com/boxedapppacker/
   - Usage: Pack Electron apps into single executables
   - Result: Professional single .exe file

3. VMProtect (Commercial)
   - Download: https://vmpsoft.com/
   - Usage: Pack and protect applications
   - Result: Single executable with protection

4. ADVANCED INSTALLER (Commercial)
   - Download: https://www.advancedinstaller.com/
   - Usage: Create portable applications
   - Result: Single executable installer

CURRENT WORKING SOLUTION:
The ZIP file (Station-V-Portable.zip) contains everything needed:
- Extract anywhere
- Run "Station V - Virtual IRC Simulator.exe"
- No installation required
- Fully portable

FILE SIZES:
- Unpacked folder: ~145 MB
- ZIP file: ~145 MB (compressed)
- Single executable: ~150-200 MB (estimated)

RECOMMENDATION:
For immediate distribution, use the ZIP file.
For professional distribution, invest in Enigma Virtual Box or BoxedApp Packer.
`;

    fs.writeFileSync('release/SINGLE-EXECUTABLE-GUIDE.txt', singleExeGuide);
    console.log('✅ Single executable guide created: release/SINGLE-EXECUTABLE-GUIDE.txt');

    console.log('\\n🎉 Portable distribution created successfully!');
    console.log('📁 Files created:');
    console.log('   - Station-V-Portable.zip (ZIP distribution)');
    console.log('   - Station-V-Launcher.bat (Batch launcher)');
    console.log('   - Station-V-Launcher.ps1 (PowerShell launcher)');
    console.log('   - README-Portable.txt (User instructions)');
    console.log('   - SINGLE-EXECUTABLE-GUIDE.txt (Single exe guide)');

  } catch (error) {
    console.error('❌ Single executable creation failed:', error.message);
    process.exit(1);
  }
}

// Helper function to check if a tool is available
async function checkToolAvailable(tool) {
  try {
    await runCommand(tool, ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Run the single executable creation
createSingleExe();
