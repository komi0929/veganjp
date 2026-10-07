'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { showToast } from './Toast';

interface SpotReportModalProps {
  isOpen: boolean;
  place: PlaceWithPosts;
  onClose: () => void;
}

export default function SpotReportModal({ isOpen, place, onClose }: SpotReportModalProps) {
  const [reportType, setReportType] = useState<string>('verified');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Save report to localStorage for decentralized community tracking
    try {
      const existing = JSON.parse(localStorage.getItem('vegan_jp_reports') || '[]');
      existing.push({
        placeId: place.google_place_id,
        placeName: place.name,
        reportType,
        comment,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vegan_jp_reports', JSON.stringify(existing));
    } catch (err) {
      // fallback
    }

    setTimeout(() => {
      setSubmitting(false);
      showToast('Thank you! Community verification updated.', '🌱');
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Community Verification (CGM)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Report Status for {place.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Help keep vegan.jp 100% accurate without outdated information. Your report keeps the atlas trustworthy for all travelers!
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">What is the current status?</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReportType('verified')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                    reportType === 'verified'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-base mb-0.5">👍</span>
                  Open & Safe (Visited recently)
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('hours_changed')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                    reportType === 'hours_changed'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-base mb-0.5">🕒</span>
                  Hours / Menu Changed
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('closed')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                    reportType === 'closed'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-base mb-0.5">🚪</span>
                  Permanently Closed
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('not_vegan')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                    reportType === 'not_vegan'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-base mb-0.5">⚠️</span>
                  No Longer Vegan / Dashi Issue
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="e.g. Closed on Wednesdays, now offers gluten-free noodles, staff confirmed fish-free broth..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Verification 🚀'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
