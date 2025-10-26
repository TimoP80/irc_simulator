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

// Helper function to check if a tool is available
async function checkToolAvailable(tool) {
  try {
    await runCommand(tool, ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function createPortableExe() {
  console.log('🚀 Creating Single Portable Executable...');

  try {
    // Check if the unpacked build exists
    const unpackedPath = 'release/win-unpacked';
    if (!fs.existsSync(unpackedPath)) {
      throw new Error('Unpacked build not found. Please run "npm run electron:build:win" first.');
    }

    console.log('✅ Found unpacked build');

    // Method 1: Try using 7-Zip to create a self-extracting archive
    console.log('📦 Method 1: Creating self-extracting archive with 7-Zip...');
    
    try {
      // Check if 7-Zip is available
      const sevenZipAvailable = await checkToolAvailable('7z');
      
      if (sevenZipAvailable) {
        // Create a self-extracting archive
        await runCommand('7z', [
          'a', '-sfx7z.sfx',
          'release/Station-V-Portable.exe',
          `${unpackedPath}/*`
        ]);
        
        console.log('✅ Self-extracting archive created: release/Station-V-Portable.exe');
        console.log('📁 Users can run this file and it will extract to a temporary folder');
        return;
      }
    } catch (error) {
      console.log('⚠️ 7-Zip method failed:', error.message);
    }

    // Method 2: Try using WinRAR (if available)
    console.log('📦 Method 2: Trying WinRAR...');
    
    try {
      const winrarAvailable = await checkToolAvailable('winrar');
      
      if (winrarAvailable) {
        await runCommand('winrar', [
          'a', '-sfx',
          'release/Station-V-Portable.exe',
          `${unpackedPath}/*`
        ]);
        
        console.log('✅ WinRAR self-extracting archive created');
        return;
      }
    } catch (error) {
      console.log('⚠️ WinRAR method failed:', error.message);
    }

    // Method 3: Create a ZIP file with instructions
    console.log('📦 Method 3: Creating ZIP distribution...');
    
    try {
      await runCommand('powershell', [
        '-Command',
        `Compress-Archive -Path "${unpackedPath}\\*" -DestinationPath "release/Station-V-Portable.zip" -Force`
      ]);
      
      console.log('✅ ZIP file created: release/Station-V-Portable.zip');
      console.log('📁 Users can extract this ZIP and run the executable');
      
      // Create instructions file
      const instructions = `Station V - Virtual IRC Simulator - Portable Version

INSTRUCTIONS:
1. Extract this ZIP file to any folder
2. Run "Station V - Virtual IRC Simulator.exe"
3. The application will start automatically

REQUIREMENTS:
- Windows 10 or later
- No additional software required

FEATURES:
- Fully portable - no installation needed
- All dependencies included
- Can be run from USB drive
- No registry modifications

For support, visit the project repository.
`;
      
      fs.writeFileSync('release/README-Portable.txt', instructions);
      console.log('✅ Instructions created: release/README-Portable.txt');
      
    } catch (error) {
      console.log('⚠️ ZIP method failed:', error.message);
    }

    // Method 4: Manual instructions
    console.log('📋 Method 4: Manual distribution instructions...');
    
    const manualInstructions = `MANUAL PORTABLE EXECUTABLE CREATION

Since automated tools are not available, here are manual methods:

OPTION A: Self-Extracting Archive (Recommended)
1. Install 7-Zip from https://www.7-zip.org/
2. Right-click on the release/win-unpacked folder
3. Select "7-Zip" > "Add to archive..."
4. Set "Archive format" to "7z"
5. Check "Create SFX archive"
6. Set "SFX module" to "7z.sfx"
7. Click "OK"

OPTION B: ZIP Distribution
1. Right-click on release/win-unpacked folder
2. Select "Send to" > "Compressed (zipped) folder"
3. Rename the ZIP file to "Station-V-Portable.zip"
4. Include instructions for users to extract and run

OPTION C: Third-Party Tools
Consider using these tools for single executable creation:
- Enigma Virtual Box (https://enigmaprotector.com/)
- BoxedApp Packer (https://www.boxedapp.com/)
- VMProtect (https://vmpsoft.com/)

CURRENT BUILD LOCATION: ${path.resolve(unpackedPath)}
EXECUTABLE NAME: Station V - Virtual IRC Simulator.exe
`;

    fs.writeFileSync('release/PORTABLE-CREATION-GUIDE.txt', manualInstructions);
    console.log('✅ Manual guide created: release/PORTABLE-CREATION-GUIDE.txt');

  } catch (error) {
    console.error('❌ Portable executable creation failed:', error.message);
    process.exit(1);
  }
}

// Run the portable executable creation
createPortableExe();
