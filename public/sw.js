/**
 * EduExam SMAN 4 Soppeng - Service Worker (PWA Engine)
 * Offline-First & Fast Asset Caching
 * Versi: v17.0
 * Pengembang: Syarif Hidayatullah, S.Pd.
 */

const CACHE_NAME = 'eduexam-pwa-v18.0';

// Daftar aset inti yang di-precached saat instalasi Service Worker
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/supabaseClient.js',
  '/js/db.js',
  '/js/app.js',
  '/js/admin.js',
  '/js/guru.js',
  '/js/kepsek.js',
  '/js/exam-engine.js',
  '/js/ai-engine.js',
  '/logo-sekolah.png',
  '/logo-eduexam.png',
  '/assets/logo.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Ekstensi aset statis lokal yang di-cache
const STATIC_EXTENSIONS = [
  '.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff2', '.woff', '.ttf'
];

// Host CDN yang diizinkan untuk dynamic caching
const ALLOWED_CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// --- 1. INSTALL EVENT ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[EduExam SW] Pre-caching core assets for offline support...');
      // Gunakan penanganan per-item agar kegagalan 1 file opsional tidak menggagalkan instalasi SW
      await Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[EduExam SW] Gagal mem-precache aset:', asset, err.message);
          })
        )
      );
      return self.skipWaiting();
    })
  );
});

// --- 2. ACTIVATE EVENT ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[EduExam SW] Membersihkan cache usang:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// --- 3. FETCH EVENT ---
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Hanya tangani request HTTP/HTTPS dengan metode GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Jangan tangani API eksternal dinamis (misal Gemini AI, Supabase API calls)
  if (url.origin.includes('generativelanguage.googleapis.com') || url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) {
    return;
  }

  // A. STRATEGI UNTUK NAVIGASI HALAMAN (HTML): Network-First dengan Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[EduExam SW] Offline mode: Memuat halaman navigasi dari cache');
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackIndex = await caches.match('/index.html');
          if (fallbackIndex) return fallbackIndex;
          const fallbackRoot = await caches.match('/');
          if (fallbackRoot) return fallbackRoot;
          return new Response('Aplikasi EduExam sedang offline dan cache belum tersedia.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // B. STRATEGI UNTUK ASET CDN EKSTERNAL: Cache-First dengan Network Fallback
  if (ALLOWED_CDN_HOSTS.some(host => url.hostname.includes(host))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[EduExam SW] Gagal memuat CDN saat offline:', request.url);
          return new Response('', { status: 408 });
        });
      })
    );
    return;
  }

  // C. STRATEGI UNTUK ASET STATIS LOKAL: Stale-While-Revalidate
  const isLocalAsset = url.origin === self.location.origin;
  if (isLocalAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => null);

        // Jika ada di cache, kembalikan langsung; request jaringan memperbarui cache di latar belakang
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// --- 4. MESSAGE EVENT ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

