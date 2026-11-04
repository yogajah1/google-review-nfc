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
              width: 250,
              errorCorrectionLevel: 'M',
              color: {
                dark: '#1e293b',
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
              <h1 className="text-sm font-bold text-slate-900">Lembar Cetak Stiker Vinyl QR Code</h1>
              <p className="text-[11px] text-slate-400">Siap cetak ke kertas vinyl / stiker untuk ditempel ke akrilik susu</p>
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
            <p className="font-bold">📱 Panduan Menulis NFC NTAG215 Sesuai QR Code:</p>
            <p className="text-amber-800">
              1. Cetak lembar stiker vinyl di bawah ini dan gunting mengikuti garis putus-putus. Tempel ke akrilik susu.<br />
              2. Buka aplikasi <b>NFC Tools</b> di HP Android / iPhone.<br />
              3. Pilih menu <b>Write</b> → <b>Add a record</b> → <b>URL</b>.<br />
              4. Masukkan link sesuai <b>Kode Kartu</b> yang tertera di bawah QR (misal: <code className="bg-white px-1 py-0.5 rounded text-blue-700 font-bold">{origin}/r/REV-XXXXX</code>).<br />
              5. Dekatkan koin NTAG215 ke HP. Koin siap dipasang di belakang akrilik!
            </p>
          </div>
        </div>
      </div>

      {/* Grid Kartu Siap Cetak */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 print:p-0">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Menyiapkan QR Code kualitas tinggi...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-700">Belum ada kartu untuk dicetak.</p>
            <p className="text-xs text-slate-400 mt-1">Kembali ke Dashboard Admin dan klik &quot;Generate Batch Kartu Baru&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-between text-center relative shadow-sm print:shadow-none print:border-dashed print:border-slate-400 print:break-inside-avoid print:p-3"
                style={{ minHeight: '320px' }}
              >
                {/* Header Logo Google & Bintang */}
                <div className="w-full flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    <span className="font-bold text-slate-800 text-sm tracking-tight">Google Review</span>
                  </div>

                  {/* 5 Bintang Emas */}
                  <div className="flex items-center gap-0.5 text-amber-400 text-sm mb-1">
                    {'★★★★★'}
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                    Beri Ulasan Bintang 5
                  </p>
                </div>

                {/* QR Code */}
                <div className="my-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.qrDataUrl}
                    alt={`QR Code ${card.id}`}
                    className="w-36 h-36 object-contain"
                  />
                </div>

                {/* Footer Kartu & ID Kunci NFC */}
                <div className="w-full space-y-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-700">
                    <span>Scan QR atau Tap NFC</span>
                  </div>

                  {/* KODE PENTING: Untuk input ke aplikasi NFC Tools */}
                  <div className="border-t border-slate-100 pt-1.5">
                    <p className="text-[10px] text-slate-400 font-medium">KODE KARTU (NFC):</p>
                    <p className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                      {card.id}
                    </p>
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
