'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  PlaceWithPosts,
  StoreOfficialData,
  GratitudeNote,
  MenuItem,
} from '@/lib/types';
import { isPlaceSaved, toggleSavePlaceId } from '@/lib/saved-places';
import { SupportedLanguage, TRANSLATIONS } from '@/lib/i18n';
import { useGooglePlaceDetails } from '@/lib/place-photos';
import {
  getEffectiveKitchenAudit,
  getEffectiveVerifiedMenu,
} from '@/lib/kitchen-defaults';
import { showToast } from './Toast';

interface BottomSheetProps {
  place: PlaceWithPosts;
  currentLang?: SupportedLanguage;
  officialStoreData?: StoreOfficialData | null;
  gratitudeNotes?: GratitudeNote[];
  placesLibrary?: google.maps.PlacesLibrary | null;
  map?: google.maps.Map | null;
  onClose: () => void;
  onOpenGratitude?: (
    place: PlaceWithPosts,
    mode?: 'gratitude' | 'update',
    orderedDishes?: string[]
  ) => void;
}

const GENRE_EMOJIS: Record<string, string> = {
  ラーメン: '🍜',
  Ramen: '🍜',
  カフェ: '☕',
  'Cafe & Bakery': '☕',
  'Cafe & Sweets': '☕',
  'Cafe & Craft Ice Cream': '🍨',
  '和食・精進': '🍱',
  'Traditional / Shojin Washoku': '🍱',
  'Traditional Shojin & Washoku': '🍱',
  バーガー: '🍔',
  'Burgers & Casual Dining': '🍔',
  'Burgers & Casual': '🍔',
  カレー: '🍛',
  'Curry & Spice': '🍛',
  'イタリアン・ピザ': '🍕',
  'Pizza & Italian': '🍕',
  '中華・台湾素食': '🥟',
  'Asian & Dim Sum': '🥟',
  'マクロビ・オーガニック': '🥗',
  'Macrobiotic & Organic': '🥗',
  ホテル: '🏨',
  'Hotel & Fine Dining': '🏨',
  '居酒屋・バー': '🍶',
  'Izakaya & Bar': '🍶',
  レストラン: '🌿',
  'Plant-Based Bistro': '🌿',
};

export default function BottomSheet({
  place,
  currentLang = 'en',
  officialStoreData,
  gratitudeNotes = [],
  map,
  onClose,
  onOpenGratitude,
}: BottomSheetProps) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const isJa = currentLang === 'ja';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // ─── Interactive Point-and-Order State (指差し注文カート) ───
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [requestNoAllium, setRequestNoAllium] = useState(false);
  const [requestGlutenFree, setRequestGlutenFree] = useState(false);
  const [requestTakeout, setRequestTakeout] = useState(false);
  const [showOrderTicketModal, setShowOrderTicketModal] = useState(false);

  // ─── 2026 Google Places Live Meta ───
  const googleMeta = useGooglePlaceDetails(place, map || null);

  // ─── Effective Kitchen Audit & Verified Menu ───
  const audit = useMemo(
    () => getEffectiveKitchenAudit(place, officialStoreData),
    [place, officialStoreData]
  );
  const verifiedMenu = useMemo(
    () => getEffectiveVerifiedMenu(place, officialStoreData),
    [place, officialStoreData]
  );

  const allPhotos = useMemo(() => {
    const userPhotos = place.posts.map((p) => p.image_url).filter(Boolean);
    const gPhotos = googleMeta.photos || [];
    const list = Array.from(new Set([...userPhotos, ...gPhotos]));
    return list.filter(Boolean);
  }, [place, googleMeta.photos]);

  const heroImage = allPhotos[activePhotoIndex] || allPhotos[0];

  useEffect(() => {
    setActivePhotoIndex(0);
    setOrderQuantities({});
    setShowOrderTicketModal(false);
  }, [place.google_place_id]);

  useEffect(() => {
    setIsSaved(isPlaceSaved(place.google_place_id));
  }, [place.google_place_id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showOrderTicketModal) {
          setShowOrderTicketModal(false);
        } else if (activePhoto) {
          setActivePhoto(null);
        } else if (isExpanded) {
          setIsExpanded(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOrderTicketModal, activePhoto, isExpanded, onClose]);

  const handleToggleSave = () => {
    const next = toggleSavePlaceId(place.google_place_id);
    setIsSaved(next);
    showToast(
      next ? `Saved ${place.name} to Wishlist` : 'Removed from Wishlist',
      next ? '❤️' : '🤍'
    );
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?place=${encodeURIComponent(
      place.google_place_id
    )}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${place.name} — vegan.jp`,
          text: `Found verified plant-based food at ${place.name} in Japan!`,
          url: shareUrl,
        });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', '📋');
    }
  };

  const updateItemQty = (item: MenuItem, delta: number) => {
    setOrderQuantities((prev) => {
      const nextQty = Math.max(0, (prev[item.id] || 0) + delta);
      const copy = { ...prev };
      if (nextQty === 0) {
        delete copy[item.id];
      } else {
        copy[item.id] = nextQty;
      }
      return copy;
    });
  };

  const selectedOrderItems = useMemo(() => {
    return verifiedMenu
      .filter((m) => (orderQuantities[m.id] || 0) > 0)
      .map((m) => ({
        item: m,
        qty: orderQuantities[m.id] || 0,
      }));
  }, [verifiedMenu, orderQuantities]);

  const totalOrderCount = useMemo(
    () => selectedOrderItems.reduce((acc, x) => acc + x.qty, 0),
    [selectedOrderItems]
  );

  const totalOrderYen = useMemo(
    () => selectedOrderItems.reduce((acc, x) => acc + x.item.price_jpy * x.qty, 0),
    [selectedOrderItems]
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.name + ' ' + (place.prefecture || '') + ' ' + (place.area || '')
  )}&query_place_id=${place.google_place_id}`;

  const genreEmoji = (place.genre && GENRE_EMOJIS[place.genre]) || '🌱';
  const is100Vegan =
    place.dietary_type === '100%_vegan' ||
    (!place.dietary_type &&
      place.features?.some(
        (f) =>
          f.includes('100%植物性') ||
          f.includes('全メニューヴィーガン') ||
          f.includes('100%ヴィーガン')
      ));

  const liveStatus = officialStoreData?.live_status;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:bg-slate-950/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ─── Stage 1: Peek Preview Card ─── */
          <motion.div
            key="peek-card"
            className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px] z-40 bg-white/95 backdrop-blur-2xl rounded-3xl p-3 sm:p-3.5 shadow-glass-xl border border-black/[0.08] cursor-pointer group hover:border-emerald-300 transition-all"
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={() => setIsExpanded(true)}
          >
            {/* Optional Live Kitchen Status Strip on Peek Card */}
            {liveStatus && (
              <div className="mb-2 px-2.5 py-1 rounded-2xl bg-emerald-950 text-emerald-100 text-[11px] font-semibold flex items-center justify-between gap-2">
                <span className="truncate">
                  {isJa ? liveStatus.message_ja : liveStatus.message_en}
                </span>
                <span className="text-[9px] font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  LIVE
                </span>
              </div>
            )}

            <div className="flex items-center gap-3.5">
              {/* Thumbnail */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-black/[0.06] shadow-2xs flex items-center justify-center">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl select-none">{genreEmoji}</span>
                )}
                {allPhotos.length > 1 && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-slate-900/85 px-1.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-0.5">
                    <span>📷</span>
                    <span>{allPhotos.length}</span>
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {officialStoreData?.is_official_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-100">
                      🏅 {isJa ? '店舗公式認定' : 'Official Partner'}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      is100Vegan
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-200/60'
                        : 'text-amber-800 bg-amber-50 border-amber-200/60'
                    }`}
                  >
                    {is100Vegan ? t.tag_100vegan : t.tag_options}
                  </span>

                  {googleMeta.rating && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <span>★</span>
                      <span>{googleMeta.rating.toFixed(1)}</span>
                    </span>
                  )}

                  {gratitudeNotes.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      💌 {gratitudeNotes.length}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight truncate group-hover:text-emerald-700 transition-colors">
                  {place.name}
                </h3>

                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span className="truncate">
                    📍 {isJa ? place.area || place.area_en : place.area_en || place.area}
                  </span>
                  <span className="text-emerald-700 font-bold text-[11px] shrink-0 group-hover:underline flex items-center gap-0.5 ml-2">
                    <span>
                      {isJa
                        ? '出汁情報・指差し注文メニューを見る'
                        : 'Kitchen Audit & Order Menu'}
                    </span>
                    <span>↑</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleToggleSave}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title={isSaved ? t.btn_saved : t.btn_save}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill={isSaved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Stage 2: Full Discovery & Interactive Ordering Drawer ─── */
          <motion.div
            key="expanded-sheet"
            className="fixed bottom-0 inset-x-0 z-50 bg-white/98 backdrop-blur-3xl rounded-t-[36px] max-h-[92vh] flex flex-col shadow-2xl border-t border-black/[0.08] pb-[env(safe-area-inset-bottom,0px)] md:fixed md:top-16 md:left-6 md:bottom-6 md:inset-x-auto md:w-[530px] md:max-h-[calc(100vh-80px)] md:rounded-[32px] md:border md:border-black/[0.08]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            {/* Mobile Grab Bar */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing md:hidden"
              onClick={() => setIsExpanded(false)}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors" />
            </div>

            {/* ─── Hero Photo Showcase ─── */}
            <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden shrink-0 group flex items-center justify-center">
              {heroImage ? (
                <>
                  <img
                    src={heroImage}
                    alt={place.name}
                    className="w-full h-full object-cover transition-all duration-500 cursor-pointer"
                    onClick={() => setActivePhoto(heroImage)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-black text-white p-6 text-center">
                  <span className="text-4xl mb-1 select-none">{genreEmoji}</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">{place.name}</h3>
                </div>
              )}

              {/* Top Badges */}
              <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {officialStoreData?.is_official_verified && (
                    <span className="text-xs font-extrabold text-emerald-100 bg-emerald-950/90 border border-emerald-400/50 backdrop-blur-md px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>🏅</span>
                      <span>
                        {isJa ? '店舗オーナー公式管理' : 'Official Verified Partner'}
                      </span>
                    </span>
                  )}

                  {googleMeta.rating && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-extrabold text-slate-900 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 hover:bg-white transition-colors"
                    >
                      <span className="text-amber-500">★</span>
                      <span>{googleMeta.rating.toFixed(1)}</span>
                      {googleMeta.userRatingsTotal && (
                        <span className="text-slate-500 font-semibold text-[10px]">
                          ({googleMeta.userRatingsTotal})
                        </span>
                      )}
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                  aria-label="Collapse"
                >
                  ✕
                </button>
              </div>

              {/* Photo Thumbnails */}
              {allPhotos.length > 1 && (
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80%] scrollbar-hide py-0.5">
                    {allPhotos.slice(0, 6).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-10 h-8 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          activePhotoIndex === idx
                            ? 'border-emerald-400 scale-105 shadow-md'
                            : 'border-white/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Place Title & Quick Action Strip */}
            <div className="px-5 py-3.5 border-b border-black/[0.06] bg-white shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        is100Vegan
                          ? 'text-emerald-800 bg-emerald-50 border-emerald-200/60'
                          : 'text-amber-800 bg-amber-50 border-amber-200/60'
                      }`}
                    >
                      {is100Vegan ? t.tag_100vegan : t.tag_options}
                    </span>
                    {(place.genre_en || place.genre) && (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {genreEmoji} {isJa ? place.genre : place.genre_en || place.genre}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                    {place.name}
                  </h2>
                  {place.name_ja && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">
                        🇯🇵 {place.name_ja}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(place.name_ja || '');
                          showToast(t.copied_toast, '📋');
                        }}
                        className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{t.copy_taxi}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleToggleSave}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-full border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-slate-100 border-slate-200/80 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isSaved ? '❤️' : '🤍'}</span>
                    <span>{isSaved ? t.btn_saved : t.btn_save}</span>
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    <span>{t.btn_directions}</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ─── Scrollable Body ─── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 bg-slate-50/60 space-y-4">
              {/* 1. LIVE KITCHEN STATUS BROADCAST (If Store Owner Posted) */}
              {liveStatus && (
                <div className="p-3.5 rounded-2xl bg-emerald-950 text-white border border-emerald-700/50 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>
                        {isJa
                          ? '店舗からのリアルタイム発信 (Live Kitchen Broadcast)'
                          : 'Live Kitchen Broadcast from Store'}
                      </span>
                    </span>
                    <span className="text-[10px] text-emerald-300/80">
                      {officialStoreData?.owner_name}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-50 leading-relaxed">
                    {isJa ? liveStatus.message_ja : liveStatus.message_en}
                  </p>
                </div>
              )}

              {/* 2. 8-POINT KITCHEN & DASHI TRANSPARENCY AUDIT (Google Maps / HappyCow Differentiator) */}
              <div className="bg-white rounded-3xl p-4 border border-black/[0.06] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🛡️</span>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      {isJa
                        ? '出汁・調理環境 8項目安全開示シート'
                        : 'Kitchen & Dashi Safety Audit (8 Checkpoints)'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {officialStoreData?.is_official_verified
                      ? isJa
                        ? '✓ 店舗公式回答済'
                        : '✓ Owner Certified'
                      : isJa
                      ? '✓ 監査データ'
                      : '✓ Audited'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="text-[10px] font-bold text-emerald-900/70">
                      🍲 {isJa ? '出汁・スープベース' : 'Broth & Dashi Base'}
                    </div>
                    <div className="font-bold text-emerald-950 mt-0.5">
                      {audit.dashi_type === '100_plant'
                        ? isJa
                          ? '100% 昆布・椎茸・植物性（魚介ゼロ）'
                          : '100% Kelp/Mushroom (Zero Fish)'
                        : isJa
                        ? 'ヴィーガン品は魚介出汁完全不使用'
                        : 'Zero Fish Dashi in Vegan Dishes'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">
                      🍳 {isJa ? '揚げ油・調理器具' : 'Fryer Oil & Cookware'}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {audit.fryer_oil === 'dedicated'
                        ? isJa
                          ? '植物性専用キッチン・専用油'
                          : '100% Dedicated Vegan Kitchen'
                        : isJa
                        ? '器具洗浄徹底（一般メニューと併用）'
                        : 'Shared Kitchen (Utensils Washed)'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">
                      🧅 {isJa ? '五葷（ねぎ・にんにく等）' : 'Alliums (Garlic / Onion)'}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {audit.allium_free === 'all_free'
                        ? isJa
                          ? '全品 五葷完全不使用'
                          : '100% Allium-Free Kitchen'
                        : audit.allium_free === 'customizable'
                        ? isJa
                          ? '五葷抜き変更可能'
                          : 'No-Garlic/Onion Option Available'
                        : isJa
                        ? '一部五葷使用あり'
                        : 'Contains Alliums in Base'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">
                      🌾 {isJa ? 'グルテンフリー対応' : 'Gluten-Free Support'}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {audit.gluten_free === '100_gf'
                        ? isJa
                          ? '100% 完全グルテンフリー専門店'
                          : '100% Dedicated Gluten-Free'
                        : audit.gluten_free === 'gf_option'
                        ? isJa
                          ? 'グルテンフリー変更・選択可'
                          : 'Gluten-Free Options Available'
                        : isJa
                        ? '小麦使用（醤油・麺等）'
                        : 'Contains Wheat / Soy Sauce'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">
                      🍶 {isJa ? 'アルコール・白砂糖・蜂蜜' : 'Alcohol, Sugar & Honey'}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {audit.sugar_honey === 'no_bone_char_no_honey'
                        ? isJa
                          ? '白砂糖・蜂蜜・動物性完全不使用'
                          : 'Zero Refined Sugar & Zero Honey'
                        : isJa
                        ? '蜂蜜不使用・植物性甘味料'
                        : '100% Honey-Free'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[10px] font-bold text-slate-500">
                      💳 {isJa ? '決済・入店ルール' : 'Payment & Walk-in'}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5 truncate">
                      {audit.reservation_policy === 'walk_in_ok'
                        ? isJa
                          ? '予約不要 · カード/QR/現金OK'
                          : 'Walk-ins OK · Card/IC/Cash'
                        : isJa
                        ? '予約推奨 · カード/現金OK'
                        : 'Reservation Rec · Card/Cash'}
                    </div>
                  </div>
                </div>

                {/* Chef's Official Greeting or Store Profile */}
                {(officialStoreData?.chef_greeting_en ||
                  officialStoreData?.chef_greeting_ja ||
                  place.profile_text_en ||
                  place.profile_text) && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                    {officialStoreData?.chef_greeting_ja && (
                      <div className="text-[10px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                        <span>👨‍🍳</span>
                        <span>
                          {isJa
                            ? `${officialStoreData.owner_name}からのメッセージ`
                            : `Message from ${officialStoreData.owner_name}`}
                        </span>
                      </div>
                    )}
                    <p>
                      {isJa
                        ? officialStoreData?.chef_greeting_ja ||
                          place.profile_text ||
                          place.profile_text_en
                        : officialStoreData?.chef_greeting_en ||
                          place.profile_text_en ||
                          place.profile_text}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. INTERACTIVE POINT-AND-ORDER VEGAN MENU (指差し注文・確定ヴィーガンメニュー) */}
              <div className="bg-white rounded-3xl p-4 border border-emerald-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🗣️</span>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {isJa
                          ? '指差し注文・確定ヴィーガンメニュー'
                          : 'Point & Order Verified Vegan Menu'}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isJa
                        ? 'メニューを選んで「店員さんに見せる」を押すと、正確な日本語注文票を表示します'
                        : 'Tap + on dishes you want, then show the Japanese Order Ticket to your server!'}
                    </p>
                  </div>
                </div>

                {/* Menu Items List */}
                <div className="space-y-2.5">
                  {verifiedMenu.map((item) => {
                    const qty = orderQuantities[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          qty > 0
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {item.is_popular && (
                                <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md">
                                  ★ POPULAR
                                </span>
                              )}
                              {item.is_100_vegan && (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-md">
                                  🌱 100% Vegan
                                </span>
                              )}
                              {item.is_gluten_free && (
                                <span className="text-[9px] font-bold bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded-md">
                                  🌾 GF
                                </span>
                              )}
                              {item.is_allium_free && (
                                <span className="text-[9px] font-bold bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded-md">
                                  🧅 No Alliums
                                </span>
                              )}
                            </div>

                            <div className="font-bold text-xs text-slate-900">
                              {isJa ? item.name_ja : item.name_en}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              🇯🇵 {item.name_ja}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {isJa ? item.description_ja : item.description_en}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-xs font-extrabold text-slate-900">
                              ¥{item.price_jpy.toLocaleString()}
                            </span>

                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => updateItemQty(item, 1)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              >
                                + {isJa ? '注文追加' : 'Order'}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-white border border-emerald-400 rounded-xl px-1.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item, -1)}
                                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="text-xs font-extrabold text-emerald-900 px-1">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item, 1)}
                                  className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dietary Customization Toggles for Order Ticket */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isJa
                      ? '注文時の追加リクエスト（チェックすると日本語注文票に追記されます）'
                      : 'Add Special Dietary Requests to Japanese Order Ticket:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRequestNoAllium(!requestNoAllium)}
                      className={`px-2.5 py-1 rounded-xl border font-semibold cursor-pointer transition-all ${
                        requestNoAllium
                          ? 'bg-purple-900 text-white border-purple-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🧅 {isJa ? '五葷（ねぎ・にんにく）抜き' : 'No Garlic / No Onion'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestGlutenFree(!requestGlutenFree)}
                      className={`px-2.5 py-1 rounded-xl border font-semibold cursor-pointer transition-all ${
                        requestGlutenFree
                          ? 'bg-teal-900 text-white border-teal-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🌾 {isJa ? 'グルテンフリー（小麦不使用）希望' : 'Gluten-Free Required'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestTakeout(!requestTakeout)}
                      className={`px-2.5 py-1 rounded-xl border font-semibold cursor-pointer transition-all ${
                        requestTakeout
                          ? 'bg-amber-800 text-white border-amber-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🥡 {isJa ? 'テイクアウト（持ち帰り）希望' : 'Takeout / To-Go'}
                    </button>
                  </div>
                </div>

                {/* Open Fullscreen Japanese Order Ticket Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (totalOrderCount === 0 && verifiedMenu[0]) {
                      updateItemQty(verifiedMenu[0], 1);
                    }
                    setShowOrderTicketModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🗣️</span>
                    <span>
                      {isJa
                        ? '店員さん提示用「日本語オーダー票」を表示'
                        : 'Show Japanese Order Ticket to Staff'}
                    </span>
                  </span>
                  <span className="bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black">
                    {totalOrderCount > 0
                      ? `${totalOrderCount} items · ¥${totalOrderYen.toLocaleString()}`
                      : isJa
                      ? '1タップ表示 →'
                      : 'Open Card →'}
                  </span>
                </button>
              </div>

              {/* 4. TWO-WAY GRATITUDE WALL & OFFICIAL CHEF REPLIES */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-emerald-50/60 border border-rose-200/90 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                      <span>💌</span>
                      <span>{t.send_love_title}</span>
                      {gratitudeNotes.length > 0 && (
                        <span className="text-[10px] bg-rose-200/80 text-rose-900 font-extrabold px-2 py-0.5 rounded-full">
                          {gratitudeNotes.length} letters
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {isJa
                        ? 'あなたの感謝メッセージは店舗オーナーの管理画面へ直接届き、シェフから返信が届きます！'
                        : 'Your thank-you note is translated into Japanese and sent directly to the chef’s Partner Inbox!'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onOpenGratitude?.(
                        place,
                        'gratitude',
                        selectedOrderItems.map((x) => x.item.name_ja)
                      )
                    }
                    className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                  >
                    <span>{t.btn_send_love}</span>
                  </button>
                </div>

                {/* Live Gratitude Notes & Official Chef Replies */}
                {gratitudeNotes.length > 0 && (
                  <div className="pt-2 border-t border-rose-200/60 space-y-2.5">
                    <span className="text-[10px] font-extrabold text-rose-900 uppercase tracking-wider block">
                      {t.recent_notes_title}
                    </span>
                    <div className="space-y-2.5">
                      {gratitudeNotes.slice(0, 4).map((note) => (
                        <div
                          key={note.id}
                          className="bg-white/95 p-3 rounded-2xl border border-rose-100 shadow-2xs text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{note.stamp_emoji}</span>
                              <span>
                                {isJa ? note.stamp_title_ja : note.stamp_title_en}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                              {note.sender_name} · {note.sender_country}
                            </span>
                          </div>

                          {note.ordered_dishes && note.ordered_dishes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {note.ordered_dishes.map((d, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md"
                                >
                                  🍽️ {d}
                                </span>
                              ))}
                            </div>
                          )}

                          {note.message_original && (
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              &quot;{isJa ? note.message_ja_translated : note.message_original}&quot;
                            </p>
                          )}

                          {/* Official Chef's Reply */}
                          {note.owner_reply && (
                            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-900">
                                <span className="flex items-center gap-1">
                                  <span>👨‍🍳</span>
                                  <span>
                                    {isJa
                                      ? `店舗からの公式返信 (${note.owner_reply.chef_name})`
                                      : `Official Reply from ${note.owner_reply.chef_name}`}
                                  </span>
                                </span>
                                <span className="text-emerald-700">✓ Verified Owner</span>
                              </div>
                              <p className="text-[11px] text-emerald-950 leading-relaxed">
                                {isJa ? note.owner_reply.text_ja : note.owner_reply.text_en}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. STORE OWNER PORTAL CTA (店舗オーナー登録・管理・返信リンク) */}
              <div className="p-4 rounded-3xl bg-slate-900 text-white flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    🏪 For Restaurant Owners / 飲食店オーナー様へ
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {officialStoreData?.is_official_verified
                      ? 'この店舗の公式メニュー更新・感謝レターへの返信はこちら'
                      : 'この店舗の公式オーナー登録（無料）・メニュー掲載・感謝レター受信はこちら'}
                  </div>
                </div>
                <Link
                  href={`/partner?placeId=${encodeURIComponent(place.google_place_id)}`}
                  className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-colors"
                >
                  {isJa ? '店舗管理画面へ →' : 'Partner Portal →'}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FULLSCREEN JAPANESE ORDER TICKET FOR WAITSTAFF (店員さん提示用・指差し確定オーダー票) ─── */}
      <AnimatePresence>
        {showOrderTicketModal && (
          <motion.div
            className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOrderTicketModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col max-h-[92vh]"
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Staff Header in Large Clear Japanese */}
              <div className="bg-emerald-950 text-white p-5 text-center space-y-1">
                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
                  Show This Screen to Restaurant Staff / 店員さんにご提示ください
                </div>
                <h3 className="text-lg font-black leading-snug">
                  【お店の方へ】ご注文をお願いします
                </h3>
                <p className="text-xs text-emerald-200 font-medium">
                  {place.name_ja || place.name}
                </p>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {/* Selected Dishes in Clear Japanese */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    ご注文メニュー (Selected Vegan Items)
                  </div>
                  {selectedOrderItems.map(({ item, qty }) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-black text-slate-950 leading-snug">
                          {item.name_ja}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{item.name_en}</div>
                        {item.order_note_ja && (
                          <div className="text-[11px] font-bold text-emerald-800 mt-1">
                            ※ {item.order_note_ja}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block bg-emerald-700 text-white text-base font-black px-3 py-1 rounded-xl">
                          × {qty}
                        </span>
                        <div className="text-xs font-bold text-slate-600 mt-1">
                          ¥{(item.price_jpy * qty).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mandatory Japanese Dietary Confirmation Box */}
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-2 text-slate-900">
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <span>🙏</span>
                    <span>調理に関するお願い（ヴィーガン・植物性確認）</span>
                  </div>
                  <ul className="text-xs font-bold space-y-1.5 text-slate-800">
                    <li>
                      ✅ 肉・魚介類・<strong>かつおや煮干し等の魚介出汁</strong>・卵・乳製品・はちみつを含まない調理でお願いします。
                    </li>
                    {requestNoAllium && (
                      <li className="text-purple-900 bg-purple-100 px-2 py-1 rounded-lg">
                        🧅 <strong>五葷（ねぎ・にんにく・ニラ・玉ねぎ・らっきょう）抜き</strong>でお願いします。
                      </li>
                    )}
                    {requestGlutenFree && (
                      <li className="text-teal-900 bg-teal-100 px-2 py-1 rounded-lg">
                        🌾 <strong>小麦・グルテンフリー（米粉等）仕様</strong>でお願いします。
                      </li>
                    )}
                    {requestTakeout && (
                      <li className="text-amber-950 bg-amber-200/70 px-2 py-1 rounded-lg">
                        🥡 <strong>テイクアウト（持ち帰り）</strong>でお願いします。
                      </li>
                    )}
                  </ul>
                </div>

                {/* Total Price Estimate */}
                <div className="flex items-center justify-between px-2 pt-1 text-sm font-black text-slate-900">
                  <span>合計目安 (Estimated Total)</span>
                  <span className="text-lg text-emerald-800">
                    ¥{totalOrderYen.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderTicketModal(false);
                    onOpenGratitude?.(
                      place,
                      'gratitude',
                      selectedOrderItems.map((x) => x.item.name_ja)
                    );
                  }}
                  className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  💌 食後にシェフへ感謝カードを贈る (Send Gratitude After Meal)
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderTicketModal(false)}
                  className="w-full py-2 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
                >
                  閉じる (Close Order Ticket)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fullscreen Photo Lightbox ─── */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <img
                src={activePhoto}
                alt=""
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
