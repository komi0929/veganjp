'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { isMyPost } from '@/lib/local-posts';
import { isPlaceSaved, toggleSavePlaceId } from '@/lib/saved-places';

interface BottomSheetProps {
  place: PlaceWithPosts;
  onClose: () => void;
}

/**
 * Goodpatch Knowledge Applied:
 * - Progressive Disclosure (Apple Books / WEAR semi-modal pattern):
 *   Stage 1: 'peek' mode preserves 85%+ map exploration, floating compact preview card.
 *   Stage 2: 'expanded' mode smoothly slides up full gallery and traveler dish logs.
 * - Amie-style tactile grab handle and fluid spring physics.
 * - Zero-Auth Bookmark: Save wishlist without login.
 */
export default function BottomSheet({ place, onClose }: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    setIsSaved(isPlaceSaved(place.google_place_id));
  }, [place.google_place_id]);

  const handleToggleSave = () => {
    const next = toggleSavePlaceId(place.google_place_id);
    setIsSaved(next);
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
    place.name
  )}&query_place_id=${place.google_place_id}`;

  const heroImage = place.posts[0]?.image_url;

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
          /* ─── Stage 1: Peek Preview Card (Apple Books / WEAR Style) ─── */
          <motion.div
            key="peek-card"
            className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] z-40 bg-white/95 backdrop-blur-2xl rounded-3xl p-3 sm:p-3.5 shadow-glass-xl border border-black/[0.08] cursor-pointer group"
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center gap-3.5">
              {/* Thumbnail Hero */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-black/[0.04]">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-botanical-600 bg-botanical-50">
                    🌱
                  </div>
                )}
                <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                  {place.posts.length}
                </span>
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-botanical-700 bg-botanical-50 px-2 py-0.5 rounded-full border border-botanical-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-botanical-500" />
                    Verified Plant-Based
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  {place.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                  <span>Tap to expand photo gallery</span>
                  <span className="text-botanical-600 font-semibold">↑</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Wishlist Bookmark Button */}
                <button
                  onClick={handleToggleSave}
                  className={`p-2.5 rounded-full transition-colors ${
                    isSaved
                      ? 'bg-botanical-100 text-botanical-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title={isSaved ? 'Saved in Wishlist' : 'Save to Wishlist'}
                  aria-label="Wishlist toggle"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                {/* Directions to Google Maps */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-botanical-50 hover:text-botanical-700 text-slate-700 transition-colors"
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
            className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-3xl rounded-t-[36px] max-h-[88vh] flex flex-col shadow-2xl border-t border-black/[0.06]"
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
            {/* Tactile Grab Indicator (Amie style) */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onClick={() => setIsExpanded(false)}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors" />
            </div>

            {/* Place Header Block */}
            <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-black/[0.04]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-botanical-700 bg-botanical-50 px-2.5 py-0.5 rounded-full border border-botanical-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-botanical-500" />
                    Verified Plant-Based
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {place.posts.length} {place.posts.length === 1 ? 'shared photo' : 'shared photos'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {place.name}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Wishlist Button */}
                <button
                  onClick={handleToggleSave}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-colors ${
                    isSaved
                      ? 'bg-botanical-100 border-botanical-300 text-botanical-800'
                      : 'bg-slate-100 border-slate-200/80 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{isSaved ? 'Saved' : 'Wishlist'}</span>
                </button>

                {/* Google Maps Directions */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-botanical-50 text-botanical-800 border border-botanical-200 hover:bg-botanical-100 transition-colors"
                  title="Open in Google Maps"
                >
                  <span>Directions</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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

            {/* Gallery Stream (Edge-to-Edge Cards) */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
                {place.posts.map((post) => (
                  <motion.div
                    key={post.id}
                    className="group relative bg-white rounded-3xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-photo-card transition-all duration-300 cursor-pointer"
                    onClick={() => setActivePhoto(post.image_url)}
                    whileHover={{ y: -3 }}
                  >
                    {/* Visual Canvas */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.short_text || place.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {isMyPost(post.id) && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-slate-900/85 text-white px-2.5 py-1 rounded-full backdrop-blur-md">
                          Planted by you
                        </span>
                      )}
                    </div>

                    {/* Meta Information */}
                    <div className="p-4">
                      {post.short_text ? (
                        <p className="text-sm font-normal text-slate-800 leading-relaxed line-clamp-2">
                          {post.short_text}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No notes attached</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                        <span>{formatDate(post.created_at)}</span>
                        <span className="text-botanical-600 font-semibold group-hover:underline">
                          Enlarge photo ↗
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
