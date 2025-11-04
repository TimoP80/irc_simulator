#!/usr/bin/env node

/**
 * Build script to package test-wrapper.js as a standalone exe
 * 
 * This script uses `pkg` to create a portable executable that can be
 * distributed and run without Node.js installed.
 * 
 * Usage:
 *   node scripts/build-test-wrapper.js
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    log(`▶ ${command} ${args.join(' ')}`, 'yellow');
    
    const proc = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  logSection('Building Station V Test Wrapper Executable');

  try {
    // Check if pkg is installed
    log('Checking for pkg...', 'blue');
    try {
      await runCommand('npx', ['pkg', '--version']);
    } catch (error) {
      log('pkg not found. Installing...', 'yellow');
      await runCommand('npm', ['install', '-g', 'pkg']);
    }

    // Create output directory
    const outputDir = path.join(rootDir, 'dist-wrapper');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      log(`Created output directory: ${outputDir}`, 'green');
    }

    // Build the executable
    log('\nBuilding executable...', 'blue');
    const wrapperScript = path.join(rootDir, 'scripts', 'test-wrapper.js');
    const outputExe = path.join(outputDir, 'station-v-test.exe');

    await runCommand('npx', [
      'pkg',
      wrapperScript,
      '--output',
      outputExe,
      '--targets',
      'win-x64',
      '--compress',
      'Brotli'
    ]);

    log(`\n✓ Executable created successfully!`, 'green');
    log(`Location: ${outputExe}`, 'cyan');
    log(`\nYou can now run: ${outputExe}`, 'green');
    log(`Or use it with commands like:`, 'yellow');
    log(`  station-v-test.exe dev`, 'cyan');
    log(`  station-v-test.exe electron`, 'cyan');
    log(`  station-v-test.exe build`, 'cyan');
    log(`  station-v-test.exe package`, 'cyan');

  } catch (error) {
    log(`\n✗ Build failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();

