import { NextRequest, NextResponse } from 'next/server';

interface ResolvedPlace {
  placeId: string;
  storeName: string | null;
  address: string | null;
}

// Helper pencari Place ID resmi Google Maps berdasarkan nama toko
async function findGooglePlaceId(query: string): Promise<ResolvedPlace | null> {
  try {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    clearTimeout(timeout);

    const text = await res.text();
    const preloadMatch = text.match(/href="(\/search\?tbm=map[^"]+)"/);
    if (!preloadMatch) return null;
    
    const fetchUrl = 'https://www.google.com' + preloadMatch[1].replace(/&amp;/g, '&');
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 6000);

    const res2 = await fetch(fetchUrl, {
      signal: controller2.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    clearTimeout(timeout2);

    const text2 = await res2.text();

    // 1. Ekstrak Place ID (format placeid=ChIJ... atau "ChIJ...")
    const pidMatch = text2.match(/placeid(?:\\u003d|=)(ChIJ[A-Za-z0-9_-]{20,})/) || text2.match(/"(ChIJ[A-Za-z0-9_-]{20,})"/);
    if (!pidMatch || !pidMatch[1]) return null;

    const placeId = pidMatch[1];

    // 2. Ekstrak Nama Toko yang terdaftar resmi di Google Maps
    const qMatch = text2.match(/reviews\?placeid(?:\\u003d|=)[A-Za-z0-9_-]+(?:\\u0026|&)q(?:\\u003d|=)([^\\&"']+)/);
    const startNameMatch = text2.match(/^\)\]\}'\s*\[\["([^"]+)"/);
    const storeName = qMatch ? decodeURIComponent(qMatch[1].replace(/\+/g, ' ')) : (startNameMatch ? startNameMatch[1] : null);

    // 3. Ekstrak Alamat lengkap Google Maps
    const fullAddrMatch = text2.match(/\["((?:Jl\.|Jalan|Ruko|Gedung|Mall|Plaza|RT\.)[^"]+?)"\]/i) || text2.match(/",\["([^"]+?)","([^"]+?)"/);
    const address = fullAddrMatch ? (fullAddrMatch[2] ? `${fullAddrMatch[1]}, ${fullAddrMatch[2]}` : fullAddrMatch[1]) : null;

    return { placeId, storeName, address };
  } catch (err) {
    console.warn('findGooglePlaceId failed:', err);
    return null;
  }
}

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
          placeId: trimmed,
          storeName: null,
          address: null,
          method: 'place_id'
        });
      }

      // Otomatis cari Place ID resmi Google dari nama toko!
      const resolved = await findGooglePlaceId(trimmed);
      if (resolved && resolved.placeId) {
        return NextResponse.json({
          directReviewUrl: `https://search.google.com/local/writereview?placeid=${resolved.placeId}`,
          placeId: resolved.placeId,
          storeName: resolved.storeName || trimmed,
          address: resolved.address,
          method: 'resolved_place_id_from_name'
        });
      }

      // Fallback: URL pencarian Maps yang valid (bukan writereview?query yang return 400)
      return NextResponse.json({
        directReviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`,
        storeName: trimmed,
        address: null,
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
        directReviewUrl: `https://maps.google.com/?cid=${cidMatch[1]}`,
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

        // Coba cari Place ID resmi dari nama toko agar langsung pop-up review
        if (rawName) {
          const resolved = await findGooglePlaceId(rawName);
          if (resolved && resolved.placeId) {
            return NextResponse.json({
              directReviewUrl: `https://search.google.com/local/writereview?placeid=${resolved.placeId}`,
              placeId: resolved.placeId,
              storeName: resolved.storeName || rawName,
              address: resolved.address,
              method: 'hex_cid_resolved_place_id'
            });
          }
        }

        return NextResponse.json({
          directReviewUrl: `https://maps.google.com/?cid=${decCid}`,
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

            if (rawName) {
              const resolved = await findGooglePlaceId(rawName);
              if (resolved && resolved.placeId) {
                return NextResponse.json({
                  directReviewUrl: `https://search.google.com/local/writereview?placeid=${resolved.placeId}`,
                  placeId: resolved.placeId,
                  storeName: resolved.storeName || rawName,
                  address: resolved.address,
                  method: 'shortlink_resolved_place_id'
                });
              }
            }

            return NextResponse.json({
              directReviewUrl: `https://maps.google.com/?cid=${decCid}`,
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
          const resolved = await findGooglePlaceId(rawName);
          if (resolved && resolved.placeId) {
            return NextResponse.json({
              directReviewUrl: `https://search.google.com/local/writereview?placeid=${resolved.placeId}`,
              placeId: resolved.placeId,
              storeName: resolved.storeName || rawName,
              address: resolved.address,
              method: 'resolved_name_place_id'
            });
          }
          return NextResponse.json({
            directReviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawName)}`,
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
      const resolved = await findGooglePlaceId(rawName);
      if (resolved && resolved.placeId) {
        return NextResponse.json({
          directReviewUrl: `https://search.google.com/local/writereview?placeid=${resolved.placeId}`,
          placeId: resolved.placeId,
          storeName: resolved.storeName || rawName,
          address: resolved.address,
          method: 'url_name_place_id'
        });
      }
      return NextResponse.json({
        directReviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawName)}`,
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
