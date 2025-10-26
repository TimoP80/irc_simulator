import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Windows troubleshooting script for Electron builds
async function troubleshootWindows() {
  console.log('🔍 Station V - Windows Build Troubleshooting');
  console.log('==========================================');
  
  try {
    // Check Node.js version
    console.log('\n📋 System Information:');
    console.log(`Node.js version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    
    // Check if required directories exist
    console.log('\n📁 Directory Check:');
    const dirs = ['dist', 'dist-electron', 'electron', 'server'];
    dirs.forEach(dir => {
      const exists = fs.existsSync(dir);
      console.log(`  ${dir}: ${exists ? '✅' : '❌'}`);
    });
    
    // Check if required files exist
    console.log('\n📄 File Check:');
    const files = [
      'package.json',
      'tsconfig.electron.json',
      'package-electron.json',
      'electron/main.ts',
      'electron/preload.ts',
      'server/station-v-server-simple.js'
    ];
    files.forEach(file => {
      const exists = fs.existsSync(file);
      console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
    });
    
    // Check port availability
    console.log('\n🌐 Port Check:');
    await checkPort(3000);
    await checkPort(8080);
    
    // Check Electron installation
    console.log('\n⚡ Electron Check:');
    try {
      const electronVersion = await runCommand('npx', ['electron', '--version']);
      console.log(`  Electron version: ${electronVersion.trim()}`);
    } catch (error) {
      console.log('  ❌ Electron not found or not working');
    }
    
    // Check TypeScript compilation
    console.log('\n🔧 TypeScript Check:');
    try {
      await runCommand('npx', ['tsc', '--version']);
      console.log('  ✅ TypeScript is available');
    } catch (error) {
      console.log('  ❌ TypeScript compilation failed');
    }
    
    // Check electron-builder
    console.log('\n📦 Electron Builder Check:');
    try {
      await runCommand('npx', ['electron-builder', '--version']);
      console.log('  ✅ Electron Builder is available');
    } catch (error) {
      console.log('  ❌ Electron Builder not found');
    }
    
    console.log('\n🎯 Troubleshooting Complete!');
    console.log('If you see ❌ marks above, those are the areas that need attention.');
    
  } catch (error) {
    console.error('❌ Troubleshooting failed:', error.message);
  }
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const netstat = spawn('netstat', ['-ano'], { shell: true });
    let output = '';
    
    netstat.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    netstat.on('close', () => {
      const isInUse = output.includes(`:${port}`);
      console.log(`  Port ${port}: ${isInUse ? '🔴 In use' : '🟢 Available'}`);
      resolve();
    });
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

// ES module detection
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  troubleshootWindows().catch(console.error);
}

export { troubleshootWindows };
