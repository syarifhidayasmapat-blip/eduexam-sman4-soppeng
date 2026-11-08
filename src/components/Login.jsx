import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('siswa'); // Opsi: 'siswa', 'guru', 'admin', 'kepsek'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  // Otomatis sesuaikan input saat tab peran berubah
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    if (activeRole === 'admin') {
      setIdentifier('sman4soppeng@gmail.com');
      setPassword('21405');
    } else {
      setIdentifier('');
      setPassword('');
    }
  }, [activeRole]);

  // Handler Submit Login (Supabase Authentication & Kredensial Default Admin)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanId = identifier.trim();
    const cleanPwd = password.trim();

    if (!cleanId || !cleanPwd) {
      setErrorMessage('Harap masukkan identitas akun dan kata sandi.');
      return;
    }

    setLoading(true);

    try {
      let authUser = null;

      // 1. Kredensial Default Admin Utama (sman4soppeng@gmail.com / 21405)
      if (
        (activeRole === 'admin' || !activeRole) &&
        (cleanId.toLowerCase() === 'sman4soppeng@gmail.com' || cleanId.toLowerCase() === 'admin') &&
        cleanPwd === '21405'
      ) {
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

      // 2. Query ke Supabase Cloud DB (tb_users) jika bukan default admin
      if (!authUser && supabase) {
        let query = supabase.from('tb_users').select('*').eq('password_hash', cleanPwd);

        if (activeRole === 'siswa') {
          query = query.ilike('nama_lengkap', `%${cleanId}%`).eq('role', 'siswa');
        } else {
          query = query.or(`email.ilike.${cleanId},username.ilike.${cleanId}`);
          if (activeRole) {
            query = query.eq('role', activeRole);
          }
        }

        const { data, error } = await query.limit(1);

        if (error) {
          console.warn('Supabase Login Query Error:', error.message);
        } else if (data && data.length > 0) {
          const u = data[0];
          authUser = {
            user_id: u.user_id,
            username: u.username,
            email: u.email,
            nama_lengkap: u.nama_lengkap,
            role: u.role,
            status_aktif: u.status_aktif !== false,
            mata_pelajaran_list: Array.isArray(u.assigned_mapel_json) ? u.assigned_mapel_json : [],
            kelas_diampu_list: Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json : [],
            mapel: Array.isArray(u.assigned_mapel_json) && u.assigned_mapel_json.length > 0 ? u.assigned_mapel_json[0] : '',
            kelas: Array.isArray(u.assigned_kelas_json) ? u.assigned_kelas_json.join(', ') : '-'
          };
        }
      }

      // 3. Fallback jika window.EduDB tersedia
      if (!authUser && typeof window !== 'undefined' && window.EduDB) {
        if (typeof window.EduDB.authenticateAsync === 'function') {
          authUser = await window.EduDB.authenticateAsync(cleanId, cleanPwd, activeRole);
        } else if (typeof window.EduDB.authenticate === 'function') {
          authUser = window.EduDB.authenticate(cleanId, cleanPwd, activeRole);
        }
      }

      if (!authUser) {
        setErrorMessage('Login gagal! Akun tidak ditemukan atau kata sandi tidak cocok. Silakan periksa kembali data Anda.');
        setLoading(false);
        return;
      }

      // Login Sukses
      setSuccessMessage(`Login berhasil! Selamat datang, ${authUser.nama_lengkap}.`);
      localStorage.setItem('eduexam_auth_session', JSON.stringify(authUser));

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(authUser);
        }
      }, 500);

    } catch (err) {
      console.error('Login Exception:', err);
      setErrorMessage('Terjadi kesalahan pada sistem koneksi database. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Logo & Header Portal Login */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/logo-eduexam.png"
            alt="Logo EduExam SMAN 4 Soppeng"
            className="h-12 w-auto mb-3"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'assets/logo.png';
            }}
          />
          <h1 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
            EduExam SMAN 4 Soppeng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Platform Ujian Digital &amp; Asesmen Diagnostik Real-Time
          </p>
        </div>

        {/* Banner Instal Aplikasi PWA */}
        {showPwaBanner && (
          <div className="mb-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 rounded-3xl p-5 text-white shadow-xl border-2 border-teal-400/50 transition">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-2xl text-amber-300 shrink-0 shadow-inner">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider mb-1">
                    <i className="fa-solid fa-cloud-arrow-down"></i> Aplikasi PWA
                  </div>
                  <h3 className="text-base font-black text-white leading-tight">📱 Instal Aplikasi EduExam</h3>
                  <p className="text-xs text-teal-100 opacity-90 mt-0.5">
                    Pasang di Android, iOS, atau Laptop untuk akses ujian offline &amp; cepat tanpa browser.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (window.App && typeof window.App.promptPwaInstall === 'function') {
                      window.App.promptPwaInstall();
                    } else {
                      alert('Untuk menginstal aplikasi, buka menu browser Anda lalu pilih "Tambahkan ke Layar Utama" / "Instal Aplikasi".');
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-white text-blue-950 hover:bg-teal-50 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0 transform hover:scale-105 cursor-pointer"
                >
                  <i className="fa-solid fa-download text-teal-700"></i> Instal Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setShowPwaBanner(false)}
                  className="p-2 text-white/60 hover:text-white transition cursor-pointer"
                  title="Tutup Notifikasi"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Barcode / QR Code Kartu Ujian Siswa */}
        <div
          className="mb-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border-2 border-teal-500/40 cursor-pointer hover:shadow-2xl hover:border-teal-400 transition transform hover:-translate-y-0.5"
          onClick={() => {
            if (window.App && typeof window.App.openQrScannerModal === 'function') {
              window.App.openQrScannerModal();
            } else {
              setActiveRole('siswa');
            }
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-teal-400 text-teal-950 uppercase tracking-wider shadow-xs">
                <i className="fa-solid fa-bolt"></i> Auto-Login Single-Card
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">Scan Barcode Kartu Ujian</h2>
              <p className="text-xs text-teal-100 opacity-90 leading-relaxed">
                Arahkan kamera HP ke Barcode / QR Code pada Kartu Ujian untuk langsung masuk tanpa perlu ketik Nama &amp; NIS!
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/30 flex items-center justify-center text-3xl text-teal-300 shrink-0 shadow-inner">
              <i className="fa-solid fa-qrcode"></i>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-teal-200 font-semibold">
            <span><i className="fa-solid fa-camera mr-1"></i> Buka Pemindai Kamera HP</span>
            <span className="text-teal-300 font-bold flex items-center gap-1">Scan Sekarang <i className="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center text-xs text-slate-400 mb-2">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 uppercase font-bold text-[10px] tracking-wider text-slate-500">
            Atau Masuk Manual via Akun
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 sm:p-8">
          {/* TAB PERAN (ROLE SWITCHER): 4 Role Utama SMAN 4 Soppeng */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl mb-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveRole('siswa')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                activeRole === 'siswa'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-user-graduate"></i> Siswa
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('guru')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                activeRole === 'guru'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-chalkboard-user"></i> Guru
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-shield-halved"></i> Admin
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('kepsek')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                activeRole === 'kepsek'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className="fa-solid fa-graduation-cap"></i> Kepsek
            </button>
          </div>

          {/* Role Explanatory Helper Note */}
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5 leading-relaxed">
            {activeRole === 'siswa' && (
              <span><i className="fa-solid fa-qrcode text-teal-600 mr-1"></i> Siswa dapat masuk instan via <strong>Scan Barcode Kartu Ujian</strong> atau ketik Nama Lengkap + NIS.</span>
            )}
            {activeRole === 'guru' && (
              <span><i className="fa-solid fa-chalkboard-user text-teal-600 mr-1"></i> Akun Guru dibuat &amp; dikelola terpusat oleh Admin Sekolah (Mendukung Multi-Mapel &amp; Multi-Kelas).</span>
            )}
            {activeRole === 'admin' && (
              <span><i className="fa-solid fa-shield-halved text-purple-600 mr-1"></i> <strong>Admin Utama SMAN 4 Soppeng:</strong> Kredensial default: <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded font-mono">sman4soppeng@gmail.com</code> / <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded font-mono">21405</code>. Kelola Mata Pelajaran, Penugasan Guru, Siswa, dan Jadwal Ujian.</span>
            )}
            {activeRole === 'kepsek' && (
              <span><i className="fa-solid fa-graduation-cap text-amber-600 mr-1"></i> Dashboard Eksekutif Kepala Sekolah untuk monitoring grafik capaian dan asesmen diagnostik.</span>
            )}
          </div>

          {/* Feedback Pesan Error & Sukses */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0"></i>
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-circle-check shrink-0"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Login Interaktif */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input 1: Sesuai Peran Aktif */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {activeRole === 'admin' && 'Email Administrator:'}
                {activeRole === 'kepsek' && 'Email / Username Kepala Sekolah:'}
                {activeRole === 'guru' && 'NIP / Username Guru:'}
                {activeRole === 'siswa' && 'Nama Lengkap Siswa:'}
              </label>
              <input
                type={activeRole === 'admin' ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  activeRole === 'admin'
                    ? 'sman4soppeng@gmail.com'
                    : activeRole === 'kepsek'
                    ? 'Masukkan email atau username kepala sekolah'
                    : activeRole === 'guru'
                    ? 'Masukkan NIP atau username guru'
                    : 'Masukkan Nama Lengkap Siswa'
                }
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-inner"
              />
            </div>

            {/* Input 2: Kata Sandi / NIS Sesuai Peran Aktif */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {activeRole === 'admin' && 'Kata Sandi Administrator:'}
                {activeRole === 'kepsek' && 'Kata Sandi Kepala Sekolah:'}
                {activeRole === 'guru' && 'Kata Sandi Guru:'}
                {activeRole === 'siswa' && 'Kata Sandi / NIS Siswa:'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  activeRole === 'admin'
                    ? '21405'
                    : activeRole === 'siswa'
                    ? 'Masukkan Nomor Induk Siswa (NIS)'
                    : 'Masukkan kata sandi'
                }
                required
                className="w-full text-sm px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-inner"
              />
            </div>

            {/* Tombol Submit Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

