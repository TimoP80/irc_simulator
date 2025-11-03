import { createHash } from 'crypto';
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const directoriesToScan = [
    'src',
    'components',
    'context',
    'services',
    'utils'
];

const fileExtensions = ['.ts', '.tsx'];

function getFilePaths(dir: string): string[] {
    const entries = readdirSync(dir);
    const filePaths: string[] = [];

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

async function generateHash(): Promise<string> {
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
    return hash.digest('hex');
}

export async function verifySourceCode(): Promise<boolean> {
    try {
        const currentHash = await generateHash();
        const response = await fetch('build-hash.json');
        const { hash: storedHash } = await response.json();

        return currentHash === storedHash;
    } catch (error) {
        console.error('Error verifying source code:', error);
        return false;
    }
}