'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from './Toast';

interface SoyStoriesPerkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SoyStoriesPerkModal({ isOpen, onClose }: SoyStoriesPerkModalProps) {
  if (!isOpen) return null;

  const handleCopySecretPerk = async () => {
    await navigator.clipboard.writeText('vegan.jp VIP Perk: Double Scoop Upgrade / Free Topping');
    showToast('VIP Perk code saved to clipboard! Show at counter.', '🍨');
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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/[0.08] overflow-hidden flex flex-col max-h-[90vh]"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero Banner */}
          <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white p-6 shrink-0 overflow-hidden">
            <div className="absolute -right-8 -bottom-8 text-8xl opacity-15 select-none">🍨</div>
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-block mb-2">
                Exclusive Traveler VIP Perk 🎁
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                SoyStories Yakuin (Fukuoka)
              </h3>
              <p className="text-xs text-emerald-200 mt-1">
                Artisan 100% Plant-Based Craft Ice Cream & Gluten-Free Waffles
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors z-20"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* VIP Coupon Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <span>🎟️</span>
                  <span>Traveler Free Upgrade Coupon</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Valid in 2026
                </span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                Show this screen at the counter of <strong>SoyStories Yakuin</strong> in Fukuoka to receive a <strong>complimentary waffle topping or double-scoop upgrade</strong> with any ice cream order!
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">Code: VEGANJP-VIP</span>
                <button
                  onClick={handleCopySecretPerk}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  Copy Perk Code
                </button>
              </div>
            </div>

            {/* About SoyStories */}
            <div className="space-y-2 text-slate-700 leading-relaxed">
              <h4 className="font-bold text-slate-900 text-sm">
                About the Creators of vegan.jp
              </h4>
              <p>
                vegan.jp was built by the culinary artisans behind <strong>SoyStories</strong>. Located in Yakuin, Fukuoka, SoyStories crafts luxurious, dairy-free ice cream using fresh, rich soy milk from a century-old local tofu maker (荒木豆腐店).
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-semibold text-slate-800">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  🍨 100% Plant-Based
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  🌾 Gluten-Free Rice Waffle
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  🚫 Zero White Sugar
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  🌱 100% Animal-Free Kitchen
                </div>
              </div>
            </div>

            {/* Visit Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">📍 Location & Access:</div>
              <p className="text-slate-600">
                Yakuin, Chuo-ku, Fukuoka City, Fukuoka (福岡市中央区薬院)
                <br />
                <span className="text-[11px] text-slate-500">5-min walk from Yakuin Station (Nishitetsu & Subway Nanakuma Line)</span>
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=SoyStories+薬院+福岡"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 transition-colors"
                >
                  <span>Open in Google Maps 🗺️</span>
                </a>
                <a
                  href="https://www.instagram.com/soystories_yakuin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 transition-colors"
                >
                  <span>📷 @soystories_yakuin</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
