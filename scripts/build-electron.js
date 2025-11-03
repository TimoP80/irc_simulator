import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Build script for Electron
export async function buildElectron() {
  console.log('🔨 Building Electron application...');
  
  // The Vite app and Electron main process are expected to be built already
  // by the 'npm run build' command. This script handles the packaging.
  console.log('📦 Packaging with electron-builder...');
  await runCommand('npx', ['electron-builder']);
  
  console.log('✅ Electron packaging complete!');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running command: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'pipe', // Changed to pipe to capture output
      shell: true
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      stdout += output;
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(output); // Log stderr immediately
      stderr += output;
    });
    
    childProcess.on('close', (code) => {
      console.log(`🎉 Command finished with code ${code}`);
      if (code === 0) {
        resolve(stdout);
      } else {
        const error = new Error(`Command failed with code ${code}\n\nStderr:\n${stderr}\n\nStdout:\n${stdout}`);
        reject(error);
      }
    });

    childProcess.on('error', (err) => {
      console.error('‼️ Spawn error:', err);
      reject(err);
    });
  });
}

// This allows the script to be run directly
// This allows the script to be run directly
const currentFile = fileURLToPath(import.meta.url);
const scriptPath = path.resolve(process.argv[1]);

// A more robust check for direct execution
const isRunningDirectly = currentFile.toLowerCase() === scriptPath.toLowerCase();

if (isRunningDirectly) {
  buildElectron().catch(error => {
    console.error('‼️ Build failed:', error);
    process.exit(1);
  });
}
