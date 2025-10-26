import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Enhanced multiplatform build script
async function buildMultiplatformDistribution() {
  console.log('🚀 Building Station V Multiplatform Distribution...');
  
  const platform = process.platform;
  const arch = os.arch();
  
  console.log(`📱 Platform: ${platform}`);
  console.log(`🏗️ Architecture: ${arch}`);
  
  try {
    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    await runCommand('npm', ['run', 'electron:clean']);
    
    // Step 2: Build React application
    console.log('📦 Building React application...');
    await runCommand('npm', ['run', 'build'], {
      env: { ...process.env, ELECTRON: 'true' }
    });
    
    // Step 3: Compile Electron main process
    console.log('⚡ Compiling Electron main process...');
    await runCommand('npm', ['run', 'build:electron-main']);
    
    // Step 3.5: Rename .js files to .cjs for ES module compatibility
    console.log('🔄 Renaming Electron files to .cjs for ES module compatibility...');
    await runCommand('node', ['scripts/rename-electron-files.js']);
    
    // Step 4: Verify build files exist
    console.log('✅ Verifying build files...');
    const distExists = fs.existsSync('dist');
    const electronDistExists = fs.existsSync('dist-electron');
    
    if (!distExists) {
      throw new Error('React build failed - dist directory not found');
    }
    if (!electronDistExists) {
      throw new Error('Electron build failed - dist-electron directory not found');
    }
    
    // Step 5: Build for current platform
    console.log(`🪟 Building ${platform} executable...`);
    
    let buildCommand;
    switch (platform) {
      case 'win32':
        buildCommand = ['electron-builder', '--win'];
        break;
      case 'darwin':
        buildCommand = ['electron-builder', '--mac'];
        break;
      case 'linux':
        buildCommand = ['electron-builder', '--linux'];
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    await runCommand('npx', buildCommand);
    
    console.log('🎉 Multiplatform distribution build complete!');
    console.log('📁 Check the release directory for the installer');
    
    // List generated files
    await listGeneratedFiles();
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Build for all platforms
async function buildAllPlatforms() {
  console.log('🌍 Building Station V for All Platforms...');
  
  try {
    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    await runCommand('npm', ['run', 'electron:clean']);
    
    // Step 2: Build React application
    console.log('📦 Building React application...');
    await runCommand('npm', ['run', 'build'], {
      env: { ...process.env, ELECTRON: 'true' }
    });
    
    // Step 3: Compile Electron main process
    console.log('⚡ Compiling Electron main process...');
    await runCommand('npm', ['run', 'build:electron-main']);
    
    // Step 3.5: Rename .js files to .cjs for ES module compatibility
    console.log('🔄 Renaming Electron files to .cjs for ES module compatibility...');
    await runCommand('node', ['scripts/rename-electron-files.js']);
    
    // Step 4: Build for all platforms
    console.log('🌍 Building for Windows, macOS, and Linux...');
    await runCommand('npx', ['electron-builder', '--win', '--mac', '--linux']);
    
    console.log('🎉 All platforms build complete!');
    console.log('📁 Check the release directory for all installers');
    
    // List generated files
    await listGeneratedFiles();
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// List generated files
async function listGeneratedFiles() {
  try {
    const releaseDir = 'release';
    if (fs.existsSync(releaseDir)) {
      console.log('\n📋 Generated files:');
      const files = fs.readdirSync(releaseDir);
      files.forEach(file => {
        const filePath = path.join(releaseDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  📄 ${file} (${size} MB)`);
      });
    } else {
      console.log('⚠️ Release directory not found. Build may have failed.');
    }
  } catch (error) {
    console.log('Could not list generated files:', error.message);
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      ...options
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Command line interface
const command = process.argv[2];

if (import.meta.url === `file://${process.argv[1]}`) {
  switch (command) {
    case 'all':
      buildAllPlatforms().catch(console.error);
      break;
    case 'current':
    default:
      buildMultiplatformDistribution().catch(console.error);
      break;
  }
}

export { buildMultiplatformDistribution, buildAllPlatforms };
