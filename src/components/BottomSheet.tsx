'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { isMyPost } from '@/lib/local-posts';

interface BottomSheetProps {
  place: PlaceWithPosts;
  onClose: () => void;
}

export default function BottomSheet({ place, onClose }: BottomSheetProps) {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-bark-900/40 backdrop-blur-md z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5] rounded-t-[32px] max-h-[88vh] flex flex-col shadow-clay-lg border-t border-white/60"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
      >
        {/* Tactile drag pill */}
        <div className="flex justify-center pt-3.5 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-soil-300/60 shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)]" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 pt-1 border-b border-soil-100 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-vegan-700 bg-vegan-100/80 px-2.5 py-0.5 rounded-full border border-vegan-200">
                Plant-Based Spot
              </span>
              <span className="text-xs text-bark-600/60">
                {place.posts.length} {place.posts.length === 1 ? 'memory' : 'memories'}
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-bark-900 tracking-tight leading-snug truncate">
              {place.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-soil-100 hover:bg-soil-200 text-bark-700 transition-colors shadow-clay-sm"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Polaroid Scrapbook Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 bg-noise">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {place.posts.map((post, i) => {
              // Subtle random rotation for scrapbook warmth (-1.5deg to 1.5deg)
              const rotation = (i % 2 === 0 ? -1 : 1) * ((i % 3) * 0.8 + 0.5);

              return (
                <motion.div
                  key={post.id}
                  className="bg-white p-3.5 pb-4 rounded-2xl shadow-polaroid border border-stone-200/60 cursor-pointer group"
                  style={{ rotate: `${rotation}deg` }}
                  whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => setActivePhoto(post.image_url)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Photo container */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-cream-200 shadow-inner">
                    <img
                      src={post.image_url}
                      alt={post.short_text || 'Vegan dish'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {isMyPost(post.id) && (
                      <span className="absolute top-2.5 right-2.5 text-[11px] font-bold bg-vegan-600/90 text-white px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
                        You 🌱
                      </span>
                    )}
                  </div>

                  {/* Caption & Date stamp */}
                  <div className="pt-3 px-1">
                    {post.short_text ? (
                      <p className="text-sm font-medium text-bark-800 line-clamp-2 leading-relaxed">
                        "{post.short_text}"
                      </p>
                    ) : (
                      <p className="text-xs text-bark-600/40 italic">A delicious plant-based moment</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <span className="text-[11px] font-mono tracking-wider text-bark-600/50 uppercase">
                        {formatDate(post.created_at)}
                      </span>
                      <span className="text-[11px] text-vegan-600 font-semibold group-hover:underline">
                        View photo ↗
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="fixed inset-0 bg-bark-900/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhoto(null)}
          >
            <motion.div
              className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activePhoto}
                alt="Enlarged view"
                className="w-full h-full max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
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
