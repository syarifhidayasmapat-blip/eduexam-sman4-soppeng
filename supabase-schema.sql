-- ==============================================================================
-- EDUEXAM SMAN 4 SOPPENG - SUPABASE POSTGRESQL DATABASE SCHEMA & POLICIES (v17.0)
-- Pengembang: Syarif Hidayatullah, S.Pd.
-- Satuan Pendidikan: UPT SMA Negeri 4 Soppeng, Sulawesi Selatan
-- ==============================================================================
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard/project/jzdjnsxsgeddlkhmwogk)
-- 2. Masuk ke menu "SQL Editor" di bilah sisi kiri
-- 3. Tempel seluruh isi file ini dan klik tombol "Run" (Jalankan)
-- ==============================================================================

-- Aktifkan ekstensi UUID (pgcrypto / uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL PENGGUNA (tb_users) - 4 Role: admin, kepsek, guru, siswa
CREATE TABLE IF NOT EXISTS public.tb_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'kepsek', 'guru', 'siswa')),
  assigned_mapel_json JSONB DEFAULT '[]'::jsonb,
  assigned_kelas_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL MATA PELAJARAN (tb_subjects) - Full CRUD Tambah/Hapus Mapel
CREATE TABLE IF NOT EXISTS public.tb_subjects (
  subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_mapel TEXT NOT NULL,
  nama_mapel TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL ASESMEN (tb_assessments) - Formatif vs Sumatif
CREATE TABLE IF NOT EXISTS public.tb_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.tb_users(user_id) ON DELETE SET NULL,
  kategori_penilaian TEXT NOT NULL CHECK (kategori_penilaian IN ('formatif', 'sumatif')),
  jenis_sumatif TEXT, -- PTS, PAS_GANJIL, PAS_GENAP, US_XII (jika sumatif)
  materi_bab_text TEXT, -- Bab pokok / topik bahasan
  target_kelas_json JSONB DEFAULT '[]'::jsonb,
  is_teacher_activated BOOLEAN DEFAULT false, -- Kontrol aktivasi mandiri Formatif oleh Guru
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL BANK SOAL (tb_questions) - Multi-tipe soal 1-5
CREATE TABLE IF NOT EXISTS public.tb_questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.tb_assessments(assessment_id) ON DELETE CASCADE,
  mata_pelajaran TEXT NOT NULL,
  jenis_soal INT DEFAULT 1, -- 1: PG, 2: PGK, 3: B/S, 4: Matching, 5: Essay
  narasi_soal TEXT NOT NULL,
  gambar_url TEXT,
  opsi_json JSONB DEFAULT '[]'::jsonb,
  kunci_jawaban TEXT,
  level_kognitif TEXT DEFAULT 'L2',
  kisi_kisi_ref_id TEXT,
  pembahasan TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL JADWAL SUMATIF TERPUSAT (tb_exam_schedules) - Kontrol Aktivasi Terpusat Admin
CREATE TABLE IF NOT EXISTS public.tb_exam_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.tb_assessments(assessment_id) ON DELETE CASCADE,
  nama_sesi_ujian TEXT NOT NULL,
  jenis_ujian TEXT,
  tanggal_ujian DATE,
  jam_mulai TIME,
  jam_selesai TIME,
  is_active_by_admin BOOLEAN DEFAULT false, -- HANYA BISA DIAKTIFKAN OLEH ADMIN
  activated_by_admin_id UUID REFERENCES public.tb_users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL HASIL PENILAIAN SISWA (tb_student_results)
CREATE TABLE IF NOT EXISTS public.tb_student_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.tb_users(user_id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.tb_assessments(assessment_id) ON DELETE CASCADE,
  jawaban_siswa_json JSONB DEFAULT '{}'::jsonb,
  skor_total NUMERIC(5, 2) DEFAULT 0,
  feedback_ai_essay TEXT,
  log_pindah_tab_count INT DEFAULT 0,
  status_submit TEXT DEFAULT 'SELESAI',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL REFLEKSI AI GURU & SUPERVISI (tb_ai_reflections)
CREATE TABLE IF NOT EXISTS public.tb_ai_reflections (
  reflection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.tb_assessments(assessment_id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.tb_users(user_id) ON DELETE SET NULL,
  ringkasan_miskonsepsi TEXT,
  saran_remedial_pengayaan TEXT,
  growth_score_avg NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABEL ARSIP BERKAS & GAMBAR GURU (tb_archives)
CREATE TABLE IF NOT EXISTS public.tb_archives (
  archive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.tb_users(user_id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- KEBIJAKAN ROW-LEVEL SECURITY (RLS) UNTUK AKSES RESMI APLIKASI
-- ==============================================================================
ALTER TABLE public.tb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_student_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_ai_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_archives ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan Akses Penuh untuk Anon & Authenticated Client
DROP POLICY IF EXISTS "Akses Penuh EduExam tb_users" ON public.tb_users;
CREATE POLICY "Akses Penuh EduExam tb_users" ON public.tb_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_subjects" ON public.tb_subjects;
CREATE POLICY "Akses Penuh EduExam tb_subjects" ON public.tb_subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_assessments" ON public.tb_assessments;
CREATE POLICY "Akses Penuh EduExam tb_assessments" ON public.tb_assessments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_questions" ON public.tb_questions;
CREATE POLICY "Akses Penuh EduExam tb_questions" ON public.tb_questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_exam_schedules" ON public.tb_exam_schedules;
CREATE POLICY "Akses Penuh EduExam tb_exam_schedules" ON public.tb_exam_schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_student_results" ON public.tb_student_results;
CREATE POLICY "Akses Penuh EduExam tb_student_results" ON public.tb_student_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_ai_reflections" ON public.tb_ai_reflections;
CREATE POLICY "Akses Penuh EduExam tb_ai_reflections" ON public.tb_ai_reflections FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh EduExam tb_archives" ON public.tb_archives;
CREATE POLICY "Akses Penuh EduExam tb_archives" ON public.tb_archives FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- INISIALISASI DATA AWAL (DEFAULT ADMIN UTAMA)
-- Email: sman4soppeng@gmail.com | Password: 21405
-- ==============================================================================
INSERT INTO public.tb_users (
  user_id,
  username,
  email,
  password_hash,
  nama_lengkap,
  role,
  assigned_mapel_json,
  assigned_kelas_json
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'sman4soppeng@gmail.com',
  '21405',
  'Administrator SMAN 4 Soppeng',
  'admin',
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  nama_lengkap = EXCLUDED.nama_lengkap;

