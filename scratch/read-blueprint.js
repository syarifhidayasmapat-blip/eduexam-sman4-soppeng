const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDocx = 'C:/Users/Asus/.gemini/antigravity/brain/adaae41f-4c82-4237-9009-8306bf3e750f/.user_uploaded/media_1794037439752_17391b29.docx';
const tempZip = path.join(process.env.TEMP, 'v15_temp.zip');
const tempDir = path.join(process.env.TEMP, 'v15_extracted');

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(sourceDocx, tempZip);
execSync(`tar -xf "${tempZip}" -C "${tempDir}"`);

const docXmlPath = path.join(tempDir, 'word', 'document.xml');
if (fs.existsSync(docXmlPath)) {
  const content = fs.readFileSync(docXmlPath, 'utf8');
  // Strip XML tags
  const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  console.log('=== BLUEPRINT V15 EXCERPT ===');
  console.log(clean.slice(0, 4000));
  if (clean.length > 4000) {
    console.log('=== BLUEPRINT V15 PART 2 ===');
    console.log(clean.slice(4000, 8000));
  }
  if (clean.length > 8000) {
    console.log('=== BLUEPRINT V15 PART 3 ===');
    console.log(clean.slice(8000, 12000));
  }
} else {
  console.log('document.xml not found');
}

