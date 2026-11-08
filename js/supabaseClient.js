/**
 * EduExam SMAN 4 Soppeng - Supabase Client Library (Browser Global)
 * Blueprint v17.0 (Independent Web Architecture, Clean Slate Initial Baseline)
 * Satuan Pendidikan: UPT SMAN 4 Soppeng
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

(function (window) {
  'use strict';

  // Kredensial Resmi Supabase Cloud DB
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
          }
        });
        window.supabaseClient = client;
        console.log('✅ Supabase Client terhubung ke:', SUPABASE_URL);
        return client;
      } catch (err) {
        console.warn('⚠️ Inisialisasi Supabase Client tertunda:', err.message);
      }
    } else {
      console.warn('⚠️ Supabase JS library belum siap. Menunggu CDN...');
    }
    return null;
  }

  // Coba inisialisasi langsung
  initClient();

  // Jika CDN dimuat asinkron, coba kembali setelah DOM siap
  if (!client && typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.supabaseClient) initClient();
    });
  }

  // CommonJS export fallback jika diuji di lingkungan Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      initClient
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
