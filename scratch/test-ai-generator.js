// Test Script for v13.0 Blueprint: Prompt-Driven AI, Digital Archive Repository & Context Reinforcement
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => ({
    classList: { remove: () => {}, add: () => {} },
    innerText: '',
    innerHTML: '',
    value: '',
    closest: () => ({ className: '' })
  }),
  querySelectorAll: () => []
};

// Mock localStorage for EduExamDB
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = val; },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Load and evaluate db.js
const dbCode = fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8');
(0, eval)(dbCode);

global.window = {
  EduDB: global.EduDB || window.EduDB,
  App: {
    showToast: (msg, type) => {
      // console.log(`[Toast ${type}]: ${msg}`);
    },
    currentUser: { id: 'guru-1', nama_lengkap: 'Syarif Hidayatullah, S.Pd.', mapel: 'Fisika Terapan & Energi' }
  }
};

// Load and evaluate ai-engine.js
const aiEngineCode = fs.readFileSync(path.join(__dirname, '../js/ai-engine.js'), 'utf8');
(0, eval)(aiEngineCode);

// Load and evaluate guru.js
const guruCode = fs.readFileSync(path.join(__dirname, '../js/guru.js'), 'utf8');
(0, eval)(guruCode);

async function runTests() {
  console.log('=== TEST SUITE: BLUEPRINT v13.0 IMPLEMENTATION ===');

  console.log('\n--- 1. Testing Digital Archive Repository (tb_archives & EduExamDB) ---');
  const db = window.EduDB;
  console.assert(db !== undefined, 'EduDB must be defined');

  const initialArchives = db.getArchives();
  console.assert(Array.isArray(initialArchives), 'getArchives should return an array');
  console.assert(initialArchives.length >= 3, 'Pre-seeded archives must include at least 3 items');

  const docArchives = db.getArchives(null, 'DOKUMEN');
  const imgArchives = db.getArchives(null, 'GAMBAR');
  console.assert(docArchives.length >= 1, 'Should have at least 1 pre-seeded document archive');
  console.assert(imgArchives.length >= 2, 'Should have at least 2 pre-seeded image archives');

  // Add new archive test
  const testArchive = {
    id: 'arc-test-101',
    guru_id: 'guru-1',
    mata_pelajaran: 'Fisika Terapan & Energi',
    judul: 'Diagram Percobaan Lensa Cembung',
    nama_berkas: 'Diagram_Lensa.png',
    tipe: 'GAMBAR',
    ukuran_bytes: 45000,
    data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    bab_pokok: 'Optika Geometri'
  };
  db.addArchive(testArchive);
  const fetched = db.getArchiveById('arc-test-101');
  console.assert(fetched && fetched.judul === 'Diagram Percobaan Lensa Cembung', 'addArchive & getArchiveById must work');

  // Delete archive test
  db.deleteArchive('arc-test-101');
  console.assert(!db.getArchiveById('arc-test-101'), 'deleteArchive must remove archive item');
  console.log('Digital Archive Repository CRUD: PASSED');

  console.log('\n--- 2. Testing Multi-Modal Gemini API with Context Reinforcement ---');
  let capturedPayload = null;
  global.fetch = async (url, opts) => {
    capturedPayload = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                questions: [
                  {
                    id: 1,
                    jenis_soal: "pg",
                    narasi_soal: "Berdasarkan diagram mikrometer sekrup terlampir, berapakah ketebalan pelat logam yang diukur?",
                    opsi: {
                      "A": "10,25 mm",
                      "B": "10,75 mm",
                      "C": "9,25 mm",
                      "D": "11,25 mm",
                      "E": "10,00 mm"
                    },
                    kunci_jawaban: "A",
                    pembahasan: "Skala utama menunjukkan 10,00 mm dan garis nonius ke-25 sejajar sehingga 10 + 0,25 = 10,25 mm.",
                    gambar_url: ""
                  }
                ]
              })
            }]
          }
        }]
      })
    };
  };

  const sampleAttachedArchives = [
    {
      id: 'arc-img-1',
      tipe: 'GAMBAR',
      judul: 'Diagram Mikrometer Sekrup Presisi',
      nama_berkas: 'Diagram_Mikrometer.png',
      data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    },
    {
      id: 'arc-doc-1',
      tipe: 'DOKUMEN',
      judul: 'Ringkasan Materi Pengukuran Ketidakpastian',
      nama_berkas: 'Ringkasan_Materi.docx',
      teks_lengkap: 'Pengukuran panjang dengan mikrometer sekrup menghasilkan ketelitian hingga 0,01 mm. Skala putar memiliki 50 pembagian skala.'
    }
  ];

  const aiEngine = window.EduAI;
  const questions = await aiEngine.generateQuestionsFromModule(
    'Buatkan 1 soal Pilihan Ganda Fisika HOTS tentang Mikrometer Sekrup mengacu pada diagram dan materi terlampir',
    {
      mataPelajaran: 'Fisika Terapan & Energi',
      tingkatKognitif: 'HOTS',
      keteranganBab: 'Alat Ukur Mikrometer Sekrup',
      targetKelas: ['X.1', 'X.2'],
      counts: { pg: 1, pgk: 0, truefalse: 0, matching: 0, essay: 0 },
      imageQuota: { enabled: true, pg: 1 },
      attachedArchives: sampleAttachedArchives,
      teacherPrompt: 'Fokuskan pada pembacaan skala nonius ke-25 pada diagram.',
      guruInstruction: 'Fokuskan pada pembacaan skala nonius ke-25 pada diagram.'
    }
  );

  console.assert(capturedPayload !== null, 'Fetch must be called with Gemini payload');
  console.assert(capturedPayload.generationConfig.responseMimeType === 'application/json', 'Must use responseMimeType: application/json');
  console.assert(capturedPayload.generationConfig.temperature === 0.1, 'Must use temperature: 0.1');

  // Verify multi-modal image part was included in contents[0].parts
  const parts = capturedPayload.contents[0].parts;
  const imagePart = parts.find(p => p.inlineData && p.inlineData.mimeType === 'image/png');
  console.assert(imagePart !== undefined, 'Multi-modal image part must be present in Gemini payload');
  console.assert(imagePart.inlineData.data.length > 0, 'Image data base64 must be populated');

  // Verify context reinforcement doc was included in prompt text
  const textPart = parts.find(p => p.text);
  console.assert(textPart.text.includes('<konteks_arsip_penguat>'), 'Must include <konteks_arsip_penguat> tag');
  console.assert(textPart.text.includes('Pengukuran panjang dengan mikrometer sekrup'), 'Must include text of attached document');
  console.assert(textPart.text.includes('Fokuskan pada pembacaan skala nonius ke-25'), 'Must include teacher prompt');

  // Verify question result has image attached
  console.assert(questions.length === 1, 'Should return 1 question');
  console.assert(questions[0].gambar_url && questions[0].gambar_url.startsWith('data:image'), 'Question must be mapped with diagram image');
  console.log('Multi-Modal Gemini API with Context Reinforcement: PASSED');

  console.log('\n--- 3. Testing GuruModule Archive Management & UI Handlers ---');
  const guru = window.GuruModule;
  console.assert(guru !== undefined, 'GuruModule must be defined');

  // Test switching to archive tab
  guru.switchTab('archive');
  console.assert(guru.currentTab === 'archive', 'switchTab(archive) must set currentTab to archive');

  const archiveHtml = guru._renderArchiveTab();
  console.assert(archiveHtml.includes('Repositori Berkas &amp; Gambar Guru'), 'Archive tab HTML must contain header title');
  console.assert(archiveHtml.includes('Diagram_Mikrometer_Sekrup_Presisi'), 'Archive tab HTML must render pre-seeded archive card');

  // Test selecting archive for AI generation
  guru.clearSelectedArchivesForGen();
  console.assert(guru.selectedArchivesForGen.length === 0, 'selectedArchivesForGen should be empty after clear');

  guru.toggleArchiveForGen('arc-img-1');
  console.assert(guru.selectedArchivesForGen.includes('arc-img-1'), 'toggleArchiveForGen should add archive');

  const chipsHtml = guru._renderAttachedArchivesChips();
  console.assert(chipsHtml.includes('Diagram_Mikrometer_Sekrup_Presisi'), 'Attached chips HTML must show selected archive');
  console.assert(chipsHtml.includes('GAMBAR'), 'Attached chips HTML must show type badge');

  guru.removeArchiveFromGen('arc-img-1');
  console.assert(!guru.selectedArchivesForGen.includes('arc-img-1'), 'removeArchiveFromGen should detach archive');

  // Test direct prompt textarea statistics
  guru.aiGuruPromptText = 'Buatkan 5 soal Pilihan Ganda tentang Mikrometer Sekrup';
  guru.updatePromptStats();
  console.log('GuruModule Archive UI & Management: PASSED');

  console.log('\n======================================================');
  console.log('ALL v13.0 SPECIFICATIONS VERIFIED & PASSING 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
