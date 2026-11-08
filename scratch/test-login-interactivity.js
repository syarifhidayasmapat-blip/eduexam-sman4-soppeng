const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: LOGIN INTERACTIVITY & FOOTER LOGO ===');

// 1. Verify index.html footer logo
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('<img src="/logo-eduexam.png" alt="Logo EduExam SMAN 4 Soppeng" class="h-6 w-auto inline-block mr-2" onerror="this.onerror=null; this.src=\'assets/logo.png\';" />'), 'Footer logo tag in index.html must match requested specification');
console.log('  [PASS] index.html footer logo with onError fallback verified');

// 2. Verify role tabs in index.html call setActiveRole and demo buttons are deleted
assert(html.includes("setActiveRole('siswa')"), 'Siswa tab must have setActiveRole');
assert(html.includes("setActiveRole('guru')"), 'Guru tab must have setActiveRole');
assert(html.includes("setActiveRole('admin')"), 'Admin tab must have setActiveRole');
assert(html.includes("setActiveRole('kepsek')"), 'Kepsek tab must have setActiveRole');
assert(!html.includes('Akses Cepat Pengujian (1-Klik)'), 'index.html must not contain demo buttons');
console.log('  [PASS] index.html role switcher tabs verified & demo buttons removed');

// 3. Verify js/app.js methods
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert(appJs.includes('setActiveRole(role)'), 'js/app.js must define setActiveRole');
assert(appJs.includes('sman4soppeng@gmail.com'), 'js/app.js must include admin default email');
assert(appJs.includes('21405'), 'js/app.js must include admin default password');
assert(appJs.includes('handleLoginSubmit'), 'js/app.js must define handleLoginSubmit');
console.log('  [PASS] js/app.js setActiveRole and login methods verified');

// 4. Verify React components
assert(fs.existsSync('src/components/Login.jsx'), 'src/components/Login.jsx must exist');
const loginJsx = fs.readFileSync('src/components/Login.jsx', 'utf8');
assert(loginJsx.includes("const [activeRole, setActiveRole] = useState('siswa');"), 'Login.jsx must use activeRole state');
assert(loginJsx.includes("setActiveRole('admin')"), 'Login.jsx must have onClick setActiveRole admin');
assert(loginJsx.includes("sman4soppeng@gmail.com"), 'Login.jsx must include admin default email');
assert(loginJsx.includes("21405"), 'Login.jsx must include admin default password');
assert(loginJsx.includes("supabase.from('tb_users')"), 'Login.jsx must query tb_users on Supabase');
assert(!loginJsx.includes('Akses Cepat Pengujian (1-Klik)'), 'Login.jsx must not contain demo buttons');
console.log('  [PASS] src/components/Login.jsx React component verified & demo buttons removed');

assert(fs.existsSync('src/App.jsx'), 'src/App.jsx must exist');
const appJsx = fs.readFileSync('src/App.jsx', 'utf8');
assert(appJsx.includes('<img') && appJsx.includes('/logo-eduexam.png'), 'src/App.jsx must use /logo-eduexam.png');
assert(appJsx.includes('h-6 w-auto inline-block mr-2'), 'src/App.jsx must include requested logo class');
assert(appJsx.includes('onError'), 'src/App.jsx must include onError handler');
assert(appJsx.includes('Syarif Hidayatullah, S.Pd.'), 'src/App.jsx must mention developer name');
console.log('  [PASS] src/App.jsx React component verified');

// 5. Verify package.json and vite.config.js
assert(fs.existsSync('package.json'), 'package.json must exist');
assert(fs.existsSync('vite.config.js'), 'vite.config.js must exist');
assert(fs.existsSync('vercel.json'), 'vercel.json must exist');
console.log('  [PASS] Deployment files (package.json, vite.config.js, vercel.json) verified');

console.log('\n========================================');
console.log('ALL LOGIN & FOOTER TESTS PASSED! (100% OK)');
console.log('========================================');

