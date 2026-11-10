import { createClient } from '@supabase/supabase-js';

/**
 * EduExam SMAN 4 Soppeng - Centralized Supabase Client Module
 * Blueprint v17.0 (Independent Web Architecture, Clean Slate Initial Baseline)
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

// Kredensial Resmi Supabase Cloud DB
export const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
  || 'https://jzdjnsxsgeddlkhmwogk.supabase.co';

export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
  || 'sb_publishable_itWkhhXA3pfbqqi15LsB1A_xErKk2Kr';

let client = null;

if (typeof window !== 'undefined' && window.supabaseClient) {
  client = window.supabaseClient;
} else if (typeof createClient === 'function') {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  } catch (err) {
    console.warn('Gagal membuat Supabase client via import:', err);
  }
}

if (!client && typeof window !== 'undefined' && window.supabase?.createClient) {
  try {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('Gagal membuat Supabase client via window.supabase:', err);
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
