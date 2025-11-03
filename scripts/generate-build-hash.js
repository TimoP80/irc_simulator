import { createHash } from 'crypto';
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const directoriesToScan = [
    'src',
    'components',
    'context',
    'services',
    'utils'
];

const fileExtensions = ['.ts', '.tsx'];

function getFilePaths(dir) {
    const entries = readdirSync(dir);
    const filePaths = [];

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            filePaths.push(...getFilePaths(fullPath));
        } else if (fileExtensions.some(ext => fullPath.endsWith(ext))) {
            filePaths.push(fullPath);
        }
    }

    return filePaths;
}

function generateHash() {
    const hash = createHash('sha256');
    let allContent = '';

    for (const dir of directoriesToScan) {
        if (existsSync(dir)) {
            const filePaths = getFilePaths(dir);
            for (const filePath of filePaths) {
                const content = readFileSync(filePath, 'utf-8');
                allContent += content;
            }
        }
    }

    hash.update(allContent);
    const buildHash = hash.digest('hex');

    const outputDir = 'dist';
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir);
    }

    writeFileSync(join(outputDir, 'build-hash.json'), JSON.stringify({ hash: buildHash }));
    console.log(`✅ Build hash generated and saved to ${outputDir}/build-hash.json`);
}

generateHash();