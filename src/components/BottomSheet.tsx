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

type SheetTab = 'menu' | 'safety' | 'letters';

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
  const [activeSheetTab, setActiveSheetTab] = useState<SheetTab>('menu');
  const [isSaved, setIsSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // ─── Interactive Point-and-Order State (指差し注文カート) ───
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [requestNoAllium, setRequestNoAllium] = useState(false);
  const [requestGlutenFree, setRequestGlutenFree] = useState(false);
  const [requestTakeout, setRequestTakeout] = useState(false);
  const [showOrderTicketModal, setShowOrderTicketModal] = useState(false);

  const googleMeta = useGooglePlaceDetails(place, map || null);

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
    setActiveSheetTab('menu');
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
  const cert = officialStoreData?.verification_cert;

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
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {officialStoreData?.is_official_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-100">
                      🛡️ {isJa ? '本人確認済オーナー店' : 'Verified Owner'}
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
                        ? '指差し注文メニュー・出汁情報を開く'
                        : 'Open Menu & Order Ticket'}
                    </span>
                    <span>↑</span>
                  </span>
                </div>
              </div>

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
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Stage 2: Clean 3-Tab Discovery & Ordering Drawer ─── */
          <motion.div
            key="expanded-sheet"
            className="fixed bottom-0 inset-x-0 z-50 bg-white/98 backdrop-blur-3xl rounded-t-[36px] max-h-[92vh] flex flex-col shadow-2xl border-t border-black/[0.08] pb-[env(safe-area-inset-bottom,0px)] md:fixed md:top-16 md:left-6 md:bottom-6 md:inset-x-auto md:w-[520px] md:max-h-[calc(100vh-80px)] md:rounded-[32px] md:border md:border-black/[0.08]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          >
            {/* Hero Image */}
            <div className="relative aspect-[16/8] w-full bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
              {heroImage ? (
                <>
                  <img
                    src={heroImage}
                    alt={place.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setActivePhoto(heroImage)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-black text-white p-6 text-center">
                  <span className="text-4xl mb-1">{genreEmoji}</span>
                  <h3 className="text-lg font-bold text-white">{place.name}</h3>
                </div>
              )}

              <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {officialStoreData?.is_official_verified && (
                    <span className="text-xs font-extrabold text-emerald-100 bg-emerald-950/90 border border-emerald-400/50 backdrop-blur-md px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>🛡️</span>
                      <span>
                        {isJa
                          ? `本人確認済オーナー (${cert?.certificate_id || 'CERTIFIED'})`
                          : `Verified Owner (${cert?.certificate_id || 'CERTIFIED'})`}
                      </span>
                    </span>
                  )}

                  {googleMeta.rating && (
                    <span className="text-xs font-extrabold text-slate-900 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span>{googleMeta.rating.toFixed(1)}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Store Title & 3-Tab Switcher Header */}
            <div className="px-5 pt-3.5 pb-2 border-b border-slate-200 bg-white shrink-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 truncate">
                    {place.name}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    📍 {isJa ? place.area || place.area_en : place.area_en || place.area}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                  >
                    <span>🗺️ {t.btn_directions}</span>
                  </a>
                </div>
              </div>

              {/* Clean 3-Tab Navigation (No Clutter!) */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('menu')}
                  className={`py-2 px-2 rounded-xl transition-all cursor-pointer truncate ${
                    activeSheetTab === 'menu'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🗣️ {isJa ? '指差し注文' : 'Order Menu'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('safety')}
                  className={`py-2 px-2 rounded-xl transition-all cursor-pointer truncate ${
                    activeSheetTab === 'safety'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🛡️ {isJa ? '出汁・安全証明' : 'Dashi Audit'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSheetTab('letters')}
                  className={`py-2 px-2 rounded-xl transition-all cursor-pointer truncate ${
                    activeSheetTab === 'letters'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💌 {isJa ? `感謝の声 (${gratitudeNotes.length})` : `Letters (${gratitudeNotes.length})`}
                </button>
              </div>
            </div>

            {/* ─── Scrollable Tab Content ─── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 bg-slate-50/70 space-y-4">
              {/* Live Kitchen Status Banner */}
              {liveStatus && (
                <div className="p-3 rounded-2xl bg-emerald-950 text-white text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span>{isJa ? liveStatus.message_ja : liveStatus.message_en}</span>
                </div>
              )}

              {/* TAB 1: 🗣️ POINT-AND-ORDER MENU */}
              {activeSheetTab === 'menu' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                    <strong>
                      {isJa
                        ? '💡 使い方：'
                        : '💡 How to Order without Speaking Japanese:'}
                    </strong>{' '}
                    {isJa
                      ? '注文したい料理の「＋」を押し、下の黒いボタンを押すと「店員さん提示用の日本語オーダー票」が大きく表示されます。'
                      : 'Tap "+ Order" on the dishes you want, then tap the button below to show a clear Japanese Order Ticket to your waiter!'}
                  </div>

                  <div className="space-y-2.5">
                    {verifiedMenu.map((item) => {
                      const qty = orderQuantities[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl bg-white border transition-all ${
                            qty > 0
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'border-slate-200/90'
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
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-md">
                                  🌱 100% Vegan
                                </span>
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
                              <div className="text-[10px] text-slate-500 mt-0.5">
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
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  + {isJa ? '注文追加' : 'Order'}
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-400 rounded-xl px-1.5 py-1">
                                  <button
                                    type="button"
                                    onClick={() => updateItemQty(item, -1)}
                                    className="w-6 h-6 rounded-lg bg-white font-bold text-xs flex items-center justify-center cursor-pointer"
                                  >
                                    −
                                  </button>
                                  <span className="text-xs font-extrabold text-emerald-950 px-1">
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

                  {/* Special Request Toggles */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      {isJa
                        ? '注文票に追記するリクエスト（任意）'
                        : 'Optional Requests to Add on Japanese Order Ticket:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setRequestNoAllium(!requestNoAllium)}
                        className={`px-2.5 py-1 rounded-xl border font-semibold cursor-pointer ${
                          requestNoAllium
                            ? 'bg-purple-900 text-white border-purple-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        🧅 {isJa ? '五葷抜き' : 'No Garlic / Onion'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestGlutenFree(!requestGlutenFree)}
                        className={`px-2.5 py-1 rounded-xl border font-semibold cursor-pointer ${
                          requestGlutenFree
                            ? 'bg-teal-900 text-white border-teal-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        🌾 {isJa ? 'グルテンフリー希望' : 'Gluten-Free'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestTakeout(!requestTakeout)}
                        className={`px-2.5 py-1 rounded-xl border font-semibold cursor-pointer ${
                          requestTakeout
                            ? 'bg-amber-800 text-white border-amber-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        🥡 {isJa ? 'テイクアウト' : 'Takeout'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (totalOrderCount === 0 && verifiedMenu[0]) {
                        updateItemQty(verifiedMenu[0], 1);
                      }
                      setShowOrderTicketModal(true);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-between"
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
                        ? '表示する →'
                        : 'Open Ticket →'}
                    </span>
                  </button>
                </div>
              )}

              {/* TAB 2: 🛡️ DASHI & KITCHEN SAFETY AUDIT + ANTI-SPOOFING CERTIFICATE */}
              {activeSheetTab === 'safety' && (
                <div className="space-y-3">
                  {/* Anti-Spoofing Verification Certificate Box */}
                  {cert && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950 text-white border border-emerald-600 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-300">
                        <span>🛡️ なりすまし防止・オーナー本人確認証明</span>
                        <span>ID: {cert.certificate_id}</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isJa ? cert.method_label_ja : cert.method_label_en}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900">
                      🛡️ {isJa ? '出汁・調理環境 8項目安全チェック' : '8-Point Kitchen & Dashi Safety Check'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[10px] font-bold text-emerald-800">
                          🍲 {isJa ? '出汁・スープベース' : 'Broth & Dashi'}
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

                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">
                          🍳 {isJa ? '揚げ油・調理器具' : 'Fryer Oil & Cookware'}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {audit.fryer_oil === 'dedicated'
                            ? isJa
                              ? '植物性専用キッチン・専用油'
                              : '100% Dedicated Vegan Kitchen'
                            : isJa
                            ? '器具洗浄徹底（一般食材と併用）'
                            : 'Shared Kitchen (Utensils Washed)'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">
                          🧅 {isJa ? '五葷（ねぎ・にんにく）' : 'Alliums (Garlic/Onion)'}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {audit.allium_free === 'all_free'
                            ? isJa
                              ? '全品 五葷完全不使用'
                              : '100% Allium-Free'
                            : isJa
                            ? '五葷抜き変更可能'
                            : 'No-Allium Option Available'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">
                          🌾 {isJa ? 'グルテンフリー対応' : 'Gluten-Free'}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {audit.gluten_free === '100_gf'
                            ? isJa
                              ? '100% 完全グルテンフリー'
                              : '100% Dedicated Gluten-Free'
                            : isJa
                            ? 'GFメニュー・変更可'
                            : 'Gluten-Free Options Available'}
                        </div>
                      </div>
                    </div>

                    {(officialStoreData?.chef_greeting_ja || place.profile_text) && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        {isJa
                          ? officialStoreData?.chef_greeting_ja || place.profile_text
                          : officialStoreData?.chef_greeting_en || place.profile_text_en}
                      </div>
                    )}
                  </div>

                  {/* Store Owner Link */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <div className="text-[10px] font-extrabold text-emerald-400">
                        🏪 飲食店オーナー様へ (For Restaurant Owners)
                      </div>
                      <div className="font-bold mt-0.5">
                        本人確認・メニュー編集・店頭用QRコード印刷はこちら
                      </div>
                    </div>
                    <Link
                      href={`/partner?placeId=${encodeURIComponent(
                        place.google_place_id
                      )}`}
                      className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl"
                    >
                      店舗管理画面 →
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 3: 💌 GRATITUDE LETTERS & CHEF REPLIES */}
              {activeSheetTab === 'letters' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-rose-950">
                        💌 {t.send_love_title}
                      </div>
                      <p className="text-[11px] text-rose-900/80 mt-0.5">
                        {isJa
                          ? '感謝レターは日本語翻訳付きでシェフへ届き、公式返信がもらえます！'
                          : 'Your message is translated into Japanese for the chef, who can reply directly to you!'}
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
                      className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer"
                    >
                      {t.btn_send_love}
                    </button>
                  </div>

                  {gratitudeNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {note.stamp_emoji}{' '}
                          {isJa ? note.stamp_title_ja : note.stamp_title_en}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
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

                      {note.owner_reply && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-900">
                            <span>👨‍🍳 {note.owner_reply.chef_name}</span>
                            <span>🛡️ 本人確認済オーナー返信</span>
                          </div>
                          <p className="text-[11px] text-emerald-950 leading-relaxed">
                            {isJa ? note.owner_reply.text_ja : note.owner_reply.text_en}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FULLSCREEN JAPANESE ORDER TICKET FOR WAITSTAFF ─── */}
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

                <div className="flex items-center justify-between px-2 pt-1 text-sm font-black text-slate-900">
                  <span>合計目安 (Estimated Total)</span>
                  <span className="text-lg text-emerald-800">
                    ¥{totalOrderYen.toLocaleString()}
                  </span>
                </div>
              </div>

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
                  className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                >
                  💌 食後にシェフへ感謝カードを贈る (Send Gratitude After Meal)
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderTicketModal(false)}
                  className="w-full py-2 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  閉じる (Close Order Ticket)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
