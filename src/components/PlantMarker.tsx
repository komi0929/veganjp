'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlantMarkerProps {
  count: number;
  imageUrl?: string;
  name?: string;
  genre?: string;
  genre_en?: string;
  dietary_type?: '100%_vegan' | 'vegan_friendly';
  onClick?: () => void;
}

const GENRE_EMOJIS: Record<string, string> = {
  'ラーメン': '🍜',
  'Ramen': '🍜',
  'カフェ': '☕',
  'Cafe & Bakery': '☕',
  'Cafe & Sweets': '☕',
  'Cafe & Craft Ice Cream': '🍨',
  '和食・精進': '🍱',
  'Traditional / Shojin Washoku': '🍱',
  'Traditional Shojin & Washoku': '🍱',
  'バーガー': '🍔',
  'Burgers & Casual Dining': '🍔',
  'Burgers & Casual': '🍔',
  'カレー': '🍛',
  'Curry & Spice': '🍛',
  'イタリアン・ピザ': '🍕',
  'Pizza & Italian': '🍕',
  '中華・台湾素食': '🥟',
  'Asian & Dim Sum': '🥟',
  'マクロビ・オーガニック': '🥗',
  'Macrobiotic & Organic': '🥗',
  'ホテル': '🏨',
  'Hotel & Fine Dining': '🏨',
  '居酒屋・バー': '🍶',
  'Izakaya & Bar': '🍶',
  'レストラン': '🌿',
  'Plant-Based Bistro': '🌿',
};

export default function PlantMarker({ count, imageUrl, name, genre, genre_en, dietary_type = '100%_vegan', onClick }: PlantMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isBloom = count >= 5;
  const currentGenre = genre_en || genre || '';
  const emoji = GENRE_EMOJIS[currentGenre] || (genre && GENRE_EMOJIS[genre]) || '🌱';
  const isPureVegan = dietary_type === '100%_vegan';

  return (
    <motion.div
      className="relative cursor-pointer select-none -translate-x-1/2 -translate-y-1/2 group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      whileHover={{ scale: 1.15, zIndex: 50 }}
      whileTap={{ scale: 0.94 }}
    >
      {/* ─── Living Botanical Ambient Pulse ─── */}
      {count > 0 && (
        <span className="absolute -inset-1 rounded-full bg-botanical-500/20 animate-ping pointer-events-none duration-1000" />
      )}

      {/* ─── Capsule Body: Pure White Ceramic Shell with Ultra-fine Border ─── */}
      <div
        className={`relative flex items-center bg-white/95 backdrop-blur-md rounded-full transition-all duration-300 border ${
          isPureVegan ? 'border-botanical-500/40 ring-1 ring-botanical-400/20' : 'border-amber-400/60'
        }`}
        style={{
          boxShadow: isPureVegan
            ? `0 10px 25px -4px rgba(18, 38, 26, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 1)`
            : `0 8px 20px -4px rgba(180, 83, 9, 0.14), 0 3px 8px -2px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 1)`,
          padding: isHovered && name ? '4px 14px 4px 4px' : '4px',
        }}
      >
        {/* Photo or Genre / Botanical Emblem */}
        <div
          className={`relative rounded-full overflow-hidden flex items-center justify-center transition-all ${
            isPureVegan ? 'bg-botanical-50' : 'bg-amber-50'
          } ${isBloom ? 'w-10 h-10' : 'w-8 h-8'}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <span className="text-base select-none">{emoji}</span>
          )}

          {/* Activity Dot */}
          {count > 0 ? (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
              isPureVegan ? 'bg-botanical-600' : 'bg-amber-500'
            }`} />
          ) : (
            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white shadow-xs ${
              isPureVegan ? 'bg-botanical-400' : 'bg-amber-400'
            }`} />
          )}
        </div>

        {/* Expandable Label on Hover */}
        <AnimatePresence>
          {isHovered && name && (
            <motion.div
              className="overflow-hidden pl-2 whitespace-nowrap"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-1.5">
                {(genre_en || genre) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                    {genre_en || genre}
                  </span>
                )}
              </div>
              <p className={`text-[10px] font-bold tracking-wide uppercase ${
                isPureVegan ? 'text-botanical-600' : 'text-amber-600'
              }`}>
                {isPureVegan ? '🌱 100% Vegan' : '🥗 Vegan Options'} · {count > 0 ? `${count} photos` : 'Verified Spot'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Ground Anchor Needle ─── */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-2 h-1.5 overflow-hidden">
        <div className="w-2 h-2 bg-white/95 border-r border-b border-black/[0.08] rotate-45 -translate-y-1 shadow-sm" />
      </div>
    </motion.div>
  );
}
