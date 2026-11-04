import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9110839850:AAHCEyj7ZDeC2dg0fvlsJcmeaAYdcvMJMdc';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    // Handle update secara background/asynchronous
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// GET untuk mengecek status dan setting webhook otomatis ke Telegram
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'set_webhook') {
    const host = req.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/bot/telegram`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await res.json();
      return NextResponse.json({ 
        message: 'Pengaturan webhook Telegram selesai', 
        webhookUrl, 
        telegramResponse: data 
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Cek Webhook Info saat ini
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json({
      status: 'Telegram Bot Webhook Endpoint Aktif',
      tokenConfigured: Boolean(BOT_TOKEN),
      webhookInfo: data,
      instructions: 'Untuk mengaktifkan webhook saat sudah deploy ke Vercel, buka URL: /api/bot/telegram?action=set_webhook',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
