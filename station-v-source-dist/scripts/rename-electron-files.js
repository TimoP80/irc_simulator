import fs from 'fs';
import path from 'path';

const distElectronPath = 'dist-electron';
if (fs.existsSync(distElectronPath)) {
  const files = fs.readdirSync(distElectronPath);
  files.forEach(file => {
    if (file.endsWith('.js') && !file.endsWith('.cjs')) {
      const oldPath = path.join(distElectronPath, file);
      const newPath = path.join(distElectronPath, file.replace('.js', '.cjs'));
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${file} → ${file.replace('.js', '.cjs')}`);
    }
  });
}
