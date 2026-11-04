import Link from 'next/link';
import { 
  Sparkles, 
  Smartphone, 
  Layers,
  Lock,
  Star,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* Top Navbar (Bersih tanpa link admin) */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              G
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">Google Review NFC</span>
              <span className="text-[10px] text-emerald-400 font-medium ml-2 px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                Official Card
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/6281234567890?text=Halo%20saya%20tertarik%20pesan%20kartu%20Google%20Review%20NFC"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition shadow-md shadow-blue-600/30"
            >
              Pesan Kartu Sekarang
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-8">
        
        {/* Badge Intro */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solusi Ulasan Cepat untuk Kafe, Restoran, Bengkel, dan UMKM</span>
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
            Plakat akrilik susu elegan berteknologi chip NFC &amp; QR Code dinamis. 
            Pelanggan tidak perlu repot mengetik nama toko di Google — cukup dekatkan HP atau scan QR, halaman bintang 5 langsung terbuka otomatis!
          </p>
        </div>

        {/* 5 Bintang Visual */}
        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-2xl pt-1">
          {'★ ★ ★ ★ ★'}
        </div>

        {/* Action Demo Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/r/REV-DEMO1"
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <span>Coba Demo Aktivasi Kartu</span>
            <ExternalLink className="w-4 h-4" />
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
              Dapat discan melalui kamera HP maupun langsung di-tap lewat chip NFC. Tanpa perlu download aplikasi apa pun, langsung responsif di iPhone dan Android.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Keamanan PIN 4-Digit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toko terlindungi dengan enkripsi Bcrypt dan auto-lockout 30 menit jika ada yang mencoba membajak atau mengubah alamat kartu review Anda.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Bebas Pindah Alamat Toko</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika toko Anda pindah lokasi, ganti cabang, atau ganti link Google Maps, alamat bisa diubah kapan saja menggunakan PIN Anda tanpa mengganti kartu fisik.
            </p>
          </div>

        </div>

        {/* 3 Langkah Mudah */}
        <div className="w-full bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left space-y-6">
          <h3 className="text-lg font-bold text-white text-center">Cara Kerja Sangat Praktis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-white">Letakkan di Meja Kasir</h4>
              <p className="text-xs text-slate-400">Taruh plakat akrilik di meja kasir atau etalase toko yang mudah dilihat pengunjung.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-white">Pelanggan Tap / Scan</h4>
              <p className="text-xs text-slate-400">Cukup dekatkan HP pelanggan ke kartu atau buka kamera untuk scan QR Code.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-white">Review Bintang 5 Meluncur</h4>
              <p className="text-xs text-slate-400">Layar rating bintang 5 Google Maps langsung terbuka otomatis dalam hitungan detik.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Bersih (Tanpa link admin) */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Google Review NFC Platform. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            Membantu UMKM Indonesia naik kelas dengan reputasi Google Review terpercaya.
          </p>
        </div>
      </footer>

    </div>
  );
}
