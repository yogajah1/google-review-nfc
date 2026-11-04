import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=id&gl=id&q=${encodeURIComponent(q.trim())}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await res.json();
    const blacklistWords = ['menu', 'career', 'karir', 'loker', 'gaji', 'owner', 'pemilik', 'buka jam', 'tutup jam', 'harga', 'resep'];
    
    const list: string[] = Array.isArray(data[1]) 
      ? data[1]
          .filter((item: any) => typeof item === 'string')
          .filter((item: string) => {
            const lower = item.toLowerCase();
            return !blacklistWords.some(w => lower.includes(w));
          })
          .slice(0, 7) 
      : [];

    return NextResponse.json({ suggestions: list });
  } catch (err) {
    console.error('Suggest error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}
