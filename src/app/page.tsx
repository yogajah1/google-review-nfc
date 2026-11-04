import Link from 'next/link';
import { 
  Sparkles, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Store, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Layers,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              G
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">ReviewNFC</span>
              <span className="text-[10px] text-blue-400 font-mono ml-2 px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">
                v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition"
            >
              Dashboard Admin
            </Link>
            <Link
              href="/admin/print"
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg transition shadow-md shadow-blue-600/30"
            >
              Cetak QR Vinyl
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-8">
        
        {/* Badge Intro */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sistem Kartu Google Review Pintar (NFC NTAG215 + QR Code)</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
            Tingkatkan Review Bintang 5 Google Bisnis Anda <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
              Cukup Sekali Tap atau Scan
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Solusi kartu fisik akrilik susu + stiker vinyl berteknologi chip NFC &amp; QR Code dinamis. 
            Pelanggan tidak perlu repot mencari nama toko di Google — langsung menuju halaman pemberian bintang 5!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/r/REV-DEMO1"
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <span>Uji Coba Form Aktivasi Kartu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition"
          >
            <span>Buka Dashboard Kontrol Pemilik</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full pt-10 text-left">
          
          <div className="bg-slate-800/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">NFC NTAG215 + QR Code</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dapat discan melalui kamera HP maupun langsung di-tap lewat chip NFC. Tanpa perlu download aplikasi apa pun.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Keamanan PIN 4-Digit Maksimal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toko terlindungi dengan enkripsi Bcrypt dan auto-lockout 30 menit jika ada yang mencoba membajak alamat kartu.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Bebas Pindah Alamat Toko</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika pemilik toko pindah lokasi atau ganti cabang, alamat link bisa diubah kapan saja tanpa perlu mengganti kartu fisik.
            </p>
          </div>

        </div>

        {/* Telegram Bot Callout */}
        <div className="w-full bg-gradient-to-r from-slate-800 to-indigo-950 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Bot Telegram Siap Pakai
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">Kontrol Penuh dari HP Anda (@thisfinoenable)</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Cukup buka bot Telegram pribadi Anda untuk generate puluhan QR Code kartu baru, cek status ulasan toko, atau reset kartu jika klien lupa PIN.
            </p>
          </div>

          <Link
            href="/admin"
            className="flex-shrink-0 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            Kelola Kartu Sekarang
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Google Review NFC &amp; QR Platform. Siap deploy ke Vercel &amp; Supabase.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/r/REV-DEMO1" className="hover:text-slate-400">Demo Kartu</Link>
            <Link href="/admin" className="hover:text-slate-400">Admin</Link>
            <Link href="/admin/print" className="hover:text-slate-400">Cetak QR</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
