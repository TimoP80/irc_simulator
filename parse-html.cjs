const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'documentation.html',
    'index-electron.html',
    'index.html'
];

const tsxFiles = [
    'App.tsx',
    'components/AddBotModal.tsx',
    'components/AddChannelModal.tsx',
    'components/AddUserModal.tsx',
    'components/AudioAnalysis.tsx',
    'components/BatchUserModal.tsx',
    'components/BotManagement.tsx',
    'components/ChannelImportExportModal.tsx',
    'components/ChannelList.tsx',
    'components/ChannelListModal.tsx',
    'components/ChannelManagement.tsx',
    'components/ChatLogManager.tsx',
    'components/ChatWindow.tsx',
    'components/DataExportModal.tsx',
    'components/DebugLogWindow.tsx',
    'components/icons.tsx',
    'components/ImportExportModal.tsx',
    'components/IRCExportSettings.tsx',
    'components/Message.tsx',
    'components/MobileNavigation.tsx',
    'components/NetworkConnection.tsx',
    'components/NetworkUsers.tsx',
    'components/ProfilePicture.tsx',
    'components/SettingsModal.tsx',
    'components/UserList.tsx',
    'components/UserManagement.tsx',
    'components/VisionAnalysis.tsx'
];

const filesToParse = [...htmlFiles, ...tsxFiles];
const analysis = {};

function parseContent(content) {
    const elementRegex = /<([a-zA-Z0-9-]+)([^>]*)\/?>/g;
    let match;
    while ((match = elementRegex.exec(content)) !== null) {
        const element = match[1];
        const attributesText = match[2];

        if (!analysis[element]) {
            analysis[element] = new Set();
        }

        const attributeRegex = /([a-zA-Z0-9-]+)=/g;
        let attrMatch;
        while ((attrMatch = attributeRegex.exec(attributesText)) !== null) {
            analysis[element].add(attrMatch[1]);
        }
    }
}

filesToParse.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf-8');
        parseContent(content);
    } catch (error) {
        console.error(`Error reading file ${file}:`, error);
    }
});

const result = {};
for (const element in analysis) {
    result[element] = Array.from(analysis[element]);
}

fs.writeFileSync('html_analysis.json', JSON.stringify(result, null, 2));

console.log('HTML analysis complete. Results saved to html_analysis.json');