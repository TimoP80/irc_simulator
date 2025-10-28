import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build script for Electron
async function buildElectron() {
  console.log('🔨 Building Electron application...');

  // Step 1: Build the React app
  console.log('📦 Building React application...');
  await runCommand('npm', ['run', 'build']);

  // Step 2: Compile Electron main process
  console.log('⚡ Compiling Electron main process...');
  await runCommand('npx', ['tsc', '-p', 'tsconfig.electron.json']);

  // Step 3: Rename preload.js to preload.cjs
  const preloadPath = path.join(__dirname, '..', 'dist-electron', 'preload.js');
  const preloadCjsPath = path.join(__dirname, '..', 'dist-electron', 'preload.cjs');

  if (fs.existsSync(preloadPath)) {
    fs.renameSync(preloadPath, preloadCjsPath);
    console.log('✅ Renamed preload.js to preload.cjs');
  }

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

// ES module detection
if (process.argv[1] === __filename) {
  buildElectron().catch(console.error);
}

export { buildElectron };
