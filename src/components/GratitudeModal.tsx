'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts, StoreOfficialData } from '@/lib/types';
import type { SupportedLanguage } from '@/lib/i18n';
import { getEffectiveVerifiedMenu, getEffectiveWelcomePerk } from '@/lib/kitchen-defaults';
import { addTripStamp, TripStampRecord } from '@/lib/trip-stamps';
import { downloadInstagramStoryCardPng } from '@/lib/story-card-generator';
import { showToast } from './Toast';

const STAMPS = [
  {
    id: 'delicious' as const,
    emoji: '🍽️',
    titleEn: 'Unforgettable Signature Dish!',
    titleJa: '忘れられない看板の一皿！',
    descEn: 'This dish became the absolute culinary highlight of my trip to Japan.',
    descJa: 'このお店でしか味わえない感動の美味しさでした！',
  },
  {
    id: 'hospitality' as const,
    emoji: '🌸',
    titleEn: 'Warm Hospitality & Best Memory',
    titleJa: '最高の旅の思い出＆おもてなし',
    descEn: 'The chef and staff made us feel so welcome in Japan.',
    descJa: 'シェフとスタッフの温かい笑顔で、日本がもっと好きになりました。',
  },
  {
    id: 'saved_trip' as const,
    emoji: '💎',
    titleEn: 'Must-Visit Hidden Gem!',
    titleJa: '仲間に教えたい最高の名店！',
    descEn: 'I want to recommend this special restaurant to all my friends.',
    descJa: '次に日本へ来る友人全員にこのお店をおすすめします！',
  },
];

const POPULAR_COUNTRIES = [
  'Australia 🇦🇺',
  'United States 🇺🇸',
  'United Kingdom 🇬🇧',
  'France 🇫🇷',
  'Taiwan 🇹🇼',
  'South Korea 🇰🇷',
  'Spain 🇪🇸',
  'Germany 🇩🇪',
  'Canada 🇨🇦',
  'Japan 🇯🇵',
];

interface GratitudeModalProps {
  isOpen: boolean;
  place: PlaceWithPosts;
  currentLang?: SupportedLanguage;
  officialStoreData?: StoreOfficialData | null;
  preselectedDishes?: string[];
  initialMode?: 'gratitude' | 'update';
  onClose: () => void;
  onSuccessRefresh?: () => void;
}

export default function GratitudeModal({
  isOpen,
  place,
  currentLang = 'en',
  officialStoreData,
  preselectedDishes = [],
  onClose,
  onSuccessRefresh,
}: GratitudeModalProps) {
  const isJa = currentLang === 'ja';
  const [selectedStamp, setSelectedStamp] =
    useState<typeof STAMPS[number]['id']>('delicious');
  const [senderName, setSenderName] = useState('');
  const [senderCountry, setSenderCountry] = useState(
    isJa ? 'Japan 🇯🇵' : 'Australia 🇦🇺'
  );
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedStamp, setIssuedStamp] = useState<TripStampRecord | null>(null);

  const verifiedMenu = useMemo(
    () => getEffectiveVerifiedMenu(place, officialStoreData),
    [place, officialStoreData]
  );

  const welcomePerk = useMemo(
    () => getEffectiveWelcomePerk(place, officialStoreData),
    [place, officialStoreData]
  );

  const signatureDishJa =
    verifiedMenu[0]?.name_ja || preselectedDishes[0] || 'シェフの看板メニュー';
  const signatureDishDisplay = isJa
    ? signatureDishJa
    : verifiedMenu[0]?.name_en || signatureDishJa;

  const igHandle = place.instagram_id
    ? `@${place.instagram_id}`
    : `@${place.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  if (!isOpen) return null;

  const currentStampObj =
    STAMPS.find((s) => s.id === selectedStamp) || STAMPS[0];

  const handleSendGratitude = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_gratitude',
          place_id: place.google_place_id,
          place_name: place.name,
          stamp: selectedStamp,
          stamp_emoji: currentStampObj.emoji,
          stamp_title_en: currentStampObj.titleEn,
          stamp_title_ja: currentStampObj.titleJa,
          sender_name: senderName.trim() || 'Traveler',
          sender_country: senderCountry,
          message_original:
            customNote.trim() ||
            `${isJa ? currentStampObj.descJa : currentStampObj.descEn} (${signatureDishDisplay})`,
          ordered_dishes: [signatureDishJa],
        }),
      });

      const data = await res.json();
      if (data.ok) {
        window.dispatchEvent(new CustomEvent('vegan_jp_ecosystem_updated'));
        onSuccessRefresh?.();
      }
    } catch {
      // Offline / local fallback
    } finally {
      const stampRec = addTripStamp({
        place_id: place.google_place_id,
        place_name: isJa ? place.name_ja || place.name : place.name,
        area: isJa ? place.area || 'Japan' : place.area_en || place.area || 'Japan',
        signature_dish: signatureDishDisplay,
        stamp_emoji: currentStampObj.emoji,
        stamp_title_ja: currentStampObj.titleJa,
        stamp_title_en: currentStampObj.titleEn,
        message:
          customNote.trim() ||
          (isJa ? currentStampObj.descJa : currentStampObj.descEn),
        sender_name: senderName.trim() || 'Traveler',
      });
      setIssuedStamp(stampRec);
      setIsSubmitting(false);
      showToast(
        isJa
          ? '💮 完食御朱印スタンプ＆絵葉書が発行されました！'
          : '💮 Culinary Stamp Collected & Postcard Sent to Chef!',
        '💮'
      );
    }
  };

  const handleDownloadStoryCard = async () => {
    if (!issuedStamp) return;
    await downloadInstagramStoryCardPng({
      storeName: place.name_ja || place.name,
      area: place.area || 'Japan',
      signatureDish: `${signatureDishJa}`,
      welcomePerk: welcomePerk.ja,
      quote: issuedStamp.message,
      senderName: `${issuedStamp.sender_name} (${senderCountry})`,
      instagramHandle: igHandle,
      sealCode: issuedStamp.seal_code,
    });
    try {
      await navigator.clipboard.writeText(
        `💮 ごちそうさまでした！ ${igHandle} @vegan.jp\n🍽️ ${signatureDishDisplay}\nhttps://vegan.jp/?store=${encodeURIComponent(place.google_place_id)}\n#VeganJapan #TokyoVegan`
      );
    } catch {}
    showToast(
      isJa
        ? '📸 9:16 ストーリーズ画像を保存＆紹介文をコピーしました！'
        : '📸 Saved 9:16 Story PNG & Copied Mention Caption!',
      '📸'
    );
  };

  const handleSharePostcard = async () => {
    const shareUrl = `${window.location.origin}/?store=${encodeURIComponent(
      place.google_place_id
    )}`;
    const shareText = `💮 ごちそうさまでした！ @ ${place.name} ${igHandle} @vegan.jp\n🍽️ ${signatureDishDisplay}\n"${
      customNote.trim() || (isJa ? currentStampObj.titleJa : currentStampObj.titleEn)
    }"`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${place.name} — Vegan.jp`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        showToast(
          isJa
            ? '絵葉書リンク＆メンション文をコピーしました！'
            : 'Copied Postcard Link & Mention!',
          '✨'
        );
      }
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-[#1C2822]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg nani-well overflow-hidden flex flex-col max-h-[92vh]"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Well Bar */}
          <div className="px-3.5 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#16A34A]" />
              <span>
                {isJa
                  ? '完食御朱印 ＆ ごちそうさま絵葉書'
                  : 'Collect Culinary Stamp & Send Postcard'}
              </span>
            </span>
            <button
              onClick={onClose}
              className="size-7 rounded-full bg-white/80 hover:bg-white text-[#1C2822] flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Inner White Sheet */}
          <div className="nani-sheet p-5 overflow-y-auto space-y-4">
            {issuedStamp ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Authentic Japanese Washi Postcard with Vermilion Stamp */}
                <div className="relative rounded-[22px] bg-[#FAF7F0] border-2 border-[#1C2822] p-5 shadow-md overflow-hidden">
                  <motion.div
                    initial={{ scale: 2, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="absolute top-4 right-4 size-20 rounded-full border-[3px] border-[#DC2626] bg-white/90 flex flex-col items-center justify-center text-[#DC2626] shadow-xs select-none"
                  >
                    <span className="text-[8px] font-black tracking-widest uppercase">
                      VEGAN.JP
                    </span>
                    <span className="text-xs font-black leading-tight my-0.5">
                      完食御朱印
                    </span>
                    <span className="text-[8px] font-bold">
                      {new Date().toLocaleDateString('ja-JP')}
                    </span>
                  </motion.div>

                  <div className="pr-22">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#15803D] bg-[#EEF7F2] px-2.5 py-0.5 rounded-full mb-1">
                      STAMP #{issuedStamp.seal_code}
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-[#1C2822] leading-snug">
                      {issuedStamp.place_name}
                    </h4>
                    <p className="text-xs font-bold text-[#526358] mt-0.5">
                      {issuedStamp.area} • {igHandle}
                    </p>
                  </div>

                  <div className="mt-3.5 p-3 rounded-[14px] bg-white border border-[#E5DEC9]">
                    <p className="text-[10px] font-extrabold text-[#15803D]">
                      {isJa ? '完食した看板の一皿' : 'Signature Dish Enjoyed'}
                    </p>
                    <p className="text-xs font-bold text-[#1C2822] mt-0.5">
                      {issuedStamp.signature_dish}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dashed border-[#D5CCB4]">
                    <p className="text-xs text-[#1C2822] font-medium leading-relaxed">
                      &ldquo;{issuedStamp.message}&rdquo;
                    </p>
                    <p className="text-[11px] font-bold text-[#526358] mt-1.5 text-right">
                      — {issuedStamp.sender_name} ({senderCountry})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSharePostcard}
                    className="h-11 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-[#1C2822] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>
                      {isJa ? 'リンク＆メンションをコピー' : 'Copy Link & Mention'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadStoryCard}
                    className="h-11 px-5 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs flex items-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all cursor-pointer"
                  >
                    <span>
                      {isJa
                        ? 'Instagramストーリーズ画像 (9:16) を保存 ↓'
                        : 'Save 9:16 Instagram Story PNG ↓'}
                    </span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSendGratitude} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#1C2822]">
                    {isJa ? place.name_ja || place.name : place.name}
                  </h3>
                  <p className="text-xs text-[#526358] mt-0.5 font-medium">
                    {isJa
                      ? '感謝の絵葉書をシェフへ届けると、このお店だけの「完食御朱印」と9:16ストーリーズ画像が発行されます。'
                      : 'Your message is automatically translated into Japanese for the chef, unlocking your restaurant stamp & 9:16 Story card.'}
                  </p>
                </div>

                {/* 1. Choose Stamp */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#526358]">
                    {isJa ? '1. 今日のスタンプを選ぶ' : '1. Choose Your Stamp'}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {STAMPS.map((s) => {
                      const active = selectedStamp === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStamp(s.id)}
                          className={`p-3 rounded-[14px] border text-left flex items-center gap-3 transition-all active:scale-98 cursor-pointer ${
                            active
                              ? 'border-[#16A34A] bg-[#F2F9F5]'
                              : 'border-[#DCECE3] bg-white hover:bg-[#F7FBF8]'
                          }`}
                        >
                          <span className="text-xl shrink-0">{s.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-[#1C2822]">
                              {isJa ? s.titleJa : s.titleEn}
                            </p>
                            <p className="text-[11px] text-[#526358] truncate">
                              {isJa ? s.descJa : s.descEn}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Name & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#526358] mb-1">
                      {isJa ? 'お名前 / ニックネーム' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={isJa ? '例: Maya' : 'e.g. Maya'}
                      className="w-full h-10 px-3 rounded-[12px] bg-[#F7FBF8] border border-[#DCECE3] text-xs font-bold text-[#1C2822] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#526358] mb-1">
                      {isJa ? '国・地域' : 'From Country'}
                    </label>
                    <select
                      value={senderCountry}
                      onChange={(e) => setSenderCountry(e.target.value)}
                      className="w-full h-10 px-3 rounded-[12px] bg-[#F7FBF8] border border-[#DCECE3] text-xs font-bold text-[#1C2822] outline-none focus:border-[#16A34A]"
                    >
                      {POPULAR_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Short Message */}
                <div>
                  <label className="block text-[11px] font-bold text-[#526358] mb-1">
                    {isJa
                      ? 'シェフへのひとこと（任意）'
                      : 'Message to the Chef (Auto-translated to Japanese)'}
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder={
                      isJa
                        ? '例: 最高に美味しかったです！また必ず来ます！'
                        : 'e.g. Best vegan meal in Tokyo! Arigato gozaimasu!'
                    }
                    className="w-full p-3 rounded-[12px] bg-[#F7FBF8] border border-[#DCECE3] text-xs font-medium text-[#1C2822] outline-none focus:border-[#16A34A] resize-none"
                  />
                </div>

                <div className="pt-1 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-full border border-[#DCECE3] text-xs font-bold text-[#526358] hover:text-[#1C2822]"
                  >
                    {isJa ? 'キャンセル' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm shadow-[0_6px_18px_rgba(22,163,74,0.25)] active:scale-95 transition-all cursor-pointer"
                  >
                    {isSubmitting
                      ? isJa ? '御朱印を発行中...' : 'Stamping...'
                      : isJa ? '💮 ごちそうさま絵葉書を送って御朱印を押す' : '💮 Send Postcard & Collect Stamp'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
