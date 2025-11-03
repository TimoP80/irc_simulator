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

    electronProcess.stdout.on('data', (data) => {
      console.log(`[Electron stdout]: ${data.toString()}`);
    });

    electronProcess.stderr.on('data', (data) => {
      console.error(`[Electron stderr]: ${data.toString()}`);
    });

    electronProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Electron test completed successfully!');
      } else {
        console.error(`❌ Electron process exited with code ${code}`);
      }
      process.exit(code);
    });
    
    electronProcess.on('error', (error) => {
      console.error('❌ Failed to start Electron process:', error.message);
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
