'use client';

import { motion } from 'framer-motion';

interface PhotoPinProps {
  imageUrl?: string;
  count: number;
}

export default function PhotoPin({ imageUrl, count }: PhotoPinProps) {
  return (
    <motion.div
      className="relative cursor-pointer"
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      whileHover={{ scale: 1.15, y: -4 }}
    >
      {/* Pin shadow */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-bark-900/15 rounded-full blur-sm" />

      {/* Photo circle */}
      <div className="w-14 h-14 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-vegan-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-vegan-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
      </div>

      {/* Count badge */}
      {count > 1 && (
        <motion.div
          className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-vegan-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md px-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {count}
        </motion.div>
      )}

      {/* Pin pointer */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
    </motion.div>
  );
}
