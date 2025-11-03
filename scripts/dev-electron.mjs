import { spawn } from 'child_process';
import path from 'path';
import waitOn from 'wait-on';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const electron = require('electron');
import { renameSync, writeFileSync, existsSync, mkdirSync } from 'fs';

// Development script for Electron
async function devElectron() {
  console.log('🚀 Starting Electron development environment...');

  // 1. Compile the Electron main process code first
  console.log('📦 Compiling Electron main process...');
  const tscProcess = spawn('tsc', ['--project', 'tsconfig.electron.json'], {
    stdio: 'inherit',
    shell: true, // Use shell to find tsc command
    cwd: process.cwd()
  });

  tscProcess.on('close', async (code) => {
    if (code !== 0) {
      console.error(`❌ TSC compilation failed with code ${code}`);
      process.exit(1);
    }
    console.log('✅ Electron main process compiled.');
    // Rename the output file to .cjs
    // Rename the output files to .cjs
    const mainCompiledPath = path.join(process.cwd(), 'dist-electron', 'main.js');
    const mainNewPath = path.join(process.cwd(), 'dist-electron', 'main.cjs');
    const preloadCompiledPath = path.join(process.cwd(), 'dist-electron', 'preload.js');
    const preloadNewPath = path.join(process.cwd(), 'dist-electron', 'preload.cjs');
    try {
      renameSync(mainCompiledPath, mainNewPath);
      console.log('✅ Renamed main process to .cjs');
      renameSync(preloadCompiledPath, preloadNewPath);
      console.log('✅ Renamed preload script to .cjs');
    } catch (error) {
      console.error('❌ Failed to rename compiled files:', error);
      process.exit(1);
    }
    // Add a small delay to ensure the file system has caught up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    startApp(); // Start the rest of the app
  });

  async function startApp() {
    // Start the IRC server
    console.log('🖥️ Starting IRC server...');
    const serverProcess = spawn('node', ['server/station-v-server.mjs'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    serverProcess.stdout.on('data', (data) => console.log(`[Server]: ${data}`));
    serverProcess.stderr.on('data', (data) => console.error(`[Server ERROR]: ${data}`));

    // Start the Vite dev server
    console.log('⚡ Starting Vite dev server...');
    const viteProcess = spawn('vite', [], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });
    viteProcess.stdout.on('data', (data) => console.log(`[Vite]: ${data}`));
    viteProcess.stderr.on('data', (data) => console.error(`[Vite ERROR]: ${data}`));

    // Wait for Vite to be ready
    try {
      await waitOn({ resources: ['http://localhost:3000'] });
      console.log('✅ Vite is ready!');
      
      // Start Electron
      console.log('🔌 Starting Electron...');
      const mainEntry = path.join(process.cwd(), 'dist-electron', 'main.cjs');
      const electronProcess = spawn(electron, [mainEntry], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'development' }
      });

      electronProcess.on('close', (code) => {
        console.log(`🛑 Electron closed with code ${code}, cleaning up...`);
        if (serverProcess && !serverProcess.killed) serverProcess.kill();
        if (viteProcess && !viteProcess.killed) viteProcess.kill();
        process.exit(0);
      });
    } catch (err) {
      console.error('❌ Error waiting for Vite:', err);
      serverProcess.kill();
      viteProcess.kill();
      process.exit(1);
    }

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development environment...');
      if (serverProcess && !serverProcess.killed) serverProcess.kill();
      if (viteProcess && !viteProcess.killed) viteProcess.kill();
      process.exit(0);
    });
  }
}

// Platform-agnostic check if the script is the main module
const isMainModule = path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  devElectron().catch(console.error);
}

export { devElectron };
