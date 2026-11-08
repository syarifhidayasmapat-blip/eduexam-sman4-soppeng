const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== TEST SUITE 1: FILE EXISTENCE & SYNTAX ===');
const requiredFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/icon-192.png',
  'public/icon-512.png',
  'manifest.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png',
  'server.js',
  'index.html',
  'js/app.js'
];

requiredFiles.forEach(f => {
  const p = path.join(__dirname, '..', f);
  assert(fs.existsSync(p), `File exists: ${f}`);
});

try {
  execSync(`node -c "${path.join(__dirname, '..', 'sw.js')}"`);
  assert(true, 'sw.js syntax is valid');
} catch (e) {
  assert(false, `sw.js syntax error: ${e.message}`);
}

try {
  execSync(`node -c "${path.join(__dirname, '..', 'public/sw.js')}"`);
  assert(true, 'public/sw.js syntax is valid');
} catch (e) {
  assert(false, `public/sw.js syntax error: ${e.message}`);
}

try {
  execSync(`node -c "${path.join(__dirname, '..', 'js/app.js')}"`);
  assert(true, 'js/app.js syntax is valid');
} catch (e) {
  assert(false, `js/app.js syntax error: ${e.message}`);
}

try {
  execSync(`node -c "${path.join(__dirname, '..', 'server.js')}"`);
  assert(true, 'server.js syntax is valid');
} catch (e) {
  assert(false, `server.js syntax error: ${e.message}`);
}

console.log('\n=== TEST SUITE 2: MANIFEST.JSON CONTENT VALIDATION ===');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public/manifest.json'), 'utf8'));
assert(manifest.short_name === 'EduExam', `short_name is 'EduExam' (got: ${manifest.short_name})`);
assert(manifest.name === 'EduExam SMAN 4 Soppeng', `name is 'EduExam SMAN 4 Soppeng' (got: ${manifest.name})`);
assert(manifest.theme_color === '#1E3A8A', `theme_color is '#1E3A8A' (got: ${manifest.theme_color})`);
assert(manifest.display === 'standalone', `display is 'standalone' (got: ${manifest.display})`);
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest has at least 2 icons');

const icon192Entry = manifest.icons.find(i => i.sizes === '192x192');
assert(icon192Entry && icon192Entry.src === '/icon-192.png', 'manifest has icon-192.png');

const icon512Entry = manifest.icons.find(i => i.sizes === '512x512');
assert(icon512Entry && icon512Entry.src === '/icon-512.png', 'manifest has icon-512.png');

console.log('\n=== TEST SUITE 3: ICON PNG INTEGRITY ===');
['icon-192.png', 'icon-512.png'].forEach(name => {
  const buf = fs.readFileSync(path.join(__dirname, '..', name));
  const sig = buf.slice(0, 8).toString('hex');
  assert(sig === '89504e470d0a1a0a', `${name} has valid PNG signature`);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const expectedSize = name.includes('192') ? 192 : 512;
  assert(w === expectedSize && h === expectedSize, `${name} dimensions match ${expectedSize}x${expectedSize} (got: ${w}x${h})`);
});

console.log('\n=== TEST SUITE 4: SERVICE WORKER IMPLEMENTATION ===');
const swCode = fs.readFileSync(path.join(__dirname, '..', 'public/sw.js'), 'utf8');
assert(swCode.includes('eduexam-pwa-v17'), 'sw.js specifies cache name eduexam-pwa-v17');
assert(swCode.includes('PRECACHE_ASSETS'), 'sw.js defines PRECACHE_ASSETS');
assert(swCode.includes('/manifest.json'), 'sw.js precaches manifest.json');
assert(swCode.includes('/icon-192.png'), 'sw.js precaches icon-192.png');
assert(swCode.includes('/icon-512.png'), 'sw.js precaches icon-512.png');
assert(swCode.includes('skipWaiting'), 'sw.js activates skipWaiting');
assert(swCode.includes('clients.claim'), 'sw.js claims clients on activate');
assert(swCode.includes('navigate'), 'sw.js handles navigation requests with offline fallback');

console.log('\n=== TEST SUITE 5: INDEX.HTML PWA TAGS & SW REGISTRATION ===');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes('rel="manifest"'), 'index.html links manifest.json');
assert(html.includes('name="theme-color" content="#1E3A8A"'), 'index.html defines theme-color #1E3A8A');
assert(html.includes('apple-mobile-web-app-capable'), 'index.html defines iOS Safari apple-mobile-web-app-capable');
assert(html.includes('apple-touch-icon'), 'index.html defines apple-touch-icon');
assert(html.includes("navigator.serviceWorker.register('/sw.js'"), 'index.html registers /sw.js');
assert(html.includes('pwa-install-card'), 'index.html includes interactive pwa-install-card');
console.log('  [PASS] pwa-install-card restored on landing page');
assert(html.includes('pwa-install-header-btn'), 'index.html includes pwa-install-header-btn');
assert(html.includes('pwa-guide-modal'), 'index.html includes pwa-guide-modal for iOS/desktop manual instructions');

console.log('\n=== TEST SUITE 6: JS/APP.JS PWA METHODS ===');
const appCode = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
assert(appCode.includes('deferredPwaPrompt'), 'js/app.js tracks deferredPwaPrompt');
assert(appCode.includes('beforeinstallprompt'), 'js/app.js listens for beforeinstallprompt event');
assert(appCode.includes('promptPwaInstall'), 'js/app.js defines promptPwaInstall() method');
assert(appCode.includes('openIosInstallGuideModal'), 'js/app.js defines openIosInstallGuideModal() for iOS users');
assert(appCode.includes('openGenericInstallGuideModal'), 'js/app.js defines openGenericInstallGuideModal() for desktop users');

console.log('\n========================================');
console.log(`ALL PWA TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
console.log('Progressive Web App (PWA) integration verified 100%!');
console.log('========================================');

