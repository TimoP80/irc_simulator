import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Enhanced build script for Windows distribution
async function buildWindowsDistribution() {
  console.log('🚀 Building Station V Windows Distribution...');
  
  try {
    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    await runCommand('npm', ['run', 'electron:clean']);
    
    // Clean dist directory to ensure fresh build
    console.log('🧹 Cleaning dist directory...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    // Ensure dist directory exists after cleaning
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    // Step 2: Build React application
    console.log('📦 Building React application...');
    console.log('🔧 Setting ELECTRON=true for Electron-specific build');
    await runCommand('npm', ['run', 'build'], {
      env: { ...process.env, ELECTRON: 'true' }
    });
    
    // Verify the correct HTML file was generated
    const electronHtmlExists = fs.existsSync('dist/index-electron.html');
    const regularHtmlExists = fs.existsSync('dist/index.html');
    
    console.log('📄 Generated files:');
    console.log('  - index-electron.html:', electronHtmlExists ? '✅' : '❌');
    console.log('  - index.html:', regularHtmlExists ? '✅' : '❌');
    
    if (!electronHtmlExists) {
      console.log('⚠️ Electron-specific HTML not found, using regular HTML');
    }
    
    // Step 3: Compile Electron main process
    console.log('⚡ Compiling Electron main process...');
    await runCommand('npm', ['run', 'build:electron-main']);
    
    // Step 3.5: Rename .js files to .cjs for ES module compatibility
    console.log('🔄 Renaming Electron files to .cjs for ES module compatibility...');
    await runCommand('node', ['scripts/rename-electron-files.js']);
    
    // Step 4: Verify build files exist
    // Copy default configuration file
    console.log('📋 Copying default configuration...');
    try {
      const defaultConfigPath = path.join(process.cwd(), 'default-config.json');
      const distConfigPath = path.join(process.cwd(), 'dist', 'default-config.json');
      
      if (fs.existsSync(defaultConfigPath)) {
        fs.copyFileSync(defaultConfigPath, distConfigPath);
        console.log('✅ Copied default-config.json to dist directory');
      } else {
        console.log('⚠️ Default config file not found, app will use fallback configuration');
      }
    } catch (error) {
      console.error('❌ Failed to copy default config:', error.message);
    }
    // Enhanced verification of build files
    console.log('✅ Verifying build files...');
    const distExists = fs.existsSync('dist');
    const electronDistExists = fs.existsSync('dist-electron');
    const distAssetsExists = fs.existsSync('dist/assets');
    const distHtmlExists = fs.existsSync('dist/index-electron.html');
    const distConfigExists = fs.existsSync('dist/default-config.json');
    
    console.log('📁 Directory verification:');
    console.log('  - dist:', distExists ? '✅' : '❌');
    console.log('  - dist-electron:', electronDistExists ? '✅' : '❌');
    console.log('  - dist/assets:', distAssetsExists ? '✅' : '❌');
    console.log('  - dist/index-electron.html:', distHtmlExists ? '✅' : '❌');
    console.log('  - dist/default-config.json:', distConfigExists ? '✅' : '❌');
    
    if (!distExists) {
      throw new Error('React build failed - dist directory not found');
    }
    if (!electronDistExists) {
      throw new Error('Electron build failed - dist-electron directory not found');
    }
    if (!distAssetsExists) {
      throw new Error('React build failed - dist/assets directory not found');
    }
    if (!distHtmlExists) {
      throw new Error('React build failed - dist/index-electron.html not found');
    }
    
    // Wait a moment to ensure all files are written
    console.log('⏳ Ensuring all files are written...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Build Windows executable
    console.log('🪟 Building Windows executable...');
    console.log('⚠️ Note: Code signing errors are normal and don\'t affect the executable');
    
    // Debug: List files before electron-builder
    console.log('🔍 Files before electron-builder:');
    if (fs.existsSync('dist')) {
      const distFiles = fs.readdirSync('dist', { recursive: true });
      console.log('  dist directory contents:', distFiles);
    }
    if (fs.existsSync('dist-electron')) {
      const electronFiles = fs.readdirSync('dist-electron');
      console.log('  dist-electron directory contents:', electronFiles);
    }
    
    try {
      await runCommand('npx', ['electron-builder', '--win', '--config', 'package-electron.json']);
    } catch (error) {
      console.log('⚠️ Electron Builder encountered an error, checking if executable was created...');
      // Check if executable was created despite code signing errors
      const executablePath = 'release/win-unpacked/Station V - Virtual IRC Simulator.exe';
      if (fs.existsSync(executablePath)) {
        console.log('✅ Executable created successfully despite errors');
        console.log('📁 Location:', executablePath);
      } else {
        console.log('❌ Executable not found, checking release directory...');
        await listGeneratedFiles();
        throw error; // Re-throw if executable wasn't created
      }
    }

    // Step 6: Copy ICU files manually (Electron Builder sometimes misses them)
    console.log('📋 Copying ICU files manually...');
    await runCommand('node', ['scripts/copy-icu-files.js']);
    
    // Step 7: Copy application files manually (Electron Builder is not including them)
    console.log('📋 Copying application files manually...');
    try {
      const releaseDir = 'release/win-unpacked';
      
      // Copy dist directory
      if (fs.existsSync('dist')) {
        const distDest = path.join(releaseDir, 'dist');
        if (fs.existsSync(distDest)) {
          fs.rmSync(distDest, { recursive: true, force: true });
        }
        fs.cpSync('dist', distDest, { recursive: true });
        console.log('✅ Copied dist directory');
      }
      
      // Copy dist-electron directory
      if (fs.existsSync('dist-electron')) {
        const electronDest = path.join(releaseDir, 'dist-electron');
        if (fs.existsSync(electronDest)) {
          fs.rmSync(electronDest, { recursive: true, force: true });
        }
        fs.cpSync('dist-electron', electronDest, { recursive: true });
        console.log('✅ Copied dist-electron directory');
      }
      
      // Copy server directory
      if (fs.existsSync('server')) {
        const serverDest = path.join(releaseDir, 'server');
        if (fs.existsSync(serverDest)) {
          fs.rmSync(serverDest, { recursive: true, force: true });
        }
        fs.cpSync('server', serverDest, { recursive: true });
        console.log('✅ Copied server directory');
      }
      
      // Copy default-config.json
      if (fs.existsSync('default-config.json')) {
        const configDest = path.join(releaseDir, 'default-config.json');
        fs.copyFileSync('default-config.json', configDest);
        console.log('✅ Copied default-config.json');
      }
      
    } catch (error) {
      console.error('❌ Failed to copy application files:', error.message);
    }

    console.log('🎉 Windows distribution build complete!');
    console.log('📁 Check the release directory for the installer');
    
    // List generated files
    await listGeneratedFiles();
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// List generated files
async function listGeneratedFiles() {
  try {
    const releaseDir = 'release';
    if (fs.existsSync(releaseDir)) {
      console.log('\n📋 Generated files:');
      const files = fs.readdirSync(releaseDir);
      files.forEach(file => {
        const filePath = path.join(releaseDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  📄 ${file} (${size} MB)`);
      });
    } else {
      console.log('⚠️ Release directory not found. Build may have failed.');
    }
  } catch (error) {
    console.log('Could not list generated files:', error.message);
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      ...options
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// ES module detection - more reliable method
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this script is being run directly
if (process.argv[1] === __filename) {
  buildWindowsDistribution().catch(console.error);
}

export { buildWindowsDistribution };
