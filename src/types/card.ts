export type CardStatus = 'unactivated' | 'active' | 'suspended';

export interface Card {
  id: string; // e.g. "REV-A8F2K"
  status: CardStatus;
  store_name?: string | null;
  google_review_url?: string | null;
  owner_phone?: string | null;
  pin_hash?: string | null;
  failed_attempts: number;
  locked_until?: string | null; // ISO Date string
  total_scans: number;
  batch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivationPayload {
  store_name: string;
  google_review_url: string;
  owner_phone: string;
  pin: string; // 4 digits
}

export interface UpdatePayload {
  pin: string;
  phone_last_4?: string;
  store_name?: string;
  google_review_url?: string;
  owner_phone?: string;
  new_pin?: string;
}
