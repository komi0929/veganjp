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

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.name
  )}&query_place_id=${place.google_place_id}`;

  return (
    <>
      {/* Dimmed Backdrop */}
      <motion.div
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modernist Discovery Sheet (Apple Maps & MD Vinyl inspired) */}
      <motion.div
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-3xl rounded-t-[36px] max-h-[86vh] flex flex-col shadow-2xl border-t border-black/[0.06]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
      >
        {/* Tactile Grab Indicator */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
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

          <div className="flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Open in Google Maps"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Gallery Stream (Clean, Edge-to-Edge Cards) */}
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
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-slate-900/80 text-white px-2.5 py-1 rounded-full backdrop-blur-md">
                      Planted by you
                    </span>
                  )}
                </div>

                {/* Micro Meta Information */}
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
