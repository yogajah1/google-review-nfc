import { NextRequest, NextResponse } from 'next/server';
import { updateCardWithPin, getCard } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { pin, phone_last_4, store_name, google_review_url, owner_phone, new_pin } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN 4 digit keamanan wajib dimasukkan!' },
        { status: 400 }
      );
    }

    const card = await getCard(id);
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kartu tidak ditemukan.' },
        { status: 404 }
      );
    }

    const result = await updateCardWithPin(id, {
      pin,
      phone_last_4,
      store_name,
      google_review_url,
      owner_phone,
      new_pin,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error, 
          remainingAttempts: result.remainingAttempts,
          lockedMinutes: result.lockedMinutes
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data toko dan alamat Google Review berhasil diperbarui!',
      card_id: id,
    });
  } catch (err: any) {
    console.error('Update API error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem: ' + err.message },
      { status: 500 }
    );
  }
}
