import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input wajib diisi' }, { status: 400 });
    }

    let trimmed = input.trim();

    // 1. Jika bukan URL (Nama Toko biasa atau Place ID mentah)
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      if (trimmed.startsWith('ChIJ')) {
        return NextResponse.json({
          directReviewUrl: `https://search.google.com/local/writereview?placeid=${trimmed}`,
          storeName: null,
          method: 'place_id'
        });
      }
      return NextResponse.json({
        directReviewUrl: `https://search.google.com/local/writereview?query=${encodeURIComponent(trimmed)}`,
        storeName: trimmed,
        method: 'store_query'
      });
    }

    // 2. Jika format g.page/r/... (tanpa /review)
    if (trimmed.includes('g.page/r/')) {
      const clean = trimmed.replace(/\/+$/, '');
      const directUrl = clean.endsWith('/review') ? clean : `${clean}/review`;
      return NextResponse.json({
        directReviewUrl: directUrl,
        storeName: null,
        method: 'gpage'
      });
    }

    // 3. Jika URL mengandung parameter placeid
    const pidMatch = trimmed.match(/[?&]place(?:id|_id)=([A-Za-z0-9_-]+)/i);
    if (pidMatch && pidMatch[1]) {
      return NextResponse.json({
        directReviewUrl: `https://search.google.com/local/writereview?placeid=${pidMatch[1]}`,
        storeName: null,
        method: 'place_id_param'
      });
    }

    // 4. Jika URL mengandung parameter cid
    const cidMatch = trimmed.match(/[?&]cid=(\d+)/i);
    if (cidMatch && cidMatch[1]) {
      return NextResponse.json({
        directReviewUrl: `https://search.google.com/local/writereview?cid=${cidMatch[1]}`,
        storeName: null,
        method: 'cid_param'
      });
    }

    // 4b. Jika URL mengandung Hex CID (data=!1s0x...:0x...)
    const hexCidMatch = trimmed.match(/!1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/);
    if (hexCidMatch && hexCidMatch[2]) {
      try {
        const decCid = BigInt(hexCidMatch[2]).toString();
        const nameMatch = trimmed.match(/\/maps\/place\/([^/@?]+)/i);
        const rawName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : null;
        return NextResponse.json({
          directReviewUrl: `https://search.google.com/local/writereview?cid=${decCid}`,
          storeName: rawName,
          method: 'hex_cid'
        });
      } catch (err) {
        console.warn('Could not parse hex CID:', err);
      }
    }

    // 5. Jika shortlink maps.app.goo.gl atau goo.gl/maps -> resolve redirect di server
    if (trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps')) {
      try {
        const response = await fetch(trimmed, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const finalUrl = response.url || '';
        
        // Cari Place ID di final URL
        const inlinePid = finalUrl.match(/1s(ChIJ[A-Za-z0-9_-]{20,})/);
        if (inlinePid && inlinePid[1]) {
          return NextResponse.json({
            directReviewUrl: `https://search.google.com/local/writereview?placeid=${inlinePid[1]}`,
            storeName: null,
            method: 'resolved_place_id'
          });
        }

        // Cari Hex CID di final URL (!1s0x...:0x...)
        const inlineHex = finalUrl.match(/!1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/);
        if (inlineHex && inlineHex[2]) {
          try {
            const decCid = BigInt(inlineHex[2]).toString();
            const nameMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/i);
            const rawName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : null;
            return NextResponse.json({
              directReviewUrl: `https://search.google.com/local/writereview?cid=${decCid}`,
              storeName: rawName,
              method: 'resolved_hex_cid'
            });
          } catch (err) {
            console.warn('Could not parse resolved hex CID:', err);
          }
        }

        // Cari Nama Toko di /place/Nama+Toko
        const placeName = finalUrl.match(/\/maps\/place\/([^/@?]+)/i);
        if (placeName && placeName[1]) {
          const rawName = decodeURIComponent(placeName[1].replace(/\+/g, ' '));
          return NextResponse.json({
            directReviewUrl: `https://search.google.com/local/writereview?query=${encodeURIComponent(rawName)}`,
            storeName: rawName,
            method: 'resolved_name'
          });
        }
      } catch (err) {
        console.warn('Could not follow redirect:', err);
      }
    }

    // 6. Jika URL maps biasa dengan /place/Nama+Toko
    const placeName = trimmed.match(/\/maps\/place\/([^/@?]+)/i);
    if (placeName && placeName[1]) {
      const rawName = decodeURIComponent(placeName[1].replace(/\+/g, ' '));
      return NextResponse.json({
        directReviewUrl: `https://search.google.com/local/writereview?query=${encodeURIComponent(rawName)}`,
        storeName: rawName,
        method: 'url_name'
      });
    }

    // Fallback URL as is
    return NextResponse.json({
      directReviewUrl: trimmed,
      storeName: null,
      method: 'raw'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
