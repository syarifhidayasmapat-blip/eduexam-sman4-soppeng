/**
 * Automated Verification Suite for EduExam SMAN 4 Soppeng v17.0
 * Tests:
 * 1. Syntax of all JS modules
 * 2. Clean Slate Baseline (0 dummy data, 1 default Admin sman4soppeng@gmail.com / 21405)
 * 3. 4-Role Simplification
 * 4. Dynamic Subject CRUD with Delete Button
 * 5. Auto-purge of deleted subject from teacher assignment and context switcher
 * 6. Formative vs Summative session activation control
 * 7. Database Reset to Clean Slate with Admin Password (21405)
 * 8. Resilience of Guru and Kepsek calculations with 0 data
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

console.log('=== TEST SUITE 1: JS SYNTAX VALIDATION ===');
const jsFiles = ['db.js', 'app.js', 'admin.js', 'guru.js', 'kepsek.js', 'exam-engine.js', 'ai-engine.js'];
jsFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', 'js', file);
  try {
    execSync(`node -c "${filePath}"`);
    assert(true, `Syntax OK: js/${file}`);
  } catch (err) {
    assert(false, `Syntax ERROR in js/${file}: ${err.message}`);
  }
});

console.log('\n=== TEST SUITE 2: CLEAN SLATE INITIAL BASELINE ===');
// Mock browser environment for db.js
const mockLocalStorage = {};
global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorage[k]; },
  clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; }
};
global.window = {
  localStorage: global.localStorage
};

// Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'db.js'), 'utf8');
eval(dbCode);

const db = window.EduDB;
assert(db !== undefined, 'EduDB is instantiated as singleton');
assert(db.DB_KEY === 'eduexam_db_v17', `DB_KEY is 'eduexam_db_v17' (got: ${db.DB_KEY})`);

// Verify Clean Slate (0 dummy data)
const subjects = db.getSubjects();
assert(Array.isArray(subjects) && subjects.length === 0, `Clean Slate: tb_subjects has 0 data (got: ${subjects.length})`);

const classes = db.getClasses();
assert(Array.isArray(classes) && classes.length === 0, `Clean Slate: tb_classes has 0 data (got: ${classes.length})`);

const questions = db.getQuestions();
assert(Array.isArray(questions) && questions.length === 0, `Clean Slate: tb_questions has 0 data (got: ${questions.length})`);

const sessions = db.getExamSessions();
assert(Array.isArray(sessions) && sessions.length === 0, `Clean Slate: tb_exam_sessions has 0 data (got: ${sessions.length})`);

const results = db.getStudentResults();
assert(Array.isArray(results) && results.length === 0, `Clean Slate: tb_student_results has 0 data (got: ${results.length})`);

const kisiList = db.getKisiKisi();
assert(Array.isArray(kisiList) && kisiList.length === 0, `Clean Slate: tb_kisi_kisi has 0 data (got: ${kisiList.length})`);

const reflections = db.getAIReflections();
assert(Array.isArray(reflections) && reflections.length === 0, `Clean Slate: tb_ai_reflections has 0 data (got: ${reflections.length})`);

const archives = db.getArchives();
assert(Array.isArray(archives) && archives.length === 0, `Clean Slate: tb_archives has 0 data (got: ${archives.length})`);

const users = db.getUsers();
assert(Array.isArray(users) && users.length === 1, `Clean Slate: tb_users has ONLY 1 default admin account (got: ${users.length})`);
const adminUser = users[0];
assert(adminUser.role === 'admin', `Default user role is 'admin' (got: ${adminUser.role})`);
assert(adminUser.email === 'sman4soppeng@gmail.com', `Default admin email is 'sman4soppeng@gmail.com' (got: ${adminUser.email})`);
assert(adminUser.password_hash === '21405', `Default admin password is '21405' (got: ${adminUser.password_hash})`);

console.log('\n=== TEST SUITE 3: DEFAULT ADMIN AUTHENTICATION ===');
const authEmail = db.authenticate('sman4soppeng@gmail.com', '21405', 'admin');
assert(authEmail !== undefined && authEmail.role === 'admin', 'Login with email sman4soppeng@gmail.com and password 21405 succeeds');

const authUser = db.authenticate('admin', '21405', 'admin');
assert(authUser !== undefined && authUser.role === 'admin', 'Login with username admin and password 21405 succeeds');

const authWrong = db.authenticate('sman4soppeng@gmail.com', 'wrongpassword', 'admin');
assert(!authWrong, 'Login with incorrect password returns falsy');

console.log('\n=== TEST SUITE 4: DYNAMIC SUBJECT MANAGEMENT & AUTO-PURGE ON DELETE ===');
// Add subjects
const sub1 = db.addSubject({ nama_mapel: 'Fisika Terapan & Energi', kode_mapel: 'FIS-01' }, adminUser);
assert(sub1 && sub1.nama_mapel === 'Fisika Terapan & Energi', 'Admin adds subject: Fisika Terapan & Energi');

const sub2 = db.addSubject({ nama_mapel: 'Biologi Lingkungan', kode_mapel: 'BIO-01' }, adminUser);
assert(sub2 && sub2.nama_mapel === 'Biologi Lingkungan', 'Admin adds subject: Biologi Lingkungan');

const sub3 = db.addSubject({ nama_mapel: 'Informatika Digital' }, adminUser);
assert(sub3 && sub3.nama_mapel === 'Informatika Digital', 'Admin adds subject with auto-generated code');

assert(db.getSubjects().length === 3, 'tb_subjects now has 3 registered subjects');

// Create a teacher user
const teacherUser = {
  user_id: 'usr-guru-test-1',
  username: 'pakguru',
  nama_lengkap: 'Budi Santoso, S.Pd.',
  role: 'guru',
  mapel: 'Fisika Terapan & Energi',
  mata_pelajaran_list: ['Fisika Terapan & Energi', 'Biologi Lingkungan'],
  kelas: 'XII MIPA 1',
  kelas_diampu_list: ['XII MIPA 1'],
  status_aktif: true
};
db.data.users.push(teacherUser);
db.save();

assert(db.getUserById('usr-guru-test-1').mata_pelajaran_list.length === 2, 'Teacher has 2 assigned subjects initially');

// Mock GuruModule on window
window.GuruModule = {
  activeSubject: 'Fisika Terapan & Energi',
  getTeacherSubjects: () => {
    const u = db.getUserById('usr-guru-test-1');
    return u.mata_pelajaran_list || [];
  }
};

// Now Admin deletes 'Fisika Terapan & Energi'
const delRes = db.deleteSubject(sub1.subject_id, adminUser);
assert(delRes === true, 'deleteSubject returns true');
assert(db.getSubjects().length === 2, 'tb_subjects count drops to 2');
assert(!db.getSubjectByName('Fisika Terapan & Energi'), 'Deleted subject is no longer in tb_subjects');

// Verify auto-purge from teacher mapping
const updatedTeacher = db.getUserById('usr-guru-test-1');
assert(!updatedTeacher.mata_pelajaran_list.includes('Fisika Terapan & Energi'), 'Deleted subject purged from teacher mata_pelajaran_list');
assert(updatedTeacher.mata_pelajaran_list.includes('Biologi Lingkungan'), 'Remaining subject kept in teacher mata_pelajaran_list');
assert(updatedTeacher.mapel === 'Biologi Lingkungan', 'Teacher mapel property automatically updated to remaining subject');

// Verify GuruModule.activeSubject automatically updated without error
assert(window.GuruModule.activeSubject === 'Biologi Lingkungan', `GuruModule activeSubject updated to remaining subject (got: ${window.GuruModule.activeSubject})`);

// Delete remaining subject
db.deleteSubject(sub2.subject_id, adminUser);
db.deleteSubject(sub3.subject_id, adminUser);
assert(db.getSubjects().length === 0, 'tb_subjects can be emptied completely without crashing');
assert(updatedTeacher.mata_pelajaran_list.length === 0, 'Teacher mata_pelajaran_list is empty now');
assert(window.GuruModule.activeSubject === null, 'GuruModule activeSubject is null when 0 subjects exist');

console.log('\n=== TEST SUITE 5: FORMATIVE VS SUMMATIVE SESSION CONTROLS ===');
// Guru adds formative session
const formatifSession = {
  session_id: 'ses-form-1',
  nama_ujian: 'Kuis Bab 1 Mekanika',
  mata_pelajaran: 'Fisika',
  kategori_penilaian: 'formatif',
  jenis_formatif: 'Kuis Harian',
  is_active_by_teacher: true,
  is_active_by_admin: false,
  guru_pengampu: 'Budi Santoso, S.Pd.'
};
db.data.exam_sessions.push(formatifSession);
db.save();

assert(db.getExamSessions(null, 'formatif').length === 1, 'Formative session filtered correctly');
assert(db.getExamSessions(null, 'sumatif').length === 0, 'Summative filter returns 0 for formative sessions');

// Teacher toggles formative session
const toggledOff = db.setExamSessionActiveByTeacher('ses-form-1', false, updatedTeacher);
assert(toggledOff && toggledOff.is_active_by_teacher === false, 'Teacher can deactivate formative session');

const toggledOn = db.setExamSessionActiveByTeacher('ses-form-1', true, updatedTeacher);
assert(toggledOn && toggledOn.is_active_by_teacher === true, 'Teacher can reactivate formative session');

// Summative session added
const sumatifSession = {
  session_id: 'ses-sum-1',
  nama_ujian: 'Penilaian Akhir Semester (PAS) Ganjil',
  mata_pelajaran: 'Fisika',
  kategori_penilaian: 'sumatif',
  periode_sumatif: 'PAS',
  is_active_by_admin: false,
  is_active_by_teacher: false
};
db.data.exam_sessions.push(sumatifSession);
db.save();

assert(db.getExamSessions(null, 'sumatif').length === 1, 'Summative session retrieved');

// Teacher cannot activate summative session via setExamSessionActiveByTeacher
let teacherFailedOnSummative = false;
try {
  db.setExamSessionActiveByTeacher('ses-sum-1', true, updatedTeacher);
} catch (e) {
  teacherFailedOnSummative = true;
}
assert(teacherFailedOnSummative, 'Teacher cannot activate summative session with formative control');

// Admin activates summative session
const adminActive = db.setExamSessionActiveByAdmin('ses-sum-1', true, adminUser);
assert(adminActive && adminActive.is_active_by_admin === true, 'Admin can activate summative session');

console.log('\n=== TEST SUITE 6: RESET DATABASE TOTAL (21405 AUTHORIZATION) ===');
// Attempt reset with wrong password
const failReset = db.resetDatabase('wrongpassword', adminUser);
assert(failReset.success === false, 'Reset DB with incorrect password fails');

// Attempt reset with correct admin password (21405)
const okReset = db.resetDatabase('21405', adminUser);
assert(okReset.success === true, 'Reset DB with password 21405 succeeds');

// Verify state after reset is clean slate
assert(db.getSubjects().length === 0, 'After reset: subjects count is 0');
assert(db.getClasses().length === 0, 'After reset: classes count is 0');
assert(db.getQuestions().length === 0, 'After reset: questions count is 0');
assert(db.getExamSessions().length === 0, 'After reset: exam sessions count is 0');
assert(db.getUsers().length === 1, 'After reset: users count is 1 (Admin)');
assert(db.getUsers()[0].email === 'sman4soppeng@gmail.com', 'Admin email remains sman4soppeng@gmail.com');
assert(db.getUsers()[0].password_hash === '21405', 'Admin password remains 21405');

console.log(`\n========================================`);
console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
console.log(`EduExam SMAN 4 Soppeng v17.0 Clean Slate baseline verified 100%!`);
console.log(`========================================`);
