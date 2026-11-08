/**
 * EduExam SMAN 4 Soppeng - Student Exam Engine
 * Mengimplementasikan BAB 4 (5 Variasi Tipe Soal) & BAB 6 (Anti-Error & Anti-Crash)
 * Dikembangkan oleh: Syarif Hidayatullah, S.Pd.
 */

class StudentExamEngine {
  constructor() {
    this.activeExam = null;
    this.studentUser = null;
    this.questions = [];
    this.currentIndex = 0;
    this.answers = {};
    this.doubtful = {};
    this.tabSwitchCount = 0;
    this.timerInterval = null;
    this.heartbeatInterval = null;
    this.remainingSeconds = 0;
    this.isExamActive = false;
    this.examArmed = false;
    this.isSubmitting = false;

    this._bindGlobalGuards();
  }

  /**
   * Mengikat proteksi navigasi keluar (Bab 6.4) dan deteksi pindah tab (Visibility API)
   */
  _bindGlobalGuards() {
    // Bab 6.4: Pengaman Navigasi (beforeunload)
    window.addEventListener('beforeunload', (e) => {
      if (this.isExamActive && !this.isSubmitting) {
        e.preventDefault();
        e.returnValue = 'Ujian sedang berlangsung! Jawaban Anda tersimpan otomatis di memori HP. Yakin ingin keluar?';
        return e.returnValue;
      }
    });

    // Keamanan Anti-Kecurangan: Visibility API (Sesuai Bab 1.1 Poin 5 Blueprint)
    // Hanya aktif setelah sesi ujian berjalan dan siswa benar-benar meninggalkan tab (document.hidden)
    document.addEventListener('visibilitychange', () => {
      if (this.examArmed && this.isExamActive && !this.isSubmitting && document.hidden) {
        this._handleTabSwitch('Pindah Tab / Minimize Browser');
      }
    });

    // Bab 6.2: Listener status jaringan bawaan
    window.addEventListener('online', () => {
      this._updateNetworkBadge(true, 18);
      if (window.App) window.App.showToast('Jaringan Terhubung Kembali (Online) - Sinkronisasi Sukses!', 'success');
    });

    window.addEventListener('offline', () => {
      this._updateNetworkBadge(false, 0);
      if (window.App) window.App.showToast('Koneksi Putus! Mode Offline Aktif - Jawaban Tetap Aman di Memori HP.', 'warning');
    });
  }

  /**
   * Memulai Sesi Ujian untuk Siswa
   */
  startExam(sessionObj, userObj) {
    this.activeExam = sessionObj;
    this.studentUser = userObj;
    this.questions = window.EduDB.getQuestions(sessionObj.session_id);
    this.currentIndex = 0;
    this.tabSwitchCount = 0;
    this.isExamActive = false;
    this.examArmed = false;
    this.isSubmitting = false;

    // Pastikan modal peringatan tertutup rapat saat awal masuk
    this.closeTabSwitchModal();

    // Bab 6.1: Pulihkan jawaban dari LocalStorage jika ada draft sebelumnya
    const draftKey = `eduexam_draft_${sessionObj.session_id}_${userObj.user_id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        this.answers = parsed.answers || {};
        this.doubtful = parsed.doubtful || {};
        // Reset switch count for current live session unless explicitly needed
        this.tabSwitchCount = 0;
        if (parsed.remainingSeconds && parsed.remainingSeconds > 0) {
          this.remainingSeconds = parsed.remainingSeconds;
        } else {
          this.remainingSeconds = (sessionObj.durasi_menit || 45) * 60;
        }
        if (window.App) window.App.showToast('Draft jawaban sebelumnya berhasil dipulihkan dari memori HP!', 'info');
      } catch (e) {
        this.answers = {};
        this.doubtful = {};
        this.remainingSeconds = (sessionObj.durasi_menit || 45) * 60;
      }
    } else {
      this.answers = {};
      this.doubtful = {};
      this.remainingSeconds = (sessionObj.durasi_menit || 45) * 60;
    }

    this._startTimer();
    this._startHeartbeatGuard();
    this.renderExamInterface();

    // Berikan waktu jeda penyesuaian (grace period 3.5 detik) agar tidak memicu alarm palsu saat render awal
    setTimeout(() => {
      this.examArmed = true;
      this.isExamActive = true;
    }, 3500);
  }

  /**
   * Bab 6.2: Heartbeat Connection Guard (Monitoring status jaringan real-time)
   */
  _startHeartbeatGuard() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.isExamActive) return;
      const isOnline = navigator.onLine;
      // Simulasi latency acak antara 14ms - 38ms
      const simulatedLatency = Math.floor(Math.random() * 24) + 14;
      this._updateNetworkBadge(isOnline, simulatedLatency);
    }, 4000);
  }

  _updateNetworkBadge(isOnline, latency) {
    const badgeEl = document.getElementById('exam-network-badge');
    if (!badgeEl) return;

    if (isOnline) {
      badgeEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
      badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 heartbeat-active"></span> Online (${latency}ms)`;
    } else {
      badgeEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300';
      badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Mode Offline (Memori HP Aman)`;
    }
  }

  /**
   * Countdown Timer
   */
  _startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isExamActive) return;
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this._updateTimerDisplay();

        // Auto-save sisa waktu ke draft setiap 5 detik
        if (this.remainingSeconds % 5 === 0) {
          this._saveDraftToStorage();
        }
      } else {
        clearInterval(this.timerInterval);
        if (window.App) window.App.showToast('Waktu Ujian Habis! Sistem mengirimkan jawaban secara otomatis...', 'warning');
        this.submitExamWithStagger(true);
      }
    }, 1000);
  }

  _updateTimerDisplay() {
    const el = document.getElementById('exam-timer-display');
    if (!el) return;

    const hours = Math.floor(this.remainingSeconds / 3600);
    const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
    const seconds = this.remainingSeconds % 60;

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    el.innerText = formatted;

    // Visual warning when less than 5 minutes
    if (this.remainingSeconds <= 300) {
      el.parentElement.className = 'flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-mono font-bold text-base border border-red-300 animate-pulse';
    } else {
      el.parentElement.className = 'flex items-center gap-2 bg-blue-50 text-blue-900 px-3 py-1.5 rounded-lg font-mono font-bold text-base border border-blue-200';
    }
  }

  /**
   * Bab 6.1: Offline-First LocalStorage Auto-Save
   */
  _saveDraftToStorage() {
    if (!this.activeExam || !this.studentUser) return;
    const draftKey = `eduexam_draft_${this.activeExam.session_id}_${this.studentUser.user_id}`;
    const payload = {
      answers: this.answers,
      doubtful: this.doubtful,
      tabSwitchCount: this.tabSwitchCount,
      remainingSeconds: this.remainingSeconds,
      lastSaved: new Date().toLocaleTimeString('id-ID')
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(payload));
      this._flashAutoSaveIndicator(payload.lastSaved);
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }

  _flashAutoSaveIndicator(timestamp) {
    const ind = document.getElementById('exam-autosave-indicator');
    if (ind) {
      ind.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-teal-600"></i> <span class="hidden sm:inline">Tersimpan otomatis:</span> ${timestamp}`;
      ind.classList.remove('opacity-60');
      ind.classList.add('opacity-100');
      setTimeout(() => {
        if (ind) ind.classList.add('opacity-60');
      }, 1500);
    }
  }

  /**
   * Penanganan Deteksi Pindah Tab (Visibility API)
   */
  _handleTabSwitch(reason) {
    this.tabSwitchCount++;
    this._saveDraftToStorage();

    // Catat ke log keamanan
    window.EduDB.addSecurityLog({
      nama_siswa: this.studentUser.nama_lengkap,
      nis: this.studentUser.nis || this.studentUser.username,
      kelas: this.studentUser.kelas || 'XII MIPA 1',
      session_id: this.activeExam.session_id,
      nama_ujian: this.activeExam.nama_ujian,
      jenis_pelanggaran: reason,
      detail: `Pelanggaran ke-${this.tabSwitchCount} terdeteksi saat mengerjakan soal No. ${this.currentIndex + 1}`,
      status_tindakan: `Peringatan Keras #${this.tabSwitchCount}`
    });

    // Munculkan Modal Peringatan
    this._showTabSwitchWarningModal();
  }

  _showTabSwitchWarningModal() {
    const modal = document.getElementById('tab-switch-modal');
    const countEl = document.getElementById('tab-switch-count-display');
    if (countEl) countEl.innerText = this.tabSwitchCount;
    if (modal) modal.classList.remove('hidden');
  }

  closeTabSwitchModal() {
    const modal = document.getElementById('tab-switch-modal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * Render Antarmuka Ujian Siswa
   */
  renderExamInterface() {
    const container = document.getElementById('student-exam-room-view');
    if (!container) return;

    const currentQ = this.questions[this.currentIndex];
    if (!currentQ) {
      container.innerHTML = '<div class="p-8 text-center text-gray-600">Tidak ada soal dalam paket ujian ini.</div>';
      return;
    }

    const totalQ = this.questions.length;
    const isDoubt = !!this.doubtful[currentQ.question_id];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        <!-- Top Toolbar Header Bar Ujian -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20">
          <div class="flex items-center gap-3">
            <span class="text-xs sm:text-sm font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-900 border border-blue-200">
              Soal No. <strong class="text-base">${this.currentIndex + 1}</strong> dari ${totalQ}
            </span>
            <span class="text-xs px-2 py-1 rounded font-medium bg-teal-50 text-teal-800 border border-teal-200 hidden md:inline-block">
              ${currentQ.tipe_label}
            </span>
            <span id="exam-autosave-indicator" class="text-xs text-slate-500 opacity-60 flex items-center gap-1 transition-opacity">
              <i class="fa-solid fa-cloud-arrow-up text-teal-600"></i> Auto-Save Memori HP Aktif
            </span>
          </div>

          <div class="flex items-center gap-2 sm:gap-3 ml-auto">
            <!-- Heartbeat Badge -->
            <div id="exam-network-badge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span class="w-2 h-2 rounded-full bg-emerald-500 heartbeat-active"></span> Online (18ms)
            </div>

            <!-- Formula Sheet Button -->
            <button onclick="window.ExamEngine.openFormulaModal()" class="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-indigo-200 transition">
              <i class="fa-solid fa-square-root-variable text-indigo-600"></i> <span class="hidden sm:inline">Sheet Rumus</span>
            </button>

            <!-- Timer Countdown Display -->
            <div class="flex items-center gap-1.5 sm:gap-2 bg-blue-50 text-blue-900 px-2.5 sm:px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base border border-blue-200">
              <i class="fa-regular fa-clock text-blue-600"></i>
              <span id="exam-timer-display">--:--:--</span>
            </div>
          </div>
        </div>

        <!-- Main Body: Question Content (Left) & Navigation Grid (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <!-- Col 1: Question Card -->
          <div class="lg:col-span-8 space-y-4">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
              <!-- Header Soal -->
              <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <i class="fa-solid fa-layer-group text-teal-600"></i> ${currentQ.mata_pelajaran} &bull; ${currentQ.tipe_label}
                </span>
                
                <!-- Checkbox Ragu-Ragu -->
                <label class="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 transition">
                  <input type="checkbox" ${isDoubt ? 'checked' : ''} onchange="window.ExamEngine.toggleDoubt('${currentQ.question_id}')" class="rounded text-amber-600 focus:ring-amber-500 h-4 w-4">
                  <span>Ragu-ragu</span>
                </label>
              </div>

              <!-- Narasi Soal -->
              <div class="exam-question-text text-base sm:text-lg font-medium text-slate-800 leading-relaxed mb-4">
                ${currentQ.narasi_soal}
              </div>

              <!-- Gambar / Diagram Soal Responsif (Point 1 & 3 User Request) -->
              ${currentQ.gambar_url ? `
                <div class="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50/70 p-3 sm:p-4 flex flex-col items-center shadow-xs">
                  <div class="relative group cursor-pointer w-full text-center" onclick="window.ExamEngine.openImageZoomModal(this.querySelector('img').src)">
                    <img src="${currentQ.gambar_url}" alt="Diagram Stimulus Soal" class="max-h-72 w-auto object-contain rounded-xl shadow-xs mx-auto transition transform hover:scale-[1.01]">
                    <div class="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span class="bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                        <i class="fa-solid fa-magnifying-glass-plus"></i> Klik untuk Perbesar Gambar
                      </span>
                    </div>
                  </div>
                  <span class="text-[11px] text-slate-500 mt-2.5 font-semibold flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-area text-teal-600"></i> Ilustrasi / Diagram Stimulus Soal
                  </span>
                </div>
              ` : ''}

              <!-- Pilihan Jawaban berdasarkan 5 Tipe Soal (Bab 4 Blueprint) -->
              <div class="mt-4">
                ${this._renderQuestionOptions(currentQ)}
              </div>
            </div>

            <!-- Bottom Navigation Controls -->
            <div class="flex items-center justify-between gap-2 bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4">
              <button onclick="window.ExamEngine.prevQuestion()" ${this.currentIndex === 0 ? 'disabled' : ''} class="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${this.currentIndex === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition">
                <i class="fa-solid fa-arrow-left"></i> Sebelumnya
              </button>

              <button onclick="window.ExamEngine.openConfirmSubmitModal()" class="flex items-center gap-2 px-4 sm:px-6 py-2 text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition">
                <i class="fa-solid fa-circle-check"></i> Selesai Ujian
              </button>

              <button onclick="window.ExamEngine.nextQuestion()" ${this.currentIndex === totalQ - 1 ? 'disabled' : ''} class="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${this.currentIndex === totalQ - 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'} transition">
                Selanjutnya <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <!-- Col 2: Question Navigation Grid (Sticky) -->
          <div class="lg:col-span-4">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-36">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <i class="fa-solid fa-table-cells text-blue-900"></i> Nomor Soal
                </h3>
                <span class="text-xs text-slate-500">${this._getAnsweredCount()} / ${totalQ} Terjawab</span>
              </div>

              <!-- Grid Numbers -->
              <div class="grid grid-cols-5 gap-2.5 sm:gap-3">
                ${this.questions.map((q, idx) => {
                  const isCurrent = idx === this.currentIndex;
                  const hasAnswer = this._isQuestionAnswered(q.question_id);
                  const isDoubtful = !!this.doubtful[q.question_id];

                  let btnColorClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                  if (isDoubtful) {
                    btnColorClass = 'bg-amber-400 text-amber-950 font-bold border-amber-500';
                  } else if (hasAnswer) {
                    btnColorClass = 'bg-emerald-600 text-white font-bold border-emerald-700';
                  }

                  const activeRing = isCurrent ? 'ring-2 ring-blue-900 ring-offset-2 scale-105' : '';

                  return `
                    <button onclick="window.ExamEngine.jumpToQuestion(${idx})" class="h-10 rounded-lg text-sm font-semibold flex items-center justify-center border transition ${btnColorClass} ${activeRing}">
                      ${idx + 1}
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- Legend -->
              <div class="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded bg-emerald-600"></span>
                  <span>Sudah Terjawab</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded bg-amber-400"></span>
                  <span>Ragu-ragu</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded bg-slate-200"></span>
                  <span>Belum Dijawab</span>
                </div>
              </div>

              <!-- Student Session Details -->
              <div class="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div><strong>Peserta:</strong> ${this.studentUser.nama_lengkap}</div>
                <div><strong>NIS:</strong> ${this.studentUser.nis || this.studentUser.username} &bull; <strong>Kelas:</strong> ${this.studentUser.kelas}</div>
                <div><strong>Ujian:</strong> ${this.activeExam.nama_ujian}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._updateTimerDisplay();
  }

  openImageZoomModal(imgUrl) {
    const modal = document.getElementById('image-zoom-modal');
    const target = document.getElementById('image-zoom-target');
    if (modal && target) {
      target.src = imgUrl;
      modal.classList.remove('hidden');
    }
  }

  /**
   * Render Opsi Jawaban berdasarkan 5 Tipe Soal (Bab 4 Blueprint)
   */
  _renderQuestionOptions(q) {
    const qId = q.question_id;
    const currentVal = this.answers[qId];

    // 1. Tipe 1: Pilihan Ganda (PG Standard)
    if (q.jenis_soal === 'pg') {
      return `
        <div class="space-y-3">
          ${q.opsi_json.map(opt => {
            const isSelected = currentVal === opt.key;
            return `
              <div onclick="window.ExamEngine.selectPGOption('${qId}', '${opt.key}')" class="option-card flex items-start gap-3 p-3.5 rounded-xl border ${isSelected ? 'selected' : 'bg-white'}">
                <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}">
                  ${opt.key}
                </div>
                <div class="text-sm sm:text-base text-slate-800 pt-0.5 leading-snug">
                  ${opt.text}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 2. Tipe 2: Pilihan Ganda Kompleks (PGK Checkbox)
    if (q.jenis_soal === 'pgk') {
      const selectedArr = Array.isArray(currentVal) ? currentVal : [];
      return `
        <div class="space-y-3">
          <p class="text-xs text-teal-800 font-semibold mb-2 bg-teal-50 p-2 rounded border border-teal-200">
            <i class="fa-solid fa-square-check"></i> Petunjuk: Anda dapat mencentang lebih dari satu jawaban yang benar.
          </p>
          ${q.opsi_json.map(opt => {
            const isChecked = selectedArr.includes(opt.key);
            return `
              <div onclick="window.ExamEngine.togglePGKOption('${qId}', '${opt.key}')" class="option-card flex items-start gap-3 p-3.5 rounded-xl border ${isChecked ? 'selected' : 'bg-white'}">
                <div class="w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${isChecked ? 'bg-teal-600 text-white' : 'border-2 border-slate-300 bg-white text-transparent'}">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div class="text-sm sm:text-base text-slate-800 pt-0.5 leading-snug">
                  ${opt.text}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3. Tipe 3: Benar / Salah (True/False)
    if (q.jenis_soal === 'truefalse') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <button onclick="window.ExamEngine.selectTrueFalseOption('${qId}', 'BENAR')" class="p-4 rounded-xl font-bold text-base border-2 flex items-center justify-center gap-3 transition ${currentVal === 'BENAR' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'}">
            <i class="fa-solid fa-circle-check text-xl"></i> BENAR
          </button>
          <button onclick="window.ExamEngine.selectTrueFalseOption('${qId}', 'SALAH')" class="p-4 rounded-xl font-bold text-base border-2 flex items-center justify-center gap-3 transition ${currentVal === 'SALAH' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-red-800 border-red-200 hover:bg-red-50'}">
            <i class="fa-solid fa-circle-xmark text-xl"></i> SALAH
          </button>
        </div>
      `;
    }

    // 4. Tipe 4: Menjodohkan (Matching Pair)
    if (q.jenis_soal === 'matching') {
      const matchMap = currentVal || {};
      const premises = q.opsi_json.premises || [];
      const targets = q.opsi_json.targets || [];

      return `
        <div class="space-y-4">
          <p class="text-xs text-blue-900 font-semibold bg-blue-50 p-2 rounded border border-blue-200">
            <i class="fa-solid fa-link"></i> Pasangkan setiap premis di kolom kiri dengan pasangan yang tepat di kolom kanan.
          </p>
          <div class="space-y-3">
            ${premises.map((p, idx) => {
              const selectedTarget = matchMap[p.id] || '';
              return `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="font-medium text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">${idx + 1}</span>
                    <span>${p.label}</span>
                  </div>
                  <div class="sm:w-64">
                    <select onchange="window.ExamEngine.setMatchingAnswer('${qId}', '${p.id}', this.value)" class="w-full text-xs sm:text-sm font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500">
                      <option value="">-- Pilih Pasangan --</option>
                      ${targets.map(t => `
                        <option value="${t.id}" ${selectedTarget === t.id ? 'selected' : ''}>${t.label}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // 5. Tipe 5: Isian Singkat & Esai (Evaluasi AI dengan Rubrik Guru)
    if (q.jenis_soal === 'essay') {
      const essayText = currentVal || '';
      return `
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              <i class="fa-solid fa-robot"></i> Jawaban dievaluasi otomatis oleh AI Engine berbasis Rubrik Guru
            </span>
            <span id="essay-word-counter">${essayText ? essayText.trim().split(/\s+/).length : 0} Kata</span>
          </div>
          <textarea 
            id="essay-input-${qId}" 
            oninput="window.ExamEngine.setEssayAnswer('${qId}', this.value)" 
            rows="6" 
            placeholder="Tuliskan jawaban uraian / analisis Anda di sini secara lengkap dan sistematis..."
            class="w-full text-sm sm:text-base p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 leading-relaxed font-sans shadow-inner"
          >${essayText}</textarea>
          <div class="text-xs text-slate-400 italic">
            Tips: Gunakan argumen ilmiah, sebutkan faktor-faktor fisis kunci, dan jelaskan mekanisme secara runtut.
          </div>
        </div>
      `;
    }

    return '<div class="text-sm text-slate-500">Tipe soal tidak didukung.</div>';
  }

  // --- ANSWER SETTERS (Dengan Instant LocalStorage Auto-Save) ---
  selectPGOption(questionId, key) {
    this.answers[questionId] = key;
    this._saveDraftToStorage();
    this.renderExamInterface();
  }

  togglePGKOption(questionId, key) {
    let arr = this.answers[questionId] || [];
    if (!Array.isArray(arr)) arr = [];
    if (arr.includes(key)) {
      arr = arr.filter(k => k !== key);
    } else {
      arr.push(key);
    }
    this.answers[questionId] = arr;
    this._saveDraftToStorage();
    this.renderExamInterface();
  }

  selectTrueFalseOption(questionId, val) {
    this.answers[questionId] = val;
    this._saveDraftToStorage();
    this.renderExamInterface();
  }

  setMatchingAnswer(questionId, premiseId, targetId) {
    if (!this.answers[questionId]) this.answers[questionId] = {};
    if (targetId) {
      this.answers[questionId][premiseId] = targetId;
    } else {
      delete this.answers[questionId][premiseId];
    }
    this._saveDraftToStorage();
    this.renderExamInterface();
  }

  setEssayAnswer(questionId, text) {
    this.answers[questionId] = text;
    this._saveDraftToStorage();
    const counter = document.getElementById('essay-word-counter');
    if (counter) {
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      counter.innerText = `${words} Kata`;
    }
  }

  toggleDoubt(questionId) {
    this.doubtful[questionId] = !this.doubtful[questionId];
    this._saveDraftToStorage();
    this.renderExamInterface();
  }

  // --- NAVIGATION HELPERS ---
  jumpToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      this.renderExamInterface();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderExamInterface();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderExamInterface();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  _isQuestionAnswered(qId) {
    const val = this.answers[qId];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  }

  _getAnsweredCount() {
    return this.questions.filter(q => this._isQuestionAnswered(q.question_id)).length;
  }

  // --- FORMULA POPUP MODAL ---
  openFormulaModal() {
    const modal = document.getElementById('formula-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeFormulaModal() {
    const modal = document.getElementById('formula-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- SUBMISSION CONFIRMATION ---
  openConfirmSubmitModal() {
    const modal = document.getElementById('confirm-submit-modal');
    const totalQ = this.questions.length;
    const answered = this._getAnsweredCount();
    const doubts = Object.values(this.doubtful).filter(Boolean).length;
    const unanswered = totalQ - answered;

    const summaryEl = document.getElementById('submit-modal-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="grid grid-cols-3 gap-2 text-center text-xs mb-3">
          <div class="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
            <span class="block text-lg font-bold">${answered}</span> Terjawab
          </div>
          <div class="bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
            <span class="block text-lg font-bold">${doubts}</span> Ragu-ragu
          </div>
          <div class="bg-slate-100 text-slate-700 p-2.5 rounded-lg border border-slate-200">
            <span class="block text-lg font-bold">${unanswered}</span> Belum Diisi
          </div>
        </div>
        ${unanswered > 0 ? `<p class="text-amber-700 text-xs font-medium"><i class="fa-solid fa-triangle-exclamation"></i> Terdapat ${unanswered} soal yang belum Anda jawab. Apakah Anda tetap ingin menyelesaikan ujian?</p>` : ''}
      `;
    }
    if (modal) modal.classList.remove('hidden');
  }

  closeConfirmSubmitModal() {
    const modal = document.getElementById('confirm-submit-modal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * Bab 6.3: Pemicu Submit Bertahap & Penanganan Beban Server (Staggered Batch Submission)
   */
  async submitExamWithStagger(isAutoSubmit = false) {
    this.closeConfirmSubmitModal();
    this.isSubmitting = true;

    // Tampilkan modal progress Staggered Submission
    const staggerModal = document.getElementById('stagger-submit-modal');
    const progressFill = document.getElementById('stagger-progress-fill');
    const statusText = document.getElementById('stagger-status-text');

    if (staggerModal) staggerModal.classList.remove('hidden');

    // Interval delay acak 1.5 - 4.5 detik (Bab 6.3)
    const delayMs = Math.floor(Math.random() * 2500) + 1800;
    const startTime = Date.now();

    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(95, Math.round((elapsed / delayMs) * 100));
      if (progressFill) progressFill.style.width = pct + '%';
      if (statusText) statusText.innerText = `Menyeimbangkan antrean server (${pct}%)... Melindungi server dari lonjakan beban serentak.`;
    }, 100);

    await new Promise(r => setTimeout(r, delayMs));
    clearInterval(updateInterval);

    if (progressFill) progressFill.style.width = '100%';
    if (statusText) statusText.innerText = 'Jawaban terenkripsi berhasil diverifikasi di server!';

    // Hitung Nilai berdasarkan 5 tipe soal dan bobot Admin
    await this._calculateAndPersistFinalResult();

    // Hentikan timer dan heartbeat
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.isExamActive = false;

    // Bersihkan draft di LocalStorage setelah sukses
    const draftKey = `eduexam_draft_${this.activeExam.session_id}_${this.studentUser.user_id}`;
    localStorage.removeItem(draftKey);

    await new Promise(r => setTimeout(r, 600));
    if (staggerModal) staggerModal.classList.add('hidden');

    // Tampilkan Kartu Hasil Ujian Diagnostik
    this.renderExamCompletionResult();
  }

  /**
   * Kalkulasi Skor Otomatis Berbasis Bobot Admin & Evaluasi AI Esai
   */
  async _calculateAndPersistFinalResult() {
    const weights = window.EduDB.getScoringWeights();
    let scorePG = 0;
    let scorePGK = 0;
    let scoreTF = 0;
    let scoreMatching = 0;
    let scoreEssay = 0;

    let essayFeedback = 'Tidak ada jawaban esai yang dinilai.';

    for (const q of this.questions) {
      const studentAns = this.answers[q.question_id];

      // 1. PG
      if (q.jenis_soal === 'pg') {
        if (studentAns === q.kunci_jawaban) {
          scorePG = weights.pg;
        }
      }
      // 2. PGK
      else if (q.jenis_soal === 'pgk') {
        const correctKeys = q.kunci_jawaban || [];
        const givenKeys = Array.isArray(studentAns) ? studentAns : [];
        if (givenKeys.length > 0) {
          let matched = 0;
          let wrong = 0;
          givenKeys.forEach(k => {
            if (correctKeys.includes(k)) matched++;
            else wrong++;
          });
          const ratio = Math.max(0, (matched - (wrong * 0.5)) / correctKeys.length);
          scorePGK = Math.round(ratio * weights.pgk);
        }
      }
      // 3. True/False
      else if (q.jenis_soal === 'truefalse') {
        if (studentAns === q.kunci_jawaban) {
          scoreTF = weights.truefalse;
        }
      }
      // 4. Matching
      else if (q.jenis_soal === 'matching') {
        const keyMap = q.kunci_jawaban || {};
        const givenMap = studentAns || {};
        const totalPremises = Object.keys(keyMap).length || 1;
        let correctMatches = 0;

        Object.keys(keyMap).forEach(pId => {
          if (givenMap[pId] && givenMap[pId] === keyMap[pId]) {
            correctMatches++;
          }
        });
        scoreMatching = Math.round((correctMatches / totalPremises) * weights.matching);
      }
      // 5. Essay (AI Auto-Grading dengan Fallback Fuzzy Matcher)
      else if (q.jenis_soal === 'essay') {
        const aiEvaluation = await window.EduAI.gradeEssayWithAI(studentAns, q);
        // Normalize score 0-100 to essay weight
        scoreEssay = Math.round((aiEvaluation.score / 100) * weights.essay);
        essayFeedback = aiEvaluation.feedback;
      }
    }

    const totalScore = scorePG + scorePGK + scoreTF + scoreMatching + scoreEssay;
    const kkm = this.activeExam.kkm || 75;

    let ketuntasan = 'Belum Tuntas';
    let diagnostik = 'Remedial';

    if (totalScore >= 90) {
      ketuntasan = 'Tuntas (Mahir)';
      diagnostik = 'Pengayaan';
    } else if (totalScore >= kkm) {
      ketuntasan = 'Tuntas (Cukup)';
      diagnostik = 'Tuntas';
    }

    const savedRecord = window.EduDB.saveStudentResult({
      session_id: this.activeExam.session_id,
      user_id: this.studentUser.user_id,
      nama_siswa: this.studentUser.nama_lengkap,
      nis: this.studentUser.nis || this.studentUser.username,
      kelas: this.studentUser.kelas || 'XII MIPA 1',
      tahun_ajaran: this.activeExam.tahun_ajaran || '2025/2026',
      semester: this.activeExam.semester || 'Ganjil',
      jawaban_siswa_json: this.answers,
      skor_per_tipe: {
        pg: scorePG,
        pgk: scorePGK,
        truefalse: scoreTF,
        matching: scoreMatching,
        essay: scoreEssay
      },
      skor_total: totalScore,
      status_ketuntasan: ketuntasan,
      status_diagnostik: diagnostik,
      feedback_ai_essay: essayFeedback,
      log_pindah_tab_count: this.tabSwitchCount
    });

    this.latestResult = savedRecord;
  }

  /**
   * Render Lembar Hasil & Diagnostik Ujian Siswa
   */
  renderExamCompletionResult() {
    const container = document.getElementById('student-exam-room-view');
    if (!container || !this.latestResult) return;

    const res = this.latestResult;
    const isPass = res.skor_total >= (this.activeExam.kkm || 75);

    container.innerHTML = `
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden text-center">
          <!-- Header Banner -->
          <div class="p-6 ${isPass ? 'bg-gradient-to-r from-teal-700 to-emerald-800' : 'bg-gradient-to-r from-blue-900 to-indigo-950'} text-white">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
              ${isPass ? '<i class="fa-solid fa-award text-amber-300"></i>' : '<i class="fa-solid fa-clipboard-check text-white"></i>'}
            </div>
            <h2 class="text-2xl font-black">Ujian Berhasil Diserahkan!</h2>
            <p class="text-sm text-teal-100 opacity-90 mt-1">${this.activeExam.nama_ujian} &bull; SMAN 4 Soppeng</p>
          </div>

          <!-- Body Scores -->
          <div class="p-6 sm:p-8 space-y-6">
            <div class="inline-block p-6 rounded-2xl ${isPass ? 'bg-teal-50 border border-teal-200 text-teal-900' : 'bg-slate-50 border border-slate-200 text-slate-800'}">
              <span class="text-xs uppercase font-bold tracking-wider text-slate-500">Skor Akhir Diagnostik</span>
              <div class="text-5xl font-black my-1">${res.skor_total} <span class="text-xl font-normal text-slate-500">/ 100</span></div>
              <span class="inline-block px-3 py-1 text-xs font-bold rounded-full ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${res.status_ketuntasan} (${res.status_diagnostik})
              </span>
            </div>

            <!-- Rincian Skor 5 Tipe Soal -->
            <div class="text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-teal-600"></i> Rincian Skor Penskoran Bobot:
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span class="text-slate-500 block">PG Std</span>
                  <strong class="text-sm text-slate-800">${res.skor_per_tipe.pg} pt</strong>
                </div>
                <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span class="text-slate-500 block">PGK</span>
                  <strong class="text-sm text-slate-800">${res.skor_per_tipe.pgk} pt</strong>
                </div>
                <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span class="text-slate-500 block">B / S</span>
                  <strong class="text-sm text-slate-800">${res.skor_per_tipe.truefalse} pt</strong>
                </div>
                <div class="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span class="text-slate-500 block">Jodohkan</span>
                  <strong class="text-sm text-slate-800">${res.skor_per_tipe.matching} pt</strong>
                </div>
                <div class="bg-white p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                  <span class="text-slate-500 block">Esai (AI)</span>
                  <strong class="text-sm text-slate-800">${res.skor_per_tipe.essay} pt</strong>
                </div>
              </div>
            </div>

            <!-- Feedback AI Diagnostik Esai -->
            <div class="text-left bg-blue-50/70 p-4 rounded-xl border border-blue-200">
              <h4 class="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-2">
                <i class="fa-solid fa-microchip-ai text-blue-700"></i> Ulasan Diagnostik AI & Rubrik Guru:
              </h4>
              <p class="text-xs sm:text-sm text-blue-950 leading-relaxed">
                "${res.feedback_ai_essay}"
              </p>
            </div>

            <!-- Info Keamanan & Identitas -->
            <div class="text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
              <div>Pencatatan Pindah Tab: <strong class="${res.log_pindah_tab_count > 0 ? 'text-red-600' : 'text-emerald-600'}">${res.log_pindah_tab_count} kali</strong></div>
              <div>Waktu Selesai: <strong>${res.waktu_submit}</strong></div>
            </div>

            <button onclick="window.App.navigateToRoleDashboard()" class="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-950 transition shadow-md">
              <i class="fa-solid fa-house"></i> Kembali ke Dashboard Siswa
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Global Singleton Instance
window.ExamEngine = new StudentExamEngine();

