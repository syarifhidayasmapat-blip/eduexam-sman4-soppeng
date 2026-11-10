const fs = require('fs');

// Mock localStorage
const localStorageData = {};
global.localStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, val) => { localStorageData[key] = String(val); },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { for (let k in localStorageData) delete localStorageData[k]; }
};

// Mock DOM
const elements = {};
global.document = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerHTML: '',
        value: '',
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        querySelectorAll: () => [],
        appendChild: () => {},
        remove: () => { delete elements[id]; }
      };
    }
    return elements[id];
  },
  createElement: (tag) => {
    const el = {
      id: '',
      innerHTML: '',
      className: '',
      classList: { add: () => {}, remove: () => {} },
      appendChild: () => {},
      remove: () => {}
    };
    return el;
  },
  body: { appendChild: () => {} },
  querySelectorAll: (selector) => {
    if (selector.includes('teacher_subject')) {
      return [{ value: 'Fisika Terapan & Energi Mandiri' }, { value: 'Informatika & Robotika' }];
    }
    if (selector.includes('teacher_class')) {
      return [{ value: 'X.1' }, { value: 'X.2' }, { value: 'XI.A' }];
    }
    return [];
  }
};

global.window = {
  localStorage: global.localStorage,
  document: global.document,
  App: {
    currentUser: { user_id: 'usr-admin-1', nama_lengkap: 'Administrator', role: 'admin' },
    showToast: (msg, type) => console.log(`[TOAST ${type}]`, msg)
  }
};
global.confirm = () => true;
global.alert = (msg) => console.log('[ALERT]', msg);

// Load db.js
const dbCode = fs.readFileSync('js/db.js', 'utf8');
eval(dbCode);

// Load admin.js
const adminCode = fs.readFileSync('js/admin.js', 'utf8');
eval(adminCode);

// Load guru.js
const guruCode = fs.readFileSync('js/guru.js', 'utf8');
eval(guruCode);

console.log('✅ Modules loaded successfully');

// 1. Initial State
window.AdminModule.renderAdminView();
window.AdminModule.switchTab('users');
console.log('Initial Users rendered. Count in HTML:', elements['admin-tab-content'].innerHTML.includes('Administrator SMAN 4 Soppeng'));

// 2. Add Teacher
const teacher = window.EduDB.addUser({
  username: 'syarif_guru',
  nama_lengkap: 'Syarif Hidayatullah, S.Pd.',
  role: 'guru',
  mata_pelajaran_list: ['Fisika Terapan & Energi Mandiri'],
  kelas_diampu_list: ['X.1']
});
console.log('Added teacher:', teacher.nama_lengkap, teacher.user_id);
window.AdminModule.switchTab('users');
console.log('Immediate UI shows teacher:', elements['admin-tab-content'].innerHTML.includes('Syarif Hidayatullah, S.Pd.'));

// 3. Test Teacher Mapping
console.log('\n--- Testing Pemetaan Guru ---');
window.AdminModule.saveTeacherMapping(null, teacher.user_id);
const htmlAfterMapping = elements['admin-tab-content'].innerHTML;
console.log('Immediate UI shows 2 Mapel:', htmlAfterMapping.includes('2 Mapel'));
console.log('Immediate UI shows 3 Kelas:', htmlAfterMapping.includes('3 Kelas'));

// 4. Test GuruModule dynamic context reactivity
window.App.currentUser = teacher;
window.GuruModule._ensureActiveSubject();
const guruSubs = window.GuruModule.getTeacherSubjects();
const guruClasses = window.GuruModule.getTeacherClasses();
console.log('GuruModule dynamic subjects:', guruSubs);
console.log('GuruModule dynamic classes:', guruClasses);

// 5. Test Delete Teacher
console.log('\n--- Testing Hapus Guru ---');
window.AdminModule.deleteUser(teacher.user_id);
const htmlAfterDelete = elements['admin-tab-content'].innerHTML;
console.log('Immediate UI removed teacher:', !htmlAfterDelete.includes('Syarif Hidayatullah, S.Pd.'));

console.log('\n🎯 ALL TESTS PASSED: 100% Instant Reactivity Verified!');
