'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlantMarkerProps {
  count: number;
  imageUrl?: string;
  name?: string;
  genre?: string;
  onClick?: () => void;
}

const GENRE_EMOJIS: Record<string, string> = {
  'ラーメン': '🍜',
  'カフェ': '☕',
  '和食・精進': '🍱',
  'バーガー': '🍔',
  'カレー': '🍛',
  'イタリアン・ピザ': '🍕',
  '中華・台湾素食': '🥟',
  'マクロビ・オーガニック': '🥗',
  'ホテル': '🏨',
  '居酒屋・バー': '🍶',
  'レストラン': '🌿',
};

export default function PlantMarker({ count, imageUrl, name, genre, onClick }: PlantMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isBloom = count >= 5;
  const emoji = (genre && GENRE_EMOJIS[genre]) || '🌱';

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
        className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full transition-all duration-300 border border-black/[0.08]"
        style={{
          boxShadow: `
            0 10px 25px -4px rgba(18, 38, 26, 0.16),
            0 4px 10px -2px rgba(0, 0, 0, 0.06),
            inset 0 1px 1px rgba(255, 255, 255, 1)
          `,
          padding: isHovered && name ? '4px 14px 4px 4px' : '4px',
        }}
      >
        {/* Photo or Genre / Botanical Emblem */}
        <div
          className={`relative rounded-full overflow-hidden bg-botanical-50 flex items-center justify-center transition-all ${
            isBloom ? 'w-10 h-10' : 'w-8 h-8'
          }`}
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
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-botanical-600 border-2 border-white shadow-sm" />
          ) : (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-slate-300 border border-white shadow-xs" />
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
                <p className="text-xs font-semibold text-slate-900 tracking-tight">{name}</p>
                {genre && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                    {genre}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium text-botanical-600 tracking-wide uppercase">
                {count > 0 ? `${count} ${count === 1 ? 'photo' : 'photos'}` : '🌱 Verified Spot'}
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
