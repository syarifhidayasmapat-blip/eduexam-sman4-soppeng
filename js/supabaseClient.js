/**
 * EduExam SMAN 4 Soppeng - Supabase Client Library (Browser Global)
 * Blueprint v17.0 (Independent Web Architecture, Clean Slate Initial Baseline)
 * Satuan Pendidikan: UPT SMAN 4 Soppeng
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

(function (window) {
  'use strict';

  // Kredensial Resmi Supabase Cloud DB (Otomatis Aktif di Semua Perangkat: HP, Laptop, Tablet)
  const SUPABASE_URL = 'https://jzdjnsxsgeddlkhmwogk.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_itWkhhXA3pfbqqi15LsB1A_xErKk2Kr';

  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };

  let client = null;

  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
        window.supabaseClient = client;
        if (window.EduDB && !window.EduDB.supabase) {
          window.EduDB.supabase = client;
        }
        console.log('✅ Supabase Client otomatis terhubung di semua perangkat:', SUPABASE_URL);
        return client;
      } catch (err) {
        console.warn('⚠️ Inisialisasi Supabase Client tertunda:', err.message);
      }
    }
    return null;
  }

  // Coba inisialisasi langsung
  initClient();

  // Retry jika CDN Supabase dimuat asinkron pada koneksi lambat (HP/Tablet)
  if (!client && typeof window !== 'undefined') {
    let attempts = 0;
    const retryInterval = setInterval(() => {
      attempts++;
      if (initClient() || attempts > 20) {
        clearInterval(retryInterval);
      }
    }, 250);

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!window.supabaseClient) initClient();
      });
    }
  }

  // CommonJS export fallback jika diuji di lingkungan Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      initClient
    };
  }
})(typeof window !== 'undefined' ? window : global);
