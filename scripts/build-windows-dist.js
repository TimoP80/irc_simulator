import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Enhanced build script for Windows distribution
async function buildWindowsDistribution() {
  console.log('🚀 Building Station V Windows Distribution...');
  
  try {
    // The 'npm run build' command should be executed before this script.
    // Verification of build files is the first step here.
    console.log('✅ Verifying pre-built files...');
    if (!fs.existsSync('dist') || !fs.existsSync('dist-electron')) {
      throw new Error('Build files not found. Please run "npm run build" first.');
    }

    // Step 1: Rename .js files to .cjs for ES module compatibility
    console.log('🔄 Renaming Electron files to .cjs for ES module compatibility...');
    await runCommand('node', ['scripts/rename-electron-files.js']);
    
    // Step 2: Build Windows executable
    console.log('🪟 Building Windows executable with electron-builder...');
    await runCommand('npx', ['electron-builder', '--win', '--config', 'package-electron.json']);

    // Step 3: Copy ICU files manually if needed
    console.log('📋 Copying ICU files manually...');
    await runCommand('node', ['scripts/copy-icu-files.js']);

    console.log('🎉 Windows distribution build complete!');
    console.log('📁 Check the release directory for the installer');
    
    await listGeneratedFiles();
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('Stack trace:', error.stack);
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
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      ...options
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// ES module detection
const __filename = fileURLToPath(import.meta.url);

// Check if this script is being run directly
if (process.argv[1] === __filename) {
  buildWindowsDistribution().catch(console.error);
}

export { buildWindowsDistribution };
