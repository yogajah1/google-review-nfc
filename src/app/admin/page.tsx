'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/types/card';
import { 
  ShieldCheck, 
  Plus, 
  Printer, 
  RotateCcw, 
  Unlock, 
  Trash2, 
  ExternalLink, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Lock,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unactivated: 0, totalScans: 0 });
  const [loading, setLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unactivated'>('all');
  const [notification, setNotification] = useState('');

  // Check saved secret in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_secret');
    if (saved) {
      setSecret(saved);
      fetchData(saved);
    }
  }, []);

  const fetchData = async (sec: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cards?secret=${encodeURIComponent(sec)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCards(data.cards);
        setStats(data.stats);
        setIsLoggedIn(true);
        localStorage.setItem('admin_secret', sec);
      } else {
        setIsLoggedIn(false);
        setNotification('Password admin salah!');
      }
    } catch {
      setIsLoggedIn(false);
      setNotification('Koneksi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(secret);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_secret');
    setIsLoggedIn(false);
    setSecret('');
  };

  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 200) {
      alert('Jumlah kartu harus antara 1 sampai 200');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`
        },
        body: JSON.stringify({
          action: 'generate',
          count: generateCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification(`Berhasil generate ${data.count} kartu baru!`);
        fetchData(secret);
      } else {
        alert(data.error || 'Gagal generate kartu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'reset' | 'unlock' | 'delete', cardId: string) => {
    if (action === 'delete' && !confirm(`Yakin ingin menghapus kartu ${cardId}?`)) return;
    if (action === 'reset' && !confirm(`Yakin ingin mereset kartu ${cardId} ke status awal?`)) return;

    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`
        },
        body: JSON.stringify({ action, card_id: cardId }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Aksi ${action} pada ${cardId} berhasil.`);
        fetchData(secret);
      }
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  // Filter Cards
  const filteredCards = cards.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.store_name && c.store_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.owner_phone && c.owner_phone.includes(searchTerm));

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

  // ==========================================
  // VIEW: FORM LOGIN ADMIN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">Owner Admin Control</h1>
            <p className="text-xs text-slate-400 mt-1">
              Google Review NFC & QR Platform
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {notification && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {notification}
              </p>
            )}

            <div>
              <input
                type="password"
                required
                placeholder="Masukkan Admin Secret..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30"
            >
              {loading ? 'Memeriksa...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            Hanya pemilik sistem yang memiliki akses kontrol.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD ADMIN UTAMA
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      
      {/* Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              GR
            </div>
            <div>
              <h1 className="text-sm font-bold">Admin Google Review NFC</h1>
              <p className="text-[10px] text-slate-400">Owner: @thisfinoenable</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/print"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak QR Vinyl A4</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification('')} className="text-emerald-600 font-bold">×</button>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Kartu</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <p className="text-[11px] text-slate-400 mt-1">Dicetak di sistem</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Aktif di Toko</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            <p className="text-[11px] text-slate-400 mt-1">Sudah diaktivasi klien</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Stok Belum Aktif</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.unactivated}</div>
            <p className="text-[11px] text-slate-400 mt-1">Siap dijual ke UMKM</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Tap Scan</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{stats.totalScans}</div>
            <p className="text-[11px] text-slate-400 mt-1">Pengunjung memberi review</p>
          </div>
        </div>

        {/* Action Panel: Batch Generate & Quick Print */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200">
              <Sparkles className="w-3 h-3" />
              Produksi Massal Akrilik & Vinyl
            </div>
            <h2 className="text-lg font-bold">Cetak Batch Kartu Baru</h2>
            <p className="text-xs text-blue-200 max-w-xl">
              Buat puluhan ID kartu sekaligus. Cetak lembar stiker QR Code di vinyl, lalu flash URL ke chip NTAG215 via HP.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
              <span className="text-xs px-2 text-white font-medium">Jumlah:</span>
              <input
                type="number"
                min={1}
                max={200}
                value={generateCount}
                onChange={(e) => setGenerateCount(parseInt(e.target.value, 10) || 1)}
                className="w-16 bg-white text-slate-900 text-center font-bold text-sm py-1.5 rounded-lg outline-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Sekarang</span>
            </button>

            <Link
              href="/admin/print"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Print Sheet</span>
            </Link>
          </div>
        </div>

        {/* Bot Info Banner */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Bot Telegram Pribadi Anda Terhubung!</p>
              <p className="text-[11px] text-emerald-700">
                Akses eksklusif: <b>@thisfinoenable</b>. Anda bisa ketik <code>/generate 20</code> atau <code>/stats</code> langsung dari HP di mana saja.
              </p>
            </div>
          </div>
          <a
            href="/api/bot/telegram"
            target="_blank"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap transition"
          >
            Cek Status Webhook
          </a>
        </div>

        {/* Card List Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID kartu, nama toko, no HP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Semua ({cards.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Aktif ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter('unactivated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === 'unactivated' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Belum Aktif ({stats.unactivated})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">ID Kartu</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Nama Toko</th>
                  <th className="py-3 px-4">WhatsApp Toko</th>
                  <th className="py-3 px-4 text-center">Tap Scan</th>
                  <th className="py-3 px-4 text-center">Keamanan PIN</th>
                  <th className="py-3 px-4 text-right">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada kartu yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((c) => {
                    const isLocked = c.locked_until && new Date(c.locked_until).getTime() > Date.now();
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        {/* ID Kartu */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <Link href={`/r/${c.id}`} target="_blank" className="hover:text-blue-600 inline-flex items-center gap-1">
                            <span>{c.id}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                          {c.batch_id && (
                            <span className="block text-[10px] font-sans font-normal text-slate-400">
                              {c.batch_id}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {c.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Belum Diaktivasi
                            </span>
                          )}
                        </td>

                        {/* Nama Toko */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{c.store_name || '-'}</div>
                          {c.google_review_url && (
                            <a
                              href={c.google_review_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-500 hover:underline truncate max-w-[200px] block"
                            >
                              {c.google_review_url}
                            </a>
                          )}
                        </td>

                        {/* WhatsApp */}
                        <td className="py-3 px-4 text-slate-600">
                          {c.owner_phone ? (
                            <a
                              href={`https://wa.me/${c.owner_phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline font-mono"
                            >
                              {c.owner_phone}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Total Scan */}
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {c.total_scans || 0}
                        </td>

                        {/* Keamanan & PIN */}
                        <td className="py-3 px-4 text-center">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <Lock className="w-3 h-3" />
                              Terkunci (5x Salah)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {c.failed_attempts > 0 ? `${c.failed_attempts}x salah` : 'Normal'}
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {isLocked && (
                              <button
                                onClick={() => handleAction('unlock', c.id)}
                                title="Buka Kunci Kartu"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}

                            {c.status === 'active' && (
                              <button
                                onClick={() => handleAction('reset', c.id)}
                                title="Reset Kartu Jadi Kosong"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            <Link
                              href={`/r/${c.id}/edit`}
                              target="_blank"
                              title="Buka Menu Edit"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleAction('delete', c.id)}
                              title="Hapus Kartu"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

    </div>
  );
}
