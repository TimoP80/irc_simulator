const fs = require('fs');
const path = require('path');

function parseCss(cssContent) {
    // Remove comments
    cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

    const rules = [];
    let currentIndex = 0;

    while (currentIndex < cssContent.length) {
        const openBraceIndex = cssContent.indexOf('{', currentIndex);
        if (openBraceIndex === -1) break;

        const selector = cssContent.substring(currentIndex, openBraceIndex).trim();
        
        let braceCount = 1;
        let closeBraceIndex = openBraceIndex + 1;
        while (braceCount > 0 && closeBraceIndex < cssContent.length) {
            if (cssContent[closeBraceIndex] === '{') {
                braceCount++;
            } else if (cssContent[closeBraceIndex] === '}') {
                braceCount--;
            }
            closeBraceIndex++;
        }

        if (braceCount === 0) {
            const propertiesBlock = cssContent.substring(openBraceIndex + 1, closeBraceIndex - 1).trim();
            
            if (selector.startsWith('@media')) {
                // It's a media query, parse rules inside it
                const mediaRules = parseCss(propertiesBlock);
                rules.push({
                    selector: selector,
                    rules: mediaRules
                });
            } else if (selector.startsWith('@keyframes')) {
                // It's a keyframe definition
                rules.push({
                    selector: selector,
                    steps: propertiesBlock // just save the raw content for now
                });
            } else {
                const properties = {};
                if (propertiesBlock.includes('@apply')) {
                    properties['@apply'] = propertiesBlock.replace(/@apply\s*/, '').trim();
                } else {
                    propertiesBlock.split(';').forEach(prop => {
                        if (prop.trim()) {
                            const parts = prop.split(':');
                            if (parts.length >= 2) {
                                const key = parts[0].trim();
                                const value = parts.slice(1).join(':').trim();
                                properties[key] = value;
                            }
                        }
                    });
                }
                rules.push({
                    selector: selector,
                    properties: properties
                });
            }
            currentIndex = closeBraceIndex;
        } else {
            // Mismatched braces, something is wrong.
            // For simplicity, just move on.
            currentIndex = openBraceIndex + 1;
        }
    }
    return rules;
}


function analyzeCssFiles(files) {
    const analysis = {};
    files.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            analysis[filePath] = parseCss(content);
        } catch (error) {
            console.error(`Error reading or parsing ${filePath}:`, error);
            analysis[filePath] = [];
        }
    });
    return analysis;
}

const cssFiles = ['src/fallback.css', 'src/index.css'];
const cssAnalysis = analyzeCssFiles(cssFiles);

fs.writeFileSync('css_analysis.json', JSON.stringify(cssAnalysis, null, 2));

console.log('CSS analysis complete. Results saved to css_analysis.json');