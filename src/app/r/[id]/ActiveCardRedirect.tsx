'use client';

import React, { useEffect } from 'react';
import { Star, ExternalLink, MapPin } from 'lucide-react';
import { Card } from '@/types/card';

interface Props {
  card: Card;
}

export default function ActiveCardRedirect({ card }: Props) {
  const targetUrl = card.google_review_url || 'https://www.google.com/maps';
  const storeName = card.store_name || 'Toko Google Maps';

  // Ekstrak Place ID jika ada
  const pidMatch = targetUrl.match(/[?&]place(?:id|_id)=([A-Za-z0-9_-]+)/i) || targetUrl.match(/(ChIJ[A-Za-z0-9_-]{20,})/);
  const placeId = pidMatch ? pidMatch[1] : null;

  // URL fallback ulasan Google Maps
  const mapsReviewUrl = placeId 
    ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
    : targetUrl;

  useEffect(() => {
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    
    // Di Android, jika menggunakan format Place ID, buat URL Intent langsung ke aplikasi Google Maps
    let dispatchUrl = targetUrl;
    if (isAndroid && placeId && !targetUrl.includes('g.page')) {
      dispatchUrl = `intent://search.google.com/local/writereview?placeid=${placeId}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end;`;
    }

    // Eksekusi redirect client-side (agar diizinkan Android meluncurkan aplikasi Maps / review modal)
    try {
      window.location.replace(dispatchUrl);
    } catch {
      window.location.href = targetUrl;
    }
  }, [targetUrl, placeId]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center space-y-5 animate-fadeIn">
        
        {/* Ikon Google Review Stand */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-3 border border-slate-100">
          <svg className="w-10 h-10" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Info Toko */}
        <div className="space-y-1.5">
          <h1 className="text-lg sm:text-xl font-extrabold text-white truncate">
            {storeName}
          </h1>
          <div className="flex items-center justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs text-slate-400 pt-1">
            Membuka lembar penilaian bintang 5...
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-1">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Tombol Utama Langsung Klik Jika Browser Terdiam */}
        <div className="space-y-2 pt-2">
          <a
            href={targetUrl}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition transform active:scale-95"
          >
            <span>⭐ Beri Bintang 5 Langsung</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={mapsReviewUrl}
            className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Buka Ulasan di Aplikasi Google Maps</span>
          </a>
        </div>

        <p className="text-[10px] text-slate-500">
          Google Review NFC • Powered by Instant Review Stand
        </p>
      </div>
    </main>
  );
}
