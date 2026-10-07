'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { showToast } from './Toast';

export interface GratitudeMessage {
  id: string;
  placeId: string;
  placeName: string;
  stamp: 'saved_trip' | 'delicious' | 'hospitality' | 'peace_of_mind';
  stampEmoji: string;
  stampTitleEn: string;
  stampTitleJa: string;
  senderName: string;
  senderCountry: string;
  customNote?: string;
  createdAt: string;
}

const STAMPS = [
  {
    id: 'saved_trip' as const,
    emoji: '💚',
    titleEn: 'You Saved My Trip!',
    titleJa: '日本旅行の救世主です！',
    descEn: 'Finding safe, delicious vegan food here relieved all my travel anxiety.',
    descJa: '出汁の不安を抱える旅行者にとって、本当に心強い味方でした。',
  },
  {
    id: 'delicious' as const,
    emoji: '🍜',
    titleEn: 'Mind-Blowing Delicious!',
    titleJa: '感動の美味しさ！',
    descEn: 'One of the most memorable plant-based meals of my life.',
    descJa: '世界中で食べたヴィーガン料理の中でも屈指の美味しさでした。',
  },
  {
    id: 'hospitality' as const,
    emoji: '🌸',
    titleEn: 'Warm Hospitality',
    titleJa: '温かいおもてなしに感動',
    descEn: 'The chef and staff were so welcoming and accommodating.',
    descJa: '店員さんの温かい気配りと対応に心が温まりました。',
  },
  {
    id: 'peace_of_mind' as const,
    emoji: '🛡️',
    titleEn: '100% Peace of Mind',
    titleJa: '安心して食べられました',
    descEn: 'I could relax and enjoy every single bite without worrying about dashi.',
    descJa: 'かつお節や動物性の心配をせず、心から寛いで食事を楽しめました。',
  },
];

const POPULAR_COUNTRIES = [
  'Australia 🇦🇺',
  'United States 🇺🇸',
  'United Kingdom 🇬🇧',
  'Germany 🇩🇪',
  'France 🇫🇷',
  'Canada 🇨🇦',
  'Taiwan 🇹🇼',
  'Singapore 🇸🇬',
  'Netherlands 🇳🇱',
  'Spain 🇪🇸',
  'Italy 🇮🇹',
  'Other / Global 🌏',
];

interface GratitudeModalProps {
  isOpen: boolean;
  place: PlaceWithPosts;
  initialMode?: 'gratitude' | 'update';
  onClose: () => void;
}

export default function GratitudeModal({
  isOpen,
  place,
  initialMode = 'gratitude',
  onClose,
}: GratitudeModalProps) {
  const [activeTab, setActiveTab] = useState<'gratitude' | 'update'>(initialMode);
  
  // Gratitude form states
  const [selectedStamp, setSelectedStamp] = useState<typeof STAMPS[number]['id']>('saved_trip');
  const [senderName, setSenderName] = useState('');
  const [senderCountry, setSenderCountry] = useState('Australia 🇦🇺');
  const [customNote, setCustomNote] = useState('');
  
  // Update form states
  const [updateType, setUpdateType] = useState('verified');
  const [updateDetails, setUpdateDetails] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentStampObj = STAMPS.find((s) => s.id === selectedStamp) || STAMPS[0];

  const handleSendGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newGratitude: GratitudeMessage = {
      id: Math.random().toString(36).substring(2, 9),
      placeId: place.google_place_id,
      placeName: place.name,
      stamp: selectedStamp,
      stampEmoji: currentStampObj.emoji,
      stampTitleEn: currentStampObj.titleEn,
      stampTitleJa: currentStampObj.titleJa,
      senderName: senderName.trim() || 'A Grateful Traveler',
      senderCountry,
      customNote: customNote.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const stored = JSON.parse(localStorage.getItem('vegan_jp_gratitude_notes') || '[]');
      stored.unshift(newGratitude);
      localStorage.setItem('vegan_jp_gratitude_notes', JSON.stringify(stored));

      // Trigger custom event so BottomSheet updates cheer count immediately
      window.dispatchEvent(new CustomEvent('vegan_jp_gratitude_added', { detail: newGratitude }));
    } catch (err) {
      // fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      showToast('Gratitude note sent! The kitchen will feel your love.', '💌');
    }, 400);
  };

  const handleSendUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const storedReports = JSON.parse(localStorage.getItem('vegan_jp_reports') || '[]');
      storedReports.unshift({
        placeId: place.google_place_id,
        placeName: place.name,
        type: updateType,
        details: updateDetails,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vegan_jp_reports', JSON.stringify(storedReports));
    } catch (err) {
      // fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      showToast('Thank you for helping keep this spot accurate for everyone!', '🌱');
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
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
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                  Community Love & Care 💚
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-tight truncate max-w-[280px] sm:max-w-md">
                {place.name}
              </h3>
              {place.name_ja && (
                <p className="text-xs text-slate-500 font-medium">{place.name_ja}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-4 pt-2 bg-slate-100/70 shrink-0 gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('gratitude');
                setIsSuccess(false);
              }}
              className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'gratitude'
                  ? 'bg-white text-rose-800 border-rose-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <span>💌</span>
              <span>Send Love & Gratitude (感謝を届ける)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('update');
                setIsSuccess(false);
              }}
              className={`px-3 py-2 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'update'
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <span>✏️</span>
              <span>Suggest Info Update (情報更新)</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {activeTab === 'gratitude' ? (
              !isSuccess ? (
                <form onSubmit={handleSendGratitude} className="space-y-4">
                  {/* Heartfelt intro */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950 space-y-1 leading-relaxed">
                    <p className="font-bold text-xs flex items-center gap-1 text-rose-900">
                      <span>✨</span>
                      <span>Tell the kitchen how much their food meant to you!</span>
                    </p>
                    <p className="text-[11px] text-rose-900/90">
                      Japanese chefs and staff work hard to prepare safe plant-based meals. Your message will be formatted with warm Japanese translations so local staff can read and feel your gratitude!
                    </p>
                  </div>

                  {/* Stamp Selector */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block">
                      Choose Your Gratitude Stamp (気持ちを伝えるスタンプ)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STAMPS.map((s) => {
                        const isSelected = selectedStamp === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStamp(s.id)}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="text-xl mb-1">{s.emoji}</div>
                            <div className="font-bold text-xs text-slate-900">{s.titleEn}</div>
                            <div className="text-[10px] text-rose-800 font-medium">{s.titleJa}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Traveler Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Your Name / Nickname
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="e.g. Emma & Liam"
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Where are you traveling from?
                      </label>
                      <select
                        value={senderCountry}
                        onChange={(e) => setSenderCountry(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500 text-xs bg-white"
                      >
                        {POPULAR_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Personal Note */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Personal Message to the Team (Optional)
                    </label>
                    <textarea
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. The spicy ramen was incredible, thank you for being so welcoming to vegans!"
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500 text-xs"
                    />
                  </div>

                  {/* Digital Card Preview */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-1.5 font-sans">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Card Preview for Kitchen Staff / お店への表示プレビュー
                    </span>
                    <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{currentStampObj.emoji}</span>
                        <span>{currentStampObj.titleJa}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">
                        &quot;{currentStampObj.descJa}&quot;
                      </p>
                      {customNote && (
                        <p className="text-[11px] text-slate-800 pt-1 font-medium border-t border-slate-100">
                          &quot;{customNote}&quot;
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 text-right pt-1 font-semibold">
                        — {senderName.trim() || 'A Grateful Traveler'} ({senderCountry})
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>💌</span>
                      <span>Send Love to Kitchen</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <span className="text-5xl block animate-bounce">💌</span>
                  <h4 className="text-base font-bold text-slate-900">
                    Thank You! Your Note Has Been Sent!
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Your words of encouragement help restaurants in Japan understand how meaningful their plant-based options are. Thank you for spreading positive vibes!
                  </p>
                  <div className="pt-4 flex justify-center gap-2">
                    <button
                      onClick={onClose}
                      className="bg-slate-900 text-white font-bold px-6 py-2 rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      Back to Map 🗺️
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Tab 2: Suggest Info Update */
              <form onSubmit={handleSendUpdate} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 space-y-1 leading-relaxed">
                  <p className="font-bold text-xs flex items-center gap-1 text-emerald-900">
                    <span>🌱</span>
                    <span>Help Keep This Spot Accurate & Fresh</span>
                  </p>
                  <p className="text-[11px] text-emerald-900/90">
                    Did you notice any changes during your visit? Your update helps the whole community travel with confidence.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">
                    What would you like to update?
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUpdateType('verified')}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        updateType === 'verified'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-base mb-0.5">👍</span>
                      Visited & Verified Open
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpdateType('hours_menu')}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        updateType === 'hours_menu'
                          ? 'bg-amber-50 border-amber-500 text-amber-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-base mb-0.5">🕒</span>
                      Hours / Menu Changed
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpdateType('new_vegan_option')}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        updateType === 'new_vegan_option'
                          ? 'bg-purple-50 border-purple-500 text-purple-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-base mb-0.5">✨</span>
                      New Vegan Menu Added!
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpdateType('closed')}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                        updateType === 'closed'
                          ? 'bg-rose-50 border-rose-500 text-rose-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-base mb-0.5">🚪</span>
                      Permanently Closed
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Details / Additional Notes
                  </label>
                  <textarea
                    value={updateDetails}
                    onChange={(e) => setUpdateDetails(e.target.value)}
                    rows={3}
                    placeholder="e.g. Closed on Tuesdays, now serves gluten-free noodles, English menu available at register..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Submit Update 🚀</span>
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
