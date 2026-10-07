'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { isMyPost } from '@/lib/local-posts';
import { isPlaceSaved, toggleSavePlaceId } from '@/lib/saved-places';
import { showToast } from './Toast';

interface BottomSheetProps {
  place: PlaceWithPosts;
  onClose: () => void;
  onOpenUpload?: (place: PlaceWithPosts) => void;
  onOpenToolkit?: (tab?: 'passport' | 'why_us' | 'konbini' | 'phrases') => void;
  onOpenReport?: (place: PlaceWithPosts) => void;
  onOpenB2B?: (place: PlaceWithPosts) => void;
  onOpenPerk?: () => void;
}

const GENRE_EMOJIS: Record<string, string> = {
  'ラーメン': '🍜',
  'Ramen': '🍜',
  'カフェ': '☕',
  'Cafe & Bakery': '☕',
  'Cafe & Sweets': '☕',
  'Cafe & Craft Ice Cream': '🍨',
  '和食・精進': '🍱',
  'Traditional / Shojin Washoku': '🍱',
  'Traditional Shojin & Washoku': '🍱',
  'バーガー': '🍔',
  'Burgers & Casual Dining': '🍔',
  'Burgers & Casual': '🍔',
  'カレー': '🍛',
  'Curry & Spice': '🍛',
  'イタリアン・ピザ': '🍕',
  'Pizza & Italian': '🍕',
  '中華・台湾素食': '🥟',
  'Asian & Dim Sum': '🥟',
  'マクロビ・オーガニック': '🥗',
  'Macrobiotic & Organic': '🥗',
  'ホテル': '🏨',
  'Hotel & Fine Dining': '🏨',
  '居酒屋・バー': '🍶',
  'Izakaya & Bar': '🍶',
  'レストラン': '🌿',
  'Plant-Based Bistro': '🌿',
};

export default function BottomSheet({
  place,
  onClose,
  onOpenUpload,
  onOpenToolkit,
  onOpenReport,
  onOpenB2B,
  onOpenPerk,
}: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    setIsSaved(isPlaceSaved(place.google_place_id));
  }, [place.google_place_id]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePhoto) {
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
  }, [activePhoto, isExpanded, onClose]);

  const handleToggleSave = () => {
    const next = toggleSavePlaceId(place.google_place_id);
    setIsSaved(next);
    showToast(next ? `Saved ${place.name} to Wishlist` : 'Removed from Wishlist', next ? '❤️' : '🤍');
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?place=${encodeURIComponent(place.google_place_id)}`;
    const shareData = {
      title: `${place.name} — vegan.jp`,
      text: `Found verified plant-based food at ${place.name} in Japan! Check it out:`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback silently
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', '📋');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.name + ' ' + (place.prefecture || '') + ' ' + (place.area || '')
  )}&query_place_id=${place.google_place_id}`;

  const heroImage = place.posts[0]?.image_url;
  const genreEmoji = (place.genre && GENRE_EMOJIS[place.genre]) || '🌱';
  const is100Vegan = place.dietary_type === '100%_vegan' || (!place.dietary_type && place.features?.some(f => f.includes('100%植物性') || f.includes('全メニューヴィーガン')));

  return (
    <>
      <AnimatePresence>
        {/* Dimmed Backdrop - ONLY visible in expanded mode */}
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40"
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
            className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] z-40 bg-white/95 backdrop-blur-2xl rounded-3xl p-3 sm:p-3.5 shadow-glass-xl border border-black/[0.08] cursor-pointer group"
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center gap-3">
              {/* Thumbnail Hero or Genre Icon */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-emerald-50 shrink-0 border border-black/[0.04] flex items-center justify-center">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-3xl select-none">{genreEmoji}</span>
                )}
                {place.posts.length > 0 && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-slate-900/85 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                    {place.posts.length}
                  </span>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    is100Vegan
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200/60'
                      : 'text-amber-800 bg-amber-50 border-amber-200/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${is100Vegan ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {is100Vegan ? '🌱 100% Vegan Dedicated' : '🥗 Vegan Options Available'}
                  </span>
                  {(place.genre_en || place.genre) && (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {place.genre_en || place.genre}
                    </span>
                  )}
                  {(place.area_en || place.area) && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      📍 {place.area_en || place.area}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  {place.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                  <span>View details & photos</span>
                  <span className="text-emerald-600 font-semibold">↑</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Wishlist Button */}
                <button
                  onClick={handleToggleSave}
                  className={`p-2.5 rounded-full transition-colors ${
                    isSaved
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title={isSaved ? 'Saved in Wishlist' : 'Save to Wishlist'}
                  aria-label="Wishlist toggle"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Share place"
                  aria-label="Share spot"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>

                {/* Directions Button */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors"
                  title="Directions in Google Maps"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>

                {/* Dismiss */}
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Stage 2: Expanded Full Discovery Sheet ─── */
          <motion.div
            key="expanded-sheet"
            className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-3xl rounded-t-[36px] max-h-[88vh] flex flex-col shadow-2xl border-t border-black/[0.06] pb-[env(safe-area-inset-bottom,0px)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) {
                setIsExpanded(false);
              }
            }}
          >
            {/* Tactile Grab Indicator */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onClick={() => setIsExpanded(false)}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors" />
            </div>

            {/* Place Header Block */}
            <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-black/[0.04]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    is100Vegan
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200/60'
                      : 'text-amber-800 bg-amber-50 border-amber-200/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${is100Vegan ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {is100Vegan ? '🌱 100% VEGAN (Dedicated Animal-Free)' : '🥗 VEGAN OPTIONS (Serves Meat/Fish)'}
                  </span>
                  {(place.genre_en || place.genre) && (
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {genreEmoji} {place.genre_en || place.genre}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-medium">
                    📍 {place.area_en || place.area || place.prefecture_en || place.prefecture}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {place.name}
                </h2>
                {place.name_ja && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">🇯🇵 {place.name_ja}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(place.name_ja || '');
                        showToast('Copied Japanese name for staff/taxi!', '📋');
                      }}
                      className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy Japanese name to show to staff or taxi"
                    >
                      <span>Copy for Staff / Taxi</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {/* Wishlist Button */}
                <button
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
                    isSaved
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-100 border-slate-200/80 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{isSaved ? 'Saved' : 'Wishlist'}</span>
                </button>

                {/* Instagram Button */}
                {place.instagram_url && (
                  <a
                    href={place.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-700 border border-pink-200 hover:bg-pink-100/40 transition-colors"
                  >
                    <span>📷</span>
                    <span>{place.instagram_id || 'Instagram'}</span>
                  </a>
                )}

                {/* Google Maps Directions */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  title="Directions in Google Maps"
                >
                  <span>Directions</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>

                {/* Collapse */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  aria-label="Collapse"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 bg-slate-50/50 space-y-6">
              {/* Feature Tags & Profile Block */}
              <div className="bg-white rounded-3xl p-5 border border-black/[0.06] shadow-xs max-w-3xl mx-auto">
                {/* Dietary Advisory Banner */}
                <div className={`p-4 rounded-2xl border mb-4 ${
                  is100Vegan
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200/80 text-amber-950'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">{is100Vegan ? '🌱' : '⚠️'}</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {is100Vegan ? '100% Plant-Based Guarantee' : 'Mixed Kitchen Advisory'}
                      </h4>
                      <p className="text-xs mt-0.5 leading-relaxed">
                        {is100Vegan
                          ? 'All dishes and ingredients are 100% plant-based. Free from meat, poultry, seafood, fish-flake dashi broth, dairy, and eggs.'
                          : 'This restaurant prepares meat or fish dishes. Vegan items are prepared to order or offered as a dedicated set. Please inform staff of dietary requirements.'}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {is100Vegan ? (
                          <button
                            onClick={() => onOpenToolkit?.('why_us')}
                            className="text-[11px] font-bold text-emerald-800 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>🛡️ Pre-Audited (No Dashi Trap)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenToolkit?.('passport')}
                            className="text-[11px] font-bold text-amber-900 bg-white/90 hover:bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>🗣️ Show Chef Card for Dashi-Free Order</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {(place.features_en || place.features) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(place.features_en || place.features)!.map((feat, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/70"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                )}
                {(place.profile_text_en || place.profile_text) && (
                  <p className="text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                    {place.profile_text_en || place.profile_text}
                  </p>
                )}

                {/* Exclusive VIP Perk Banner (For SoyStories) */}
                {place.google_place_id === 'soystories-yakuin' && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-emerald-500/10 border-2 border-amber-300 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                        Exclusive Traveler VIP Perk 🎁
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 mt-1">
                        Show vegan.jp at the counter for a Free Topping or Double-Scoop Upgrade!
                      </h5>
                    </div>
                    <button
                      onClick={onOpenPerk}
                      className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      View Perk 🎟️
                    </button>
                  </div>
                )}

                {/* Community Trustworthiness & B2B Wholesale Footer */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Verified for 2026</span>
                    <span>•</span>
                    <button
                      onClick={() => onOpenReport?.(place)}
                      className="text-slate-600 hover:text-emerald-700 font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      Report status / Suggest edit
                    </button>
                  </div>
                  <button
                    onClick={() => onOpenB2B?.(place)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    🏪 Restaurant Owners: Partner with SoyStories Wholesale
                  </button>
                </div>
              </div>

              {/* Photo Section Header */}
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">Community Photos</h4>
                  <p className="text-xs text-slate-500">
                    {place.posts.length > 0
                      ? `${place.posts.length} traveler photos shared`
                      : 'No photos uploaded yet'}
                  </p>
                </div>
                {onOpenUpload && (
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenUpload(place);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                  >
                    <span>📸 Plant a Photo</span>
                  </button>
                )}
              </div>

              {/* Photo Stream or Empty State */}
              {place.posts.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-dashed border-emerald-200 text-center max-w-3xl mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-3">
                    🌱
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    Be the first to plant a photo here!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Have you enjoyed food here? Snap a photo and help fellow travelers discover plant-based options in Japan.
                  </p>
                  {onOpenUpload && (
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        onOpenUpload(place);
                      }}
                      className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                    >
                      <span>📸 Add the First Photo</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
                  {place.posts.map((post) => (
                    <motion.div
                      key={post.id}
                      className="group relative bg-white rounded-3xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-photo-card transition-all duration-300 cursor-pointer"
                      onClick={() => setActivePhoto(post.image_url)}
                      whileHover={{ y: -3 }}
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.short_text || place.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        {isMyPost(post.id) && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold bg-slate-900/85 text-white px-2.5 py-1 rounded-full backdrop-blur-md">
                            Planted by you
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        {post.short_text ? (
                          <p className="text-sm font-normal text-slate-800 leading-relaxed line-clamp-3">
                            {post.short_text}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No traveler notes attached</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                          <span>{formatDate(post.created_at)}</span>
                          <span className="text-emerald-700 font-semibold group-hover:underline">
                            Enlarge photo ↗
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox */}
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
                className="w-full h-full max-h-[85vh] object-contain rounded-2xl"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Close lightbox"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
