'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/types/card';
import { 
  CheckCircle2, 
  MapPin, 
  Lock, 
  Phone, 
  Store, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Info,
  Star,
  Search,
  CheckCheck
} from 'lucide-react';

interface Props {
  card: Card;
  justVerified: boolean;
}

export default function ClientCardView({ card, justVerified }: Props) {
  // State: SATU KOLOM PINTAR (bisa nama toko atau link maps)
  const [smartInput, setSmartInput] = useState('');
  const [storeName, setStoreName] = useState('');
  const [directReviewUrl, setDirectReviewUrl] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [isConverting, setIsConverting] = useState(false);
  const [convertedSuccess, setConvertedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Current domain URL
  const [origin, setOrigin] = useState('');
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const editUrl = `${origin}/r/${card.id}/edit`;

  // WhatsApp Message Generator untuk pemilik toko
  const generateWaShareUrl = () => {
    const cleanPhone = (card.owner_phone || ownerPhone).replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    
    const message = `Halo! Ini link rahasia untuk mengelola Kartu Google Review toko Anda (${card.store_name || storeName}):\n\n🔗 ${editUrl}\n\n⚠️ PENTING: Simpan link ini di WhatsApp/Bookmark. Jika suatu saat toko pindah alamat atau ganti link Google Maps, buka link tersebut dan masukkan PIN 4 digit yang sudah Anda buat.\n\nTerima kasih!`;
    
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyEditUrl = () => {
    navigator.clipboard.writeText(editUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // FUNGSI KONVERSI OTOMATIS: Mengubah nama toko / link biasa menjadi link review bintang 5 langsung
  const handleSmartConvert = async (val: string) => {
    const inputVal = val.trim();
    if (!inputVal) return;

    setIsConverting(true);
    setConvertedSuccess(false);

    try {
      const res = await fetch('/api/places/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputVal }),
      });
      const data = await res.json();
      
      if (data.directReviewUrl) {
        setDirectReviewUrl(data.directReviewUrl);
        if (data.storeName && !storeName) {
          setStoreName(data.storeName);
        } else if (!storeName && !inputVal.startsWith('http')) {
          setStoreName(inputVal);
        }
        setConvertedSuccess(true);
      }
    } catch (err) {
      console.error('Convert failed:', err);
      // Fallback lokal jika API gagal
      if (inputVal.includes('g.page/r/')) {
        const clean = inputVal.replace(/\/+$/, '');
        setDirectReviewUrl(clean.endsWith('/review') ? clean : `${clean}/review`);
        setConvertedSuccess(true);
      } else if (!inputVal.startsWith('http')) {
        setDirectReviewUrl(`https://search.google.com/local/writereview?query=${encodeURIComponent(inputVal)}`);
        setStoreName(inputVal);
        setConvertedSuccess(true);
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!smartInput.trim()) {
      setErrorMessage('Silakan masukkan Nama Toko atau Link Google Maps!');
      return;
    }

    // Pastikan link ulasan bintang sudah terkonversi
    let finalReviewUrl = directReviewUrl;
    let finalStoreName = storeName || smartInput.trim();

    if (!finalReviewUrl) {
      const input = smartInput.trim();
      if (input.includes('g.page/r/')) {
        const clean = input.replace(/\/+$/, '');
        finalReviewUrl = clean.endsWith('/review') ? clean : `${clean}/review`;
      } else if (input.startsWith('http')) {
        finalReviewUrl = input;
      } else {
        finalReviewUrl = `https://search.google.com/local/writereview?query=${encodeURIComponent(input)}`;
        finalStoreName = input;
      }
    }

    if (!ownerPhone.trim()) {
      setErrorMessage('Silakan masukkan nomor WhatsApp Anda!');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN Pengaman harus berupa 4 digit angka (contoh: 1234)!');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage('Konfirmasi PIN tidak cocok dengan PIN yang dibuat!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: finalStoreName,
          google_review_url: finalReviewUrl,
          owner_phone: ownerPhone,
          pin: pin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal mengaktivasi kartu.');
        setLoading(false);
        return;
      }

      // Berhasil -> redirect ke halaman verified
      window.location.href = `/r/${card.id}?verified=1`;
    } catch (err: any) {
      setErrorMessage('Koneksi terputus: ' + err.message);
      setLoading(false);
    }
  };

  // ========================================================
  // VIEW 1: STATUS VERIFIKASI BERHASIL
  // ========================================================
  if (justVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="inline-flex p-3 bg-white text-emerald-600 rounded-2xl shadow-lg mb-4 ring-8 ring-white/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight">Status Verifikasi Berhasil!</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Kartu Google Review fisik Anda kini sudah aktif dan siap menerima ulasan bintang 5.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Info Toko yang Aktif */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-lg">
                <Store className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium">Toko Aktif</p>
                <h3 className="text-base font-bold text-slate-800 truncate">{card.store_name || storeName}</h3>
                <p className="text-xs text-slate-400">ID Kartu: {card.id}</p>
              </div>
            </div>

            {/* BOX KHUSUS: LINK KELOLA & PINDAH ALAMAT */}
            <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl p-5 relative">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>Simpan Link Kelola / Pindah Alamat Toko</span>
              </div>
              
              <p className="text-xs text-amber-900/80 mb-3 leading-relaxed">
                Jika di masa depan toko Anda <b>pindah alamat, ganti cabang, atau ganti link Google Maps</b>, gunakan link di bawah ini dan masukkan PIN 4-digit yang tadi Anda buat.
              </p>

              {/* Input Box URL */}
              <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl p-2 shadow-sm mb-3">
                <input
                  type="text"
                  readOnly
                  value={editUrl}
                  className="w-full text-xs font-mono text-slate-700 bg-transparent outline-none truncate px-1"
                />
                <button
                  onClick={handleCopyEditUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={generateWaShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim ke WhatsApp Saya</span>
                </a>

                <Link
                  href={`/r/${card.id}/edit`}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition"
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Coba Buka Menu Edit</span>
                </Link>
              </div>
            </div>

            {/* Tombol Test Langsung ke Google Maps Bintang 5 */}
            <div className="pt-2">
              <a
                href={card.google_review_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                <span>⭐ Uji Coba Buka Penilaian Bintang 5</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Setiap pelanggan tap NFC atau scan QR, mereka akan langsung masuk ke form bintang 5 di atas.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 2: KARTU SUDAH AKTIF (Fallback Layar Perantara)
  // ========================================================
  if (card.status === 'active') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              Kartu Google Review Aktif
            </span>
            <h1 className="text-xl font-bold text-slate-800 mt-3">{card.store_name}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Beri kami ulasan bintang 5 di Google Maps untuk mendukung bisnis kami!
            </p>
          </div>

          <a
            href={card.google_review_url || '#'}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition"
          >
            <span>Beri Ulasan Bintang 5 ⭐</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="pt-4 border-t border-slate-100">
            <Link
              href={`/r/${card.id}/edit`}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Pemilik Toko? Ganti Alamat atau Kelola Kartu</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 3: FORM AKTIVASI PERTAMA KALI (SATU KOLOM PINTAR)
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Banner Aktivasi */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white relative">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
              <Sparkles className="w-3.5 h-3.5" />
              Aktivasi Kartu Baru
            </span>
            <span className="text-xs font-mono opacity-80">{card.id}</span>
          </div>

          <h1 className="text-2xl font-bold">Aktivasi Kartu Google Review</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 leading-relaxed">
            Cukup masukkan Nama Toko atau tempel link Google Maps toko Anda, sistem otomatis mengaturnya langsung ke form penilaian bintang 5!
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleActivation} className="p-6 sm:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================
              SATU KOLOM PINTAR (BISA NAMA TOKO ATAU LINK MAPS)
              ======================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nama Toko atau Link Google Maps
              </label>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Tutup Info' : 'Bantuan'}</span>
              </button>
            </div>

            {/* Panduan */}
            {showGuide && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold">💡 Di satu kolom ini kamu bisa:</p>
                <p>1. <b>Ketik Nama Toko:</b> Contoh: <i>Kopi Kenangan Senopati Jakarta</i></p>
                <p>2. <b>Tempel Link Maps:</b> Contoh link share <i>https://g.page/r/...</i> (meskipun tanpa kata /review/, sistem otomatis mengubahnya langsung ke penilaian bintang 5!).</p>
              </div>
            )}

            {/* Input Satu Kolom */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Store className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Ketik Nama Toko atau tempel link Maps..."
                value={smartInput}
                onChange={(e) => {
                  setSmartInput(e.target.value);
                  setConvertedSuccess(false);
                }}
                onBlur={() => {
                  if (smartInput.trim()) {
                    handleSmartConvert(smartInput);
                  }
                }}
                className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => handleSmartConvert(smartInput)}
                disabled={isConverting || !smartInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
              >
                {isConverting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    <span>Proses</span>
                  </>
                )}
              </button>
            </div>

            {/* Notifikasi Status Link Penilaian Bintang 5 */}
            {convertedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
                <div className="flex items-center gap-2 truncate mr-2">
                  <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Siap masuk langsung ke penilaian bintang 5!</span>
                </div>
                {directReviewUrl && (
                  <a
                    href={directReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition whitespace-nowrap flex items-center gap-1"
                  >
                    <span>⭐ Tes Bintang</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Input: Nomor WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp Pemilik Toko
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                placeholder="08123456789 atau 628xxx"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Digunakan untuk pengiriman link pemulihan jika Anda ingin mengubah alamat nanti.
            </p>
          </div>

          {/* PIN Pengaman 4 Digit */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Buat PIN Pengaman 4 Digit</span>
            </div>
            <p className="text-xs text-slate-500">
              PIN ini wajib dimasukkan jika sewaktu-waktu ada yang ingin mengubah alamat toko di kartu ini. Jangan sampai lupa!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  PIN 4 Digit
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center tracking-widest text-lg font-bold py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ulangi PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full text-center tracking-widest text-lg font-bold py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Aktivasi Kartu Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Setiap kartu yang diaktivasi akan langsung diarahkan ke form bintang 5 Google Maps.
          </p>
        </form>

      </div>
    </div>
  );
}
