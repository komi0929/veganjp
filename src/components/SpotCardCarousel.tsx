'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts, StoreOfficialData } from '@/lib/types';
import { useGooglePlaceDetails } from '@/lib/place-photos';
import { getEffectiveVerifiedMenu } from '@/lib/kitchen-defaults';
import { SupportedLanguage } from '@/lib/i18n';

interface SpotCardCarouselProps {
  places: PlaceWithPosts[];
  currentLang?: SupportedLanguage;
  selectedPlaceId?: string | null;
  officialStoresMap?: Record<string, StoreOfficialData>;
  onSelectPlace: (place: PlaceWithPosts) => void;
}

function SpotCarouselCard({
  place,
  currentLang = 'en',
  isSelected = false,
  officialData = null,
  onSelectPlace,
}: {
  place: PlaceWithPosts;
  currentLang?: SupportedLanguage;
  isSelected?: boolean;
  officialData?: StoreOfficialData | null;
  onSelectPlace: (place: PlaceWithPosts) => void;
}) {
  const meta = useGooglePlaceDetails(place);
  const realPhoto = meta.photos[0] || place.posts?.[0]?.image_url || null;
  const sigDish = useMemo(
    () => getEffectiveVerifiedMenu(place, officialData)[0],
    [place, officialData]
  );

  const isJa = currentLang === 'ja';

  return (
    <motion.div
      key={place.google_place_id}
      onClick={() => onSelectPlace(place)}
      className={`snap-start shrink-0 w-[238px] sm:w-[264px] bg-white/95 backdrop-blur-xl rounded-[22px] p-2.5 cursor-pointer group transition-all ${
        isSelected
          ? 'ring-2 ring-[#16A34A] shadow-[0_12px_30px_rgba(22,163,74,0.22)] border border-[#16A34A]'
          : 'shadow-[0_8px_24px_rgba(20,40,30,0.1)] border border-[#DCECE3] hover:border-[#16A34A]/60'
      }`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Food Photo Frame */}
      <div className="relative aspect-[16/9] w-full rounded-[15px] overflow-hidden bg-[#EEF7F2] flex items-center justify-center">
        {realPhoto ? (
          <img
            src={realPhoto}
            alt={place.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EEF7F2] text-[#526358] p-3 text-center">
            <span className="text-[11px] font-bold text-[#1C2822] truncate w-full">
              {place.name}
            </span>
          </div>
        )}

        {/* Top Overlay Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-white/95 text-[#14532D] shadow-2xs">
            {isJa ? '🎁 歓迎特典あり' : '🎁 Welcome Perk'}
          </span>
          {meta.rating && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1C2822]/85 text-white flex items-center gap-0.5">
              <span className="text-amber-300">★</span>
              <span>{meta.rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Spot Info + Signature Dish Highlight */}
      <div className="mt-2 px-1 space-y-1">
        <div className="flex items-center justify-between gap-1 text-[10.5px] text-[#526358] font-semibold">
          <span className="truncate">
            {isJa ? place.area || place.area_en : place.area_en || place.area}
          </span>
          {(place.genre_en || place.genre) && (
            <span className="text-[9.5px] font-bold text-[#15803D] bg-[#EEF7F2] px-1.5 py-0.2 rounded-md shrink-0">
              {isJa
                ? place.genre || place.genre_en
                : place.genre_en || place.genre}
            </span>
          )}
        </div>
        <h4 className="text-xs font-extrabold text-[#1C2822] truncate group-hover:text-[#16A34A] transition-colors">
          {isJa ? place.name_ja || place.name : place.name}
        </h4>
        {sigDish && (
          <div className="flex items-center justify-between gap-1.5 text-[10.5px] font-bold text-[#14532D] bg-[#F2F9F5] border border-[#DCECE3] px-2 py-1 rounded-[10px]">
            <span className="truncate">
              {isJa ? sigDish.name_ja : sigDish.name_en}
            </span>
            <span className="shrink-0 font-extrabold text-[#1C2822]">
              ¥{sigDish.price_jpy.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SpotCardCarousel({
  places,
  currentLang = 'en',
  selectedPlaceId = null,
  officialStoresMap = {},
  onSelectPlace,
}: SpotCardCarouselProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const displayPlaces = places.slice(0, 15);
  if (displayPlaces.length === 0) return null;

  const isJa = currentLang === 'ja';

  return (
    <div
      className={`absolute bottom-5 right-0 z-20 pointer-events-none flex-col items-center transition-all duration-300 ${
        selectedPlaceId
          ? 'hidden md:flex md:left-[454px]'
          : 'flex inset-x-0'
      }`}
    >
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            key="minimized-reel-btn"
            onClick={() => setIsMinimized(false)}
            className="pointer-events-auto mb-1 px-4 py-2 rounded-full shadow-[0_8px_24px_rgba(20,40,30,0.12)] border border-[#DCECE3] bg-white/95 backdrop-blur-xl text-xs font-bold text-[#1C2822] flex items-center gap-2 hover:bg-white transition-all active:scale-95 cursor-pointer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <span className="size-2 rounded-full bg-[#16A34A]" />
            <span>
              {isJa ? '看板メニュー一覧を表示' : 'Show Signature Dishes'}
            </span>
            <span className="text-[#15803D] font-extrabold bg-[#EEF7F2] px-2 py-0.5 rounded-full text-[10px]">
              {displayPlaces.length}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded-reel"
            className="w-full max-w-6xl px-4 pointer-events-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-extrabold text-[#1C2822] flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-[#DCECE3] shadow-2xs">
                <span className="size-2 rounded-full bg-[#16A34A]" />
                <span>
                  {isJa
                    ? 'シェフの看板の一皿から選ぶ'
                    : "Browse by Chef's Signature Dish"}
                </span>
                <span className="text-[#15803D] font-bold text-[10px]">
                  ({displayPlaces.length})
                </span>
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-[11px] font-bold text-[#4A5D52] hover:text-[#1C2822] bg-white/90 hover:bg-white backdrop-blur-md px-2.5 py-1 rounded-full border border-[#DCECE3] transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>{isJa ? 'マップを広く見る' : 'Minimize'}</span>
                <span>✕</span>
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 snap-x snap-mandatory">
              {displayPlaces.map((place) => (
                <SpotCarouselCard
                  key={place.google_place_id}
                  place={place}
                  currentLang={currentLang}
                  isSelected={selectedPlaceId === place.google_place_id}
                  officialData={officialStoresMap[place.google_place_id] || null}
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
