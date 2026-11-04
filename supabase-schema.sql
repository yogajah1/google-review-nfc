-- ==========================================================
-- SKEMA DATABASE UNTUK GOOGLE REVIEW NFC & QR CODE (SUPABASE)
-- Copy-paste kode ini ke SQL Editor di Dashboard Supabase Anda
-- ==========================================================

-- Buat Tabel Cards
CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(30) PRIMARY KEY,                    -- Kode Unik Kartu (cth: "REV-A8F2K")
  status VARCHAR(20) DEFAULT 'unactivated',       -- 'unactivated', 'active', 'suspended'
  store_name VARCHAR(255) NULL,                   -- Nama Toko / UMKM
  google_review_url TEXT NULL,                   -- Link Google Maps Review Bintang 5
  owner_phone VARCHAR(30) NULL,                   -- Nomor WhatsApp Pemilik Toko
  pin_hash VARCHAR(255) NULL,                     -- Bcrypt Hash PIN 4 Digit
  failed_attempts INT DEFAULT 0,                  -- Penghitung salah input PIN (Brute Force Protection)
  locked_until TIMESTAMPTZ NULL,                  -- Waktu kartu terkunci jika gagal 5x
  total_scans INT DEFAULT 0,                      -- Statistik total tap NFC & scan QR
  batch_id VARCHAR(50) NULL,                      -- ID Batch cetak
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa redirect secepat kilat
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_batch ON cards(batch_id);

-- RLS (Row Level Security)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Policy: Publik bisa membaca kartu (untuk redirect & halaman aktivasi)
CREATE POLICY "Public read cards" 
ON cards FOR SELECT 
TO public 
USING (true);

-- Policy: Server (Service Role) memiliki akses penuh
CREATE POLICY "Service role full access" 
ON cards FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
