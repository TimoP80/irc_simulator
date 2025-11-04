#!/usr/bin/env node

/**
 * Station V - Lightweight Test Wrapper
 * 
 * A simple CLI wrapper to easily test the IRC simulator.
 * Can be packaged as an exe using `pkg` for easy distribution.
 * 
 * Usage:
 *   node test-wrapper.js [command] [options]
 * 
 * Commands:
 *   dev              - Start development servers (WebSocket + Vite)
 *   electron         - Start Electron development mode
 *   build            - Build the application
 *   package          - Package as executable
 *   test             - Run tests
 *   help             - Show this help message
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Color codes for console output
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

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`▶ Running: ${command} ${args.join(' ')}`, 'yellow');
    
    const proc = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        log(`✓ Command completed successfully`, 'green');
        resolve(code);
      } else {
        log(`✗ Command failed with code ${code}`, 'red');
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      log(`✗ Error: ${err.message}`, 'red');
      reject(err);
    });
  });
}

async function cmdDev() {
  logSection('Starting Development Servers');
  log('Starting WebSocket server and Vite dev server...', 'blue');
  log('WebSocket: http://localhost:8081', 'green');
  log('Web UI: http://localhost:3000', 'green');
  
  try {
    await runCommand('npm', ['run', 'dev']);
  } catch (error) {
    log(`Development server failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function cmdElectron() {
  logSection('Starting Electron Development');
  log('Building and starting Electron app...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'dev:electron']);
  } catch (error) {
    log(`Electron startup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function cmdBuild() {
  logSection('Building Application');
  log('Building for production...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'build']);
    log('Build completed successfully!', 'green');
  } catch (error) {
    log(`Build failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function cmdPackage() {
  logSection('Packaging Application');
  log('Packaging as Windows executable...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'package:win']);
    log('Packaging completed! Check the release/ directory.', 'green');
  } catch (error) {
    log(`Packaging failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function cmdTest() {
  logSection('Running Tests');
  log('Testing executable...', 'blue');
  
  try {
    await runCommand('node', ['scripts/test-executable.js']);
  } catch (error) {
    log(`Tests failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function showHelp() {
  logSection('Station V - Test Wrapper Help');
  
  const help = `
Commands:
  dev              Start development servers (WebSocket + Vite)
  electron         Start Electron development mode
  build            Build the application for production
  package          Package as Windows executable
  test             Run executable tests
  help             Show this help message

Examples:
  node test-wrapper.js dev
  node test-wrapper.js electron
  node test-wrapper.js build
  node test-wrapper.js package
  node test-wrapper.js test

For more information, visit: https://github.com/TimoP80/station_v_executable
  `;
  
  console.log(help);
}

async function main() {
  const command = process.argv[2] || 'help';

  logSection('Station V - IRC Simulator Test Wrapper');
  log(`Command: ${command}`, 'cyan');

  try {
    switch (command.toLowerCase()) {
      case 'dev':
        await cmdDev();
        break;
      case 'electron':
        await cmdElectron();
        break;
      case 'build':
        await cmdBuild();
        break;
      case 'package':
        await cmdPackage();
        break;
      case 'test':
        await cmdTest();
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        log(`Unknown command: ${command}`, 'red');
        log('Use "help" to see available commands', 'yellow');
        process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();

