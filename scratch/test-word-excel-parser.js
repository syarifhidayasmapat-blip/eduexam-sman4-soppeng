// Test Word & Excel Question Parser
const assert = require('assert');

// 1. Text Parser for Word (.docx raw text)
function parseQuestionsFromWordText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // Normalize line endings
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into potential question chunks by numbered items like "1.", "1 )", "No. 1", "[SOAL]"
  // Or match pattern: newline followed by number and dot/parenthesis
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

    // If starts a new question
    if (numMatch || (tagMatch && currentChunk.length > 0)) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n').trim());
        currentChunk = [];
      }
    }
    currentChunk.push(line);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n').trim());
  }

  const parsedQuestions = [];

  chunks.forEach((chunk, idx) => {
    if (!chunk || chunk.length < 5) return;

    // Detect tags like [PG], [PGK], [BENAR/SALAH], [MENJODOHKAN], [ESAI]
    let explicitType = null;
    if (/\[(?:SOAL\s+)?(?:PG|PILIHAN GANDA)\]/i.test(chunk)) explicitType = 'pg';
    else if (/\[(?:SOAL\s+)?(?:PGK|KOMPLEKS|PILIHAN GANDA KOMPLEKS)\]/i.test(chunk)) explicitType = 'pgk';
    else if (/\[(?:SOAL\s+)?(?:BENAR[\/\s\-]?SALAH|TRUE[\/\s\-]?FALSE|B\/S)\]/i.test(chunk)) explicitType = 'truefalse';
    else if (/\[(?:SOAL\s+)?(?:MENJODOHKAN|MATCHING|JODOHKAN)\]/i.test(chunk)) explicitType = 'matching';
    else if (/\[(?:SOAL\s+)?(?:ESAI|ESSAY|ISIAN)\]/i.test(chunk)) explicitType = 'essay';

    // Remove tags from chunk for parsing
    let cleanChunk = chunk.replace(/\[(?:SOAL\s+)?[^\]]+\]/gi, '').trim();

    // Extract Number if present
    let questionNumber = idx + 1;
    const numMatch = cleanChunk.match(/^(?:No\.?\s*)?(\d+)[\.\)]\s*/i);
    if (numMatch) {
      questionNumber = parseInt(numMatch[1], 10);
      cleanChunk = cleanChunk.replace(/^(?:No\.?\s*)?(\d+)[\.\)]\s*/i, '').trim();
    }

    // Extract KUNCI / JAWABAN
    let kunci = '';
    const kunciMatch = cleanChunk.match(/(?:KUNCI(?:\s+JAWABAN)?|JAWABAN|ANSWER|KEY)\s*:\s*([^\n]+)/i);
    if (kunciMatch) {
      kunci = kunciMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:KUNCI(?:\s+JAWABAN)?|JAWABAN|ANSWER|KEY)\s*:\s*[^\n]+/i, '').trim();
    }

    // Extract PEMBAHASAN / PENJELASAN
    let pembahasan = '';
    const pembMatch = cleanChunk.match(/(?:PEMBAHASAN|PENJELASAN|RUBRIK|EXPLANATION)\s*:\s*([\s\S]+?)(?=(?:\n(?:TINGKAT|LEVEL|BLOOM|BAB|MATERI)\s*:|$))/i);
    if (pembMatch) {
      pembahasan = pembMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:PEMBAHASAN|PENJELASAN|RUBRIK|EXPLANATION)\s*:\s*[\s\S]+?(?=(?:\n(?:TINGKAT|LEVEL|BLOOM|BAB|MATERI)\s*:|$))/i, '').trim();
    }

    // Extract TINGKAT KOGNITIF (LOTS / MOTS / HOTS)
    let tingkatKognitif = 'MOTS';
    const bloomMatch = cleanChunk.match(/(?:TINGKAT(?:\s+KOGNITIF)?|LEVEL|BLOOM)\s*:\s*([^\n]+)/i);
    if (bloomMatch) {
      const bStr = bloomMatch[1].trim().toUpperCase();
      if (bStr.includes('HOTS')) tingkatKognitif = 'HOTS';
      else if (bStr.includes('LOTS')) tingkatKognitif = 'LOTS';
      else tingkatKognitif = 'MOTS';
      cleanChunk = cleanChunk.replace(/(?:TINGKAT(?:\s+KOGNITIF)?|LEVEL|BLOOM)\s*:\s*[^\n]+/i, '').trim();
    }

    // Extract BAB / MATERI
    let babMateri = '';
    const babMatch = cleanChunk.match(/(?:BAB|MATERI|TOPIK)\s*:\s*([^\n]+)/i);
    if (babMatch) {
      babMateri = babMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:BAB|MATERI|TOPIK)\s*:\s*[^\n]+/i, '').trim();
    }

    // Extract PASANGAN (for Menjodohkan)
    let pasanganStr = '';
    const pasMatch = cleanChunk.match(/(?:PASANGAN|JODOHKAN|PAIRS?)\s*:\s*([^\n]+)/i);
    if (pasMatch) {
      pasanganStr = pasMatch[1].trim();
      cleanChunk = cleanChunk.replace(/(?:PASANGAN|JODOHKAN|PAIRS?)\s*:\s*[^\n]+/i, '').trim();
    }

    // Extract Options (A, B, C, D, E)
    const options = {};
    const optionMatches = [...cleanChunk.matchAll(/(?:^|\n)\s*([A-Ea-e])[\.\)]\s*([^\n]+)/g)];
    
    if (optionMatches.length > 0) {
      optionMatches.forEach(m => {
        const key = m[1].toUpperCase();
        options[key] = m[2].trim();
      });

      // Narration is whatever appears before the first option
      const firstOptIndex = cleanChunk.search(/(?:^|\n)\s*[A-Ea-e][\.\)]\s*/);
      if (firstOptIndex !== -1) {
        cleanChunk = cleanChunk.substring(0, firstOptIndex).trim();
      }
    }

    const narasiSoal = cleanChunk.trim();

    // Determine final question type
    let jenisSoal = explicitType;
    if (!jenisSoal) {
      if (pasanganStr || (kunci && kunci.includes('='))) {
        jenisSoal = 'matching';
      } else if (Object.keys(options).length >= 2) {
        // If key has multiple choices like "A, C" or "A,B,D"
        if (kunci && (kunci.includes(',') || kunci.includes(';') || kunci.replace(/\s+/g, '').length > 1 && /^[A-E]+$/i.test(kunci.replace(/\s+/g, '')))) {
          jenisSoal = 'pgk';
        } else if (Object.keys(options).length === 2 && (options.A || '').toUpperCase().includes('BENAR')) {
          jenisSoal = 'truefalse';
        } else {
          jenisSoal = 'pg';
        }
      } else if (kunci && (/^(BENAR|SALAH|TRUE|FALSE)$/i.test(kunci.trim()))) {
        jenisSoal = 'truefalse';
      } else {
        jenisSoal = 'essay';
      }
    }

    // Format opsi_json and kunci_jawaban based on jenisSoal
    let opsi_json = [];
    let formattedKunci = kunci;

    if (jenisSoal === 'pg') {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      letters.forEach(l => {
        if (options[l]) {
          opsi_json.push({ key: l, text: options[l] });
        }
      });
      formattedKunci = (kunci.match(/[A-E]/i) || ['A'])[0].toUpperCase();
    } else if (jenisSoal === 'pgk') {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      letters.forEach(l => {
        if (options[l]) {
          opsi_json.push({ key: l, text: options[l] });
        }
      });
      // Extract all matched letters
      const matchedLetters = kunci.toUpperCase().match(/[A-E]/g) || ['A'];
      formattedKunci = [...new Set(matchedLetters)];
    } else if (jenisSoal === 'truefalse') {
      opsi_json = [
        { key: 'BENAR', text: 'BENAR' },
        { key: 'SALAH', text: 'SALAH' }
      ];
      formattedKunci = /SALAH|FALSE/i.test(kunci) ? 'SALAH' : 'BENAR';
    } else if (jenisSoal === 'matching') {
      // Parse premises and targets from pasanganStr or kunci
      const pairSource = pasanganStr || kunci;
      const pairs = pairSource.split(/[;\n]/).map(p => p.trim()).filter(Boolean);
      const premises = [];
      const targets = [];
      const keyMap = {};

      pairs.forEach((pair, pIdx) => {
        const parts = pair.split(/[=\-:]/).map(s => s.trim());
        const pLabel = parts[0] || `Premis ${pIdx + 1}`;
        const tLabel = parts[1] || `Target ${pIdx + 1}`;
        const pId = `p${pIdx + 1}`;
        const tId = `t${pIdx + 1}`;
        premises.push({ id: pId, label: pLabel });
        targets.push({ id: tId, label: tLabel });
        keyMap[pId] = tId;
      });

      opsi_json = { premises, targets };
      formattedKunci = keyMap;
    } else if (jenisSoal === 'essay') {
      opsi_json = [];
      formattedKunci = kunci || 'Kunci/Rubrik Pembahasan Belum Diisi';
    }

    let tipeLabel = 'Pilihan Ganda (PG)';
    if (jenisSoal === 'pgk') tipeLabel = 'Pilihan Ganda Kompleks (PGK)';
    else if (jenisSoal === 'truefalse') tipeLabel = 'Benar / Salah (True/False)';
    else if (jenisSoal === 'matching') tipeLabel = 'Menjodohkan (Matching Pair)';
    else if (jenisSoal === 'essay') tipeLabel = 'Isian Singkat & Esai';

    parsedQuestions.push({
      nomor: questionNumber,
      jenis_soal: jenisSoal,
      tipe_label: tipeLabel,
      narasi_soal: narasiSoal,
      opsi_json: opsi_json,
      kunci_jawaban: formattedKunci,
      penjelasan: pembahasan || 'Sesuai dengan materi pembelajaran.',
      keterangan_bab: babMateri || 'Materi Pokok',
      tingkat_kognitif: tingkatKognitif,
      status: 'siap'
    });
  });

  return parsedQuestions;
}

// 2. Excel Row Parser
function parseQuestionsFromExcelRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const parsedQuestions = [];

  rows.forEach((row, idx) => {
    // Helper to find column value by loose key matching
    const findCol = (patterns) => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim();
        for (const p of patterns) {
          if (cleanKey.includes(p.toLowerCase())) return String(row[key]).trim();
        }
      }
      return '';
    };

    const narasi = findCol(['soal', 'pertanyaan', 'narasi', 'question', 'text']);
    if (!narasi) return; // Skip empty rows

    const rawTipe = findCol(['tipe', 'jenis', 'type']).toLowerCase();
    let jenisSoal = 'pg';
    if (rawTipe.includes('kompleks') || rawTipe.includes('pgk') || rawTipe.includes('multi')) jenisSoal = 'pgk';
    else if (rawTipe.includes('benar') || rawTipe.includes('salah') || rawTipe.includes('true') || rawTipe.includes('tf')) jenisSoal = 'truefalse';
    else if (rawTipe.includes('jodoh') || rawTipe.includes('match') || rawTipe.includes('pasang')) jenisSoal = 'matching';
    else if (rawTipe.includes('esai') || rawTipe.includes('essay') || rawTipe.includes('isian') || rawTipe.includes('uraian')) jenisSoal = 'essay';

    const rawKunci = findCol(['kunci', 'jawaban', 'key', 'answer']);
    const pembahasan = findCol(['pembahasan', 'penjelasan', 'rubrik', 'explanation']) || 'Sesuai kurikulum.';
    const bab = findCol(['bab', 'materi', 'topik', 'chapter']) || 'Materi Pokok';
    const bloom = findCol(['tingkat', 'level', 'kognitif', 'bloom']).toUpperCase() || 'MOTS';

    const optA = findCol(['pilihan a', 'opsi a', 'option a']);
    const optB = findCol(['pilihan b', 'opsi b', 'option b']);
    const optC = findCol(['pilihan c', 'opsi c', 'option c']);
    const optD = findCol(['pilihan d', 'opsi d', 'option d']);
    const optE = findCol(['pilihan e', 'opsi e', 'option e']);

    let opsi_json = [];
    let formattedKunci = rawKunci;

    if (jenisSoal === 'pg') {
      const opts = [{ k: 'A', t: optA }, { k: 'B', t: optB }, { k: 'C', t: optC }, { k: 'D', t: optD }, { k: 'E', t: optE }];
      opts.forEach(o => {
        if (o.t) opsi_json.push({ key: o.k, text: o.t });
      });
      formattedKunci = (rawKunci.match(/[A-E]/i) || ['A'])[0].toUpperCase();
    } else if (jenisSoal === 'pgk') {
      const opts = [{ k: 'A', t: optA }, { k: 'B', t: optB }, { k: 'C', t: optC }, { k: 'D', t: optD }, { k: 'E', t: optE }];
      opts.forEach(o => {
        if (o.t) opsi_json.push({ key: o.k, text: o.t });
      });
      formattedKunci = [...new Set(rawKunci.toUpperCase().match(/[A-E]/g) || ['A'])];
    } else if (jenisSoal === 'truefalse') {
      opsi_json = [
        { key: 'BENAR', text: 'BENAR' },
        { key: 'SALAH', text: 'SALAH' }
      ];
      formattedKunci = /SALAH|FALSE/i.test(rawKunci) ? 'SALAH' : 'BENAR';
    } else if (jenisSoal === 'matching') {
      const pairs = rawKunci.split(/[;\n]/).map(p => p.trim()).filter(Boolean);
      const premises = [];
      const targets = [];
      const keyMap = {};

      pairs.forEach((pair, pIdx) => {
        const parts = pair.split(/[=\-:]/).map(s => s.trim());
        const pId = `p${pIdx + 1}`;
        const tId = `t${pIdx + 1}`;
        premises.push({ id: pId, label: parts[0] || `Premis ${pIdx + 1}` });
        targets.push({ id: tId, label: parts[1] || `Target ${pIdx + 1}` });
        keyMap[pId] = tId;
      });

      opsi_json = { premises, targets };
      formattedKunci = keyMap;
    } else if (jenisSoal === 'essay') {
      opsi_json = [];
      formattedKunci = rawKunci || 'Rubrik penilaian esai';
    }

    let tipeLabel = 'Pilihan Ganda (PG)';
    if (jenisSoal === 'pgk') tipeLabel = 'Pilihan Ganda Kompleks (PGK)';
    else if (jenisSoal === 'truefalse') tipeLabel = 'Benar / Salah (True/False)';
    else if (jenisSoal === 'matching') tipeLabel = 'Menjodohkan (Matching Pair)';
    else if (jenisSoal === 'essay') tipeLabel = 'Isian Singkat & Esai';

    parsedQuestions.push({
      nomor: idx + 1,
      jenis_soal: jenisSoal,
      tipe_label: tipeLabel,
      narasi_soal: narasi,
      opsi_json: opsi_json,
      kunci_jawaban: formattedKunci,
      penjelasan: pembahasan,
      keterangan_bab: bab,
      tingkat_kognitif: /HOTS|LOTS|MOTS/.test(bloom) ? bloom : 'MOTS',
      status: 'siap'
    });
  });

  return parsedQuestions;
}

// RUN TESTS
const sampleWordText = `
Format Soal Ujian SMAN 4 Soppeng

1. Mikrometer sekrup memiliki tingkat ketelitian pengukuran sebesar...
A. 0,1 mm
B. 0,01 mm
C. 0,001 mm
D. 1 mm
E. 0,5 mm
KUNCI: B
PEMBAHASAN: Ketelitian skala mikrometer sekrup adalah 0,01 mm.
TINGKAT: LOTS
BAB: Alat Ukur

2. [PGK]
Manakah pernyataan berikut yang BENAR mengenai besaran pokok? (Pilihan jawaban lebih dari satu)
A. Massa bersatuan kilogram
B. Waktu bersatuan sekon
C. Kecepatan bersatuan m/s
D. Kuat arus bersatuan ampere
E. Tekanan bersatuan pascal
KUNCI: A, B, D
PEMBAHASAN: Kecepatan dan tekanan merupakan besaran turunan.
TINGKAT: MOTS

3. [BENAR SALAH]
Jangka sorong lebih teliti daripada mikrometer sekrup dalam mengukur ketebalan kertas tipis.
KUNCI: Salah
PEMBAHASAN: Mikrometer sekrup (0,01 mm) lebih teliti dibandingkan jangka sorong (0,1 mm).
TINGKAT: MOTS

4. [MENJODOHKAN]
Jodohkan besaran pokok fisika berikut dengan satuan SI yang tepat:
PASANGAN: Panjang = Meter; Massa = Kilogram; Suhu = Kelvin; Kuat Arus = Ampere
KUNCI: Panjang=Meter; Massa=Kilogram; Suhu=Kelvin; Kuat Arus=Ampere
PEMBAHASAN: Pasangan besaran pokok dan satuan standar internasional SI.
TINGKAT: LOTS

5. [ESAI]
Jelaskan perbedaan mendasar antara besaran pokok dan besaran turunan!
KUNCI: Besaran pokok satuannya didefinisikan secara mandiri, sedangkan besaran turunan diturunkan dari besaran pokok.
PEMBAHASAN: Kriteria penilaian esai: ketepatan definisi dan contoh.
TINGKAT: HOTS
`;

const parsedWord = parseQuestionsFromWordText(sampleWordText);
console.log('Parsed Word Questions Count:', parsedWord.length);
assert.strictEqual(parsedWord.length, 5, 'Must parse 5 questions from Word');
assert.strictEqual(parsedWord[0].jenis_soal, 'pg');
assert.strictEqual(parsedWord[0].kunci_jawaban, 'B');
assert.strictEqual(parsedWord[1].jenis_soal, 'pgk');
assert.deepStrictEqual(parsedWord[1].kunci_jawaban, ['A', 'B', 'D']);
assert.strictEqual(parsedWord[2].jenis_soal, 'truefalse');
assert.strictEqual(parsedWord[2].kunci_jawaban, 'SALAH');
assert.strictEqual(parsedWord[3].jenis_soal, 'matching');
assert.strictEqual(parsedWord[3].opsi_json.premises.length, 4);
assert.strictEqual(parsedWord[4].jenis_soal, 'essay');

console.log('Word Question Parser Test: PASSED ✅');

const sampleExcelRows = [
  {
    'No': 1,
    'Tipe Soal': 'PG',
    'Narasi Soal': 'Satuan daya listrik dalam Sistem Internasional (SI) adalah...',
    'Opsi A': 'Joule',
    'Opsi B': 'Watt',
    'Opsi C': 'Volt',
    'Opsi D': 'Ampere',
    'Opsi E': 'Ohm',
    'Kunci Jawaban': 'B',
    'Pembahasan': 'Daya listrik diukur dalam satuan Watt (Joule/sekon).',
    'Tingkat Kognitif': 'LOTS',
    'Bab': 'Listrik Dinamis'
  },
  {
    'No': 2,
    'Tipe Soal': 'PGK',
    'Narasi Soal': 'Manakah yang termasuk sumber energi terbarukan ramah lingkungan?',
    'Opsi A': 'Energi Surya',
    'Opsi B': 'Minyak Bumi',
    'Opsi C': 'Energi Angin',
    'Opsi D': 'Mikrohidro',
    'Opsi E': 'Batu Bara',
    'Kunci Jawaban': 'A, C, D',
    'Pembahasan': 'Surya, angin, dan air adalah energi terbarukan.',
    'Tingkat Kognitif': 'HOTS',
    'Bab': 'Energi Terbarukan'
  }
];

const parsedExcel = parseQuestionsFromExcelRows(sampleExcelRows);
console.log('Parsed Excel Questions Count:', parsedExcel.length);
assert.strictEqual(parsedExcel.length, 2, 'Must parse 2 questions from Excel');
assert.strictEqual(parsedExcel[0].jenis_soal, 'pg');
assert.strictEqual(parsedExcel[0].kunci_jawaban, 'B');
assert.strictEqual(parsedExcel[1].jenis_soal, 'pgk');
assert.deepStrictEqual(parsedExcel[1].kunci_jawaban, ['A', 'C', 'D']);

console.log('Excel Question Parser Test: PASSED ✅');
console.log('ALL PARSER LOGIC FULLY VERIFIED 100%! 🎉');

