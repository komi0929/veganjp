'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlaceWithPosts } from '@/lib/types';
import { showToast } from './Toast';

interface B2BWholesaleModalProps {
  isOpen: boolean;
  place?: PlaceWithPosts | null;
  onClose: () => void;
}

export default function B2BWholesaleModal({ isOpen, place, onClose }: B2BWholesaleModalProps) {
  const [restaurantName, setRestaurantName] = useState(place?.name || '');
  const [contactName, setContactName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('ice_cream_sample');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      const existing = JSON.parse(localStorage.getItem('vegan_jp_b2b_inquiries') || '[]');
      existing.push({
        restaurantName: restaurantName || place?.name || 'General Inquiry',
        contactName,
        emailOrPhone,
        inquiryType,
        message,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vegan_jp_b2b_inquiries', JSON.stringify(existing));
    } catch (err) {
      // fallback
    }

    showToast('Inquiry received! SoyStories Wholesale team will connect shortly.', '🍨');
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
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-950 text-white shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-700/60">
                For Chefs & Restaurant Owners / 飲食店・ホテル様へ
              </span>
              <h3 className="text-base font-bold mt-1 text-white">
                SoyStories B2B Wholesale Partnership
              </h3>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                Artisan 100% Plant-Based Ice Cream & Gluten-Free Waffles for your menu
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Value Proposition Callout */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5 leading-relaxed">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
                    <span>🍨</span>
                    <span>インバウンド客の「ヴィーガンスイーツ需要」にお応えしませんか？</span>
                  </div>
                  <p className="text-[11px] text-amber-900">
                    訪日外国人の約7割が「食後のヴィーガンデザート・乳不使用アイス」を求めています。
                    SoyStories（福岡・薬院）の<strong>創業100年老舗豆腐店の濃厚豆乳仕込みクラフトアイス</strong>を業務用バルク（2L/4L）または個別カップにて全国のレストラン・カフェ様へ卸納品いたします。
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      貴店名 / 会社名 (Restaurant / Hotel Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="例: Cafe Green Tokyo / ○○ホテル レストラン"
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        ご担当者名 (Contact Person)
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="例: 山田 太郎"
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        連絡先 (Email / TEL)
                      </label>
                      <input
                        type="text"
                        required
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        placeholder="example@restaurant.jp / 090-xxxx-xxxx"
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      ご希望内容 (Inquiry Category)
                    </label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 text-xs bg-white"
                    >
                      <option value="ice_cream_sample">🍨 業務用クラフトアイスのサンプル請求・試食希望</option>
                      <option value="waffle_dessert">🧇 グルテンフリー米粉ワッフル・スイーツの導入相談</option>
                      <option value="claim_listing">📍 vegan.jp 掲載情報の修正・公式認定バッジ申請</option>
                      <option value="wholesale_pricing">📑 卸価格表・ロット・納品スケジュールの確認</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      メッセージ・ご要望 (Optional Message)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="客席数、提供形態（カフェメニュー、コースの締めデザート等）、ご希望のフレーバーなど"
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <a
                    href="https://www.instagram.com/soystories_yakuin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-700 hover:text-pink-900 font-semibold inline-flex items-center gap-1"
                  >
                    <span>📷 Instagram DMでのお問合せはこちら</span>
                  </a>

                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-full shadow-sm transition-colors cursor-pointer"
                  >
                    卸サンプル・資料を請求する 📩
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center space-y-3">
                <span className="text-4xl block">🎉</span>
                <h4 className="text-base font-bold text-slate-900">
                  お問合せ・サンプル請求を承りました
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  SoyStoriesの法人・卸営業担当より、ご入力いただいた連絡先へ最短でご案内とサンプル手配のご連絡を差し上げます。
                </p>
                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="bg-slate-900 text-white font-bold px-6 py-2 rounded-full cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
