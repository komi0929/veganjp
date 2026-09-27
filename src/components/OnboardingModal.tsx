'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_KEY = 'vegan_jp_onboarded_v1';

const STEPS = [
  {
    step: '01',
    badge: 'Discover',
    title: 'Explore the Botanical Map',
    description:
      'Every plant on the map represents a real vegan restaurant visited by conscious travelers across Japan.',
    graphic: (
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
        {/* Soft ground mound */}
        <div className="absolute bottom-2 w-28 h-10 rounded-[50%/40%] bg-gradient-to-b from-[#d8c6a9] to-[#8f7757] shadow-clay-sm" />
        {/* Animated growing plant */}
        <motion.div
          className="relative z-10 w-24 h-24"
          animate={{ rotate: [-2, 2, -2], y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 52 52" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="onbLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a3db70" />
                <stop offset="100%" stopColor="#458a27" />
              </linearGradient>
              <linearGradient id="onbPetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd4e3" />
                <stop offset="100%" stopColor="#e26694" />
              </linearGradient>
            </defs>
            <path d="M 26 48 Q 26 34 26 26" stroke="#4f8f2e" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="26" cy="16" r="7" fill="url(#onbPetal)" />
            <circle cx="17" cy="23" r="7" fill="url(#onbPetal)" />
            <circle cx="35" cy="23" r="7" fill="url(#onbPetal)" />
            <circle cx="20" cy="32" r="7" fill="url(#onbPetal)" />
            <circle cx="32" cy="32" r="7" fill="url(#onbPetal)" />
            <circle cx="26" cy="25" r="6" fill="#f6c445" />
          </svg>
        </motion.div>
      </div>
    ),
  },
  {
    step: '02',
    badge: 'Browse',
    title: 'Tap to Peek Polaroid Albums',
    description:
      'Tap any blooming pin to browse candid, honest photos and notes. No sponsored rankings — just real traveler meals.',
    graphic: (
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
        {/* Overlapping polaroids */}
        <motion.div
          className="absolute w-22 h-26 bg-white p-2 pb-5 rounded-xl shadow-polaroid border border-stone-200"
          style={{ rotate: -8, x: -14, y: 4 }}
          animate={{ rotate: [-8, -6, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-18 h-18 bg-vegan-100 rounded-lg flex items-center justify-center text-xl">
            🍜
          </div>
        </motion.div>
        <motion.div
          className="absolute w-24 h-28 bg-white p-2 pb-6 rounded-xl shadow-clay-md border border-stone-200 z-10"
          style={{ rotate: 6, x: 12, y: -4 }}
          animate={{ rotate: [6, 8, 6], scale: [1, 1.03, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-20 h-20 bg-[#fde8ef] rounded-lg flex items-center justify-center text-2xl">
            🌱
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    step: '03',
    badge: 'Share',
    title: 'Zero Login. Plant in Seconds.',
    description:
      'Found a delicious plant-based gem? Tap the (+) button, pick the spot, and plant your photo in under 10 seconds. No sign-up required — ever.',
    graphic: (
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
        {/* Pulsing FAB simulation */}
        <motion.div
          className="w-18 h-18 rounded-full bg-gradient-to-br from-vegan-400 via-vegan-500 to-vegan-700 text-white flex items-center justify-center shadow-clay-md text-3xl border border-white/50"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          +
        </motion.div>
        <motion.span
          className="absolute -top-1 -right-1 text-2xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.span>
      </div>
    ),
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  if (!isOpen) return null;

  const current = STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-bark-900/60 backdrop-blur-md flex items-center justify-center p-4 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-sm bg-[#FAF8F5] rounded-[32px] shadow-clay-lg border border-white/80 p-7 flex flex-col justify-between overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          {/* Top Skip Button */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-vegan-700 bg-vegan-100/90 px-3 py-1 rounded-full border border-vegan-200">
              {current.badge} · {currentStep + 1}/{STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-bark-600/60 hover:text-bark-900 transition-colors px-2 py-1"
            >
              Skip
            </button>
          </div>

          {/* Interactive Illustrated Graphic */}
          <div className="py-4 my-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
              >
                {current.graphic}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text Storytelling */}
          <div className="text-center my-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-2xl font-serif font-bold text-bark-900 leading-snug mb-2">
                  {current.title}
                </h3>
                <p className="text-xs text-bark-600 leading-relaxed max-w-xs mx-auto">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step Indicator Dots */}
          <div className="flex justify-center gap-1.5 my-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-vegan-600'
                    : 'w-1.5 bg-soil-200'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-vegan-500 to-vegan-700 text-white font-serif font-bold text-sm shadow-clay-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {currentStep === STEPS.length - 1 ? (
              <>Enter the Garden 🌱</>
            ) : (
              <>Continue →</>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
