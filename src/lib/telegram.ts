import { 
  createCardsBatch, 
  getCard, 
  resetCard, 
  unlockCard, 
  getStats 
} from '@/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9110839850:AAHCEyj7ZDeC2dg0fvlsJcmeaAYdcvMJMdc';
const ALLOWED_USERNAME = (process.env.TELEGRAM_ALLOWED_USER || 'thisfinoenable').toLowerCase().replace('@', '');
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://google-review-nfc-neon.vercel.app').replace(/\/+$/, '');

export async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: unknown) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return null;
  }
}

export async function handleTelegramUpdate(update: any) {
  if (!update || !update.message) return;

  const msg = update.message;
  const chatId = msg.chat?.id;
  const username = (msg.from?.username || '').toLowerCase();
  const text = (msg.text || '').trim();

  // 1. Keamanan Akses: Hanya @thisfinoenable yang diizinkan!
  if (username !== ALLOWED_USERNAME) {
    await sendTelegramMessage(
      chatId,
      `⛔ <b>Akses Ditolak!</b>\n\nMaaf @${username || 'pengguna'}, Anda bukan pemilik sistem. Bot ini hanya dapat diakses secara eksklusif oleh <b>@${ALLOWED_USERNAME}</b>.`
    );
    return;
  }

  // 2. Routing Perintah
  if (text.startsWith('/start') || text.startsWith('/help')) {
    const helpText = `
👑 <b>Google Review NFC & QR Code Manager</b>
Halo Bos <b>@${username}</b>! Ini bot pribadi Anda untuk mencetak dan mengelola kartu Google Review.

<b>🛠 Perintah yang Tersedia:</b>
• <code>/generate &lt;jumlah&gt;</code>
  <i>Contoh:</i> <code>/generate 10</code>
  Membuat kartu baru dan memberikan link siap cetak QR Code A4.

• <code>/cek &lt;kode&gt;</code>
  <i>Contoh:</i> <code>/cek REV-8X2K9</code>
  Cek status kartu, nama toko, link, dan jumlah tap scan.

• <code>/reset &lt;kode&gt;</code>
  <i>Contoh:</i> <code>/reset REV-8X2K9</code>
  Reset kartu ke status belum aktif (jika toko lupa PIN).

• <code>/unlock &lt;kode&gt;</code>
  <i>Contoh:</i> <code>/unlock REV-8X2K9</code>
  Buka blokir kartu jika toko salah PIN 5x.

• <code>/stats</code>
  Lihat total kartu, jumlah aktif, dan total tap pelanggan.

• <code>/link</code>
  Buka Dashboard Web Admin.
`;
    await sendTelegramMessage(chatId, helpText, {
      inline_keyboard: [
        [{ text: '📊 Lihat Statistik', callback_data: 'stats' }],
        [{ text: '🌐 Buka Web Dashboard Admin', url: `${BASE_URL}/admin` }],
      ],
    });
    return;
  }

  // Perintah: /stats
  if (text === '/stats' || text === '/list') {
    const stats = await getStats();
    const statsText = `
📊 <b>Statistik Kartu Google Review Anda:</b>

• <b>Total Kartu Dicetak:</b> ${stats.total} pcs
• <b>Kartu Aktif di Toko:</b> ${stats.active} pcs
• <b>Kartu Belum Diaktivasi:</b> ${stats.unactivated} pcs
• <b>Total Tap NFC & Scan QR:</b> ${stats.totalScans} kali 🔥

Keren! Bisnis terus berkembang.
`;
    await sendTelegramMessage(chatId, statsText);
    return;
  }

  // Perintah: /link
  if (text === '/link') {
    await sendTelegramMessage(
      chatId,
      `🌐 <b>Link Dashboard Admin Anda:</b>\n${BASE_URL}/admin\n\n<i>Gunakan password admin Anda untuk login.</i>`
    );
    return;
  }

  // Perintah: /generate <jumlah>
  if (text.startsWith('/generate')) {
    const parts = text.split(' ');
    const count = parseInt(parts[1], 10) || 10;

    if (count < 1 || count > 100) {
      await sendTelegramMessage(chatId, '⚠️ Silakan masukkan jumlah kartu antara 1 sampai 100.\n<i>Contoh:</i> <code>/generate 20</code>');
      return;
    }

    const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
    const newCards = await createCardsBatch(count, batchId);
    const printUrl = `${BASE_URL}/admin/print?batch=${batchId}`;

    const listCodes = newCards.slice(0, 15).map(c => `• <code>${c.id}</code> -> ${BASE_URL}/r/${c.id}`).join('\n');
    const remainingText = newCards.length > 15 ? `\n<i>...dan ${newCards.length - 15} kartu lainnya.</i>` : '';

    const replyMsg = `
✅ <b>Berhasil Membuat ${newCards.length} Kartu Baru!</b>
<b>Batch ID:</b> <code>${batchId}</code>

<b>🖨 Lembar Cetak QR Code Vinyl A4:</b>
👉 <a href="${printUrl}"><b>KLIK DI SINI UNTUK CETAK STIKER QR</b></a>

<b>Daftar Kode Kartu Baru:</b>
${listCodes}${remainingText}

<b>📱 Cara Menghubungkan ke NFC NTAG215:</b>
1. Buka aplikasi <b>NFC Tools</b> di HP.
2. Pilih <b>Write</b> -> <b>Add a record</b> -> <b>URL</b>.
3. Masukkan link kartu (misal: <code>${BASE_URL}/r/${newCards[0].id}</code>).
4. Tempelkan koin NTAG215 ke belakang HP.
5. Selesai! Tempelkan stiker vinyl QR Code yang sudah dicetak ke atas akrilik susu.
`;
    await sendTelegramMessage(chatId, replyMsg, {
      inline_keyboard: [
        [{ text: '🖨 Buka Lembar Cetak QR', url: printUrl }],
        [{ text: '🌐 Buka Dashboard Admin', url: `${BASE_URL}/admin` }],
      ],
    });
    return;
  }

  // Perintah: /cek <kode>
  if (text.startsWith('/cek')) {
    const parts = text.split(' ');
    const code = (parts[1] || '').trim().toUpperCase();

    if (!code) {
      await sendTelegramMessage(chatId, '⚠️ Format salah. Gunakan: <code>/cek &lt;kode&gt;</code>\n<i>Contoh:</i> <code>/cek REV-DEMO1</code>');
      return;
    }

    const card = await getCard(code);
    if (!card) {
      await sendTelegramMessage(chatId, `❌ Kartu dengan kode <code>${code}</code> tidak ditemukan.`);
      return;
    }

    const isLocked = card.locked_until && new Date(card.locked_until).getTime() > Date.now();
    const statusEmoji = card.status === 'active' ? '🟢 Aktif' : card.status === 'unactivated' ? '🟡 Belum Diaktivasi' : '🔴 Ditangguhkan';

    const cardInfo = `
📋 <b>Informasi Kartu: ${card.id}</b>

• <b>Status:</b> ${statusEmoji}
• <b>Toko:</b> ${card.store_name || '-'}
• <b>No. WhatsApp:</b> ${card.owner_phone || '-'}
• <b>Total Scan/Tap:</b> ${card.total_scans || 0} kali
• <b>Percobaan Salah PIN:</b> ${card.failed_attempts || 0} kali
• <b>Status Kunci:</b> ${isLocked ? '🔒 Terkunci (Salah PIN)' : '🔓 Normal'}
• <b>Link Google Maps:</b> ${card.google_review_url ? `<a href="${card.google_review_url}">Buka Maps</a>` : '-'}

<b>Link Kartu:</b> ${BASE_URL}/r/${card.id}
<b>Link Kelola Toko:</b> ${BASE_URL}/r/${card.id}/edit
`;
    await sendTelegramMessage(chatId, cardInfo, {
      inline_keyboard: [
        [
          { text: '🔄 Reset Kartu', callback_data: `reset_${card.id}` },
          { text: '🔓 Buka Kunci', callback_data: `unlock_${card.id}` },
        ],
      ],
    });
    return;
  }

  // Perintah: /reset <kode>
  if (text.startsWith('/reset')) {
    const parts = text.split(' ');
    const code = (parts[1] || '').trim().toUpperCase();

    if (!code) {
      await sendTelegramMessage(chatId, '⚠️ Format salah. Gunakan: <code>/reset &lt;kode&gt;</code>');
      return;
    }

    const success = await resetCard(code);
    if (success) {
      await sendTelegramMessage(
        chatId,
        `✅ <b>Kartu ${code} Berhasil Direset!</b>\n\nStatus kembali menjadi <b>Belum Diaktivasi</b> dan PIN lama telah dihapus. Klien toko bisa mengaktivasi ulang dengan scan QR / tap NFC.`
      );
    } else {
      await sendTelegramMessage(chatId, `❌ Gagal mereset kartu <code>${code}</code>.`);
    }
    return;
  }

  // Perintah: /unlock <kode>
  if (text.startsWith('/unlock')) {
    const parts = text.split(' ');
    const code = (parts[1] || '').trim().toUpperCase();

    if (!code) {
      await sendTelegramMessage(chatId, '⚠️ Format salah. Gunakan: <code>/unlock &lt;kode&gt;</code>');
      return;
    }

    const success = await unlockCard(code);
    if (success) {
      await sendTelegramMessage(
        chatId,
        `🔓 <b>Kartu ${code} Berhasil Dibuka Kunci!</b>\n\nPercobaan salah PIN telah direset ke 0. Pemilik toko sekarang bisa mencoba memasukkan PIN kembali.`
      );
    } else {
      await sendTelegramMessage(chatId, `❌ Gagal membuka kunci kartu <code>${code}</code>.`);
    }
    return;
  }

  // Pesan tidak dikenali
  await sendTelegramMessage(
    chatId,
    `Perintah tidak dikenali. Ketik <code>/help</code> untuk melihat daftar perintah.`
  );
}
