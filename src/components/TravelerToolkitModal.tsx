'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from './Toast';

export type ToolkitTab = 'passport' | 'why_us' | 'phrases';

interface TravelerToolkitModalProps {
  isOpen?: boolean;
  initialTab?: ToolkitTab;
  onClose: () => void;
}

export default function TravelerToolkitModal({
  isOpen = true,
  initialTab = 'passport',
  onClose,
}: TravelerToolkitModalProps) {
  const [activeTab, setActiveTab] = useState<ToolkitTab>(initialTab);

  // Dietary options for the chef passport
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isOrientalVegan, setIsOrientalVegan] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Generate Japanese text for Chef Passport
  const generateJapaneseChefText = () => {
    let restrictions = [
      '肉類（牛肉・豚肉・鶏肉など）',
      '魚介類（魚、貝、エビ、カニなど）',
      'かつお節・煮干しなどの【魚介系出汁（だし）】',
      '肉エキス・チキンブイヨン・ラード（豚脂）',
      '卵・マヨネーズ',
      '乳製品（牛乳、チーズ、バター、生クリームなど）',
      'はちみつ・ゼラチン',
    ];

    if (isGlutenFree) {
      restrictions.push('小麦・小麦粉・一般的な醤油（グルテン不使用）');
    }
    if (isOrientalVegan) {
      restrictions.push('五葷（ネギ・玉ねぎ・にんにく・ニラ・らっきょう・あさつき）');
    }

    return `【店員さん・料理人の方へ】
すみません、私はヴィーガン（完全菜食主義）です。宗教・信条・アレルギーのため、以下の食材が一切含まれていないメニューはありますか？

${restrictions.map((r) => `❌ ${r}`).join('\n')}

鍋や油、調理器具の共有もできるだけ避けていただけると大変助かります。
対応可能なメニューがございましたら教えてください。ありがとうございます。`;
  };

  const handleCopyChefText = async () => {
    await navigator.clipboard.writeText(generateJapaneseChefText());
    showToast('Copied Japanese chef request to clipboard!', '📋');
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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/[0.08] flex flex-col max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧰</span>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Japan Vegan Survival Kit
                </h2>
                <p className="text-[11px] text-slate-500">
                  Essential tools for smooth, safe dining across Japan
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200/80 px-3 pt-2 bg-slate-100/60 shrink-0 gap-1 overflow-x-auto scrollbar-hide text-xs font-semibold">
            <button
              onClick={() => setActiveTab('passport')}
              className={`px-3 py-2 rounded-t-xl transition-all shrink-0 flex items-center gap-1.5 border-b-2 ${
                activeTab === 'passport'
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <span>🗣️</span>
              <span>Chef Card</span>
            </button>
            <button
              onClick={() => setActiveTab('why_us')}
              className={`px-3 py-2 rounded-t-xl transition-all shrink-0 flex items-center gap-1.5 border-b-2 ${
                activeTab === 'why_us'
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <span>🛡️</span>
              <span>Why Not Google Maps?</span>
            </button>
            <button
              onClick={() => setActiveTab('phrases')}
              className={`px-3 py-2 rounded-t-xl transition-all shrink-0 flex items-center gap-1.5 border-b-2 ${
                activeTab === 'phrases'
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <span>🇯🇵</span>
              <span>Useful Phrases</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-sm space-y-4">
            {/* ─── TAB 1: Chef Passport ─── */}
            {activeTab === 'passport' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-base shrink-0">💡</span>
                  <span>
                    <strong>Show this directly to the waitstaff or chef.</strong> In Japan, many chefs don&apos;t realize that fish dashi (bonito flakes) or chicken broth isn&apos;t considered vegetarian/vegan abroad.
                  </span>
                </div>

                {/* Dietary Customization Toggles */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setIsGlutenFree(!isGlutenFree)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isGlutenFree
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>🌾</span>
                    <span>+ Gluten-Free (小麦抜き)</span>
                    {isGlutenFree && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => setIsOrientalVegan(!isOrientalVegan)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isOrientalVegan
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>🧅</span>
                    <span>+ Oriental Vegan (五葷抜き: No Alliums)</span>
                    {isOrientalVegan && <span>✓</span>}
                  </button>
                </div>

                {/* High Contrast Japanese Display Card */}
                <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-3 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Show This Screen to Staff / 店員さんへ
                    </span>
                    <button
                      onClick={handleCopyChefText}
                      className="text-[11px] font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      Copy Japanese
                    </button>
                  </div>

                  <p className="text-base sm:text-lg font-bold leading-snug text-white">
                    すみません、私はヴィーガン（完全菜食主義）です。
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    宗教・アレルギーのため、以下の食材が一切入っていないお料理はございますか？
                  </p>

                  <div className="bg-slate-900/90 rounded-xl p-3 space-y-2 border border-slate-800 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <span>❌</span>
                      <span>かつお節・煮干し・魚介系の出汁（だし）</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <span>❌</span>
                      <span>肉・肉エキス・ラード（豚脂）・チキンブイヨン</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <span>❌</span>
                      <span>魚介類（魚、貝、エビ、カニなど）</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <span>❌</span>
                      <span>卵・マヨネーズ</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <span>❌</span>
                      <span>乳製品（牛乳、バター、チーズ、生クリーム）</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-400 font-semibold">
                      <span>❌</span>
                      <span>はちみつ・ゼラチン</span>
                    </div>
                    {isGlutenFree && (
                      <div className="flex items-center gap-2 text-amber-300 font-bold bg-amber-950/40 p-1.5 rounded-lg border border-amber-800/50">
                        <span>❌</span>
                        <span>小麦・小麦粉・一般的な醤油（グルテン不使用）</span>
                      </div>
                    )}
                    {isOrientalVegan && (
                      <div className="flex items-center gap-2 text-purple-300 font-bold bg-purple-950/40 p-1.5 rounded-lg border border-purple-800/50">
                        <span>❌</span>
                        <span>五葷（ネギ・玉ねぎ・にんにく・ニラ・らっきょう）</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal pt-1">
                    鍋や調理器具を共有する場合も、事前に教えていただけますと助かります。よろしくお願いいたします。
                  </p>
                </div>

                {/* Pronunciation guide */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800">Spoken Japanese (Romaji):</div>
                  <p className="italic text-slate-600">
                    &quot;Sumimasen, watashi wa vi-gan desu. Niku, sakana, dashi, tamago ga haitteinai menu wa arimasu ka?&quot;
                  </p>
                </div>
              </div>
            )}

            {/* ─── TAB 2: Why Not Google Maps? ─── */}
            {activeTab === 'why_us' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950">
                  <h3 className="font-bold text-sm mb-1 text-emerald-900">
                    Why Google Maps Fails Vegans in Japan
                  </h3>
                  <p className="leading-relaxed text-emerald-800">
                    Google Maps is incredible for train navigation, but searching for &quot;vegan&quot; in Japan leads to 3 dangerous pitfalls that ruin travelers&apos; trips every day.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                      <span className="text-base">🚨</span>
                      <span>Trap 1: The Invisible Bonito Dashi (鰹出汁)</span>
                    </div>
                    <p className="text-xs text-rose-950 leading-relaxed">
                      Google Maps categorizes soba, udon, tempura, and vegetable hotpots as &quot;Vegetarian&quot;. In Japan, almost <strong>100% of these dishes simmer fish flakes (bonito) or sardine extracts into the broth</strong>. Google&apos;s AI does not distinguish fish broth from plant broth.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                      <span className="text-base">⚠️</span>
                      <span>Trap 2: The Negative Review Keyword Bait</span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      If 10 reviewers write: <em>&quot;Warning: They have ZERO vegan options and served me pork!&quot;</em>, Google Maps indexes the keyword &quot;vegan&quot; and ranks the restaurant higher in search results! You end up walking 20 minutes to a non-vegan steakhouse.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wide">
                      <span className="text-base">🍳</span>
                      <span>Trap 3: Zero Contamination Filtering</span>
                    </div>
                    <p className="text-xs text-purple-950 leading-relaxed">
                      Google Maps has no toggle for <strong>&quot;100% Dedicated Plant-Based Kitchen&quot;</strong> vs. &quot;Mixed Kitchen&quot;. On vegan.jp, 390+ spots are certified 100% animal-free kitchens with zero meat or fish on the premises.
                    </p>
                  </div>
                </div>

                {/* Direct Comparison Matrix */}
                <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <div className="grid grid-cols-3 bg-slate-100 font-bold text-slate-800 p-2 text-center">
                    <span>Feature</span>
                    <span className="text-slate-500">Google Maps</span>
                    <span className="text-emerald-700">vegan.jp</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-t border-slate-100 text-center items-center">
                    <span className="font-semibold text-left">Bonito Dashi Trap</span>
                    <span className="text-rose-500">❌ Blind to fish</span>
                    <span className="text-emerald-600 font-bold">✅ Dashi-Free Curated</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-t border-slate-100 text-center items-center bg-slate-50/50">
                    <span className="font-semibold text-left">100% Kitchen Filter</span>
                    <span className="text-rose-500">❌ Not possible</span>
                    <span className="text-emerald-600 font-bold">✅ 1-Tap Filter</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-t border-slate-100 text-center items-center">
                    <span className="font-semibold text-left">Gluten-Free + Vegan</span>
                    <span className="text-rose-500">❌ Mixed results</span>
                    <span className="text-emerald-600 font-bold">✅ 44 Verified Spots</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 border-t border-slate-100 text-center items-center bg-slate-50/50">
                    <span className="font-semibold text-left">Chef Communication</span>
                    <span className="text-rose-500">❌ None</span>
                    <span className="text-emerald-600 font-bold">✅ Built-in Card</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: Useful Japanese Phrases ─── */}
            {activeTab === 'phrases' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    1. Is this meat-free and fish-free?
                  </span>
                  <div className="text-slate-800 font-semibold text-sm">
                    これは肉や魚が入っていませんか？
                  </div>
                  <div className="text-emerald-700 italic">
                    Kore wa niku ya sakana ga haitte imasen ka?
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    2. I cannot eat fish broth (katsuo dashi).
                  </span>
                  <div className="text-slate-800 font-semibold text-sm">
                    かつお節や魚の出汁は食べられません。
                  </div>
                  <div className="text-emerald-700 italic">
                    Katsuo-bushi ya sakana no dashi wa taberaremasen.
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    3. Do you have plant milk (soy milk / oat milk)?
                  </span>
                  <div className="text-slate-800 font-semibold text-sm">
                    豆乳やオーツミルクはありますか？
                  </div>
                  <div className="text-emerald-700 italic">
                    Tōnyū ya ōtsu miruku wa arimasu ka?
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    4. Can you make this dish without meat or fish?
                  </span>
                  <div className="text-slate-800 font-semibold text-sm">
                    肉や魚を抜いて作っていただけますか？
                  </div>
                  <div className="text-emerald-700 italic">
                    Niku ya sakana o nuite tsukutte itadakemasu ka?
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <span className="text-[11px] text-slate-500 font-medium">
              Save offline or bookmark for your trip ✈️
            </span>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              Back to Map 🗺️
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
