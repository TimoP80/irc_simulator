import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const directories = ['src', 'components', 'utils', 'services'];
const extensions = ['.ts', '.tsx'];

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else if (extensions.includes(path.extname(filePath))) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

let allContent = '';
directories.forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = getFiles(dir);
        files.forEach(file => {
            allContent += fs.readFileSync(file, 'utf-8');
        });
    }
});

const hash = crypto.createHash('sha256').update(allContent).digest('hex');

if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

fs.writeFileSync('public/build-hash.json', JSON.stringify({ hash }));

console.log('Build hash generated successfully.');