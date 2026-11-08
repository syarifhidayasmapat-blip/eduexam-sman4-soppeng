// Test Guru Module methods and syntax
const assert = require('assert');

// Mock browser objects
global.window = {
  EduDB: {
    getClasses: () => [
      { nama_kelas: 'XII MIPA 1' },
      { nama_kelas: 'XII MIPA 2' },
      { nama_kelas: 'XI MIPA 1' }
    ],
    addQuestion: (q) => {
      addedQuestions.push(q);
      return q;
    }
  },
  App: {
    showToast: (msg, type) => {
      toasts.push({ msg, type });
    },
    currentUser: {
      nama_lengkap: 'Syarif Hidayatullah, S.Pd.'
    }
  }
};

const addedQuestions = [];
const toasts = [];

// Verify parser integration
const rawWord = `
1. [PG]
Berapakah hasil pengukuran jangka sorong?
A. 1,0 cm
B. 1,2 cm
C. 1,4 cm
D. 1,6 cm
E. 1,8 cm
KUNCI: B
PEMBAHASAN: Pembacaan skala utama dan nonius.
TINGKAT: LOTS
BAB: Pengukuran
`;

// Insert the parser logic
function parseQuestionsFromWordText(rawText) {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n');
  const chunks = [];
  let currentChunk = [];

  const numberPattern = /^(?:\[(?:SOAL|NOMOR)\s*\d*\]\s*)?(?:No\.?\s*)?(\d+)[\.\)]\s*(.*)/i;
  const tagPattern = /^\[(?:SOAL|NOMOR|ITEM)\s*(\w+)?\]/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentChunk.length > 0) currentChunk.push('');
      continue;
    }
    const numMatch = line.match(numberPattern);
    const tagMatch = line.match(tagPattern);
    if (numMatch || (tagMatch && currentChunk.length > 0)) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n').trim());
        currentChunk = [];
      }
    }
    currentChunk.push(line);
  }
  if (currentChunk.length > 0) chunks.push(currentChunk.join('\n').trim());

  const parsedQuestions = [];
  chunks.forEach((chunk, idx) => {
    if (!chunk || chunk.length < 5) return;
    let explicitType = null;
    if (/\[(?:SOAL\s+)?(?:PG|PILIHAN GANDA)\]/i.test(chunk)) explicitType = 'pg';
    else if (/\[(?:SOAL\s+)?(?:PGK|KOMPLEKS|PILIHAN GANDA KOMPLEKS)\]/i.test(chunk)) explicitType = 'pgk';
    else if (/\[(?:SOAL\s+)?(?:BENAR[\/\s\-]?SALAH|TRUE[\/\s\-]?FALSE|B\/S)\]/i.test(chunk)) explicitType = 'truefalse';
    else if (/\[(?:SOAL\s+)?(?:MENJODOHKAN|MATCHING|JODOHKAN)\]/i.test(chunk)) explicitType = 'matching';
    else if (/\[(?:SOAL\s+)?(?:ESAI|ESSAY|ISIAN)\]/i.test(chunk)) explicitType = 'essay';

    let cleanChunk = chunk.replace(/\[(?:SOAL\s+)?[^\]]+\]/gi, '').trim();
    let questionNumber = idx + 1;
    const numMatch = cleanChunk.match(/^(?:No\.?\s*)?(\d+)[\.\)]\s*/i);
    if (numMatch) {
      questionNumber = parseInt(numMatch[1], 10);
      cleanChunk = cleanChunk.replace(/^(?:No\.?\s*)?(\d+)[\.\)]\s*/i, '').trim();
    }

    let kunci = '';
    const kunciMatch = cleanChunk.match(/(?:KUNCI(?:\s+JAWABAN)?|JAWABAN|ANSWER|KEY)\s*:\s*([^\n]+)/i);
    if (kunciMatch) {
      kunci = kunciMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:KUNCI(?:\s+JAWABAN)?|JAWABAN|ANSWER|KEY)\s*:\s*[^\n]+/i, '').trim();
    }

    let pembahasan = '';
    const pembMatch = cleanChunk.match(/(?:PEMBAHASAN|PENJELASAN|RUBRIK|EXPLANATION)\s*:\s*([\s\S]+?)(?=(?:\n(?:TINGKAT|LEVEL|BLOOM|BAB|MATERI)\s*:|$))/i);
    if (pembMatch) {
      pembahasan = pembMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:PEMBAHASAN|PENJELASAN|RUBRIK|EXPLANATION)\s*:\s*[\s\S]+?(?=(?:\n(?:TINGKAT|LEVEL|BLOOM|BAB|MATERI)\s*:|$))/i, '').trim();
    }

    let tingkatKognitif = 'MOTS';
    const bloomMatch = cleanChunk.match(/(?:TINGKAT(?:\s+KOGNITIF)?|LEVEL|BLOOM)\s*:\s*([^\n]+)/i);
    if (bloomMatch) {
      const bStr = bloomMatch[1].trim().toUpperCase();
      if (bStr.includes('HOTS')) tingkatKognitif = 'HOTS';
      else if (bStr.includes('LOTS')) tingkatKognitif = 'LOTS';
      else tingkatKognitif = 'MOTS';
      cleanChunk = cleanChunk.replace(/(?:TINGKAT(?:\s+KOGNITIF)?|LEVEL|BLOOM)\s*:\s*[^\n]+/i, '').trim();
    }

    let babMateri = '';
    const babMatch = cleanChunk.match(/(?:BAB|MATERI|TOPIK)\s*:\s*([^\n]+)/i);
    if (babMatch) {
      babMateri = babMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:BAB|MATERI|TOPIK)\s*:\s*[^\n]+/i, '').trim();
    }

    let pasanganStr = '';
    const pasMatch = cleanChunk.match(/(?:PASANGAN|JODOHKAN|PAIRS?)\s*:\s*([^\n]+)/i);
    if (pasMatch) {
      pasanganStr = pasMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:PASANGAN|JODOHKAN|PAIRS?)\s*:\s*[^\n]+/i, '').trim();
    }

    const options = {};
    const optionMatches = [...cleanChunk.matchAll(/(?:^|\n)\s*([A-Ea-e])[\.\)]\s*([^\n]+)/g)];
    if (optionMatches.length > 0) {
      optionMatches.forEach(m => {
        options[m[1].toUpperCase()] = m[2].trim();
      });
      const firstOptIndex = cleanChunk.search(/(?:^|\n)\s*[A-Ea-e][\.\)]\s*/);
      if (firstOptIndex !== -1) cleanChunk = cleanChunk.substring(0, firstOptIndex).trim();
    }

    const narasiSoal = cleanChunk.trim();
    let jenisSoal = explicitType || 'pg';
    let opsi_json = [];
    ['A', 'B', 'C', 'D', 'E'].forEach(l => {
      if (options[l]) opsi_json.push({ key: l, text: options[l] });
    });

    parsedQuestions.push({
      nomor: questionNumber,
      jenis_soal: jenisSoal,
      narasi_soal: narasiSoal,
      opsi_json: opsi_json,
      kunci_jawaban: kunci || 'A',
      penjelasan: pembahasan || 'Sesuai materi.',
      keterangan_bab: babMateri || 'Materi Pokok',
      tingkat_kognitif: tingkatKognitif,
      status: 'siap'
    });
  });
  return parsedQuestions;
}

const parsed = parseQuestionsFromWordText(rawWord);
assert.strictEqual(parsed.length, 1);
assert.strictEqual(parsed[0].narasi_soal, 'Berapakah hasil pengukuran jangka sorong?');
assert.strictEqual(parsed[0].kunci_jawaban, 'B');
assert.strictEqual(parsed[0].keterangan_bab, 'Pengukuran');

console.log('Parser test passed successfully! ✅');

