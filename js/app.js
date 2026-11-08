/**
 * EduExam SMAN 4 Soppeng - Master Application Controller (SPA Router & Auth)
 * Blueprint v6.0:
 * 1. Auto-Login via Barcode / QR Scanner Kartu Ujian (Single-Card)
 * 2. URL Token Parameter Auto-Login Support (?token=...)
 * 3. Filter Jadwal Ujian Aktif oleh Admin di Sisi Siswa
 * 4. Penguncian Otomatis Sesi Ujian di Luar Jadwal
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

class EduExamApp {
  constructor() {
    this.currentUser = null;
    this.currentView = 'login'; // 'login', 'admin', 'guru', 'siswa', 'kepsek', 'exam-room'
    this.activeRoleTab = 'siswa';
    this.mediaStream = null;
    this.scannerInterval = null;
    this.deferredPwaPrompt = null; // Handler event beforeinstallprompt (PWA)
  }

  init() {
    try { this._restoreSession(); } catch (e) { console.warn('Restore session error:', e); }
    try { this._checkUrlForAuthToken(); } catch (e) { console.warn('URL token check error:', e); }
    try { this._bindEvents(); } catch (e) { console.warn('Event binding error:', e); }
    try { this._initPwaState(); } catch (e) { console.warn('PWA init error:', e); }
    try { this.renderHeaderControls(); } catch (e) { console.warn('Header controls error:', e); }
    try { this.navigateTo(this.currentView || 'login'); } catch (e) { console.warn('Navigation error:', e); }
  }

  _restoreSession() {
    const raw = localStorage.getItem('eduexam_auth_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role) {
          this.currentUser = parsed;
          this.currentView = (parsed.role === 'super_admin') ? 'admin' : parsed.role;
          if (parsed.role === 'guru' && window.GuruModule) {
            const subjects = parsed.mata_pelajaran_list || (parsed.mapel ? parsed.mapel.split(',').map(s => s.trim()) : null);
            if (subjects && subjects.length > 0) window.GuruModule.activeSubject = subjects[0];
          }
        }
      } catch (e) {
        localStorage.removeItem('eduexam_auth_session');
      }
    }
  }

  /**
   * Cek Parameter URL untuk Auto-Login instan via scan QR kamera HP biasa (?token=...)
   */
  _checkUrlForAuthToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || urlParams.get('auth');
    if (token) {
      this.handleBarcodeAutoLogin(token);
    }
  }

  _bindEvents() {
    window.addEventListener('online', () => {
      this.updateHeaderNetworkBadge(true);
    });
    window.addEventListener('offline', () => {
      this.updateHeaderNetworkBadge(false);
    });

    // PWA Install Prompt Event Listener (Android, Chrome, Edge, Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPwaPrompt = e;
      console.log('[EduExam PWA] Event beforeinstallprompt tertangkap!');
      this.showPwaInstallUI(true);
    });

    // PWA App Installed Event Listener
    window.addEventListener('appinstalled', () => {
      this.deferredPwaPrompt = null;
      console.log('[EduExam PWA] Aplikasi EduExam telah berhasil diinstal!');
      this.showPwaInstallUI(false);
      this.showToast('Aplikasi EduExam SMAN 4 Soppeng berhasil terpasang di perangkat Anda!', 'success');
    });
  }

  // --- PWA INSTALLATION CONTROLLER (PROMPT & MODAL GUIDES) ---
  _initPwaState() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      console.log('[EduExam PWA] Aplikasi berjalan dalam mode Standalone.');
      this.showPwaInstallUI(false);
    } else {
      this.showPwaInstallUI(true);
    }
  }

  showPwaInstallUI(visible) {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      visible = false;
    }
    const card = document.getElementById('pwa-install-card');
    const headerBtn = document.getElementById('pwa-install-header-btn');
    if (card) {
      if (visible) card.classList.remove('hidden');
      else card.classList.add('hidden');
    }
    if (headerBtn) {
      if (visible) headerBtn.classList.remove('hidden');
      else headerBtn.classList.add('hidden');
    }
  }

  async promptPwaInstall() {
    // 1. Jika event native beforeinstallprompt siap (Chrome, Android, Edge)
    if (this.deferredPwaPrompt) {
      this.deferredPwaPrompt.prompt();
      const { outcome } = await this.deferredPwaPrompt.userChoice;
      console.log('[EduExam PWA] Respon instalasi pengguna:', outcome);
      if (outcome === 'accepted') {
        this.showToast('Memproses pemasangan aplikasi EduExam...', 'info');
      }
      this.deferredPwaPrompt = null;
      this.showPwaInstallUI(false);
      return;
    }

    // 2. Deteksi iOS (iPhone / iPad) yang menggunakan Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos) {
      this.openIosInstallGuideModal();
      return;
    }

    // 3. Deteksi apakah sudah terpasang (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      this.showToast('Aplikasi EduExam sudah terpasang dan berjalan sebagai PWA Standalone!', 'success');
      return;
    }

    // 4. Panduan instalasi umum (Desktop Chrome/Edge, Android tanpa prompt langsung)
    this.openGenericInstallGuideModal();
  }

  openIosInstallGuideModal() {
    const modal = document.getElementById('pwa-guide-modal');
    const title = document.getElementById('pwa-guide-title');
    const content = document.getElementById('pwa-guide-content');
    if (!modal || !content) return;

    if (title) title.innerHTML = '<i class="fa-brands fa-apple text-slate-900 mr-1.5"></i> Instal di iPhone / iPad (iOS)';

    content.innerHTML = `
      <div class="space-y-3">
        <p class="font-medium text-slate-700">Ikuti 3 langkah mudah berikut untuk memasang EduExam di perangkat iOS Anda:</p>
        <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200 space-y-2.5">
          <div class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
            <p>Buka aplikasi ini menggunakan peramban <strong>Safari</strong> di iPhone/iPad Anda.</p>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
            <p>Tekan tombol <strong>Bagikan (Share)</strong> <i class="fa-solid fa-arrow-up-from-bracket text-blue-700 mx-1"></i> pada bilah menu Safari bawah.</p>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
            <p>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <i class="fa-regular fa-square-plus text-emerald-600 mx-1"></i> lalu tekan <strong>Tambah</strong>.</p>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 italic">Ikon EduExam SMAN 4 Soppeng akan muncul di layar utama HP Anda layaknya aplikasi bawaan App Store!</p>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  openGenericInstallGuideModal() {
    const modal = document.getElementById('pwa-guide-modal');
    const title = document.getElementById('pwa-guide-title');
    const content = document.getElementById('pwa-guide-content');
    if (!modal || !content) return;

    if (title) title.innerHTML = '<i class="fa-solid fa-download text-teal-600 mr-1.5"></i> Cara Instal Aplikasi EduExam';

    content.innerHTML = `
      <div class="space-y-3">
        <p class="font-medium text-slate-700">Untuk menginstal EduExam di Android, Windows, Mac, atau Chrome OS:</p>
        <div class="p-3 bg-teal-50 rounded-2xl border border-teal-200 space-y-2.5">
          <div class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
            <p>Pada <strong>Google Chrome / Microsoft Edge Desktop</strong>: Periksa bilah alamat browser bagian kanan atas dan klik ikon <strong>Instal Aplikasi</strong> <i class="fa-solid fa-download text-teal-700 mx-1"></i>.</p>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
            <p>Pada <strong>HP Android</strong>: Tekan menu titik tiga (⋮) di pojok kanan atas browser, kemudian pilih <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
          </div>
        </div>
        <p class="text-[11px] text-slate-500 italic">Setelah diinstal, aplikasi dapat dibuka secara instan dari Layar Utama / Desktop tanpa membuka browser terlebih dahulu.</p>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  // --- RENDER HEADER CONTROLS ---
  renderHeaderControls() {
    const period = window.EduDB.getActivePeriod();
    const periodSelect = document.getElementById('global-academic-year');
    const semesterSelect = document.getElementById('global-semester');

    if (periodSelect) periodSelect.value = period.tahun_ajaran;
    if (semesterSelect) semesterSelect.value = period.semester;

    this.renderAuthNavBadge();
  }

  handleAcademicPeriodChange() {
    const thn = document.getElementById('global-academic-year').value;
    const smt = document.getElementById('global-semester').value;

    window.EduDB.setActivePeriod(thn, smt);
    this.showToast(`Periode akademik global disetel ke: ${thn} - Semester ${smt}`, 'info');

    if (this.currentView === 'admin') window.AdminModule.renderAdminView();
    else if (this.currentView === 'guru') window.GuruModule.renderGuruView();
    else if (this.currentView === 'siswa') this.renderSiswaDashboard();
    else if (this.currentView === 'kepsek') window.KepsekModule.renderKepsekView();
  }

  renderAuthNavBadge() {
    const navRight = document.getElementById('nav-user-profile');
    if (!navRight) return;

    if (!this.currentUser) {
      navRight.innerHTML = `
        <button onclick="window.App.navigateTo('login')" class="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm">
          <i class="fa-solid fa-right-to-bracket"></i> Portal Masuk
        </button>
      `;
      return;
    }

    const u = this.currentUser;
    let roleBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-100 text-teal-800">GURU</span>`;
    let roleBg = 'bg-teal-700';

    if (u.role === 'admin' || u.role === 'super_admin') {
      roleBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">ADMIN</span>`;
      roleBg = 'bg-purple-800';
    } else if (u.role === 'siswa') {
      roleBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">SISWA</span>`;
      roleBg = 'bg-blue-800';
    } else if (u.role === 'kepsek') {
      roleBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">KEPSEK</span>`;
      roleBg = 'bg-amber-800';
    }

    navRight.innerHTML = `
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="text-right hidden sm:block">
          <div class="text-xs font-bold text-slate-800 leading-tight flex items-center justify-end gap-1.5">
            ${u.nama_lengkap} ${roleBadge}
          </div>
          <div class="text-[10px] text-slate-500">${u.kelas || u.mapel || (u.jabatan || 'SMAN 4 Soppeng')}</div>
        </div>
        <div class="w-8 h-8 rounded-full ${roleBg} text-white flex items-center justify-center font-bold text-xs shadow-inner">
          ${u.nama_lengkap.charAt(0)}
        </div>
        <button onclick="window.App.logout()" class="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Keluar dari Akun">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    `;
  }

  updateHeaderNetworkBadge(isOnline) {
    const badge = document.getElementById('header-heartbeat-badge');
    if (!badge) return;
    if (isOnline) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 heartbeat-active"></span> <span class="hidden md:inline">Jaringan Stabil</span>`;
      badge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200';
    } else {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Mode Offline`;
      badge.className = 'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200';
    }
  }

  // --- NAVIGATION ROUTER ---
  navigateTo(viewName) {
    // Normalisasi role admin & super_admin ke panel admin
    const targetView = (viewName === 'super_admin' || viewName === 'admin') ? 'admin' : viewName;
    this.currentView = targetView;

    const views = [
      'login-view',
      'admin-dashboard-view',
      'guru-dashboard-view',
      'siswa-dashboard-view',
      'kepsek-dashboard-view',
      'student-exam-room-view'
    ];

    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    const subHeader = document.getElementById('global-sub-header');

    if (targetView === 'login') {
      if (subHeader) subHeader.classList.add('hidden');
      document.getElementById('login-view')?.classList.remove('hidden');
      this.renderLoginView();
    } else if (targetView === 'admin') {
      if (subHeader) subHeader.classList.remove('hidden');
      document.getElementById('admin-dashboard-view')?.classList.remove('hidden');
      window.AdminModule.renderAdminView();
    } else if (targetView === 'guru') {
      if (subHeader) subHeader.classList.remove('hidden');
      document.getElementById('guru-dashboard-view')?.classList.remove('hidden');
      window.GuruModule.renderGuruView();
    } else if (targetView === 'siswa') {
      if (subHeader) subHeader.classList.remove('hidden');
      document.getElementById('siswa-dashboard-view')?.classList.remove('hidden');
      this.renderSiswaDashboard();
    } else if (targetView === 'kepsek') {
      if (subHeader) subHeader.classList.remove('hidden');
      document.getElementById('kepsek-dashboard-view')?.classList.remove('hidden');
      window.KepsekModule.renderKepsekView();
    } else if (targetView === 'exam-room') {
      if (subHeader) subHeader.classList.add('hidden');
      document.getElementById('student-exam-room-view')?.classList.remove('hidden');
    }

    this.renderAuthNavBadge();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToRoleDashboard() {
    if (this.currentUser) {
      const role = this.currentUser.role;
      if (role === 'super_admin' || role === 'admin') {
        this.navigateTo('admin');
      } else {
        this.navigateTo(role);
      }
    } else {
      this.navigateTo('login');
    }
  }

  // ==================== AUTO-LOGIN BARCODE / QR SCANNER (BAB 4.2) ====================
  openQrScannerModal() {
    const modal = document.getElementById('qr-scanner-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.startCameraStream();
    }
  }

  closeQrScannerModal() {
    const modal = document.getElementById('qr-scanner-modal');
    if (modal) modal.classList.add('hidden');
    this.stopCameraStream();
  }

  startCameraStream() {
    const video = document.getElementById('qr-video-preview');
    const statusMsg = document.getElementById('qr-scanner-status');
    if (!video) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          this.mediaStream = stream;
          video.srcObject = stream;
          video.play();
          if (statusMsg) statusMsg.innerText = 'Kamera aktif. Posisikan QR Code Kartu Ujian di dalam kotak target...';
        })
        .catch(err => {
          console.warn('Camera access unavailable or declined:', err);
          if (statusMsg) statusMsg.innerHTML = '<span class="text-amber-600">Kamera fisik tidak terdeteksi. Gunakan tombol <strong>Simulasi Scan Barcode</strong> di bawah untuk uji coba instan!</span>';
        });
    } else {
      if (statusMsg) statusMsg.innerText = 'Peramban tidak mendukung kamera langsung. Gunakan opsi simulasi di bawah.';
    }
  }

  stopCameraStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.scannerInterval) {
      clearInterval(this.scannerInterval);
      this.scannerInterval = null;
    }
  }

  /**
   * Eksekusi Otentikasi Instan via Barcode Auth Token
   */
  handleBarcodeAutoLogin(tokenString) {
    if (!tokenString) return;
    const cleanToken = tokenString.trim().toUpperCase();
    const student = window.EduDB.getUserByQrToken(cleanToken);

    if (!student) {
      this.showToast(`Token Barcode "${cleanToken}" tidak valid atau siswa belum terdaftar!`, 'error');
      return;
    }

    // Auto Login Berhasil!
    this.currentUser = student;
    localStorage.setItem('eduexam_auth_session', JSON.stringify(student));
    this.closeQrScannerModal();

    this.showToast(`Auto-Login Sukses! Selamat datang, ${student.nama_lengkap} (${student.kelas})`, 'success');
    this.renderAuthNavBadge();
    this.navigateTo('siswa');
  }

  // --- LOGIN VIEW & PORTAL 4 ROLE ---
  renderLoginView() {
    this.setLoginRole(this.activeRoleTab || 'siswa');
  }

  // Alias setActiveRole requested for role switching
  setActiveRole(role) {
    this.setLoginRole(role);
  }

  setLoginRole(role) {
    this.activeRoleTab = role;
    ['siswa', 'guru', 'admin', 'kepsek'].forEach(r => {
      const btn = document.getElementById(`login-tab-${r}`);
      if (btn) {
        if (r === role) {
          btn.className = 'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition bg-blue-900 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer';
        } else {
          btn.className = 'flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer';
        }
      }
    });

    const idLabel = document.getElementById('login-identifier-label');
    const idInput = document.getElementById('login-identifier-input');
    const pwdLabel = document.getElementById('login-password-label');
    const pwdInput = document.getElementById('login-password-input');
    const noteEl = document.getElementById('login-role-note');

    if (role === 'siswa') {
      if (idLabel) idLabel.innerText = 'Nama Lengkap Siswa:';
      if (idInput) {
        idInput.type = 'text';
        idInput.placeholder = 'Masukkan Nama Lengkap Siswa';
        idInput.value = '';
      }
      if (pwdLabel) pwdLabel.innerText = 'Kata Sandi / NIS Siswa:';
      if (pwdInput) {
        pwdInput.type = 'password';
        pwdInput.placeholder = 'Masukkan NIS Siswa';
        pwdInput.value = '';
      }
      if (noteEl) noteEl.innerHTML = '<i class="fa-solid fa-qrcode text-teal-600"></i> Siswa dapat masuk instan via <strong>Scan Barcode Kartu Ujian (Auto-Login)</strong> atau ketik Nama + NIS.';
    } else if (role === 'guru') {
      if (idLabel) idLabel.innerText = 'NIP / Username Guru:';
      if (idInput) {
        idInput.type = 'text';
        idInput.placeholder = 'Masukkan NIP atau Username Guru';
        idInput.value = '';
      }
      if (pwdLabel) pwdLabel.innerText = 'Kata Sandi Guru:';
      if (pwdInput) {
        pwdInput.type = 'password';
        pwdInput.placeholder = 'Masukkan Kata Sandi Guru';
        pwdInput.value = '';
      }
      if (noteEl) noteEl.innerHTML = '<i class="fa-solid fa-chalkboard-user text-teal-600"></i> Akun Guru dibuat & dikelola terpusat oleh Admin Sekolah (Mendukung Multi-Mapel & Multi-Kelas).';
    } else if (role === 'admin') {
      if (idLabel) idLabel.innerText = 'Email Administrator:';
      if (idInput) {
        idInput.type = 'email';
        idInput.placeholder = 'sman4soppeng@gmail.com';
        idInput.value = 'sman4soppeng@gmail.com';
      }
      if (pwdLabel) pwdLabel.innerText = 'Kata Sandi Administrator:';
      if (pwdInput) {
        pwdInput.type = 'password';
        pwdInput.placeholder = '21405';
        pwdInput.value = '21405';
      }
      if (noteEl) noteEl.innerHTML = '<i class="fa-solid fa-shield-halved text-purple-600"></i> <strong>Admin Utama SMAN 4 Soppeng:</strong> Kredensial default: <code>sman4soppeng@gmail.com</code> / <code>21405</code>. Kelola Mata Pelajaran, Guru, Siswa, dan Jadwal.';
    } else if (role === 'kepsek') {
      if (idLabel) idLabel.innerText = 'Email / Username Kepala Sekolah:';
      if (idInput) {
        idInput.type = 'text';
        idInput.placeholder = 'Masukkan Email atau Username Kepala Sekolah';
        idInput.value = '';
      }
      if (pwdLabel) pwdLabel.innerText = 'Kata Sandi Kepala Sekolah:';
      if (pwdInput) {
        pwdInput.type = 'password';
        pwdInput.placeholder = 'Masukkan Kata Sandi Kepala Sekolah';
        pwdInput.value = '';
      }
      if (noteEl) noteEl.innerHTML = '<i class="fa-solid fa-graduation-cap text-amber-600"></i> Laporan eksekutif grafik tren nilai & asesmen diagnostik.';
    }
  }

  async handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = (document.getElementById('login-identifier-input')?.value || '').trim();
    const pwd = (document.getElementById('login-password-input')?.value || '').trim();
    const role = this.activeRoleTab || 'siswa';

    if (!id || !pwd) {
      this.showToast('Harap isi Nama/Username/Email dan Kata Sandi!', 'warning');
      return;
    }

    let authUser = null;

    // 1. Cek kredensial default Admin Utama SMAN 4 Soppeng (sman4soppeng@gmail.com / 21405)
    if ((role === 'admin' || !role) && (id.toLowerCase() === 'sman4soppeng@gmail.com' || id.toLowerCase() === 'admin') && pwd === '21405') {
      authUser = {
        user_id: '00000000-0000-4000-8000-000000000001',
        username: 'admin',
        email: 'sman4soppeng@gmail.com',
        nama_lengkap: 'Administrator SMAN 4 Soppeng',
        role: 'admin',
        status_aktif: true,
        mata_pelajaran_list: [],
        kelas_diampu_list: []
      };
    }

    // 2. Query data langsung ke Supabase `tb_users`
    if (!authUser) {
      const supabase = window.supabaseClient || (window.EduDB ? window.EduDB.supabase : null);
      if (supabase) {
        try {
          let query = supabase.from('tb_users').select('*').eq('password_hash', pwd);
          if (role === 'siswa') {
            query = query.ilike('nama_lengkap', `%${id}%`).eq('role', 'siswa');
          } else {
            query = query.or(`email.ilike.${id},username.ilike.${id}`);
            if (role) query = query.eq('role', role);
          }

          const { data, error } = await query.limit(1);
          if (!error && Array.isArray(data) && data.length > 0) {
            const u = data[0];
            authUser = {
              user_id: u.user_id,
              username: u.username,
              email: u.email,
              password_hash: u.password_hash,
              nama_lengkap: u.nama_lengkap,
              role: u.role,
              status_aktif: u.status_aktif !== false,
              mata_pelajaran_list: Array.isArray(u.assigned_mapel_json) ? u.assigned_mapel_json : [],
              kelas_diampu_list: Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json : [],
              mapel: Array.isArray(u.assigned_mapel_json) && u.assigned_mapel_json.length > 0 ? u.assigned_mapel_json[0] : '',
              kelas: Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json.join(', ') : '-'
            };
          }
        } catch (err) {
          console.warn('Supabase query error during login:', err);
        }
      }
    }

    // 3. Fallback ke database lokal (EduDB)
    if (!authUser && window.EduDB) {
      try {
        if (typeof window.EduDB.authenticateAsync === 'function') {
          authUser = await window.EduDB.authenticateAsync(id, pwd, role);
        } else if (typeof window.EduDB.authenticate === 'function') {
          authUser = window.EduDB.authenticate(id, pwd, role);
        }
      } catch (err) {
        console.warn('EduDB authenticate error:', err);
        authUser = window.EduDB.authenticate ? window.EduDB.authenticate(id, pwd, role) : null;
      }
    }

    if (!authUser) {
      this.showToast('Login gagal! Akun tidak ditemukan atau kata sandi tidak cocok. Silakan periksa kembali kredensial Anda.', 'error');
      return;
    }

    // Simpan sesi user ke localStorage
    this.currentUser = authUser;
    localStorage.setItem('eduexam_auth_session', JSON.stringify(authUser));

    if (authUser.role === 'guru' && window.GuruModule) {
      const subjects = authUser.mata_pelajaran_list || (authUser.mapel ? authUser.mapel.split(',').map(s => s.trim()) : null);
      if (subjects && subjects.length > 0) window.GuruModule.activeSubject = subjects[0];
    }

    this.showToast(`Login berhasil! Selamat datang, ${authUser.nama_lengkap}.`, 'success');
    this.renderAuthNavBadge();
    this.navigateTo(authUser.role);
  }

  showSupabaseStatusModal() {
    const modal = document.getElementById('supabase-status-modal');
    if (!modal) return;
    const statusText = document.getElementById('modal-supabase-status');
    const db = window.EduDB;
    if (statusText && db) {
      if (db.supabaseLastStatus && db.supabaseLastStatus.isRLS) {
        statusText.innerHTML = '<span class="text-amber-600 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Terhubung ke Supabase Cloud, namun tabel memerlukan RLS Policy. Klik "Salin Skrip SQL" lalu jalankan di Supabase SQL Editor.</span>';
      } else if (db.supabase) {
        statusText.innerHTML = '<span class="text-emerald-600 font-bold"><i class="fa-solid fa-circle-check"></i> Terhubung Aktif ke Supabase Cloud Database (PostgreSQL).</span>';
      } else {
        statusText.innerHTML = '<span class="text-slate-500 font-bold"><i class="fa-solid fa-circle-info"></i> Mode Database Relasional Lokal (Offline-First).</span>';
      }
    }
    modal.classList.remove('hidden');
  }

  closeSupabaseStatusModal() {
    const modal = document.getElementById('supabase-status-modal');
    if (modal) modal.classList.add('hidden');
  }

  async testSupabaseConnection() {
    this.showToast('Menguji koneksi ke Supabase Cloud...', 'info');
    if (!window.EduDB) return;
    try {
      const success = await window.EduDB.syncFromSupabase();
      if (success) {
        this.showToast('Koneksi Supabase Sukses! Sinkronisasi tabel aktif.', 'success');
      } else {
        const last = window.EduDB.supabaseLastStatus;
        if (last && last.isRLS) {
          this.showToast('Koneksi terhubung! Silakan aktifkan RLS Policy via SQL Editor di Supabase.', 'warning');
        } else {
          this.showToast('Supabase terhubung. Mode sinkronisasi aktif.', 'info');
        }
      }
      this.showSupabaseStatusModal();
    } catch (e) {
      this.showToast('Pengujian koneksi: ' + e.message, 'warning');
    }
  }

  async copySupabaseSqlScript() {
    const sql = `-- SKRIP INISIALISASI SUPABASE POSTGRESQL EDUEXAM SMAN 4 SOPPENG v17.0
-- Buka Supabase Dashboard -> SQL Editor -> Tempel & Jalankan (Run)

ALTER TABLE IF EXISTS public.tb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_ai_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tb_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_users" ON public.tb_users;
CREATE POLICY "Akses Penuh EduExam tb_users" ON public.tb_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_subjects" ON public.tb_subjects;
CREATE POLICY "Akses Penuh EduExam tb_subjects" ON public.tb_subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_assessments" ON public.tb_assessments;
CREATE POLICY "Akses Penuh EduExam tb_assessments" ON public.tb_assessments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_questions" ON public.tb_questions;
CREATE POLICY "Akses Penuh EduExam tb_questions" ON public.tb_questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_exam_schedules" ON public.tb_exam_schedules;
CREATE POLICY "Akses Penuh EduExam tb_exam_schedules" ON public.tb_exam_schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_student_results" ON public.tb_student_results;
CREATE POLICY "Akses Penuh EduExam tb_student_results" ON public.tb_student_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_ai_reflections" ON public.tb_ai_reflections;
CREATE POLICY "Akses Penuh EduExam tb_ai_reflections" ON public.tb_ai_reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_archives" ON public.tb_archives;
CREATE POLICY "Akses Penuh EduExam tb_archives" ON public.tb_archives FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Default Admin sman4soppeng@gmail.com / 21405
INSERT INTO public.tb_users (user_id, username, email, password_hash, nama_lengkap, role, assigned_mapel_json, assigned_kelas_json)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'sman4soppeng@gmail.com', '21405', 'Administrator SMAN 4 Soppeng', 'admin', '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;`;

    try {
      await navigator.clipboard.writeText(sql);
      this.showToast('📋 Skrip SQL Supabase berhasil disalin ke clipboard! Silakan tempel di SQL Editor Supabase.', 'success');
    } catch (e) {
      this.showToast('Gagal menyalin otomatis. Silakan buka file supabase-schema.sql di direktori proyek.', 'warning');
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('eduexam_auth_session');
    this.showToast('Anda telah keluar dari aplikasi.', 'info');
    this.navigateTo('login');
  }

  // ==================== SISWA DASHBOARD VIEW (KONTROL JADWAL AKTIF ADMIN) ====================
  renderSiswaDashboard() {
    const container = document.getElementById('siswa-dashboard-view');
    if (!container || !this.currentUser) return;

    const student = this.currentUser;
    const period = window.EduDB.getActivePeriod();
    const allExams = window.EduDB.getExamSessions(period);

    // Filter ujian yang menargetkan kelas siswa ini (Bab 4.1 & Blueprint v8.0)
    const classExams = allExams.filter(exam => {
      const targets = [];
      if (Array.isArray(exam.target_kelas)) targets.push(...exam.target_kelas);
      else if (typeof exam.target_kelas === 'string') targets.push(exam.target_kelas);

      if (Array.isArray(exam.kelas_target)) targets.push(...exam.kelas_target);
      else if (typeof exam.kelas_target === 'string') targets.push(exam.kelas_target);

      if (targets.length === 0 || targets.includes('Semua Kelas')) return true;
      return targets.some(t => {
        const tStr = String(t).trim().toLowerCase();
        const sStr = String(student.kelas || '').trim().toLowerCase();
        return tStr === sStr || tStr === 'semua kelas' || (sStr && (tStr.includes(sStr) || sStr.includes(tStr)));
      });
    });

    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <!-- Student Header Card -->
        <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-md mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-600 text-teal-300 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-2">
              <i class="fa-solid fa-user-graduate"></i> Ruang Asesmen Siswa (Mobile-Friendly)
            </div>
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight">${student.nama_lengkap}</h1>
            <p class="text-teal-100 text-xs sm:text-sm mt-1">
              NIS: <strong>${student.nis || student.username}</strong> &bull; Kelas: <strong>${student.kelas}</strong> &bull; SMAN 4 Soppeng
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white/10 text-teal-200 border border-white/20">
                <i class="fa-solid fa-qrcode"></i> Token: ${student.qr_auth_token || 'EDU4-AUTO'}
              </span>
              <button onclick="window.AdminModule.printSingleCard('${student.user_id}')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 transition shadow-xs">
                <i class="fa-solid fa-id-card"></i> Unduh Kartu Ujian Saya
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur p-3.5 rounded-2xl border border-white/20 text-xs">
            <i class="fa-solid fa-shield-halved text-teal-300 text-2xl"></i>
            <div>
              <div class="font-bold">Keamanan Browser Aktif</div>
              <div class="text-[11px] text-teal-100">Anti-Pindah Tab & Auto-Save</div>
            </div>
          </div>
        </div>

        <!-- Available Exams Section -->
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-calendar-check text-teal-600"></i> Daftar Ujian &amp; Asesmen Tersedia
              </h2>
              <p class="text-xs text-slate-500">
                Formatif: Diaktifkan mandiri oleh Guru di kelas &bull; Sumatif: Dibuka terjadwal oleh Admin sekolah.
              </p>
            </div>
            <span class="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 font-semibold border border-blue-200 w-max">
              Rombel: <strong>${student.kelas}</strong>
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${classExams.length === 0 ? `
              <div class="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                Belum ada jadwal ujian untuk kelas Anda pada periode ini.
              </div>
            ` : classExams.map(exam => {
              const res = window.EduDB.getStudentResults({ user_id: student.user_id, session_id: exam.session_id })[0];
              const isSubmitted = !!res;
              const isFormatif = (exam.kategori_penilaian === 'formatif');
              const isExamActive = isFormatif ? !!exam.is_active_by_teacher : !!exam.is_active_by_admin;
              const draftKey = `eduexam_draft_${exam.session_id}_${student.user_id}`;
              const hasDraft = !!localStorage.getItem(draftKey);

              return `
                <div class="bg-white rounded-3xl shadow-sm border-2 ${isExamActive ? 'border-teal-400 shadow-md' : 'border-slate-200 opacity-90'} p-6 flex flex-col justify-between hover:shadow-lg transition">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                          ${exam.mata_pelajaran}
                        </span>
                        ${isFormatif ? `
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-300">
                            <i class="fa-solid fa-shapes mr-1"></i>FORMATIF: ${exam.jenis_formatif || 'Kuis Harian'}${exam.materi_bab_text ? ' • ' + exam.materi_bab_text : ''}
                          </span>
                        ` : `
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300">
                            <i class="fa-solid fa-award mr-1"></i>SUMATIF: ${exam.periode_sumatif || 'PTS'}
                          </span>
                        `}
                      </div>
                      <span class="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <i class="fa-regular fa-clock"></i> ${exam.durasi_menit} Menit
                      </span>
                    </div>

                    <h3 class="text-base font-bold text-slate-900 leading-snug">
                      ${exam.nama_ujian}
                    </h3>

                    <p class="text-xs text-slate-500 leading-relaxed">
                      ${exam.petunjuk || 'Kerjakan seluruh butir soal 5 variasi tipe secara cermat dan jujur.'}
                    </p>

                    <!-- Status Kontrol Dual-Mode Badge (v14.0) -->
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span class="text-slate-400 text-[11px]">Guru: <strong>${exam.guru_pengampu}</strong></span>
                      ${isFormatif ? `
                        ${isExamActive ? `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                            <span class="w-2 h-2 rounded-full bg-teal-500 heartbeat-active"></span> FORMATIF AKTIF (Dibuka Guru)
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-300">
                            <i class="fa-solid fa-lock text-[9px]"></i> MENUNGGU AKTIVASI GURU
                          </span>
                        `}
                      ` : `
                        ${isExamActive ? `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 heartbeat-active"></span> SUMATIF AKTIF (Dibuka Admin)
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-300">
                            <i class="fa-solid fa-lock text-[9px]"></i> TERKUNCI JADWAL ADMIN
                          </span>
                        `}
                      `}
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="pt-5 mt-4 border-t border-slate-100">
                    ${isSubmitted ? `
                      <div class="flex items-center justify-between">
                        <div>
                          <span class="text-[11px] text-slate-400 block">Status: Telah Selesai</span>
                          <span class="text-sm font-black ${res.skor_total >= 75 ? 'text-teal-700' : 'text-red-600'}">
                            Nilai: ${res.skor_total} / 100 (${res.status_ketuntasan})
                          </span>
                        </div>
                        <button onclick="window.App.viewSubmittedResult('${res.result_id}')" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition">
                          Lihat Ulasan
                        </button>
                      </div>
                    ` : isExamActive ? `
                      <button onclick="window.App.launchExamSession('${exam.session_id}')" class="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-play"></i> ${hasDraft ? 'Lanjutkan Pengerjaan Ujian' : 'Mulai Masuk Ruang Ujian'}
                      </button>
                    ` : `
                      <button disabled class="w-full py-3.5 rounded-xl bg-slate-100 text-slate-400 text-xs sm:text-sm font-bold border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2">
                        <i class="fa-solid fa-lock"></i> ${isFormatif ? 'Ujian Terkunci (Menunggu Aktivasi Guru)' : 'Ujian Terkunci (Menunggu Jadwal Admin)'}
                      </button>
                      <p class="text-[10px] text-slate-400 text-center mt-1.5">
                        ${isFormatif ? 'Guru pengampu belum membuka akses ujian formatif ini di kelas.' : 'Admin sekolah belum membuka sesi ini. Harap menunggu instruksi pengawas.'}
                      </p>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  launchExamSession(sessionId) {
    const sessionObj = window.EduDB.getExamSessionById(sessionId);
    if (!sessionObj) {
      this.showToast('Sesi ujian tidak ditemukan!', 'error');
      return;
    }

    const isFormatif = (sessionObj.kategori_penilaian === 'formatif');
    const isAccessible = isFormatif ? !!sessionObj.is_active_by_teacher : !!sessionObj.is_active_by_admin;

    if (!isAccessible) {
      if (isFormatif) {
        alert('Akses Ditolak: Sesi Ujian Formatif ini belum diaktifkan oleh Guru pengampu di kelas. Harap tunggu instruksi guru!');
      } else {
        alert('Akses Ditolak: Sesi Ujian Sumatif ini sedang TERKUNCI oleh Admin. Harap tunggu hingga Admin mengaktifkan jadwal sesi ini!');
      }
      return;
    }

    this.showToast(`Memasuki Ruang Ujian: ${sessionObj.nama_ujian}`, 'info');
    this.navigateTo('exam-room');
    window.ExamEngine.startExam(sessionObj, this.currentUser);
  }

  viewSubmittedResult(resultId) {
    const res = window.EduDB.getStudentResults().find(r => r.result_id === resultId);
    if (!res) return;
    const sessionObj = window.EduDB.getExamSessionById(res.session_id) || { nama_ujian: 'Asesmen Sumatif Fisika', kkm: 75 };
    window.ExamEngine.activeExam = sessionObj;
    window.ExamEngine.latestResult = res;
    this.navigateTo('exam-room');
    window.ExamEngine.renderExamCompletionResult();
  }

  // --- TOAST NOTIFICATION UTILITY ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-box');
    if (!container) return;

    let bg = 'bg-blue-900 text-white';
    let icon = 'fa-solid fa-circle-info';

    if (type === 'success') {
      bg = 'bg-teal-800 text-white';
      icon = 'fa-solid fa-circle-check text-teal-300';
    } else if (type === 'warning') {
      bg = 'bg-amber-800 text-white';
      icon = 'fa-solid fa-triangle-exclamation text-amber-300';
    } else if (type === 'error') {
      bg = 'bg-red-800 text-white';
      icon = 'fa-solid fa-circle-xmark text-red-300';
    }

    const toastEl = document.createElement('div');
    toastEl.className = `p-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-medium transition-all transform duration-300 ${bg}`;
    toastEl.innerHTML = `
      <i class="${icon} text-lg shrink-0"></i>
      <span class="flex-1 leading-snug">${message}</span>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toastEl.remove(), 350);
    }, 3800);
  }
}

// Global Singleton Instance & DOM Bootstrapper
window.App = new EduExamApp();

// Global Helper untuk Role Switcher Instan
window.setActiveRole = function(role) {
  if (window.App && typeof window.App.setActiveRole === 'function') {
    window.App.setActiveRole(role);
  }
};

// Global Lightbox Image Zoom Helper
window.openImageZoomModal = (imgUrl) => {
  const modal = document.getElementById('image-zoom-modal');
  const target = document.getElementById('image-zoom-target');
  if (modal && target) {
    target.src = imgUrl;
    modal.classList.remove('hidden');
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('image-zoom-modal')?.classList.add('hidden');
  }
});

// Bootstrapper yang aman terhadap semua status kesiapan DOM
function bootEduExamApp() {
  if (window.App && !window.App._isBooted) {
    window.App._isBooted = true;
    try {
      window.App.init();
    } catch (e) {
      console.warn('Boot warning:', e);
      try {
        window.App.renderLoginView();
      } catch (err) {}
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootEduExamApp);
} else {
  bootEduExamApp();
}
window.addEventListener('load', bootEduExamApp);
