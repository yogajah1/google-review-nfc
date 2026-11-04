import { NextRequest, NextResponse } from 'next/server';
import { activateCard, getCard } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { store_name, google_review_url, owner_phone, pin } = body;

    if (!store_name || !google_review_url || !owner_phone || !pin) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom wajib diisi!' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN harus berupa 4 digit angka (0-9)!' },
        { status: 400 }
      );
    }

    const card = await getCard(id);
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kartu tidak valid atau tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (card.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Kartu ini sudah aktif sebelumnya.' },
        { status: 400 }
      );
    }

    const result = await activateCard(id, {
      store_name,
      google_review_url,
      owner_phone,
      pin,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status verifikasi berhasil! Kartu Google Review kini aktif.',
      store_name,
      card_id: id,
    });
  } catch (err: any) {
    console.error('Activation API error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem: ' + err.message },
      { status: 500 }
    );
  }
}
