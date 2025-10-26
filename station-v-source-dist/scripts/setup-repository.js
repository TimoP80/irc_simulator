#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Helper function to run commands
async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupRepository() {
  console.log('🚀 Setting up Station V Executable Repository...');

  try {
    // Check if we're in a git repository
    try {
      await runCommand('git', ['status'], { stdio: 'pipe' });
      console.log('✅ Already in a git repository');
    } catch (error) {
      console.log('📦 Initializing new git repository...');
      await runCommand('git', ['init']);
    }

    // Add all files
    console.log('📁 Adding all files to git...');
    await runCommand('git', ['add', '.']);

    // Create initial commit
    console.log('💾 Creating initial commit...');
    await runCommand('git', ['commit', '-m', 'Initial commit: Station V Desktop Executable v1.19.0']);

    // Instructions for setting up remote
    console.log('\n🎉 Repository setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a new repository on GitHub named "station_v_executable"');
    console.log('2. Update the repository URL in package.json with your actual GitHub username');
    console.log('3. Add the remote origin:');
    console.log('   git remote add origin https://github.com/YOURUSERNAME/station_v_executable.git');
    console.log('4. Push to GitHub:');
    console.log('   git branch -M main');
    console.log('   git push -u origin main');
    console.log('\n📝 Don\'t forget to update the repository URLs in:');
    console.log('   - package.json (repository, homepage, bugs)');
    console.log('   - README.md (clone URL, original repository link)');

  } catch (error) {
    console.error('❌ Repository setup failed:', error.message);
    process.exit(1);
  }
}

// Run the repository setup
setupRepository();
