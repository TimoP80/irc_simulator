import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gitLogCommand = `git log --pretty=format:"{%n  \\"commit\\": \\"%H\\",%n  \\"author\\": \\"%an\\",%n  \\"date\\": \\"%ad\\",%n  \\"message\\": \\"%s\\"%n},"`;

exec(gitLogCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing git log: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Git log stderr: ${stderr}`);
        return;
    }

    // Process the output to create a valid JSON array
    // Remove the trailing comma from the last entry and wrap in square brackets
    const jsonOutput = `[${stdout.trim().slice(0, -1)}\n]`;

    const outputPath = path.join(__dirname, '..', 'git_history.json');

    fs.writeFile(outputPath, jsonOutput, 'utf8', (err) => {
        if (err) {
            console.error('Error writing git_history.json:', err);
            return;
        }
        console.log('Successfully generated git_history.json');
    });
});