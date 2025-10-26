import fs from 'fs';
import path from 'path';

// Script to manually copy ICU files after Electron Builder
function copyICUFiles() {
  const sourceDir = 'node_modules/electron/dist';
  const targetDir = 'release/win-unpacked';
  
  const icuFiles = [
    'icudtl.dat',
    'chrome_100_percent.pak',
    'chrome_200_percent.pak',
    'resources.pak',
    'snapshot_blob.bin'
  ];
  
  console.log('Copying ICU files...');
  
  icuFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copied: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to copy ${file}:`, error.message);
      }
    } else {
      console.warn(`⚠️ Source file not found: ${sourcePath}`);
    }
  });
  
  console.log('ICU file copying completed!');
}

copyICUFiles();
