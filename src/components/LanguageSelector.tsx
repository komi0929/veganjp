'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES, SupportedLanguage, LanguageOption } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
}

export default function LanguageSelector({
  currentLang,
  onSelectLang,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/90 hover:bg-white hover:text-slate-900 border border-black/[0.08] px-2.5 py-1 rounded-full shadow-xs transition-colors cursor-pointer"
        title="Select Language / 言語選択 / 選擇語言 / 언어 선택"
        aria-label="Language selector"
      >
        <span>{currentOption.flag}</span>
        <span className="hidden sm:inline font-semibold">{currentOption.label}</span>
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full right-0 mt-1.5 w-44 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-black/[0.08] py-1.5 z-50 overflow-hidden divide-y divide-slate-100"
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Language
            </div>
            <div className="py-1 max-h-60 overflow-y-auto scrollbar-hide">
              {LANGUAGES.map((lang: LanguageOption) => {
                const isActive = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLang(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {isActive && <span className="text-emerald-600 font-bold text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
