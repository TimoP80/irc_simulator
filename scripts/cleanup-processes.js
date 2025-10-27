#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function cleanupProcesses() {
  console.log('🧹 Cleaning up running processes...');
  console.log('');

  try {
    // Check for running Electron processes
    console.log('🔍 Checking for running Electron processes...');
    
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq electron.exe" /FO CSV /NH');
      
      if (stdout.trim().length > 0) {
        console.log('⚠️  Found running Electron processes:');
        console.log(stdout);
        console.log('');
        console.log('💡 These processes may lock files and cause build errors.');
        console.log('   Consider closing them manually or running:');
        console.log('   taskkill /F /IM electron.exe');
        console.log('');
        
        // Ask if user wants to kill them
        console.log('Attempting to close Electron processes...');
        
        try {
          await execAsync('taskkill /F /IM electron.exe 2>nul');
          console.log('✅ Closed Electron processes');
        } catch (error) {
          console.log('⚠️  Could not close processes automatically');
          console.log('   Please close Electron processes manually');
        }
      } else {
        console.log('✅ No Electron processes running');
      }
    } catch (error) {
      console.log('ℹ️  Could not check for processes (this is normal if none are running)');
    }

    // Check for Node processes that might be running the app
    console.log('');
    console.log('🔍 Checking for Node.js processes...');
    
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH');
      
      if (stdout.trim().length > 0) {
        const lines = stdout.trim().split('\n');
        const nodeProcesses = lines.filter(line => 
          line.includes('electron') || 
          line.includes('vite') ||
          line.includes('building')
        );
        
        if (nodeProcesses.length > 0) {
          console.log('⚠️  Found Node.js processes that may interfere:');
          console.log('   Consider closing them manually');
        } else {
          console.log('✅ No interfering Node.js processes');
        }
      } else {
        console.log('✅ No Node.js processes running');
      }
    } catch (error) {
      console.log('ℹ️  Could not check for Node.js processes');
    }

    // Check for processes locking the release directory
    console.log('');
    console.log('🔍 Checking for processes locking release directory...');
    
    try {
      const { stdout } = await execAsync('tasklist /FO CSV');
      
      if (stdout.includes('Station V')) {
        console.log('⚠️  Found "Station V" processes running');
        console.log('   These should be closed before building');
      } else {
        console.log('✅ No Station V processes detected');
      }
    } catch (error) {
      console.log('ℹ️  Could not check for locked processes');
    }

    console.log('');
    console.log('✅ Process cleanup check complete');
    console.log('');
    console.log('📝 Tip: If you encounter permission errors, try:');
    console.log('   1. Close all Electron windows');
    console.log('   2. Close all "Station V" windows');
    console.log('   3. Close your code editor temporarily');
    console.log('   4. Run the build again');
    console.log('');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.log('');
    console.log('Please manually:');
    console.log('  1. Close all Electron windows');
    console.log('  2. Close all Node.js terminals');
    console.log('  3. Close file explorers opened to the release directory');
    console.log('  4. Try building again');
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupProcesses();
}

export { cleanupProcesses };
