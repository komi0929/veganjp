'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts, StoreOfficialData } from '@/lib/types';
import { getEffectiveVerifiedMenu } from '@/lib/kitchen-defaults';
import { addTripStamp, TripStampRecord } from '@/lib/trip-stamps';
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
    titleEn: 'Best Memory & Warm Hospitality',
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
  'Germany 🇩🇪',
  'Canada 🇨🇦',
  'Singapore 🇸🇬',
  'Japan 🇯🇵',
  'Global 🌏',
];

interface GratitudeModalProps {
  isOpen: boolean;
  place: PlaceWithPosts;
  officialStoreData?: StoreOfficialData | null;
  preselectedDishes?: string[];
  initialMode?: 'gratitude' | 'update';
  onClose: () => void;
  onSuccessRefresh?: () => void;
}

export default function GratitudeModal({
  isOpen,
  place,
  officialStoreData,
  preselectedDishes = [],
  onClose,
  onSuccessRefresh,
}: GratitudeModalProps) {
  const [selectedStamp, setSelectedStamp] =
    useState<typeof STAMPS[number]['id']>('delicious');
  const [senderName, setSenderName] = useState('');
  const [senderCountry, setSenderCountry] = useState('Australia 🇦🇺');
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedStamp, setIssuedStamp] = useState<TripStampRecord | null>(null);

  const verifiedMenu = useMemo(
    () => getEffectiveVerifiedMenu(place, officialStoreData),
    [place, officialStoreData]
  );

  const signatureDish = verifiedMenu[0]?.name_ja || preselectedDishes[0] || 'シェフの看板メニュー';

  if (!isOpen) return null;

  const currentStampObj = STAMPS.find((s) => s.id === selectedStamp) || STAMPS[0];

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
          message_original: customNote.trim() || `${currentStampObj.titleEn} (${signatureDish})`,
          ordered_dishes: [signatureDish],
        }),
      });

      const data = await res.json();
      if (data.ok) {
        window.dispatchEvent(new CustomEvent('vegan_jp_ecosystem_updated'));
        onSuccessRefresh?.();
      }
    } catch (err) {
      console.error('Failed to send gratitude note:', err);
    } finally {
      const stampRec = addTripStamp({
        place_id: place.google_place_id,
        place_name: place.name,
        area: place.area || 'Japan',
        signature_dish: signatureDish,
        stamp_emoji: currentStampObj.emoji,
        stamp_title_ja: currentStampObj.titleJa,
        stamp_title_en: currentStampObj.titleEn,
        message: customNote.trim() || currentStampObj.descJa,
        sender_name: senderName.trim() || 'Traveler',
      });
      setIssuedStamp(stampRec);
      setIsSubmitting(false);
      showToast('💮 旅の美食御朱印スタンプ＆絵葉書が発行されました！', '💮');
    }
  };

  const handleSharePostcard = async () => {
    const shareUrl = `${window.location.origin}/?store=${encodeURIComponent(place.google_place_id)}`;
    const shareText = `💮 ごちそうさまでした！ @ ${place.name} (${place.area || 'Japan'})\n🍽️ 看板の一皿: ${signatureDish}\n"${customNote.trim() || currentStampObj.titleEn}"\n#VeganJP`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${place.name} — Vegan.jp`, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        showToast('絵葉書リンクをコピーしました！SNSや友人にシェアできます📲', '✨');
      }
    } catch {
      showToast('絵葉書リンクをコピーしました！📲', '✨');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden flex flex-col max-h-[92vh]"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-orange-50/60 to-rose-50 shrink-0">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-white border border-rose-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                  💮 ごちそうさま絵葉書 ＆ 旅の御朱印スタンプ
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-tight truncate max-w-[300px] sm:max-w-md">
                {place.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center cursor-pointer transition-colors border border-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {issuedStamp ? (
              /* ─── Commemorative Japanese Culinary Postcard & Goshuin Stamp View ─── */
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="relative rounded-3xl bg-[#FCF9F2] border-2 border-amber-300/90 p-5 shadow-lg overflow-hidden">
                  {/* Traditional Japanese Vermilion Seal (Goshuin Hanko) */}
                  <motion.div
                    initial={{ scale: 2.2, opacity: 0, rotate: -25 }}
                    animate={{ scale: 1, opacity: 1, rotate: -10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="absolute top-4 right-4 w-24 h-24 rounded-full border-4 border-rose-600/85 bg-rose-50/90 flex flex-col items-center justify-center text-rose-700 shadow-md select-none"
                  >
                    <span className="text-[9px] font-black tracking-widest uppercase">VEGAN.JP</span>
                    <span className="text-sm font-black leading-tight my-0.5">完食御朱印</span>
                    <span className="text-[9px] font-bold">{new Date().toLocaleDateString('ja-JP')}</span>
                  </motion.div>

                  <div className="pr-24">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-md mb-1.5">
                      JAPAN CULINARY MEMORY POSTCARD • #{issuedStamp.seal_code}
                    </span>
                    <h4 className="text-lg font-black text-slate-900 leading-snug">
                      {issuedStamp.place_name}
                    </h4>
                    <p className="text-xs font-bold text-amber-800 mt-0.5">
                      📍 {issuedStamp.area}
                    </p>
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-white/90 border border-amber-200/80">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-0.5">
                      🍽️ 味わった看板の一皿 / Signature Dish
                    </p>
                    <p className="text-xs font-black text-slate-900">
                      {issuedStamp.signature_dish}
                    </p>
                  </div>

                  <div className="mt-3 p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/70">
                    <p className="text-xs font-bold text-rose-950 leading-relaxed">
                      {issuedStamp.stamp_emoji} &ldquo;{issuedStamp.message}&rdquo;
                    </p>
                    <p className="text-[11px] font-bold text-slate-500 mt-1.5 text-right">
                      — {issuedStamp.sender_name} ({senderCountry})
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between text-[11px] text-amber-900 font-bold">
                    <span>✓ シェフへ「ごちそうさま」送信済</span>
                    <span>✓ 旅の御朱印帳に保存済</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleSharePostcard}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>📲</span>
                    <span>絵葉書をシェアして友達に紹介</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>💮</span>
                    <span>スタンプ帳に保存して閉じる</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ─── Simple 10-Second Gochisosama Form ─── */
              <form onSubmit={handleSendGratitude} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
                  <span className="text-2xl shrink-0">💮</span>
                  <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                    シェフに「ごちそうさま！」を送ると、あなたの<b>『旅の美食御朱印帳』に記念スタンプと絵葉書</b>が刻まれ、シェフから直筆返信が届きます！
                  </p>
                </div>

                {/* 1. Choose Stamp Mood */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-2">
                    1. 今日の感動スタンプを選択 / Choose Your Stamp
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {STAMPS.map((s) => {
                      const active = selectedStamp === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStamp(s.id)}
                          className={`text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                            active
                              ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-2xl shrink-0">{s.emoji}</span>
                          <div>
                            <p className="text-xs font-black text-slate-900">
                              {s.titleJa} <span className="text-slate-500 font-semibold">/ {s.titleEn}</span>
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{s.descJa}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Short Message */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    2. シェフへの一言メッセージ（英語・日本語どちらもOK）
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="例: 看板メニューの濃厚な味わいに感動しました！最高の旅の思い出をありがとう！ / Best dish of my Japan trip!"
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* 3. Name & Country */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      お名前 / Nickname
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Alex / 旅人"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      国・地域 / From
                    </label>
                    <select
                      value={senderCountry}
                      onChange={(e) => setSenderCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white"
                    >
                      {POPULAR_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>💮</span>
                  <span>
                    {isSubmitting
                      ? '御朱印スタンプ発行中...'
                      : 'ごちそうさまを送って「御朱印スタンプ」を押す'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
