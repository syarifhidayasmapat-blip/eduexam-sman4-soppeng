# EduExam SMAN 4 Soppeng (v17.0)
### Platform Asesmen Diagnostik & Ujian Digital Berbasis Kurikulum Merdeka
**Edisi Arsitektur Independen, Clean Slate Initial Baseline, Full Mapel CRUD & Tombol Hapus Mapel Admin**

> **Pengembang / Pembuat:** Syarif Hidayatullah, S.Pd.  
> **Satuan Pendidikan:** UPT SMA Negeri 4 Soppeng (Neneurang, Kab. Soppeng, Sulawesi Selatan)  
> **Arsitektur Sistem:** Independent Web Application (SPA - Tailwind CSS & Vanilla JavaScript)  
> **Kategori:** Multi-Role Responsive Web Application (Single Page Application - SPA)  
> **Infrastruktur DB:** Cloud-Managed (Supabase PostgreSQL + LocalStorage Relational Model + Gemini 1.5 API Engine)  
> **Versi Dokumen Blueprint:** v17.0 (Independent Web Architecture, Clean Slate Initial Baseline, Full Dynamic Subject CRUD with Delete Button, Formative-Summative Control, and File Kisi-Kisi AI Generator Edition)

---

## 🌟 Ringkasan Eksekutif & Pembaruan Arsitektur v17.0

**EduExam SMAN 4 Soppeng** adalah platform aplikasi web asesmen diagnostik dan ujian digital terpadu yang dirancang dan dikembangkan secara mandiri oleh **Syarif Hidayatullah, S.Pd.** sebagai solusi inovatif di SMA Negeri 4 Soppeng.

Pada **Versi 17.0**, aplikasi ini disempurnakan dengan arsitektur mandiri (*Clean Slate Initial Baseline*), siap di-deploy secara independen tanpa dependensi nama platform pihak ketiga:

1. **Independent Web Architecture & Hapus Keterangan Platform Pihak Ketiga:**
   - Seluruh kode aplikasi bersifat independen (SPA berbasis Tailwind CSS, Vanilla JS, Supabase Cloud DB, dan Gemini API).
   - Seluruh teks dan atribut nama platform pihak ketiga telah dibersihkan secara menyeluruh.

2. **Clean Slate Initial Baseline (0 Data Dummy):**
   - Database dimulai dalam keadaan bersih (*clean slate*).
   - Seluruh data dummy (daftar mata pelajaran, rombel kelas, guru, siswa, bank soal, jadwal ujian, hasil ujian) telah ditiadakan (0 data).
   - Inisialisasi basis data **HANYA berisi 1 Akun Admin Utama Default**:
     * **Email:** `sman4soppeng@gmail.com`
     * **Password:** `21405`
     * *(Admin juga dapat masuk menggunakan username: `admin` dan password: `21405`)*
   - Seluruh master data akan diisi secara mandiri oleh Admin pasca-hosting sesuai kondisi riil sekolah.

3. **Modul Kelola Mata Pelajaran Dinamis dengan Tombol Hapus (Full CRUD):**
   - Di Dashboard Admin, modul **"Kelola Mata Pelajaran"** (`tb_subjects`) menyediakan formulir tambah mapel dan tabel daftar mapel.
   - Admin dapat menambah mata pelajaran baru melalui input *"Tambah nama mapel..."* + tombol `+ Tambah Mapel`.
   - **TOMBOL HAPUS MAPEL:** Setiap item mata pelajaran memiliki tombol **`🗑️ Hapus`** yang dilengkapi konfirmasi dialog keamanan.
   - Jika mapel dihapus, sistem **secara otomatis membersihkan mapel tersebut dari penugasan Guru (`mata_pelajaran_list`) dan Context Switcher Bar Guru secara real-time** tanpa menimbulkan error.

4. **Simplifikasi 4 Role Utama Pengguna:**
   - Tidak ada role Super Admin. Aplikasi berfokus pada 4 Role Inti:
     * **Admin (`admin`)**
     * **Kepala Sekolah (`kepsek`)**
     * **Guru (`guru`)**
     * **Siswa (`siswa`)**

5. **Integrasi Penugasan Guru & Isolasi Konteks Dashboard Guru:**
   - Admin menetapkan daftar Mapel (bisa > 1 mapel) dan Kelas yang diampu oleh tiap Guru.
   - Di Dashboard Guru, tersedia **Context Switcher Bar** (Dropdown & Quick Pills Mapel Aktif dan Kelas Aktif).
   - **Strict Context Isolation:** Bank Soal, Penilaian Formatif, Rekap Nilai, Live Monitor, dan AI Refleksi terisolasi rapi sesuai mapel & kelas aktif.
   - Tampilan ramah *empty state* saat data mapel/kelas masih 0 pada fase awal instalasi.

6. **Pemisahan Kontrol Aktivasi Penilaian (Formatif Mandiri Guru vs Sumatif Terpusat Admin):**
   - **Penilaian Formatif (Kuis Harian / Diagnostik / Tugas):** Guru memiliki otonomi penuh untuk mengaktifkan/menonaktifkan ujian secara mandiri (`🟢 Aktifkan Ujian Formatif`) kapan saja di kelas tanpa persetujuan Admin.
   - **Penilaian Sumatif (PTS, PAS Ganjil/Genap, US XII):** Disusun oleh Guru, namun **HANYA DAPAT DIAKTIFKAN OLEH ADMIN** (`🟢 Aktifkan Ujian Sumatif`) pada jadwal pelaksanaan resmi sekolah.

7. **AI Generator Berbasis File Kisi-Kisi:**
   - Template matriks kisi-kisi standar (.docx/.xlsx): `[No | Capaian Pembelajaran / KD | Indikator Soal | Level Kognitif (C1-C6) | Bentuk Soal | Jumlah Soal]`.
   - AI Engine mengekstrak matriks indikator dan menyusun butir soal presisi dengan output JSON terstruktur, dilengkapi kartu preview interaktif yang dapat diedit sebelum disimpan.

8. **Digital Archive Repository & Context Reinforcement:**
   - Menu **"📁 Arsip Berkas Saya"** untuk referensi berkas (PDF, DOCX, TXT) dan gambar diagram/alat ukur (JPG, PNG).

9. **AI Refleksi Guru & Supervisi Eksekutif Kepala Sekolah:**
   - Evaluasi capaian belajar, diagnosis miskonsepsi per indikator, KKTP, dan cetak Laporan Eksekutif PDF resmi.

10. **Dual-Mode Gemini API Key & Exporter Kisi-Kisi:**
    - Personal API Key dengan fallback otomatis ke default sistem.
    - Ekspor DOCX/PDF lengkap dengan Kop Surat SMAN 4 Soppeng dan kolom tanda tangan pengesahan.

---

## 🔑 Kredensial Akses 4 Peran Pengguna (v17.0)

Pada status inisialisasi awal (*Clean Slate Baseline*), hanya akun Administrator yang terdaftar:

| Peran (Role) | Kredensial Masuk | Format Login | Otoritas & Status Clean Slate v17.0 |
| :--- | :--- | :--- | :--- |
| **1. Admin** | Email: `sman4soppeng@gmail.com`<br>Pass: `21405`<br>*(Alt user: `admin` / `21405`)* | **Email/Username & Kata Sandi** | **Default Terdaftar:** Administrator mengelola Master Mapel (`tb_subjects`), Tambah/Hapus Mapel, Penugasan Guru, Kelola Kelas, Import Excel Siswa, Barcode Card, dan Jadwal Ujian Sumatif. |
| **2. Kepala Sekolah** | Didaftarkan oleh Admin di Tab "Penugasan Guru & User" | **Username & Kata Sandi** | Supervisi Mutu Asesmen Formatif & Sumatif, Grafik KKTP, dan Cetak Laporan Eksekutif PDF. |
| **3. Guru** | Didaftarkan oleh Admin di Tab "Penugasan Guru & User" | **Username & Kata Sandi** | Otonomi Formatif Mandiri, AI Generator Kisi-Kisi, Bank Soal, Digital Archive, dan Refleksi Siswa. |
| **4. Siswa** | Diimpor via Excel Siswa oleh Admin di Tab "Manajemen Kelas & Siswa" | **Barcode Scan QR / Nama + NIS** | Auto-Login Barcode Single-Card, Ruang Ujian Mobile, Auto-Save Memori Lokal, Timer, Anti-Pindah Tab. |

---

## 📋 5 Variasi Tipe Soal & Penskoran
1. **Pilihan Ganda (PG Standard):** Memilih 1 opsi benar dari A, B, C, D, E.
2. **Pilihan Ganda Kompleks (PGK Checkbox):** Menandai beberapa kotak centang opsi benar dengan perhitungan proporsi skor parsial.
3. **Benar / Salah (True/False):** Menguji validitas pernyataan konsep ilmiah secara cepat.
4. **Menjodohkan (Matching Pair):** Menghubungkan premis sebelah kiri dengan target pasangan konsep di sebelah kanan.
5. **Isian Singkat & Esai:** Evaluasi jawaban uraian otomatis dengan **AI Semantic Evaluation (Gemini 1.5 Protocol)** didasarkan pada rubrik guru, dilengkapi catatan umpan balik diagnostik dan opsi koreksi manual guru.

---

## 🛡️ 5 Pilar Penguatan Sistem & Anti-Error
1. **Offline-First LocalStorage Auto-Save:** Setiap ketukan atau pilihan jawaban siswa disimpan ke memori HP dalam hitungan milidetik.
2. **Heartbeat Connection Guard:** Pemantau status jaringan real-time (Online/Offline) dengan indikator visual *pulsing*.
3. **Staggered Batch Submission:** Penyeimbangan antrean kirim dengan interval delay acak (1,5 – 4,5 detik) guna melindungi server dari lonjakan traffic serentak.
4. **Page Exit Guard (`beforeunload`):** Mencegah siswa tidak sengaja menekan tombol Back browser, reload, atau menutup tab selama ujian aktif.
5. **AI Fallback Engine:** Mengalihkan proses pembuatan soal dan penilaian secara mulus ke generator lokal berketahanan tinggi jika kuota AI habis atau koneksi terputus.

---

## 📱 Dukungan Progressive Web App (PWA) & Pengoperasian Offline

Aplikasi telah dilengkapi arsitektur **Progressive Web App (PWA)** standar modern:
1. **Instalasi Mandiri (Installable PWA):**
   - **Android / Google Chrome & Edge:** Tombol interaktif *"📱 Instal Aplikasi EduExam"* akan memicu *native install prompt* (`beforeinstallprompt`).
   - **iOS Safari (iPhone / iPad):** Tersedia panduan 3-langkah instalasi ke Layar Utama (*Add to Home Screen*) melalui menu Bagikan Safari.
   - **Desktop (Windows / macOS / ChromeOS):** Dapat diinstal sebagai aplikasi *standalone* mandiri berpenampilan bersih tanpa bilah navigasi browser.
2. **Web App Manifest (`public/manifest.json`):**
   - Mendefinisikan `short_name: "EduExam"`, `name: "EduExam SMAN 4 Soppeng"`, `theme_color: "#1E3A8A"`, mode `display: "standalone"`, serta penunjukan ikon resolusi tinggi `/icon-192.png` & `/icon-512.png`.
3. **Service Worker Offline-First Engine (`public/sw.js`):**
   - **Pre-Caching Aset Inti:** Seluruh HTML, CSS, script JS, aset gambar, dan pustaka CDN inti dicache secara otomatis.
   - **Offline Navigation Fallback:** Siswa tetap dapat membuka aplikasi dan melanjutkan ujian tanpa hambatan saat koneksi internet sekolah terputus.
   - **Cache Invalidation:** Pembaruan versi otomatis diperbarui di latar belakang tanpa menghapus data pengerjaan ujian siswa.

---

## 🚀 Panduan Menjalankan Aplikasi & Alur Setup Awal

1. **Jalankan Web Server Lokal:**
   ```bash
   node server.js
   ```
2. **Buka Aplikasi di Browser:**
   Akses `http://localhost:3000` melalui peramban web (Google Chrome / Microsoft Edge).

3. **Alur Konfigurasi Awal (Clean Slate Setup):**
   - Klik tombol **Admin** pada halaman login (atau gunakan tombol bantuan 1-klik untuk otomatis mengisi `sman4soppeng@gmail.com` / `21405`).
   - Masuk ke menu **"Kelola Mata Pelajaran"**: Tambahkan mata pelajaran yang diajarkan di sekolah (misal: Fisika, Biologi, Matematika, dll).
   - Masuk ke menu **"Manajemen Kelas & Siswa"**: Tambahkan kelas dan impor data siswa via Excel.
   - Masuk ke menu **"Penugasan Guru & User"**: Daftarkan akun Guru dan Kepala Sekolah serta petakan mata pelajaran & kelas yang diampu.
   - Setelah penugasan selesai, seluruh modul Guru, Siswa, dan Kepala Sekolah dapat langsung beroperasi secara penuh.

---
*Dibuat dengan dedikasi untuk kemajuan mutu pendidikan di SMA Negeri 4 Soppeng oleh Syarif Hidayatullah, S.Pd.*
