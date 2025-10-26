import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const executablePath = path.join('release', 'win-unpacked', 'Station V - Virtual IRC Simulator.exe');
const logFilePath = path.join(process.cwd(), 'station-v-console.log');

console.log('Testing executable:', executablePath);
console.log('Console log will be saved to:', logFilePath);

// Clear previous log file
if (fs.existsSync(logFilePath)) {
  fs.unlinkSync(logFilePath);
}

const childProcess = spawn(`"${executablePath}"`, [], {
  stdio: 'pipe',
  shell: true
});

// Create write streams for logging
const stdoutLog = fs.createWriteStream(logFilePath, { flags: 'a' });
const stderrLog = fs.createWriteStream(logFilePath, { flags: 'a' });

childProcess.stdout.on('data', (data) => {
  const message = `[STDOUT] ${data.toString()}`;
  console.log(message);
  stdoutLog.write(message);
});

childProcess.stderr.on('data', (data) => {
  const message = `[STDERR] ${data.toString()}`;
  console.log(message);
  stderrLog.write(message);
});

childProcess.on('close', (code) => {
  const message = `[EXIT] Process exited with code: ${code}`;
  console.log(message);
  stdoutLog.write(message + '\n');
  stdoutLog.end();
  stderrLog.end();
});

childProcess.on('error', (error) => {
  const message = `[ERROR] Process error: ${error.message}`;
  console.error(message);
  stderrLog.write(message + '\n');
  stderrLog.end();
});

// Kill after 15 seconds if still running
setTimeout(() => {
  if (!childProcess.killed) {
    console.log('Killing process after 15 seconds');
    childProcess.kill();
  }
}, 15000);
