import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import supabase, { SUPABASE_URL } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Ganjil');
  const [supabaseStatus, setSupabaseStatus] = useState('Menghubungkan...');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'classes', 'subjects', 'users', 'questions', 'exam_sim', 'results'
  const [toasts, setToasts] = useState([]);

  // Cloud State (Fetched Directly from Supabase Cloud Database)
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form States
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('X');
  const [newClassMajor, setNewClassMajor] = useState('MIPA');
  const [newClassWali, setNewClassWali] = useState('');

  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');

  const [newUserName, setNewUserName] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('guru');

  // Modal Pemetaan Guru
  const [mappingUser, setMappingUser] = useState(null);
  const [mappedSubjects, setMappedSubjects] = useState([]);
  const [mappedClasses, setMappedClasses] = useState([]);

  // Form Bank Soal
  const [qSubject, setQSubject] = useState('');
  const [qType, setQType] = useState('1'); // 1: PG, 2: PGK, 3: B/S, 4: Jodohkan, 5: Essay
  const [qNarrative, setQNarrative] = useState('');
  const [qOptionA, setQOptionA] = useState('');
  const [qOptionB, setQOptionB] = useState('');
  const [qOptionC, setQOptionC] = useState('');
  const [qOptionD, setQOptionD] = useState('');
  const [qKey, setQKey] = useState('A');
  const [qLevel, setQLevel] = useState('L2');

  // Exam Simulation (Simpan Jawaban Siswa ke Cloud)
  const [simAnswer, setSimAnswer] = useState('');
  const [selectedExamQuestionId, setSelectedExamQuestionId] = useState('');

  // Toast Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ==================== 1. FETCH DIRECTLY FROM SUPABASE ON MOUNT ====================
  const fetchAllData = async () => {
    if (!supabase) return;
    setLoadingData(true);
    try {
      // 1. Fetch Classes
      let activeClasses = [];
      const { data: clsData, error: clsErr } = await supabase
        .from('tb_classes')
        .select('*')
        .order('nama_kelas', { ascending: true });
      if (!clsErr && Array.isArray(clsData) && clsData.length > 0) {
        activeClasses = clsData;
        setClasses(clsData);
      }

      // 2. Fetch Subjects
      const { data: subData, error: subErr } = await supabase
        .from('tb_subjects')
        .select('*')
        .order('nama_mapel', { ascending: true });
      if (!subErr && Array.isArray(subData)) {
        setSubjects(subData);
        if (subData.length > 0 && !qSubject) {
          setQSubject(subData[0].nama_mapel);
        }
      }

      // 3. Fetch Users
      const { data: usrData, error: usrErr } = await supabase
        .from('tb_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (!usrErr && Array.isArray(usrData)) {
        setUsers(usrData);
        // Fallback multi-perangkat: Jika tb_classes kosong, ambil dari admin assigned_kelas_json
        if (activeClasses.length === 0) {
          const adminUser = usrData.find((u) => u.role === 'admin');
          if (adminUser && Array.isArray(adminUser.assigned_kelas_json) && adminUser.assigned_kelas_json.length > 0) {
            setClasses(adminUser.assigned_kelas_json);
          }
        }
      }

      // 4. Fetch Questions
      const { data: qData, error: qErr } = await supabase
        .from('tb_questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!qErr && Array.isArray(qData)) {
        setQuestions(qData);
        if (qData.length > 0 && !selectedExamQuestionId) {
          setSelectedExamQuestionId(qData[0].question_id);
        }
      }

      // 5. Fetch Student Results
      const { data: resData, error: resErr } = await supabase
        .from('tb_student_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!resErr && Array.isArray(resData)) {
        setResults(resData);
      }

      setSupabaseStatus('Terhubung (Realtime)');
    } catch (err) {
      console.warn('Supabase fetch error:', err);
      setSupabaseStatus('Mode Offline');
    } finally {
      setLoadingData(false);
    }
  };

  // ==================== 2. REALTIME MULTI-DEVICE SYNCHRONIZATION ====================
  useEffect(() => {
    // Sesi login lokal
    try {
      const savedSession = localStorage.getItem('eduexam_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.user_id) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {}

    // Fetch awal data cloud
    fetchAllData();

    // Setup Supabase Realtime Channels (Laptop <-> HP <-> Tablet)
    if (!supabase) return;

    const channel = supabase
      .channel('eduexam-cross-device-sync')
      // A. Realtime tb_classes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_classes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setClasses((prev) => {
            if (prev.some((c) => c.class_id === payload.new.class_id || c.nama_kelas === payload.new.nama_kelas)) return prev;
            return [...prev, payload.new].sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));
          });
          showToast(`⚡ Kelas "${payload.new.nama_kelas}" masuk dari perangkat lain!`, 'success');
        } else if (payload.eventType === 'UPDATE') {
          setClasses((prev) => prev.map((c) => (c.class_id === payload.new.class_id ? payload.new : c)));
          showToast(`⚡ Kelas "${payload.new.nama_kelas}" diperbarui secara realtime.`, 'info');
        } else if (payload.eventType === 'DELETE') {
          setClasses((prev) => prev.filter((c) => c.class_id !== payload.old.class_id));
          showToast('⚡ Sebuah kelas dihapus oleh operator lain.', 'warning');
        }
      })
      // B. Realtime tb_subjects
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_subjects' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSubjects((prev) => {
            if (prev.some((s) => s.subject_id === payload.new.subject_id || s.nama_mapel === payload.new.nama_mapel)) return prev;
            return [...prev, payload.new].sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));
          });
          showToast(`⚡ Mata Pelajaran "${payload.new.nama_mapel}" disinkronkan dari cloud!`, 'success');
        } else if (payload.eventType === 'DELETE') {
          setSubjects((prev) => prev.filter((s) => s.subject_id !== payload.old.subject_id));
          showToast('⚡ Mata pelajaran dihapus secara realtime.', 'warning');
        }
      })
      // C. Realtime tb_users
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setUsers((prev) => {
            if (prev.some((u) => u.user_id === payload.new.user_id || u.username === payload.new.username)) return prev;
            return [payload.new, ...prev];
          });
          showToast(`⚡ Pengguna baru "${payload.new.nama_lengkap}" disinkronkan!`, 'success');
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new && payload.new.role === 'admin' && Array.isArray(payload.new.assigned_kelas_json)) {
            setClasses(payload.new.assigned_kelas_json);
          }
          setUsers((prev) => prev.map((u) => (u.user_id === payload.new.user_id ? payload.new : u)));
          showToast(`⚡ Pemetaan/Status "${payload.new.nama_lengkap}" diperbarui!`, 'info');
        } else if (payload.eventType === 'DELETE') {
          setUsers((prev) => prev.filter((u) => u.user_id !== payload.old.user_id));
          showToast('⚡ Pengguna dihapus dari perangkat lain.', 'warning');
        }
      })
      // D. Realtime tb_questions
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_questions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setQuestions((prev) => [payload.new, ...prev]);
          showToast(`⚡ Butir soal baru (${payload.new.mata_pelajaran}) diterima di perangkat ini!`, 'success');
        } else if (payload.eventType === 'DELETE') {
          setQuestions((prev) => prev.filter((q) => q.question_id !== payload.old.question_id));
          showToast('⚡ Butir soal dihapus.', 'warning');
        }
      })
      // E. Realtime tb_student_results
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_student_results' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setResults((prev) => [payload.new, ...prev.filter((r) => r.result_id !== payload.new.result_id)]);
          showToast(`⚡ Jawaban siswa baru tersimpan ke Cloud Supabase! Skor: ${payload.new.skor_total || 0}`, 'info');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSupabaseStatus('Terhubung (Realtime)');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==================== 3. DIRECT CLOUD PERSISTENCE OPERATIONS ====================

  // A. Tambah Kelas
  const handleAddClass = async (e) => {
    e.preventDefault();
    const cleanName = newClassName.trim().toUpperCase();
    if (!cleanName) {
      showToast('Nama kelas wajib diisi!', 'warning');
      return;
    }

    try {
      const newClassObj = {
        class_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cls-' + Date.now(),
        nama_kelas: cleanName,
        tingkat: newClassLevel,
        jurusan: newClassMajor,
        wali_kelas: newClassWali.trim() || '-',
        created_at: new Date().toISOString()
      };

      // 1. Dedicated tb_classes insert
      supabase.from('tb_classes').insert([newClassObj]).catch(() => {});

      // 2. High-reliability cross-device cloud persistence via admin user
      const nextClasses = [...classes.filter((c) => c.nama_kelas !== cleanName), newClassObj].sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));
      setClasses(nextClasses);
      await supabase.from('tb_users').update({ assigned_kelas_json: nextClasses }).eq('role', 'admin');

      showToast(`✅ Kelas "${cleanName}" berhasil disimpan ke Cloud!`, 'success');
      setNewClassName('');
      setNewClassWali('');
    } catch (err) {
      showToast('Gagal koneksi cloud: ' + err.message, 'error');
    }
  };

  // Hapus Kelas
  const handleDeleteClass = async (class_id, nama_kelas) => {
    if (!confirm(`Hapus kelas "${nama_kelas}" dari Cloud Supabase?`)) return;
    try {
      supabase.from('tb_classes').delete().eq('class_id', class_id).catch(() => {});
      supabase.from('tb_classes').delete().eq('nama_kelas', nama_kelas).catch(() => {});

      const nextClasses = classes.filter((c) => c.class_id !== class_id && c.nama_kelas !== nama_kelas);
      setClasses(nextClasses);
      await supabase.from('tb_users').update({ assigned_kelas_json: nextClasses }).eq('role', 'admin');

      showToast(`Kelas "${nama_kelas}" berhasil dihapus dari cloud!`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // B. Tambah Mapel
  const handleAddSubject = async (e) => {
    e.preventDefault();
    const cleanName = newSubjName.trim();
    if (!cleanName) {
      showToast('Nama mata pelajaran wajib diisi!', 'warning');
      return;
    }

    const code = newSubjCode.trim().toUpperCase() || cleanName.substring(0, 3).toUpperCase() + '-01';
    try {
      const { data, error } = await supabase
        .from('tb_subjects')
        .insert([{ nama_mapel: cleanName, kode_mapel: code }])
        .select();

      if (error) {
        showToast('Gagal menambah mapel: ' + error.message, 'error');
      } else {
        if (data && data.length > 0) {
          setSubjects((prev) => [...prev, data[0]].sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel)));
        }
        showToast(`✅ Mata Pelajaran "${cleanName}" tersimpan ke Supabase Cloud!`, 'success');
        setNewSubjName('');
        setNewSubjCode('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Hapus Mapel
  const handleDeleteSubject = async (subject_id, nama_mapel) => {
    if (!confirm(`Hapus mata pelajaran "${nama_mapel}"?`)) return;
    try {
      const { error } = await supabase.from('tb_subjects').delete().eq('subject_id', subject_id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        setSubjects((prev) => prev.filter((s) => s.subject_id !== subject_id));
        showToast(`Mata pelajaran "${nama_mapel}" dihapus.`, 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // C. Tambah User
  const handleAddUser = async (e) => {
    e.preventDefault();
    const username = newUserName.trim();
    const nama_lengkap = newUserFullName.trim();
    const password_hash = newUserPassword.trim();

    if (!username || !nama_lengkap || !password_hash) {
      showToast('Lengkapi Username, Nama Lengkap, dan Kata Sandi!', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tb_users')
        .insert([
          {
            username,
            nama_lengkap,
            email: newUserEmail.trim() || null,
            password_hash,
            role: newUserRole,
            assigned_mapel_json: newUserRole === 'guru' ? (subjects.length > 0 ? [subjects[0].nama_mapel] : []) : [],
            assigned_kelas_json: newUserRole === 'guru' ? (classes.length > 0 ? [classes[0].nama_kelas] : []) : []
          }
        ])
        .select();

      if (error) {
        showToast('Gagal menambah user: ' + error.message, 'error');
      } else {
        if (data && data.length > 0) {
          setUsers((prev) => [data[0], ...prev]);
        }
        showToast(`✅ Pengguna "${nama_lengkap}" (${newUserRole.toUpperCase()}) berhasil didaftarkan ke Cloud!`, 'success');
        setNewUserName('');
        setNewUserFullName('');
        setNewUserEmail('');
        setNewUserPassword('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Hapus User
  const handleDeleteUser = async (user_id, nama_lengkap) => {
    if (nama_lengkap === 'Administrator SMAN 4 Soppeng') {
      alert('Akun Administrator Utama tidak boleh dihapus demi keamanan!');
      return;
    }
    if (!confirm(`Hapus akun pengguna "${nama_lengkap}" dari Supabase?`)) return;

    try {
      const { error } = await supabase.from('tb_users').delete().eq('user_id', user_id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        setUsers((prev) => prev.filter((u) => u.user_id !== user_id));
        showToast(`Pengguna "${nama_lengkap}" berhasil dihapus.`, 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Simpan Pemetaan Guru (Mapel & Kelas) Langsung ke Cloud
  const handleSaveTeacherMapping = async () => {
    if (!mappingUser) return;
    if (mappedSubjects.length === 0) {
      showToast('Pilih minimal 1 mata pelajaran!', 'warning');
      return;
    }
    if (mappedClasses.length === 0) {
      showToast('Pilih minimal 1 kelas yang diampu!', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tb_users')
        .update({
          assigned_mapel_json: mappedSubjects,
          assigned_kelas_json: mappedClasses
        })
        .eq('user_id', mappingUser.user_id)
        .select();

      if (error) {
        showToast('Gagal simpan pemetaan: ' + error.message, 'error');
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === mappingUser.user_id
              ? { ...u, assigned_mapel_json: mappedSubjects, assigned_kelas_json: mappedClasses }
              : u
          )
        );
        showToast(`✅ Pemetaan Guru "${mappingUser.nama_lengkap}" berhasil diperbarui di Cloud!`, 'success');
        setMappingUser(null);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // D. Tambah Bank Soal Langsung ke Supabase Cloud
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!qNarrative.trim()) {
      showToast('Narasi soal tidak boleh kosong!', 'warning');
      return;
    }
    const currentSubj = qSubject || (subjects.length > 0 ? subjects[0].nama_mapel : 'Fisika Terapan & Energi Mandiri');

    const opsi = [
      { key: 'A', text: qOptionA.trim() || 'Opsi A' },
      { key: 'B', text: qOptionB.trim() || 'Opsi B' },
      { key: 'C', text: qOptionC.trim() || 'Opsi C' },
      { key: 'D', text: qOptionD.trim() || 'Opsi D' }
    ];

    try {
      const { data, error } = await supabase
        .from('tb_questions')
        .insert([
          {
            mata_pelajaran: currentSubj,
            jenis_soal: parseInt(qType),
            narasi_soal: qNarrative.trim(),
            opsi_json: opsi,
            kunci_jawaban: qKey,
            level_kognitif: qLevel
          }
        ])
        .select();

      if (error) {
        showToast('Gagal simpan soal: ' + error.message, 'error');
      } else {
        if (data && data.length > 0) {
          setQuestions((prev) => [data[0], ...prev]);
        }
        showToast(`✅ Butir soal ${currentSubj} tersimpan di Supabase Cloud!`, 'success');
        setQNarrative('');
        setQOptionA('');
        setQOptionB('');
        setQOptionC('');
        setQOptionD('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Hapus Soal
  const handleDeleteQuestion = async (question_id) => {
    if (!confirm('Hapus butir soal ini dari Supabase Cloud?')) return;
    try {
      const { error } = await supabase.from('tb_questions').delete().eq('question_id', question_id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        setQuestions((prev) => prev.filter((q) => q.question_id !== question_id));
        showToast('Soal berhasil dihapus dari cloud.', 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // E. Simpan Jawaban Siswa / Submit Ujian Langsung ke Supabase
  const handleSubmitExamAnswer = async (e) => {
    e.preventDefault();
    if (!simAnswer.trim()) {
      showToast('Pilih atau ketik jawaban sebelum mengirim!', 'warning');
      return;
    }

    const studentUser = currentUser || { user_id: '00000000-0000-0000-0000-000000000001', nama_lengkap: 'Siswa Uji Coba' };
    const qObj = questions.find((q) => q.question_id === selectedExamQuestionId) || questions[0];
    const isCorrect = qObj && qObj.kunci_jawaban && qObj.kunci_jawaban.toUpperCase() === simAnswer.trim().toUpperCase();
    const finalScore = isCorrect ? 100 : 25;

    try {
      const { data, error } = await supabase
        .from('tb_student_results')
        .insert([
          {
            user_id: studentUser.user_id,
            jawaban_siswa_json: {
              [selectedExamQuestionId || 'soal-1']: simAnswer.trim(),
              soal_ref: qObj ? qObj.narasi_soal : 'Simulasi Ujian',
              nama_siswa: studentUser.nama_lengkap
            },
            skor_total: finalScore,
            status_submit: 'SELESAI'
          }
        ])
        .select();

      if (error) {
        showToast('Gagal submit jawaban ke cloud: ' + error.message, 'error');
      } else {
        if (data && data.length > 0) {
          setResults((prev) => [data[0], ...prev]);
        }
        showToast(`✅ Jawaban siswa tersimpan di Cloud Supabase! Skor: ${finalScore} poin.`, 'success');
        setSimAnswer('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eduexam_auth_session');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* ==================== FLOATING REALTIME TOASTS ==================== */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
              t.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : t.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : t.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-blue-900 text-blue-100 border-blue-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <i
                className={`fa-solid ${
                  t.type === 'success'
                    ? 'fa-circle-check text-emerald-400'
                    : t.type === 'error'
                    ? 'fa-circle-exclamation text-rose-400'
                    : t.type === 'warning'
                    ? 'fa-triangle-exclamation text-amber-400'
                    : 'fa-bolt text-teal-400'
                }`}
              ></i>
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-white/60 hover:text-white"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ))}
      </div>

      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & School Title */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <img
              src="/logo-eduexam.png"
              alt="Logo EduExam SMAN 4 Soppeng"
              className="h-12 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'assets/logo.png';
              }}
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-blue-900 leading-tight">
                EduExam SMAN 4 Soppeng
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold hidden xs:block">
                Server Supabase Otomatis 100% &bull; Multi-Perangkat (HP, Laptop, Tablet)
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Supabase Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline text-slate-600">Supabase:</span>
              <span className="text-emerald-700 font-bold">{supabaseStatus}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAllData}
              disabled={loadingData}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition cursor-pointer"
              title="Sinkronkan Ulang Data Cloud Sekarang"
            >
              <i className={`fa-solid fa-arrows-rotate ${loadingData ? 'fa-spin text-teal-600' : ''}`}></i>
            </button>

            {/* User Profile or Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight flex items-center justify-end gap-1.5">
                    {currentUser.nama_lengkap}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">{currentUser.email || currentUser.username}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {currentUser.nama_lengkap ? currentUser.nama_lengkap.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Keluar Akun"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* ==================== GLOBAL SUB-HEADER ==================== */}
      <section className="bg-blue-950 text-white border-b border-blue-900 px-4 sm:px-6 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span className="font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <i className="fa-solid fa-calendar-days"></i> Periode Akademik:
            </span>

            {/* Selector Tahun Ajaran */}
            <div className="flex items-center gap-1.5">
              <span className="text-blue-200 text-[11px]">Tahun Ajaran:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="bg-blue-900/80 text-white text-xs font-semibold rounded-lg px-2.5 py-1 border border-blue-700 cursor-pointer"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2026/2027">2026/2027</option>
              </select>
            </div>

            {/* Selector Semester */}
            <div className="flex items-center gap-1.5">
              <span className="text-blue-200 text-[11px]">Semester:</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="bg-blue-900/80 text-white text-xs font-semibold rounded-lg px-2.5 py-1 border border-blue-700 cursor-pointer"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-teal-300 text-[11px] font-mono">
            <i className="fa-solid fa-cloud-arrow-up"></i>
            <span>Cloud Host: {SUPABASE_URL.replace('https://', '')}</span>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1">
        {!currentUser ? (
          <Login onLoginSuccess={(user) => setCurrentUser(user)} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'dashboard' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-gauge-high text-teal-400"></i> Ringkasan Cloud
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'classes' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-chalkboard text-teal-400"></i> Manajemen Kelas ({classes.length})
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'subjects' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-book-open text-teal-400"></i> Mata Pelajaran ({subjects.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'users' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-users-gear text-purple-400"></i> Pengguna &amp; Guru ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'questions' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-file-circle-question text-amber-400"></i> Bank Soal ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab('exam_sim')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'exam_sim' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-pencil text-emerald-400"></i> Ruang Ujian Siswa
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'results' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-square-poll-vertical text-teal-400"></i> Hasil Ujian ({results.length})
              </button>
            </div>

            {/* TAB 1: DASHBOARD RINGKASAN */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Banner Banner Informasi */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-700 text-teal-300 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-2">
                      <i className="fa-solid fa-shield-halved"></i> Cloud Database Relasional Aktif
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                      EduExam SMAN 4 Soppeng (v17.0)
                    </h1>
                    <p className="text-blue-200 text-xs sm:text-sm mt-1">
                      Selamat datang, <strong>{currentUser.nama_lengkap}</strong> ({currentUser.role.toUpperCase()}).
                      Seluruh data tersimpan otomatis di PostgreSQL Supabase Cloud dan disinkronkan real-time ke semua perangkat.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchAllData}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-cloud-arrow-down"></i> Muat Ulang Cloud
                    </button>
                  </div>
                </div>

                {/* 4 Cards Ringkasan */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Total Kelas</span>
                      <span className="text-2xl font-black text-blue-900">{classes.length}</span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg">
                      <i className="fa-solid fa-chalkboard"></i>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Mata Pelajaran</span>
                      <span className="text-2xl font-black text-teal-800">{subjects.length}</span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg">
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Total Pengguna</span>
                      <span className="text-2xl font-black text-purple-900">{users.length}</span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg">
                      <i className="fa-solid fa-users"></i>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Butir Bank Soal</span>
                      <span className="text-2xl font-black text-amber-600">{questions.length}</span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
                      <i className="fa-solid fa-file-circle-question"></i>
                    </div>
                  </div>
                </div>

                {/* Perangkat & Realtime State Status */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-mobile-screen-button text-teal-600"></i> Status Multi-Perangkat (HP, Laptop, Tablet)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Data yang ditambahkan atau diedit di laptop ini akan langsung tampil di HP dan tablet tanpa perlu konfigurasi manual atau reload halaman.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <i className="fa-solid fa-laptop"></i>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Laptop / PC Operator</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">Tersambung Cloud</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <i className="fa-solid fa-mobile-screen"></i>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Smartphone Guru / Siswa</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">Auto-Sync Realtime</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <i className="fa-solid fa-tablet-screen-button"></i>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Tablet Pengawas / Kepsek</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">Auto-Sync Realtime</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANAJEMEN KELAS */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-plus-circle text-blue-900"></i> Tambah Kelas Baru (Langsung ke Cloud Supabase)
                  </h3>
                  <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Kelas (Rombel):</label>
                      <input
                        type="text"
                        required
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Contoh: XII MIPA 1"
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tingkat:</label>
                      <select
                        value={newClassLevel}
                        onChange={(e) => setNewClassLevel(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                      >
                        <option value="X">Kelas X</option>
                        <option value="XI">Kelas XI</option>
                        <option value="XII">Kelas XII</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Wali Kelas (Opsional):</label>
                      <input
                        type="text"
                        value={newClassWali}
                        onChange={(e) => setNewClassWali(e.target.value)}
                        placeholder="Nama Wali Kelas"
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-floppy-disk"></i> Simpan Kelas
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-teal-600"></i> Daftar Kelas Terdaftar ({classes.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Nama Kelas</th>
                          <th className="py-3 px-4">Tingkat</th>
                          <th className="py-3 px-4">Jurusan</th>
                          <th className="py-3 px-4">Wali Kelas</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classes.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-6 text-slate-400">
                              Belum ada kelas terdaftar. Tambahkan kelas melalui formulir di atas.
                            </td>
                          </tr>
                        ) : (
                          classes.map((c) => (
                            <tr key={c.class_id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-900">{c.nama_kelas}</td>
                              <td className="py-3 px-4 font-semibold">{c.tingkat}</td>
                              <td className="py-3 px-4">{c.jurusan || '-'}</td>
                              <td className="py-3 px-4">{c.wali_kelas || '-'}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteClass(c.class_id, c.nama_kelas)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                  title="Hapus Kelas"
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MANAJEMEN MATA PELAJARAN */}
            {activeTab === 'subjects' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-plus-circle text-teal-700"></i> Tambah Mata Pelajaran Baru
                  </h3>
                  <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Mata Pelajaran:</label>
                      <input
                        type="text"
                        required
                        value={newSubjName}
                        onChange={(e) => setNewSubjName(e.target.value)}
                        placeholder="Contoh: Fisika Terapan & Energi"
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kode Mapel (Opsional):</label>
                      <input
                        type="text"
                        value={newSubjCode}
                        onChange={(e) => setNewSubjCode(e.target.value)}
                        placeholder="Contoh: FIS-01"
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-plus"></i> Tambah Mapel
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-book text-teal-600"></i> Daftar Mata Pelajaran ({subjects.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Nama Mapel</th>
                          <th className="py-3 px-4">Kode Mapel</th>
                          <th className="py-3 px-4">Guru Pengampu</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subjects.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-6 text-slate-400">
                              Belum ada mata pelajaran terdaftar.
                            </td>
                          </tr>
                        ) : (
                          subjects.map((s) => {
                            const teachersForSubj = users.filter((u) => {
                              const list = Array.isArray(u.assigned_mapel_json) ? u.assigned_mapel_json : [];
                              return list.some((m) => m.toLowerCase().trim() === s.nama_mapel.toLowerCase().trim());
                            });

                            return (
                              <tr key={s.subject_id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-900">{s.nama_mapel}</td>
                                <td className="py-3 px-4 font-mono font-semibold text-teal-700">{s.kode_mapel}</td>
                                <td className="py-3 px-4">
                                  {teachersForSubj.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {teachersForSubj.map((t) => (
                                        <span key={t.user_id} className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px]">
                                          {t.nama_lengkap}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">Belum ada guru</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleDeleteSubject(s.subject_id, s.nama_mapel)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                  >
                                    <i className="fa-regular fa-trash-can"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MANAJEMEN PENGGUNA & PENUGASAN GURU */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-user-plus text-purple-700"></i> Buat Akun Pengguna Baru
                  </h3>
                  <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Peran (Role):</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                      >
                        <option value="guru">Guru Mapel</option>
                        <option value="siswa">Siswa</option>
                        <option value="kepsek">Kepala Sekolah</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                      <input
                        type="text"
                        required
                        value={newUserFullName}
                        onChange={(e) => setNewUserFullName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Username / NIS:</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Username unik"
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kata Sandi:</label>
                      <input
                        type="password"
                        required
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Kata sandi"
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-xl font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-user-plus"></i> Tambah User
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-users text-purple-600"></i> Daftar Akun Pengguna ({users.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Nama Lengkap</th>
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Penugasan (Guru)</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => {
                          const isGuru = u.role === 'guru';
                          const teacherSubs = Array.isArray(u.assigned_mapel_json) ? u.assigned_mapel_json : [];
                          const teacherClasses = Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json : [];

                          return (
                            <tr key={u.user_id} className="hover:bg-slate-50">
                              <td className="py-3.5 px-4 font-bold text-slate-900">{u.nama_lengkap}</td>
                              <td className="py-3.5 px-4 font-mono">{u.username}</td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    u.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800'
                                      : u.role === 'guru'
                                      ? 'bg-teal-100 text-teal-800'
                                      : u.role === 'siswa'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {isGuru ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-teal-800 font-semibold">
                                      Mapel: {teacherSubs.length > 0 ? teacherSubs.join(', ') : 'Belum dipetakan'}
                                    </span>
                                    <span className="text-[10px] text-blue-800 font-semibold">
                                      Kelas: {teacherClasses.length > 0 ? teacherClasses.join(', ') : 'Belum dipetakan'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-1">
                                {isGuru && (
                                  <button
                                    onClick={() => {
                                      setMappingUser(u);
                                      setMappedSubjects(teacherSubs);
                                      setMappedClasses(teacherClasses);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-teal-800 bg-teal-100 hover:bg-teal-200 font-bold text-xs inline-flex items-center gap-1 transition"
                                  >
                                    <i className="fa-solid fa-chalkboard-user"></i> Petakan
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(u.user_id, u.nama_lengkap)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL PEMETAAN GURU */}
                {mappingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <h4 className="font-bold text-sm text-slate-800">
                          Pemetaan Multi-Mapel &amp; Multi-Kelas: {mappingUser.nama_lengkap}
                        </h4>
                        <button onClick={() => setMappingUser(null)} className="text-slate-400 hover:text-slate-700">
                          <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                      </div>

                      {/* Checkboxes Mapel */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Mata Pelajaran yang Diampu:</label>
                        <div className="max-h-36 overflow-y-auto space-y-1 p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                          {subjects.map((s) => (
                            <label key={s.subject_id} className="flex items-center gap-2 p-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={mappedSubjects.includes(s.nama_mapel)}
                                onChange={(e) => {
                                  if (e.target.checked) setMappedSubjects([...mappedSubjects, s.nama_mapel]);
                                  else setMappedSubjects(mappedSubjects.filter((x) => x !== s.nama_mapel));
                                }}
                              />
                              <span>{s.nama_mapel}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Checkboxes Kelas */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Kelas yang Diampu:</label>
                        <div className="max-h-36 overflow-y-auto space-y-1 p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                          {classes.map((c) => (
                            <label key={c.class_id} className="flex items-center gap-2 p-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={mappedClasses.includes(c.nama_kelas)}
                                onChange={(e) => {
                                  if (e.target.checked) setMappedClasses([...mappedClasses, c.nama_kelas]);
                                  else setMappedClasses(mappedClasses.filter((x) => x !== c.nama_kelas));
                                }}
                              />
                              <span>{c.nama_kelas}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setMappingUser(null)}
                          className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveTeacherMapping}
                          className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-xs"
                        >
                          Simpan Pemetaan Cloud
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: BANK SOAL DIGITAL */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-plus-circle text-amber-600"></i> Buat Butir Soal Baru (Direct Cloud Insert)
                  </h3>
                  <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                        <select
                          value={qSubject}
                          onChange={(e) => setQSubject(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                        >
                          {subjects.map((s) => (
                            <option key={s.subject_id} value={s.nama_mapel}>
                              {s.nama_mapel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tipe Soal:</label>
                        <select
                          value={qType}
                          onChange={(e) => setQType(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                        >
                          <option value="1">1. Pilihan Ganda (Single Choice)</option>
                          <option value="2">2. Pilihan Ganda Kompleks (PGK)</option>
                          <option value="3">3. Benar / Salah</option>
                          <option value="4">4. Menjodohkan (Matching)</option>
                          <option value="5">5. Uraian / Essay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Level Kognitif:</label>
                        <select
                          value={qLevel}
                          onChange={(e) => setQLevel(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                        >
                          <option value="L1">L1 (Mengingat/Memahami)</option>
                          <option value="L2">L2 (Aplikasi/Penerapan)</option>
                          <option value="L3">L3 (Penalaran/HOTS)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Narasi Pertanyaan Soal:</label>
                      <textarea
                        required
                        rows="3"
                        value={qNarrative}
                        onChange={(e) => setQNarrative(e.target.value)}
                        placeholder="Ketik pertanyaan atau stimulus soal di sini..."
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>

                    {qType === '1' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-600 mb-0.5">Opsi A:</label>
                          <input
                            type="text"
                            value={qOptionA}
                            onChange={(e) => setQOptionA(e.target.value)}
                            placeholder="Teks Opsi A"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-0.5">Opsi B:</label>
                          <input
                            type="text"
                            value={qOptionB}
                            onChange={(e) => setQOptionB(e.target.value)}
                            placeholder="Teks Opsi B"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-0.5">Opsi C:</label>
                          <input
                            type="text"
                            value={qOptionC}
                            onChange={(e) => setQOptionC(e.target.value)}
                            placeholder="Teks Opsi C"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-0.5">Opsi D:</label>
                          <input
                            type="text"
                            value={qOptionD}
                            onChange={(e) => setQOptionD(e.target.value)}
                            placeholder="Teks Opsi D"
                            className="w-full p-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700">Kunci Jawaban Benar:</label>
                        <select
                          value={qKey}
                          onChange={(e) => setQKey(e.target.value)}
                          className="p-1.5 border border-slate-300 rounded-lg font-bold"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-floppy-disk"></i> Simpan Soal ke Cloud
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-table-list text-amber-600"></i> Butir Soal Terdaftar ({questions.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100 p-4 space-y-3">
                    {questions.length === 0 ? (
                      <p className="text-center py-6 text-slate-400 text-xs">Belum ada butir soal di cloud.</p>
                    ) : (
                      questions.map((q, idx) => (
                        <div key={q.question_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-start gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">#{idx + 1}</span>
                              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                                {q.mata_pelajaran}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                                Tipe {q.jenis_soal}
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">Kunci: {q.kunci_jawaban}</span>
                            </div>
                            <p className="text-slate-800 font-medium">{q.narasi_soal}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(q.question_id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                            title="Hapus Soal"
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RUANG UJIAN SISWA & DIRECT CLOUD SUBMISSION */}
            {activeTab === 'exam_sim' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-laptop-code text-emerald-600"></i> Ruang Ujian &amp; Direct Cloud Submission
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Saat siswa di HP atau Laptop menekan tombol kirim jawaban, payload akan langsung di-insert ke tabel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-900 font-mono font-bold">tb_student_results</code> di Supabase Cloud.
                  </p>

                  {questions.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      Belum ada butir soal terdaftar. Buat soal terlebih dahulu di menu <strong>Bank Soal</strong>.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitExamAnswer} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Pilih Soal yang Dikerjakan:</label>
                        <select
                          value={selectedExamQuestionId}
                          onChange={(e) => setSelectedExamQuestionId(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                        >
                          {questions.map((q, idx) => (
                            <option key={q.question_id} value={q.question_id}>
                              Soal #{idx + 1} - {q.mata_pelajaran}: {q.narasi_soal.substring(0, 50)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Pilihan Jawaban Siswa (A/B/C/D atau Uraian):</label>
                        <input
                          type="text"
                          required
                          value={simAnswer}
                          onChange={(e) => setSimAnswer(e.target.value)}
                          placeholder="Ketik A, B, C, D atau teks jawaban siswa..."
                          className="w-full p-2.5 border border-slate-300 rounded-xl font-bold uppercase"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-paper-plane"></i> Kirim Jawaban Langsung ke Supabase
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: HASIL PENILAIAN REALTIME */}
            {activeTab === 'results' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-square-poll-vertical text-teal-600"></i> Rekap Penilaian Real-Time ({results.length})
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Cloud Feed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Waktu Submit</th>
                        <th className="py-3 px-4">User ID / Siswa</th>
                        <th className="py-3 px-4">Rincian Jawaban</th>
                        <th className="py-3 px-4 text-center">Skor Akhir</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-6 text-slate-400">
                            Belum ada riwayat hasil ujian siswa.
                          </td>
                        </tr>
                      ) : (
                        results.map((r) => (
                          <tr key={r.result_id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                              {new Date(r.created_at).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {r.jawaban_siswa_json?.nama_siswa || r.user_id}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {JSON.stringify(r.jawaban_siswa_json)}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-700 text-sm">
                              {r.skor_total || 0}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {r.status_submit || 'SELESAI'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center">
            <img
              src="/logo-eduexam.png"
              alt="Logo EduExam SMAN 4 Soppeng"
              className="h-6 w-auto inline-block mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'assets/logo.png';
              }}
            />
            <span className="font-bold text-slate-700">EduExam SMAN 4 Soppeng</span>
            <span className="ml-1">&bull; Neneurang, Kab. Soppeng, Sulawesi Selatan</span>
          </div>
          <div>
            <span>Karya Digital &amp; Blueprint Arsitektur v6.0 oleh: <strong className="text-blue-900 font-semibold">Syarif Hidayatullah, S.Pd.</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
