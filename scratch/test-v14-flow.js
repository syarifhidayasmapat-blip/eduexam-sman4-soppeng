/**
 * Integration Test Script for EduExam SMAN 4 Soppeng v14.0
 * Tests:
 * 1. Database schema migration & teacher multi-subject / multi-class mapping
 * 2. Formative teacher self-activation vs Summative admin central control
 * 3. Student accessibility gating
 * 4. AI Generator based on File Kisi-Kisi Matrix (with 5 question types)
 */

// Mock browser environment for Node.js
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

// Load db.js
require('../js/db.js');
// Load ai-engine.js
require('../js/ai-engine.js');

let testsPassed = 0;
let testsFailed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING INTEGRATION TESTS FOR EDUEXAM v14.0');
  console.log('========================================================\n');

  // 1. DATABASE SCHEMA & TEACHER MAPPING TEST
  console.log('--- TEST GROUP 1: Database Schema & Teacher Multi-Mapping ---');
  assert(window.EduDB.DB_KEY === 'eduexam_db_v14', 'Database version is eduexam_db_v14');

  const guru1 = window.EduDB.getUserById('usr-guru-1');
  assert(guru1 !== null, 'Found default teacher usr-guru-1');
  assert(Array.isArray(guru1.mata_pelajaran_list) && guru1.mata_pelajaran_list.length >= 2, 'Guru has multi-subjects mapped');
  assert(Array.isArray(guru1.kelas_diampu_list) && guru1.kelas_diampu_list.length >= 2, 'Guru has multi-classes mapped');

  const adminUser = window.EduDB.getUserById('usr-admin-1');
  const updatedGuru = window.EduDB.updateTeacherMapping('usr-guru-1', {
    mata_pelajaran_list: ['Fisika Terapan & Energi', 'Informatika & Kecerdasan Buatan', 'Robotika'],
    kelas_diampu_list: ['XII MIPA 1', 'XII MIPA 2', 'XI F-1', 'XI F-2']
  }, adminUser);

  assert(updatedGuru !== null, 'Teacher mapping updated successfully');
  assert(updatedGuru.mata_pelajaran_list.length === 3, 'Teacher has 3 mapped subjects');
  assert(updatedGuru.kelas_diampu_list.length === 4, 'Teacher has 4 mapped classes');

  // Verify Audit Log entry
  const logs = window.EduDB.getAuditLogs();
  const mapLog = logs.find(l => l.action_type === 'UPDATE_TEACHER_MAPPING');
  assert(mapLog !== undefined, 'Audit log recorded teacher mapping update');

  // 2. FORMATIVE TEACHER ACTIVATION VS SUMMATIVE ADMIN CONTROL
  console.log('\n--- TEST GROUP 2: Formative Self-Activation vs Summative Admin Control ---');
  
  // Create a Formative Session
  const formSession = window.EduDB.addExamSession({
    nama_ujian: 'Kuis Formatif Alat Ukur Fisika',
    mata_pelajaran: 'Fisika Terapan & Energi',
    guru_pengampu: 'Syarif Hidayatullah, S.Pd.',
    durasi_menit: 25,
    kelas_target: ['XII MIPA 1'],
    kategori_penilaian: 'formatif',
    jenis_formatif: 'Kuis Harian',
    materi_bab_text: 'Pengukuran',
    is_active_by_teacher: false,
    is_active_by_admin: false
  });

  assert(formSession !== null, 'Formative session created');
  assert(formSession.kategori_penilaian === 'formatif', 'Session category is formative');
  assert(formSession.is_active_by_teacher === false, 'Formative session initially standby');

  // Teacher self-activation of Formative Session
  const toggledByTeacher = window.EduDB.toggleExamSessionActiveByTeacher(formSession.session_id, guru1);
  assert(toggledByTeacher !== null && toggledByTeacher.is_active_by_teacher === true, 'Teacher can self-activate formative session');

  // Teacher cannot activate a Summative Session (Strictly prevented with security error)
  const sumSession = window.EduDB.getExamSessionById('ses-fisika-1');
  assert(sumSession.kategori_penilaian === 'sumatif', 'ses-fisika-1 is sumatif');
  let teacherBlocked = false;
  try {
    const res = window.EduDB.toggleExamSessionActiveByTeacher('ses-fisika-1', guru1);
    if (!res) teacherBlocked = true;
  } catch (err) {
    teacherBlocked = true;
  }
  assert(teacherBlocked === true, 'Teacher strictly blocked from activating summative exam');

  // Admin activates Summative Session
  const adminSumToggled = window.EduDB.toggleExamSessionActiveByAdmin('ses-fisika-1', adminUser);
  assert(adminSumToggled !== null, 'Admin can toggle summative exam');

  // 3. STUDENT ACCESSIBILITY GATING
  console.log('\n--- TEST GROUP 3: Student Accessibility Gating ---');
  const studentMipa1 = { user_id: 'usr-siswa-1', nama_lengkap: 'Ahmad Fauzi', kelas: 'XII MIPA 1' };
  const studentMipa3 = { user_id: 'usr-siswa-99', nama_lengkap: 'Siti Rahma', kelas: 'XII MIPA 3' };

  // Check formative access for MIPA 1 (Target matched + active)
  const isFormActive = toggledByTeacher.is_active_by_teacher;
  const isClassMatch1 = toggledByTeacher.kelas_target.includes(studentMipa1.kelas);
  assert(isFormActive && isClassMatch1, 'Student in XII MIPA 1 has access to active formative exam');

  // Check formative access for MIPA 3 (Target not matched)
  const isClassMatch3 = toggledByTeacher.kelas_target.includes(studentMipa3.kelas);
  assert(!isClassMatch3, 'Student in XII MIPA 3 is blocked from formative exam of other class');

  // Deactivate formative
  const deactivatedForm = window.EduDB.toggleExamSessionActiveByTeacher(formSession.session_id, guru1);
  assert(deactivatedForm.is_active_by_teacher === false, 'Teacher deactivated formative session');
  assert(!deactivatedForm.is_active_by_teacher, 'Student blocked from inactive formative session');

  // 4. AI GENERATOR BASED ON KISI-KISI MATRIX (5 QUESTION TYPES)
  console.log('\n--- TEST GROUP 4: AI Generator based on File Kisi-Kisi Matrix ---');
  assert(typeof window.EduAI.generateQuestionsFromKisiKisi === 'function', 'generateQuestionsFromKisiKisi exists on EduAI');

  const sampleMatrixRows = [
    {
      no: 1,
      cp: 'Menganalisis prinsip kerja dan ketelitian alat ukur besaran fisis',
      materi: 'Pengukuran & Alat Ukur',
      indikator: 'Disajikan gambar mikrometer sekrup, peserta didik dapat menentukan hasil pembacaan dan nilai ketidakpastiannya.',
      level: 'C4',
      bentuk: 'PG',
      jumlah: 2
    },
    {
      no: 2,
      cp: 'Menerapkan konsep hukum dinamika gerak Newton',
      materi: 'Hukum Newton',
      indikator: 'Peserta didik mampu menentukan dua pernyataan yang benar mengenai gaya gesek dan percepatan gerak sistem.',
      level: 'C4',
      bentuk: 'PGK',
      jumlah: 1
    },
    {
      no: 3,
      cp: 'Mengevaluasi prinsip kekekalan energi mekanik',
      materi: 'Usaha & Energi',
      indikator: 'Diberikan pernyataan konversi energi kinetik ke potensial, peserta didik dapat memvalidasi kebenarannya.',
      level: 'C5',
      bentuk: 'Benar/Salah',
      jumlah: 1
    },
    {
      no: 4,
      cp: 'Mengaitkan siklus termodinamika dengan karakteristik proses',
      materi: 'Termodinamika',
      indikator: 'Peserta didik mampu menjodohkan proses termodinamika dengan formulasi usahanya.',
      level: 'C3',
      bentuk: 'Menjodohkan',
      jumlah: 1
    },
    {
      no: 5,
      cp: 'Merancang solusi pemanfaatan energi terbarukan',
      materi: 'Energi Terbarukan',
      indikator: 'Peserta didik mampu menguraikan kalkulasi efisiensi pembangkit listrik mikrohidro.',
      level: 'C6',
      bentuk: 'Esai',
      jumlah: 1
    }
  ];

  const generatedQuestions = await window.EduAI.generateQuestionsFromKisiKisi(sampleMatrixRows, {
    mataPelajaran: 'Fisika Terapan & Energi',
    targetKelas: ['XII MIPA 1', 'XII MIPA 2'],
    kategoriPenilaian: 'formatif',
    jenisFormatif: 'Kuis Harian'
  });

  assert(Array.isArray(generatedQuestions), 'Generator returned array of questions');
  assert(generatedQuestions.length === 6, `Total 6 questions generated (2 PG + 1 PGK + 1 TF + 1 Match + 1 Essay), actual: ${generatedQuestions.length}`);

  const typesFound = {};
  generatedQuestions.forEach(q => {
    typesFound[q.jenis_soal] = (typesFound[q.jenis_soal] || 0) + 1;
    assert(q.question_id && q.question_id.startsWith('q-kisi-'), `Question ${q.nomor_soal} has valid question_id`);
    assert(q.mata_pelajaran === 'Fisika Terapan & Energi', `Question ${q.nomor_soal} has correct subject`);
    assert(q.indikator_soal && q.indikator_soal.length > 10, `Question ${q.nomor_soal} retains strict indicator grounding`);
    assert(q.tingkat_kognitif, `Question ${q.nomor_soal} retains cognitive level`);
    assert(q.kunci_jawaban !== undefined, `Question ${q.nomor_soal} has answer key`);
    assert(q.pembahasan && q.pembahasan.length > 5, `Question ${q.nomor_soal} has explanation`);
  });

  assert(typesFound['pg'] === 2, 'Generated 2 PG questions');
  assert(typesFound['pgk'] === 1, 'Generated 1 PGK question');
  assert(typesFound['truefalse'] === 1, 'Generated 1 True/False question');
  assert(typesFound['matching'] === 1, 'Generated 1 Matching question');
  assert(typesFound['essay'] === 1, 'Generated 1 Essay question');

  console.log('\n========================================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
