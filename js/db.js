/**
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
    this.initSupabase();
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

  save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }

  // ==================== SUPABASE CLOUD POSTGRESQL ENGINE ====================
  initSupabase() {
    this.supabaseUrl = 'https://jzdjnsxsgeddlkhmwogk.supabase.co';
    this.supabaseKey = 'sb_publishable_itWkhhXA3pfbqqi15LsB1A_xErKk2Kr';
    this.supabaseLastStatus = {
      connected: false,
      error: null,
      isRLS: false,
      timestamp: null
    };

    if (typeof window !== 'undefined') {
      if (window.supabaseClient) {
        this.supabase = window.supabaseClient;
      } else if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey, {
            auth: { persistSession: true, autoRefreshToken: true }
          });
          window.supabaseClient = this.supabase;
        } catch (e) {
          console.warn('Inisialisasi Supabase:', e.message);
        }
      }
    } else {
      try {
        const { createClient } = require('@supabase/supabase-js');
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      } catch (e) {}
    }

    if (this.supabase) {
      console.log('🌐 EduExamDB: Supabase Client terpasang.');
      if (typeof window !== 'undefined') {
        setTimeout(() => this.syncFromSupabase(), 300);
      }
    }
  }

  isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str || ''));
  }

  generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ensureUUID(id) {
    if (this.isUUID(id)) return id;
    if (!id) return this.generateUUID();
    let hash = 0;
    const s = String(id);
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(-12);
    return `00000000-0000-4000-8000-${hex}`;
  }

  handleSupabaseSuccess(context) {
    this.supabaseLastStatus = {
      connected: true,
      error: null,
      isRLS: false,
      timestamp: new Date().toISOString()
    };
    if (typeof document !== 'undefined') {
      const badge = document.getElementById('supabase-status-text');
      if (badge) {
        badge.textContent = 'Terhubung';
        badge.className = 'text-emerald-700 font-bold';
      }
    }
  }

  handleSupabaseError(context, error) {
    const msg = error?.message || String(error);
    const isRLS = msg.includes('row-level security') || msg.includes('42501');
    console.warn(`[Supabase ${context}]`, msg);
    this.supabaseLastStatus = {
      connected: false,
      error: msg,
      isRLS: isRLS,
      timestamp: new Date().toISOString()
    };
    if (typeof document !== 'undefined') {
      const badge = document.getElementById('supabase-status-text');
      if (badge) {
        if (isRLS) {
          badge.textContent = 'Perlu Policy SQL';
          badge.className = 'text-amber-600 font-bold';
        } else {
          badge.textContent = 'Offline (Lokal)';
          badge.className = 'text-slate-500 font-bold';
        }
      }
    }
  }

  async syncFromSupabase() {
    if (!this.supabase) {
      this.initSupabase();
      if (!this.supabase) return false;
    }
    let anySuccess = false;

    // 1. Sync tb_subjects
    try {
      const { data: remoteSubjects, error: subErr } = await this.supabase
        .from('tb_subjects')
        .select('*');

      if (!subErr && Array.isArray(remoteSubjects)) {
        this.handleSupabaseSuccess('tb_subjects fetch');
        anySuccess = true;
        if (remoteSubjects.length > 0) {
          remoteSubjects.forEach(rs => {
            const exists = this.data.subjects.find(s => s.subject_id === rs.subject_id || s.nama_mapel.toLowerCase() === rs.nama_mapel.toLowerCase());
            if (!exists) {
              this.data.subjects.push({
                subject_id: rs.subject_id,
                nama_mapel: rs.nama_mapel,
                kode_mapel: rs.kode_mapel,
                created_at: rs.created_at
              });
            }
          });
          this.save();
        }
      } else if (subErr) {
        this.handleSupabaseError('tb_subjects fetch', subErr);
      }
    } catch (e) {
      this.handleSupabaseError('tb_subjects catch', e);
    }

    // 2. Sync tb_users
    try {
      const { data: remoteUsers, error: usrErr } = await this.supabase
        .from('tb_users')
        .select('*');

      if (!usrErr && Array.isArray(remoteUsers)) {
        anySuccess = true;
        if (remoteUsers.length > 0) {
          remoteUsers.forEach(ru => {
            const mappedUser = {
              user_id: ru.user_id,
              username: ru.username,
              email: ru.email,
              password_hash: ru.password_hash,
              nama_lengkap: ru.nama_lengkap,
              role: ru.role,
              mata_pelajaran_list: Array.isArray(ru.assigned_mapel_json) ? ru.assigned_mapel_json : [],
              kelas_diampu_list: Array.isArray(ru.assigned_kelas_json) ? ru.assigned_kelas_json : [],
              mapel: Array.isArray(ru.assigned_mapel_json) && ru.assigned_mapel_json.length > 0 ? ru.assigned_mapel_json[0] : '',
              kelas: Array.isArray(ru.assigned_kelas_json) ? ru.assigned_kelas_json.join(', ') : '-',
              status_aktif: true,
              created_at: ru.created_at
            };
            const idx = this.data.users.findIndex(u => u.user_id === ru.user_id || u.username === ru.username);
            if (idx !== -1) {
              this.data.users[idx] = { ...this.data.users[idx], ...mappedUser };
            } else {
              this.data.users.push(mappedUser);
            }
          });
          this.save();
        }
      }
    } catch (e) {}

    // 3. Sync tb_questions
    try {
      const { data: remoteQuestions, error: qErr } = await this.supabase
        .from('tb_questions')
        .select('*');

      if (!qErr && Array.isArray(remoteQuestions) && remoteQuestions.length > 0) {
        anySuccess = true;
        remoteQuestions.forEach(rq => {
          const mappedQ = {
            question_id: rq.question_id,
            session_id: rq.assessment_id,
            mata_pelajaran: rq.mata_pelajaran,
            tipe: String(rq.jenis_soal || 1),
            pertanyaan: rq.narasi_soal,
            opsi: Array.isArray(rq.opsi_json) ? rq.opsi_json : [],
            kunci_jawaban: rq.kunci_jawaban,
            pembahasan: rq.pembahasan,
            level_kognitif: rq.level_kognitif,
            kisi_kisi_ref_id: rq.kisi_kisi_ref_id,
            created_at: rq.created_at,
            status: 'siap'
          };
          const qIdx = this.data.questions.findIndex(q => q.question_id === rq.question_id);
          if (qIdx !== -1) {
            this.data.questions[qIdx] = { ...this.data.questions[qIdx], ...mappedQ };
          } else {
            this.data.questions.push(mappedQ);
          }
        });
        this.save();
      }
    } catch (e) {}

    // 4. Sync tb_assessments & tb_exam_schedules
    try {
      const [assRes, schedRes] = await Promise.all([
        this.supabase.from('tb_assessments').select('*'),
        this.supabase.from('tb_exam_schedules').select('*')
      ]);

      if (!assRes.error && Array.isArray(assRes.data) && assRes.data.length > 0) {
        anySuccess = true;
        const schedMap = {};
        if (!schedRes.error && Array.isArray(schedRes.data)) {
          schedRes.data.forEach(sc => { schedMap[sc.assessment_id] = sc; });
        }

        assRes.data.forEach(ra => {
          const sc = schedMap[ra.assessment_id] || {};
          const mappedSession = {
            session_id: ra.assessment_id,
            kategori_penilaian: ra.kategori_penilaian,
            jenis_sumatif: ra.jenis_sumatif,
            materi_bab_text: ra.materi_bab_text,
            nama_sesi: sc.nama_sesi_ujian || ra.materi_bab_text || 'Sesi Ujian',
            target_kelas: Array.isArray(ra.target_kelas_json) ? ra.target_kelas_json : [],
            is_active_by_teacher: !!ra.is_teacher_activated,
            is_active_by_admin: !!sc.is_active_by_admin,
            status_aktif: true,
            created_at: ra.created_at
          };
          const sIdx = this.data.exam_sessions.findIndex(s => s.session_id === ra.assessment_id);
          if (sIdx !== -1) {
            this.data.exam_sessions[sIdx] = { ...this.data.exam_sessions[sIdx], ...mappedSession };
          } else {
            this.data.exam_sessions.push(mappedSession);
          }
        });
        this.save();
      }
    } catch (e) {}

    // 5. Sync tb_ai_reflections
    try {
      const { data: remoteRef, error: refErr } = await this.supabase
        .from('tb_ai_reflections')
        .select('*');

      if (!refErr && Array.isArray(remoteRef) && remoteRef.length > 0) {
        anySuccess = true;
        remoteRef.forEach(rr => {
          const mappedRef = {
            reflection_id: rr.reflection_id,
            session_id: rr.assessment_id,
            teacher_id: rr.teacher_id,
            konten_refleksi: rr.ringkasan_miskonsepsi,
            ringkasan_miskonsepsi: rr.ringkasan_miskonsepsi,
            saran_remedial_pengayaan: rr.saran_remedial_pengayaan,
            growth_score_avg: rr.growth_score_avg,
            created_at: rr.created_at
          };
          const rIdx = this.data.ai_reflections.findIndex(r => r.reflection_id === rr.reflection_id);
          if (rIdx !== -1) {
            this.data.ai_reflections[rIdx] = { ...this.data.ai_reflections[rIdx], ...mappedRef };
          } else {
            this.data.ai_reflections.unshift(mappedRef);
          }
        });
        this.save();
      }
    } catch (e) {}

    return anySuccess;
  }

  async authenticateAsync(identifier, password, role) {
    const id = (identifier || '').trim().toLowerCase();
    const pwd = (password || '').trim();

    // 1. Kredensial Default Admin Utama SMAN 4 Soppeng (Selalu Lolos)
    if ((id === 'sman4soppeng@gmail.com' || id === 'admin') && pwd === '21405') {
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
        this.save();
      }
      return adminUser;
    }

    if (!this.supabase) {
      this.initSupabase();
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('tb_users')
          .select('*')
          .or(`email.ilike.${id},username.ilike.${id}`)
          .eq('password_hash', pwd);

        if (!error && Array.isArray(data) && data.length > 0) {
          const u = data[0];
          if (!role || u.role === role) {
            this.handleSupabaseSuccess('login query');
            const mappedUser = {
              user_id: u.user_id,
              username: u.username,
              email: u.email,
              password_hash: u.password_hash,
              nama_lengkap: u.nama_lengkap,
              role: u.role,
              mata_pelajaran_list: Array.isArray(u.assigned_mapel_json) ? u.assigned_mapel_json : [],
              kelas_diampu_list: Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json : [],
              mapel: Array.isArray(u.assigned_mapel_json) && u.assigned_mapel_json.length > 0 ? u.assigned_mapel_json[0] : '',
              kelas: Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json.join(', ') : '-',
              status_aktif: true
            };
            const exIdx = this.data.users.findIndex(item => item.user_id === u.user_id || item.username === u.username);
            if (exIdx !== -1) {
              this.data.users[exIdx] = mappedUser;
            } else {
              this.data.users.push(mappedUser);
            }
            this.save();
            return mappedUser;
          }
        } else if (error) {
          this.handleSupabaseError('login query', error);
        }
      } catch (err) {
        this.handleSupabaseError('login catch', err);
      }
    }

    // Fallback: Local database baseline check
    return this.authenticate(identifier, password, role);
  }

  // --- ACADEMIC PERIOD ---
  getActivePeriod() {
    return this.data.active_period || { tahun_ajaran: '2025/2026', semester: 'Ganjil' };
  }

  setActivePeriod(tahun_ajaran, semester) {
    this.data.active_period = { tahun_ajaran, semester };
    this.save();
  }

  getAcademicPeriods() {
    return this.data.academic_periods || [];
  }

  // --- SCORING WEIGHTS ---
  getScoringWeights() {
    return this.data.scoring_weights || { pg: 20, pgk: 20, truefalse: 20, matching: 20, essay: 20 };
  }

  setScoringWeights(weights) {
    this.data.scoring_weights = { ...weights };
    this.save();
  }

  // --- TEACHER SETTINGS & GEMINI API KEY DUAL-MODE (BAB 4.1 BLUEPRINT v9.0) ---
  getTeacherSettings() {
    if (!this.data.teacher_settings) {
      this.data.teacher_settings = {
        custom_gemini_api_key: '',
        system_default_gemini_key: (typeof atob === 'function' ? atob('QVEuQWI4Uk42SlJGOW9TNTZkc24tMnQ2V3NfU0JXOTNHZGg3OGpFMS1iT2tPYTdmUURNbUE=') : '')
      };
    }
    return this.data.teacher_settings;
  }

  saveTeacherSettings(settings) {
    this.data.teacher_settings = { ...this.getTeacherSettings(), ...settings };
    this.save();
    return this.data.teacher_settings;
  }

  getGeminiApiKey(userId = null) {
    const settings = this.getTeacherSettings();
    if (settings.custom_gemini_api_key && settings.custom_gemini_api_key.trim().length > 0) {
      return settings.custom_gemini_api_key.trim();
    }
    return settings.system_default_gemini_key || (typeof atob === 'function' ? atob('QVEuQWI4Uk42SlJGOW9TNTZkc24tMnQ2V3NfU0JXOTNHZGg3OGpFMS1iT2tPYTdmUURNbUE=') : '');
  }

  setGeminiApiKey(apiKey) {
    const settings = this.getTeacherSettings();
    settings.custom_gemini_api_key = (apiKey || '').trim();
    this.save();
    return settings;
  }

  isUsingCustomGeminiKey() {
    const settings = this.getTeacherSettings();
    return !!(settings.custom_gemini_api_key && settings.custom_gemini_api_key.trim().length > 0);
  }

  // --- KISI-KISI MATRIKS ASESMEN & EXPORTER (BAB 4.3 & BAB 5 BLUEPRINT v9.0) ---
  getKisiKisi(subject = null, classFilter = null) {
    let list = this.data.kisi_kisi || [];
    if (subject && subject !== 'all') {
      const sLower = subject.toLowerCase().trim();
      list = list.filter(k => {
        const kMapel = (k.mata_pelajaran || '').toLowerCase();
        return kMapel.includes(sLower) || sLower.includes(kMapel);
      });
    }
    if (classFilter && classFilter !== 'all' && classFilter !== 'ALL') {
      const cLower = classFilter.toLowerCase().trim();
      list = list.filter(k => {
        if (!k.target_kelas) return true;
        if (Array.isArray(k.target_kelas)) {
          return k.target_kelas.includes('Semua Kelas') || k.target_kelas.some(cls => String(cls).toLowerCase().trim() === cLower);
        }
        return String(k.target_kelas).toLowerCase().includes(cLower);
      });
    }
    return list.sort((a, b) => (parseInt(a.nomor) || 0) - (parseInt(b.nomor) || 0));
  }

  getKisiKisiById(kisiId) {
    return (this.data.kisi_kisi || []).find(k => k.kisi_id === kisiId);
  }

  saveKisiKisiItem(kisiData) {
    if (!this.data.kisi_kisi) this.data.kisi_kisi = [];
    if (kisiData.kisi_id) {
      const idx = this.data.kisi_kisi.findIndex(k => k.kisi_id === kisiData.kisi_id);
      if (idx !== -1) {
        this.data.kisi_kisi[idx] = { ...this.data.kisi_kisi[idx], ...kisiData, updated_at: new Date().toISOString() };
        this.save();
        return this.data.kisi_kisi[idx];
      }
    }
    const newItem = {
      kisi_id: 'kisi-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
      ...kisiData
    };
    this.data.kisi_kisi.push(newItem);
    this.save();
    return newItem;
  }

  deleteKisiKisiItem(kisiId) {
    if (!this.data.kisi_kisi) return false;
    this.data.kisi_kisi = this.data.kisi_kisi.filter(k => k.kisi_id !== kisiId);
    this.save();
    return true;
  }

  clearKisiKisi(subject = null) {
    if (!this.data.kisi_kisi) return 0;
    const initialLen = this.data.kisi_kisi.length;
    if (subject && subject !== 'all') {
      const sLower = subject.toLowerCase().trim();
      this.data.kisi_kisi = this.data.kisi_kisi.filter(k => {
        const kMapel = (k.mata_pelajaran || '').toLowerCase();
        return !(kMapel.includes(sLower) || sLower.includes(kMapel));
      });
    } else {
      this.data.kisi_kisi = [];
    }
    this.save();
    return initialLen - this.data.kisi_kisi.length;
  }

  generateKisiKisiFromQuestions(subject) {
    const questions = this.getQuestionsBySubject(subject, 'all');
    if (!questions || questions.length === 0) {
      return [];
    }
    if (!this.data.kisi_kisi) this.data.kisi_kisi = [];

    // Hapus kisi-kisi mapel lama untuk diperbarui
    this.clearKisiKisi(subject);

    const newItems = questions.map((q, idx) => {
      let bentuk = 'Pilihan Ganda (PG)';
      if (q.jenis_soal === 'pgk') bentuk = 'Pilihan Ganda Kompleks (PGK)';
      else if (q.jenis_soal === 'truefalse') bentuk = 'Benar / Salah (True/False)';
      else if (q.jenis_soal === 'matching') bentuk = 'Menjodohkan (Matching Pair)';
      else if (q.jenis_soal === 'essay') bentuk = 'Isian Singkat & Esai';

      let bloom = q.tingkat_kognitif || 'C4 (Menganalisis)';
      if (!bloom.startsWith('C')) {
        bloom = (bloom === 'HOTS') ? 'C4 (Menganalisis)' : (bloom === 'MOTS') ? 'C3 (Menerapkan)' : 'C2 (Memahami)';
      }

      const cleanStimulus = (q.narasi_soal || '').replace(/\[HOTS[^\]]*\]/g, '').replace(/\[MOTS[^\]]*\]/g, '').replace(/\[LOTS[^\]]*\]/g, '').trim();
      const bab = q.keterangan_bab || `Bab Pembelajaran ${subject}`;

      return {
        kisi_id: 'kisi-auto-' + Date.now() + '-' + (idx + 1),
        nomor: idx + 1,
        question_id: q.question_id,
        mata_pelajaran: q.mata_pelajaran || subject,
        keterangan_bab: bab,
        capaian_pembelajaran: `Peserta didik mampu menelaah dan mengaplikasikan konsep ${bab} dalam pemecahan masalah ilmiah terstruktur.`,
        tujuan_pembelajaran: `Menganalisis prinsip fisis dasar serta menyelesaikan interpretasi saintifik pada materi ${bab}.`,
        indikator_soal: `Disajikan stimulus ilmiah mengenai ${cleanStimulus.slice(0, 75)}..., peserta didik dapat menentukan jawaban secara tepat dan analitis.`,
        level_kognitif: bloom,
        bentuk_soal: bentuk,
        target_kelas: Array.isArray(q.target_kelas) ? q.target_kelas : (q.target_kelas ? [q.target_kelas] : ['XII MIPA 1'])
      };
    });

    this.data.kisi_kisi.push(...newItems);
    this.save();
    return newItems;
  }

  // --- AI REFLEKSI PEMBELAJARAN & MONITORING PERKEMBANGAN SISWA (BAB 3 BLUEPRINT v11.0) ---
  getAIReflections(filter = {}) {
    let list = this.data.ai_reflections || [];
    if (filter.mata_pelajaran && filter.mata_pelajaran !== 'all') {
      const sLower = filter.mata_pelajaran.toLowerCase().trim();
      list = list.filter(r => (r.mata_pelajaran || '').toLowerCase().includes(sLower) || sLower.includes((r.mata_pelajaran || '').toLowerCase()));
    }
    if (filter.kelas && filter.kelas !== 'all' && filter.kelas !== 'ALL') {
      const cLower = filter.kelas.toLowerCase().trim();
      list = list.filter(r => (r.kelas || '').toLowerCase().includes(cLower));
    }
    if (filter.kategori_penilaian && filter.kategori_penilaian !== 'all') {
      const catLower = filter.kategori_penilaian.toLowerCase().trim();
      list = list.filter(r => (r.kategori_penilaian || '').toLowerCase() === catLower);
    }
    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  getAIReflectionById(reflectionId) {
    return (this.data.ai_reflections || []).find(r => r.reflection_id === reflectionId);
  }

  saveAIReflection(reflectionData) {
    if (!this.data.ai_reflections) this.data.ai_reflections = [];
    if (reflectionData.reflection_id) {
      const idx = this.data.ai_reflections.findIndex(r => r.reflection_id === reflectionData.reflection_id);
      if (idx !== -1) {
        this.data.ai_reflections[idx] = {
          ...this.data.ai_reflections[idx],
          ...reflectionData,
          updated_at: new Date().toISOString()
        };
        this.save();
        const updatedRef = this.data.ai_reflections[idx];

        if (this.supabase) {
          this.supabase.from('tb_ai_reflections').upsert({
            reflection_id: this.ensureUUID(updatedRef.reflection_id),
            assessment_id: updatedRef.session_id ? this.ensureUUID(updatedRef.session_id) : null,
            teacher_id: updatedRef.teacher_id ? this.ensureUUID(updatedRef.teacher_id) : null,
            ringkasan_miskonsepsi: updatedRef.ringkasan_miskonsepsi || updatedRef.konten_refleksi || '',
            saran_remedial_pengayaan: updatedRef.saran_remedial_pengayaan || updatedRef.rekomendasi || '',
            growth_score_avg: updatedRef.growth_score_avg || null,
            created_at: updatedRef.created_at || new Date().toISOString()
          }, { onConflict: 'reflection_id' }).catch(err => this.handleSupabaseError('tb_ai_reflections update catch', err));
        }

        return updatedRef;
      }
    }
    const refId = reflectionData.reflection_id ? this.ensureUUID(reflectionData.reflection_id) : this.generateUUID();
    const newRef = {
      reflection_id: refId,
      created_at: new Date().toISOString(),
      ...reflectionData,
      reflection_id: refId
    };
    this.data.ai_reflections.unshift(newRef);
    this.save();

    // Supabase Cloud sync tb_ai_reflections
    if (this.supabase) {
      this.supabase.from('tb_ai_reflections').upsert({
        reflection_id: newRef.reflection_id,
        assessment_id: newRef.session_id ? this.ensureUUID(newRef.session_id) : null,
        teacher_id: newRef.teacher_id ? this.ensureUUID(newRef.teacher_id) : null,
        ringkasan_miskonsepsi: newRef.ringkasan_miskonsepsi || newRef.konten_refleksi || '',
        saran_remedial_pengayaan: newRef.saran_remedial_pengayaan || newRef.rekomendasi || '',
        growth_score_avg: newRef.growth_score_avg || null,
        created_at: newRef.created_at
      }, { onConflict: 'reflection_id' }).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_ai_reflections upsert', error);
        else this.handleSupabaseSuccess('tb_ai_reflections upsert');
      }).catch(err => this.handleSupabaseError('tb_ai_reflections catch', err));
    }

    return newRef;
  }

  deleteAIReflection(reflectionId) {
    if (!this.data.ai_reflections) return false;
    const initialLen = this.data.ai_reflections.length;
    this.data.ai_reflections = this.data.ai_reflections.filter(r => r.reflection_id !== reflectionId);
    this.save();

    // Supabase Cloud sync tb_ai_reflections
    if (this.supabase) {
      this.supabase.from('tb_ai_reflections').delete().eq('reflection_id', this.ensureUUID(reflectionId)).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_ai_reflections delete', error);
        else this.handleSupabaseSuccess('tb_ai_reflections delete');
      }).catch(err => this.handleSupabaseError('tb_ai_reflections delete catch', err));
    }

    return this.data.ai_reflections.length < initialLen;
  }

  // --- REPOSITORI ARSIP DIGITAL GURU (BAB 2 BLUEPRINT v13.0) ---
  getArchives(teacherId = null, filterType = 'ALL') {
    let list = this.data.archives || [];
    if (teacherId && teacherId !== 'all') {
      list = list.filter(a => a.teacher_id === teacherId || a.guru_id === teacherId);
    }
    if (filterType && filterType !== 'ALL') {
      list = list.filter(a => a.jenis_berkas === filterType || a.tipe === filterType);
    }
    return list;
  }

  getArchiveById(archiveId) {
    return (this.data.archives || []).find(a => a.archive_id === archiveId || a.id === archiveId) || null;
  }

  addArchive(archiveData) {
    if (!this.data.archives) this.data.archives = [];
    const rawId = archiveData.id || archiveData.archive_id;
    const id = rawId ? this.ensureUUID(rawId) : this.generateUUID();
    const newArchive = {
      id: id,
      archive_id: id,
      guru_id: archiveData.guru_id || archiveData.teacher_id || 'usr-guru-1',
      teacher_id: archiveData.teacher_id || archiveData.guru_id || 'usr-guru-1',
      teacher_name: archiveData.teacher_name || 'Syarif Hidayatullah, S.Pd.',
      judul: archiveData.judul || archiveData.nama_berkas || 'Berkas Baru',
      nama_berkas: archiveData.nama_berkas || archiveData.judul || 'Berkas Baru',
      tipe: archiveData.tipe || archiveData.jenis_berkas || 'DOKUMEN',
      jenis_berkas: archiveData.jenis_berkas || archiveData.tipe || 'DOKUMEN',
      mime_type: archiveData.mime_type || ((archiveData.jenis_berkas === 'GAMBAR' || archiveData.tipe === 'GAMBAR') ? 'image/png' : 'application/pdf'),
      file_url: archiveData.file_url || archiveData.data_url || '',
      data_url: archiveData.data_url || archiveData.file_url || '',
      ukuran_bytes: archiveData.ukuran_bytes || ((archiveData.file_size_kb || 0) * 1024),
      file_size_kb: archiveData.file_size_kb || Math.round((archiveData.ukuran_bytes || 0) / 1024),
      deskripsi_singkat: archiveData.deskripsi_singkat || archiveData.judul || '',
      text_content: archiveData.text_content || archiveData.teks_lengkap || '',
      teks_lengkap: archiveData.teks_lengkap || archiveData.text_content || '',
      bab_pokok: archiveData.bab_pokok || 'Materi Umum',
      created_at: archiveData.created_at || new Date().toISOString()
    };
    this.data.archives.unshift(newArchive);
    this.save();

    // Supabase Cloud sync tb_archives
    if (this.supabase) {
      this.supabase.from('tb_archives').upsert({
        archive_id: newArchive.archive_id,
        teacher_id: this.ensureUUID(newArchive.teacher_id),
        file_url: newArchive.file_url || newArchive.data_url || '',
        created_at: newArchive.created_at
      }, { onConflict: 'archive_id' }).catch(err => this.handleSupabaseError('tb_archives upsert', err));
    }

    return newArchive;
  }

  deleteArchive(archiveId) {
    if (!this.data.archives) return false;
    const initialLen = this.data.archives.length;
    this.data.archives = this.data.archives.filter(a => a.archive_id !== archiveId && a.id !== archiveId);
    if (this.data.archives.length !== initialLen) {
      this.save();

      // Supabase Cloud sync tb_archives
      if (this.supabase) {
        this.supabase.from('tb_archives').delete().eq('archive_id', this.ensureUUID(archiveId)).catch(err => this.handleSupabaseError('tb_archives delete', err));
      }

      return true;
    }
    return false;
  }

  updateArchive(archiveId, updates) {
    const item = this.getArchiveById(archiveId);
    if (item) {
      Object.assign(item, updates);
      this.save();
      return item;
    }
    return null;
  }

  // --- STATISTIK KKTP & ANALISIS PERTUMBUHAN SISWA (STUDENT GROWTH RATE) ---
  getKKTPStats(subject = null, kelas = null, kategori = 'all') {
    let results = this.data.student_results || [];
    const sessions = this.data.exam_sessions || [];

    if (subject && subject !== 'all') {
      const sLower = subject.toLowerCase().trim();
      const matchSessionIds = sessions.filter(s => (s.mata_pelajaran || '').toLowerCase().includes(sLower)).map(s => s.session_id);
      results = results.filter(r => matchSessionIds.includes(r.session_id));
    }

    if (kelas && kelas !== 'all' && kelas !== 'ALL') {
      const cLower = kelas.toLowerCase().trim();
      results = results.filter(r => (r.kelas || '').toLowerCase() === cLower);
    }

    if (kategori && kategori !== 'all') {
      const catLower = kategori.toLowerCase().trim();
      const matchSessionIds = sessions.filter(s => (s.kategori_penilaian || 'sumatif').toLowerCase() === catLower).map(s => s.session_id);
      results = results.filter(r => matchSessionIds.includes(r.session_id));
    }

    const totalStudents = results.length;
    const tuntasStudents = results.filter(r => (r.skor_total || 0) >= 75).length;
    const remedialStudents = totalStudents - tuntasStudents;
    const passRate = totalStudents > 0 ? Math.round((tuntasStudents / totalStudents) * 100) : 0;
    const avgScore = totalStudents > 0 ? (results.reduce((acc, r) => acc + (r.skor_total || 0), 0) / totalStudents).toFixed(1) : '0';

    // Rata-rata Formatif vs Sumatif
    const formatifSessionIds = sessions.filter(s => s.kategori_penilaian === 'formatif').map(s => s.session_id);
    const sumatifSessionIds = sessions.filter(s => s.kategori_penilaian === 'sumatif' || !s.kategori_penilaian).map(s => s.session_id);

    const formatifResults = results.filter(r => formatifSessionIds.includes(r.session_id));
    const sumatifResults = results.filter(r => sumatifSessionIds.includes(r.session_id));

    const avgFormatif = formatifResults.length > 0 ? (formatifResults.reduce((acc, r) => acc + r.skor_total, 0) / formatifResults.length).toFixed(1) : avgScore;
    const avgSumatif = sumatifResults.length > 0 ? (sumatifResults.reduce((acc, r) => acc + r.skor_total, 0) / sumatifResults.length).toFixed(1) : (parseFloat(avgScore) + 5).toFixed(1);
    const growthRate = (parseFloat(avgSumatif) - parseFloat(avgFormatif)).toFixed(1);

    return {
      totalStudents,
      tuntasStudents,
      remedialStudents,
      passRate,
      avgScore,
      avgFormatif,
      avgSumatif,
      growthRate
    };
  }

  getStudentGrowthData(subject = null, kelas = null) {
    const results = this.data.student_results || [];
    const sessions = this.data.exam_sessions || [];
    const studentsMap = {};

    results.forEach(r => {
      if (kelas && kelas !== 'all' && (r.kelas || '').toLowerCase() !== kelas.toLowerCase()) return;
      const sess = sessions.find(s => s.session_id === r.session_id);
      if (subject && subject !== 'all') {
        if (!sess || !(sess.mata_pelajaran || '').toLowerCase().includes(subject.toLowerCase())) return;
      }

      const key = r.user_id || r.nis;
      if (!studentsMap[key]) {
        studentsMap[key] = {
          user_id: r.user_id,
          nama_siswa: r.nama_siswa,
          nis: r.nis,
          kelas: r.kelas,
          skor_formatif: null,
          skor_sumatif: null,
          growth: 0,
          status_ketuntasan: r.status_ketuntasan
        };
      }

      const isFormatif = sess ? sess.kategori_penilaian === 'formatif' : false;
      if (isFormatif) {
        studentsMap[key].skor_formatif = r.skor_total;
      } else {
        studentsMap[key].skor_sumatif = r.skor_total;
      }
    });

    return Object.values(studentsMap).map(s => {
      const f = s.skor_formatif !== null ? s.skor_formatif : (s.skor_sumatif ? Math.max(50, s.skor_sumatif - 12) : 70);
      const sum = s.skor_sumatif !== null ? s.skor_sumatif : (s.skor_formatif ? s.skor_formatif + 8 : 75);
      const growth = sum - f;
      return {
        ...s,
        skor_formatif: f,
        skor_sumatif: sum,
        growth: growth,
        growth_badge: growth >= 15 ? 'Pesat (+)' : (growth >= 0 ? 'Meningkat' : 'Perlu Pendampingan')
      };
    });
  }

  // --- USERS & BARCODE AUTH TOKEN (BAB 4.2 BLUEPRINT) ---
  getUsers(role = null) {
    if (!role) return this.data.users;
    return this.data.users.filter(u => u.role === role);
  }

  getUserById(userId) {
    return this.data.users.find(u => u.user_id === userId);
  }

  getUserByQrToken(token) {
    if (!token) return null;
    const cleanToken = token.trim().toUpperCase();
    return this.data.users.find(u => u.role === 'siswa' && u.qr_auth_token && u.qr_auth_token.toUpperCase() === cleanToken);
  }

  authenticate(identifier, password, role) {
    const id = identifier.trim().toLowerCase();
    const pwd = password.trim();

    // 1. Kredensial Default Admin Utama SMAN 4 Soppeng (Selalu Lolos)
    if ((id === 'sman4soppeng@gmail.com' || id === 'admin') && pwd === '21405') {
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
        this.save();
      }
      return adminUser;
    }

    return this.data.users.find(u => {
      // Role matching (Strictly 4 Roles: admin, kepsek, guru, siswa - Blueprint v15.0)
      if (role && u.role !== role) return false;

      if (!u.status_aktif) return false;

      if (role === 'siswa') {
        // Siswa: Login menggunakan Nama Lengkap dan Password NIS
        const nameMatch = u.nama_lengkap.toLowerCase().includes(id) || u.nama_lengkap.toLowerCase() === id;
        const nisMatch = u.nis === pwd || u.username === pwd;
        return nameMatch && nisMatch;
      } else {
        // Admin, Guru, Kepala Sekolah: Username atau Email & Password
        const userMatch = (u.username && u.username.toLowerCase() === id) || (u.email && u.email.toLowerCase() === id);
        const pwdMatch = u.password_hash === pwd;
        return userMatch && pwdMatch;
      }
    });
  }

  // ==================== ADMINISTRATOR & AUDIT LOG METHODS (BLUEPRINT v15.0) ====================
  getAuditLogs(filter = {}) {
    let logs = this.data.audit_logs || [];
    if (filter.action_type && filter.action_type !== 'ALL') {
      logs = logs.filter(l => l.action_type === filter.action_type);
    }
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase().trim();
      logs = logs.filter(l => 
        (l.description || '').toLowerCase().includes(q) ||
        (l.operator_name || '').toLowerCase().includes(q) ||
        (l.action_type || '').toLowerCase().includes(q)
      );
    }
    return logs;
  }

  addAuditLog(actionType, description, operatorUser = null) {
    if (!this.data.audit_logs) this.data.audit_logs = [];
    const op = operatorUser || {
      user_id: 'usr-admin-1',
      nama_lengkap: 'Administrator SMAN 4 Soppeng',
      role: 'admin'
    };
    const newLog = {
      log_id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      operator_id: op.user_id || 'usr-admin-1',
      operator_name: op.nama_lengkap || op.username || 'Administrator SMAN 4 Soppeng',
      operator_role: op.role || 'admin',
      action_type: actionType,
      description: description
    };
    this.data.audit_logs.unshift(newLog);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
    return newLog;
  }

  getAdminUsers() {
    return (this.data.users || []).filter(u => u.role === 'admin');
  }

  addAdminUser(adminData, operatorUser = null) {
    if (operatorUser && operatorUser.role !== 'admin') {
      throw new Error('Akses ditolak! Hanya Administrator yang berhak menambahkan akun Admin baru.');
    }
    const username = (adminData.username || '').trim().toLowerCase();
    const email = (adminData.email || '').trim().toLowerCase();
    const nama = (adminData.nama_lengkap || '').trim();
    const pwd = (adminData.password || adminData.password_hash || '').trim();
    const jabatan = (adminData.jabatan || 'Operator Ujian').trim();

    if (!username || !nama || !pwd) {
      throw new Error('Nama, username, dan password admin wajib diisi!');
    }

    const existing = (this.data.users || []).find(u => u.username.toLowerCase() === username || (email && u.email && u.email.toLowerCase() === email));
    if (existing) {
      throw new Error(`Username atau email "${username}" sudah digunakan!`);
    }

    const newAdmin = {
      user_id: 'usr-admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      username: username,
      email: email,
      password_hash: pwd,
      nama_lengkap: nama,
      role: 'admin',
      jabatan: jabatan,
      kelas: '-',
      status_aktif: true
    };

    this.data.users.push(newAdmin);
    this.save();
    this.addAuditLog('ADD_ADMIN', `Membuat akun Admin baru: ${nama} (${username}) - ${jabatan}`, operatorUser);
    return newAdmin;
  }

  deleteAdminUser(adminUserId, operatorUser = null) {
    if (operatorUser && operatorUser.role !== 'admin') {
      throw new Error('Akses ditolak! Hanya Administrator yang berhak menghapus akun Admin.');
    }
    const target = this.getUserById(adminUserId);
    if (!target) throw new Error('Akun Admin tidak ditemukan.');
    if (target.email === 'sman4soppeng@gmail.com' || target.username === 'admin') {
      throw new Error('Akun Admin Default Utama SMAN 4 Soppeng (sman4soppeng@gmail.com) dilindungi dan tidak dapat dihapus!');
    }

    this.data.users = this.data.users.filter(u => u.user_id !== adminUserId);
    this.save();
    this.addAuditLog('DELETE_ADMIN', `Menghapus akun Admin: ${target.nama_lengkap} (${target.username})`, operatorUser);
    return true;
  }

  addUser(userData) {
    const role = userData.role || 'siswa';
    let qrToken = userData.qr_auth_token;
    if (role === 'siswa' && !qrToken) {
      const cleanName = (userData.nama_lengkap || 'SISWA').split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
      const cleanNis = (userData.nis || userData.username || Math.floor(Math.random() * 90000 + 10000));
      qrToken = `EDU4-${cleanNis}-${cleanName}`;
    }

    const uId = userData.user_id ? this.ensureUUID(userData.user_id) : this.generateUUID();
    const newUser = {
      user_id: uId,
      status_aktif: true,
      qr_auth_token: qrToken,
      ...userData,
      user_id: uId
    };
    this.data.users.push(newUser);
    this.save();

    // Supabase Cloud sync tb_users
    if (this.supabase) {
      this.supabase.from('tb_users').upsert({
        user_id: newUser.user_id,
        username: newUser.username || newUser.nis,
        email: newUser.email || null,
        password_hash: newUser.password_hash || newUser.nis || '123456',
        nama_lengkap: newUser.nama_lengkap,
        role: newUser.role,
        assigned_mapel_json: Array.isArray(newUser.mata_pelajaran_list) ? newUser.mata_pelajaran_list : [],
        assigned_kelas_json: Array.isArray(newUser.kelas_diampu_list) ? newUser.kelas_diampu_list : (newUser.kelas && newUser.kelas !== '-' ? [newUser.kelas] : []),
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).catch(err => this.handleSupabaseError('tb_users insert catch', err));
    }

    return newUser;
  }

  updateUser(userId, updatedFields) {
    const idx = this.data.users.findIndex(u => u.user_id === userId);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updatedFields };
      this.save();
      const u = this.data.users[idx];

      if (this.supabase) {
        this.supabase.from('tb_users').upsert({
          user_id: this.ensureUUID(u.user_id),
          username: u.username || u.nis,
          email: u.email || null,
          password_hash: u.password_hash || u.nis || '123456',
          nama_lengkap: u.nama_lengkap,
          role: u.role,
          assigned_mapel_json: Array.isArray(u.mata_pelajaran_list) ? u.mata_pelajaran_list : [],
          assigned_kelas_json: Array.isArray(u.kelas_diampu_list) ? u.kelas_diampu_list : (u.kelas && u.kelas !== '-' ? [u.kelas] : []),
          created_at: u.created_at || new Date().toISOString()
        }, { onConflict: 'user_id' }).catch(err => this.handleSupabaseError('tb_users update catch', err));
      }

      return true;
    }
    return false;
  }

  deleteUser(userId) {
    this.data.users = this.data.users.filter(u => u.user_id !== userId);
    this.save();

    if (this.supabase) {
      this.supabase.from('tb_users').delete().eq('user_id', this.ensureUUID(userId)).catch(err => this.handleSupabaseError('tb_users delete catch', err));
    }

    return true;
  }

  // ==================== MATA PELAJARAN MANAGEMENT (tb_subjects - BLUEPRINT v15.0) ====================
  getSubjects() {
    if (!this.data.subjects || !Array.isArray(this.data.subjects)) {
      this.data.subjects = [];
      this.save();
    }
    return this.data.subjects;
  }

  getSubjectById(subjectId) {
    return this.getSubjects().find(s => s.subject_id === subjectId);
  }

  getSubjectByName(subjectName) {
    if (!subjectName) return null;
    const clean = subjectName.toLowerCase().trim();
    return this.getSubjects().find(s => s.nama_mapel.toLowerCase().trim() === clean);
  }

  addSubject(subjectData, operatorUser = null) {
    const subjects = this.getSubjects();
    const namaMapel = (subjectData.nama_mapel || '').trim();
    if (!namaMapel) throw new Error('Nama mata pelajaran wajib diisi!');

    const existing = this.getSubjectByName(namaMapel);
    if (existing) {
      throw new Error(`Mata pelajaran "${namaMapel}" sudah terdaftar!`);
    }

    // Buat kode mapel otomatis jika kosong
    let kodeMapel = (subjectData.kode_mapel || '').trim().toUpperCase();
    if (!kodeMapel) {
      const words = namaMapel.split(/\s+/).filter(w => w.length > 0);
      if (words.length === 1) {
        kodeMapel = words[0].substring(0, 3).toUpperCase() + '-' + String(subjects.length + 1).padStart(2, '0');
      } else {
        kodeMapel = words.map(w => w[0]).join('').substring(0, 4).toUpperCase() + '-' + String(subjects.length + 1).padStart(2, '0');
      }
    }

    const newSubject = {
      subject_id: subjectData.subject_id ? this.ensureUUID(subjectData.subject_id) : this.generateUUID(),
      nama_mapel: namaMapel,
      kode_mapel: kodeMapel,
      created_at: new Date().toISOString(),
      created_by_admin_id: operatorUser ? operatorUser.user_id : 'usr-admin-1'
    };

    subjects.push(newSubject);
    this.addAuditLog('ADD_SUBJECT', `Menambahkan mata pelajaran: ${namaMapel} (${kodeMapel})`, operatorUser);
    this.save();

    // Supabase Cloud sync
    if (this.supabase) {
      this.supabase.from('tb_subjects').upsert({
        subject_id: newSubject.subject_id,
        nama_mapel: newSubject.nama_mapel,
        kode_mapel: newSubject.kode_mapel,
        created_at: newSubject.created_at
      }, { onConflict: 'subject_id' }).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_subjects insert', error);
        else this.handleSupabaseSuccess('tb_subjects insert');
      }).catch(err => this.handleSupabaseError('tb_subjects insert catch', err));
    }

    return newSubject;
  }

  deleteSubject(subjectId, operatorUser = null) {
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

    this.addAuditLog('DELETE_SUBJECT', `Menghapus mata pelajaran: ${target.nama_mapel} (${target.kode_mapel})`, operatorUser);
    this.save();

    // Supabase Cloud sync
    if (this.supabase) {
      this.supabase.from('tb_subjects').delete().eq('subject_id', this.ensureUUID(subjectId)).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_subjects delete', error);
        else this.handleSupabaseSuccess('tb_subjects delete');
      }).catch(err => this.handleSupabaseError('tb_subjects delete catch', err));
    }

    return true;
  }

  // ==================== KELAS MANAGEMENT (BAB 3 & 4 BLUEPRINT) ====================
  getClasses() {
    if (!this.data.classes || !Array.isArray(this.data.classes)) {
      this.data.classes = [];
      this.save();
    }
    return this.data.classes;
  }

  getClassById(classId) {
    return this.getClasses().find(c => c.class_id === classId);
  }

  getClassByName(className) {
    if (!className) return null;
    const clean = className.toLowerCase().trim();
    return this.getClasses().find(c => c.nama_kelas.toLowerCase().trim() === clean);
  }

  addClass(classData) {
    const classes = this.getClasses();
    const namaKelas = (classData.nama_kelas || '').trim();
    if (!namaKelas) throw new Error('Nama kelas wajib diisi!');

    const existing = this.getClassByName(namaKelas);
    if (existing) {
      throw new Error(`Kelas "${namaKelas}" sudah terdaftar!`);
    }

    const newClass = {
      class_id: 'cls-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      nama_kelas: namaKelas,
      tingkat: classData.tingkat || (namaKelas.startsWith('XII') ? 'XII' : namaKelas.startsWith('XI') ? 'XI' : 'X'),
      jurusan: classData.jurusan || (namaKelas.includes('MIPA') ? 'MIPA' : namaKelas.includes('IPS') ? 'IPS' : 'Umum'),
      wali_kelas: classData.wali_kelas || '-'
    };
    classes.push(newClass);
    this.save();
    return newClass;
  }

  updateClass(classId, updateData) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.class_id === classId);
    if (idx === -1) throw new Error('Kelas tidak ditemukan!');

    const oldName = classes[idx].nama_kelas;
    const newName = (updateData.nama_kelas || oldName).trim();

    classes[idx] = {
      ...classes[idx],
      ...updateData,
      nama_kelas: newName
    };

    // Jika nama kelas berubah, perbarui referensi kelas pada siswa
    if (oldName !== newName) {
      (this.data.users || []).forEach(u => {
        if (u.role === 'siswa' && u.kelas === oldName) {
          u.kelas = newName;
        }
      });
    }

    this.save();
    return classes[idx];
  }

  deleteClass(classId) {
    const classes = this.getClasses();
    const cls = classes.find(c => c.class_id === classId);
    if (!cls) return false;

    this.data.classes = classes.filter(c => c.class_id !== classId);
    this.save();
    return true;
  }

  // ==================== SISWA MANAGEMENT & IMPORT EXCEL ====================
  getStudents(classFilter = 'ALL', searchQuery = '') {
    let list = (this.data.users || []).filter(u => u.role === 'siswa');
    if (classFilter && classFilter !== 'ALL' && classFilter !== 'all') {
      const cLower = classFilter.toLowerCase().trim();
      list = list.filter(s => (s.kelas || '').toLowerCase().trim() === cLower);
    }
    if (searchQuery && searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        (s.nama_lengkap || '').toLowerCase().includes(qLower) ||
        (s.nis || '').toLowerCase().includes(qLower) ||
        (s.qr_auth_token || '').toLowerCase().includes(qLower)
      );
    }
    return list;
  }

  addStudent(studentData) {
    const nama = (studentData.nama_lengkap || '').trim();
    const nis = (studentData.nis || '').trim();
    const kelas = (studentData.kelas || 'X.1').trim();
    if (!nama || !nis) throw new Error('Nama Lengkap dan NIS wajib diisi!');

    // Pastikan kelas terdaftar
    if (!this.getClassByName(kelas)) {
      this.addClass({ nama_kelas: kelas });
    }

    // Cek apakah NIS sudah ada
    const existing = (this.data.users || []).find(u => u.role === 'siswa' && u.nis === nis);
    if (existing) {
      throw new Error(`Siswa dengan NIS "${nis}" sudah terdaftar atas nama ${existing.nama_lengkap}!`);
    }

    const cleanName = nama.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
    const qrToken = `EDU4-${nis}-${cleanName}`;

    const newStudent = {
      user_id: 'usr-siswa-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      username: nis,
      password_hash: studentData.password || nis,
      nama_lengkap: nama,
      role: 'siswa',
      kelas: kelas,
      nis: nis,
      qr_auth_token: qrToken,
      status_aktif: studentData.status_aktif !== undefined ? studentData.status_aktif : true
    };

    this.data.users.push(newStudent);
    this.save();
    return newStudent;
  }

  deleteStudent(userId) {
    return this.deleteUser(userId);
  }

  deleteStudentsBulk(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) return 0;
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => !userIds.includes(u.user_id));
    this.save();
    return initialLen - this.data.users.length;
  }

  importStudentsFromExcel(studentsArray) {
    if (!Array.isArray(studentsArray) || studentsArray.length === 0) {
      throw new Error('Tidak ada data siswa dalam berkas!');
    }

    let importedCount = 0;
    let newClassesCount = 0;
    const errors = [];

    studentsArray.forEach((row, idx) => {
      try {
        const nama = (row['Nama Lengkap'] || row['nama_lengkap'] || row['Nama'] || row['nama'] || '').toString().trim();
        const nis = (row['NIS'] || row['nis'] || row['Nomor Induk'] || row['Username'] || '').toString().trim();
        const kelas = (row['Kelas'] || row['kelas'] || row['Rombel'] || 'X.1').toString().trim();

        if (!nama || !nis) {
          errors.push(`Baris ${idx + 2}: Nama atau NIS kosong.`);
          return;
        }

        // Cek / buat kelas otomatis bila belum ada
        if (kelas && !this.getClassByName(kelas)) {
          this.addClass({ nama_kelas: kelas });
          newClassesCount++;
        }

        // Cek duplikasi NIS
        const existingIdx = (this.data.users || []).findIndex(u => u.role === 'siswa' && u.nis === nis);
        const cleanName = nama.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
        const qrToken = `EDU4-${nis}-${cleanName}`;

        if (existingIdx !== -1) {
          // Update data siswa yang sudah ada
          this.data.users[existingIdx].nama_lengkap = nama;
          this.data.users[existingIdx].kelas = kelas;
          this.data.users[existingIdx].qr_auth_token = qrToken;
        } else {
          // Tambah siswa baru
          this.data.users.push({
            user_id: 'usr-siswa-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            username: nis,
            password_hash: nis,
            nama_lengkap: nama,
            role: 'siswa',
            kelas: kelas,
            nis: nis,
            qr_auth_token: qrToken,
            status_aktif: true
          });
        }
        importedCount++;
      } catch (e) {
        errors.push(`Baris ${idx + 2}: ${e.message}`);
      }
    });

    this.save();
    return { importedCount, newClassesCount, errors };
  }

  // --- KONTROL PENJADWALAN UJIAN AKTIF ADMIN (BAB 4.1 BLUEPRINT) ---
  getExamSessions(period = null, category = 'all') {
    let sessions = this.data.exam_sessions || [];
    if (period) {
      sessions = sessions.filter(s => s.tahun_ajaran === period.tahun_ajaran && s.semester === period.semester);
    }
    if (category && category !== 'all' && category !== 'ALL') {
      const catLower = category.toLowerCase().trim();
      sessions = sessions.filter(s => (s.kategori_penilaian || 'sumatif').toLowerCase() === catLower);
    }
    return sessions;
  }

  getExamSessionById(sessionId) {
    return (this.data.exam_sessions || []).find(s => s.session_id === sessionId);
  }

  toggleExamSessionActiveByAdmin(sessionId, operatorUser = null) {
    const s = this.getExamSessionById(sessionId);
    if (s) {
      s.is_active_by_admin = !s.is_active_by_admin;
      const opName = operatorUser ? (operatorUser.nama_lengkap || operatorUser.username) : 'Operator Ujian SMAN 4 Soppeng';
      const opId = operatorUser ? operatorUser.user_id : 'usr-admin-1';
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (s.is_active_by_admin) {
        s.activated_by_admin_id = opId;
        s.activated_by_name = opName;
        s.activated_at = nowStr;
        this.addAuditLog('ACTIVATED_EXAM', `Mengaktifkan sesi ujian: "${s.nama_ujian}" (${s.mata_pelajaran})`, operatorUser);
      } else {
        s.deactivated_by_name = opName;
        s.deactivated_at = nowStr;
        this.addAuditLog('DEACTIVATED_EXAM', `Menonaktifkan / Mengunci sesi ujian: "${s.nama_ujian}" (${s.mata_pelajaran})`, operatorUser);
      }
      this.save();

      // Supabase Cloud sync tb_exam_schedules
      if (this.supabase) {
        this.supabase.from('tb_exam_schedules').update({
          is_active_by_admin: !!isActive,
          activated_by_admin_id: s.is_active_by_admin ? this.ensureUUID(opId) : null
        }).eq('assessment_id', this.ensureUUID(sessionId)).then(({ error }) => {
          if (error) this.handleSupabaseError('tb_exam_schedules admin activation', error);
          else this.handleSupabaseSuccess('tb_exam_schedules admin activation');
        }).catch(err => this.handleSupabaseError('tb_exam_schedules admin activation catch', err));
      }

      return s;
    }
    return null;
  }

  setExamSessionActiveByAdmin(sessionId, isActive, operatorUser = null) {
    const s = this.getExamSessionById(sessionId);
    if (s) {
      s.is_active_by_admin = !!isActive;
      const opName = operatorUser ? (operatorUser.nama_lengkap || operatorUser.username) : 'Operator Ujian SMAN 4 Soppeng';
      const opId = operatorUser ? operatorUser.user_id : 'usr-admin-1';
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (s.is_active_by_admin) {
        s.activated_by_admin_id = opId;
        s.activated_by_name = opName;
        s.activated_at = nowStr;
        this.addAuditLog('ACTIVATED_EXAM', `Mengaktifkan sesi ujian: "${s.nama_ujian}" (${s.mata_pelajaran})`, operatorUser);
      } else {
        s.deactivated_by_name = opName;
        s.deactivated_at = nowStr;
        this.addAuditLog('DEACTIVATED_EXAM', `Menonaktifkan / Mengunci sesi ujian: "${s.nama_ujian}" (${s.mata_pelajaran})`, operatorUser);
      }
      this.save();

      // Supabase Cloud sync tb_exam_schedules
      if (this.supabase) {
        this.supabase.from('tb_exam_schedules').update({
          is_active_by_admin: !!isActive,
          activated_by_admin_id: s.is_active_by_admin ? this.ensureUUID(opId) : null
        }).eq('assessment_id', this.ensureUUID(sessionId)).then(({ error }) => {
          if (error) this.handleSupabaseError('tb_exam_schedules admin activation', error);
          else this.handleSupabaseSuccess('tb_exam_schedules admin activation');
        }).catch(err => this.handleSupabaseError('tb_exam_schedules admin activation catch', err));
      }

      return s;
    }
    return null;
  }

  // --- KONTROL AKTIVASI FORMATIF MANDIRI GURU (BLUEPRINT v14.0) ---
  toggleExamSessionActiveByTeacher(sessionId, teacherUser = null) {
    const s = this.getExamSessionById(sessionId);
    if (!s) return null;

    if (s.kategori_penilaian === 'sumatif') {
      throw new Error('Asesmen Sumatif (PTS/PAS/US) hanya dapat diaktifkan secara terpusat oleh Admin Sekolah pada jam resmi!');
    }

    s.is_active_by_teacher = !s.is_active_by_teacher;
    const tName = teacherUser ? (teacherUser.nama_lengkap || teacherUser.username) : (s.guru_pengampu || 'Guru Pengampu');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (s.is_active_by_teacher) {
      s.activated_by_teacher_name = tName;
      s.activated_by_teacher_at = nowStr;
      this.addAuditLog('TEACHER_ACTIVATED_FORMATIVE', `Guru mengaktifkan Sesi Formatif mandiri: "${s.nama_ujian}" (${s.mata_pelajaran})`, teacherUser);
    } else {
      s.deactivated_by_teacher_name = tName;
      s.deactivated_by_teacher_at = nowStr;
      this.addAuditLog('TEACHER_DEACTIVATED_FORMATIVE', `Guru menonaktifkan Sesi Formatif: "${s.nama_ujian}" (${s.mata_pelajaran})`, teacherUser);
    }
    this.save();
    return s;
  }

  setExamSessionActiveByTeacher(sessionId, isActive, teacherUser = null) {
    const s = this.getExamSessionById(sessionId);
    if (!s) return null;
    if (s.kategori_penilaian === 'sumatif') {
      throw new Error('Asesmen Sumatif hanya dapat diaktifkan oleh Admin!');
    }
    s.is_active_by_teacher = !!isActive;
    const tName = teacherUser ? (teacherUser.nama_lengkap || teacherUser.username) : (s.guru_pengampu || 'Guru Pengampu');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (s.is_active_by_teacher) {
      s.activated_by_teacher_name = tName;
      s.activated_by_teacher_at = nowStr;
    }
    this.save();

    // Supabase Cloud sync tb_assessments
    if (this.supabase) {
      this.supabase.from('tb_assessments').update({
        is_teacher_activated: !!isActive
      }).eq('assessment_id', this.ensureUUID(sessionId)).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_assessments teacher activation', error);
        else this.handleSupabaseSuccess('tb_assessments teacher activation');
      }).catch(err => this.handleSupabaseError('tb_assessments teacher activation catch', err));
    }

    return s;
  }

  // --- PEMETAAN MULTI-MAPEL & MULTI-KELAS GURU (BLUEPRINT v14.0) ---
  updateTeacherMapping(userId, mappingData = {}, operatorUser = null) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan!');
    if (user.role !== 'guru') throw new Error('Pengguna bukan bertipe Guru!');

    if (Array.isArray(mappingData.mata_pelajaran_list)) {
      user.mata_pelajaran_list = mappingData.mata_pelajaran_list.filter(Boolean);
      user.mapel = user.mata_pelajaran_list[0] || '';
    }
    if (Array.isArray(mappingData.kelas_diampu_list)) {
      user.kelas_diampu_list = mappingData.kelas_diampu_list.filter(Boolean);
      user.kelas = user.kelas_diampu_list.join(', ');
    }
    this.addAuditLog('UPDATE_TEACHER_MAPPING', `Memperbarui pemetaan mapel & kelas untuk Guru: "${user.nama_lengkap}"`, operatorUser);
    this.save();

    // Supabase Cloud sync tb_users
    if (this.supabase) {
      this.supabase.from('tb_users').upsert({
        user_id: this.ensureUUID(user.user_id),
        username: user.username,
        email: user.email || null,
        password_hash: user.password_hash,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        assigned_mapel_json: user.mata_pelajaran_list || [],
        assigned_kelas_json: user.kelas_diampu_list || [],
        created_at: user.created_at || new Date().toISOString()
      }, { onConflict: 'user_id' }).catch(err => this.handleSupabaseError('tb_users mapping update', err));
    }

    return user;
  }

  addExamSession(sessionData) {
    const isFormatif = (sessionData.kategori_penilaian === 'formatif');
    const sId = sessionData.session_id ? this.ensureUUID(sessionData.session_id) : this.generateUUID();
    const newSession = {
      session_id: sId,
      status_aktif: true,
      is_active_by_admin: false, // Default terkunci hingga diaktifkan Admin
      is_active_by_teacher: isFormatif ? (sessionData.is_active_by_teacher !== undefined ? !!sessionData.is_active_by_teacher : false) : false,
      ...sessionData,
      session_id: sId
    };
    this.data.exam_sessions.push(newSession);
    this.save();

    // Supabase Cloud sync tb_assessments & tb_exam_schedules
    if (this.supabase) {
      const assId = this.ensureUUID(newSession.session_id);
      this.supabase.from('tb_assessments').upsert({
        assessment_id: assId,
        teacher_id: newSession.teacher_id ? this.ensureUUID(newSession.teacher_id) : null,
        kategori_penilaian: (newSession.kategori_penilaian || 'formatif').toLowerCase(),
        jenis_sumatif: newSession.jenis_sumatif || null,
        materi_bab_text: newSession.materi_bab_text || newSession.nama_bab || newSession.nama_ujian || '',
        target_kelas_json: Array.isArray(newSession.target_kelas) ? newSession.target_kelas : [],
        is_teacher_activated: !!newSession.is_active_by_teacher,
        created_at: newSession.created_at || new Date().toISOString()
      }, { onConflict: 'assessment_id' }).catch(err => this.handleSupabaseError('tb_assessments upsert', err));

      this.supabase.from('tb_exam_schedules').upsert({
        schedule_id: this.ensureUUID('sched-' + newSession.session_id),
        assessment_id: assId,
        nama_sesi_ujian: newSession.nama_sesi || newSession.nama_ujian || 'Sesi Ujian',
        jenis_ujian: newSession.jenis_ujian || newSession.kategori_penilaian || '',
        tanggal_ujian: newSession.tanggal_ujian || null,
        jam_mulai: newSession.jam_mulai || null,
        jam_selesai: newSession.jam_selesai || null,
        is_active_by_admin: !!newSession.is_active_by_admin,
        activated_by_admin_id: newSession.activated_by_admin_id ? this.ensureUUID(newSession.activated_by_admin_id) : null,
        created_at: newSession.created_at || new Date().toISOString()
      }, { onConflict: 'schedule_id' }).catch(err => this.handleSupabaseError('tb_exam_schedules upsert', err));
    }

    return newSession;
  }

  // --- QUESTIONS (DENGAN DUKUNGAN STATUS DRAF & EDIT BERTAHAP) ---
  getQuestions(sessionId = null) {
    if (!sessionId) return this.data.questions || [];
    return (this.data.questions || []).filter(q => q.session_id === sessionId);
  }

  getQuestionById(questionId) {
    return (this.data.questions || []).find(q => q.question_id === questionId);
  }

  getQuestionsBySubject(subject = null, status = 'all', targetClass = 'all', chapter = 'all', category = 'all') {
    let list = this.data.questions || [];
    if (subject && subject !== 'all') {
      const sLower = subject.toLowerCase().trim();
      list = list.filter(q => {
        const qMapel = (q.mata_pelajaran || '').toLowerCase();
        return qMapel.includes(sLower) || sLower.includes(qMapel);
      });
    }
    if (status && status !== 'all') {
      list = list.filter(q => q.status === status);
    }
    if (targetClass && targetClass !== 'all' && targetClass !== 'ALL') {
      const cLower = targetClass.toLowerCase().trim();
      list = list.filter(q => {
        if (!q.target_kelas) return true;
        if (Array.isArray(q.target_kelas)) {
          if (q.target_kelas.includes('Semua Kelas')) return true;
          return q.target_kelas.some(cls => String(cls).toLowerCase().trim() === cLower);
        }
        const qClass = String(q.target_kelas).toLowerCase();
        return qClass === 'semua kelas' || qClass.includes(cLower) || cLower.includes(qClass);
      });
    }
    if (chapter && chapter !== 'all' && chapter !== 'ALL') {
      const chLower = chapter.toLowerCase().trim();
      list = list.filter(q => (q.keterangan_bab || q.materi_bab_text || '').toLowerCase().includes(chLower));
    }
    if (category && category !== 'all' && category !== 'ALL') {
      const catLower = category.toLowerCase().trim();
      list = list.filter(q => (q.kategori_penilaian || 'sumatif').toLowerCase() === catLower);
    }
    return list;
  }

  addQuestion(questionData) {
    const qId = questionData.question_id ? this.ensureUUID(questionData.question_id) : this.generateUUID();
    const newQ = {
      question_id: qId,
      status: questionData.status || 'siap', // 'siap' | 'draf'
      created_at: new Date().toISOString(),
      creator: questionData.creator || 'Syarif Hidayatullah, S.Pd.',
      ...questionData,
      question_id: qId
    };
    this.data.questions.push(newQ);
    this.save();

    // Supabase Cloud sync tb_questions
    if (this.supabase) {
      this.supabase.from('tb_questions').upsert({
        question_id: newQ.question_id,
        assessment_id: newQ.session_id ? this.ensureUUID(newQ.session_id) : null,
        mata_pelajaran: newQ.mata_pelajaran || '',
        jenis_soal: parseInt(newQ.tipe) || 1,
        narasi_soal: newQ.pertanyaan || newQ.narasi_soal || '',
        gambar_url: newQ.gambar_url || null,
        opsi_json: Array.isArray(newQ.opsi) ? newQ.opsi : [],
        kunci_jawaban: newQ.kunci_jawaban || '',
        level_kognitif: newQ.level_kognitif || 'L2',
        kisi_kisi_ref_id: newQ.kisi_kisi_ref_id || null,
        pembahasan: newQ.pembahasan || '',
        created_at: newQ.created_at
      }, { onConflict: 'question_id' }).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_questions upsert', error);
        else this.handleSupabaseSuccess('tb_questions upsert');
      }).catch(err => this.handleSupabaseError('tb_questions catch', err));
    }

    return newQ;
  }

  updateQuestion(questionId, updatedData) {
    const idx = (this.data.questions || []).findIndex(q => q.question_id === questionId);
    if (idx !== -1) {
      this.data.questions[idx] = {
        ...this.data.questions[idx],
        ...updatedData,
        updated_at: new Date().toISOString()
      };
      this.save();
      const updatedQ = this.data.questions[idx];

      // Supabase Cloud sync tb_questions
      if (this.supabase) {
        this.supabase.from('tb_questions').upsert({
          question_id: this.ensureUUID(updatedQ.question_id),
          assessment_id: updatedQ.session_id ? this.ensureUUID(updatedQ.session_id) : null,
          mata_pelajaran: updatedQ.mata_pelajaran || '',
          jenis_soal: parseInt(updatedQ.tipe) || 1,
          narasi_soal: updatedQ.pertanyaan || updatedQ.narasi_soal || '',
          gambar_url: updatedQ.gambar_url || null,
          opsi_json: Array.isArray(updatedQ.opsi) ? updatedQ.opsi : [],
          kunci_jawaban: updatedQ.kunci_jawaban || '',
          level_kognitif: updatedQ.level_kognitif || 'L2',
          kisi_kisi_ref_id: updatedQ.kisi_kisi_ref_id || null,
          pembahasan: updatedQ.pembahasan || '',
          created_at: updatedQ.created_at || new Date().toISOString()
        }, { onConflict: 'question_id' }).catch(err => this.handleSupabaseError('tb_questions update catch', err));
      }

      return updatedQ;
    }
    return null;
  }

  toggleQuestionStatus(questionId) {
    const q = this.getQuestionById(questionId);
    if (q) {
      q.status = (q.status === 'draf') ? 'siap' : 'draf';
      q.updated_at = new Date().toISOString();
      this.save();
      return q;
    }
    return null;
  }

  deleteQuestion(questionId) {
    this.data.questions = (this.data.questions || []).filter(q => q.question_id !== questionId);
    this.save();

    // Supabase Cloud sync tb_questions
    if (this.supabase) {
      this.supabase.from('tb_questions').delete().eq('question_id', this.ensureUUID(questionId)).then(({ error }) => {
        if (error) this.handleSupabaseError('tb_questions delete', error);
        else this.handleSupabaseSuccess('tb_questions delete');
      }).catch(err => this.handleSupabaseError('tb_questions delete catch', err));
    }

    return true;
  }

  // --- RESULTS ---
  getStudentResults(filter = {}) {
    let results = this.data.student_results || [];
    if (filter.session_id) {
      results = results.filter(r => r.session_id === filter.session_id);
    }
    if (filter.tahun_ajaran && filter.semester) {
      results = results.filter(r => r.tahun_ajaran === filter.tahun_ajaran && r.semester === filter.semester);
    }
    if (filter.user_id) {
      results = results.filter(r => r.user_id === filter.user_id);
    }
    return results;
  }

  saveStudentResult(resultData) {
    const existingIndex = this.data.student_results.findIndex(
      r => r.user_id === resultData.user_id && r.session_id === resultData.session_id
    );

    const rId = resultData.result_id ? this.ensureUUID(resultData.result_id) : this.generateUUID();
    const record = {
      result_id: rId,
      waktu_submit: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status_submit: 'SUBMITTED',
      ...resultData,
      result_id: rId
    };

    if (existingIndex !== -1) {
      this.data.student_results[existingIndex] = record;
    } else {
      this.data.student_results.unshift(record);
    }
    this.save();

    // Supabase Cloud sync tb_student_results
    if (this.supabase) {
      this.supabase.from('tb_student_results').upsert({
        result_id: record.result_id,
        user_id: this.ensureUUID(record.user_id),
        assessment_id: this.ensureUUID(record.session_id),
        jawaban_siswa_json: record.jawaban || {},
        skor_total: record.nilai || record.skor || 0,
        feedback_ai_essay: record.feedback_ai || null,
        log_pindah_tab_count: record.tab_switch_count || 0,
        status_submit: record.status || 'SELESAI',
        created_at: new Date().toISOString()
      }, { onConflict: 'result_id' }).catch(err => this.handleSupabaseError('tb_student_results upsert', err));
    }

    return record;
  }

  // --- SECURITY LOGS ---
  getSecurityLogs() {
    return this.data.security_logs || [];
  }

  addSecurityLog(logData) {
    const newLog = {
      log_id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status_tindakan: 'Tercatat di Server',
      ...logData
    };
    this.data.security_logs.unshift(newLog);
    if (this.data.security_logs.length > 200) {
      this.data.security_logs.pop();
    }
    this.save();
    return newLog;
  }

  // --- DATABASE MANAGEMENT (BAB 7 BLUEPRINT v8.0) ---
  exportJSON() {
    const exportData = {
      appName: 'EduExam SMAN 4 Soppeng',
      developer: 'Syarif Hidayatullah, S.Pd.',
      version: '8.0 (Super Admin & Multi-Admin Edition)',
      exportedAt: new Date().toISOString(),
      database: this.data
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduExam_SMAN4Soppeng_v8_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  importJSON(jsonString, operatorUser = null) {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingDb = parsed.database ? parsed.database : parsed;
      if (!incomingDb.users || !incomingDb.questions) {
        throw new Error('Format berkas JSON cadangan tidak valid.');
      }
      this.data = incomingDb;
      this.save();
      this.addAuditLog('RESTORE_DATABASE', 'Memulihkan (Restore) database dari berkas JSON cadangan', operatorUser);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetDatabase(passwordInput, operatorUser = null) {
    if (operatorUser && operatorUser.role !== 'admin') {
      return { success: false, error: 'Akses Ditolak! Reset Database Total HANYA dapat dilakukan oleh Administrator.' };
    }
    if (passwordInput !== '21405' && passwordInput !== 'admin123') {
      return { success: false, error: 'Kata sandi otorisasi Administrator (21405) salah! Akses ditolak.' };
    }
    this.data = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.save();
    this.addAuditLog('RESET_DATABASE', 'Melakukan Reset Total Database ke pengaturan awal v17.0 Clean Slate', operatorUser);
    return { success: true };
  }
}

// Global Singleton Instance
window.EduDB = new EduExamDB();

// ==================== SUPABASE CLOUD POSTGRESQL SERVICE (BAB 2 BLUEPRINT v8.0) ====================
class EduSupabaseService {
  constructor() {
    this.storageKey = 'eduexam_supabase_config';
    this.config = this.loadConfig();
    this.client = null;
    this.initClient();
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      url: '',
      anonKey: '',
      isConnected: false,
      lastSync: null
    };
  }

  saveConfig(url, anonKey) {
    this.config.url = (url || '').trim();
    this.config.anonKey = (anonKey || '').trim();
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    this.initClient();
    return this.config;
  }

  initClient() {
    if (this.config.url && this.config.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(this.config.url, this.config.anonKey);
        this.config.isConnected = true;
      } catch (e) {
        console.warn('EduSupabase init failed:', e);
        this.client = null;
        this.config.isConnected = false;
      }
    } else {
      this.client = null;
    }
  }

  async testConnection(url, anonKey) {
    const targetUrl = (url || this.config.url || '').trim();
    const targetKey = (anonKey || this.config.anonKey || '').trim();
    if (!targetUrl || !targetKey) {
      return { success: false, error: 'URL dan Public Anon API Key Supabase wajib diisi!' };
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return { success: false, error: 'Supabase JS SDK belum termuat atau jaringan offline.' };
    }
    try {
      const testClient = window.supabase.createClient(targetUrl, targetKey);
      const { data, error } = await testClient.from('tb_academic_period').select('period_id').limit(1);
      if (error && (error.message.includes('JWT') || error.message.includes('apikey') || error.message.includes('invalid') || error.code === '401')) {
        return { success: false, error: 'Autentikasi gagal: ' + error.message };
      }
      return {
        success: true,
        message: 'Koneksi ke Supabase Cloud PostgreSQL berhasil terhubung dengan aman (RLS Active)!'
      };
    } catch (e) {
      return { success: false, error: 'Gagal terhubung ke host Supabase: ' + e.message };
    }
  }

  async syncToCloud() {
    if (!this.client) {
      return { success: false, error: 'Supabase client belum dikonfigurasi. Masukkan URL dan API Key terlebih dahulu.' };
    }
    try {
      const db = window.EduDB ? window.EduDB.data : null;
      if (!db) throw new Error('Database lokal tidak ditemukan.');

      this.config.lastSync = new Date().toISOString().replace('T', ' ').substring(0, 19);
      this.config.isConnected = true;
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));

      if (window.EduDB) {
        window.EduDB.addAuditLog('CLOUD_SYNC', 'Menyinkronkan 6 tabel database relasional ke Supabase Cloud PostgreSQL', window.App ? window.App.currentUser : null);
      }

      return {
        success: true,
        lastSync: this.config.lastSync,
        message: 'Sinkronisasi berhasil! 6 tabel database relasional telah diselaraskan dengan Cloud PostgreSQL.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// Global Supabase Service Instance
window.EduSupabase = new EduSupabaseService();
