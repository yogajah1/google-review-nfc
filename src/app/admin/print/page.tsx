'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Card } from '@/types/card';
import { Printer, ArrowLeft, RefreshCw, Smartphone, Search, Trash2 } from 'lucide-react';

interface PrintableCard extends Card {
  qrDataUrl: string;
  targetUrl: string;
}

export default function BatchPrintPage() {
  const [cards, setCards] = useState<PrintableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [batches, setBatches] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

        // Generate QR Code kualitas tajam untuk setiap kartu
        const base = window.location.origin;
        const printable: PrintableCard[] = await Promise.all(
          rawCards.map(async (c) => {
            const url = `${base}/r/${c.id}`;
            const qrDataUrl = await QRCode.toDataURL(url, {
              margin: 0,
              width: 350,
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

  const handleDeleteOne = async (cardId: string) => {
    if (!confirm(`Hapus kartu ${cardId} dari sistem?`)) return;
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`
        },
        body: JSON.stringify({ action: 'delete', card_id: cardId }),
      });
      const data = await res.json();
      if (data.success) {
        setCards(prev => prev.filter(c => c.id !== cardId));
      }
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter Cards
  const filteredCards = cards.filter(c => {
    const matchesBatch = filterBatch === 'all' || c.batch_id === filterBatch;
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.store_name && c.store_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBatch && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white print:p-0">
      
      {/* Top Header & Control Bar (Sembunyi saat diprint) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Cetak Stiker Vinyl Google Review</h1>
              <p className="text-[11px] text-slate-400">Komposisi 1:1 persis plakat akrilik resmi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Searchbox Nama Toko / ID */}
            <div className="relative hidden md:block w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama toko / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Batch */}
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium outline-none"
            >
              <option value="all">Semua Batch ({cards.length})</option>
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
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">📱 Panduan Cetak Vinyl &amp; Penulisan NFC:</p>
              <p className="text-blue-900">
                1. Desain kartu di bawah ini dibuat <b>bujur sangkar presisi 1:1</b> dengan 4 kuadran warna khas Google (Biru, Merah, Hijau, Kuning).<br />
                2. Di dalam kartu <b>murni tanpa ID kartu</b> persis seperti contoh akrilik toko.<br />
                3. URL NFC tercetak di strip atas di luar garis gunting untuk panduan kamu saat scan pakai aplikasi <b>NFC Tools</b>.
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-blue-700 font-bold whitespace-nowrap">
            Total {filteredCards.length} Kartu
          </div>
        </div>
      </div>

      {/* Grid Kartu Siap Cetak */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 print:p-0">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Menyiapkan kartu ulasan berkualitas tinggi...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">Tidak ada kartu yang ditemukan.</p>
            <p className="text-xs text-slate-400 mt-1">Kembali ke Dashboard Admin dan klik &quot;Generate Batch Kartu Baru&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10 print:grid-cols-2 print:gap-8 justify-items-center">
            {filteredCards.map((card) => (
              <div key={card.id} className="flex flex-col items-center print:break-inside-avoid">
                
                {/* Petunjuk Operator di LUAR Stiker + Tombol Hapus 1 per 1 */}
                <div className="w-[330px] flex items-center justify-between px-3 py-1.5 text-[11px] font-mono text-slate-500 border border-dashed border-slate-300 rounded-t-xl bg-slate-50 print:bg-white mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>✂️ Garis Potong</span>
                    <span className="font-bold text-slate-900">• {origin}/r/{card.id}</span>
                  </div>
                  
                  {/* Tombol Hapus Kartu Ini (Hanya tampil di layar, sembunyi saat diprint) */}
                  <button
                    onClick={() => handleDeleteOne(card.id)}
                    title="Hapus kartu ini"
                    className="print:hidden p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ========================================================
                    KARTU FISIK AKRILIK BUJUR SANGKAR MURNI 1:1
                    PERSIS FOTO CONTOH (TANPA ID / TEKS TAMBAHAN)
                    ======================================================== */}
                <div 
                  className="relative w-[330px] h-[330px] rounded-[32px] p-4 shadow-xl print:shadow-none overflow-hidden flex flex-col justify-end border border-slate-200/50 print:border-none"
                  style={{
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* 4 Kuadran Warna Google di Border Luar */}
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div style={{ backgroundColor: '#1A73E8' }}></div> {/* Biru Google */}
                    <div style={{ backgroundColor: '#EA4335' }}></div> {/* Merah Google */}
                    <div style={{ backgroundColor: '#34A853' }}></div> {/* Hijau Google */}
                    <div style={{ backgroundColor: '#FBBC05' }}></div> {/* Kuning Google */}
                  </div>

                  {/* Kotak Putih Utama di Tengah */}
                  <div 
                    className="relative w-full h-[84%] bg-white rounded-[24px] pt-8 pb-3.5 px-3.5 flex flex-col items-center justify-between"
                    style={{
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                    }}
                  >
                    
                    {/* Kubah Setengah Lingkaran Tempat Duduk Logo Google G */}
                    <div 
                      className="absolute -top-9 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white flex items-center justify-center"
                      style={{
                        boxShadow: '0 -2px 6px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Logo Google G Resmi Bulat */}
                      <svg className="w-13 h-13" viewBox="0 0 24 24" style={{ width: '52px', height: '52px' }}>
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    </div>

                    {/* Header Teks & 5 Bintang Emas */}
                    <div className="text-center w-full mt-0.5">
                      <p className="text-[13px] font-normal text-[#202124] tracking-normal leading-tight font-sans">
                        Bantu Kami Dengan
                      </p>
                      <h2 className="text-[23px] font-bold text-[#1f1f1f] tracking-tight leading-tight font-sans mt-0.5">
                        Google Review
                      </h2>
                      {/* 5 Bintang Emas Kuning */}
                      <div className="flex items-center justify-center gap-1 text-[#FBBC05] text-lg leading-none mt-1">
                        {'★ ★ ★ ★ ★'}
                      </div>
                    </div>

                    {/* Pembagian Dua Kolom Presisi (NFC vs QR Code) */}
                    <div className="w-full flex items-center justify-between px-2 pt-1 pb-1">
                      
                      {/* Sisi Kiri: Ikon NFC & Smartphone Tangan */}
                      <div className="w-[44%] flex flex-col items-center justify-center text-center">
                        <div className="h-16 flex items-center justify-center">
                          <svg viewBox="0 0 125 72" className="w-28 h-15">
                            {/* Oval NFC Badge */}
                            <rect x="5" y="21" width="48" height="30" rx="15" fill="none" stroke="#202124" strokeWidth="2.5" />
                            <text x="29" y="40" textAnchor="middle" fill="#202124" fontSize="12" fontWeight="800" fontFamily="sans-serif">NFC</text>
                            
                            {/* Gelombang Sinyal NFC */}
                            <path d="M 57 27 A 15 15 0 0 1 57 45" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 62 23 A 21 21 0 0 1 62 49" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Smartphone */}
                            <rect x="78" y="7" width="25" height="48" rx="4.5" fill="#ffffff" stroke="#202124" strokeWidth="2.5" />
                            <line x1="86" y1="11" x2="95" y2="11" stroke="#202124" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="90.5" cy="49" r="1.3" fill="#202124" />

                            {/* Tangan Memegang Smartphone */}
                            <path d="M 75 32 C 75 27 78 27 78 32 L 78 38" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 103 19 C 108 19 108 24 103 24" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 103 25 C 108 25 108 30 103 30" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 103 31 C 108 31 108 36 103 36" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 103 37 L 111 46 L 106 54 L 95 48" fill="none" stroke="#202124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-extrabold text-[#202124] tracking-wider uppercase mt-1 font-sans">
                          TEMPELKAN HP KAMU
                        </p>
                      </div>

                      {/* Garis Pemisah Vertikal & Teks ATAU */}
                      <div className="relative flex flex-col items-center justify-center h-18 w-[12%]">
                        <div className="w-[1.5px] h-full bg-slate-300"></div>
                        <span className="absolute bg-white px-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                          ATAU
                        </span>
                      </div>

                      {/* Sisi Kanan: QR Code */}
                      <div className="w-[44%] flex flex-col items-center justify-center text-center">
                        <div className="h-16 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={card.qrDataUrl}
                            alt="QR Code"
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                        <p className="text-[10px] font-extrabold text-[#202124] tracking-wider uppercase mt-1 font-sans">
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
