const fs = require('fs');
const path = require('path');

const guruFile = path.join(__dirname, '..', 'js', 'guru.js');
let content = fs.readFileSync(guruFile, 'utf8');

// Define new import methods
const newImportMethods = `  // =========================================================================
  // 2. TAB IMPOR SOAL MASSAL (MICROSOFT WORD & EXCEL) DENGAN TEMPLATE RESMI
  // =========================================================================
  _renderImportSoalTab() {
    this._ensureActiveSubject();
    const classes = window.EduDB.getClasses ? window.EduDB.getClasses() : [];
    const questionCount = (this.tempGeneratedQuestions || []).length;

    // Hitung rincian tipe soal dan tingkat kognitif
    let countPG = 0, countPGK = 0, countTF = 0, countMatching = 0, countEssay = 0;
    let countLots = 0, countMots = 0, countHots = 0;
    (this.tempGeneratedQuestions || []).forEach(q => {
      const t = q.jenis_soal || 'pg';
      if (t === 'pg') countPG++;
      else if (t === 'pgk') countPGK++;
      else if (t === 'truefalse') countTF++;
      else if (t === 'matching') countMatching++;
      else if (t === 'essay') countEssay++;

      const k = (q.tingkat_kognitif || 'MOTS').toUpperCase();
      if (k.includes('LOTS')) countLots++;
      else if (k.includes('HOTS')) countHots++;
      else countMots++;
    });

    return \`
      <div class="space-y-6">
        <!-- Banner Header Impor Soal Massal -->
        <div class="bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-teal-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/30 text-teal-200 border border-teal-400/30 mb-2">
              <i class="fa-solid fa-file-import text-amber-300"></i> CBT Question Importer &bull; SMAN 4 Soppeng
            </div>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              Impor Soal Massal (Word &amp; Excel)
            </h2>
            <p class="text-xs sm:text-sm text-teal-100/90 mt-1">
              Mata Pelajaran Aktif: <strong class="text-amber-300">\${this.activeSubject}</strong> &bull; Unggah butir soal sekaligus dengan template resmi.
            </p>
          </div>

          <!-- Download Template Action Buttons -->
          <div class="flex flex-wrap items-center gap-3">
            <button type="button" onclick="window.GuruModule.downloadExcelTemplate()" class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0" title="Unduh format spreadsheet Excel dengan 5 tipe soal & panduan">
              <i class="fa-solid fa-file-excel text-base text-emerald-200"></i>
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
            <button type="button" onclick="window.GuruModule.downloadWordTemplate()" class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0" title="Unduh format dokumen Word standar CBT SMAN 4 Soppeng">
              <i class="fa-solid fa-file-word text-base text-blue-200"></i>
              <span>Unduh Template Word (.docx)</span>
            </button>
          </div>
        </div>

        <!-- 3-Step Process Flow Info Bar -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm shrink-0">1</div>
            <div>
              <h4 class="text-xs font-bold text-slate-800">Unduh Template Resmi</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Pilih template Excel (.xlsx) atau Word (.docx) sesuai preferensi penyusunan Anda.</p>
            </div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">2</div>
            <div>
              <h4 class="text-xs font-bold text-slate-800">Tulis Butir Soal</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Mendukung 5 tipe soal: PG, PGK, Benar/Salah, Menjodohkan, dan Esai lengkap beserta kunci &amp; pembahasan.</p>
            </div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0">3</div>
            <div>
              <h4 class="text-xs font-bold text-slate-800">Unggah, Telaah &amp; Simpan</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Sistem membedah naskah secara instan. Telaah dan edit kartu draf sebelum disimpan ke Bank Soal.</p>
            </div>
          </div>
        </div>

        <!-- Main Workspace: Form & Upload (Left) + Interactive Question Cards (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Kolom Kiri: Form Upload & Konfigurasi Sasaran (5 Cols) -->
          <div class="lg:col-span-5 space-y-5">
            <!-- Box Unggah Berkas Drag & Drop -->
            <div class="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <i class="fa-solid fa-cloud-arrow-up text-teal-600"></i>
                  Unggah Berkas Soal
                </h3>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  .xlsx / .xls / .docx / .doc
                </span>
              </div>

              <!-- Interactive Drag & Drop Area -->
              <div 
                id="question-import-dropzone"
                onclick="document.getElementById('question-import-file-input').click()"
                ondragover="event.preventDefault(); this.classList.add('border-teal-500', 'bg-teal-50/50');"
                ondragleave="event.preventDefault(); this.classList.remove('border-teal-500', 'bg-teal-50/50');"
                ondrop="event.preventDefault(); this.classList.remove('border-teal-500', 'bg-teal-50/50'); window.GuruModule.handleQuestionFileImport(event);"
                class="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
              >
                <input 
                  type="file" 
                  id="question-import-file-input" 
                  accept=".xlsx,.xls,.docx,.doc,.csv" 
                  class="hidden" 
                  onchange="window.GuruModule.handleQuestionFileImport(event)"
                >
                <div class="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-100 text-teal-700 flex items-center justify-center text-2xl shadow-xs transition group-hover:scale-105">
                  <i class="fa-solid fa-file-arrow-up"></i>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-800">
                    Klik untuk Memilih Berkas atau Tarik ke Sini
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Mendukung Spreadsheet Excel (.xlsx, .xls) dan Dokumen Word (.docx, .doc)
                  </p>
                </div>
                <div class="flex items-center gap-2 pt-1">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <i class="fa-solid fa-file-excel"></i> Excel .XLSX
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <i class="fa-solid fa-file-word"></i> Word .DOCX
                  </span>
                </div>
              </div>
            </div>

            <!-- Box Konfigurasi Sasaran Asesmen -->
            <div class="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <i class="fa-solid fa-sliders text-teal-600"></i>
                  Konfigurasi Sasaran Asesmen
                </h3>
                <span class="text-[10px] text-slate-400 font-semibold">Diterapkan ke butir impor</span>
              </div>

              <!-- Mata Pelajaran Aktif (Display) -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-teal-900 flex items-center gap-2">
                  <i class="fa-solid fa-book-bookmark text-teal-600"></i>
                  \${this.activeSubject}
                </div>
              </div>

              <!-- Multi-Target Kelas Checkboxes -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-700">
                    Target Kelas Peserta Ujian:
                  </label>
                  <div class="flex items-center gap-1">
                    <button type="button" onclick="window.GuruModule.toggleAllImportClasses(true)" class="text-[10px] font-bold text-teal-700 hover:underline">Semua</button>
                    <span class="text-slate-300">|</span>
                    <button type="button" onclick="window.GuruModule.toggleAllImportClasses(false)" class="text-[10px] font-bold text-slate-500 hover:underline">Reset</button>
                  </div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                  \${classes.map(c => \`
                    <label class="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input type="checkbox" name="import_target_class_checkbox" value="\${c.nama_kelas}" checked onchange="window.GuruModule.updateImportClassSummary()" class="w-3.5 h-3.5 text-teal-600 rounded">
                      <span class="truncate">\${c.nama_kelas}</span>
                    </label>
                  \`).join('')}
                </div>
                <span id="import-class-summary-text" class="block text-[10px] font-bold text-teal-800 italic">
                  Terpilih: Semua Kelas
                </span>
              </div>

              <!-- Kategori Penilaian: Formatif vs Sumatif -->
              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-700">Kategori Penilaian:</label>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-teal-50/50 cursor-pointer select-none">
                    <input type="radio" name="import_category" id="import-kategori-formatif" value="formatif" checked onchange="window.GuruModule.setImportAssessmentCategory('formatif')" class="w-4 h-4 text-teal-600">
                    <div>
                      <span class="block text-xs font-bold text-slate-800">Formatif</span>
                      <span class="block text-[10px] text-slate-500">Kuis / Diagnostik / Tugas</span>
                    </div>
                  </label>
                  <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-teal-50/50 cursor-pointer select-none">
                    <input type="radio" name="import_category" id="import-kategori-sumatif" value="sumatif" onchange="window.GuruModule.setImportAssessmentCategory('sumatif')" class="w-4 h-4 text-teal-600">
                    <div>
                      <span class="block text-xs font-bold text-slate-800">Sumatif</span>
                      <span class="block text-[10px] text-slate-500">PTS / PAS Semester</span>
                    </div>
                  </label>
                </div>

                <!-- Sub-opsi Formatif -->
                <div id="import-formatif-sub" class="space-y-2">
                  <label class="block text-[11px] font-bold text-slate-600">Jenis Asesmen Formatif:</label>
                  <select id="import-q-jenis-formatif" class="w-full p-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-800">
                    <option value="Kuis Harian" selected>Kuis Harian</option>
                    <option value="Asesmen Diagnostik Awal">Asesmen Diagnostik Awal</option>
                    <option value="Tugas Mandiri / Proyek">Tugas Mandiri / Proyek</option>
                    <option value="Formatif Bab">Formatif Bab</option>
                  </select>
                </div>

                <!-- Sub-opsi Sumatif -->
                <div id="import-sumatif-sub" class="hidden space-y-2">
                  <label class="block text-[11px] font-bold text-slate-600">Periode Ujian Sumatif:</label>
                  <select id="import-q-periode-sumatif" class="w-full p-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-800">
                    <option value="Penilaian Tengah Semester (PTS)" selected>Penilaian Tengah Semester (PTS)</option>
                    <option value="Penilaian Akhir Semester (PAS)">Penilaian Akhir Semester (PAS)</option>
                    <option value="Asesmen Akhir Jenjang (US)">Asesmen Akhir Jenjang (US)</option>
                  </select>
                </div>
              </div>

              <!-- Bab / Materi Pokok & Status Simpan -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Materi / Bab Pokok:</label>
                  <input type="text" id="import-q-bab" placeholder="Contoh: Pengukuran" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800" value="Materi Pokok">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Status Publikasi:</label>
                  <select id="import-q-status" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800">
                    <option value="siap" selected>🟢 Siap Ujian (Aktif)</option>
                    <option value="draf">🟡 Draf (Belum Aktif)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Petunjuk Format Singkat -->
            <div class="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2 text-xs text-amber-900">
              <div class="flex items-center gap-2 font-bold text-amber-950">
                <i class="fa-solid fa-lightbulb text-amber-600"></i>
                Tips Impor Berkas Cepat:
              </div>
              <ul class="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                <li>Gunakan kolom <strong>Tipe Soal</strong>: PG, PGK, Benar/Salah, Menjodohkan, atau Esai.</li>
                <li>Pada Word, awali setiap butir dengan format standar: <code>1. [PG]</code>, <code>2. [PGK]</code>, dst.</li>
                <li>Sertakan baris <code>KUNCI:</code> dan <code>PEMBAHASAN:</code> untuk penskoran otomatis.</li>
              </ul>
            </div>
          </div>

          <!-- Kolom Kanan: Pratinjau Soal & Aksi Simpan (7 Cols) -->
          <div class="lg:col-span-7 space-y-4">
            <!-- Header Ringkasan & Stat Cards -->
            <div class="bg-white rounded-3xl shadow-xs border border-slate-200 p-5 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-list-check text-teal-600"></i>
                    Hasil Telaah &amp; Pratinjau Butir Soal
                  </h3>
                  <p class="text-xs text-slate-500">
                    Tinjau butir soal yang berhasil diekstrak. Anda dapat mengedit teks narasi, mengubah opsi, dan menyesuaikan kunci jawaban secara instan.
                  </p>
                </div>
                <div id="ai-gen-count-badge" class="text-xs font-bold px-3 py-1.5 rounded-xl \${questionCount > 0 ? 'bg-teal-100 text-teal-900 border border-teal-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                  \${questionCount} Butir Draf Siap
                </div>
              </div>

              <!-- Stat Badges Breakdown -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span class="text-[10px] text-slate-500 font-bold block uppercase">Total Soal</span>
                  <span class="text-base font-black text-slate-800">\${questionCount} Butir</span>
                </div>
                <div class="p-2 rounded-xl bg-blue-50 border border-blue-200">
                  <span class="text-[10px] text-blue-700 font-bold block uppercase">PG &bull; PGK</span>
                  <span class="text-base font-black text-blue-900">\${countPG} / \${countPGK}</span>
                </div>
                <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span class="text-[10px] text-emerald-700 font-bold block uppercase">B/S &bull; Jodoh</span>
                  <span class="text-base font-black text-emerald-900">\${countTF} / \${countMatching}</span>
                </div>
                <div class="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <span class="text-[10px] text-purple-700 font-bold block uppercase">Esai &bull; HOTS</span>
                  <span class="text-base font-black text-purple-900">\${countEssay} &bull; \${countHots}</span>
                </div>
              </div>

              <!-- Action Bar Atas -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div class="flex items-center gap-2">
                  <button type="button" onclick="window.GuruModule.addNewDraftQuestion()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1">
                    <i class="fa-solid fa-plus text-teal-600"></i> Tambah Butir
                  </button>
                  <button type="button" onclick="window.GuruModule.clearAllTempQuestions()" class="px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-transparent hover:border-rose-200 transition flex items-center gap-1 \${questionCount > 0 ? '' : 'hidden'}">
                    <i class="fa-solid fa-trash-can"></i> Kosongkan
                  </button>
                </div>
                \${questionCount > 0 ? \`
                  <button type="button" onclick="window.GuruModule.saveImportedQuestions('siap')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2">
                    <i class="fa-solid fa-floppy-disk text-amber-300"></i> Simpan Semua ke Bank Soal (\${questionCount})
                  </button>
                \` : ''}
              </div>
            </div>

            <!-- Dynamic Question Cards List -->
            <div id="ai-generated-results-container" class="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              \${questionCount === 0 ? this._renderEmptyGeneratedState() : this._renderTempGeneratedCards()}
            </div>

            <!-- Bottom Sticky Save Bar -->
            <div id="ai-save-all-bar" class="\${questionCount > 0 ? '' : 'hidden'} sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div class="text-xs text-slate-600 font-semibold flex items-center gap-2">
                <i class="fa-solid fa-circle-check text-teal-600 text-base"></i>
                <span>Siap disimpan: <strong>\${questionCount} butir soal</strong> ke mapel \${this.activeSubject}</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.GuruModule.saveImportedQuestions('draf')" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5" title="Simpan sebagai draf yang belum dapat diakses siswa">
                  <i class="fa-solid fa-file-pen"></i> Simpan Draf
                </button>
                <button type="button" onclick="window.GuruModule.saveImportedQuestions('siap')" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md transition flex items-center gap-2" title="Publikasikan langsung ke Bank Soal Siap Ujian">
                  <i class="fa-solid fa-cloud-arrow-down text-amber-300"></i> Simpan ke Bank Soal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    \`;
  }

  // Alias compatibility
  _renderAIGeneratorTab() {
    return this._renderImportSoalTab();
  }

  runAIGenerator() {
    this.switchTab('import-soal');
  }

  // --- UNDUH TEMPLATE RESMI EXCEL & WORD ---
  downloadExcelTemplate() {
    const title = 'Template_Impor_Soal_SMAN4Soppeng';
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();

      const headers = [
        'No', 'Tipe Soal', 'Narasi Soal', 
        'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E', 
        'Kunci Jawaban', 'Pembahasan', 'Tingkat Kognitif', 'Materi Bab'
      ];

      const sampleRows = [
        [
          1, 'PG', 'Mikrometer sekrup memiliki tingkat ketelitian pengukuran sebesar...',
          '0,1 mm', '0,01 mm', '0,001 mm', '1 mm', '0,5 mm',
          'B', 'Ketelitian skala nonius mikrometer sekrup adalah 0,01 mm.', 'LOTS', 'Alat Ukur'
        ],
        [
          2, 'PGK', 'Manakah pernyataan berikut yang BENAR mengenai besaran pokok? (Pilihan jawaban lebih dari satu)',
          'Massa bersatuan kilogram (kg)', 'Waktu bersatuan sekon (s)', 'Kecepatan bersatuan m/s', 'Kuat arus listrik bersatuan ampere (A)', 'Tekanan bersatuan pascal (Pa)',
          'A, B, D', 'Massa, waktu, dan kuat arus merupakan besaran pokok.', 'MOTS', 'Besaran dan Satuan'
        ],
        [
          3, 'Benar/Salah', 'Jangka sorong memiliki ketelitian lebih tinggi daripada mikrometer sekrup dalam mengukur ketebalan kertas tipis.',
          '', '', '', '', '',
          'SALAH', 'Mikrometer sekrup (0,01 mm) lebih teliti dibandingkan jangka sorong (0,1 mm).', 'MOTS', 'Alat Ukur'
        ],
        [
          4, 'Menjodohkan', 'Jodohkan besaran pokok fisika berikut dengan satuan SI yang tepat:',
          '', '', '', '', '',
          'Panjang=Meter; Massa=Kilogram; Suhu=Kelvin; Kuat Arus=Ampere', 'Pasangan besaran pokok dengan satuan SI.', 'LOTS', 'Besaran dan Satuan'
        ],
        [
          5, 'Esai', 'Jelaskan perbedaan mendasar antara besaran pokok dan besaran turunan serta berikan masing-masing 2 contoh!',
          '', '', '', '', '',
          'Besaran pokok berdiri sendiri, besaran turunan diturunkan dari besaran pokok.', 'Rubrik penilaian: Konsep (50), contoh pokok (25), contoh turunan (25).', 'HOTS', 'Besaran dan Satuan'
        ]
      ];

      const wsData = [headers, ...sampleRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 6 },  { wch: 14 }, { wch: 45 },
        { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
        { wch: 30 }, { wch: 35 }, { wch: 16 }, { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');

      const guideData = [
        ['PANDUAN LENGKAP PENGISIAN TEMPLATE SOAL SMAN 4 SOPPENG'],
        [''],
        ['Kolom', 'Keterangan & Format Penulisan'],
        ['No', 'Nomor urut butir soal (1, 2, 3, dst.)'],
        ['Tipe Soal', 'Pilih salah satu: PG, PGK, Benar/Salah, Menjodohkan, atau Esai'],
        ['Narasi Soal', 'Teks pertanyaan atau stimulus soal.'],
        ['Pilihan A - E', 'Isi pilihan jawaban untuk PG dan PGK. Kosongkan untuk Benar/Salah, Menjodohkan, Esai.'],
        ['Kunci Jawaban', 'Format kunci jawaban:\\n- PG: A / B / C / D / E\\n- PGK: Huruf dipisah koma (contoh: A, B, D)\\n- Benar/Salah: "BENAR" atau "SALAH"\\n- Menjodohkan: Pasangan dipisah titik koma (contoh: Panjang=Meter; Massa=Kilogram)\\n- Esai: Rangkuman kunci jawaban atau rubrik penskoran.'],
        ['Pembahasan', 'Penjelasan materi atau pembahasan jawaban soal.'],
        ['Tingkat Kognitif', 'Pilih salah satu: LOTS (C1-C2), MOTS (C3), atau HOTS (C4-C6).'],
        ['Materi Bab', 'Nama bab atau pokok bahasan (contoh: Alat Ukur, Listrik Dinamis).']
      ];
      const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
      wsGuide['!cols'] = [{ wch: 20 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

      XLSX.writeFile(wb, \`\${title}.xlsx\`);
      if (window.App) window.App.showToast('Template Excel (.xlsx) berhasil diunduh!', 'success');
    } else {
      if (window.App) window.App.showToast('Pustaka Excel sedang dimuat, silakan coba sesaat lagi.', 'warning');
    }
  }

  downloadWordTemplate() {
    const title = 'Template_Impor_Soal_SMAN4Soppeng';
    if (window.docx) {
      try {
        const { Document, Packer, Paragraph, AlignmentType } = window.docx;
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({ text: "UPT SMA NEGERI 4 SOPPENG", bold: true, alignment: AlignmentType.CENTER }),
              new Paragraph({ text: "FORMAT BAKU IMPORT SOAL ASESMEN / UJIAN (CBT)", bold: true, alignment: AlignmentType.CENTER }),
              new Paragraph({ text: "Pengampu: Syarif Hidayatullah, S.Pd. | Tahun Ajaran 2025/2026", alignment: AlignmentType.CENTER }),
              new Paragraph({ text: "==========================================================================" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "PETUNJUK FORMAT PENULISAN SOAL:", bold: true }),
              new Paragraph({ text: "1. Tuliskan nomor soal diikuti titik atau tanda kurung, contoh: 1. atau 1)" }),
              new Paragraph({ text: "2. Tambahkan tag jenis soal di awal: [PG], [PGK], [BENAR/SALAH], [MENJODOHKAN], atau [ESAI]" }),
              new Paragraph({ text: "3. Untuk Pilihan Ganda (PG) & PGK, tulis opsi A, B, C, D, E masing-masing di baris baru." }),
              new Paragraph({ text: "4. Tulis kunci pada baris baru dengan format: KUNCI: [jawaban]" }),
              new Paragraph({ text: "   - PG contoh: KUNCI: B" }),
              new Paragraph({ text: "   - PGK contoh: KUNCI: A, B, D" }),
              new Paragraph({ text: "   - Benar/Salah contoh: KUNCI: BENAR atau KUNCI: SALAH" }),
              new Paragraph({ text: "   - Menjodohkan contoh: PASANGAN: Panjang=Meter; Massa=Kilogram; Suhu=Kelvin" }),
              new Paragraph({ text: "   - Esai contoh: KUNCI: [rangkuman jawaban atau rubrik]" }),
              new Paragraph({ text: "5. Tulis pembahasan pada baris baru: PEMBAHASAN: [penjelasan]" }),
              new Paragraph({ text: "6. Tulis tingkat kognitif: TINGKAT: LOTS / MOTS / HOTS" }),
              new Paragraph({ text: "7. Tulis materi bab: BAB: [nama materi pokok]" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "==================== CONTOH SOAL DI BAWAH INI ====================" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "1. [PG]", bold: true }),
              new Paragraph({ text: "Mikrometer sekrup memiliki tingkat ketelitian pengukuran sebesar..." }),
              new Paragraph({ text: "A. 0,1 mm" }),
              new Paragraph({ text: "B. 0,01 mm" }),
              new Paragraph({ text: "C. 0,001 mm" }),
              new Paragraph({ text: "D. 1 mm" }),
              new Paragraph({ text: "E. 0,5 mm" }),
              new Paragraph({ text: "KUNCI: B" }),
              new Paragraph({ text: "PEMBAHASAN: Ketelitian alat ukur mikrometer sekrup adalah 0,01 mm." }),
              new Paragraph({ text: "TINGKAT: LOTS" }),
              new Paragraph({ text: "BAB: Alat Ukur" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "2. [PGK]", bold: true }),
              new Paragraph({ text: "Manakah pernyataan berikut yang BENAR mengenai besaran pokok? (Pilihan jawaban lebih dari satu)" }),
              new Paragraph({ text: "A. Massa bersatuan kilogram (kg)" }),
              new Paragraph({ text: "B. Waktu bersatuan sekon (s)" }),
              new Paragraph({ text: "C. Kecepatan bersatuan m/s" }),
              new Paragraph({ text: "D. Kuat arus listrik bersatuan ampere (A)" }),
              new Paragraph({ text: "E. Tekanan bersatuan pascal (Pa)" }),
              new Paragraph({ text: "KUNCI: A, B, D" }),
              new Paragraph({ text: "PEMBAHASAN: Massa, waktu, dan kuat arus merupakan besaran pokok, sedangkan kecepatan dan tekanan merupakan besaran turunan." }),
              new Paragraph({ text: "TINGKAT: MOTS" }),
              new Paragraph({ text: "BAB: Besaran dan Satuan" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "3. [BENAR/SALAH]", bold: true }),
              new Paragraph({ text: "Jangka sorong memiliki tingkat ketelitian lebih tinggi daripada mikrometer sekrup dalam mengukur ketebalan kertas tipis." }),
              new Paragraph({ text: "KUNCI: SALAH" }),
              new Paragraph({ text: "PEMBAHASAN: Mikrometer sekrup memiliki ketelitian 0,01 mm yang jauh lebih teliti dibandingkan jangka sorong standar (0,1 mm)." }),
              new Paragraph({ text: "TINGKAT: MOTS" }),
              new Paragraph({ text: "BAB: Alat Ukur" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "4. [MENJODOHKAN]", bold: true }),
              new Paragraph({ text: "Jodohkan besaran pokok fisika berikut dengan satuan SI yang tepat:" }),
              new Paragraph({ text: "PASANGAN: Panjang = Meter; Massa = Kilogram; Suhu = Kelvin; Kuat Arus = Ampere" }),
              new Paragraph({ text: "KUNCI: Panjang=Meter; Massa=Kilogram; Suhu=Kelvin; Kuat Arus=Ampere" }),
              new Paragraph({ text: "PEMBAHASAN: Pasangan besaran pokok dan satuan standar internasional SI." }),
              new Paragraph({ text: "TINGKAT: LOTS" }),
              new Paragraph({ text: "BAB: Besaran dan Satuan" }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: "5. [ESAI]", bold: true }),
              new Paragraph({ text: "Jelaskan perbedaan mendasar antara besaran pokok dan besaran turunan serta berikan masing-masing 2 contoh!" }),
              new Paragraph({ text: "KUNCI: Besaran pokok adalah besaran yang satuannya telah didefinisikan secara mandiri, sedangkan besaran turunan diturunkan dari besaran pokok." }),
              new Paragraph({ text: "PEMBAHASAN: Kriteria penilaian esai: kejelasan konsep, kebenaran definisi, dan ketepatan contoh." }),
              new Paragraph({ text: "TINGKAT: HOTS" }),
              new Paragraph({ text: "BAB: Besaran dan Satuan" })
            ]
          }]
        });

        Packer.toBlob(doc).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = \`\${title}.docx\`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (window.App) window.App.showToast('Template Word (.docx) berhasil diunduh!', 'success');
        });
        return;
      } catch (e) {
        console.warn('docx.js error, using HTML fallback:', e);
      }
    }

    // Fallback: Rich HTML / Doc format
    const content = \`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Template Impor Soal SMAN 4 Soppeng</title></head><body>
    <h2 style="text-align:center;">UPT SMA NEGERI 4 SOPPENG</h2>
    <h3 style="text-align:center;">FORMAT BAKU IMPORT SOAL ASESMEN / UJIAN (CBT)</h3>
    <hr/>
    <p><strong>1. [PG]</strong><br/>Mikrometer sekrup memiliki tingkat ketelitian pengukuran sebesar...<br/>A. 0,1 mm<br/>B. 0,01 mm<br/>C. 0,001 mm<br/>D. 1 mm<br/>E. 0,5 mm<br/>KUNCI: B<br/>PEMBAHASAN: Ketelitian alat ukur mikrometer sekrup adalah 0,01 mm.<br/>TINGKAT: LOTS<br/>BAB: Alat Ukur</p>
    <p><strong>2. [PGK]</strong><br/>Manakah pernyataan berikut yang BENAR mengenai besaran pokok? (Pilihan jawaban lebih dari satu)<br/>A. Massa bersatuan kilogram (kg)<br/>B. Waktu bersatuan sekon (s)<br/>C. Kecepatan bersatuan m/s<br/>D. Kuat arus listrik bersatuan ampere (A)<br/>E. Tekanan bersatuan pascal (Pa)<br/>KUNCI: A, B, D<br/>PEMBAHASAN: Massa, waktu, dan kuat arus merupakan besaran pokok.<br/>TINGKAT: MOTS<br/>BAB: Besaran dan Satuan</p>
    <p><strong>3. [BENAR/SALAH]</strong><br/>Jangka sorong memiliki tingkat ketelitian lebih tinggi daripada mikrometer sekrup dalam mengukur ketebalan kertas tipis.<br/>KUNCI: SALAH<br/>PEMBAHASAN: Mikrometer sekrup (0,01 mm) lebih teliti.<br/>TINGKAT: MOTS<br/>BAB: Alat Ukur</p>
    <p><strong>4. [MENJODOHKAN]</strong><br/>Jodohkan besaran pokok fisika berikut dengan satuan SI yang tepat:<br/>PASANGAN: Panjang = Meter; Massa = Kilogram; Suhu = Kelvin; Kuat Arus = Ampere<br/>KUNCI: Panjang=Meter; Massa=Kilogram; Suhu=Kelvin; Kuat Arus=Ampere<br/>PEMBAHASAN: Satuan internasional besaran pokok.<br/>TINGKAT: LOTS<br/>BAB: Besaran dan Satuan</p>
    <p><strong>5. [ESAI]</strong><br/>Jelaskan perbedaan mendasar antara besaran pokok dan besaran turunan!<br/>KUNCI: Besaran pokok berdiri sendiri, turunan diturunkan dari besaran pokok.<br/>PEMBAHASAN: Kriteria ketepatan konsep.<br/>TINGKAT: HOTS<br/>BAB: Besaran dan Satuan</p>
    </body></html>\`;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`\${title}.doc\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (window.App) window.App.showToast('Template Word berhasil diunduh!', 'success');
  }

  // --- PROSES UPLOAD BERKAS WORD & EXCEL ---
  async handleQuestionFileImport(event) {
    const file = event.target?.files?.[0] || event.dataTransfer?.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    const isWord = fileName.endsWith('.docx') || fileName.endsWith('.doc');

    if (!isExcel && !isWord) {
      if (window.App) window.App.showToast('Format berkas tidak didukung! Harap unggah berkas Excel (.xlsx / .xls) atau Word (.docx / .doc).', 'error');
      return;
    }

    if (window.App) window.App.showToast(\`Membaca dan membedah berkas "\${file.name}"...\`, 'info');

    try {
      const arrayBuffer = await file.arrayBuffer();
      let parsedQuestions = [];

      if (isExcel) {
        if (typeof XLSX === 'undefined') {
          throw new Error('Pustaka SheetJS XLSX belum siap.');
        }
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        parsedQuestions = this.parseQuestionsFromExcelRows(rows);
      } else if (isWord) {
        let rawText = '';
        if (window.mammoth && fileName.endsWith('.docx')) {
          try {
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            rawText = result.value || '';
          } catch (mErr) {
            console.warn('Mammoth extraction failed, trying fallback:', mErr);
          }
        }

        // Fallback JSZip for docx if mammoth text is empty
        if (!rawText && window.JSZip && fileName.endsWith('.docx')) {
          try {
            const zip = await window.JSZip.loadAsync(arrayBuffer);
            const xmlFile = zip.file('word/document.xml');
            if (xmlFile) {
              const xmlText = await xmlFile.async('text');
              rawText = xmlText.replace(/<w:p[^>]*>/g, '\\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            }
          } catch (zErr) {
            console.warn('JSZip extraction fallback failed:', zErr);
          }
        }

        // Fallback for .doc or plain text
        if (!rawText) {
          const textDecoder = new TextDecoder('utf-8', { fatal: false });
          rawText = textDecoder.decode(arrayBuffer);
        }

        parsedQuestions = this.parseQuestionsFromWordText(rawText);
      }

      if (!parsedQuestions || parsedQuestions.length === 0) {
        if (window.App) {
          window.App.showToast('Tidak ada butir soal yang berhasil diekstrak. Pastikan berkas menggunakan template Word / Excel yang disediakan!', 'warning');
        }
        return;
      }

      // Simpan butir soal ke draf sementara
      this.tempGeneratedQuestions = parsedQuestions;

      // Render ulang tampilan tab impor soal
      const content = document.getElementById('guru-tab-content');
      if (content) {
        content.innerHTML = this._renderImportSoalTab();
      }

      if (window.App) {
        window.App.showToast(\`Berhasil mengekstrak \${parsedQuestions.length} butir soal dari "\${file.name}"! Silakan periksa dan simpan.\`, 'success');
      }
    } catch (err) {
      console.error('File import error:', err);
      if (window.App) {
        window.App.showToast('Gagal memproses berkas: ' + err.message, 'error');
      }
    }
  }

  // --- PENGURAI TEKS WORD (.DOCX) ---
  parseQuestionsFromWordText(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const text = rawText.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');
    const lines = text.split('\\n');
    const chunks = [];
    let currentChunk = [];

    const numberPattern = /^(?:\\[(?:SOAL|NOMOR)\\s*\\d*\\]\\s*)?(?:No\\.?\\s*)?(\\d+)[\\.\\)]\\s*(.*)/i;
    const tagPattern = /^\\[(?:SOAL|NOMOR|ITEM)\\s*(\\w+)?\\]/i;

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
          chunks.push(currentChunk.join('\\n').trim());
          currentChunk = [];
        }
      }
      currentChunk.push(line);
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\\n').trim());
    }

    const parsedQuestions = [];

    chunks.forEach((chunk, idx) => {
      if (!chunk || chunk.length < 5) return;

      let explicitType = null;
      if (/\\[(?:SOAL\\s+)?(?:PG|PILIHAN GANDA)\\]/i.test(chunk)) explicitType = 'pg';
      else if (/\\[(?:SOAL\\s+)?(?:PGK|KOMPLEKS|PILIHAN GANDA KOMPLEKS)\\]/i.test(chunk)) explicitType = 'pgk';
      else if (/\\[(?:SOAL\\s+)?(?:BENAR[\\/\\s\\-]?SALAH|TRUE[\\/\\s\\-]?FALSE|B\\/S)\\]/i.test(chunk)) explicitType = 'truefalse';
      else if (/\\[(?:SOAL\\s+)?(?:MENJODOHKAN|MATCHING|JODOHKAN)\\]/i.test(chunk)) explicitType = 'matching';
      else if (/\\[(?:SOAL\\s+)?(?:ESAI|ESSAY|ISIAN)\\]/i.test(chunk)) explicitType = 'essay';

      let cleanChunk = chunk.replace(/\\[(?:SOAL\\s+)?[^\\]]+\\]/gi, '').trim();

      let questionNumber = idx + 1;
      const numMatch = cleanChunk.match(/^(?:No\\.?\\s*)?(\\d+)[\\.\\)]\\s*/i);
      if (numMatch) {
        questionNumber = parseInt(numMatch[1], 10);
        cleanChunk = cleanChunk.replace(/^(?:No\\.?\\s*)?(\\d+)[\\.\\)]\\s*/i, '').trim();
      }

      let kunci = '';
      const kunciMatch = cleanChunk.match(/(?:KUNCI(?:\\s+JAWABAN)?|JAWABAN|ANSWER|KEY)\\s*:\\s*([^\\n]+)/i);
      if (kunciMatch) {
        kunci = kunciMatch[1].trim();
        cleanChunk = cleanChunk.replace(/(?:KUNCI(?:\\s+JAWABAN)?|JAWABAN|ANSWER|KEY)\\s*:\\s*[^\\n]+/i, '').trim();
      }

      let pembahasan = '';
      const pembMatch = cleanChunk.match(/(?:PEMBAHASAN|PENJELASAN|RUBRIK|EXPLANATION)\\s*:\\s*([\\s\\S]+?)(?=(?:\\n(?:TINGKAT|LEVEL|BLOOM|BAB|MATERI)\\s*:|$))/i);
      if (pembMatch) {
        pembahasan = pembMatch[1].trim();
        cleanChunk = cleanChunk.replace(/(?:PEMBAHASAN|PENJELASAN|RUBRIK|EXPLANATION)\\s*:\\s*[\\s\\S]+?(?=(?:\\n(?:TINGKAT|LEVEL|BLOOM|BAB|MATERI)\\s*:|$))/i, '').trim();
      }

      let tingkatKognitif = 'MOTS';
      const bloomMatch = cleanChunk.match(/(?:TINGKAT(?:\\s+KOGNITIF)?|LEVEL|BLOOM)\\s*:\\s*([^\\n]+)/i);
      if (bloomMatch) {
        const bStr = bloomMatch[1].trim().toUpperCase();
        if (bStr.includes('HOTS')) tingkatKognitif = 'HOTS';
        else if (bStr.includes('LOTS')) tingkatKognitif = 'LOTS';
        else tingkatKognitif = 'MOTS';
        cleanChunk = cleanChunk.replace(/(?:TINGKAT(?:\\s+KOGNITIF)?|LEVEL|BLOOM)\\s*:\\s*[^\\n]+/i, '').trim();
      }

      let babMateri = '';
      const babMatch = cleanChunk.match(/(?:BAB|MATERI|TOPIK)\\s*:\\s*([^\\n]+)/i);
      if (babMatch) {
        babMateri = babMatch[1].trim();
        cleanChunk = cleanChunk.replace(/(?:BAB|MATERI|TOPIK)\\s*:\\s*[^\\n]+/i, '').trim();
      }

      let pasanganStr = '';
      const pasMatch = cleanChunk.match(/(?:PASANGAN|JODOHKAN|PAIRS?)\\s*:\\s*([^\\n]+)/i);
      if (pasMatch) {
        pasanganStr = pasMatch[1].trim();
        cleanChunk = cleanChunk.replace(/(?:PASANGAN|JODOHKAN|PAIRS?)\\s*:\\s*[^\\n]+/i, '').trim();
      }

      const options = {};
      const optionMatches = [...cleanChunk.matchAll(/(?:^|\\n)\\s*([A-Ea-e])[\\.\\)]\\s*([^\\n]+)/g)];
      
      if (optionMatches.length > 0) {
        optionMatches.forEach(m => {
          const key = m[1].toUpperCase();
          options[key] = m[2].trim();
        });

        const firstOptIndex = cleanChunk.search(/(?:^|\\n)\\s*[A-Ea-e][\\.\\)]\\s*/);
        if (firstOptIndex !== -1) {
          cleanChunk = cleanChunk.substring(0, firstOptIndex).trim();
        }
      }

      const narasiSoal = cleanChunk.trim();

      let jenisSoal = explicitType;
      if (!jenisSoal) {
        if (pasanganStr || (kunci && kunci.includes('='))) {
          jenisSoal = 'matching';
        } else if (Object.keys(options).length >= 2) {
          if (kunci && (kunci.includes(',') || kunci.includes(';') || (kunci.replace(/\\s+/g, '').length > 1 && /^[A-E]+$/i.test(kunci.replace(/\\s+/g, ''))))) {
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

      let opsi_json = [];
      let formattedKunci = kunci;

      if (jenisSoal === 'pg') {
        ['A', 'B', 'C', 'D', 'E'].forEach(l => {
          if (options[l]) opsi_json.push({ key: l, text: options[l] });
        });
        formattedKunci = (kunci.match(/[A-E]/i) || ['A'])[0].toUpperCase();
      } else if (jenisSoal === 'pgk') {
        ['A', 'B', 'C', 'D', 'E'].forEach(l => {
          if (options[l]) opsi_json.push({ key: l, text: options[l] });
        });
        const matchedLetters = kunci.toUpperCase().match(/[A-E]/g) || ['A'];
        formattedKunci = [...new Set(matchedLetters)];
      } else if (jenisSoal === 'truefalse') {
        opsi_json = [
          { key: 'BENAR', text: 'BENAR' },
          { key: 'SALAH', text: 'SALAH' }
        ];
        formattedKunci = /SALAH|FALSE/i.test(kunci) ? 'SALAH' : 'BENAR';
      } else if (jenisSoal === 'matching') {
        const pairSource = pasanganStr || kunci;
        const pairs = pairSource.split(/[;\\n]/).map(p => p.trim()).filter(Boolean);
        const premises = [];
        const targets = [];
        const keyMap = {};

        pairs.forEach((pair, pIdx) => {
          const parts = pair.split(/[=\\-:]/).map(s => s.trim());
          const pId = \`p\${pIdx + 1}\`;
          const tId = \`t\${pIdx + 1}\`;
          premises.push({ id: pId, label: parts[0] || \`Premis \${pIdx + 1}\` });
          targets.push({ id: tId, label: parts[1] || \`Target \${pIdx + 1}\` });
          keyMap[pId] = tId;
        });

        opsi_json = { premises, targets };
        formattedKunci = keyMap;
      } else if (jenisSoal === 'essay') {
        opsi_json = [];
        formattedKunci = kunci || 'Kunci / Rubrik Pembahasan Belum Diisi';
      }

      let tipeLabel = 'Pilihan Ganda (PG)';
      if (jenisSoal === 'pgk') tipeLabel = 'Pilihan Ganda Kompleks (PGK)';
      else if (jenisSoal === 'truefalse') tipeLabel = 'Benar / Salah (True/False)';
      else if (jenisSoal === 'matching') tipeLabel = 'Menjodohkan (Matching Pair)';
      else if (jenisSoal === 'essay') tipeLabel = 'Isian Singkat & Esai';

      parsedQuestions.push({
        id: \`import-q-\${Date.now()}-\${idx + 1}\`,
        question_id: \`import-q-\${Date.now()}-\${idx + 1}\`,
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

  // --- PENGURAI BARIS SPREADSHEET EXCEL (.XLSX) ---
  parseQuestionsFromExcelRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const parsedQuestions = [];

    rows.forEach((row, idx) => {
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
      if (!narasi) return;

      const rawTipe = findCol(['tipe', 'jenis', 'type']).toLowerCase();
      let jenisSoal = 'pg';
      if (rawTipe.includes('kompleks') || rawTipe.includes('pgk') || rawTipe.includes('multi')) jenisSoal = 'pgk';
      else if (rawTipe.includes('benar') || rawTipe.includes('salah') || rawTipe.includes('true') || rawTipe.includes('tf')) jenisSoal = 'truefalse';
      else if (rawTipe.includes('jodoh') || rawTipe.includes('match') || rawTipe.includes('pasang')) jenisSoal = 'matching';
      else if (rawTipe.includes('esai') || rawTipe.includes('essay') || rawTipe.includes('isian') || rawTipe.includes('uraian')) jenisSoal = 'essay';

      const rawKunci = findCol(['kunci', 'jawaban', 'key', 'answer']);
      const pembahasan = findCol(['pembahasan', 'penjelasan', 'rubrik', 'explanation']) || 'Sesuai materi pembelajaran.';
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
        const pairs = rawKunci.split(/[;\\n]/).map(p => p.trim()).filter(Boolean);
        const premises = [];
        const targets = [];
        const keyMap = {};

        pairs.forEach((pair, pIdx) => {
          const parts = pair.split(/[=\\-:]/).map(s => s.trim());
          const pId = \`p\${pIdx + 1}\`;
          const tId = \`t\${pIdx + 1}\`;
          premises.push({ id: pId, label: parts[0] || \`Premis \${pIdx + 1}\` });
          targets.push({ id: tId, label: parts[1] || \`Target \${pIdx + 1}\` });
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
        id: \`import-q-\${Date.now()}-\${idx + 1}\`,
        question_id: \`import-q-\${Date.now()}-\${idx + 1}\`,
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

  // --- HELPERS TARGET KELAS & KATEGORI IMPOR ---
  toggleAllImportClasses(selectAll = true) {
    const checkboxes = document.querySelectorAll('input[name="import_target_class_checkbox"]');
    checkboxes.forEach(cb => { cb.checked = !!selectAll; });
    this.updateImportClassSummary();
  }

  updateImportClassSummary() {
    const summaryEl = document.getElementById('import-class-summary-text');
    if (!summaryEl) return;
    const selected = this._getSelectedImportClasses();
    if (selected.includes('Semua Kelas')) {
      summaryEl.innerText = 'Terpilih: Semua Kelas';
    } else {
      summaryEl.innerText = \`Terpilih (\${selected.length} Kelas): \${selected.join(', ')}\`;
    }
  }

  _getSelectedImportClasses() {
    const checkboxes = document.querySelectorAll('input[name="import_target_class_checkbox"]:checked, input[name="ai_target_class_checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);
    const classes = window.EduDB.getClasses ? window.EduDB.getClasses() : [];
    if (selected.length === 0 || selected.length === classes.length) {
      return ['Semua Kelas'];
    }
    return selected;
  }

  setImportAssessmentCategory(cat) {
    this.aiCategory = cat;
    const fSub = document.getElementById('import-formatif-sub');
    const sSub = document.getElementById('import-sumatif-sub');
    if (cat === 'formatif') {
      fSub?.classList.remove('hidden');
      sSub?.classList.add('hidden');
    } else {
      fSub?.classList.add('hidden');
      sSub?.classList.remove('hidden');
    }
  }

  saveImportedQuestions(targetStatus = 'siap') {
    if (!this.tempGeneratedQuestions || this.tempGeneratedQuestions.length === 0) {
      if (window.App) window.App.showToast('Belum ada butir soal yang diimpor!', 'warning');
      return;
    }

    const selectedClasses = this._getSelectedImportClasses();
    const rFormatif = document.getElementById('import-kategori-formatif');
    const isFormatif = rFormatif ? rFormatif.checked : true;
    const kategoriPenilaian = isFormatif ? 'formatif' : 'sumatif';
    const jenisFormatif = isFormatif ? (document.getElementById('import-q-jenis-formatif')?.value || 'Kuis Harian') : null;
    const periodeSumatif = !isFormatif ? (document.getElementById('import-q-periode-sumatif')?.value || 'Penilaian Tengah Semester (PTS)') : null;
    const babInput = document.getElementById('import-q-bab')?.value?.trim() || 'Materi Pokok';
    const statusSelect = document.getElementById('import-q-status')?.value || targetStatus;

    this.tempGeneratedQuestions.forEach((q, idx) => {
      window.EduDB.addQuestion({
        session_id: this.activeSessionId,
        mata_pelajaran: this.activeSubject,
        target_kelas: selectedClasses,
        nomor: idx + 1,
        jenis_soal: q.jenis_soal || 'pg',
        narasi_soal: q.narasi_soal,
        opsi_json: q.opsi_json,
        kunci_jawaban: q.kunci_jawaban,
        penjelasan: q.penjelasan || 'Sesuai kurikulum materi.',
        keterangan_bab: babInput || q.keterangan_bab || 'Materi Pokok',
        tingkat_kognitif: q.tingkat_kognitif || 'MOTS',
        kategori_penilaian: kategoriPenilaian,
        jenis_formatif: jenisFormatif,
        periode_sumatif: periodeSumatif,
        materi_bab_text: babInput || q.keterangan_bab || 'Materi Pokok',
        status: statusSelect,
        creator: window.App?.currentUser?.nama_lengkap || 'Syarif Hidayatullah, S.Pd.'
      });
    });

    const count = this.tempGeneratedQuestions.length;
    const statusLabel = statusSelect === 'draf' ? 'DRAF' : 'SIAP UJIAN';
    if (window.App) {
      window.App.showToast(\`Berhasil menyimpan \${count} butir soal ke Bank Soal (\${statusLabel}) pada mapel "\${this.activeSubject}"!\`, 'success');
    }

    this.tempGeneratedQuestions = [];
    this.switchTab('bank');
  }

  // --- ESCAPE HELPER UNTUK KEAMANAN EDIT FORM & VALUE ATTRIBUTES ---
  _escape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _renderEmptyGeneratedState() {
    return \`
      <div class="py-16 text-center text-slate-400 space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-3xl shadow-xs border border-teal-100">
          <i class="fa-solid fa-file-import"></i>
        </div>
        <div class="space-y-1">
          <h4 class="text-sm font-bold text-slate-700">Belum Ada Soal Terimpor</h4>
          <p class="text-xs font-medium text-slate-500 max-w-md mx-auto">
            Unduh template resmi Word (.docx) atau Excel (.xlsx), isi butir soal Anda, lalu unggah berkas pada area di sebelah kiri untuk menelaah dan menyimpan soal ke Bank Soal.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button type="button" onclick="window.GuruModule.downloadExcelTemplate()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5">
            <i class="fa-solid fa-file-excel"></i> Template Excel
          </button>
          <button type="button" onclick="window.GuruModule.downloadWordTemplate()" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5">
            <i class="fa-solid fa-file-word"></i> Template Word
          </button>
        </div>
      </div>
    \`;
  }

  _updateTempQuestionsCountBadge() {
    const count = (this.tempGeneratedQuestions || []).length;
    const badge = document.getElementById('ai-gen-count-badge');
    if (badge) {
      badge.innerText = \`\${count} Butir Draf Siap\`;
      if (count > 0) {
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-100 text-teal-900 border border-teal-200';
      } else {
        badge.className = 'text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200';
      }
    }
  }

`;

// Locate start and end patterns
const startPattern = /\n\s*\/\/\s*={10,}\s*\n\s*\/\/\s*2\.\s*TAB MULTI-FILE AI AUTO-GENERATE SOAL BERTAHAP[^\n]*\n\s*\/\/\s*={10,}\s*\n\s*_renderAIGeneratorTab\(\)/;
const endPattern = /\n\s*\/\/\s*---\s*INTERACTIVE PREVIEW & EDIT CARD UI \(DRAFT STATE\)\s*---\s*\n\s*_renderTempGeneratedCards\(\)/;

const startMatch = content.match(startPattern);
const endMatch = content.match(endPattern);

if (!startMatch || !endMatch) {
  console.error('Could not locate boundaries in guru.js!');
  console.log('startMatch:', !!startMatch, 'endMatch:', !!endMatch);
  process.exit(1);
}

const startIndex = startMatch.index + 1; // start after newline
const endIndex = endMatch.index;

console.log('Replacing from index', startIndex, 'to', endIndex);
content = content.substring(0, startIndex) + newImportMethods + content.substring(endIndex + 1);

// Also replace goToAIGenWithSelectedArchives
content = content.replace(
  /goToAIGenWithSelectedArchives\(\)\s*\{[\s\S]*?this\.switchTab\('ai-gen'\);[\s\S]*?\}/,
  `goToAIGenWithSelectedArchives() {
    this.switchTab('import-soal');
    if (window.App) {
      const count = (this.selectedArchivesForGen || []).length;
      window.App.showToast(\`Beralih ke Impor Soal dengan \${count} arsip penguat terlampir.\`, 'info');
    }
  }`
);

// Also update saveAllGeneratedQuestions to call saveImportedQuestions
content = content.replace(
  /saveAllGeneratedQuestions\(targetStatus = 'siap'\)\s*\{[\s\S]*?this\.switchTab\('bank'\);\s*\}/,
  `saveAllGeneratedQuestions(targetStatus = 'siap') {
    return this.saveImportedQuestions(targetStatus);
  }`
);

// Update archive description to clean repository text
content = content.replace(
  /Simpan dokumen ajar \(PDF\/DOCX\/TXT\) dan diagram gambar saintifik \(JPG\/PNG\)\. Berkas siap dilampirkan sebagai Context Reinforcement untuk AI Gemini\./g,
  'Repositori arsip dokumen ajar (PDF/DOCX/TXT) dan diagram gambar saintifik (JPG/PNG) untuk materi pembelajaran dan bank dokumen guru.'
);

content = content.replace(
  /Unggah naskah modul pembelajaran \(PDF\/DOCX\/TXT\) atau gambar diagram \(JPG\/PNG\) untuk digunakan sebagai acuan ketat AI saat menyusun soal\./g,
  'Unggah naskah modul pembelajaran (PDF/DOCX/TXT) atau gambar diagram (JPG/PNG) untuk disimpan dalam repositori berkas guru.'
);

fs.writeFileSync(guruFile, content, 'utf8');
console.log('Successfully updated js/guru.js! Length:', content.length);

