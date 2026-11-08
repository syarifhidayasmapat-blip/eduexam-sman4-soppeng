// Full Integration Test for Word & Excel Question Importer
const assert = require('assert');

// Mock browser environment
const dbStore = [];
global.window = {
  EduDB: {
    getExamSessions: () => [{ session_id: 'ses-1', mata_pelajaran: 'Fisika Terapan & Energi' }],
    getClasses: () => [
      { class_id: 'cls-1', nama_kelas: 'XII MIPA 1' },
      { class_id: 'cls-2', nama_kelas: 'XII MIPA 2' },
      { class_id: 'cls-4', nama_kelas: 'XI MIPA 1' },
      { class_id: 'cls-5', nama_kelas: 'X.1' }
    ],
    addQuestion: (q) => {
      dbStore.push(q);
      return q;
    }
  },
  App: {
    currentUser: {
      nama_lengkap: 'Syarif Hidayatullah, S.Pd.',
      role: 'guru',
      mapel: 'Fisika Terapan & Energi',
      mata_pelajaran_list: ['Fisika Terapan & Energi', 'Informatika & Literasi Digital']
    },
    showToast: (msg, type) => {
      console.log(`[TOAST ${type?.toUpperCase()}]: ${msg}`);
    }
  }
};

global.document = {
  getElementById: (id) => null,
  querySelectorAll: (selector) => []
};

// Require GuruController from js/guru.js
const fs = require('fs');
const path = require('path');
const guruJsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'guru.js'), 'utf8');

// Evaluate the GuruController class in this scope
const evalContext = new Function(guruJsCode + '; return GuruController;')();
const controller = new evalContext();

console.log('1. Testing Controller Initialization...');
assert.strictEqual(controller.currentTab, 'bank');

console.log('2. Testing switchTab routing...');
controller.switchTab('ai-gen');
assert.strictEqual(controller.currentTab, 'import-soal', 'ai-gen must route to import-soal');

controller.switchTab('import-soal');
assert.strictEqual(controller.currentTab, 'import-soal');

console.log('3. Testing Word Question Parser (.docx)...');
const sampleWord = `
1. [PG]
Berapakah ketelitian pengukuran mikrometer sekrup?
A. 0,1 mm
B. 0,01 mm
C. 0,001 mm
D. 1 mm
E. 0,5 mm
KUNCI: B
PEMBAHASAN: Skala nonius mikrometer sekrup adalah 0,01 mm.
TINGKAT: LOTS
BAB: Alat Ukur

2. [PGK]
Manakah pernyataan berikut yang BENAR mengenai besaran pokok?
A. Massa bersatuan kilogram
B. Waktu bersatuan sekon
C. Kecepatan bersatuan m/s
D. Kuat arus bersatuan ampere
E. Gaya bersatuan newton
KUNCI: A, B, D
PEMBAHASAN: Kecepatan dan gaya adalah besaran turunan.
TINGKAT: MOTS
BAB: Besaran dan Satuan

3. [BENAR/SALAH]
Jangka sorong memiliki ketelitian lebih tinggi daripada mikrometer sekrup.
KUNCI: SALAH
PEMBAHASAN: Mikrometer sekrup (0,01 mm) lebih teliti dibanding jangka sorong (0,1 mm).
TINGKAT: MOTS
BAB: Alat Ukur

4. [MENJODOHKAN]
Jodohkan besaran pokok fisika berikut dengan satuan SI yang tepat:
PASANGAN: Panjang = Meter; Massa = Kilogram; Suhu = Kelvin; Kuat Arus = Ampere
KUNCI: Panjang=Meter; Massa=Kilogram; Suhu=Kelvin; Kuat Arus=Ampere
PEMBAHASAN: Standar SI besaran pokok.
TINGKAT: LOTS
BAB: Besaran dan Satuan

5. [ESAI]
Jelaskan perbedaan antara besaran pokok dan besaran turunan!
KUNCI: Besaran pokok satuannya didefinisikan mandiri, besaran turunan diturunkan dari besaran pokok.
PEMBAHASAN: Rubrik: definisi dan contoh.
TINGKAT: HOTS
BAB: Besaran dan Satuan
`;

const parsedWord = controller.parseQuestionsFromWordText(sampleWord);
assert.strictEqual(parsedWord.length, 5, 'Must parse exactly 5 questions');
assert.strictEqual(parsedWord[0].jenis_soal, 'pg');
assert.strictEqual(parsedWord[0].kunci_jawaban, 'B');
assert.strictEqual(parsedWord[1].jenis_soal, 'pgk');
assert.deepStrictEqual(parsedWord[1].kunci_jawaban, ['A', 'B', 'D']);
assert.strictEqual(parsedWord[2].jenis_soal, 'truefalse');
assert.strictEqual(parsedWord[2].kunci_jawaban, 'SALAH');
assert.strictEqual(parsedWord[3].jenis_soal, 'matching');
assert.strictEqual(parsedWord[3].opsi_json.premises.length, 4);
assert.strictEqual(parsedWord[4].jenis_soal, 'essay');
console.log('Word Parser: PASSED ✅');

console.log('4. Testing Excel Question Parser (.xlsx)...');
const sampleExcel = [
  {
    'No': 1,
    'Tipe Soal': 'PG',
    'Narasi Soal': 'Satuan energi listrik dalam Sistem Internasional (SI) adalah...',
    'Pilihan A': 'Watt',
    'Pilihan B': 'Joule',
    'Pilihan C': 'Volt',
    'Pilihan D': 'Ampere',
    'Pilihan E': 'Ohm',
    'Kunci Jawaban': 'B',
    'Pembahasan': 'Energi listrik diukur dalam satuan Joule.',
    'Tingkat Kognitif': 'LOTS',
    'Materi Bab': 'Energi dan Daya'
  },
  {
    'No': 2,
    'Tipe Soal': 'Benar/Salah',
    'Narasi Soal': 'Daya listrik merupakan laju energi listrik tiap satuan waktu.',
    'Kunci Jawaban': 'BENAR',
    'Pembahasan': 'P = W / t sehingga daya adalah laju energi.',
    'Tingkat Kognitif': 'MOTS',
    'Materi Bab': 'Energi dan Daya'
  }
];

const parsedExcel = controller.parseQuestionsFromExcelRows(sampleExcel);
assert.strictEqual(parsedExcel.length, 2, 'Must parse exactly 2 questions from Excel');
assert.strictEqual(parsedExcel[0].jenis_soal, 'pg');
assert.strictEqual(parsedExcel[0].kunci_jawaban, 'B');
assert.strictEqual(parsedExcel[1].jenis_soal, 'truefalse');
assert.strictEqual(parsedExcel[1].kunci_jawaban, 'BENAR');
console.log('Excel Parser: PASSED ✅');

console.log('5. Testing Saving Imported Questions to Database...');
controller.activeSubject = 'Fisika Terapan & Energi';
controller.tempGeneratedQuestions = parsedWord;
controller.saveImportedQuestions('siap');

assert.strictEqual(dbStore.length, 5, 'All 5 questions must be saved to EduDB');
assert.strictEqual(dbStore[0].mata_pelajaran, 'Fisika Terapan & Energi');
assert.strictEqual(dbStore[0].status, 'siap');
assert.strictEqual(dbStore[0].creator, 'Syarif Hidayatullah, S.Pd.');
console.log('Database Save: PASSED ✅');

console.log('6. Testing _renderImportSoalTab() Output...');
controller.tempGeneratedQuestions = [];
const htmlOutput = controller._renderImportSoalTab();
assert.ok(htmlOutput.includes('Impor Soal Massal (Word &amp; Excel)'), 'Must contain header');
assert.ok(htmlOutput.includes('downloadExcelTemplate()'), 'Must contain downloadExcelTemplate button');
assert.ok(htmlOutput.includes('downloadWordTemplate()'), 'Must contain downloadWordTemplate button');
assert.ok(htmlOutput.includes('question-import-dropzone'), 'Must contain dropzone');
assert.ok(htmlOutput.includes('import_target_class_checkbox'), 'Must contain class checkboxes');
assert.ok(htmlOutput.includes('Belum Ada Soal Terimpor'), 'Must show empty state when 0 questions');
console.log('UI Template Rendering: PASSED ✅');

console.log('\n🎉 ALL INTEGRATION TESTS PASSED 100%! SYSTEM READY FOR DEPLOYMENT! 🎉');
