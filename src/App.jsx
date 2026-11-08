import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import supabase from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Ganjil');
  const [supabaseStatus, setSupabaseStatus] = useState('Terhubung');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Muat sesi dari localStorage saat pertama kali dimuat
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('eduexam_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.user_id) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }

    // Uji koneksi Supabase secara langsung
    const testConnection = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('tb_subjects').select('count', { count: 'exact', head: true });
          if (!error) {
            setSupabaseStatus('Terhubung');
          } else {
            setSupabaseStatus('Perlu Policy SQL');
          }
        } catch (err) {
          setSupabaseStatus('Offline');
        }
      }
    };
    testConnection();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('eduexam_auth_session');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => currentUser ? setActiveTab('dashboard') : null}>
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
                UPT SMAN 4 Soppeng • Kab. Soppeng
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Supabase Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden md:inline text-slate-600">Supabase:</span>
              <span className="text-emerald-700 font-bold">{supabaseStatus}</span>
            </div>

            {/* PWA Install Button */}
            <button
              onClick={() => {
                if (window.App && typeof window.App.promptPwaInstall === 'function') {
                  window.App.promptPwaInstall();
                } else {
                  alert('EduExam dapat diinstal langsung dari menu browser Anda (Tambahkan ke Layar Utama).');
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition transform hover:scale-105 cursor-pointer"
              title="Instal Aplikasi EduExam"
            >
              <i className="fa-solid fa-mobile-screen-button"></i> <span>Instal App</span>
            </button>

            {/* User Profile or Login Status */}
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
                  title="Keluar dari Akun"
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
                className="bg-blue-900/80 text-white text-xs font-semibold rounded-lg px-2.5 py-1 border border-blue-700 focus:outline-hidden focus:ring-1 focus:ring-teal-400 cursor-pointer"
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
                className="bg-blue-900/80 text-white text-xs font-semibold rounded-lg px-2.5 py-1 border border-blue-700 focus:outline-hidden focus:ring-1 focus:ring-teal-400 cursor-pointer"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-blue-200 text-[11px]">
            <span>Pengembang: <strong>Syarif Hidayatullah, S.Pd.</strong></span>
            <span>&bull;</span>
            <span>Arsitektur: <strong>Independent Web SPA (Tailwind CSS, React &amp; Supabase DB)</strong></span>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1">
        {!currentUser ? (
          <Login onLoginSuccess={(user) => setCurrentUser(user)} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Dashboard Container Berdasarkan Role */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 mb-2">
                    <i className="fa-solid fa-user-shield text-teal-600"></i> Role: {currentUser.role.toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Selamat Datang, {currentUser.nama_lengkap}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tahun Ajaran {academicYear} &bull; Semester {semester} &bull; UPT SMAN 4 Soppeng
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.App && typeof window.App.navigateToRoleDashboard === 'function') {
                        window.App.navigateToRoleDashboard();
                      }
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-gauge-high"></i> Buka Modul Lengkap
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Keluar
                  </button>
                </div>
              </div>

              {/* Status Ringkasan Akun */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">ID Pengguna</span>
                  <span className="text-sm font-semibold text-slate-800 font-mono">{currentUser.user_id}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Username / Email</span>
                  <span className="text-sm font-semibold text-slate-800">{currentUser.email || currentUser.username}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status Database</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Supabase Cloud PostgreSQL
                  </span>
                </div>
              </div>
            </div>
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

