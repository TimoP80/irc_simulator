import { spawn } from 'child_process';

// Test script to verify Electron build
async function testElectronBuild() {
  console.log('🧪 Testing Electron build...');
  
  try {
    // Build the application
    console.log('📦 Building application...');
    await runCommand('npm', ['run', 'build:electron']);
    
    // Test running Electron
    console.log('⚡ Testing Electron startup...');
    const electronProcess = spawn('electron', ['.'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    // Wait 3 seconds then kill the process
    setTimeout(() => {
      electronProcess.kill();
      console.log('✅ Electron test completed successfully!');
      process.exit(0);
    }, 3000);
    
    electronProcess.on('error', (error) => {
      console.error('❌ Electron test failed:', error.message);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
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

if (import.meta.url === `file://${process.argv[1]}`) {
  testElectronBuild().catch(console.error);
}

export { testElectronBuild };
