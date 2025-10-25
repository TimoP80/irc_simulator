const fs = require('fs');

// Read the file
let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Replace all console.log statements with aiDebug.log
content = content.replace(/console\.log\(`\[AI Debug\]/g, 'aiDebug.log(`');
content = content.replace(/console\.log\("\[AI Debug\]/g, 'aiDebug.log("');
content = content.replace(/console\.log\('\[AI Debug\]/g, "aiDebug.log('");

// Replace console.warn statements
content = content.replace(/console\.warn\(`\[AI Debug\]/g, 'aiDebug.warn(`');
content = content.replace(/console\.warn\("\[AI Debug\]/g, 'aiDebug.warn("');
content = content.replace(/console\.warn\('\[AI Debug\]/g, "aiDebug.warn('");

// Replace console.error statements
content = content.replace(/console\.error\(`\[AI Debug\]/g, 'aiDebug.error(`');
content = content.replace(/console\.error\("\[AI Debug\]/g, 'aiDebug.error("');
content = content.replace(/console\.error\('\[AI Debug\]/g, "aiDebug.error('");

// Replace other console statements
content = content.replace(/console\.log\(`\[User Selection\]/g, 'aiDebug.log(`');
content = content.replace(/console\.warn\(`\[User Selection\]/g, 'aiDebug.warn(`');
content = content.replace(/console\.error\(`\[User Selection\]/g, 'aiDebug.error(`');

// Write back to file
fs.writeFileSync('services/geminiService.ts', content);

console.log('Replaced console statements in geminiService.ts');
