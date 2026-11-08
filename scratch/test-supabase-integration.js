/**
 * EduExam SMAN 4 Soppeng - Supabase Integration Test Suite
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE 1: SUPABASE CLIENT FILES & CREDENTIALS ===');
const srcClientPath = path.join(__dirname, '../src/supabaseClient.js');
const jsClientPath = path.join(__dirname, '../js/supabaseClient.js');
const sqlSchemaPath = path.join(__dirname, '../supabase-schema.sql');

assert(fs.existsSync(srcClientPath), 'src/supabaseClient.js must exist');
assert(fs.existsSync(jsClientPath), 'js/supabaseClient.js must exist');
assert(fs.existsSync(sqlSchemaPath), 'supabase-schema.sql must exist');

const srcCode = fs.readFileSync(srcClientPath, 'utf8');
const jsCode = fs.readFileSync(jsClientPath, 'utf8');
const sqlCode = fs.readFileSync(sqlSchemaPath, 'utf8');

assert(srcCode.includes('https://jzdjnsxsgeddlkhmwogk.supabase.co'), 'src/supabaseClient.js must contain official Supabase URL');
assert(srcCode.includes('sb_publishable_itWkhhXA3pfbqqi15LsB1A_xErKk2Kr'), 'src/supabaseClient.js must contain official publishable anon key');
assert(jsCode.includes('https://jzdjnsxsgeddlkhmwogk.supabase.co'), 'js/supabaseClient.js must contain official Supabase URL');
assert(jsCode.includes('sb_publishable_itWkhhXA3pfbqqi15LsB1A_xErKk2Kr'), 'js/supabaseClient.js must contain official publishable anon key');
console.log('  [PASS] Supabase client files and credentials verified');

console.log('\n=== TEST SUITE 2: SQL SCHEMA & RLS POLICIES ===');
const tables = [
  'tb_users', 'tb_subjects', 'tb_assessments', 'tb_questions',
  'tb_exam_schedules', 'tb_student_results', 'tb_ai_reflections', 'tb_archives'
];
tables.forEach(tbl => {
  assert(sqlCode.includes(`CREATE TABLE IF NOT EXISTS public.${tbl}`), `Schema must define ${tbl}`);
  assert(sqlCode.includes(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY`), `Schema must enable RLS on ${tbl}`);
  assert(sqlCode.includes(`CREATE POLICY "Akses Penuh EduExam ${tbl}"`), `Schema must define anon policy for ${tbl}`);
  console.log(`  [PASS] Table and policy verified: ${tbl}`);
});
assert(sqlCode.includes('sman4soppeng@gmail.com'), 'SQL schema must seed default admin email');
assert(sqlCode.includes('21405'), 'SQL schema must seed default admin password');

console.log('\n=== TEST SUITE 3: JS/DB.JS SUPABASE ENGINE METHODS ===');
// Setup DOM/browser simulation
global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
    clear() { this.store = {}; }
  }
};
global.localStorage = global.window.localStorage;
global.document = {
  getElementById(id) {
    return {
      textContent: '',
      className: '',
      innerHTML: '',
      classList: { add() {}, remove() {}, contains() { return false; } }
    };
  }
};

require('../js/supabaseClient.js');
require('../js/db.js');

const db = window.EduDB;
assert(db, 'window.EduDB must be instantiated');
assert(typeof db.initSupabase === 'function', 'EduDB must have initSupabase method');
assert(typeof db.ensureUUID === 'function', 'EduDB must have ensureUUID method');
assert(typeof db.syncFromSupabase === 'function', 'EduDB must have syncFromSupabase method');
assert(typeof db.authenticateAsync === 'function', 'EduDB must have authenticateAsync method');
console.log('  [PASS] EduExamDB Supabase methods verified');

console.log('\n=== TEST SUITE 4: UUID GENERATION & ADAPTATION ===');
const u1 = db.ensureUUID('usr-admin-1');
assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(u1), 'ensureUUID must return valid RFC4122 UUID');
const rawUuid = '123e4567-e89b-12d3-a456-426614174000';
assert.strictEqual(db.ensureUUID(rawUuid), rawUuid, 'ensureUUID must preserve existing valid UUID');
console.log('  [PASS] ensureUUID format verified:', u1);

console.log('\n=== TEST SUITE 5: LOGIN AUTHENTICATION (DEFAULT ADMIN & FALLBACK) ===');
(async () => {
  // Test async login for admin sman4soppeng@gmail.com / 21405
  const adminAuth = await db.authenticateAsync('sman4soppeng@gmail.com', '21405', 'admin');
  assert(adminAuth, 'Admin login with email must succeed');
  assert.strictEqual(adminAuth.email, 'sman4soppeng@gmail.com');
  assert.strictEqual(adminAuth.role, 'admin');
  console.log('  [PASS] Admin authenticateAsync with email verified:', adminAuth.email);

  const adminUserAuth = await db.authenticateAsync('admin', '21405', 'admin');
  assert(adminUserAuth, 'Admin login with username must succeed');
  console.log('  [PASS] Admin authenticateAsync with username verified');

  const invalidAuth = await db.authenticateAsync('sman4soppeng@gmail.com', 'wrongpassword', 'admin');
  assert(!invalidAuth, 'Login with incorrect password must return falsy');
  console.log('  [PASS] Invalid password rejection verified');

  console.log('\n=== TEST SUITE 6: DYNAMIC SUBJECT MANAGEMENT ===');
  const sub = db.addSubject({ nama_mapel: 'Fisika Kuantum & Robotika' }, adminAuth);
  assert(sub, 'addSubject must return new subject');
  assert(db.isUUID(sub.subject_id), 'new subject_id must be a valid UUID');
  assert.strictEqual(sub.nama_mapel, 'Fisika Kuantum & Robotika');
  console.log('  [PASS] Subject added with valid UUID:', sub.subject_id, sub.nama_mapel);

  const delResult = db.deleteSubject(sub.subject_id, adminAuth);
  assert.strictEqual(delResult, true, 'deleteSubject must return true');
  assert.strictEqual(db.getSubjects().length, 0, 'Subject list must be empty after deletion');
  console.log('  [PASS] Subject deleted cleanly');

  console.log('\n=== TEST SUITE 7: FORMATIVE & SUMMATIVE ASSESSMENT CONTROLS ===');
  const formativeSession = db.addExamSession({
    nama_ujian: 'Kuis Harian Bab 1 Gelombang',
    kategori_penilaian: 'formatif',
    materi_bab_text: 'Gelombang Mekanik'
  });
  assert(formativeSession, 'addExamSession formative must succeed');
  assert(db.isUUID(formativeSession.session_id), 'session_id must be a valid UUID');
  assert.strictEqual(formativeSession.is_active_by_teacher, false);

  // Teacher activation
  const activated = db.setExamSessionActiveByTeacher(formativeSession.session_id, true, { nama_lengkap: 'Guru Fisika' });
  assert.strictEqual(activated.is_active_by_teacher, true, 'Teacher should activate formative exam');
  console.log('  [PASS] Formative teacher activation verified');

  const summativeSession = db.addExamSession({
    nama_ujian: 'Penilaian Akhir Semester Ganjil',
    kategori_penilaian: 'sumatif'
  });
  assert.throws(() => {
    db.setExamSessionActiveByTeacher(summativeSession.session_id, true);
  }, /Asesmen Sumatif hanya dapat diaktifkan oleh Admin/, 'Teacher should be blocked from activating summative exam');
  console.log('  [PASS] Summative teacher activation restriction verified');

  const adminActivated = db.setExamSessionActiveByAdmin(summativeSession.session_id, true, adminAuth);
  assert.strictEqual(adminActivated.is_active_by_admin, true, 'Admin should activate summative exam');
  console.log('  [PASS] Summative admin activation verified');

  console.log('\n=== TEST SUITE 8: BANK SOAL & AI REFLECTION ===');
  const q = db.addQuestion({
    pertanyaan: 'Apakah bunyi merambat lebih cepat di zat padat?',
    tipe: '1',
    mata_pelajaran: 'Fisika',
    kunci_jawaban: 'Ya'
  });
  assert(q, 'addQuestion must succeed');
  assert(db.isUUID(q.question_id), 'question_id must be a valid UUID');
  console.log('  [PASS] Bank Soal question added with UUID:', q.question_id);

  const ref = db.saveAIReflection({
    session_id: formativeSession.session_id,
    ringkasan_miskonsepsi: 'Siswa kesulitan membedakan gelombang transversal dan longitudinal',
    saran_remedial_pengayaan: 'Gunakan animasi visual pada pembelajaran berikutnya'
  });
  assert(ref, 'saveAIReflection must succeed');
  assert(db.isUUID(ref.reflection_id), 'reflection_id must be a valid UUID');
  console.log('  [PASS] AI Reflection saved with UUID:', ref.reflection_id);

  console.log('\n========================================');
  console.log('ALL SUPABASE INTEGRATION TESTS PASSED! (100% OK)');
  console.log('========================================');
})();

