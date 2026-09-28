'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from './Toast';

const ONBOARDING_KEY = 'vegan_jp_onboarded_v1';

const JAPANESE_VEGAN_PHRASE = '私はヴィーガンです。肉、魚、出汁（かつお・にぼし等）、乳製品、卵を含む料理は食べられません。\n(I am vegan. I cannot eat meat, seafood, fish broth/dashi, dairy, or egg products.)';

const STEPS = [
  {
    badge: 'Why vegan.jp?',
    title: 'Plant-Based in Japan Made Simple',
    description:
      'Japan is renowned for extraordinary cuisine, but hidden bonito dashi (fish flakes) and meat extracts make dining tricky. vegan.jp is a living visual atlas of spots verified by real vegan travelers.',
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 mx-auto text-2xl">
        🌱
      </div>
    ),
  },
  {
    badge: 'Discovery',
    title: 'Candid Photos & Instant Routes',
    description:
      'Tap any photo pin to inspect guest photos and dish notes. Jump to Tokyo, Kyoto, or Osaka with top city chips, or tap the compass for nearby spots.',
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 mx-auto text-2xl">
        🗺️
      </div>
    ),
  },
  {
    badge: 'Survival Tool',
    title: 'Show to Waitstaff (Phrase Card)',
    description:
      'Show this Japanese phrase card to restaurant staff to confirm your food is 100% animal-free.',
    isPhraseCard: true,
    icon: (
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 mx-auto text-2xl">
        🗣️
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const copyPhrase = async () => {
    await navigator.clipboard.writeText(JAPANESE_VEGAN_PHRASE);
    showToast('Phrase copied to clipboard!', '📋');
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
        onClick={handleSkip}
      >
        <motion.div
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-black/[0.06] p-7 flex flex-col justify-between"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-botanical-700 bg-botanical-50 px-2.5 py-0.5 rounded-full border border-botanical-200/60">
              {current.badge} · {currentStep + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Icon */}
          <div className="py-2">
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

          {/* Text Content */}
          <div className="my-3 text-center">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
              {current.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              {current.description}
            </p>

            {/* Emergency Phrase Card */}
            {current.isPhraseCard && (
              <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-left">
                <p className="text-xs font-bold text-slate-900 leading-relaxed font-sans">
                  私はヴィーガンです。肉、魚、出汁（かつお・にぼし等）、乳製品、卵を含む料理は食べられません。
                </p>
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-amber-800 font-medium">Tap to copy Japanese text</span>
                  <button
                    onClick={copyPhrase}
                    className="text-[11px] font-bold text-botanical-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-xs hover:bg-amber-100 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Dots & Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-6 bg-botanical-600'
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="bg-slate-900 hover:bg-botanical-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm transition-colors"
            >
              {currentStep === STEPS.length - 1 ? 'Start Exploring 🚀' : 'Next →'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
