import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q.trim())}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await res.json();
    const list: string[] = Array.isArray(data[1]) 
      ? data[1].filter((item: any) => typeof item === 'string').slice(0, 7) 
      : [];

    return NextResponse.json({ suggestions: list });
  } catch (err) {
    console.error('Suggest error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}
