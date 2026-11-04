'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Card } from '@/types/card';
import { Printer, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

interface PrintableCard extends Card {
  qrDataUrl: string;
  targetUrl: string;
}

export default function BatchPrintPage() {
  const [cards, setCards] = useState<PrintableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [batches, setBatches] = useState<string[]>([]);
  const [secret, setSecret] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = localStorage.getItem('admin_secret') || 'admin12345';
    setSecret(saved);
    loadCards(saved);
  }, []);

  const loadCards = async (sec: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cards?secret=${encodeURIComponent(sec)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const rawCards: Card[] = data.cards;
        
        // Kumpulkan daftar batch
        const batchSet = new Set<string>();
        rawCards.forEach(c => {
          if (c.batch_id) batchSet.add(c.batch_id);
        });
        setBatches(Array.from(batchSet));

        // Generate QR Code untuk setiap kartu
        const base = window.location.origin;
        const printable: PrintableCard[] = await Promise.all(
          rawCards.map(async (c) => {
            const url = `${base}/r/${c.id}`;
            const qrDataUrl = await QRCode.toDataURL(url, {
              margin: 1,
              width: 320,
              errorCorrectionLevel: 'M',
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
            });
            return {
              ...c,
              qrDataUrl,
              targetUrl: url,
            };
          })
        );

        setCards(printable);
      }
    } catch (err) {
      console.error('Failed to load cards for printing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredCards = cards.filter(c => {
    if (filterBatch === 'all') return true;
    return c.batch_id === filterBatch;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white print:p-0">
      
      {/* Top Header & Control Bar (Sembunyi saat diprint) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Lembar Cetak Stiker Vinyl Google Review</h1>
              <p className="text-[11px] text-slate-400">Desain resmi Google Review persis contoh akrilik</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Batch */}
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium outline-none"
            >
              <option value="all">Semua Kartu ({cards.length})</option>
              {batches.map(b => (
                <option key={b} value={b}>Batch: {b}</option>
              ))}
            </select>

            <button
              onClick={() => loadCards(secret)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Ctrl + P)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Guide Banner for NFC Programming (Sembunyi saat print) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 print:hidden">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">📱 Catatan Khusus Cetak &amp; Program NFC:</p>
            <p className="text-amber-800">
              • Di dalam kartu <b>murni 100% tanpa ID/nama pengguna</b> persis contoh foto.<br />
              • ID Kartu hanya ditaruh di <b>luar garis potong stiker</b> (di strip atas abu-abu) agar kamu tahu URL mana yang harus dimasukkan ke koin NTAG215 via aplikasi NFC Tools sebelum stiker digunting dan ditempel ke akrilik.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Kartu Siap Cetak */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 print:p-0">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Menyiapkan cetakan resolusi tinggi...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">Belum ada kartu untuk dicetak.</p>
            <p className="text-xs text-slate-400 mt-1">Generate kartu baru dari Dashboard Admin atau bot Telegram.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 print:grid-cols-2 print:gap-6 justify-items-center">
            {filteredCards.map((card) => (
              <div key={card.id} className="flex flex-col items-center print:break-inside-avoid">
                
                {/* Petunjuk ID untuk Operator NFC (Ada di luar garis potong stiker) */}
                <div className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-mono text-slate-500 border border-dashed border-slate-300 rounded-t-lg bg-slate-50 print:bg-white mb-1">
                  <span>✂️ Gunting mengikuti garis luar</span>
                  <span className="font-bold text-slate-800">URL NFC: {origin}/r/{card.id}</span>
                </div>

                {/* ========================================================
                    KARTU FISIK MURNI PERSIS CONTOH FOTO (TANPA ID)
                    ======================================================== */}
                <div 
                  className="relative w-[340px] h-[340px] sm:w-[350px] sm:h-[350px] rounded-[36px] p-3 shadow-lg print:shadow-none overflow-hidden flex flex-col justify-end"
                  style={{
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Background 4 Warna Google Khas */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div className="bg-[#1A73E8]"></div> {/* Biru Google */}
                    <div className="bg-[#EA4335]"></div> {/* Merah Google */}
                    <div className="bg-[#34A853]"></div> {/* Hijau Google */}
                    <div className="bg-[#FBBC05]"></div> {/* Kuning Google */}
                  </div>

                  {/* Kontainer Putih Utama di Tengah */}
                  <div className="relative w-full h-[85%] bg-white rounded-[26px] pt-7 pb-4 px-4 flex flex-col items-center justify-between shadow-xs">
                    
                    {/* Kubah Setengah Lingkaran Tempat Logo Google G Duduk */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xs">
                      {/* Logo Google G Bulat Full Color */}
                      <svg className="w-14 h-14" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    </div>

                    {/* Judul Header */}
                    <div className="text-center mt-1">
                      <p className="text-[13px] font-medium text-[#202124] leading-tight">
                        Bantu Kami Dengan
                      </p>
                      <h2 className="text-[22px] font-extrabold text-[#202124] tracking-tight leading-tight">
                        Google Review
                      </h2>
                      {/* 5 Bintang Emas Kuning */}
                      <div className="flex items-center justify-center gap-1 text-[#FBBC05] text-lg mt-0.5">
                        {'★ ★ ★ ★ ★'}
                      </div>
                    </div>

                    {/* Pembagian Dua Kolom: NFC vs QR Code */}
                    <div className="w-full flex items-center justify-between px-1 mt-1">
                      
                      {/* Kolom Kiri: Ilustrasi NFC + Tangan HP */}
                      <div className="w-[45%] flex flex-col items-center justify-center text-center">
                        <div className="h-16 flex items-center justify-center mb-1">
                          {/* SVG NFC & Phone in Hand persis seperti contoh */}
                          <svg viewBox="0 0 120 70" className="w-28 h-16">
                            {/* Oval Badge NFC */}
                            <rect x="4" y="20" width="46" height="28" rx="14" fill="none" stroke="#202124" strokeWidth="2.5" />
                            <text x="27" y="38" textAnchor="middle" fill="#202124" fontSize="11" fontWeight="800" fontFamily="sans-serif">NFC</text>
                            
                            {/* Gelombang Sinyal NFC */}
                            <path d="M 54 26 A 14 14 0 0 1 54 42" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 59 22 A 20 20 0 0 1 59 46" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />

                            {/* HP Smartphone */}
                            <rect x="74" y="6" width="24" height="46" rx="4" fill="#ffffff" stroke="#202124" strokeWidth="2.5" />
                            <line x1="82" y1="10" x2="90" y2="10" stroke="#202124" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="86" cy="46" r="1.2" fill="#202124" />

                            {/* Tangan Memegang HP */}
                            <path d="M 71 30 C 71 25 74 25 74 30 L 74 36" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 98 18 C 103 18 103 23 98 23" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 98 24 C 103 24 103 29 98 29" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 98 30 C 103 30 103 35 98 35" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 98 36 L 106 44 L 101 52 L 91 46" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-extrabold text-[#202124] tracking-wider uppercase mt-0.5">
                          TEMPELKAN HP KAMU
                        </p>
                      </div>

                      {/* Garis Pemisah Tengah & Teks ATAU */}
                      <div className="relative flex flex-col items-center justify-center h-20 w-[10%]">
                        <div className="w-[1.5px] h-full bg-slate-300"></div>
                        <span className="absolute bg-white px-1 text-[9px] font-bold text-slate-500 uppercase">
                          ATAU
                        </span>
                      </div>

                      {/* Kolom Kanan: QR Code */}
                      <div className="w-[45%] flex flex-col items-center justify-center text-center">
                        <div className="h-16 flex items-center justify-center mb-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.qrDataUrl}
                            alt="QR Code"
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                        <p className="text-[10px] font-extrabold text-[#202124] tracking-wider uppercase mt-0.5">
                          SCAN QR
                        </p>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
