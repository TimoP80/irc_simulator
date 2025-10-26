#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
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

// Helper function to list generated files
async function listGeneratedFiles() {
  console.log('\n📋 Generated files:');
  
  try {
    if (fs.existsSync('release')) {
      const releaseFiles = fs.readdirSync('release', { recursive: true });
      releaseFiles.forEach(file => {
        const filePath = path.join('release', file);
        if (fs.statSync(filePath).isFile()) {
          const size = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
          console.log(`  📄 ${file} (${size} MB)`);
        }
      });
    }
  } catch (error) {
    console.error('Error listing files:', error.message);
  }
}

async function buildInstaller() {
  console.log('🚀 Building Station V Windows Installer...');

  try {
    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    await runCommand('npm', ['run', 'electron:clean']);

    // Step 2: Build the application
    console.log('📦 Building application...');
    await runCommand('npm', ['run', 'build']);

    // Step 3: Verify build files
    console.log('✅ Verifying build files...');
    const distExists = fs.existsSync('dist');
    const electronDistExists = fs.existsSync('dist-electron');
    
    if (!distExists) {
      throw new Error('React build failed - dist directory not found');
    }
    if (!electronDistExists) {
      throw new Error('Electron build failed - dist-electron directory not found');
    }

    // Step 4: Build the installer using electron-builder directly
    console.log('🪟 Building Windows installer...');
    console.log('⚠️ Note: Code signing errors are normal and don\'t affect the installer');
    
    try {
      await runCommand('npx', ['electron-builder', '--win', '--config', 'package-electron.json']);
    } catch (error) {
      console.log('⚠️ Electron Builder encountered an error, checking if installer was created...');
      
      // Check for installer files
      const installerFiles = [
        'release/Station V - Virtual IRC Simulator-1.19.0-x64-Setup.exe',
        'release/Station V - Virtual IRC Simulator-1.19.0-ia32-Setup.exe',
        'release/Station V - Virtual IRC Simulator-1.19.0-x64-portable.exe'
      ];
      
      let installerFound = false;
      for (const installerFile of installerFiles) {
        if (fs.existsSync(installerFile)) {
          console.log(`✅ Installer created successfully: ${installerFile}`);
          installerFound = true;
        }
      }
      
      if (!installerFound) {
        console.log('❌ No installer found, checking release directory...');
        await listGeneratedFiles();
        throw error;
      }
    }

    console.log('🎉 Windows installer build complete!');
    console.log('📁 Check the release directory for the installer files');
    
    // List generated files
    await listGeneratedFiles();

  } catch (error) {
    console.error('❌ Installer build failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the installer build
buildInstaller();
