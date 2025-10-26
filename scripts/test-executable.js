import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Test script to verify the executable works correctly
async function testExecutable() {
  console.log('🧪 Testing Station V Executable...');
  
  const executablePath = path.join('release', 'win-unpacked', 'Station V - Virtual IRC Simulator.exe');
  
  if (!fs.existsSync(executablePath)) {
    console.error('❌ Executable not found:', executablePath);
    return;
  }
  
  console.log('✅ Executable found:', executablePath);
  
  try {
    // Start the executable
    console.log('🚀 Starting executable...');
    const process = spawn(executablePath, [], {
      stdio: 'pipe',
      shell: true
    });
    
    // Wait a bit for startup
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if process is still running
    if (process.exitCode === null) {
      console.log('✅ Executable started successfully and is running');
      console.log('📊 Process ID:', process.pid);
      
      // Kill the process after test
      process.kill();
      console.log('🛑 Test process terminated');
    } else {
      console.log('❌ Executable exited with code:', process.exitCode);
    }
    
  } catch (error) {
    console.error('❌ Error testing executable:', error.message);
  }
}

// ES module detection
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  testExecutable().catch(console.error);
}

export { testExecutable };