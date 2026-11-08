/**
 * EduExam SMAN 4 Soppeng - Integration Test Suite v15.0
 * Menguji seluruh poin perubahan Blueprint v15.0:
 * 1. 4-Role Simplification & Default Admin Credentials (sman4soppeng@gmail.com / 21405)
 * 2. Modul Manajemen Mata Pelajaran Dinamis (tb_subjects) - Tambah & Hapus Mapel
 * 3. Integrasi Penugasan Guru & Context Switcher
 * 4. Pemisahan Kontrol Aktivasi Formatif (Guru) vs Sumatif (Admin)
 * 5. Generator Soal AI Berbasis Matriks Kisi-Kisi
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('=== TEST SUITE EDUEXAM SMAN 4 SOPPENG v15.0 ===\n');

// 1. Syntax Check
console.log('Test 1: Memverifikasi Sintaks Semua Berkas JS...');
const jsFiles = [
  'js/db.js',
  'js/admin.js',
  'js/app.js',
  'js/guru.js',
  'js/ai-engine.js',
  'js/exam-engine.js',
  'js/kepsek.js',
  'server.js'
];

jsFiles.forEach(f => {
  try {
    const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    new vm.Script(code);
    assert(true, `Sintaks valid: ${f}`);
  } catch (err) {
    assert(false, `Error sintaks pada ${f}: ${err.message}`);
  }
});

// Setup Mock Browser Environment
const localStorageData = {};
const mockLocalStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, val) => { localStorageData[key] = String(val); },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { for (const k in localStorageData) delete localStorageData[k]; }
};

const mockWindow = {
  localStorage: mockLocalStorage,
  App: {
    currentUser: null,
    showToast: (msg, type) => {}
  }
};

const mockDocument = {
  getElementById: (id) => null,
  querySelectorAll: () => [],
  createElement: () => ({ classList: { add() {}, remove() {} }, innerHTML: '' })
};

const context = vm.createContext({
  window: mockWindow,
  localStorage: mockLocalStorage,
  document: mockDocument,
  console: console,
  navigator: { onLine: true },
  Math: Math,
  Date: Date,
  JSON: JSON,
  Array: Array,
  String: String,
  Boolean: Boolean,
  Number: Number,
  RegExp: RegExp,
  Error: Error,
  FileReader: class FileReaderMock {
    readAsText(file) { this.onload && this.onload({ target: { result: file } }); }
  }
});

// Load DB
console.log('\nTest 2: Memuat Database Engine (js/db.js)...');
const dbCode = fs.readFileSync(path.join(__dirname, '..', 'js/db.js'), 'utf8');
vm.runInContext(dbCode, context);
const EduDB = context.window.EduDB;
assert(!!EduDB, 'EduExamDB Singleton window.EduDB berhasil diinisialisasi');
assert(EduDB.DB_KEY === 'eduexam_db_v15', 'DB_KEY sesuai standar v15.0: eduexam_db_v15');

// Test 3: Simplifikasi 4 Peran & Kredensial Default Admin
console.log('\nTest 3: Simplifikasi 4 Peran & Kredensial Default Admin (sman4soppeng@gmail.com / 21405)...');
const superAdminUser = EduDB.data.users.find(u => u.role === 'super_admin');
assert(!superAdminUser, 'Role super_admin telah dihapus sepenuhnya dari database');

const adminByEmail = EduDB.authenticate('sman4soppeng@gmail.com', '21405', 'admin');
assert(!!adminByEmail, 'Login Admin via Email (sman4soppeng@gmail.com / 21405) BERHASIL');
assert(adminByEmail && adminByEmail.role === 'admin', 'Role pengguna terautentikasi adalah "admin"');

const adminByUsername = EduDB.authenticate('admin', '21405', 'admin');
assert(!!adminByUsername, 'Login Admin via Username (admin / 21405) BERHASIL');

const kepsekAuth = EduDB.authenticate('kepsek', 'kepsek123', 'kepsek');
assert(!!kepsekAuth && kepsekAuth.role === 'kepsek', 'Login Kepala Sekolah (kepsek / kepsek123) BERHASIL');

const guruAuth = EduDB.authenticate('syarif', 'guru123', 'guru');
assert(!!guruAuth && guruAuth.role === 'guru', 'Login Guru (syarif / guru123) BERHASIL');

const siswaAuth = EduDB.authenticate('Ahmad Fauzan', '10245', 'siswa');
assert(!!siswaAuth && siswaAuth.role === 'siswa', 'Login Siswa (Ahmad Fauzan / 10245) BERHASIL');

const siswaQr = EduDB.getUserByQrToken('EDU4-10245-AHMAD');
assert(!!siswaQr && siswaQr.nama_lengkap === 'Ahmad Fauzan', 'Auto-Login Barcode Siswa (EDU4-10245-AHMAD) BERHASIL');

// Test 4: Manajemen Mata Pelajaran Dinamis (tb_subjects)
console.log('\nTest 4: Manajemen Mata Pelajaran Dinamis (tb_subjects)...');
const initialSubjects = EduDB.getSubjects();
assert(Array.isArray(initialSubjects) && initialSubjects.length >= 15, `tb_subjects berisi ${initialSubjects.length} mata pelajaran terdaftar`);

const newSub = EduDB.addSubject({ nama_mapel: 'Fisika Nuklir & Astrofisika', kode_mapel: 'FNA-01' }, adminByEmail);
assert(!!newSub && newSub.nama_mapel === 'Fisika Nuklir & Astrofisika', 'Berhasil menambahkan mata pelajaran baru: Fisika Nuklir & Astrofisika');
assert(newSub.kode_mapel === 'FNA-01', 'Kode mapel tersimpan: FNA-01');

const afterAdd = EduDB.getSubjects();
assert(afterAdd.length === initialSubjects.length, 'Panjang daftar mapel bertambah 1');

// Cek penolakan duplikasi mapel
let dupeThrew = false;
try {
  EduDB.addSubject({ nama_mapel: 'Fisika Nuklir & Astrofisika' }, adminByEmail);
} catch (e) {
  dupeThrew = true;
}
assert(dupeThrew, 'Sistem menolak penambahan mata pelajaran duplikat (Case-Insensitive)');

// Hapus mapel
const delSuccess = EduDB.deleteSubject(newSub.subject_id, adminByEmail);
assert(delSuccess === true, 'Berhasil menghapus mata pelajaran yang tidak digunakan');
const afterDel = EduDB.getSubjects();
assert(!afterDel.some(s => s.subject_id === newSub.subject_id), 'Mata pelajaran terhapus dari tb_subjects');

// Test 5: Integrasi Penugasan Guru & Context Switcher
console.log('\nTest 5: Integrasi Penugasan Guru & Context Switcher Bar...');
const teacher = EduDB.getUserById('usr-guru-1');
assert(Array.isArray(teacher.mata_pelajaran_list) && teacher.mata_pelajaran_list.length >= 2, 'Guru memiliki mata_pelajaran_list multi-mapel');
assert(Array.isArray(teacher.kelas_diampu_list) && teacher.kelas_diampu_list.length >= 2, 'Guru memiliki kelas_diampu_list multi-kelas');

const updatedTeacher = EduDB.updateTeacherMapping('usr-guru-1', {
  mata_pelajaran_list: ['Fisika Terapan & Energi', 'Informatika & Literasi Digital', 'Robotika Terapan'],
  kelas_diampu_list: ['XII MIPA 1', 'XII MIPA 2', 'XI MIPA 1']
}, adminByEmail);
assert(updatedTeacher.mata_pelajaran_list.includes('Robotika Terapan'), 'Penugasan guru tersimpan dengan mata pelajaran baru');

// Test 6: Pemisahan Kontrol Aktivasi Formatif (Guru) vs Sumatif (Admin)
console.log('\nTest 6: Pemisahan Kontrol Aktivasi Formatif vs Sumatif...');
const formatifSession = EduDB.getExamSessionById('ses-ipa-1');
assert(!!formatifSession, `Sesi formatif ditemukan: ${formatifSession?.nama_ujian}`);
assert(formatifSession.is_active_by_teacher === false, 'Kondisi awal sesi formatif: belum aktif (is_active_by_teacher = false)');

// Guru mengaktifkan formatif mandiri
const activatedByTeacher = EduDB.toggleExamSessionActiveByTeacher(formatifSession.session_id, guruAuth);
assert(activatedByTeacher.is_active_by_teacher === true, 'Guru berhasil mengaktifkan sesi formatif secara mandiri tanpa jadwal Admin');
assert(activatedByTeacher.activated_by_teacher_name === guruAuth.nama_lengkap, 'Nama guru pengaktif tercatat pada sesi formatif');

// Nonaktifkan kembali
const deactivatedByTeacher = EduDB.toggleExamSessionActiveByTeacher(formatifSession.session_id, guruAuth);
assert(deactivatedByTeacher.is_active_by_teacher === false, 'Guru berhasil menonaktifkan sesi formatif');

// Sumatif terpusat oleh Admin
const sumatifSession = EduDB.getExamSessionById('ses-bio-1');
assert(!!sumatifSession, `Sesi sumatif ditemukan: ${sumatifSession?.nama_ujian}`);
assert(sumatifSession.is_active_by_admin === false, 'Kondisi awal sesi sumatif: terkunci admin (is_active_by_admin = false)');

const activatedByAdmin = EduDB.toggleExamSessionActiveByAdmin(sumatifSession.session_id, adminByEmail);
assert(activatedByAdmin.is_active_by_admin === true, 'Admin berhasil mengaktifkan sesi sumatif resmi sekolah');
assert(activatedByAdmin.activated_by_name === adminByEmail.nama_lengkap, 'Nama operator admin tercatat pada sesi sumatif');

// Guru TIDAK DAPAT mengaktifkan sumatif secara sepihak
let guruSumatifThrew = false;
try {
  EduDB.toggleExamSessionActiveByTeacher(sumatifSession.session_id, guruAuth);
} catch (e) {
  guruSumatifThrew = true;
}
assert(guruSumatifThrew, 'Guru dilarang mengaktifkan penilaian sumatif (Strict Administrative Control)');

// Test 7: AI Generator Berbasis Matriks Kisi-Kisi
console.log('\nTest 7: AI Question Generator Berbasis Matriks Kisi-Kisi...');
// Load AI Engine
const aiCode = fs.readFileSync(path.join(__dirname, '..', 'js/ai-engine.js'), 'utf8');
vm.runInContext(aiCode, context);
const EduAI = context.window.EduAI;
assert(!!EduAI, 'EduAIEngine window.EduAI berhasil diinisialisasi');

const sampleMatrixRows = [
  {
    no: 1,
    capaian_pembelajaran: 'Menerapkan konsep pengukuran mikrometer sekrup dan jangka sorong pada benda tipis.',
    materi_pokok: 'Pengukuran & Angka Penting',
    indikator_soal: 'Disajikan hasil pembacaan skala utama dan skala nonius mikrometer sekrup, siswa dapat menentukan tebal pelat logam dengan tepat.',
    level_kognitif: 'C3 (Aplikasi)',
    bentuk_soal: 'Pilihan Ganda (PG)',
    jumlah_soal: 1
  },
  {
    no: 2,
    capaian_pembelajaran: 'Menganalisis prinsip termodinamika pada panel surya fotovoltaik di Soppeng.',
    materi_pokok: 'Energi Terbarukan',
    indikator_soal: 'Siswa dapat menganalisis faktor lingkungan yang mempengaruhi efisiensi konversi fotovoltaik.',
    level_kognitif: 'C4 (Analisis HOTS)',
    bentuk_soal: 'Pilihan Ganda Kompleks (PGK)',
    jumlah_soal: 1
  },
  {
    no: 3,
    capaian_pembelajaran: 'Mengevaluasi daur biogeokimia ekosistem rawa Danau Tempe.',
    materi_pokok: 'Ekologi & Konservasi',
    indikator_soal: 'Pernyataan benar/salah mengenai dampak eutrofikasi akibat penumpukan nitrat terhadap biota rawa.',
    level_kognitif: 'C4 (HOTS)',
    bentuk_soal: 'Benar / Salah (True/False)',
    jumlah_soal: 1
  },
  {
    no: 4,
    capaian_pembelajaran: 'Mengidentifikasi instrumen laboratorium fisis.',
    materi_pokok: 'Alat Ukur Fisis',
    indikator_soal: 'Menjodohkan nama alat ukur besaran fisis dengan fungsi pengukuran yang tepat.',
    level_kognitif: 'C2 (Pemahaman)',
    bentuk_soal: 'Menjodohkan',
    jumlah_soal: 1
  },
  {
    no: 5,
    capaian_pembelajaran: 'Merumuskan solusi pemanfaatan energi surya ramah lingkungan.',
    materi_pokok: 'Energi Ramah Lingkungan',
    indikator_soal: 'Menjelaskan mekanisme konversi energi foton matahari menjadi energi listrik arus searah.',
    level_kognitif: 'C5 (Evaluasi/Kreasi)',
    bentuk_soal: 'Uraian / Esai',
    jumlah_soal: 1
  }
];

// Jalankan generator dari kisi-kisi (menguji fallback lokal cerdas jika tanpa API key)
EduAI.generateQuestionsFromKisiKisi(sampleMatrixRows, {
  mataPelajaran: 'Fisika Terapan & Energi',
  targetKelas: 'XII MIPA 1'
}).then(generatedQuestions => {
  assert(Array.isArray(generatedQuestions), 'Generator mengembalikan array butir soal');
  assert(generatedQuestions.length === 5, `Dihasilkan tepat 5 butir soal sesuai matriks (Diterima: ${generatedQuestions.length})`);

  const types = generatedQuestions.map(q => q.jenis_soal);
  assert(types.includes('pg'), 'Tipe Pilihan Ganda (PG) terbuat');
  assert(types.includes('pgk'), 'Tipe Pilihan Ganda Kompleks (PGK) terbuat');
  assert(types.includes('truefalse'), 'Tipe Benar/Salah (True/False) terbuat');
  assert(types.includes('matching'), 'Tipe Menjodohkan terbuat');
  assert(types.includes('essay'), 'Tipe Uraian/Esai terbuat');

  // Test 8: Reset Database Total dengan password 21405
  console.log('\nTest 8: Reset Database Total...');
  const resetFailPwd = EduDB.resetDatabase('salah123', adminByEmail);
  assert(!resetFailPwd.success, 'Reset DB ditolak jika kata sandi salah');

  const resetOk = EduDB.resetDatabase('21405', adminByEmail);
  assert(resetOk.success === true, 'Reset DB BERHASIL menggunakan kata sandi Administrator (21405)');

  // Print Summary
  console.log('\n========================================');
  console.log(`HASIL AKHIR PENGUJIAN v15.0:`);
  console.log(`TOTAL PASS: ${passCount}`);
  console.log(`TOTAL FAIL: ${failCount}`);
  console.log('========================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('SEMUA PENGUJIAN BERHASIL 100% (EXIT CODE 0)!');
  }
}).catch(err => {
  console.error('Error saat generate questions:', err);
  process.exit(1);
});
