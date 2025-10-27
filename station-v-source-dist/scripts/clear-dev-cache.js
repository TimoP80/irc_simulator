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

paths.forEach(path => {
    if (fs.existsSync(path)) {
        rimraf.sync(path);
        console.log(`Cleared: ${path}`);
    }
});

console.log('Cache cleared successfully!');
console.log('Please restart your development server.');