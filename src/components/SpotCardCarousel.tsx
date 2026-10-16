'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { useGooglePlaceDetails } from '@/lib/place-photos';
import { getEffectiveVerifiedMenu } from '@/lib/kitchen-defaults';
import { SupportedLanguage } from '@/lib/i18n';

interface SpotCardCarouselProps {
  places: PlaceWithPosts[];
  currentLang?: SupportedLanguage;
  onSelectPlace: (place: PlaceWithPosts) => void;
}

function SpotCarouselCard({
  place,
  currentLang = 'en',
  onSelectPlace,
}: {
  place: PlaceWithPosts;
  currentLang?: SupportedLanguage;
  onSelectPlace: (place: PlaceWithPosts) => void;
}) {
  const meta = useGooglePlaceDetails(place);
  const realPhoto = meta.photos[0] || null;
  const sigDish = useMemo(() => getEffectiveVerifiedMenu(place, null)[0], [place]);

  const badgeText =
    currentLang === 'ja' ? '🎁 歓迎特典あり' : '🎁 Welcome Perk';

  return (
    <motion.div
      key={place.google_place_id}
      onClick={() => onSelectPlace(place)}
      className="snap-start shrink-0 w-[250px] sm:w-[280px] bg-white/95 backdrop-blur-2xl rounded-3xl p-2.5 shadow-glass-md hover:shadow-photo-card border border-black/[0.08] cursor-pointer group transition-all"
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Food Photo Frame */}
      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {realPhoto ? (
          <img
            src={realPhoto}
            alt={place.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-slate-50 to-emerald-50 text-slate-400 p-3 text-center">
            <span className="text-3xl mb-1">🍽️</span>
            <span className="text-[11px] font-bold text-slate-700 truncate w-full">
              {place.name}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Badge Overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-md bg-emerald-950/85 text-emerald-200 border border-emerald-400/30">
            {badgeText}
          </span>
          {meta.rating && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full backdrop-blur-md bg-slate-900/80 text-amber-300 border border-white/10 flex items-center gap-0.5 shadow-xs">
              <span>★</span>
              <span>{meta.rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Spot Info + Signature Dish Highlight */}
      <div className="mt-2.5 px-1 space-y-1">
        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 font-medium">
          <span className="truncate">
            {currentLang === 'ja' ? place.area || place.area_en : place.area_en || place.area}
          </span>
          {(place.genre_en || place.genre) && (
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md shrink-0">
              {currentLang === 'ja' ? place.genre || place.genre_en : place.genre_en || place.genre}
            </span>
          )}
        </div>
        <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
          {currentLang === 'ja' ? place.name_ja || place.name : place.name}
        </h4>
        {sigDish && (
          <p className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg truncate">
            👑 {currentLang === 'ja' ? sigDish.name_ja : sigDish.name_en}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function SpotCardCarousel({
  places,
  currentLang = 'en',
  onSelectPlace,
}: SpotCardCarouselProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Take the top 15 spots
  const displayPlaces = places.slice(0, 15);

  if (displayPlaces.length === 0) return null;

  return (
    <div className="absolute bottom-6 inset-x-0 z-20 pointer-events-none flex flex-col items-center">
      {/* Minimized Pill Toggle */}
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            key="minimized-reel-btn"
            onClick={() => setIsMinimized(false)}
            className="pointer-events-auto mb-2 glass-pill px-4 py-2 rounded-full shadow-glass-lg border border-black/[0.08] bg-white/95 backdrop-blur-xl text-xs font-bold text-slate-800 flex items-center gap-2 hover:bg-white transition-all cursor-pointer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <span>✨</span>
            <span>{currentLang === 'ja' ? '店舗フォトを見る' : 'Browse Spots Photos'}</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              {displayPlaces.length}
            </span>
            <span className="text-slate-400">▲</span>
          </motion.button>
        ) : (
          /* Full Visual Card Reel */
          <motion.div
            key="expanded-reel"
            className="w-full max-w-6xl px-4 pointer-events-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-black/[0.06] shadow-2xs">
                  <span>📸</span>
                  <span>{currentLang === 'ja' ? '店舗フォト' : 'Featured Spots'}</span>
                  <span className="text-emerald-700 font-bold text-[10px]">({displayPlaces.length})</span>
                </span>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white backdrop-blur-md px-2.5 py-1 rounded-full border border-black/[0.06] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                title="Hide reel to see full map"
              >
                <span>{currentLang === 'ja' ? 'マップを広く見る' : 'Hide'}</span>
                <span>✕</span>
              </button>
            </div>

            {/* Horizontal Snap Reel */}
            <div className="flex items-center gap-3.5 overflow-x-auto scrollbar-hide py-1 px-1 snap-x snap-mandatory">
              {displayPlaces.map((place) => (
                <SpotCarouselCard
                  key={place.google_place_id}
                  place={place}
                  currentLang={currentLang}
                  onSelectPlace={onSelectPlace}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
