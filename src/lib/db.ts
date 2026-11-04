import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Card, ActivationPayload, UpdatePayload } from '@/types/card';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

// Supabase Client Setup (Jika ENV diisi)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;

// Local JSON Storage (Sebagai fallback seamless untuk testing offline/lokal)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');

function ensureLocalDataFile(): Card[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      // Buat beberapa kartu dummy untuk testing awal
      const initialCards: Card[] = [
        {
          id: 'REV-DEMO1',
          status: 'unactivated',
          store_name: null,
          google_review_url: null,
          owner_phone: null,
          pin_hash: null,
          failed_attempts: 0,
          locked_until: null,
          total_scans: 0,
          batch_id: 'BATCH-INIT',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'REV-ACTIVE',
          status: 'active',
          store_name: 'Kopi Kenangan Senopati',
          google_review_url: 'https://maps.app.goo.gl/example',
          owner_phone: '081234567890',
          pin_hash: bcrypt.hashSync('1234', 10),
          failed_attempts: 0,
          locked_until: null,
          total_scans: 42,
          batch_id: 'BATCH-INIT',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialCards, null, 2), 'utf-8');
      return initialCards;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading local data file:', err);
    return [];
  }
}

function saveLocalData(cards: Card[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local data file:', err);
  }
}

// Generate Alphanumeric Code yang rapi & mudah dibaca (misal: "REV-7K2X9")
export function generateCardId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Tanpa O, 0, 1, I agar tidak membingungkan
  let result = 'REV-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper Artificial Delay (Tarpit) untuk mencegah Brute-Force Bot
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// DATA OPERATIONS
// ==========================================

export async function getCard(id: string): Promise<Card | null> {
  const cleanId = id.trim().toUpperCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cleanId)
      .single();

    if (error || !data) return null;
    return data as Card;
  }

  // Fallback Lokal
  const cards = ensureLocalDataFile();
  const found = cards.find(c => c.id.toUpperCase() === cleanId);
  return found || null;
}

export async function getAllCards(): Promise<Card[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Card[];
  }

  // Fallback Lokal
  const cards = ensureLocalDataFile();
  return cards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createCardsBatch(count: number, batchId?: string): Promise<Card[]> {
  const now = new Date().toISOString();
  const targetBatch = batchId || `BATCH-${Date.now().toString().slice(-6)}`;
  const newCards: Card[] = [];

  for (let i = 0; i < count; i++) {
    let cardId = generateCardId();
    newCards.push({
      id: cardId,
      status: 'unactivated',
      store_name: null,
      google_review_url: null,
      owner_phone: null,
      pin_hash: null,
      failed_attempts: 0,
      locked_until: null,
      total_scans: 0,
      batch_id: targetBatch,
      created_at: now,
      updated_at: now,
    });
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('cards')
      .insert(newCards)
      .select();

    if (error) {
      console.error('Supabase batch insert error:', error);
      throw new Error(`Gagal membuat kartu di Supabase: ${error.message}`);
    }
    return (data as Card[]) || newCards;
  }

  // Fallback Lokal
  const cards = ensureLocalDataFile();
  cards.push(...newCards);
  saveLocalData(cards);
  return newCards;
}

export async function activateCard(
  id: string,
  payload: ActivationPayload
): Promise<{ success: boolean; error?: string }> {
  const card = await getCard(id);
  if (!card) {
    return { success: false, error: 'Kartu tidak ditemukan!' };
  }

  if (card.status === 'active') {
    return { success: false, error: 'Kartu ini sudah diaktivasi sebelumnya!' };
  }

  // Validasi PIN 4 Digit
  if (!/^\d{4}$/.test(payload.pin)) {
    return { success: false, error: 'PIN harus berupa 4 digit angka (0-9)!' };
  }

  // Validasi URL
  if (!payload.google_review_url || !payload.google_review_url.startsWith('http')) {
    return { success: false, error: 'Link Google Maps Review harus diawali dengan http:// atau https://' };
  }

  // Hash PIN dengan bcrypt
  const salt = await bcrypt.genSalt(10);
  const pinHash = await bcrypt.hash(payload.pin, salt);
  const now = new Date().toISOString();

  const updateData = {
    status: 'active' as const,
    store_name: payload.store_name.trim(),
    google_review_url: payload.google_review_url.trim(),
    owner_phone: payload.owner_phone.trim(),
    pin_hash: pinHash,
    failed_attempts: 0,
    locked_until: null,
    updated_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', card.id);

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }
    return { success: true };
  }

  // Fallback Lokal
  const cards = ensureLocalDataFile();
  const index = cards.findIndex(c => c.id === card.id);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updateData };
    saveLocalData(cards);
  }
  return { success: true };
}

export async function updateCardWithPin(
  id: string,
  payload: UpdatePayload
): Promise<{
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  lockedMinutes?: number;
}> {
  const card = await getCard(id);
  if (!card) {
    return { success: false, error: 'Kartu tidak ditemukan.' };
  }

  // 1. Cek apakah kartu sedang terkunci (Lockout Check)
  if (card.locked_until) {
    const lockTime = new Date(card.locked_until).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const remainingMinutes = Math.ceil((lockTime - now) / (60 * 1000));
      return {
        success: false,
        error: `Kartu terkunci demi keamanan karena salah PIN berulang kali. Silakan coba lagi dalam ${remainingMinutes} menit.`,
        lockedMinutes: remainingMinutes,
      };
    }
  }

  // 2. Verifikasi PIN dengan Bcrypt
  if (!card.pin_hash) {
    return { success: false, error: 'Kartu belum diatur PIN keamanannya.' };
  }

  const isPinValid = await bcrypt.compare(payload.pin, card.pin_hash);

  if (!isPinValid) {
    // Artificial Delay untuk memperlambat serangan brute force otomatis
    await delay(1200);

    const newFailedAttempts = (card.failed_attempts || 0) + 1;
    let newLockedUntil: string | null = null;
    let remaining = Math.max(0, MAX_FAILED_ATTEMPTS - newFailedAttempts);

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntilDate = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      newLockedUntil = lockUntilDate.toISOString();
    }

    const failedUpdate = {
      failed_attempts: newFailedAttempts,
      locked_until: newLockedUntil,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('cards').update(failedUpdate).eq('id', card.id);
    } else {
      const cards = ensureLocalDataFile();
      const idx = cards.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        cards[idx] = { ...cards[idx], ...failedUpdate };
        saveLocalData(cards);
      }
    }

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        success: false,
        error: `PIN salah ${MAX_FAILED_ATTEMPTS}x berturut-turut! Kartu terkunci selama ${LOCKOUT_MINUTES} menit.`,
        lockedMinutes: LOCKOUT_MINUTES,
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      error: `PIN keamanan salah! Sisa percobaan: ${remaining} kali sebelum kartu terkunci.`,
      remainingAttempts: remaining,
    };
  }

  // 3. Optional Dual Factor: Cek 4 Digit Terakhir No HP pemilik jika diisi
  if (payload.phone_last_4 && card.owner_phone) {
    const cleanPhone = card.owner_phone.replace(/\D/g, '');
    const actualLast4 = cleanPhone.slice(-4);
    if (payload.phone_last_4 !== actualLast4) {
      return {
        success: false,
        error: 'Verifikasi tambahan gagal: 4 digit terakhir nomor telepon tidak cocok!',
      };
    }
  }

  // 4. Update data baru
  const now = new Date().toISOString();
  let newPinHash = card.pin_hash;

  if (payload.new_pin) {
    if (!/^\d{4}$/.test(payload.new_pin)) {
      return { success: false, error: 'PIN baru harus berupa 4 digit angka!' };
    }
    newPinHash = await bcrypt.hash(payload.new_pin, 10);
  }

  const successUpdate = {
    store_name: payload.store_name ? payload.store_name.trim() : card.store_name,
    google_review_url: payload.google_review_url ? payload.google_review_url.trim() : card.google_review_url,
    owner_phone: payload.owner_phone ? payload.owner_phone.trim() : card.owner_phone,
    pin_hash: newPinHash,
    failed_attempts: 0, // Reset percobaan gagal setelah berhasil
    locked_until: null,
    updated_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('cards').update(successUpdate).eq('id', card.id);
    if (error) return { success: false, error: error.message };
  } else {
    const cards = ensureLocalDataFile();
    const idx = cards.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      cards[idx] = { ...cards[idx], ...successUpdate };
      saveLocalData(cards);
    }
  }

  return { success: true };
}

export async function incrementScan(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const card = await getCard(id);
      if (card) {
        await supabase
          .from('cards')
          .update({ total_scans: (card.total_scans || 0) + 1 })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Failed to increment scan on Supabase:', err);
    }
    return;
  }

  const cards = ensureLocalDataFile();
  const idx = cards.findIndex(c => c.id === id);
  if (idx !== -1) {
    cards[idx].total_scans = (cards[idx].total_scans || 0) + 1;
    saveLocalData(cards);
  }
}

export async function resetCard(id: string): Promise<boolean> {
  const resetData = {
    status: 'unactivated' as const,
    store_name: null,
    google_review_url: null,
    owner_phone: null,
    pin_hash: null,
    failed_attempts: 0,
    locked_until: null,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('cards').update(resetData).eq('id', id);
    return !error;
  }

  const cards = ensureLocalDataFile();
  const idx = cards.findIndex(c => c.id === id);
  if (idx !== -1) {
    cards[idx] = { ...cards[idx], ...resetData };
    saveLocalData(cards);
    return true;
  }
  return false;
}

export async function unlockCard(id: string): Promise<boolean> {
  const unlockData = {
    failed_attempts: 0,
    locked_until: null,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('cards').update(unlockData).eq('id', id);
    return !error;
  }

  const cards = ensureLocalDataFile();
  const idx = cards.findIndex(c => c.id === id);
  if (idx !== -1) {
    cards[idx] = { ...cards[idx], ...unlockData };
    saveLocalData(cards);
    return true;
  }
  return false;
}

export async function deleteCard(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    return !error;
  }

  const cards = ensureLocalDataFile();
  const filtered = cards.filter(c => c.id !== id);
  saveLocalData(filtered);
  return true;
}

export async function deleteMultipleCards(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return true;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('cards').delete().in('id', ids);
    return !error;
  }

  const cards = ensureLocalDataFile();
  const set = new Set(ids);
  const filtered = cards.filter(c => !set.has(c.id));
  saveLocalData(filtered);
  return true;
}

export async function deleteAllCards(type: 'all' | 'unactivated' = 'all'): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('cards').delete();
    if (type === 'unactivated') {
      query = query.eq('status', 'unactivated');
    } else {
      query = query.neq('id', '___NEVER___'); // Delete all rows
    }
    const { error } = await query;
    return !error;
  }

  const cards = ensureLocalDataFile();
  const filtered = type === 'unactivated' ? cards.filter(c => c.status !== 'unactivated') : [];
  saveLocalData(filtered);
  return true;
}

export async function getStats(): Promise<{
  total: number;
  active: number;
  unactivated: number;
  totalScans: number;
}> {
  const cards = await getAllCards();
  return {
    total: cards.length,
    active: cards.filter(c => c.status === 'active').length,
    unactivated: cards.filter(c => c.status === 'unactivated').length,
    totalScans: cards.reduce((acc, c) => acc + (c.total_scans || 0), 0),
  };
}
