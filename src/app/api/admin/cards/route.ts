import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCards, 
  createCardsBatch, 
  resetCard, 
  unlockCard, 
  deleteCard, 
  deleteMultipleCards,
  deleteAllCards,
  getStats 
} from '@/lib/db';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin12345';

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const querySecret = req.nextUrl.searchParams.get('secret') || '';
  const cookieSecret = req.cookies.get('admin_secret')?.value || '';

  return token === ADMIN_SECRET || querySecret === ADMIN_SECRET || cookieSecret === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cards = await getAllCards();
    const stats = await getStats();
    return NextResponse.json({ success: true, stats, cards });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, count, batch_id, card_id } = body;

    if (action === 'generate') {
      const num = parseInt(count, 10) || 10;
      if (num < 1 || num > 200) {
        return NextResponse.json({ error: 'Jumlah harus antara 1 - 200' }, { status: 400 });
      }
      const newCards = await createCardsBatch(num, batch_id);
      return NextResponse.json({ success: true, count: newCards.length, cards: newCards });
    }

    if (action === 'reset' && card_id) {
      const ok = await resetCard(card_id);
      return NextResponse.json({ success: ok });
    }

    if (action === 'unlock' && card_id) {
      const ok = await unlockCard(card_id);
      return NextResponse.json({ success: ok });
    }

    if (action === 'delete' && card_id) {
      const ok = await deleteCard(card_id);
      return NextResponse.json({ success: ok });
    }

    if (action === 'delete_multiple' && Array.isArray(body.card_ids)) {
      const ok = await deleteMultipleCards(body.card_ids);
      return NextResponse.json({ success: ok });
    }

    if (action === 'delete_unactivated') {
      const ok = await deleteAllCards('unactivated');
      return NextResponse.json({ success: ok });
    }

    if (action === 'delete_all') {
      const ok = await deleteAllCards('all');
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
