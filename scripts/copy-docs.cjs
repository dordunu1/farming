const fs = require('fs-extra');
const path = require('path');

const docsDir = path.join(__dirname, '../docs');
const publicDocsDir = path.join(__dirname, '../public/docs');

// Ensure the public/docs directory exists
fs.ensureDirSync(publicDocsDir);

// Copy all markdown files from docs to public/docs
fs.copySync(docsDir, publicDocsDir, {
  filter: (src) => {
    return fs.statSync(src).isDirectory() || src.endsWith('.md');
  }
});

console.log('Documentation files copied to public/docs'); 