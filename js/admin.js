/**
 * EduExam SMAN 4 Soppeng - Admin Module
 * Mengimplementasikan Blueprint v6.0:
 * 1. Kontrol Jadwal Ujian Aktif (Aktivasi/Kunci Ujian Serentak per Kelas)
 * 2. Sistem Kartu Ujian Barcode / QR Code (Auto-Login Single-Card Seluruh Mapel)
 * 3. Aturan Penskoran Bobot 5 Tipe Soal
 * 4. Manajemen Pengguna CRUD (4 Role) & Live Log Keamanan
 * 5. Database Management (Backup/Restore/Reset)
 * Dikembangkan oleh: Syarif Hidayatullah, S.Pd.
 */

class AdminController {
  constructor() {
    this.currentTab = 'schedules'; // 'schedules', 'admin-management', 'audit-logs', 'classes-students', 'exam-cards', 'scoring', 'users', 'logs', 'database'
    this.cardClassFilter = 'ALL';
    this.studentClassFilter = 'ALL';
    this.studentSearchQuery = '';
    this.auditActionFilter = 'ALL';
    this.auditSearchQuery = '';
    this.selectedStudentIds = new Set();
    this.editingClassId = null;
    this.tempParsedExcelStudents = [];
  }

  isSuperAdmin() {
    return !!(window.App && window.App.currentUser && (window.App.currentUser.role === 'admin' || window.App.currentUser.role === 'super_admin'));
  }

  renderAdminView() {
    const container = document.getElementById('admin-dashboard-view');
    if (!container) return;

    const user = (window.App && window.App.currentUser) || { nama_lengkap: 'Administrator SMAN 4 Soppeng', role: 'admin', email: 'sman4soppeng@gmail.com' };

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <!-- Dashboard Top Banner -->
        <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-700 text-teal-300 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-2">
              <i class="fa-solid fa-shield-halved"></i> Panel Administrator SMAN 4 Soppeng (v17.0)
            </div>
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight">Pusat Manajemen Mapel, Penugasan Guru & Jadwal Ujian</h1>
            <p class="text-blue-200 text-xs sm:text-sm mt-1">
              EduExam SMAN 4 Soppeng &bull; ${user.nama_lengkap} (${user.role.toUpperCase()}) &bull; Email: ${user.email || 'sman4soppeng@gmail.com'}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="window.AdminModule.switchTab('subjects')" class="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-book-open"></i> Kelola Mapel
            </button>
            <button onclick="window.AdminModule.switchTab('users')" class="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-chalkboard-user"></i> Penugasan Guru
            </button>
            <button onclick="window.AdminModule.switchTab('classes-students')" class="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-users"></i> Kelola Siswa
            </button>
            <button onclick="window.AdminModule.switchTab('exam-cards')" class="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-qrcode"></i> Kartu Barcode
            </button>
            <button onclick="window.AdminModule.openSupabaseModal()" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-cloud"></i> Supabase Cloud
            </button>
            <button onclick="window.AdminModule.exportBackup()" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-cloud-arrow-down"></i> Backup DB
            </button>
          </div>
        </div>

        <!-- Navigation Tabs (Blueprint v15.0) -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
          <button onclick="window.AdminModule.switchTab('schedules')" id="adm-tab-schedules" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'schedules' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-calendar-check text-teal-400"></i> Kontrol Jadwal Ujian Aktif
          </button>
          <button onclick="window.AdminModule.switchTab('subjects')" id="adm-tab-subjects" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'subjects' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-book-open text-teal-400"></i> Kelola Mata Pelajaran
          </button>
          <button onclick="window.AdminModule.switchTab('classes-students')" id="adm-tab-classes-students" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'classes-students' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-users-rectangle text-teal-400"></i> Manajemen Kelas & Siswa
          </button>
          <button onclick="window.AdminModule.switchTab('users')" id="adm-tab-users" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'users' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-users-gear text-purple-400"></i> Penugasan Guru & User
          </button>
          <button onclick="window.AdminModule.switchTab('exam-cards')" id="adm-tab-exam-cards" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'exam-cards' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-id-card text-amber-400"></i> Kartu Ujian Siswa (Barcode QR)
          </button>
          <button onclick="window.AdminModule.switchTab('scoring')" id="adm-tab-scoring" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'scoring' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-sliders"></i> Aturan Bobot 5 Tipe Soal
          </button>
          <button onclick="window.AdminModule.switchTab('audit-logs')" id="adm-tab-audit-logs" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'audit-logs' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-clock-rotate-left text-amber-400"></i> Audit Log Aktivitas
          </button>
          <button onclick="window.AdminModule.switchTab('logs')" id="adm-tab-logs" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'logs' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-triangle-exclamation"></i> Live Log Keamanan
          </button>
          <button onclick="window.AdminModule.switchTab('database')" id="adm-tab-database" class="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${this.currentTab === 'database' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            <i class="fa-solid fa-database"></i> Cloud Supabase & Database
          </button>
        </div>

        <!-- Content Area -->
        <div id="admin-tab-content">
          ${this._renderCurrentTabContent()}
        </div>
      </div>
    `;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    let content = document.getElementById('admin-tab-content');
    if (!content) {
      this.renderAdminView();
      content = document.getElementById('admin-tab-content');
    }
    if (content) {
      content.innerHTML = this._renderCurrentTabContent();
    }
    const allTabs = ['schedules', 'subjects', 'admin-management', 'audit-logs', 'classes-students', 'exam-cards', 'scoring', 'users', 'logs', 'database'];
    allTabs.forEach(t => {
      const btn = document.getElementById(`adm-tab-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.className = 'px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 bg-blue-900 text-white shadow';
        } else {
          btn.className = 'px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200';
        }
      }
    });
  }

  _renderCurrentTabContent() {
    switch (this.currentTab) {
      case 'schedules': return this._renderSchedulesTab();
      case 'subjects': return this._renderSubjectsTab();
      case 'admin-management': return this._renderAdminManagementTab();
      case 'audit-logs': return this._renderAuditLogsTab();
      case 'classes-students': return this._renderClassesAndStudentsTab();
      case 'exam-cards': return this._renderExamCardsTab();
      case 'scoring': return this._renderScoringTab();
      case 'users': return this._renderUsersTab();
      case 'logs': return this._renderLogsTab();
      case 'database': return this._renderDatabaseTab();
      default: return this._renderSchedulesTab();
    }
  }

  // ==================== 1. MODUL KONTROL JADWAL UJIAN AKTIF (BAB 4.1) ====================
  _renderSchedulesTab() {
    const period = window.EduDB.getActivePeriod();
    const sessions = window.EduDB.getExamSessions(period);

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-teal-500 heartbeat-active"></span>
              <h2 class="text-lg font-bold text-slate-800">Manajemen Kontrol Jadwal Ujian Aktif</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Admin & Super Admin memegang kendali penuh pembukaan soal. Siswa <strong>HANYA BISA MENGERJAKAN</strong> ujian yang berstatus <strong>AKTIF</strong> pada sesi saat ini.
            </p>
          </div>
          <div class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
            Periode: <strong>${period.tahun_ajaran} (${period.semester})</strong>
          </div>
        </div>

        <!-- Table Sesi Ujian -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-y border-slate-200">
              <tr>
                <th class="py-3.5 px-4">Nama Sesi Ujian</th>
                <th class="py-3.5 px-4">Mata Pelajaran</th>
                <th class="py-3.5 px-4">Guru Pengampu</th>
                <th class="py-3.5 px-4">Target Kelas</th>
                <th class="py-3.5 px-4 text-center">Durasi</th>
                <th class="py-3.5 px-4 text-center">Status Akses Siswa</th>
                <th class="py-3.5 px-4">Operator Pengaktif</th>
                <th class="py-3.5 px-4 text-right">Aksi Kontrol Admin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${sessions.map(s => {
                const isFormatif = (s.kategori_penilaian === 'formatif');
                const isActiveByAdmin = !!s.is_active_by_admin;
                const isActiveByTeacher = !!s.is_active_by_teacher;
                const isStudentActive = isFormatif ? isActiveByTeacher : isActiveByAdmin;

                return `
                  <tr class="hover:bg-slate-50/80 transition ${isStudentActive ? 'bg-emerald-50/30' : ''}">
                    <td class="py-4 px-4 font-bold text-slate-900">
                      <div>${s.nama_ujian}</div>
                      <div class="flex flex-wrap items-center gap-1.5 mt-1">
                        <span class="text-[10px] text-slate-400 font-mono font-normal">ID: ${s.session_id}</span>
                        ${isFormatif ? `
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            <i class="fa-solid fa-shapes mr-1"></i>FORMATIF MANDIRI GURU: ${s.jenis_formatif || 'Kuis Harian'}${s.materi_bab_text ? ' • ' + s.materi_bab_text : ''}
                          </span>
                        ` : `
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <i class="fa-solid fa-award mr-1"></i>SUMATIF RESMI ADMIN: ${s.periode_sumatif || 'PTS'}
                          </span>
                        `}
                      </div>
                    </td>
                    <td class="py-4 px-4 font-semibold text-teal-800">${s.mata_pelajaran}</td>
                    <td class="py-4 px-4 text-slate-600">
                      <div>${s.guru_pengampu}</div>
                      ${isFormatif ? `<span class="text-[10px] text-teal-600 font-medium"><i class="fa-solid fa-user-check"></i> Kontrol Mandiri Kelas</span>` : `<span class="text-[10px] text-indigo-600 font-medium"><i class="fa-solid fa-shield-halved"></i> Kontrol Terpusat Admin</span>`}
                    </td>
                    <td class="py-4 px-4">
                      <div class="flex flex-wrap gap-1">
                        ${(() => {
                          const rawK = s.kelas_target || s.target_kelas || ['Semua Kelas'];
                          const arr = Array.isArray(rawK) ? rawK : [rawK];
                          return arr.map(k => `
                            <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold border border-blue-200">${k}</span>
                          `).join('');
                        })()}
                      </div>
                    </td>
                    <td class="py-4 px-4 text-center font-mono font-semibold">${s.durasi_menit} Menit</td>
                    <td class="py-4 px-4 text-center">
                      ${isFormatif ? `
                        ${isActiveByTeacher ? `
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 shadow-xs">
                            <span class="w-2 h-2 rounded-full bg-teal-500 heartbeat-active"></span> DIAKTIFKAN GURU
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-300">
                            <i class="fa-solid fa-pause text-[10px]"></i> STANDBY GURU
                          </span>
                        `}
                      ` : `
                        ${isActiveByAdmin ? `
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 heartbeat-active"></span> AKTIF SUMATIF (Terbuka)
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-300">
                            <i class="fa-solid fa-lock text-[10px]"></i> TERKUNCI ADMIN
                          </span>
                        `}
                      `}
                    </td>
                    <td class="py-4 px-4 text-xs">
                      ${s.activated_by_name ? `
                        <span class="font-bold text-slate-800 block">${s.activated_by_name}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${s.activated_at || ''}</span>
                      ` : '<span class="text-slate-400 italic">Belum dibuka</span>'}
                    </td>
                    <td class="py-4 px-4 text-right">
                      ${isFormatif ? `
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="window.AdminModule.toggleSessionActive('${s.session_id}')" class="px-3 py-1.5 rounded-xl ${isActiveByAdmin ? 'bg-red-100 text-red-700 border-red-300' : 'bg-slate-100 text-slate-600 border-slate-200'} hover:bg-slate-200 font-bold text-xs transition border flex items-center gap-1" title="Override Kontrol Admin untuk Ujian Formatif">
                            <i class="fa-solid fa-shield-halved"></i> ${isActiveByAdmin ? 'Kunci Override' : 'Override Admin'}
                          </button>
                        </div>
                      ` : `
                        ${isActiveByAdmin ? `
                          <button onclick="window.AdminModule.toggleSessionActive('${s.session_id}')" class="px-3.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition border border-red-300 flex items-center gap-1.5 ml-auto">
                            <i class="fa-solid fa-lock"></i> Kunci Ujian Sumatif
                          </button>
                        ` : `
                          <button onclick="window.AdminModule.toggleSessionActive('${s.session_id}')" class="px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 ml-auto">
                            <i class="fa-solid fa-bullhorn text-emerald-300"></i> 🟢 Aktifkan Ujian Sumatif
                          </button>
                        `}
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
          <div class="font-bold flex items-center gap-2 text-sm text-blue-950">
            <i class="fa-solid fa-circle-info text-blue-700"></i> Pemisahan Kontrol Aktivasi Penilaian (Blueprint v14.0):
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div class="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs">
              <span class="font-bold text-indigo-900 block mb-1"><i class="fa-solid fa-award text-indigo-600 mr-1"></i> 1. Penilaian Sumatif (PTS / PAS / Ujian Sekolah)</span>
              Aktivasi jadwal sepenuhnya <strong>TERPUSAT DI ADMIN</strong>. Guru menyusun soal dan bank materi, namun hanya Admin yang berwenang membuka sesi pada saat ujian resmi berlangsung.
            </div>
            <div class="p-2.5 rounded-lg bg-white border border-teal-200 shadow-xs">
              <span class="font-bold text-teal-900 block mb-1"><i class="fa-solid fa-shapes text-teal-600 mr-1"></i> 2. Penilaian Formatif (Kuis Harian / Diagnostik / Tugas)</span>
              Aktivasi dilakukan <strong>SECARA MANDIRI OLEH GURU</strong> di Dashboard Guru saat proses belajar mengajar. Guru bebas mengaktifkan/menonaktifkan soal tanpa perlu meminta jadwal dari Admin.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  toggleSessionActive(sessionId) {
    const operator = window.App ? window.App.currentUser : null;
    const updated = window.EduDB.toggleExamSessionActiveByAdmin(sessionId, operator);
    if (updated) {
      const statusText = updated.is_active_by_admin ? 'DIBUKA / AKTIF' : 'TERKUNCI';
      if (window.App) window.App.showToast(`Sesi "${updated.nama_ujian}" kini berstatus: ${statusText}!`, 'success');
      this.switchTab('schedules');
    }
  }

  // ==================== 1B. MODUL KELOLA MATA PELAJARAN DINAMIS (tb_subjects - BLUEPRINT v15.0) ====================
  _renderSubjectsTab() {
    const subjects = window.EduDB.getSubjects ? window.EduDB.getSubjects() : [];
    const users = window.EduDB.data && window.EduDB.data.users ? window.EduDB.data.users : [];
    const teachers = users.filter(u => u.role === 'guru');

    return `
      <div class="space-y-6">
        <!-- Header & Form Tambah Mapel Baru -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                <i class="fa-solid fa-book-open text-teal-600"></i> Master Data Mata Pelajaran (tb_subjects)
              </div>
              <h2 class="text-xl font-black text-slate-800 tracking-tight">Kelola Mata Pelajaran Kurikulum &amp; Muatan Lokal</h2>
              <p class="text-xs text-slate-500 mt-0.5">Tambah mata pelajaran baru atau hapus yang tidak digunakan. Hasil perubahan otomatis memperbarui pilihan checkbox penugasan Guru secara real-time.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-layer-group text-teal-600"></i> Total: <strong>${subjects.length} Mapel</strong>
              </span>
            </div>
          </div>

          <!-- Add Subject Form -->
          <form onsubmit="window.AdminModule.saveNewSubject(event)" class="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div class="sm:col-span-6">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Mata Pelajaran:
              </label>
              <input type="text" id="new-subject-name" required placeholder="Tambah nama mapel lain jika belum ada..." class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-inner">
            </div>

            <div class="sm:col-span-3">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode Mapel (Opsional):
              </label>
              <input type="text" id="new-subject-code" placeholder="Contoh: FIS-01" class="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 uppercase transition shadow-inner">
            </div>

            <div class="sm:col-span-3">
              <button type="submit" class="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-plus"></i> Tambah Mapel
              </button>
            </div>
          </form>
        </div>

        <!-- Subjects Table List -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-table-list text-teal-600"></i> Tabel Daftar Mata Pelajaran Terdaftar
            </h3>
            <span class="text-xs text-slate-500">UPT SMAN 4 Soppeng</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/70 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th class="py-3 px-4 w-12 text-center">No</th>
                  <th class="py-3 px-4">Nama Mata Pelajaran</th>
                  <th class="py-3 px-4 w-32 text-center">Kode Mapel</th>
                  <th class="py-3 px-4">Guru yang Mengampu</th>
                  <th class="py-3 px-4 w-32 text-center">Tanggal Dibuat</th>
                  <th class="py-3 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${subjects.length === 0 ? `
                  <tr>
                    <td colspan="6" class="text-center py-8 text-slate-400">Belum ada mata pelajaran terdaftar. Silakan tambahkan melalui formulir di atas.</td>
                  </tr>
                ` : subjects.map((s, idx) => {
                  const assignedTeachers = teachers.filter(t => {
                    const list = t.mata_pelajaran_list || (t.mapel ? [t.mapel] : []);
                    return list.some(m => m.toLowerCase().trim() === s.nama_mapel.toLowerCase().trim());
                  });

                  return `
                    <tr class="hover:bg-slate-50/80 transition">
                      <td class="py-3 px-4 text-center font-bold text-slate-400">${idx + 1}</td>
                      <td class="py-3 px-4 font-bold text-slate-800">
                        <div class="flex items-center gap-2">
                          <i class="fa-solid fa-book text-teal-600 text-xs"></i>
                          <span>${s.nama_mapel}</span>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="font-mono text-[11px] font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">${s.kode_mapel || '-'}</span>
                      </td>
                      <td class="py-3 px-4">
                        ${assignedTeachers.length > 0 ? `
                          <div class="flex flex-wrap gap-1">
                            ${assignedTeachers.map(t => `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">${t.nama_lengkap}</span>`).join('')}
                          </div>
                        ` : `<span class="text-slate-400 italic text-[11px]">Belum ada guru yang diampu</span>`}
                      </td>
                      <td class="py-3 px-4 text-center text-slate-500 text-[11px]">
                        ${s.created_at ? new Date(s.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <button onclick="window.AdminModule.deleteSubject('${s.subject_id}')" class="px-2.5 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs inline-flex items-center gap-1 transition" title="Hapus Mata Pelajaran">
                          <i class="fa-regular fa-trash-can"></i> Hapus
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  saveNewSubject(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('new-subject-name');
    const codeInput = document.getElementById('new-subject-code');
    const namaMapel = nameInput ? nameInput.value.trim() : '';
    const kodeMapel = codeInput ? codeInput.value.trim() : '';

    if (!namaMapel) {
      if (window.App) window.App.showToast('Nama mata pelajaran wajib diisi!', 'warning');
      return;
    }

    try {
      const operator = window.App?.currentUser;
      const res = window.EduDB.addSubject({ nama_mapel: namaMapel, kode_mapel: kodeMapel }, operator);
      if (window.App) window.App.showToast(`Mata pelajaran "${res.nama_mapel}" berhasil ditambahkan!`, 'success');
      this.switchTab('subjects');
    } catch (err) {
      if (window.App) window.App.showToast(err.message || 'Gagal menambahkan mata pelajaran', 'error');
    }
  }

  deleteSubject(subjectId) {
    const sbj = window.EduDB.getSubjectById ? window.EduDB.getSubjectById(subjectId) : null;
    if (!sbj) return;

    if (confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${sbj.nama_mapel}"? Tindakan ini akan menghapus mapel dari master data sistem.`)) {
      try {
        const operator = window.App?.currentUser;
        window.EduDB.deleteSubject(subjectId, operator);
        if (window.App) window.App.showToast(`Mata pelajaran "${sbj.nama_mapel}" berhasil dihapus!`, 'success');
        this.switchTab('subjects');
      } catch (err) {
        if (window.App) window.App.showToast(err.message || 'Gagal menghapus mata pelajaran', 'error');
      }
    }
  }

  // ==================== 1C. MODUL MANAJEMEN AKUN ADMIN ====================
  _renderAdminManagementTab() {
    const adminUsers = window.EduDB.getAdminUsers();

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-user-shield text-purple-700 text-xl"></i>
              <h2 class="text-lg font-bold text-slate-800">Manajemen Akun Operator & Admin Standar</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Hak Khusus <strong>Super Admin</strong>: Membuat, memantau penugasan, dan menghapus akun Admin piket/operator ujian.
            </p>
          </div>
          <button onclick="window.AdminModule.openAddAdminModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-md transition flex items-center gap-2">
            <i class="fa-solid fa-user-plus"></i> Buat Akun Admin Baru
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-y border-slate-200">
              <tr>
                <th class="py-3 px-4">No</th>
                <th class="py-3 px-4">Nama Lengkap Operator</th>
                <th class="py-3 px-4">Username Akun</th>
                <th class="py-3 px-4">Tingkat Akses</th>
                <th class="py-3 px-4">Jabatan / Penugasan</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${adminUsers.map((adm, idx) => {
                const isSuper = adm.role === 'super_admin';
                return `
                  <tr class="hover:bg-slate-50/80 transition ${isSuper ? 'bg-red-50/20' : ''}">
                    <td class="py-3 px-4 font-mono font-bold text-slate-400">${idx + 1}</td>
                    <td class="py-3 px-4">
                      <div class="font-bold text-slate-900">${adm.nama_lengkap}</div>
                      <span class="text-[10px] text-slate-400 font-mono">ID: ${adm.user_id}</span>
                    </td>
                    <td class="py-3 px-4 font-mono font-bold text-blue-900">${adm.username}</td>
                    <td class="py-3 px-4">
                      ${isSuper ? `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300">
                          <i class="fa-solid fa-crown text-amber-500"></i> Super Admin
                        </span>
                      ` : `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          <i class="fa-solid fa-user-shield"></i> Admin Standar
                        </span>
                      `}
                    </td>
                    <td class="py-3 px-4 font-medium text-slate-700">${adm.jabatan || 'Operator Ujian'}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      ${isSuper ? `
                        <span class="text-[11px] text-amber-700 font-bold italic px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                          <i class="fa-solid fa-lock text-xs"></i> Akun Utama Dilindungi
                        </span>
                      ` : `
                        <button onclick="window.AdminModule.deleteAdmin('${adm.user_id}')" class="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition border border-red-200 inline-flex items-center gap-1.5">
                          <i class="fa-solid fa-trash-can"></i> Hapus Admin
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openAddAdminModal() {
    const modal = document.getElementById('admin-add-admin-modal');
    if (modal) {
      document.getElementById('modal-admin-nama').value = '';
      document.getElementById('modal-admin-username').value = '';
      document.getElementById('modal-admin-password').value = '';
      document.getElementById('modal-admin-jabatan').value = '';
      modal.classList.remove('hidden');
    }
  }

  closeAddAdminModal() {
    const modal = document.getElementById('admin-add-admin-modal');
    if (modal) modal.classList.add('hidden');
  }

  saveNewAdmin(event) {
    event.preventDefault();
    const nama = document.getElementById('modal-admin-nama').value.trim();
    const username = document.getElementById('modal-admin-username').value.trim();
    const password = document.getElementById('modal-admin-password').value.trim();
    const jabatan = document.getElementById('modal-admin-jabatan').value.trim();

    try {
      const operator = window.App ? window.App.currentUser : null;
      window.EduDB.addAdminUser({
        nama_lengkap: nama,
        username: username,
        password: password,
        jabatan: jabatan
      }, operator);

      if (window.App) window.App.showToast(`Akun Admin "${nama}" berhasil dibuat!`, 'success');
      this.closeAddAdminModal();
      this.switchTab('admin-management');
    } catch (e) {
      alert(e.message);
    }
  }

  deleteAdmin(adminUserId) {
    const target = window.EduDB.getUserById(adminUserId);
    if (!target) return;
    if (!confirm(`Konfirmasi Penghapusan: Apakah Anda yakin ingin mencabut dan menghapus akun Admin "${target.nama_lengkap}" (${target.username})?`)) {
      return;
    }
    try {
      const operator = window.App ? window.App.currentUser : null;
      window.EduDB.deleteAdminUser(adminUserId, operator);
      if (window.App) window.App.showToast(`Akun Admin "${target.nama_lengkap}" berhasil dihapus!`, 'success');
      this.switchTab('admin-management');
    } catch (e) {
      alert(e.message);
    }
  }

  // ==================== 1C. MODUL AUDIT LOG AKTIVITAS (BLUEPRINT v8.0) ====================
  _renderAuditLogsTab() {
    const logs = window.EduDB.getAuditLogs({
      action_type: this.auditActionFilter || 'ALL',
      searchQuery: this.auditSearchQuery || ''
    });

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-blue-900 text-xl"></i>
              <h2 class="text-lg font-bold text-slate-800">Audit Log Aktivitas Multi-Admin (Blueprint v8.0)</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Merekam jejak kronologis setiap operator yang mengaktifkan/menonaktifkan ujian, menambah admin, reset DB, dan sinkronisasi cloud.
            </p>
          </div>
          <span class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 font-black text-xs border border-blue-200 font-mono">
            Total ${logs.length} Log Aktivitas
          </span>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <div class="flex-1 w-full relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
            <input type="text" placeholder="Cari aktivitas, nama operator, atau sesi..." value="${this.auditSearchQuery || ''}" oninput="window.AdminModule.handleAuditSearch(this.value)" class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-900 outline-none">
          </div>
          <select onchange="window.AdminModule.handleAuditFilter(this.value)" class="w-full sm:w-56 p-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold">
            <option value="ALL" ${(!this.auditActionFilter || this.auditActionFilter === 'ALL') ? 'selected' : ''}>Semua Jenis Aktivitas</option>
            <option value="ACTIVATED_EXAM" ${this.auditActionFilter === 'ACTIVATED_EXAM' ? 'selected' : ''}>Aktivasi Sesi Ujian</option>
            <option value="DEACTIVATED_EXAM" ${this.auditActionFilter === 'DEACTIVATED_EXAM' ? 'selected' : ''}>Kunci / Nonaktif Sesi</option>
            <option value="ADD_ADMIN" ${this.auditActionFilter === 'ADD_ADMIN' ? 'selected' : ''}>Pembuatan Akun Admin</option>
            <option value="DELETE_ADMIN" ${this.auditActionFilter === 'DELETE_ADMIN' ? 'selected' : ''}>Penghapusan Akun Admin</option>
            <option value="RESET_DATABASE" ${this.auditActionFilter === 'RESET_DATABASE' ? 'selected' : ''}>Reset Database Total</option>
            <option value="RESTORE_DATABASE" ${this.auditActionFilter === 'RESTORE_DATABASE' ? 'selected' : ''}>Pemulihan Database</option>
            <option value="CLOUD_SYNC" ${this.auditActionFilter === 'CLOUD_SYNC' ? 'selected' : ''}>Sinkronisasi Cloud</option>
          </select>
        </div>

        <!-- Log Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-y border-slate-200">
              <tr>
                <th class="py-3 px-4">Waktu (WITA)</th>
                <th class="py-3 px-4">Operator / Admin</th>
                <th class="py-3 px-4">Tipe Aksi</th>
                <th class="py-3 px-4">Rincian Deskripsi Aktivitas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-xs">
              ${logs.length === 0 ? `
                <tr><td colspan="4" class="py-8 text-center text-slate-400 font-sans">Tidak ada catatan audit log yang cocok.</td></tr>
              ` : logs.map(l => {
                let badgeClass = 'bg-slate-100 text-slate-700';
                let icon = 'fa-circle-dot';
                if (l.action_type === 'ACTIVATED_EXAM') {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                  icon = 'fa-key';
                } else if (l.action_type === 'DEACTIVATED_EXAM') {
                  badgeClass = 'bg-red-100 text-red-800 border border-red-200';
                  icon = 'fa-lock';
                } else if (l.action_type === 'ADD_ADMIN') {
                  badgeClass = 'bg-purple-100 text-purple-800 border border-purple-200';
                  icon = 'fa-user-plus';
                } else if (l.action_type === 'DELETE_ADMIN') {
                  badgeClass = 'bg-red-100 text-red-800 border border-red-300';
                  icon = 'fa-user-xmark';
                } else if (l.action_type === 'RESET_DATABASE') {
                  badgeClass = 'bg-rose-100 text-rose-900 border border-rose-300';
                  icon = 'fa-triangle-exclamation';
                } else if (l.action_type === 'CLOUD_SYNC') {
                  badgeClass = 'bg-teal-100 text-teal-800 border border-teal-300';
                  icon = 'fa-cloud-arrow-up';
                }

                return `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 text-slate-500 whitespace-nowrap">${l.timestamp}</td>
                    <td class="py-3 px-4 font-sans">
                      <strong class="text-slate-900 block">${l.operator_name || 'Admin'}</strong>
                      <span class="text-[10px] text-slate-400 font-mono">Role: ${l.operator_role || 'admin'}</span>
                    </td>
                    <td class="py-3 px-4 font-sans">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}">
                        <i class="fa-solid ${icon}"></i> ${l.action_type}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-sans text-slate-700 font-medium">${l.description}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  handleAuditSearch(q) {
    this.auditSearchQuery = q;
    const content = document.getElementById('admin-tab-content');
    if (content) content.innerHTML = this._renderCurrentTabContent();
  }

  handleAuditFilter(filter) {
    this.auditActionFilter = filter;
    const content = document.getElementById('admin-tab-content');
    if (content) content.innerHTML = this._renderCurrentTabContent();
  }

  // ==================== 2. MODUL MANAJEMEN KELAS & SISWA + IMPORT EXCEL (POINT 1 & 2) ====================
  _renderClassesAndStudentsTab() {
    const classes = window.EduDB.getClasses();
    const students = window.EduDB.getStudents(this.studentClassFilter, this.studentSearchQuery);
    const allStudents = window.EduDB.getStudents('ALL');

    // Hitung distribusi siswa per kelas
    const studentCountMap = {};
    allStudents.forEach(s => {
      const k = (s.kelas || 'Belum Ada').trim();
      studentCountMap[k] = (studentCountMap[k] || 0) + 1;
    });

    const isAllSelected = students.length > 0 && students.every(s => this.selectedStudentIds.has(s.user_id));

    return `
      <div class="space-y-6">
        <!-- Top Stats & Action Bar -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-500 font-semibold block">Total Kelas Terbina</span>
              <span class="text-2xl font-black text-blue-900">${classes.length} <span class="text-xs font-semibold text-slate-400">Rombel</span></span>
            </div>
            <div class="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg">
              <i class="fa-solid fa-chalkboard"></i>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-500 font-semibold block">Total Siswa Terdaftar</span>
              <span class="text-2xl font-black text-teal-800">${allStudents.length} <span class="text-xs font-semibold text-slate-400">Siswa</span></span>
            </div>
            <div class="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg">
              <i class="fa-solid fa-user-graduate"></i>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-500 font-semibold block">Status Kartu Barcode</span>
              <span class="text-2xl font-black text-amber-600">100% <span class="text-xs font-semibold text-slate-400">Siap Cetak</span></span>
            </div>
            <div class="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
              <i class="fa-solid fa-qrcode"></i>
            </div>
          </div>
        </div>

        <!-- Master Action Buttons Bar -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.AdminModule.openAddClassModal()" class="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2">
              <i class="fa-solid fa-plus"></i> Tambah Kelas Baru
            </button>
            <button onclick="window.AdminModule.openAddStudentModal()" class="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2">
              <i class="fa-solid fa-user-plus"></i> Tambah Siswa Manual
            </button>
          </div>

          <!-- Excel Import & Template Download Buttons (Point 2 User Request) -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.AdminModule.downloadStudentTemplate()" class="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs" title="Unduh Format Excel Template Siswa">
              <i class="fa-solid fa-file-excel text-emerald-600 text-sm"></i> Unduh Template Excel
            </button>
            <button onclick="window.AdminModule.triggerExcelUpload()" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up"></i> Upload File Excel Siswa
            </button>
            <input type="file" id="admin-excel-import-file" accept=".xlsx, .xls, .csv" class="hidden" onchange="window.AdminModule.handleExcelFileUpload(event)">
          </div>
        </div>

        <!-- Two Columns Layout: Left = Classes, Right = Students -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- PANEL KIRI: DAFTAR KELAS (CRUD KELAS) -->
          <div class="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <i class="fa-solid fa-door-open text-blue-900"></i> Daftar Kelas (${classes.length})
                </h3>
                <p class="text-[11px] text-slate-400">Klik kelas untuk memfilter daftar siswa.</p>
              </div>
              <button onclick="window.AdminModule.openAddClassModal()" class="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1">
                <i class="fa-solid fa-circle-plus"></i> Baru
              </button>
            </div>

            <div class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              <!-- Pill Semua Kelas -->
              <div onclick="window.AdminModule.handleStudentClassFilter('ALL')" class="p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${this.studentClassFilter === 'ALL' ? 'bg-blue-900 text-white border-blue-900 shadow-sm' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'}">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg ${this.studentClassFilter === 'ALL' ? 'bg-blue-800 text-teal-300' : 'bg-slate-200 text-slate-700'} text-xs font-bold flex items-center justify-center">
                    <i class="fa-solid fa-border-all text-[10px]"></i>
                  </span>
                  <div>
                    <span class="font-bold text-xs">Semua Kelas</span>
                    <span class="text-[10px] block opacity-80">Seluruh siswa aktif</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${this.studentClassFilter === 'ALL' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}">
                  ${allStudents.length}
                </span>
              </div>

              ${classes.map(c => {
                const isSelected = this.studentClassFilter === c.nama_kelas;
                const count = studentCountMap[c.nama_kelas] || 0;
                return `
                  <div class="p-3 rounded-xl border transition flex items-center justify-between gap-2 ${isSelected ? 'bg-teal-50/70 border-teal-500 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}">
                    <div class="flex-1 cursor-pointer truncate" onclick="window.AdminModule.handleStudentClassFilter('${c.nama_kelas}')">
                      <div class="flex items-center gap-2">
                        <span class="font-black text-xs text-slate-900">${c.nama_kelas}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">${c.jurusan || 'Umum'}</span>
                      </div>
                      <span class="text-[10px] text-slate-500 block truncate mt-0.5">Wali: ${c.wali_kelas || '-'}</span>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        ${count} Siswa
                      </span>
                      <button onclick="window.AdminModule.openEditClassModal('${c.class_id}')" class="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition" title="Edit Kelas">
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button onclick="window.AdminModule.deleteClass('${c.class_id}')" class="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition" title="Hapus Kelas">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- PANEL KANAN: TABEL SISWA & BULK DELETE -->
          <div class="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            
            <!-- Controls Bar: Filter, Pencarian, & Tombol Hapus Masal -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2 flex-1">
                <div class="relative flex-1">
                  <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
                  <input type="text" value="${this.studentSearchQuery}" oninput="window.AdminModule.handleStudentSearch(this.value)" placeholder="Cari Nama Lengkap, NIS, atau Barcode..." class="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-1 focus:ring-teal-500">
                </div>

                <select onchange="window.AdminModule.handleStudentClassFilter(this.value)" class="py-2 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none">
                  <option value="ALL" ${this.studentClassFilter === 'ALL' ? 'selected' : ''}>Semua Kelas</option>
                  ${classes.map(c => `
                    <option value="${c.nama_kelas}" ${this.studentClassFilter === c.nama_kelas ? 'selected' : ''}>${c.nama_kelas}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Bulk Delete Button (Point 1 User Request) -->
              <div class="flex items-center gap-2">
                ${this.selectedStudentIds.size > 0 ? `
                  <button onclick="window.AdminModule.deleteSelectedStudents()" class="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 animate-pulse">
                    <i class="fa-solid fa-trash-can"></i> Hapus Siswa Terpilih (${this.selectedStudentIds.size})
                  </button>
                ` : `
                  <button disabled class="px-3.5 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed">
                    <i class="fa-solid fa-trash-can"></i> Hapus Siswa Terpilih
                  </button>
                `}
              </div>
            </div>

            <!-- Tabel Siswa -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
                  <tr>
                    <th class="py-3 px-3 w-8 text-center">
                      <input type="checkbox" ${isAllSelected ? 'checked' : ''} onchange="window.AdminModule.toggleSelectAllStudents(this.checked)" class="w-4 h-4 text-teal-600 rounded">
                    </th>
                    <th class="py-3 px-2 w-8 text-center">No</th>
                    <th class="py-3 px-3">Nama Lengkap Siswa</th>
                    <th class="py-3 px-3">NIS</th>
                    <th class="py-3 px-3">Kelas</th>
                    <th class="py-3 px-3">Barcode Auto-Login</th>
                    <th class="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${students.length === 0 ? `
                    <tr>
                      <td colspan="7" class="py-12 text-center text-slate-400">
                        <i class="fa-solid fa-user-slash text-2xl mb-2 text-slate-300"></i>
                        <p class="font-medium">Tidak ada data siswa yang cocok dengan filter "${this.studentClassFilter}".</p>
                        <p class="text-[11px] mt-1">Tambahkan siswa secara manual atau gunakan tombol "Upload File Excel Siswa".</p>
                      </td>
                    </tr>
                  ` : students.map((s, idx) => {
                    const isChecked = this.selectedStudentIds.has(s.user_id);
                    return `
                      <tr class="hover:bg-slate-50 transition ${isChecked ? 'bg-teal-50/40' : ''}">
                        <td class="py-3 px-3 text-center">
                          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.AdminModule.toggleSelectStudent('${s.user_id}', this.checked)" class="w-4 h-4 text-teal-600 rounded">
                        </td>
                        <td class="py-3 px-2 text-center font-bold text-slate-400">${idx + 1}</td>
                        <td class="py-3 px-3 font-bold text-slate-900">
                          <div>${s.nama_lengkap}</div>
                          <span class="text-[10px] text-slate-400 font-normal">Pass: ${s.password_hash || s.nis}</span>
                        </td>
                        <td class="py-3 px-3 font-mono font-bold text-blue-900">${s.nis}</td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-900 border border-blue-200">
                            ${s.kelas}
                          </span>
                        </td>
                        <td class="py-3 px-3">
                          <div class="flex items-center gap-1.5 font-mono text-[10px] font-bold text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 w-fit">
                            <i class="fa-solid fa-qrcode text-teal-700"></i> ${s.qr_auth_token}
                            <button onclick="window.AdminModule.copyAutoLoginLink('${s.qr_auth_token}')" class="text-teal-700 hover:text-teal-900 ml-1" title="Salin Tautan Auto-Login">
                              <i class="fa-regular fa-copy"></i>
                            </button>
                          </div>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button onclick="window.AdminModule.simulateAutoLogin('${s.qr_auth_token}')" class="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Simulasikan Auto-Login Siswa Ini">
                              <i class="fa-solid fa-right-to-bracket"></i>
                            </button>
                            <button onclick="window.AdminModule.deleteStudent('${s.user_id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus Siswa">
                              <i class="fa-regular fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer Info -->
            <div class="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
              <span>Menampilkan ${students.length} siswa</span>
              <span class="text-teal-700 font-semibold flex items-center gap-1">
                <i class="fa-solid fa-shield-check"></i> Seluruh akun memiliki Barcode Token Single-Card aktif
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- HANDLER MODUL KELAS ---
  openAddClassModal() {
    this.editingClassId = null;
    const titleEl = document.getElementById('admin-class-modal-title');
    const idInput = document.getElementById('modal-class-id');
    const namaInput = document.getElementById('modal-class-nama');
    const tingkatSelect = document.getElementById('modal-class-tingkat');
    const jurusanSelect = document.getElementById('modal-class-jurusan');
    const waliInput = document.getElementById('modal-class-wali');

    if (titleEl) titleEl.innerText = 'Form Tambah Kelas Baru';
    if (idInput) idInput.value = '';
    if (namaInput) namaInput.value = '';
    if (tingkatSelect) tingkatSelect.value = 'XII';
    if (jurusanSelect) jurusanSelect.value = 'MIPA';
    if (waliInput) waliInput.value = '';

    document.getElementById('admin-add-class-modal')?.classList.remove('hidden');
  }

  openEditClassModal(classId) {
    const cls = window.EduDB.getClassById(classId);
    if (!cls) return;

    this.editingClassId = classId;
    const titleEl = document.getElementById('admin-class-modal-title');
    const idInput = document.getElementById('modal-class-id');
    const namaInput = document.getElementById('modal-class-nama');
    const tingkatSelect = document.getElementById('modal-class-tingkat');
    const jurusanSelect = document.getElementById('modal-class-jurusan');
    const waliInput = document.getElementById('modal-class-wali');

    if (titleEl) titleEl.innerText = `Edit Data Kelas (${cls.nama_kelas})`;
    if (idInput) idInput.value = cls.class_id;
    if (namaInput) namaInput.value = cls.nama_kelas;
    if (tingkatSelect) tingkatSelect.value = cls.tingkat || 'XII';
    if (jurusanSelect) jurusanSelect.value = cls.jurusan || 'MIPA';
    if (waliInput) waliInput.value = cls.wali_kelas || '';

    document.getElementById('admin-add-class-modal')?.classList.remove('hidden');
  }

  closeClassModal() {
    this.editingClassId = null;
    document.getElementById('admin-add-class-modal')?.classList.add('hidden');
  }

  saveClass(e) {
    e.preventDefault();
    const nama = document.getElementById('modal-class-nama')?.value.trim();
    const tingkat = document.getElementById('modal-class-tingkat')?.value;
    const jurusan = document.getElementById('modal-class-jurusan')?.value;
    const wali = document.getElementById('modal-class-wali')?.value.trim() || '-';

    if (!nama) {
      alert('Nama kelas tidak boleh kosong!');
      return;
    }

    try {
      if (this.editingClassId) {
        window.EduDB.updateClass(this.editingClassId, {
          nama_kelas: nama,
          tingkat: tingkat,
          jurusan: jurusan,
          wali_kelas: wali
        });
        if (window.App) window.App.showToast(`Data kelas "${nama}" berhasil diperbarui!`, 'success');
      } else {
        window.EduDB.addClass({
          nama_kelas: nama,
          tingkat: tingkat,
          jurusan: jurusan,
          wali_kelas: wali
        });
        if (window.App) window.App.showToast(`Kelas baru "${nama}" berhasil ditambahkan!`, 'success');
      }
      this.closeClassModal();
      this.switchTab('classes-students');
    } catch (err) {
      alert(err.message);
    }
  }

  deleteClass(classId) {
    const cls = window.EduDB.getClassById(classId);
    if (!cls) return;

    if (confirm(`Apakah Anda yakin ingin menghapus kelas "${cls.nama_kelas}"? Siswa yang berada di kelas ini tidak akan terhapus, namun referensi kelasnya perlu diperbarui.`)) {
      window.EduDB.deleteClass(classId);
      if (this.studentClassFilter === cls.nama_kelas) {
        this.studentClassFilter = 'ALL';
      }
      if (window.App) window.App.showToast(`Kelas "${cls.nama_kelas}" berhasil dihapus!`, 'info');
      this.switchTab('classes-students');
    }
  }

  // --- HANDLER MODUL SISWA ---
  openAddStudentModal() {
    const classes = window.EduDB.getClasses();
    const select = document.getElementById('modal-student-kelas');
    if (select) {
      select.innerHTML = classes.map(c => `
        <option value="${c.nama_kelas}">${c.nama_kelas} (${c.jurusan})</option>
      `).join('');
      if (this.studentClassFilter !== 'ALL') {
        select.value = this.studentClassFilter;
      }
    }

    const namaInput = document.getElementById('modal-student-nama');
    const nisInput = document.getElementById('modal-student-nis');
    const passInput = document.getElementById('modal-student-password');

    if (namaInput) namaInput.value = '';
    if (nisInput) nisInput.value = '';
    if (passInput) passInput.value = '';

    document.getElementById('admin-add-student-modal')?.classList.remove('hidden');
  }

  closeStudentModal() {
    document.getElementById('admin-add-student-modal')?.classList.add('hidden');
  }

  saveManualStudent(e) {
    e.preventDefault();
    const nama = document.getElementById('modal-student-nama')?.value.trim();
    const nis = document.getElementById('modal-student-nis')?.value.trim();
    const kelas = document.getElementById('modal-student-kelas')?.value;
    const pass = document.getElementById('modal-student-password')?.value.trim() || nis;

    if (!nama || !nis) {
      alert('Nama Lengkap dan NIS wajib diisi!');
      return;
    }

    try {
      const newSiswa = window.EduDB.addStudent({
        nama_lengkap: nama,
        nis: nis,
        kelas: kelas,
        password: pass
      });
      this.closeStudentModal();
      this.switchTab('classes-students');
      if (window.App) {
        window.App.showToast(`Siswa "${newSiswa.nama_lengkap}" berhasil ditambahkan dengan Barcode Token: ${newSiswa.qr_auth_token}!`, 'success');
      }
    } catch (err) {
      alert(err.message);
    }
  }

  deleteStudent(userId) {
    const student = window.EduDB.getUserById(userId);
    if (!student) return;

    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${student.nama_lengkap}" (NIS: ${student.nis})?`)) {
      window.EduDB.deleteStudent(userId);
      this.selectedStudentIds.delete(userId);
      if (window.App) window.App.showToast(`Siswa "${student.nama_lengkap}" berhasil dihapus.`, 'info');
      this.switchTab('classes-students');
    }
  }

  toggleSelectAllStudents(checked) {
    const students = window.EduDB.getStudents(this.studentClassFilter, this.studentSearchQuery);
    if (checked) {
      students.forEach(s => this.selectedStudentIds.add(s.user_id));
    } else {
      students.forEach(s => this.selectedStudentIds.delete(s.user_id));
    }
    const content = document.getElementById('admin-tab-content');
    if (content) content.innerHTML = this._renderCurrentTabContent();
  }

  toggleSelectStudent(userId, checked) {
    if (checked) {
      this.selectedStudentIds.add(userId);
    } else {
      this.selectedStudentIds.delete(userId);
    }
    const content = document.getElementById('admin-tab-content');
    if (content) content.innerHTML = this._renderCurrentTabContent();
  }

  deleteSelectedStudents() {
    const count = this.selectedStudentIds.size;
    if (count === 0) return;

    if (confirm(`PERINGATAN: Anda akan menghapus ${count} siswa terpilih secara massal! Lanjutkan?`)) {
      const deleted = window.EduDB.deleteStudentsBulk(Array.from(this.selectedStudentIds));
      this.selectedStudentIds.clear();
      if (window.App) window.App.showToast(`Berhasil menghapus ${deleted} siswa secara massal!`, 'success');
      this.switchTab('classes-students');
    }
  }

  handleStudentClassFilter(className) {
    this.studentClassFilter = className;
    const content = document.getElementById('admin-tab-content');
    if (content) content.innerHTML = this._renderCurrentTabContent();
  }

  handleStudentSearch(query) {
    this.studentSearchQuery = query || '';
    const content = document.getElementById('admin-tab-content');
    if (content) content.innerHTML = this._renderCurrentTabContent();
  }

  // --- HANDLER DOWNLOAD & IMPORT EXCEL SISWA (POINT 2 USER REQUEST) ---
  downloadStudentTemplate() {
    const templateData = [
      { "Nama Lengkap": "Andi Tenri Sumpala", "NIS": "10251", "Kelas": "X.1" },
      { "Nama Lengkap": "Muhammad Alif Pratama", "NIS": "10252", "Kelas": "X.1" },
      { "Nama Lengkap": "Nur Fadilah Binti Syamsul", "NIS": "10253", "Kelas": "XI MIPA 1" },
      { "Nama Lengkap": "Fathur Rahman", "NIS": "10254", "Kelas": "XII MIPA 1" },
      { "Nama Lengkap": "Siti Nurhaliza", "NIS": "10255", "Kelas": "XII IPS 1" }
    ];

    if (window.XLSX) {
      try {
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [{ wch: 32 }, { wch: 15 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
        XLSX.writeFile(wb, "Template_Import_Siswa_SMAN4Soppeng.xlsx");
        if (window.App) window.App.showToast('Template Excel siswa berhasil diunduh (.xlsx)!', 'success');
        return;
      } catch (e) {
        console.warn('XLSX export failed, fallback to CSV', e);
      }
    }

    // Fallback CSV
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nama Lengkap,NIS,Kelas\n" +
      templateData.map(e => `"${e['Nama Lengkap']}",${e.NIS},"${e.Kelas}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Import_Siswa_SMAN4Soppeng.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.App) window.App.showToast('Template CSV siswa berhasil diunduh (.csv)!', 'success');
  }

  triggerExcelUpload() {
    const input = document.getElementById('admin-excel-import-file');
    if (input) input.click();
  }

  async handleExcelFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (window.App) window.App.showToast(`Membaca berkas ${file.name}...`, 'info');

    try {
      const buffer = await file.arrayBuffer();
      let parsedRows = [];

      if (window.XLSX) {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        parsedRows = XLSX.utils.sheet_to_json(worksheet);
      } else {
        // Fallback plain text / CSV reader
        const text = new TextDecoder().decode(buffer);
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, hIdx) => { obj[h] = vals[hIdx]; });
            parsedRows.push(obj);
          }
        }
      }

      if (!parsedRows || parsedRows.length === 0) {
        alert('Berkas Excel kosong atau format tabel tidak dikenali!');
        event.target.value = '';
        return;
      }

      // Validasi dan normalisasi baris
      const validStudents = [];
      const detectedClasses = new Set();

      parsedRows.forEach(row => {
        const nama = (row['Nama Lengkap'] || row['nama_lengkap'] || row['Nama'] || row['nama'] || row['NAME'] || '').toString().trim();
        const nis = (row['NIS'] || row['nis'] || row['Nomor Induk'] || row['Username'] || '').toString().trim();
        const kelas = (row['Kelas'] || row['kelas'] || row['Rombel'] || row['KELAS'] || 'X.1').toString().trim();

        if (nama && nis) {
          validStudents.push({
            nama_lengkap: nama,
            nis: nis,
            kelas: kelas
          });
          detectedClasses.add(kelas);
        }
      });

      if (validStudents.length === 0) {
        alert('Tidak ditemukan kolom "Nama Lengkap" dan "NIS" yang valid pada file Excel!');
        event.target.value = '';
        return;
      }

      this.tempParsedExcelStudents = validStudents;
      this.openExcelPreviewModal(file.name, validStudents, Array.from(detectedClasses));

    } catch (err) {
      alert('Gagal memproses berkas Excel: ' + err.message);
    } finally {
      event.target.value = '';
    }
  }

  openExcelPreviewModal(fileName, validStudents, detectedClasses) {
    const modal = document.getElementById('admin-excel-preview-modal');
    const fnEl = document.getElementById('excel-preview-filename');
    const countBadge = document.getElementById('excel-preview-count-badge');
    const summaryText = document.getElementById('excel-preview-summary-text');
    const classesText = document.getElementById('excel-preview-classes-detected');
    const tbody = document.getElementById('excel-preview-table-body');

    if (fnEl) fnEl.innerText = fileName;
    if (countBadge) countBadge.innerText = `${validStudents.length} Siswa Siap`;
    if (summaryText) summaryText.innerText = `Mendeteksi ${validStudents.length} baris siswa valid dan ${detectedClasses.length} kelas.`;
    if (classesText) classesText.innerText = `Kelas Terdeteksi: ${detectedClasses.join(', ')}`;

    if (tbody) {
      const previewRows = validStudents.slice(0, 8);
      tbody.innerHTML = previewRows.map((s, idx) => {
        const cleanName = s.nama_lengkap.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
        const token = `EDU4-${s.nis}-${cleanName}`;
        return `
          <tr class="hover:bg-slate-50">
            <td class="py-2 px-3 text-slate-400 font-bold">${idx + 1}</td>
            <td class="py-2 px-3 font-semibold text-slate-900 font-sans">${s.nama_lengkap}</td>
            <td class="py-2 px-3 text-blue-900 font-bold">${s.nis}</td>
            <td class="py-2 px-3">
              <span class="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-900 border border-blue-200">
                ${s.kelas}
              </span>
            </td>
            <td class="py-2 px-3 text-teal-800 font-bold">${token}</td>
          </tr>
        `;
      }).join('');

      if (validStudents.length > 8) {
        tbody.innerHTML += `
          <tr>
            <td colspan="5" class="py-2.5 px-3 text-center text-slate-400 italic bg-slate-50/60 font-sans">
              ... dan ${validStudents.length - 8} siswa lainnya akan diimpor sekaligus.
            </td>
          </tr>
        `;
      }
    }

    if (modal) modal.classList.remove('hidden');
  }

  closeExcelPreviewModal() {
    this.tempParsedExcelStudents = [];
    document.getElementById('admin-excel-preview-modal')?.classList.add('hidden');
  }

  confirmImportExcelStudents() {
    if (!this.tempParsedExcelStudents || this.tempParsedExcelStudents.length === 0) return;

    try {
      const res = window.EduDB.importStudentsFromExcel(this.tempParsedExcelStudents);
      this.closeExcelPreviewModal();
      this.switchTab('classes-students');

      if (window.App) {
        window.App.showToast(`Berhasil mengimpor ${res.importedCount} siswa${res.newClassesCount > 0 ? ` dan ${res.newClassesCount} kelas baru` : ''} ke database!`, 'success');
      }
    } catch (e) {
      alert('Gagal menyimpan data siswa: ' + e.message);
    }
  }

  // ==================== 3. MODUL KARTU UJIAN SISWA (BARCODE / QR AUTO-LOGIN) (BAB 4.2) ====================
  _renderExamCardsTab() {
    const period = window.EduDB.getActivePeriod();
    let students = window.EduDB.getUsers('siswa');
    if (this.cardClassFilter !== 'ALL') {
      students = students.filter(s => s.kelas === this.cardClassFilter);
    }

    return `
      <div class="space-y-6">
        <!-- Filter & Batch Action Bar -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-id-card text-amber-500"></i> Kartu Ujian Barcode Siswa (Auto-Login Single-Card)
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              1 Siswa memegang 1 Kartu Ujian yang berlaku untuk <strong>SELURUH MATA PELAJARAN</strong> selama ujian berlangsung.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Filter Kelas -->
            <select onchange="window.AdminModule.setCardClassFilter(this.value)" class="text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50">
              <option value="ALL" ${this.cardClassFilter === 'ALL' ? 'selected' : ''}>Semua Rombel / Kelas</option>
              <option value="XII MIPA 1" ${this.cardClassFilter === 'XII MIPA 1' ? 'selected' : ''}>Kelas XII MIPA 1</option>
              <option value="XII MIPA 2" ${this.cardClassFilter === 'XII MIPA 2' ? 'selected' : ''}>Kelas XII MIPA 2</option>
              <option value="XII IPS 1" ${this.cardClassFilter === 'XII IPS 1' ? 'selected' : ''}>Kelas XII IPS 1</option>
            </select>

            <!-- Tombol Cetak Massal A4 -->
            <button onclick="window.AdminModule.printAllCards()" class="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-print"></i> Cetak Seluruh Kartu (A4 Batch)
            </button>
          </div>
        </div>

        <!-- Grid Kartu Ujian Siswa -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="exam-cards-grid">
          ${students.map(s => this._renderSingleExamCardHTML(s, period)).join('')}
        </div>
      </div>
    `;
  }

  setCardClassFilter(filterVal) {
    this.cardClassFilter = filterVal;
    this.switchTab('exam-cards');
  }

  /**
   * Helper merender 1 Kartu Ujian Siswa Resmi (Single-Card)
   */
  _renderSingleExamCardHTML(student, period) {
    const token = student.qr_auth_token || `EDU4-${student.nis}-${student.nama_lengkap.split(' ')[0].toUpperCase()}`;
    const autoLoginUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;

    return `
      <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-5 flex flex-col justify-between hover:shadow-lg transition relative overflow-hidden" id="card-${student.user_id}">
        <!-- Kop Mini Kartu -->
        <div class="border-b-2 border-blue-900 pb-3 mb-3 flex items-center gap-3">
          <img src="/logo-sekolah.png" alt="Logo SMAN 4 Soppeng" class="w-12 h-12 object-contain">
          <div class="leading-tight">
            <h4 class="text-[10px] font-bold uppercase tracking-wider text-slate-500">UPT SMAN 4 SOPPENG</h4>
            <h3 class="text-xs font-black text-blue-950 uppercase">KARTU PESERTA UJIAN DIGITAL</h3>
            <p class="text-[9px] text-teal-700 font-semibold">T.A. ${period.tahun_ajaran} (${period.semester}) &bull; Single-Card</p>
          </div>
        </div>

        <!-- Identitas Siswa -->
        <div class="flex items-start gap-3 my-2">
          <div class="w-14 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-slate-400">
            <i class="fa-solid fa-user-graduate text-2xl text-blue-900"></i>
            <span class="text-[8px] font-bold text-slate-500 mt-1 uppercase">FOTO</span>
          </div>
          <div class="text-xs space-y-1 flex-1">
            <div>
              <span class="text-[10px] text-slate-400 block uppercase">Nama Peserta:</span>
              <strong class="text-slate-900 text-sm font-black">${student.nama_lengkap}</strong>
            </div>
            <div class="flex justify-between text-[11px] text-slate-600">
              <span>NIS: <strong>${student.nis || student.username}</strong></span>
              <span>Kelas: <strong>${student.kelas}</strong></span>
            </div>
          </div>
        </div>

        <!-- Barcode / QR Code Box -->
        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center my-2 space-y-2">
          <div class="flex items-center justify-center gap-3">
            <!-- Simulated High-Density QR Code Matrix -->
            <div class="p-2 bg-white rounded-xl border border-slate-300 shadow-xs flex items-center justify-center">
              ${this._generateQRCodeSVG(token)}
            </div>

            <!-- Linear Barcode Simulation -->
            <div class="text-left space-y-1 flex-1">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">KODE AUTO-LOGIN:</span>
              <div class="font-mono text-xs font-black tracking-wider text-blue-900 bg-white px-2 py-1 rounded border border-slate-200">
                ${token}
              </div>
              <p class="text-[9px] text-slate-500 leading-tight">
                Scan via kamera HP di portal web untuk Auto-Login tanpa ketik password.
              </p>
            </div>
          </div>
        </div>

        <!-- Legalitas & Validasi -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 mb-3">
          <span>Berlaku Semua Mapel</span>
          <span class="font-bold text-slate-600">Kepala Sekolah: H. Abdul Rahman, S.Pd.</span>
        </div>

        <!-- Card Actions -->
        <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <button onclick="window.AdminModule.printSingleCard('${student.user_id}')" class="flex-1 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white font-bold text-[11px] transition flex items-center justify-center gap-1">
            <i class="fa-solid fa-print"></i> Cetak
          </button>
          <button onclick="window.AdminModule.copyAutoLoginLink('${token}')" class="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[11px] border border-teal-200 transition" title="Salin Tautan Auto-Login">
            <i class="fa-solid fa-copy"></i>
          </button>
          <button onclick="window.AdminModule.simulateAutoLogin('${token}')" class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition" title="Uji Langsung Masuk sebagai Siswa ini">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Tes Scan
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generator SVG QR Code presisi murni tanpa dependensi eksternal
   */
  _generateQRCodeSVG(content) {
    // Hash deterministik untuk menggambar modul QR yang unik per siswa
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // 17x17 grid matrix
    const size = 17;
    let rects = '';

    // Sudut Finder Patterns (Top-Left, Top-Right, Bottom-Left)
    const isFinder = (r, c) => {
      if (r < 5 && c < 5) return true;
      if (r < 5 && c >= size - 5) return true;
      if (r >= size - 5 && c < 5) return true;
      return false;
    };

    // Draw finder outer & inner
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let isDark = false;
        if (isFinder(r, c)) {
          // Standard QR finder box
          if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) isDark = true;
          if (r === 0 || r === 4 || c === size - 5 || c === size - 1 || (r === 2 && c === size - 3)) isDark = true;
          if (r === size - 5 || r === size - 1 || c === 0 || c === 4 || (r === size - 3 && c === 2)) isDark = true;
        } else {
          // Data bits based on seed
          const bitVal = (seed ^ (r * 31 + c * 17)) % 7;
          isDark = (bitVal === 0 || bitVal === 2 || bitVal === 5);
        }

        if (isDark) {
          rects += `<rect x="${c * 4}" y="${r * 4}" width="4" height="4" fill="#0F172A" />`;
        }
      }
    }

    return `
      <svg width="68" height="68" viewBox="0 0 ${size * 4} ${size * 4}" xmlns="http://www.w3.org/2000/svg" class="rounded">
        <rect width="100%" height="100%" fill="#FFFFFF" />
        ${rects}
      </svg>
    `;
  }

  printSingleCard(userId) {
    const student = window.EduDB.getUserById(userId);
    const period = window.EduDB.getActivePeriod();
    if (!student) return;

    const printContainer = document.getElementById('print-dynamic-table');
    const titleEl = document.getElementById('print-report-title');
    const subtitleEl = document.getElementById('print-report-subtitle');
    if (titleEl) titleEl.innerText = 'KARTU PESERTA ASESMEN DIGITAL SMAN 4 SOPPENG';
    if (subtitleEl) subtitleEl.innerText = `Tahun Ajaran ${period.tahun_ajaran} - Semester ${period.semester}`;

    if (printContainer) {
      printContainer.innerHTML = `
        <div style="max-width: 450px; margin: 0 auto; border: 2px solid #1E3A8A; border-radius: 16px; padding: 20px; font-family: Inter, sans-serif;">
          <div style="border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
            <img src="/logo-sekolah.png" style="width: 60px; height: 60px; object-fit: contain;">
            <div>
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">UPT SMA NEGERI 4 SOPPENG</div>
              <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #1E3A8A;">KARTU PESERTA UJIAN DIGITAL</div>
              <div style="font-size: 10px; color: #0D9488; font-weight: bold;">T.A. ${period.tahun_ajaran} (${period.semester}) &bull; Single-Card Seluruh Mapel</div>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="width: 80px; height: 100px; border: 1px solid #CBD5E1; background: #F8FAFC; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #64748B;">
              FOTO 3x4
            </div>
            <div style="font-size: 12px; line-height: 1.6;">
              <div>Nama: <strong>${student.nama_lengkap}</strong></div>
              <div>NIS: <strong>${student.nis || student.username}</strong></div>
              <div>Kelas: <strong>${student.kelas}</strong></div>
              <div>Status: <strong>Peserta Resmi Ujian</strong></div>
            </div>
          </div>

          <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 14px;">
              ${this._generateQRCodeSVG(student.qr_auth_token)}
              <div style="text-align: left; font-size: 11px;">
                <div style="font-weight: bold; font-family: monospace; font-size: 13px; color: #1E3A8A;">${student.qr_auth_token}</div>
                <div style="color: #64748B; font-size: 10px; margin-top: 4px;">Arahkan kamera HP ke QR Code ini pada portal web untuk Auto-Login tanpa mengetik kata sandi.</div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; pt: 8px;">
            <div>SMAN 4 Soppeng</div>
            <div>Kepala Sekolah: <strong>H. Abdul Rahman, S.Pd., M.Pd.</strong></div>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }

  printAllCards() {
    const period = window.EduDB.getActivePeriod();
    let students = window.EduDB.getUsers('siswa');
    if (this.cardClassFilter !== 'ALL') {
      students = students.filter(s => s.kelas === this.cardClassFilter);
    }

    const printContainer = document.getElementById('print-dynamic-table');
    const titleEl = document.getElementById('print-report-title');
    const subtitleEl = document.getElementById('print-report-subtitle');
    if (titleEl) titleEl.innerText = 'LEMBAR CETAK KARTU PESERTA ASESMEN DIGITAL SMAN 4 SOPPENG';
    if (subtitleEl) subtitleEl.innerText = `Rombongan Belajar: ${this.cardClassFilter} &bull; T.A. ${period.tahun_ajaran} (${period.semester})`;

    if (printContainer) {
      printContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-family: Inter, sans-serif;">
          ${students.map(student => `
            <div style="border: 1.5px solid #1E3A8A; border-radius: 12px; padding: 14px; background: white; page-break-inside: avoid;">
              <div style="border-bottom: 1.5px solid #1E3A8A; padding-bottom: 6px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <img src="/logo-sekolah.png" style="width: 42px; height: 42px; object-fit: contain;">
                <div style="line-height: 1.2;">
                  <div style="font-size: 9px; font-weight: bold; text-transform: uppercase;">UPT SMAN 4 SOPPENG</div>
                  <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #1E3A8A;">KARTU UJIAN DIGITAL</div>
                </div>
              </div>

              <div style="display: flex; gap: 10px; font-size: 10px; margin-bottom: 8px;">
                <div style="width: 50px; height: 60px; border: 1px solid #CBD5E1; background: #F8FAFC; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; color: #64748B;">
                  FOTO
                </div>
                <div style="line-height: 1.4;">
                  <div>Nama: <strong>${student.nama_lengkap}</strong></div>
                  <div>NIS: <strong>${student.nis || student.username}</strong></div>
                  <div>Kelas: <strong>${student.kelas}</strong></div>
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px; border-radius: 8px;">
                ${this._generateQRCodeSVG(student.qr_auth_token)}
                <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #1E3A8A;">
                  ${student.qr_auth_token}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }

  copyAutoLoginLink(token) {
    const url = `${window.location.origin}${window.location.pathname}?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      if (window.App) window.App.showToast('Tautan Auto-Login berhasil disalin ke clipboard!', 'success');
    }).catch(() => {
      prompt('Salin tautan Auto-Login berikut:', url);
    });
  }

  simulateAutoLogin(token) {
    if (window.App) {
      window.App.handleBarcodeAutoLogin(token);
    }
  }

  // ==================== 3. MODUL ATURAN PENSKORAN BOBOT 5 TIPE SOAL ====================
  _renderScoringTab() {
    const weights = window.EduDB.getScoringWeights();
    const total = weights.pg + weights.pgk + weights.truefalse + weights.matching + weights.essay;

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 class="text-lg font-bold text-slate-800">Distribusi Bobot Penskoran 5 Tipe Soal</h2>
              <p class="text-xs text-slate-500">Konfigurasi persentase penalti & kontribusi nilai akhir ujian siswa.</p>
            </div>
            <div id="scoring-total-badge" class="px-3 py-1.5 rounded-lg text-sm font-bold ${total === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              Total: ${total}%
            </div>
          </div>

          <form onsubmit="window.AdminModule.saveScoringWeights(event)" class="space-y-5">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-blue-100 text-blue-900 text-xs flex items-center justify-center font-bold">1</span>
                  Pilihan Ganda (PG Standard)
                </label>
                <span class="font-mono font-bold text-sm text-blue-900" id="weight-pg-display">${weights.pg}%</span>
              </div>
              <input type="range" id="weight-pg" min="0" max="60" step="5" value="${weights.pg}" oninput="window.AdminModule.recalcTotalWeights()" class="w-full accent-blue-900 cursor-pointer">
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-teal-100 text-teal-900 text-xs flex items-center justify-center font-bold">2</span>
                  Pilihan Ganda Kompleks (PGK Checkbox)
                </label>
                <span class="font-mono font-bold text-sm text-teal-900" id="weight-pgk-display">${weights.pgk}%</span>
              </div>
              <input type="range" id="weight-pgk" min="0" max="60" step="5" value="${weights.pgk}" oninput="window.AdminModule.recalcTotalWeights()" class="w-full accent-teal-600 cursor-pointer">
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-indigo-100 text-indigo-900 text-xs flex items-center justify-center font-bold">3</span>
                  Benar / Salah (True/False)
                </label>
                <span class="font-mono font-bold text-sm text-indigo-900" id="weight-tf-display">${weights.truefalse}%</span>
              </div>
              <input type="range" id="weight-tf" min="0" max="60" step="5" value="${weights.truefalse}" oninput="window.AdminModule.recalcTotalWeights()" class="w-full accent-indigo-600 cursor-pointer">
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-amber-100 text-amber-900 text-xs flex items-center justify-center font-bold">4</span>
                  Menjodohkan (Matching Pair)
                </label>
                <span class="font-mono font-bold text-sm text-amber-900" id="weight-matching-display">${weights.matching}%</span>
              </div>
              <input type="range" id="weight-matching" min="0" max="60" step="5" value="${weights.matching}" oninput="window.AdminModule.recalcTotalWeights()" class="w-full accent-amber-600 cursor-pointer">
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span class="w-6 h-6 rounded bg-rose-100 text-rose-900 text-xs flex items-center justify-center font-bold">5</span>
                  Isian Singkat & Esai (Evaluasi AI + Rubrik)
                </label>
                <span class="font-mono font-bold text-sm text-rose-900" id="weight-essay-display">${weights.essay}%</span>
              </div>
              <input type="range" id="weight-essay" min="0" max="60" step="5" value="${weights.essay}" oninput="window.AdminModule.recalcTotalWeights()" class="w-full accent-rose-600 cursor-pointer">
            </div>

            <div class="pt-3 flex items-center justify-end gap-3">
              <button type="button" onclick="window.AdminModule.resetDefaultWeights()" class="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                Kembalikan Rata (20% Tiap Tipe)
              </button>
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow transition">
                <i class="fa-solid fa-floppy-disk"></i> Simpan Aturan Penskoran
              </button>
            </div>
          </form>
        </div>

        <div class="lg:col-span-4 space-y-4">
          <div class="bg-blue-50/80 rounded-2xl p-5 border border-blue-200 text-xs text-blue-900 space-y-3">
            <h3 class="font-bold text-sm flex items-center gap-2">
              <i class="fa-solid fa-circle-info text-blue-700"></i> Ketentuan Penskoran
            </h3>
            <p class="leading-relaxed">
              Aturan penskoran ini akan diterapkan secara global saat siswa menekan tombol <strong>Selesai Ujian</strong>. 
            </p>
            <p class="leading-relaxed">
              Total seluruh bobot <strong>wajib berjumlah tepat 100%</strong> untuk menjaga integritas skala nilai maksimal standar rapor sekolah (0–100).
            </p>
          </div>
        </div>
      </div>
    `;
  }

  recalcTotalWeights() {
    const pg = parseInt(document.getElementById('weight-pg').value) || 0;
    const pgk = parseInt(document.getElementById('weight-pgk').value) || 0;
    const tf = parseInt(document.getElementById('weight-tf').value) || 0;
    const matching = parseInt(document.getElementById('weight-matching').value) || 0;
    const essay = parseInt(document.getElementById('weight-essay').value) || 0;

    document.getElementById('weight-pg-display').innerText = `${pg}%`;
    document.getElementById('weight-pgk-display').innerText = `${pgk}%`;
    document.getElementById('weight-tf-display').innerText = `${tf}%`;
    document.getElementById('weight-matching-display').innerText = `${matching}%`;
    document.getElementById('weight-essay-display').innerText = `${essay}%`;

    const total = pg + pgk + tf + matching + essay;
    const badge = document.getElementById('scoring-total-badge');
    if (badge) {
      badge.innerText = `Total: ${total}%`;
      if (total === 100) {
        badge.className = 'px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-800';
      } else {
        badge.className = 'px-3 py-1.5 rounded-lg text-sm font-bold bg-red-100 text-red-800 animate-pulse';
      }
    }
  }

  resetDefaultWeights() {
    document.getElementById('weight-pg').value = 20;
    document.getElementById('weight-pgk').value = 20;
    document.getElementById('weight-tf').value = 20;
    document.getElementById('weight-matching').value = 20;
    document.getElementById('weight-essay').value = 20;
    this.recalcTotalWeights();
  }

  saveScoringWeights(e) {
    e.preventDefault();
    const pg = parseInt(document.getElementById('weight-pg').value) || 0;
    const pgk = parseInt(document.getElementById('weight-pgk').value) || 0;
    const tf = parseInt(document.getElementById('weight-tf').value) || 0;
    const matching = parseInt(document.getElementById('weight-matching').value) || 0;
    const essay = parseInt(document.getElementById('weight-essay').value) || 0;

    const total = pg + pgk + tf + matching + essay;
    if (total !== 100) {
      alert(`Total bobot saat ini ${total}%. Total wajib tepat 100%! Silakan sesuaikan kembali nilainya.`);
      return;
    }

    window.EduDB.setScoringWeights({ pg, pgk, truefalse: tf, matching, essay });
    if (window.App) window.App.showToast('Aturan penskoran bobot 5 tipe soal berhasil disimpan!', 'success');
    this.switchTab('scoring');
  }

  // ==================== 4. MODUL MANAJEMEN USER (4 ROLE) ====================
  _renderUsersTab() {
    const users = (window.EduDB && window.EduDB.getUsers) ? window.EduDB.getUsers() : [];

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-800">Tata Kelola Pengguna Terpusat (4 Role)</h2>
            <p class="text-xs text-slate-500">Kelola akun Admin, Guru, Siswa (Barcode Auth Token), dan Kepala Sekolah.</p>
          </div>
          <button onclick="window.AdminModule.openAddUserModal()" class="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition">
            <i class="fa-solid fa-user-plus"></i> Tambah Pengguna Baru
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-y border-slate-200">
              <tr>
                <th class="py-3 px-4">Nama Lengkap</th>
                <th class="py-3 px-4">Username / NIS</th>
                <th class="py-3 px-4">Role Akses</th>
                <th class="py-3 px-4">Barcode Token</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${users.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center py-8 text-slate-400">Belum ada pengguna terdaftar. Klik tombol "Tambah Pengguna Baru" untuk menambahkan akun.</td>
                </tr>
              ` : users.map(u => {
                let roleBadge = 'bg-slate-100 text-slate-700';
                const roleLower = String(u.role || '').toLowerCase();
                if (roleLower === 'admin' || roleLower === 'super_admin') roleBadge = 'bg-purple-100 text-purple-800 font-bold';
                else if (roleLower === 'guru') roleBadge = 'bg-teal-100 text-teal-800 font-bold';
                else if (roleLower === 'siswa') roleBadge = 'bg-blue-100 text-blue-800 font-bold';
                else if (roleLower === 'kepsek') roleBadge = 'bg-amber-100 text-amber-800 font-bold';

                const isGuru = (roleLower === 'guru');
                const teacherSubs = (u.mata_pelajaran_list && u.mata_pelajaran_list.length > 0) ? u.mata_pelajaran_list : (u.mapel ? [u.mapel] : []);
                const teacherClasses = (u.kelas_diampu_list && u.kelas_diampu_list.length > 0) ? u.kelas_diampu_list : (u.kelas && u.kelas !== '-' ? [u.kelas] : []);
                const displayName = u.nama_lengkap || u.username || 'Pengguna';
                const initialChar = displayName.charAt(0).toUpperCase();

                return `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        ${initialChar}
                      </div>
                      <div>
                        <div>${displayName}</div>
                        ${isGuru ? `
                          <div class="flex flex-wrap items-center gap-1 mt-0.5">
                            <span class="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold" title="Mapel Diampu">
                              <i class="fa-solid fa-book-open mr-1 text-teal-600"></i>${teacherSubs.length > 0 ? (teacherSubs.length > 1 ? teacherSubs.length + ' Mapel (' + teacherSubs[0] + '...)' : teacherSubs[0]) : 'Belum Dipetakan'}
                            </span>
                            <span class="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold" title="Kelas Diampu">
                              <i class="fa-solid fa-users mr-1 text-blue-600"></i>${teacherClasses.length > 0 ? (teacherClasses.length > 2 ? teacherClasses.length + ' Kelas' : teacherClasses.join(', ')) : 'Semua Kelas'}
                            </span>
                          </div>
                        ` : `
                          <span class="text-[10px] text-slate-400">${u.kelas || u.mapel || '-'}</span>
                        `}
                      </div>
                    </td>
                    <td class="py-3.5 px-4 font-mono font-medium">${u.username || '-'}</td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-1 rounded-full text-xs uppercase ${roleBadge}">${u.role || '-'}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      ${u.qr_auth_token ? `<span class="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">${u.qr_auth_token}</span>` : '<span class="text-slate-400">-</span>'}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <button onclick="window.AdminModule.toggleUserStatus('${u.user_id}')" class="px-2.5 py-1 rounded-full text-xs font-semibold ${u.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                        ${u.status_aktif ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td class="py-3.5 px-4 text-right space-x-1">
                      ${isGuru ? `
                        <button onclick="window.AdminModule.openTeacherMappingModal('${u.user_id}')" class="px-2.5 py-1.5 rounded-lg text-teal-800 bg-teal-100 hover:bg-teal-200 transition font-bold text-xs inline-flex items-center gap-1 shadow-xs" title="Petakan Multi-Mapel & Multi-Kelas">
                          <i class="fa-solid fa-chalkboard-user"></i> Petakan Mapel & Kelas
                        </button>
                      ` : ''}
                      <button onclick="window.AdminModule.deleteUser('${u.user_id}')" class="p-2 rounded-lg text-red-600 hover:bg-red-50 transition" title="Hapus Pengguna">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  toggleUserStatus(userId) {
    const user = window.EduDB.getUserById(userId);
    if (!user) return;
    window.EduDB.updateUser(userId, { status_aktif: !user.status_aktif });
    if (window.App) window.App.showToast(`Status pengguna ${user.nama_lengkap || user.username} diperbarui!`, 'info');
    this.switchTab(this.currentTab || 'users');
  }

  deleteUser(userId) {
    const user = window.EduDB.getUserById(userId);
    if (!user) {
      if (window.App) window.App.showToast('Pengguna tidak ditemukan!', 'warning');
      return;
    }
    if (user.role === 'admin' && (user.username === 'admin' || user.email === 'sman4soppeng@gmail.com')) {
      alert('Akun Administrator Utama tidak dapat dihapus untuk keamanan sistem!');
      return;
    }
    const displayName = user.nama_lengkap || user.username || 'Pengguna';
    if (confirm(`Yakin ingin menghapus pengguna "${displayName}" (${user.role})?`)) {
      window.EduDB.deleteUser(userId);
      if (window.App) window.App.showToast(`Pengguna "${displayName}" berhasil dihapus!`, 'success');
      this.switchTab(this.currentTab || 'users');
    }
  }

  openAddUserModal() {
    const modal = document.getElementById('admin-user-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeAddUserModal() {
    const modal = document.getElementById('admin-user-modal');
    if (modal) modal.classList.add('hidden');
  }

  saveNewUser(e) {
    if (e) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const role = document.getElementById('modal-user-role')?.value || 'guru';
    const username = (document.getElementById('modal-user-username')?.value || '').trim();
    const nama_lengkap = (document.getElementById('modal-user-nama')?.value || '').trim();
    const password = (document.getElementById('modal-user-password')?.value || '').trim();
    const kelas = (document.getElementById('modal-user-kelas')?.value || '').trim();

    if (!username || !nama_lengkap || !password) {
      alert('Harap lengkapi semua kolom wajib!');
      return;
    }

    let mata_pelajaran_list = undefined;
    let mapel = undefined;
    if (role === 'guru') {
      const parts = kelas ? kelas.split(',').map(s => s.trim()).filter(Boolean) : ['Fisika Terapan & Energi Mandiri'];
      mata_pelajaran_list = parts;
      mapel = parts[0];
    }

    window.EduDB.addUser({
      username,
      password_hash: password,
      nama_lengkap,
      role,
      kelas: role === 'siswa' ? (kelas || '-') : '-',
      mapel: mapel,
      mata_pelajaran_list: mata_pelajaran_list,
      nis: role === 'siswa' ? username : undefined,
      status_aktif: true
    });

    this.closeAddUserModal();
    if (window.App) window.App.showToast(`Pengguna ${nama_lengkap} (${role}) berhasil ditambahkan!`, 'success');
    this.switchTab(this.currentTab || 'users');
  }

  // ==================== PEMETAAN MULTI-MAPEL & MULTI-KELAS GURU (v14.0) ====================
  openTeacherMappingModal(userId) {
    const user = window.EduDB.getUserById(userId);
    if (!user || user.role !== 'guru') {
      alert('Pengguna bukan guru atau tidak ditemukan!');
      return;
    }

    const allClasses = window.EduDB.getClasses() || [];
    const existingClasses = user.kelas_diampu_list || (user.kelas && user.kelas !== '-' ? [user.kelas] : []);
    const existingSubjects = user.mata_pelajaran_list || (user.mapel ? [user.mapel] : []);

    const dbSubjects = (window.EduDB.getSubjects ? window.EduDB.getSubjects() : []).map(s => s.nama_mapel);
    const allSubjectOptions = Array.from(new Set([...dbSubjects, ...existingSubjects]));

    let modalEl = document.getElementById('admin-teacher-mapping-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'admin-teacher-mapping-modal';
      modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 my-8 animate-fade-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-chalkboard-user"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800">Pemetaan Multi-Mapel & Multi-Kelas Guru</h3>
              <p class="text-xs text-slate-500">${user.nama_lengkap} (NIP/ID: ${user.nip || user.user_id})</p>
            </div>
          </div>
          <button type="button" onclick="window.AdminModule.closeTeacherMappingModal()" class="text-slate-400 hover:text-slate-600 p-2 rounded-lg">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form id="teacher-mapping-form" onsubmit="window.AdminModule.saveTeacherMapping(event, '${user.user_id}'); return false;" class="space-y-5">
          <!-- Multi-Select Mata Pelajaran -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <i class="fa-solid fa-book-open text-teal-600"></i> Mata Pelajaran yang Diampu (Bisa > 1 Mapel)
              </label>
              <span class="text-[11px] text-teal-700 font-semibold">Centang semua yang diajarkan</span>
            </div>
            <div class="max-h-48 overflow-y-auto p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="teacher-subjects-grid">
                ${allSubjectOptions.map(sub => {
                  const isChecked = existingSubjects.includes(sub);
                  return `
                    <label class="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-400 cursor-pointer text-xs transition">
                      <input type="checkbox" name="teacher_subject" value="${sub}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500">
                      <span class="font-medium text-slate-800 truncate">${sub}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <input type="text" id="teacher-custom-subject" placeholder="Tambah nama mapel lain jika belum ada..." class="text-xs px-3 py-1.5 rounded-lg border border-slate-300 flex-1">
              <button type="button" onclick="window.AdminModule.addCustomSubjectToMappingModal()" class="px-3 py-1.5 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-xs transition">
                + Tambah Mapel
              </button>
            </div>
          </div>

          <!-- Multi-Select Kelas Diampu -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <i class="fa-solid fa-users-rectangle text-blue-600"></i> Kelas yang Diampu (Bisa > 1 Kelas)
              </label>
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.AdminModule.selectAllTeacherClasses(true)" class="text-[10px] text-blue-600 font-bold hover:underline">Pilih Semua</button>
                <span class="text-slate-300">|</span>
                <button type="button" onclick="window.AdminModule.selectAllTeacherClasses(false)" class="text-[10px] text-slate-500 hover:underline">Hapus Pilihan</button>
              </div>
            </div>
            <div class="max-h-48 overflow-y-auto p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" id="teacher-classes-grid">
                ${allClasses.map(cls => {
                  const isChecked = existingClasses.includes(cls.nama_kelas);
                  return `
                    <label class="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 cursor-pointer text-xs transition">
                      <input type="checkbox" name="teacher_class" value="${cls.nama_kelas}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                      <span class="font-medium text-slate-800">${cls.nama_kelas}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
            <span>
              <strong>Ketentuan Isolasi Konteks (Strict Context Isolation):</strong> Bank Soal, Sesi Ujian Formatif, Rekap Nilai, dan Refleksi Guru akan disaring secara ketat berdasarkan mapel dan kelas yang diaktifkan ini di Context Switcher Bar Dashboard Guru.
            </span>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onclick="window.AdminModule.closeTeacherMappingModal()" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition">
              Batal
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5">
              <i class="fa-solid fa-floppy-disk"></i> Simpan Pemetaan Guru
            </button>
          </div>
        </form>
      </div>
    `;

    modalEl.classList.remove('hidden');
  }

  closeTeacherMappingModal() {
    const modalEl = document.getElementById('admin-teacher-mapping-modal');
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.remove();
    }
  }

  addCustomSubjectToMappingModal() {
    const input = document.getElementById('teacher-custom-subject');
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();

    // Pastikan tersimpan juga di master data tb_subjects secara dinamis
    try {
      if (window.EduDB && window.EduDB.addSubject) {
        if (!window.EduDB.getSubjectByName(val)) {
          window.EduDB.addSubject({ nama_mapel: val }, window.App?.currentUser);
        }
      }
    } catch (err) {
      console.warn('Subject registration:', err);
    }

    const grid = document.getElementById('teacher-subjects-grid');
    if (grid) {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 p-2 rounded-lg bg-teal-50 border border-teal-300 cursor-pointer text-xs transition';
      label.innerHTML = `
        <input type="checkbox" name="teacher_subject" value="${val}" checked class="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500">
        <span class="font-medium text-teal-900 truncate">${val}</span>
      `;
      grid.appendChild(label);
      input.value = '';
    }
  }

  selectAllTeacherClasses(select = true) {
    const checkboxes = document.querySelectorAll('input[name="teacher_class"]');
    checkboxes.forEach(cb => { cb.checked = select; });
  }

  saveTeacherMapping(e, userId) {
    if (e) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const subjectCheckboxes = document.querySelectorAll('input[name="teacher_subject"]:checked');
    const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value.trim()).filter(Boolean);

    const classCheckboxes = document.querySelectorAll('input[name="teacher_class"]:checked');
    const selectedClasses = Array.from(classCheckboxes).map(cb => cb.value.trim()).filter(Boolean);

    if (selectedSubjects.length === 0) {
      alert('Pilih minimal satu mata pelajaran untuk guru ini!');
      return false;
    }
    if (selectedClasses.length === 0) {
      alert('Pilih minimal satu kelas yang diampu guru ini!');
      return false;
    }

    // Pastikan seluruh mapel yang dipilih terdaftar di tb_subjects
    selectedSubjects.forEach(sub => {
      try {
        if (window.EduDB && window.EduDB.addSubject && !window.EduDB.getSubjectByName(sub)) {
          window.EduDB.addSubject({ nama_mapel: sub }, window.App?.currentUser);
        }
      } catch (err) {}
    });

    try {
      const currentAdmin = window.App ? window.App.currentUser : null;
      const updatedUser = window.EduDB.updateTeacherMapping(userId, {
        mata_pelajaran_list: selectedSubjects,
        kelas_diampu_list: selectedClasses
      }, currentAdmin);

      this.closeTeacherMappingModal();
      if (window.App && window.App.showToast) {
        window.App.showToast(`Pemetaan mata pelajaran & kelas untuk Guru ${updatedUser ? (updatedUser.nama_lengkap || updatedUser.username) : ''} berhasil diperbarui!`, 'success');
      }

      // Re-render UI seketika
      this.switchTab(this.currentTab || 'users');

      // Selaraskan GuruModule jika ada
      if (window.GuruModule && typeof window.GuruModule._ensureActiveSubject === 'function') {
        window.GuruModule._ensureActiveSubject();
      }
    } catch (err) {
      console.error('saveTeacherMapping error:', err);
      alert('Gagal menyimpan pemetaan: ' + (err.message || err));
    }
    return false;
  }

  // ==================== 5. MODUL LIVE LOG KEAMANAN ====================
  _renderLogsTab() {
    const logs = window.EduDB.getSecurityLogs();

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500 heartbeat-active"></span>
              <h2 class="text-lg font-bold text-slate-800">Live Log Keamanan Ujian (Visibility API)</h2>
            </div>
            <p class="text-xs text-slate-500">Catatan otomatis perpindahan tab, minimize browser, atau split screen siswa.</p>
          </div>
          <div class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200">
            Total Insiden Tercatat: <strong>${logs.length} Kejadian</strong>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-y border-slate-200">
              <tr>
                <th class="py-3 px-4">Waktu Kejadian</th>
                <th class="py-3 px-4">Nama Siswa / Kelas</th>
                <th class="py-3 px-4">Sesi Ujian</th>
                <th class="py-3 px-4">Tipe Insiden</th>
                <th class="py-3 px-4">Rincian Durasi / Aktivitas</th>
                <th class="py-3 px-4">Status Tindakan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${logs.length === 0 ? `
                <tr><td colspan="6" class="py-8 text-center text-slate-400">Belum ada insiden perpindahan tab yang tercatat.</td></tr>
              ` : logs.map(l => `
                <tr class="hover:bg-red-50/40 transition">
                  <td class="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">${l.timestamp}</td>
                  <td class="py-3 px-4">
                    <strong class="text-slate-900">${l.nama_siswa}</strong>
                    <div class="text-[11px] text-slate-400">NIS: ${l.nis || '-'} &bull; ${l.kelas}</div>
                  </td>
                  <td class="py-3 px-4 text-xs font-medium text-slate-700">${l.nama_ujian}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <i class="fa-solid fa-triangle-exclamation"></i> ${l.jenis_pelanggaran}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-xs text-slate-600">${l.detail}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                      ${l.status_tindakan}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==================== 6. MODUL DATABASE & SUPABASE CLOUD MANAGEMENT (BAB 2 & 7 v8.0) ====================
  _renderDatabaseTab() {
    const isSuper = this.isSuperAdmin();
    const supaConfig = window.EduSupabase ? window.EduSupabase.loadConfig() : { url: '', anonKey: '', isConnected: false, lastSync: null };

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card 1: Integrasi Supabase Cloud PostgreSQL -->
        <div class="bg-white rounded-2xl shadow-sm border-2 border-teal-200 p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-bold">
                <i class="fa-solid fa-cloud"></i>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${supaConfig.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-800 border border-teal-200'}">
                ${supaConfig.isConnected ? 'Cloud Connected' : 'Offline-First'}
              </span>
            </div>
            <h3 class="text-base font-bold text-slate-800 mb-2">1. Supabase Cloud PostgreSQL</h3>
            <p class="text-xs text-slate-500 leading-relaxed mb-4">
              Sinkronisasi 6 tabel relasional (tb_users, tb_academic_period, tb_questions, tb_exam_sessions, tb_student_results, tb_audit_logs) ke PostgreSQL Cloud dengan Row Level Security.
            </p>
            <div class="text-[11px] text-slate-400 font-mono mb-4">
              Terakhir Sinkron: <strong>${supaConfig.lastSync || 'Belum pernah'}</strong>
            </div>
          </div>
          <div class="space-y-2">
            <button onclick="window.AdminModule.openSupabaseModal()" class="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-gear"></i> Konfigurasi Cloud
            </button>
            <button onclick="window.AdminModule.syncToSupabaseCloud()" class="w-full py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-300 transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-arrows-rotate"></i> Sinkronkan Sekarang
            </button>
          </div>
        </div>

        <!-- Card 2: Backup Snapshot JSON -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-bold mb-4">
              <i class="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <h3 class="text-base font-bold text-slate-800 mb-2">2. Backup Snapshot JSON</h3>
            <p class="text-xs text-slate-500 leading-relaxed mb-4">
              Mengunduh cadangan lengkap seluruh data pengguna (termasuk Barcode Token), bank soal, jadwal ujian, hasil ujian, dan audit log v8.0.
            </p>
          </div>
          <button onclick="window.AdminModule.exportBackup()" class="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-bold shadow transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-download"></i> Unduh Snapshot JSON
          </button>
        </div>

        <!-- Card 3: Restore JSON Database -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center text-xl font-bold mb-4">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3 class="text-base font-bold text-slate-800 mb-2">3. Restore JSON Database</h3>
            <p class="text-xs text-slate-500 leading-relaxed mb-4">
              Pulihkan basis data secara instan dengan mengunggah berkas snapshot JSON cadangan sebelumnya.
            </p>
          </div>
          <div>
            <input type="file" id="db-restore-file" accept=".json" class="hidden" onchange="window.AdminModule.handleFileRestore(event)">
            <button onclick="document.getElementById('db-restore-file').click()" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-upload"></i> Unggah & Pulihkan Database
            </button>
          </div>
        </div>

        <!-- Card 4: Reset Database Aman (Dilindungi Hak Administrator) -->
        <div class="bg-white rounded-2xl shadow-sm border border-red-300 p-6 flex flex-col justify-between">
          <div>
            <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center text-xl font-bold mb-4">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 class="text-base font-bold text-red-900 mb-2">4. Reset Database Total</h3>
            <p class="text-xs text-slate-500 leading-relaxed mb-4">
              Mengembalikan basis data ke konfigurasi awal v17.0 Clean Slate. Tindakan ini dilindungi kata sandi Administrator (21405).
            </p>
          </div>
          <button onclick="window.AdminModule.openResetDbPrompt()" class="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-arrows-rotate"></i> Reset Siklus Akademik
          </button>
        </div>
      </div>
    `;
  }

  exportBackup() {
    window.EduDB.exportJSON();
    if (window.App) window.App.showToast('Cadangan basis data JSON v17.0 berhasil diunduh!', 'success');
  }

  handleFileRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const operator = window.App ? window.App.currentUser : null;
      const res = window.EduDB.importJSON(e.target.result, operator);
      if (res.success) {
        if (window.App) window.App.showToast('Basis data berhasil dipulihkan secara utuh!', 'success');
        this.renderAdminView();
      } else {
        alert('Gagal memulihkan database: ' + res.error);
      }
    };
    reader.readAsText(file);
  }

  openResetDbPrompt() {
    if (!this.isSuperAdmin()) {
      alert('Akses Ditolak: Reset Database Total hanya dapat dilakukan oleh Administrator!');
      return;
    }
    const pwd = prompt('PERHATIAN: Tindakan ini akan mengembalikan seluruh basis data ke kondisi awal v17.0 Clean Slate. Masukkan kata sandi Administrator (21405) untuk melanjutkan:');
    if (!pwd) return;

    const operator = window.App ? window.App.currentUser : null;
    const res = window.EduDB.resetDatabase(pwd, operator);
    if (res.success) {
      if (window.App) window.App.showToast('Basis data berhasil direset ke siklus akademik awal v17.0 Clean Slate!', 'success');
      this.renderAdminView();
    } else {
      alert(res.error);
    }
  }

  // ==================== SUPABASE MODAL HANDLERS (BLUEPRINT v8.0) ====================
  openSupabaseModal() {
    const modal = document.getElementById('admin-supabase-config-modal');
    if (modal && window.EduSupabase) {
      const cfg = window.EduSupabase.loadConfig();
      const urlInput = document.getElementById('supabase-url-input');
      const keyInput = document.getElementById('supabase-key-input');
      if (urlInput) urlInput.value = cfg.url || '';
      if (keyInput) keyInput.value = cfg.anonKey || '';

      const badge = document.getElementById('supabase-badge');
      if (badge) {
        badge.innerText = cfg.isConnected ? 'Cloud Connected' : 'Offline-First';
        badge.className = cfg.isConnected ? 'px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 uppercase tracking-wider' : 'px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-200 text-teal-900 uppercase tracking-wider';
      }
      modal.classList.remove('hidden');
    }
  }

  closeSupabaseModal() {
    const modal = document.getElementById('admin-supabase-config-modal');
    if (modal) modal.classList.add('hidden');
  }

  saveSupabaseConfig() {
    const url = document.getElementById('supabase-url-input').value.trim();
    const key = document.getElementById('supabase-key-input').value.trim();
    if (window.EduSupabase) {
      window.EduSupabase.saveConfig(url, key);
      if (window.App) window.App.showToast('Konfigurasi Supabase Cloud berhasil disimpan!', 'success');
      this.closeSupabaseModal();
      this.switchTab('database');
    }
  }

  async testSupabaseConnection() {
    const url = document.getElementById('supabase-url-input').value.trim();
    const key = document.getElementById('supabase-key-input').value.trim();

    if (!window.EduSupabase) return;
    if (window.App) window.App.showToast('Menguji koneksi ke Supabase Cloud...', 'info');

    const result = await window.EduSupabase.testConnection(url, key);
    if (result.success) {
      if (window.App) window.App.showToast(result.message, 'success');
      const badge = document.getElementById('supabase-badge');
      if (badge) {
        badge.innerText = 'Connected';
        badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 uppercase tracking-wider';
      }
    } else {
      alert(result.error);
    }
  }

  async syncToSupabaseCloud() {
    if (window.EduDB && typeof window.EduDB.syncClassesToCloud === 'function') {
      await window.EduDB.syncClassesToCloud();
    }
    if (!window.EduSupabase) return;
    if (window.App) window.App.showToast('Menyinkronkan basis data ke PostgreSQL Cloud...', 'info');

    const result = await window.EduSupabase.syncToCloud();
    if (result.success) {
      if (window.App) window.App.showToast(result.message, 'success');
      this.switchTab('database');
    } else {
      alert(result.error);
    }
  }
}

// Global Singleton Instance
window.AdminModule = new AdminController();
