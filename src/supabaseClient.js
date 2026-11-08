/**
 * EduExam SMAN 4 Soppeng - Supabase Client Module
 * Blueprint v17.0 (Independent Web Architecture, Clean Slate Initial Baseline)
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

// Kredensial Resmi Supabase Cloud DB
export const SUPABASE_URL = 'https://jzdjnsxsgeddlkhmwogk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_itWkhhXA3pfbqqi15LsB1A_xErKk2Kr';

let client = null;

// Browser global check
if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} else {
  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    // CDN or browser environment fallback
  }
}

export const supabase = client;

if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };
  window.supabaseClient = client;
}

export default supabase;

