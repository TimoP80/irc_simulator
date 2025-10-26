import { spawn } from 'child_process';
import path from 'path';

// Development script for Electron
async function devElectron() {
  console.log('🚀 Starting Electron development environment...');
  
  // Start the IRC server
  console.log('🖥️ Starting IRC server...');
  const serverProcess = spawn('node', ['server/station-v-server-simple.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  // Start the Vite dev server
  console.log('⚡ Starting Vite dev server...');
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  // Wait for Vite to be ready, then start Electron
  setTimeout(() => {
    console.log('🔌 Starting Electron...');
    const electronProcess = spawn('electron', ['.'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    electronProcess.on('close', () => {
      console.log('🛑 Electron closed, cleaning up...');
      serverProcess.kill();
      viteProcess.kill();
      process.exit(0);
    });
  }, 3000); // Wait 3 seconds for Vite to start
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development environment...');
    serverProcess.kill();
    viteProcess.kill();
    process.exit(0);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  devElectron().catch(console.error);
}

export { devElectron };
