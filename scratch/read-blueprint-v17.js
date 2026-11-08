const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDocx = 'C:/Users/Asus/.gemini/antigravity/brain/adaae41f-4c82-4237-9009-8306bf3e750f/.user_uploaded/media_1794087677200_dfb36975.docx';
const tempZip = path.join(process.env.TEMP, 'v17_temp.zip');
const tempDir = path.join(process.env.TEMP, 'v17_extracted');

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(sourceDocx, tempZip);
execSync(`tar -xf "${tempZip}" -C "${tempDir}"`);

const docXmlPath = path.join(tempDir, 'word', 'document.xml');
if (fs.existsSync(docXmlPath)) {
  const content = fs.readFileSync(docXmlPath, 'utf8');
  const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  console.log('=== BLUEPRINT V17 EXCERPT (TOTAL LEN: ' + clean.length + ') ===');
  console.log(clean.slice(0, 3000));
  if (clean.length > 3000) {
    console.log('=== PART 2 ===');
    console.log(clean.slice(3000, 6000));
  }
} else {
  console.log('document.xml not found');
}

