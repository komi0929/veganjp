export interface TripStampRecord {
  id: string;
  place_id: string;
  place_name: string;
  area: string;
  signature_dish: string;
  stamp_emoji: string;
  stamp_title_ja: string;
  stamp_title_en: string;
  message: string;
  sender_name: string;
  created_at: string;
  seal_code: string;
}

const STORAGE_KEY = 'vegan_jp_trip_stamps_v1';

const DEFAULT_STAMPS: TripStampRecord[] = [
  {
    id: 'stamp-seed-1',
    place_id: 'ChIJL8ZEXViRQTURgeN1wM_GJ6E',
    place_name: 'SoyStories（ソイストーリーズ）薬院',
    area: '福岡・薬院 / Fukuoka Yakuin',
    signature_dish: '濃厚豆乳クラフトアイス ダブル ＋ 焼きたて米粉ワッフルボウル',
    stamp_emoji: '🍨',
    stamp_title_ja: '忘れられない看板の一皿！',
    stamp_title_en: 'Unforgettable Signature Dish!',
    message: '焼きたての米粉ワッフルと八女抹茶豆乳アイス、九州旅で一番の思い出になりました！',
    sender_name: 'Chloe & Sam',
    created_at: '2026-10-15T08:20:00.000Z',
    seal_code: '御朱印-FUK-01',
  },
];

export function getTripStamps(): TripStampRecord[] {
  if (typeof window === 'undefined') return DEFAULT_STAMPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STAMPS));
      return DEFAULT_STAMPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STAMPS;
  } catch {
    return DEFAULT_STAMPS;
  }
}

export function addTripStamp(record: Omit<TripStampRecord, 'id' | 'created_at' | 'seal_code'>): TripStampRecord {
  const existing = getTripStamps();
  const newStamp: TripStampRecord = {
    ...record,
    id: `stamp-${Date.now()}`,
    created_at: new Date().toISOString(),
    seal_code: `御朱印-${Math.floor(100 + Math.random() * 900)}`,
  };
  const updated = [newStamp, ...existing.filter((s) => s.place_id !== record.place_id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('vegan_jp_stamps_updated'));
    } catch {}
  }
  return newStamp;
}
