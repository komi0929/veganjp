'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_KEY = 'vegan_jp_onboarded_v1';

const STEPS = [
  {
    badge: 'Overview',
    title: 'The Living Vegan Map',
    description:
      'A community-curated visual index of verified vegan food across Japan. No sponsored rankings — every spot is planted by real travelers.',
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 mx-auto">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
          <path d="M12 7v5l3 3" />
        </svg>
      </div>
    ),
  },
  {
    badge: 'Discovery',
    title: 'Candid Shared Albums',
    description:
      'Tap any floating pin to inspect actual guest photos, dish notes, and open direct navigation routes in Google Maps.',
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 mx-auto">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    ),
  },
  {
    badge: 'Contribution',
    title: 'Zero-Friction Sharing',
    description:
      'Found a delicious plant-based dish? Tap the (+) button, pick the restaurant, and post in seconds. No login or account required.',
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 mx-auto">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5v14M5 12h14" />
        </svg>
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
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-black/[0.06] p-7 flex flex-col justify-between"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-botanical-700 bg-botanical-50 px-2.5 py-0.5 rounded-full border border-botanical-200/60">
              {current.badge} · {currentStep + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Icon */}
          <div className="py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {current.icon}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Copy */}
          <div className="text-center my-4">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              {current.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {current.description}
            </p>
          </div>

          {/* Dot Progress */}
          <div className="flex justify-center gap-1.5 my-4">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Button */}
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-botanical-900 text-white text-xs font-bold tracking-wide shadow-pill transition-all"
          >
            {currentStep === STEPS.length - 1 ? 'Start Exploring' : 'Next'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
