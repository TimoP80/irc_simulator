#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);

console.log('🚀 Script starting...');
console.log('📁 Current directory:', process.cwd());
console.log('📄 Script file:', __filename);
console.log('🔧 Node version:', process.version);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const output = `${colors[color]}${message}${colors.reset}`;
  console.log(output);
  // Also force flush
  process.stdout.write('');
}

// Create readline interface for user input
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Load environment variables
function loadEnv() {
  console.log('🔍 Looking for .env file...');
  const envPath = path.join(process.cwd(), '.env');
  console.log('📍 .env path:', envPath);

  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found', 'red');
    return {};
  }

  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });

  console.log('🔑 Found environment variables:', Object.keys(env));
  return env;
}

// Validate API key by making a test request
async function validateAPIKey(apiKey) {
  log('🔐 Validating API key...', 'cyan');

  if (!apiKey || apiKey.trim() === '') {
    log('❌ API key is empty', 'red');
    return { valid: false, error: 'API key is empty' };
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);

    if (response.status === 400) {
      log('❌ API key validation failed: Invalid API key (400 Bad Request)', 'red');
      return {
        valid: false,
        error: 'Invalid API key. Please check your Gemini API key.'
      };
    }

    if (response.status === 401) {
      log('❌ API key validation failed: Unauthorized (401)', 'red');
      return {
        valid: false,
        error: 'API key is not authorized. Please verify your API key.'
      };
    }

    if (response.status === 403) {
      log('❌ API key validation failed: Forbidden (403)', 'red');
      return {
        valid: false,
        error: 'API key does not have permission to access this resource.'
      };
    }

    if (!response.ok) {
      log(`❌ API key validation failed: ${response.status} ${response.statusText}`, 'red');
      return {
        valid: false,
        error: `API validation failed: ${response.status} ${response.statusText}`
      };
    }

    log('✅ API key is valid!', 'green');
    return { valid: true };
  } catch (error) {
    log(`❌ Error validating API key: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return {
      valid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Simple test function
async function simpleTest() {
  log('🧪 Simple API Key Test', 'magenta');
  log('======================', 'magenta');

  const env = loadEnv();
  const apiKey = env.GEMINI_API_KEY;

  log(`🔍 API Key found: ${apiKey ? 'YES' : 'NO'}`, 'blue');

  if (apiKey) {
    log(`🔍 API Key preview: ${apiKey.substring(0, 10)}...`, 'blue');
    log(`🔍 API Key starts with AIza: ${apiKey.startsWith('AIza') ? 'YES' : 'NO'}`, 'blue');
  }

  log('✅ Test completed!', 'green');
}

// Interactive validation mode
async function interactiveValidation() {
  log('🔑 Interactive API Key Validator', 'magenta');
  log('================================', 'magenta');
  log('', 'reset');

  log('📝 Instructions:', 'cyan');
  log('1. Get your API key from: https://makersuite.google.com/app/apikey', 'cyan');
  log('2. Click "Create API key" if you don\'t have one', 'cyan');
  log('3. Copy the key and paste it below', 'cyan');
  log('', 'reset');

  const apiKey = await prompt('🔐 Enter your Gemini API key: ');

  if (!apiKey || apiKey.trim() === '') {
    log('❌ No API key provided', 'red');
    return;
  }

  log('', 'reset');
  const result = await validateAPIKey(apiKey);

  log('', 'reset');
  log('📊 Validation Result:', 'magenta');
  log('====================', 'magenta');

  if (result.valid) {
    log('✅ SUCCESS: Your API key is valid!', 'green');
    log('', 'reset');
    log('You can now use this key in the application.', 'green');
  } else {
    log(`❌ FAILED: ${result.error}`, 'red');
    log('', 'reset');
    log('Troubleshooting tips:', 'yellow');
    log('• Make sure you\'re using a Gemini API key (not Cloud Console)', 'yellow');
    log('• Check that your Google account has billing enabled', 'yellow');
    log('• Try creating a new API key at: https://makersuite.google.com/app/apikey', 'yellow');
    log('• Check your internet connection', 'yellow');
  }

  log('', 'reset');
}

// Main menu
async function mainMenu() {
  log('🎯 API Key Test Tool', 'magenta');
  log('====================', 'magenta');
  log('', 'reset');

  log('Choose an option:', 'cyan');
  log('1. Test API key from .env file', 'cyan');
  log('2. Validate a custom API key', 'cyan');
  log('3. Exit', 'cyan');
  log('', 'reset');

  const choice = await prompt('Enter your choice (1-3): ');

  switch (choice.trim()) {
    case '1':
      log('', 'reset');
      await simpleTest();
      break;
    case '2':
      log('', 'reset');
      await interactiveValidation();
      break;
    case '3':
      log('👋 Goodbye!', 'green');
      process.exit(0);
    default:
      log('❌ Invalid choice. Please enter 1, 2, or 3.', 'red');
      log('', 'reset');
      await mainMenu();
  }
}

console.log('🎯 About to start API Key Test Tool...');
mainMenu().then(() => {
  console.log('🏁 Script finished successfully');
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});