# 🌟 Google Review NFC (NTAG215) & QR Code Platform

Platform bisnis kartu Google Review pintar berbasis fisik akrilik susu + stiker vinyl dengan chip NFC NTAG215 dan QR Code dinamis. 

Dikembangkan dengan **Next.js 16**, **TypeScript**, **Tailwind CSS**, **Bcrypt.js**, dan terintegrasi dengan **Supabase (PostgreSQL)**, **Vercel**, serta **Telegram Bot Pribadi**.

---

## 🚀 Fitur Utama

1. **Smart Routing Dinamis (`/r/[cardId]`)**:
   - Baik chip NFC maupun stiker QR Code menggunakan **1 link pendek yang sama** (contoh: `https://domainanda.com/r/REV-A8F2K`).
   - **Kartu Belum Aktif**: Menampilkan form aktivasi toko (Nama Toko, Link Review Google Maps, No. WhatsApp, Buat PIN 4-Digit).
   - **Status Verifikasi Berhasil**: Animasi centang hijau, ringkasan toko, dan **Kotak Khusus Link Kelola & Pindah Alamat** lengkap dengan tombol *Salin Link*, *Kirim ke WhatsApp Saya*, dan *Uji Coba Review*.
   - **Kartu Sudah Aktif**: Langsung redirect instan (< 300ms) ke halaman ulasan bintang 5 Google Maps tanpa hambatan bagi pelanggan kafe/toko.

2. **Keamanan Anti-Pembajakan Alamat Toko (`/r/[cardId]/edit`)**:
   - Untuk mengubah alamat toko / link ulasan baru, wajib memasukkan **PIN 4 Digit**.
   - **Brute-Force Lockout**: Salah memasukkan PIN 5 kali berturut-turut akan mengunci kartu selama **30 menit**.
   - **Enkripsi Bcrypt**: PIN tidak disimpan dalam bentuk teks polos.
   - **Dual-Factor Cadangan**: Verifikasi 4 digit terakhir nomor telepon pemilik.

3. **Cetak Massal QR Code Vinyl A4 (`/admin/print`)**:
   - Fitur Batch Generator (buat 10, 50, atau 100 kartu sekaligus).
   - Halaman siap cetak format A4 Grid dengan logo Google, 5 bintang emas, instruksi tap/scan, garis putus-putus pemotong stiker, dan **Kode ID Kartu** di bawah QR untuk memudahkan penulisan ke NTAG215.

4. **Bot Telegram Pribadi (Whitelisted)**:
   - Terintegrasi langsung via Webhook `/api/bot/telegram`.
   - **Akses Eksklusif**: Hanya username **`@thisfinoenable`** yang diizinkan mengontrol bot.
   - Perintah bot:
     - `/generate <jumlah>`: Generate puluhan kartu dan langsung beri link cetak stiker.
     - `/cek <kode>`: Cek status kartu, nama toko, dan total tap pelanggan.
     - `/reset <kode>`: Reset kartu ke status awal (jika klien toko lupa PIN).
     - `/unlock <kode>`: Buka kunci kartu yang terkunci karena salah PIN.
     - `/stats`: Rekap performa bisnis.

5. **Dashboard Admin Owner (`/admin`)**:
   - Dilindungi kode rahasia (`ADMIN_SECRET`).
   - Rekap total kartu, kartu aktif, stok belum aktif, dan total tap pelanggan.
   - Kontrol penuh reset, unlock, edit, dan hapus kartu.

---

## 🛠 Panduan Deploy ke Vercel & Supabase

### Langkah 1: Setup Database di Supabase
1. Buka dashboard [Supabase](https://supabase.com) dan buat project baru.
2. Buka menu **SQL Editor** di sidebar kiri.
3. Buka file [`supabase-schema.sql`](file:///home/nayoga/project-google.riview/supabase-schema.sql) di project ini, salin seluruh kodenya, lalu klik **Run** di Supabase.
4. Buka menu **Project Settings** → **API**:
   - Salin **Project URL** (masukkan ke `NEXT_PUBLIC_SUPABASE_URL`).
   - Salin **service_role secret key** (masukkan ke `SUPABASE_SERVICE_ROLE_KEY`).

### Langkah 2: Deploy ke Vercel
1. Push repository ini ke GitHub akun Anda: `yogajah1`.
2. Buka [Vercel](https://vercel.com) → **Add New Project** → pilih repository dari akun GitHub `yogajah1`.
3. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_BASE_URL`: Domain Vercel Anda (misal `https://nama-project.vercel.app`)
   - `ADMIN_SECRET`: Password admin Anda (bebas, misal `rahasia12345`)
   - `TELEGRAM_BOT_TOKEN`: `9110839850:AAHCEyj7ZDeC2dg0fvlsJcmeaAYdcvMJMdc`
   - `TELEGRAM_ALLOWED_USER`: `thisfinoenable`
   - `NEXT_PUBLIC_SUPABASE_URL`: (URL Supabase dari Langkah 1)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Service Role Key dari Langkah 1)
4. Klik **Deploy**.

### Langkah 3: Aktifkan Webhook Bot Telegram
Setelah website aktif di Vercel, buka URL ini sekali di browser Anda untuk mengaktifkan bot:
```
https://nama-project.vercel.app/api/bot/telegram?action=set_webhook
```
Bot Telegram Anda siap digunakan 24/7 tanpa perlu menyewa VPS!

---

## 🖨 Alur Produksi Fisik (Akrilik + Stiker Vinyl + NTAG215)

1. Buka Dashboard Admin (`/admin`) atau kirim chat ke Bot Telegram: `/generate 20`.
2. Buka menu **Cetak QR Vinyl A4** (`/admin/print`). Tekan **Ctrl + P**, pilih jenis kertas stiker vinyl.
3. Gunting stiker vinyl mengikuti garis putus-putus pembatas, lalu tempelkan ke akrilik susu.
4. Buka aplikasi **NFC Tools** di smartphone (Android/iOS):
   - Pilih **Write** → **Add a record** → **URL**.
   - Ketik link sesuai kode kartu yang tercetak di stiker (contoh: `https://domainanda.com/r/REV-A8F2K`).
   - Tempelkan koin NTAG215 ke belakang smartphone.
   - *(Sangat Dianjurkan)*: Pilih opsi **Lock / Make Read Only** di aplikasi NFC Tools agar isi chip NFC tidak bisa ditimpa orang luar.
5. Tempelkan koin NTAG215 di belakang akrilik susu (atau diapit di antara stiker).
6. Kartu fisik siap dijual ke klien UMKM!
