// Copy node.exe to the Electron build output directory after packaging.
// Usage: node scripts/copy-node-exe.js

const fs = require('fs');
const path = require('path');

// Adjust this path if your node.exe is elsewhere
const NODE_EXE_SOURCE = path.join(process.env.ProgramFiles || 'C:/Program Files', 'nodejs', 'node.exe');
const BUILD_OUTPUT = path.join(__dirname, '..', 'release', 'win-unpacked');
const DEST = path.join(BUILD_OUTPUT, 'node.exe');

if (!fs.existsSync(NODE_EXE_SOURCE)) {
  console.error('node.exe not found at', NODE_EXE_SOURCE);
  process.exit(1);
}

fs.copyFileSync(NODE_EXE_SOURCE, DEST);
console.log('Copied node.exe to', DEST);
