'use client';

import { useState, useEffect, useMemo } from 'react';
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
  getEffectiveVerifiedMenu,
  getEffectiveWelcomePerk,
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

export default function BottomSheet({
  place,
  currentLang = 'en',
  officialStoreData,
  gratitudeNotes = [],
  onClose,
  onOpenGratitude,
}: BottomSheetProps) {
  const isJa = currentLang === 'ja';
  const t = TRANSLATIONS[currentLang];

  const [saved, setSaved] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<MenuItem | null>(null);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [selectedSideIds, setSelectedSideIds] = useState<string[]>([]);

  const googleDetails = useGooglePlaceDetails(place);

  useEffect(() => {
    setSaved(isPlaceSaved(place.google_place_id));
    setSelectedOrderItem(null);
    setOrderQty(1);
    setSelectedSideIds([]);
  }, [place.google_place_id]);

  const verifiedMenu = useMemo(
    () => getEffectiveVerifiedMenu(place, officialStoreData),
    [place, officialStoreData]
  );

  const welcomePerk = useMemo(
    () => getEffectiveWelcomePerk(place, officialStoreData),
    [place, officialStoreData]
  );

  const signatureDish = verifiedMenu[0] || null;
  const subDishes = verifiedMenu.slice(1, 3);

  const handleToggleSave = () => {
    const isNowSaved = toggleSavePlaceId(place.google_place_id);
    setSaved(isNowSaved);
    window.dispatchEvent(new CustomEvent('vegan-jp-saved-updated'));
    showToast(isNowSaved ? t.toast_saved : t.toast_removed, isNowSaved ? '❤️' : '🤍');
  };

  const toggleSideDish = (id: string) => {
    setSelectedSideIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const displayGenre = isJa ? place.genre : place.genre_en || place.genre;
  const displayArea = isJa ? place.area : place.area_en || place.area;
  const displayProfile = isJa
    ? officialStoreData?.chef_greeting_ja || place.profile_text
    : officialStoreData?.chef_greeting_en || place.profile_text_en || place.profile_text;

  const heroImageUrl =
    googleDetails.photos[0] ||
    place.posts?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=900&q=80';

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${place.name_ja || place.name} ${place.area || ''}`
  )}`;

  const modalAddOns = verifiedMenu.filter((d) => d.id !== selectedOrderItem?.id);
  const selectedSides = modalAddOns.filter((d) => selectedSideIds.includes(d.id));
  const totalOrderPrice =
    (selectedOrderItem ? selectedOrderItem.price_jpy * orderQty : 0) +
    selectedSides.reduce((sum, d) => sum + d.price_jpy, 0);

  return (
    <AnimatePresence>
      {/* ─── Docked Left Panel on Desktop / Slide-Up Sheet on Mobile (Does NOT block map!) ─── */}
      <motion.aside
        role="dialog"
        aria-modal="false"
        aria-label={place.name}
        className="fixed inset-x-0 bottom-0 md:inset-x-auto md:left-4 md:top-16 md:bottom-4 z-30 flex justify-center md:block pointer-events-none"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="pointer-events-auto w-full max-w-xl md:w-[430px] bg-white rounded-t-[28px] md:rounded-[28px] shadow-[0_16px_48px_rgba(20,40,30,0.18)] border border-[#DCECE3] max-h-[82dvh] md:max-h-full md:h-full flex flex-col overflow-hidden">
          {/* Mobile Drag Handle */}
          <div className="md:hidden pt-2 flex justify-center bg-white shrink-0">
            <div className="w-10 h-1 rounded-full bg-[#DCECE3]" />
          </div>

          {/* Sticky Store Header */}
          <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-[#EDF5F0] bg-white shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-[17px] font-extrabold text-[#1C2822] leading-snug">
                  {isJa ? place.name_ja || place.name : place.name}
                </h2>
                {officialStoreData?.verification_cert?.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF7F2] text-[#15803D] border border-[#C5DDD0]">
                    ✓ {isJa ? '公式オーナー認証店' : 'Verified Chef'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#526358] mt-0.5">
                <span>{displayArea}</span>
                <span>•</span>
                <span>{displayGenre}</span>
                {googleDetails.rating && (
                  <>
                    <span>•</span>
                    <span className="text-[#1C2822] font-bold">
                      ★ {googleDetails.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleToggleSave}
                className={`size-8 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  saved
                    ? 'bg-[#1C2822] text-white border-[#1C2822]'
                    : 'bg-[#F7FBF8] text-[#4A5D52] border-[#DCECE3] hover:bg-[#EEF7F2]'
                }`}
                title={t.wishlist}
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill={saved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="size-8 rounded-full bg-[#F7FBF8] hover:bg-[#EEF7F2] border border-[#DCECE3] text-[#4A5D52] flex items-center justify-center text-xs font-bold transition-all active:scale-95 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-4 py-3.5 space-y-4 flex-1">
            {/* 1. Clean Appetizing Food Photo + 1-Tap Navigation Bar */}
            <div className="rounded-[20px] overflow-hidden border border-[#DCECE3] bg-[#F7FBF8]">
              <div className="relative h-40 w-full overflow-hidden bg-[#EEF7F2]">
                <img
                  src={heroImageUrl}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10.5px] font-extrabold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#14532D] shadow-xs">
                    {place.dietary_type === '100%_vegan'
                      ? isJa ? '100% 植物性（ヴィーガン）' : '100% Plant-Based'
                      : isJa ? 'ヴィーガン対応メニューあり' : 'Vegan Options Available'}
                  </span>
                </div>

                {/* Quick Action Overlay Buttons on Bottom Right of Photo */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-full bg-white/95 hover:bg-white text-[#1C2822] font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <svg className="size-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>{isJa ? '現在地からルート案内' : 'Directions'}</span>
                  </a>
                  {place.instagram_url && (
                    <a
                      href={place.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 rounded-full bg-[#1C2822]/90 hover:bg-[#1C2822] text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      <span>Instagram ↗</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Chef's Story below photo (Never covers the food!) */}
              {displayProfile && (
                <div className="px-3.5 py-2.5 text-xs text-[#3D5245] leading-relaxed font-medium border-t border-[#DCECE3] bg-white">
                  {displayProfile}
                </div>
              )}
            </div>

            {/* 2. PILLAR 1: Chef's Signature Dish & Welcome Perk (.nani-well + .nani-sheet) */}
            {signatureDish && (
              <div className="nani-well">
                <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#14532D]">
                    <span className="size-2 rounded-full bg-[#16A34A]" />
                    <span>
                      {isJa
                        ? '看板の一皿 ＆ 来店歓迎特典'
                        : "Chef's Signature Dish & Welcome Perk"}
                    </span>
                  </span>
                  <span className="text-xs font-extrabold text-[#1C2822] bg-white px-2.5 py-0.5 rounded-full shadow-2xs">
                    ¥{signatureDish.price_jpy.toLocaleString()}
                  </span>
                </div>

                <div className="nani-sheet p-4 space-y-3">
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#1C2822] leading-snug">
                      {isJa ? signatureDish.name_ja : signatureDish.name_en}
                    </h3>
                    {!isJa && (
                      <p className="text-[11.5px] font-bold text-[#15803D] mt-0.5">
                        {signatureDish.name_ja}
                      </p>
                    )}
                    <p className="text-xs text-[#526358] leading-relaxed mt-1 font-medium">
                      {isJa ? signatureDish.description_ja : signatureDish.description_en}
                    </p>

                    {/* Dietary Reassurance Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF7F2] text-[#15803D]">
                        ✓ {isJa ? '動物性・魚介出汁 不使用' : '100% Plant Broth'}
                      </span>
                      {signatureDish.is_gluten_free && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF7F2] text-[#15803D]">
                          ✓ Gluten-Free
                        </span>
                      )}
                      {signatureDish.is_allium_free && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEF7F2] text-[#15803D]">
                          ✓ {isJa ? '五葷抜き対応' : 'Allium-Free'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Exclusive Show-Screen Welcome Perk */}
                  <div className="rounded-[14px] bg-[#F2F9F5] border border-[#C5DDD0] p-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#15803D]">
                        {isJa
                          ? '🎁 画面提示の歓迎特典（注文時に提示）'
                          : '🎁 Free Welcome Perk (Show at Table)'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#1C2822] leading-snug">
                      {isJa ? welcomePerk.ja : welcomePerk.en}
                    </p>
                  </div>

                  {/* Primary Table Action Button: Show Japanese Order Ticket */}
                  <button
                    onClick={() => {
                      setSelectedOrderItem(signatureDish);
                      setOrderQty(1);
                    }}
                    className="w-full h-11 px-4 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all cursor-pointer"
                  >
                    <svg className="size-4 text-[#22C55E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="7" y1="9" x2="17" y2="9" />
                      <line x1="7" y1="13" x2="13" y2="13" />
                    </svg>
                    <span>
                      {isJa
                        ? '店員さんに見せて注文＋歓迎特典を受取る →'
                        : 'Show to Staff: Japanese Order Ticket + Free Perk →'}
                    </span>
                  </button>

                  {/* Optional Popular Pairings */}
                  {subDishes.length > 0 && (
                    <div className="pt-2.5 border-t border-[#EDF5F0] space-y-1.5">
                      <p className="text-[11px] font-bold text-[#526358]">
                        {isJa ? '一緒に頼める人気サイドメニュー' : 'Popular Side Dishes'}
                      </p>
                      <div className="space-y-1.5">
                        {subDishes.map((dish) => (
                          <button
                            key={dish.id}
                            onClick={() => {
                              setSelectedOrderItem(dish);
                              setOrderQty(1);
                            }}
                            className="w-full text-left px-3 py-2 rounded-[12px] bg-[#F7FBF8] hover:bg-[#EEF7F2] border border-[#DCECE3] flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-98"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1C2822] truncate">
                                {isJa ? dish.name_ja : dish.name_en}
                              </p>
                              <p className="text-[11px] font-extrabold text-[#15803D]">
                                ¥{dish.price_jpy.toLocaleString()}
                              </p>
                            </div>
                            <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#DCECE3] text-[#1C2822] shrink-0">
                              {isJa ? '注文票を表示' : 'Order Ticket'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. PILLAR 2: Gochisosama Postcards & Culinary Stamp Rally */}
            <div className="nani-dashed p-4 space-y-3 bg-[#F7FBF8]/90">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10.5px] font-extrabold text-[#15803D]">
                    {isJa
                      ? '💮 食後の楽しみ：旅の美食御朱印 ＆ 絵葉書'
                      : '💮 After Your Meal: Culinary Stamp & Postcard'}
                  </span>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#1C2822] mt-0.5">
                    {isJa
                      ? 'シェフへ「ごちそうさま」を送って御朱印を集めよう'
                      : 'Send a Thank-You Postcard to Collect Your Stamp'}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#14532D] bg-white px-2.5 py-1 rounded-full border border-[#DCECE3] shrink-0">
                  {gratitudeNotes.length} {isJa ? '通' : 'Notes'}
                </span>
              </div>

              <button
                onClick={() =>
                  onOpenGratitude?.(
                    place,
                    'gratitude',
                    signatureDish ? [signatureDish.name_ja] : []
                  )
                }
                className="w-full h-10 px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(22,163,74,0.22)] active:scale-95 transition-all cursor-pointer"
              >
                <span>
                  {isJa
                    ? '完食御朱印を押して絵葉書を送る（ストーリーズ対応） →'
                    : 'Collect Stamp & Send Postcard to Chef →'}
                </span>
              </button>

              {/* Recent Traveler Postcards & Chef Replies */}
              {gratitudeNotes.length > 0 && (
                <div className="space-y-2 pt-1">
                  {gratitudeNotes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-[14px] bg-white p-3 border border-[#DCECE3] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#1C2822]">
                          {note.stamp_emoji} {note.sender_name}{' '}
                          <span className="text-[#526358] font-medium">
                            ({note.sender_country})
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-[#15803D] bg-[#EEF7F2] px-2 py-0.5 rounded-full">
                          {isJa ? note.stamp_title_ja : note.stamp_title_en}
                        </span>
                      </div>

                      <p className="text-xs text-[#1C2822] leading-relaxed font-medium">
                        &ldquo;{isJa ? note.message_ja_translated : note.message_original}&rdquo;
                      </p>

                      {note.owner_reply && (
                        <div className="rounded-[11px] bg-[#F2F9F5] border border-[#C5DDD0] p-2.5 mt-1">
                          <p className="text-[10px] font-extrabold text-[#15803D] mb-0.5">
                            ✓ {note.owner_reply.chef_name}{' '}
                            {isJa ? 'からの返信' : '— Reply from Chef'}
                          </p>
                          <p className="text-xs text-[#1C2822] leading-relaxed font-medium">
                            {isJa ? note.owner_reply.text_ja : note.owner_reply.text_en}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Interactive Full-Screen Japanese Point-and-Order Ticket (店員さん提示用カード) ─── */}
        <AnimatePresence>
          {selectedOrderItem && (
            <motion.div
              className="fixed inset-0 z-50 bg-[#1C2822]/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderItem(null)}
            >
              <motion.div
                className="w-full max-w-md bg-white rounded-[28px] p-5 sm:p-6 shadow-2xl border-2 border-[#16A34A] space-y-4"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#EDF5F0] pb-3">
                  <div>
                    <span className="text-[11px] font-extrabold text-[#15803D] bg-[#EEF7F2] px-3 py-1 rounded-full">
                      🗣️ お店の方へ（ご注文＆歓迎特典チケット）
                    </span>
                    {!isJa && (
                      <p className="text-[11px] font-semibold text-[#526358] mt-1">
                        Show this screen directly to the restaurant staff
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedOrderItem(null)}
                    className="size-8 rounded-full bg-[#F7FBF8] text-[#1C2822] font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Main Japanese Order Box for Staff */}
                <div className="p-4 rounded-[20px] bg-[#FAF7F0] border-2 border-[#1C2822] space-y-3">
                  <p className="text-xs font-extrabold text-[#15803D]">
                    すみません、こちらのメニューをお願いします：
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg sm:text-xl font-black text-[#1C2822] leading-snug">
                        {selectedOrderItem.name_ja}
                      </p>
                      <p className="text-xs font-bold text-[#526358]">
                        {selectedOrderItem.name_en} (¥{selectedOrderItem.price_jpy.toLocaleString()})
                      </p>
                    </div>

                    {/* Interactive Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-white rounded-full border border-[#DCECE3] px-2 py-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                        className="size-7 rounded-full bg-[#EEF7F2] text-[#1C2822] font-extrabold text-sm flex items-center justify-center active:scale-90"
                      >
                        −
                      </button>
                      <span className="text-base font-black text-[#1C2822] min-w-[2.2rem] text-center">
                        {orderQty}つ
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderQty((q) => Math.min(8, q + 1))}
                        className="size-7 rounded-full bg-[#16A34A] text-white font-extrabold text-sm flex items-center justify-center active:scale-90"
                      >
                        ＋
                      </button>
                    </div>
                  </div>

                  {/* Optional Side Dish Add-ons right inside the Ticket */}
                  {modalAddOns.length > 0 && (
                    <div className="pt-2.5 border-t border-[#E5DEC9] space-y-1.5">
                      <p className="text-[11px] font-bold text-[#526358]">
                        {isJa ? '追加メニュー（タップで一緒に注文）：' : 'Tap to add side dishes:'}
                      </p>
                      {modalAddOns.map((side) => {
                        const checked = selectedSideIds.includes(side.id);
                        return (
                          <button
                            key={side.id}
                            type="button"
                            onClick={() => toggleSideDish(side.id)}
                            className={`w-full text-left px-3 py-2 rounded-[12px] border text-xs font-bold flex items-center justify-between transition-all ${
                              checked
                                ? 'bg-[#EEF7F2] border-[#16A34A] text-[#1C2822]'
                                : 'bg-white border-[#E5DEC9] text-[#526358]'
                            }`}
                          >
                            <span>
                              {checked ? '✓ ' : '＋ '}
                              {side.name_ja} ({side.name_en})
                            </span>
                            <span>¥{side.price_jpy.toLocaleString()}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-xs font-extrabold text-[#1C2822]">
                    <span>合計目安 (Estimated Total)</span>
                    <span className="text-base text-[#15803D]">
                      ¥{totalOrderPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Welcome Perk Presentation Box */}
                <div className="p-3.5 rounded-[18px] bg-[#F2F9F5] border border-[#16A34A] space-y-1">
                  <p className="text-[11px] font-extrabold text-[#15803D]">
                    🎁 Vegan.jp 来店歓迎特典のご提示
                  </p>
                  <p className="text-xs font-bold text-[#1C2822] leading-relaxed">
                    {welcomePerk.ja}
                  </p>
                  {!isJa && (
                    <p className="text-[11px] text-[#526358] font-medium">
                      ({welcomePerk.en})
                    </p>
                  )}
                </div>

                {/* Next Step After Eating */}
                <button
                  onClick={() => {
                    const orderedNames = [
                      selectedOrderItem.name_ja,
                      ...selectedSides.map((s) => s.name_ja),
                    ];
                    setSelectedOrderItem(null);
                    onOpenGratitude?.(place, 'gratitude', orderedNames);
                  }}
                  className="w-full h-11 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>
                    {isJa
                      ? '💮 食後に「完食御朱印＆ごちそうさま絵葉書」を発行する →'
                      : '💮 Finished Eating? Collect Stamp & Send Postcard →'}
                  </span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </AnimatePresence>
  );
}
