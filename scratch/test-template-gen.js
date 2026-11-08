// Test Excel & Word Template Generation
const fs = require('fs');
const path = require('path');

// 1. Test Excel template generation using SheetJS (xlsx)
const XLSX = require('xlsx');

function generateExcelTemplateData() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Soal
  const headers = [
    'No',
    'Tipe Soal',
    'Narasi Soal',
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
    'Pilihan E',
    'Kunci Jawaban',
    'Pembahasan',
    'Tingkat Kognitif',
    'Materi Bab'
  ];

  const sampleRows = [
    [
      1,
      'PG',
      'Mikrometer sekrup memiliki tingkat ketelitian pengukuran sebesar...',
      '0,1 mm',
      '0,01 mm',
      '0,001 mm',
      '1 mm',
      '0,5 mm',
      'B',
      'Ketelitian skala nonius mikrometer sekrup adalah 0,01 mm.',
      'LOTS',
      'Alat Ukur'
    ],
    [
      2,
      'PGK',
      'Manakah pernyataan berikut yang BENAR mengenai besaran pokok? (Pilihan jawaban lebih dari satu)',
      'Massa bersatuan kilogram (kg)',
      'Waktu bersatuan sekon (s)',
      'Kecepatan bersatuan m/s',
      'Kuat arus listrik bersatuan ampere (A)',
      'Tekanan bersatuan pascal (Pa)',
      'A, B, D',
      'Massa, waktu, dan kuat arus merupakan besaran pokok. Kecepatan dan tekanan adalah besaran turunan.',
      'MOTS',
      'Besaran dan Satuan'
    ],
    [
      3,
      'Benar/Salah',
      'Jangka sorong memiliki ketelitian lebih tinggi daripada mikrometer sekrup dalam mengukur ketebalan kertas tipis.',
      '',
      '',
      '',
      '',
      '',
      'SALAH',
      'Mikrometer sekrup (0,01 mm) lebih teliti dibandingkan jangka sorong (0,1 mm).',
      'MOTS',
      'Alat Ukur'
    ],
    [
      4,
      'Menjodohkan',
      'Jodohkan besaran pokok fisika berikut dengan satuan SI yang tepat:',
      '',
      '',
      '',
      '',
      '',
      'Panjang=Meter; Massa=Kilogram; Suhu=Kelvin; Kuat Arus=Ampere',
      'Pasangan besaran pokok standar internasional dengan satuannya yang tepat.',
      'LOTS',
      'Besaran dan Satuan'
    ],
    [
      5,
      'Esai',
      'Jelaskan perbedaan mendasar antara besaran pokok dan besaran turunan serta berikan masing-masing 2 contoh!',
      '',
      '',
      '',
      '',
      '',
      'Besaran pokok adalah besaran yang satuannya telah ditetapkan terlebih dahulu (contoh: massa, panjang), sedangkan besaran turunan diturunkan dari besaran pokok (contoh: kecepatan, luas).',
      'Rubrik penilaian: Menjelaskan definisi dengan tepat (skor 50), menyebutkan 2 contoh besaran pokok (skor 25), menyebutkan 2 contoh besaran turunan (skor 25).',
      'HOTS',
      'Besaran dan Satuan'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tipe Soal
    { wch: 50 }, // Narasi Soal
    { wch: 25 }, // Pilihan A
    { wch: 25 }, // Pilihan B
    { wch: 25 }, // Pilihan C
    { wch: 25 }, // Pilihan D
    { wch: 25 }, // Pilihan E
    { wch: 30 }, // Kunci Jawaban
    { wch: 40 }, // Pembahasan
    { wch: 16 }, // Tingkat Kognitif
    { wch: 22 }  // Materi Bab
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');

  // Sheet 2: Panduan Pengisian
  const guideData = [
    ['PANDUAN LENGKAP PENGISIAN TEMPLATE SOAL SMAN 4 SOPPENG'],
    [''],
    ['Kolom', 'Keterangan & Format Penulisan'],
    ['No', 'Nomor urut butir soal (1, 2, 3, dst.)'],
    ['Tipe Soal', 'Pilih salah satu: PG, PGK, Benar/Salah, Menjodohkan, atau Esai'],
    ['Narasi Soal', 'Teks pertanyaan atau stimulus soal. Gunakan teks jelas.'],
    ['Pilihan A - E', 'Isi pilihan jawaban untuk tipe PG dan PGK. Kosongkan untuk Benar/Salah, Menjodohkan, dan Esai.'],
    ['Kunci Jawaban', 'Format kunci jawaban: \n- PG: A / B / C / D / E\n- PGK: Gabungan huruf dipisah koma (contoh: A, B, D)\n- Benar/Salah: Tulis "BENAR" atau "SALAH"\n- Menjodohkan: Pasangan dipisah tanda titik koma (contoh: Panjang=Meter; Massa=Kilogram)\n- Esai: Tuliskan rangkuman kunci jawaban atau pedoman penskoran.'],
    ['Pembahasan', 'Penjelasan materi atau pembahasan jawaban soal.'],
    ['Tingkat Kognitif', 'Pilih salah satu: LOTS (C1-C2), MOTS (C3), atau HOTS (C4-C6).'],
    ['Materi Bab', 'Nama bab atau pokok bahasan (contoh: Alat Ukur, Termodinamika, Listrik Dinamis).']
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

  return wb;
}

const wb = generateExcelTemplateData();
const outPath = path.join(__dirname, 'Template_Impor_Soal_SMAN4Soppeng.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Generated Excel Template successfully at:', outPath);

// Verify reading it back
const readWb = XLSX.readFile(outPath);
const sheetName = readWb.SheetNames[0];
const readRows = XLSX.utils.sheet_to_json(readWb.Sheets[sheetName]);
console.log('Read back rows from generated Excel:', readRows.length);
if (readRows.length === 5) {
  console.log('Excel Template Verification: PASSED ✅');
} else {
  console.error('Excel Template Verification: FAILED ❌');
  process.exit(1);
}

