const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'js', 'db.js');
let content = fs.readFileSync(dbPath, 'utf8');

// 1. Prepare clean slate top section
const cleanSlateTop = `/**
 * EduExam SMAN 4 Soppeng - Local Database Engine (LocalStorage Relational Model)
 * Sesuai Blueprint v17.0 (Independent Web Architecture, Clean Slate Initial Baseline, Full Dynamic Subject CRUD with Delete Button, Formative-Summative Control, and File Kisi-Kisi AI Generator Edition)
 * Tabel: tb_users, tb_subjects, tb_academic_period, tb_questions, tb_kisi_kisi, tb_exam_sessions, tb_student_results, tb_security_logs, tb_audit_logs, tb_teacher_settings, tb_ai_reflections, tb_archives
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

const DB_KEY = 'eduexam_db_v17';

const INITIAL_DATABASE = {
  academic_periods: [
    { period_id: 'period-2025-1', tahun_ajaran: '2025/2026', semester: 'Ganjil', status_aktif: true },
    { period_id: 'period-2025-2', tahun_ajaran: '2025/2026', semester: 'Genap', status_aktif: false }
  ],

  active_period: {
    tahun_ajaran: '2025/2026',
    semester: 'Ganjil'
  },

  scoring_weights: {
    pg: 20,          // Pilihan Ganda Standard
    pgk: 20,         // Pilihan Ganda Kompleks
    truefalse: 20,   // Benar / Salah
    matching: 20,    // Menjodohkan
    essay: 20        // Isian Singkat & Esai
  },

  // Pengaturan Guru & API Key Gemini Dual-Mode
  teacher_settings: {
    custom_gemini_api_key: '',
    system_default_gemini_key: (typeof atob === 'function' ? atob('QVEuQWI4Uk42SlJGOW9TNTZkc24tMnQ2V3NfU0JXOTNHZGg3OGpFMS1iT2tPYTdmUURNbUE=') : '')
  },

  // tb_subjects: Clean Slate (0 data awal - dikelola mandiri oleh Admin melalui modul Kelola Mapel)
  subjects: [],

  // tb_classes: Clean Slate (0 data awal - dikelola mandiri oleh Admin)
  classes: [],

  // tb_users: HANYA 1 Akun Admin Utama Default (Email: sman4soppeng@gmail.com / Password: 21405)
  users: [
    {
      user_id: 'usr-admin-1',
      username: 'admin',
      email: 'sman4soppeng@gmail.com',
      password_hash: '21405',
      nama_lengkap: 'Administrator SMAN 4 Soppeng',
      role: 'admin',
      jabatan: 'Administrator Sistem SMAN 4 Soppeng',
      kelas: '-',
      status_aktif: true
    }
  ],

  // tb_questions: Clean Slate (0 data awal)
  questions: [],

  // tb_exam_sessions: Clean Slate (0 data awal)
  exam_sessions: [],

  // tb_student_results: Clean Slate (0 data awal)
  student_results: [],

  // tb_kisi_kisi: Clean Slate (0 data awal)
  kisi_kisi: [],

  // tb_ai_reflections: Clean Slate (0 data awal)
  ai_reflections: [],

  // tb_archives: Clean Slate (0 data awal)
  archives: [],

  // tb_audit_logs: Log awal inisialisasi Clean Slate
  audit_logs: [
    {
      log_id: 'log-init-1',
      action_type: 'SYSTEM_INIT',
      description: 'Inisialisasi sistem EduExam SMAN 4 Soppeng v17.0 Clean Slate Baseline',
      timestamp: new Date().toISOString(),
      operator_name: 'Administrator SMAN 4 Soppeng',
      role: 'admin'
    }
  ],

  // tb_security_logs
  security_logs: []
};

// Database Management Class
class EduExamDB {
  constructor() {
    this.DB_KEY = DB_KEY;
    this.init();
  }

  init() {
    let raw = localStorage.getItem(DB_KEY);

    if (!raw) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATABASE));
      this.save();
    } else {
      try {
        this.data = JSON.parse(raw);
        if (!this.data.scoring_weights) this.data.scoring_weights = INITIAL_DATABASE.scoring_weights;
        if (!this.data.academic_periods) this.data.academic_periods = INITIAL_DATABASE.academic_periods;
        if (!this.data.active_period) this.data.active_period = INITIAL_DATABASE.active_period;
        if (!this.data.exam_sessions || !Array.isArray(this.data.exam_sessions)) this.data.exam_sessions = [];
        if (!this.data.audit_logs || !Array.isArray(this.data.audit_logs)) this.data.audit_logs = [];
        if (!this.data.security_logs || !Array.isArray(this.data.security_logs)) this.data.security_logs = [];
        if (!this.data.teacher_settings) this.data.teacher_settings = JSON.parse(JSON.stringify(INITIAL_DATABASE.teacher_settings));
        if (!this.data.kisi_kisi || !Array.isArray(this.data.kisi_kisi)) this.data.kisi_kisi = [];
        if (!this.data.ai_reflections || !Array.isArray(this.data.ai_reflections)) this.data.ai_reflections = [];
        if (!this.data.archives || !Array.isArray(this.data.archives)) this.data.archives = [];
        if (!this.data.subjects || !Array.isArray(this.data.subjects)) this.data.subjects = [];
        if (!this.data.classes || !Array.isArray(this.data.classes)) this.data.classes = [];
        if (!this.data.questions || !Array.isArray(this.data.questions)) this.data.questions = [];
        if (!this.data.student_results || !Array.isArray(this.data.student_results)) this.data.student_results = [];
        if (!this.data.users || !Array.isArray(this.data.users)) this.data.users = [];

        // HAPUS SEPENUHNYA role super_admin (Blueprint v17.0 - Simplifikasi 4 Peran)
        this.data.users = this.data.users.filter(u => u.role !== 'super_admin');

        // Pastikan akun default Admin Utama (sman4soppeng@gmail.com / 21405) selalu ada
        let adminUser = this.data.users.find(u => u.role === 'admin' && (u.email === 'sman4soppeng@gmail.com' || u.username === 'admin'));
        if (!adminUser) {
          adminUser = {
            user_id: 'usr-admin-1',
            username: 'admin',
            email: 'sman4soppeng@gmail.com',
            password_hash: '21405',
            nama_lengkap: 'Administrator SMAN 4 Soppeng',
            role: 'admin',
            jabatan: 'Administrator Sistem SMAN 4 Soppeng',
            kelas: '-',
            status_aktif: true
          };
          this.data.users.unshift(adminUser);
        } else {
          adminUser.email = 'sman4soppeng@gmail.com';
          adminUser.password_hash = '21405';
          adminUser.role = 'admin';
          adminUser.nama_lengkap = adminUser.nama_lengkap || 'Administrator SMAN 4 Soppeng';
          adminUser.status_aktif = true;
        }

        // Format pemetaan multi-mapel & multi-kelas jika ada akun guru
        this.data.users.forEach(u => {
          if (u.role === 'guru') {
            if (!Array.isArray(u.mata_pelajaran_list)) {
              u.mata_pelajaran_list = u.mapel ? u.mapel.split(',').map(s => s.trim()).filter(Boolean) : [];
            }
            if (!Array.isArray(u.kelas_diampu_list)) {
              u.kelas_diampu_list = (u.kelas && u.kelas !== '-') ? u.kelas.split(',').map(s => s.trim()).filter(Boolean) : [];
            }
          }
        });

        // Kontrol aktivasi sesi penilaian: Formatif (Guru) vs Sumatif (Admin)
        (this.data.exam_sessions || []).forEach(s => {
          if (s.is_active_by_admin === undefined) s.is_active_by_admin = false;
          if (s.is_active_by_teacher === undefined) {
            s.is_active_by_teacher = (s.kategori_penilaian === 'formatif');
          }
          if (s.is_active_by_teacher && !s.activated_by_teacher_name) {
            s.activated_by_teacher_name = s.guru_pengampu || 'Guru Mata Pelajaran';
          }
          if (s.activated_by_name === undefined) {
            s.activated_by_name = s.is_active_by_admin ? 'Administrator SMAN 4 Soppeng' : null;
          }
        });

        this.save();
      } catch (e) {
        console.error('Corrupt DB, restoring clean slate defaults', e);
        this.data = JSON.parse(JSON.stringify(INITIAL_DATABASE));
        this.save();
      }
    }
  }
`;

// Replace lines 1 up to 'save() {'
const saveIndex = content.indexOf('  save() {');
if (saveIndex === -1) {
  throw new Error('save() { not found in db.js');
}

let bottomContent = content.slice(saveIndex);

// In bottomContent:
// Replace getSubjects()
const oldGetSubjects = `  getSubjects() {
    if (!this.data.subjects || !Array.isArray(this.data.subjects) || this.data.subjects.length === 0) {
      this.data.subjects = JSON.parse(JSON.stringify(INITIAL_DATABASE.subjects || []));
      this.save();
    }
    return this.data.subjects;
  }`;

const newGetSubjects = `  getSubjects() {
    if (!this.data.subjects || !Array.isArray(this.data.subjects)) {
      this.data.subjects = [];
      this.save();
    }
    return this.data.subjects;
  }`;

if (bottomContent.includes(oldGetSubjects)) {
  bottomContent = bottomContent.replace(oldGetSubjects, newGetSubjects);
  console.log('Replaced getSubjects() successfully');
} else {
  console.warn('oldGetSubjects pattern not matched, checking alternative...');
}

// Replace deleteSubject()
const oldDeleteSubject = `  deleteSubject(subjectId, operatorUser = null) {
    const subjects = this.getSubjects();
    const target = subjects.find(s => s.subject_id === subjectId);
    if (!target) return false;

    this.data.subjects = subjects.filter(s => s.subject_id !== subjectId);
    this.addAuditLog('DELETE_SUBJECT', \`Menghapus mata pelajaran: \${target.nama_mapel} (\${target.kode_mapel})\`, operatorUser);
    this.save();
    return true;
  }`;

const newDeleteSubject = `  deleteSubject(subjectId, operatorUser = null) {
    const subjects = this.getSubjects();
    const target = subjects.find(s => s.subject_id === subjectId);
    if (!target) return false;

    const removedName = target.nama_mapel;
    this.data.subjects = subjects.filter(s => s.subject_id !== subjectId);

    // Otomatis bersihkan mapel dari assignment guru (mata_pelajaran_list & mapel)
    if (Array.isArray(this.data.users)) {
      this.data.users.forEach(u => {
        if (u.role === 'guru') {
          if (Array.isArray(u.mata_pelajaran_list)) {
            u.mata_pelajaran_list = u.mata_pelajaran_list.filter(m => m !== removedName);
          }
          if (u.mapel === removedName) {
            u.mapel = (u.mata_pelajaran_list && u.mata_pelajaran_list.length > 0) ? u.mata_pelajaran_list[0] : '';
          }
        }
      });
    }

    // Jika window.GuruModule sedang aktif, sinkronkan activeSubject
    if (typeof window !== 'undefined' && window.GuruModule) {
      if (window.GuruModule.activeSubject === removedName) {
        const remaining = (window.GuruModule.getTeacherSubjects ? window.GuruModule.getTeacherSubjects() : []) || [];
        window.GuruModule.activeSubject = remaining.length > 0 ? remaining[0] : null;
      }
    }

    this.addAuditLog('DELETE_SUBJECT', \`Menghapus mata pelajaran: \${target.nama_mapel} (\${target.kode_mapel})\`, operatorUser);
    this.save();
    return true;
  }`;

if (bottomContent.includes(oldDeleteSubject)) {
  bottomContent = bottomContent.replace(oldDeleteSubject, newDeleteSubject);
  console.log('Replaced deleteSubject() successfully');
} else {
  console.warn('oldDeleteSubject pattern not matched, checking alternative...');
}

// Replace getClasses()
const oldGetClasses = `  getClasses() {
    if (!this.data.classes || !Array.isArray(this.data.classes)) {
      this.data.classes = JSON.parse(JSON.stringify(INITIAL_DATABASE.classes || []));
      this.save();
    }
    return this.data.classes;
  }`;

const newGetClasses = `  getClasses() {
    if (!this.data.classes || !Array.isArray(this.data.classes)) {
      this.data.classes = [];
      this.save();
    }
    return this.data.classes;
  }`;

if (bottomContent.includes(oldGetClasses)) {
  bottomContent = bottomContent.replace(oldGetClasses, newGetClasses);
  console.log('Replaced getClasses() successfully');
}

// Replace updateTeacherMapping fallback
const oldMappingLine = "user.mapel = user.mata_pelajaran_list[0] || user.mapel || 'Fisika Terapan & Energi';";
const newMappingLine = "user.mapel = user.mata_pelajaran_list[0] || '';";
if (bottomContent.includes(oldMappingLine)) {
  bottomContent = bottomContent.replace(oldMappingLine, newMappingLine);
  console.log('Replaced updateTeacherMapping line successfully');
}

// Replace resetDatabase log text
const oldResetLog = "this.addAuditLog('RESET_DATABASE', 'Melakukan Reset Total Database ke pengaturan awal v15.0', operatorUser);";
const newResetLog = "this.addAuditLog('RESET_DATABASE', 'Melakukan Reset Total Database ke pengaturan awal v17.0 Clean Slate', operatorUser);";
if (bottomContent.includes(oldResetLog)) {
  bottomContent = bottomContent.replace(oldResetLog, newResetLog);
  console.log('Replaced resetDatabase log successfully');
}

const finalContent = cleanSlateTop + '\n' + bottomContent;
fs.writeFileSync(dbPath, finalContent, 'utf8');
console.log('js/db.js updated successfully!');

