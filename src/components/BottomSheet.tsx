'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { isMyPost } from '@/lib/local-posts';

interface BottomSheetProps {
  place: PlaceWithPosts;
  onClose: () => void;
}

export default function BottomSheet({ place, onClose }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

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
        className="fixed inset-0 bg-bark-900/30 backdrop-blur-sm z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-40 bg-cream-50 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-bark-800/15" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-bark-800/8">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-bark-800 truncate">
                {place.name}
              </h2>
              <p className="text-xs text-bark-700/50 mt-1">
                {place.posts.length} photo{place.posts.length !== 1 ? 's' : ''} shared
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-3 mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-bark-800/5 hover:bg-bark-800/10 text-bark-700/60 hover:text-bark-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Photos grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          <div className="grid grid-cols-2 gap-3">
            {place.posts.map((post, i) => (
              <motion.div
                key={post.id}
                className="relative rounded-2xl overflow-hidden bg-cream-200 aspect-square group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              >
                <img
                  src={post.image_url}
                  alt={post.short_text || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Text overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bark-900/70 via-bark-900/30 to-transparent p-3 pt-8">
                  {post.short_text && (
                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
                      {post.short_text}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-white/50">
                      {formatDate(post.created_at)}
                    </span>
                    {isMyPost(post.id) && (
                      <span className="text-[10px] bg-vegan-500/90 text-white px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
