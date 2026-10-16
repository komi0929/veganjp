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
  placesLibrary = null,
  map = null,
  onClose,
  onOpenGratitude,
}: BottomSheetProps) {
  const isJa = currentLang === 'ja';
  const t = TRANSLATIONS[currentLang];

  const [saved, setSaved] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<MenuItem | null>(null);

  const googleDetails = useGooglePlaceDetails(place);

  useEffect(() => {
    setSaved(isPlaceSaved(place.google_place_id));
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

  const displayGenre = isJa ? place.genre : place.genre_en || place.genre;
  const displayArea = isJa ? place.area : place.area_en || place.area;
  const displayProfile = isJa
    ? officialStoreData?.chef_greeting_ja || place.profile_text
    : officialStoreData?.chef_greeting_en || place.profile_text_en || place.profile_text;

  const emoji =
    (place.genre && GENRE_EMOJIS[place.genre]) ||
    (place.genre_en && GENRE_EMOJIS[place.genre_en]) ||
    '🌱';

  const heroImageUrl =
    googleDetails.photos[0] ||
    place.posts?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=900&q=80';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name_ja || place.name} ${place.area || ''}`
  )}`;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={place.name}
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center pointer-events-none"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      >
        <div className="pointer-events-auto w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl border-t border-black/[0.08] max-h-[88vh] flex flex-col overflow-hidden">
          {/* Drag Handle & Top Close Bar */}
          <div className="px-4 pt-2.5 pb-2 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{emoji}</span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {isJa ? place.name_ja || place.name : place.name}
                  </h2>
                  {officialStoreData?.verification_cert?.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      ✓ {isJa ? '公式オーナー歓迎店' : 'Verified Owner'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-500">
                  📍 {displayArea} • {displayGenre}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleSave}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  saved
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {saved ? '❤️' : '🤍'}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ─── Single Seamless Scroll Content (Zero Tab Confusion!) ─── */}
          <div className="overflow-y-auto px-4 sm:px-5 py-4 space-y-5">
            {/* 1. Store Hero & Chef's Story */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm">
              <div className="relative h-36 sm:h-44 w-full overflow-hidden">
                <img
                  src={heroImageUrl}
                  alt={place.name}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-3 inset-x-3.5 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      ✨ {isJa ? 'シェフの想い・ストーリー' : "Chef's Culinary Story"}
                    </span>
                    {officialStoreData?.verification_cert?.certificate_id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                        🛡️ {officialStoreData.verification_cert.certificate_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white/95 leading-relaxed line-clamp-3">
                    {displayProfile}
                  </p>
                </div>
              </div>

              {/* Quick Navigation Bar */}
              <div className="bg-slate-900 px-3.5 py-2.5 flex items-center justify-between gap-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <span>🗺️</span>
                    <span>{isJa ? '現在地からナビ' : 'Directions'}</span>
                  </a>
                  {place.instagram_url && (
                    <a
                      href={place.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <span>📸</span>
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
                <Link
                  href="/partner"
                  className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                >
                  {isJa ? '🏪 店舗オーナー画面' : '🏪 Store Owner'}
                </Link>
              </div>
            </div>

            {/* 2. 👑 PILLAR 1: Chef's Signature Dish & Welcome Perk (来店動機＆注文) */}
            {signatureDish && (
              <div className="rounded-3xl bg-gradient-to-br from-amber-50/95 via-orange-50/50 to-white border-2 border-amber-300/90 p-4 sm:p-5 shadow-md space-y-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-2xs">
                    <span>👑</span>
                    <span>
                      {isJa
                        ? 'ここに来たら絶対これ！看板の一皿'
                        : "Chef's #1 Must-Try Signature Dish"}
                    </span>
                  </span>
                  <span className="text-base font-black text-slate-900 bg-white px-3 py-0.5 rounded-full border border-amber-200">
                    ¥{signatureDish.price_jpy.toLocaleString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {isJa ? signatureDish.name_ja : signatureDish.name_en}
                  </h3>
                  {!isJa && (
                    <p className="text-xs font-bold text-amber-900 mt-0.5">
                      {signatureDish.name_ja}
                    </p>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed mt-1.5">
                    {isJa ? signatureDish.description_ja : signatureDish.description_en}
                  </p>
                </div>

                {/* Special Welcome Perk Box (Boosts Store Visits!) */}
                <div className="rounded-2xl bg-emerald-950 text-white p-3.5 border border-emerald-700 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {isJa ? 'Vegan.jp 来店歓迎特典（お店からのプレゼント）' : 'Vegan.jp Exclusive Welcome Perk'}
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">
                      {isJa ? welcomePerk.ja : welcomePerk.en}
                    </p>
                  </div>
                </div>

                {/* 1-Tap Show to Staff Button */}
                <button
                  onClick={() => setSelectedOrderItem(signatureDish)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>🗣️</span>
                  <span>
                    {isJa
                      ? '店員さんに見せて「看板の一皿＋歓迎特典」を注文する'
                      : 'Show to Staff: Order Signature Dish + Free Welcome Treat'}
                  </span>
                </button>

                {/* Optional Popular Sub-dishes */}
                {subDishes.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/70 space-y-2">
                    <p className="text-[11px] font-black text-amber-900">
                      {isJa ? '🍽️ 一緒に頼みたい人気メニュー' : '🍽️ Popular Pairings'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subDishes.map((dish) => (
                        <button
                          key={dish.id}
                          onClick={() => setSelectedOrderItem(dish)}
                          className="text-left p-2.5 rounded-xl bg-white/90 hover:bg-white border border-amber-200/80 flex items-center justify-between gap-2 cursor-pointer transition-all"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {isJa ? dish.name_ja : dish.name_en}
                            </p>
                            <p className="text-[11px] font-black text-amber-800">
                              ¥{dish.price_jpy.toLocaleString()}
                            </p>
                          </div>
                          <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-800 shrink-0">
                            {isJa ? '注文表示' : 'Order'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. 💮 PILLAR 2: Gochisosama Postcards & Culinary Stamp Rally (旅の思い出ブースト＆口コミ集客) */}
            <div className="rounded-3xl bg-[#FCF9F2] border-2 border-rose-200/90 p-4 sm:p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    💮 {isJa ? '旅の美食御朱印 ＆ ごちそうさま絵葉書' : 'Gochisosama Postcards & Trip Stamps'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                    {isJa
                      ? '食後に「ごちそうさま」を送って、旅の記念スタンプを集めよう'
                      : 'Send a Gochisosama Note & Collect Your Japan Culinary Stamp'}
                  </h3>
                </div>
                <span className="text-xs font-black text-rose-800 bg-white px-2.5 py-1 rounded-full border border-rose-200">
                  💌 {gratitudeNotes.length} {isJa ? '枚の絵葉書' : 'Postcards'}
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
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>💮</span>
                <span>
                  {isJa
                    ? 'シェフにごちそうさまを送って「御朱印スタンプ＆絵葉書」を発行する'
                    : 'Send Gochisosama & Stamp Your Trip Passport'}
                </span>
              </button>

              {/* Recent Traveler Postcards & Chef Replies */}
              {gratitudeNotes.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  {gratitudeNotes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl bg-white p-3.5 border border-amber-200/80 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900">
                          {note.stamp_emoji} {note.sender_name}{' '}
                          <span className="text-slate-500 font-semibold">({note.sender_country})</span>
                        </span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          💮 {isJa ? note.stamp_title_ja : note.stamp_title_en}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        &ldquo;{isJa ? note.message_ja_translated : note.message_original}&rdquo;
                      </p>

                      {note.owner_reply && (
                        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 p-2.5 mt-1.5">
                          <p className="text-[10px] font-black text-emerald-900 mb-0.5">
                            👨‍🍳 {note.owner_reply.chef_name}{' '}
                            {isJa ? 'からの直筆返信' : '— Reply from Chef'}
                          </p>
                          <p className="text-xs text-emerald-950 leading-relaxed">
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

        {/* ─── Full-Screen Japanese Order & Welcome Perk Card (店員さん提示カード) ─── */}
        <AnimatePresence>
          {selectedOrderItem && (
            <motion.div
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderItem(null)}
            >
              <motion.div
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-400 space-y-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                    🗣️ お店の方へ（ご注文＆来店特典カード）
                  </span>
                  <button
                    onClick={() => setSelectedOrderItem(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-1.5">
                  <p className="text-xs font-bold text-amber-800">
                    こちらの看板メニューを1つお願いします：
                  </p>
                  <p className="text-xl font-black text-slate-950 leading-snug">
                    {selectedOrderItem.name_ja}
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    {selectedOrderItem.name_en}（¥{selectedOrderItem.price_jpy.toLocaleString()}）
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950 text-white border border-emerald-700 space-y-1">
                  <p className="text-[11px] font-black text-emerald-300">
                    🎁 Vegan.jp 画面提示の歓迎特典
                  </p>
                  <p className="text-xs font-bold leading-relaxed">
                    {welcomePerk.ja}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedOrderItem(null);
                    onOpenGratitude?.(place, 'gratitude', [selectedOrderItem.name_ja]);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  💮 食後に「ごちそうさま＆御朱印スタンプ」を押す
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
