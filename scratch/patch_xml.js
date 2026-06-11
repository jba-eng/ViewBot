const fs = require('fs');
const path = require('path');

const xmlPath = path.resolve(__dirname, '../node_modules/youtube-selfbot-api/node_modules/browser-with-fingerprints/project.xml');

try {
  let content = fs.readFileSync(xmlPath, 'utf8');
  if (content.includes('<EngineVersion>28.4.0</EngineVersion>')) {
    content = content.replace('<EngineVersion>28.4.0</EngineVersion>', '<EngineVersion>27.5.1</EngineVersion>');
    fs.writeFileSync(xmlPath, content, 'utf8');
    console.log('Successfully patched project.xml to use engine 27.5.1!');
  } else {
    console.log('EngineVersion 28.4.0 tag not found or already patched.');
  }
} catch (e) {
  console.error('Error patching project.xml:', e);
}
