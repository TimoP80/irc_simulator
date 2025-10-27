const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// Paths to clean
const paths = [
    path.join(__dirname, '..', 'node_modules', '.vite'),
    path.join(__dirname, '..', '.vite'),
    path.join(__dirname, '..', 'dist')
];

console.log('Clearing development cache...');

paths.forEach(p => {
    if (fs.existsSync(p)) {
        rimraf.sync(p);
        console.log(`Cleared: ${p}`);
    }
});

console.log('Cache cleared successfully!');
console.log('Please restart your development server.');
