const { spawn } = require('child_process');
const path = require('path');

// Build script for Electron
async function buildElectron() {
  console.log('🔨 Building Electron application...');
  
  // Step 1: Build the React app
  console.log('📦 Building React application...');
  await runCommand('npm', ['run', 'build']);
  
  // Step 2: Compile Electron main process
  console.log('⚡ Compiling Electron main process...');
  await runCommand('npx', ['tsc', '-p', 'tsconfig.electron.json']);
  
  console.log('✅ Electron build complete!');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

if (require.main === module) {
  buildElectron().catch(console.error);
}

module.exports = { buildElectron };
