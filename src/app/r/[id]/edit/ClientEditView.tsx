'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/types/card';
import { 
  Lock, 
  ShieldAlert, 
  Store, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ArrowLeft, 
  Save, 
  KeyRound, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface Props {
  card: Card;
  isInitiallyLocked: boolean;
  initialLockedMinutes: number;
}

export default function ClientEditView({ card, isInitiallyLocked, initialLockedMinutes }: Props) {
  // Step: 'auth' -> 'edit' -> 'success'
  const [step, setStep] = useState<'auth' | 'edit' | 'success'>('auth');
  
  // Auth state
  const [pin, setPin] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  
  // Edit form state
  const [storeName, setStoreName] = useState(card.store_name || '');
  const [googleUrl, setGoogleUrl] = useState(card.google_review_url || '');
  const [ownerPhone, setOwnerPhone] = useState(card.owner_phone || '');
  const [newPin, setNewPin] = useState('');
  const [showPlaceFinderModal, setShowPlaceFinderModal] = useState(false);
  const [modalPlaceIdInput, setModalPlaceIdInput] = useState('');

  // Autocomplete Sugesti
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (val: string) => {
    setGoogleUrl(val);
    if (debounceTimer) clearTimeout(debounceTimer);

    const clean = val.trim();
    if (clean.length >= 2 && !clean.startsWith('http')) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/places/suggest?q=${encodeURIComponent(clean)}`);
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 250);
      setDebounceTimer(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (chosenName: string) => {
    setGoogleUrl(chosenName);
    setStoreName(chosenName);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const res = await fetch('/api/places/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: chosenName }),
      });
      const data = await res.json();
      if (data.directReviewUrl) {
        setGoogleUrl(data.directReviewUrl);
        if (data.storeName) setStoreName(data.storeName);
      }
    } catch {
      // ignore
    }
  };
  
  // Security & Feedback state
  const [isLocked, setIsLocked] = useState(isInitiallyLocked);
  const [lockedMinutes, setLockedMinutes] = useState(initialLockedMinutes);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Verifikasi PIN sebelum membuka akses edit
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('Masukkan 4 digit angka PIN pengaman Anda!');
      return;
    }

    setLoading(true);
    try {
      // Test submit PIN ke endpoint update tanpa payload data baru (hanya verifikasi)
      const res = await fetch(`/api/cards/${card.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          phone_last_4: phoneLast4 || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.lockedMinutes) {
          setIsLocked(true);
          setLockedMinutes(data.lockedMinutes);
        }
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
        setErrorMessage(data.error || 'Verifikasi PIN gagal.');
        setLoading(false);
        return;
      }

      // PIN Benar -> Buka form edit
      setStep('edit');
      setLoading(false);
    } catch (err: any) {
      setErrorMessage('Koneksi terputus: ' + err.message);
      setLoading(false);
    }
  };

  // Simpan data perubahan toko
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    let finalUrl = googleUrl.trim();
    if (finalUrl.includes('g.page/r/')) {
      const clean = finalUrl.replace(/\/+$/, '');
      finalUrl = clean.endsWith('/review') ? clean : `${clean}/review`;
    } else if (!finalUrl.startsWith('http')) {
      finalUrl = `https://search.google.com/local/writereview?query=${encodeURIComponent(finalUrl)}`;
    }

    if (newPin && !/^\d{4}$/.test(newPin)) {
      setErrorMessage('PIN baru harus berupa 4 digit angka!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin, // PIN yang sudah terverifikasi sebelumnya
          store_name: storeName,
          google_review_url: finalUrl,
          owner_phone: ownerPhone,
          new_pin: newPin || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal menyimpan perubahan.');
        setLoading(false);
        return;
      }

      setStep('success');
      setLoading(false);
    } catch (err: any) {
      setErrorMessage('Koneksi gagal: ' + err.message);
      setLoading(false);
    }
  };

  // ========================================================
  // LAYAR TERKUNCI (LOCKOUT PROTECTION)
  // ========================================================
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">Akses Terkunci Sementara</h1>
            <p className="text-xs text-rose-600 font-semibold mt-1">
              Salah memasukkan PIN 5 kali berturut-turut.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 leading-relaxed text-left">
            Demi keamanan toko dari pembajakan oleh pihak tidak bertanggung jawab, akses kartu ini diblokir sementara selama:
            <div className="text-center text-lg font-bold text-rose-900 my-2">
              ± {lockedMinutes} Menit
            </div>
            Jika Anda adalah pemilik sah toko dan lupa PIN Anda, silakan hubungi admin di Telegram: <b>@thisfinoenable</b> untuk bantuan verifikasi dan reset PIN.
          </div>

          <Link
            href={`/r/${card.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Kartu</span>
          </Link>
        </div>
      </div>
    );
  }

  // ========================================================
  // LAYAR SUKSES UPDATE
  // ========================================================
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-800">Alamat Review Berhasil Diperbarui!</h1>
            <p className="text-xs text-slate-500 mt-1">
              Setiap kali kartu NFC atau QR discan, pelanggan akan langsung diarahkan ke link baru Anda.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs space-y-1">
            <p className="text-slate-400">Nama Toko:</p>
            <p className="font-bold text-slate-800">{storeName}</p>
            <p className="text-slate-400 pt-1">Link Baru:</p>
            <p className="font-mono text-blue-600 truncate">{googleUrl}</p>
          </div>

          <div className="space-y-2">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <span>Uji Coba Buka Link Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href={`/r/${card.id}`}
              className="w-full block py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Kembali ke Kartu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // LAYAR STEP 2: FORM EDIT TOKO & PINDAH ALAMAT
  // ========================================================
  if (step === 'edit') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          <div className="bg-slate-900 p-6 sm:p-8 text-white relative">
            <Link
              href={`/r/${card.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal</span>
            </Link>
            <h1 className="text-xl font-bold">Ubah Alamat & Informasi Toko</h1>
            <p className="text-slate-400 text-xs mt-1">
              ID Kartu: <span className="font-mono text-amber-400">{card.id}</span>
            </p>
          </div>

          <form onSubmit={handleSaveEdit} className="p-6 sm:p-8 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SATU KOLOM PINTAR EDIT: Nama Toko atau Link Google Maps Baru */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Toko Baru atau Link Google Maps Baru
              </label>
              <div className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ketik Nama Toko baru atau tempel link Maps..."
                    value={googleUrl}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Floating Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                    <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Saran Toko Google Maps:
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-xs text-slate-800 flex items-center gap-2 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="font-semibold truncate">{item}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPlaceFinderModal(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 transition"
                >
                  <span>🗺️ Cari Toko di Google Place ID Finder</span>
                </button>
                <span className="text-[10px] text-slate-400">
                  Otomatis popup bintang 5
                </span>
              </div>
            </div>

            {/* MODAL POPUP PLACE ID FINDER INTERAKTIF DI DALAM WEB KITA */}
            {showPlaceFinderModal && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-3 animate-scaleUp max-h-[95vh] flex flex-col">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shadow-xs">
                        📍
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">Pencari Toko &amp; Place ID Resmi Google</h3>
                        <p className="text-[11px] text-slate-400">Cari tokomu langsung di peta Google interaktif ini</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPlaceFinderModal(false)}
                      className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center font-bold text-lg transition"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Petunjuk Singkat */}
                  <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-950 space-y-1">
                    <p className="font-bold">🗺️ Cara Cepat Mencari Toko:</p>
                    <p className="text-blue-900 leading-relaxed text-[11px] sm:text-xs">
                      1. Ketik nama toko Anda di kotak pencarian peta di bawah.<br />
                      2. Klik toko Anda dari daftar pencarian.<br />
                      3. Di kotak info peta akan muncul <b>Place ID (ChIJ...)</b>. Salin dan tempelkan ke kolom di bawah peta, lalu klik <b>Gunakan Toko Ini</b>.
                    </p>
                  </div>

                  {/* Peta Interaktif Langsung di Dalam Web */}
                  <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                    <iframe
                      src="https://maps-docs-team.web.app/samples/places-placeid-finder/dist/"
                      title="Google Place ID Finder Resmi"
                      className="w-full h-full border-0"
                      allow="geolocation"
                      loading="lazy"
                    />
                  </div>

                  {/* Input Langsung Tempel / Terapkan Place ID */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Tempel Place ID yang Muncul di Peta:
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: ChIJN1t_tDeuEmsRUsoyG83frY4"
                        value={modalPlaceIdInput}
                        onChange={(e) => setModalPlaceIdInput(e.target.value)}
                        className="w-full sm:flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cleanPid = modalPlaceIdInput.trim();
                          if (!cleanPid) {
                            alert('Silakan salin dan tempel Place ID dari peta terlebih dahulu!');
                            return;
                          }
                          setGoogleUrl(`https://search.google.com/local/writereview?placeid=${cleanPid}`);
                          setShowPlaceFinderModal(false);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <span>⭐ Gunakan Toko Ini</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Place ID akan otomatis mengatur kartu ini langsung membuka popup ulasan bintang 5 Google Maps.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp Pemilik
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Ganti PIN Baru (Opsional) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ganti PIN 4-Digit Baru (Opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Kosongkan jika tidak ingin mengganti PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Alamat</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========================================================
  // LAYAR STEP 1: VERIFIKASI KEAMANAN (MASUKKAN PIN 4 DIGIT)
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header Security */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold">Verifikasi Keamanan Toko</h1>
          <p className="text-slate-400 text-xs mt-1">
            Untuk mengubah alamat atau link Google Review, masukkan PIN 4 digit yang Anda buat saat aktivasi.
          </p>
        </div>

        <form onSubmit={handleVerifyPin} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {remainingAttempts !== null && remainingAttempts < 5 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs text-center font-medium">
              ⚠️ Peringatan: Sisa percobaan PIN tinggal <b>{remainingAttempts} kali lagi</b> sebelum kartu terkunci.
            </div>
          )}

          {/* PIN 4 Digit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center mb-2">
              Masukkan PIN Pengaman 4 Digit
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full text-center tracking-widest text-2xl font-bold py-3 bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Verifikasi Tambahan (4 Digit Terakhir No HP) */}
          {card.owner_phone && (
            <div>
              <label className="block text-[11px] text-slate-500 text-center mb-1">
                Verifikasi Cadangan: 4 Digit Terakhir No. WhatsApp
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="4 digit terakhir (opsional)"
                value={phoneLast4}
                onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full text-center text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-40"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              'Buka Kunci & Kelola Alamat Toko'
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href={`/r/${card.id}`}
              className="text-xs text-slate-400 hover:text-slate-600 transition"
            >
              Kembali ke Kartu Review
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
