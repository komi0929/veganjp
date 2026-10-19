'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppSidebar, { NavLang } from '@/components/AppSidebar';

type GuideTab = 'traveler' | 'store' | 'faq';

export default function GuidePage() {
    const [lang, setLang] = useState<NavLang>('ja');
    const [activeTab, setActiveTab] = useState<GuideTab>('traveler');
    const isJa = lang === 'ja';

    return (
        <div className="min-h-dvh bg-[#EEF7F2] text-[#1C2822] md:grid md:grid-cols-[268px_1fr]">
            <AppSidebar lang={lang} onLangChange={setLang} />

            <div className="flex flex-col min-h-dvh overflow-x-hidden">
                <main className="flex-1 px-4 sm:px-6 pt-8 md:pt-16 pb-16">
                    <div className="max-w-2xl mx-auto">
                        {/* Header Row + Rotated Handwritten Guidance */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 px-1">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-[13px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,0.25)] shrink-0">
                                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-[25px] font-extrabold tracking-tight text-[#1C2822] leading-tight">
                                        {isJa ? 'Vegan.jp 活用ガイド＆Q&A' : 'How Vegan.jp Works & FAQ'}
                                    </h1>
                                    <p className="text-xs font-semibold text-[#526358] mt-0.5">
                                        {isJa
                                            ? '「看板の一皿」と「完食御朱印」で旅人と名店をつなぐシンプルな仕組み'
                                            : 'Connecting travelers and chefs through Signature Dishes & Collectible Stamps'}
                                    </p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-1.5 text-[#15803D] font-bold text-xs rotate-2 translate-y-1 select-none shrink-0">
                                <span>{isJa ? '初見でも30秒で使いこなせます' : 'Master in 30 seconds'}</span>
                                <svg className="w-5 h-5 text-[#16A34A] translate-y-1" viewBox="0 0 28 28" fill="none">
                                    <path
                                        d="M4 6C12 6 19 10 20 21M20 21L15 16.5M20 21L24.5 16"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* TWO-LAYER SQUIRCLE TRAY (.nani-well + .nani-sheet) */}
                        <div className="nani-well">
                            <div className="px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-[#CBE2D4]/75 p-1 rounded-[16px]">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('traveler')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 ${
                                            activeTab === 'traveler'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        {isJa ? '1. 訪日客の楽しみ方' : '1. For Travelers'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('store')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 ${
                                            activeTab === 'store'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        {isJa ? '2. 店舗オーナーの活用法' : '2. For Restaurants'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('faq')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 ${
                                            activeTab === 'faq'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        {isJa ? '3. なりすまし対策・Q&A' : '3. Security & FAQ'}
                                    </button>
                                </div>

                                <span className="h-7 px-3 rounded-full bg-white/80 text-[11px] font-bold text-[#15803D] flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-[#16A34A]" />
                                    <span>{isJa ? '完全無料・登録不要' : '100% Free'}</span>
                                </span>
                            </div>

                            <div className="nani-sheet p-5 sm:p-6">
                                {activeTab === 'traveler' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2.5">
                                            {[
                                                {
                                                    step: 'STEP 01',
                                                    title: isJa
                                                        ? 'マップで「シェフの看板の一皿」と「歓迎特典」を見つける'
                                                        : "Discover a Chef's Signature Dish & Welcome Perk",
                                                    desc: isJa
                                                        ? '選んだ言語に合わせてマップ表記も最適化。お店が誇りを持って提供する1皿と、画面提示でもらえる歓迎特典がひと目でわかります。'
                                                        : 'Map labels adapt to your language. Instantly see each restaurant’s signature vegan dish and exclusive welcome perk.',
                                                },
                                                {
                                                    step: 'STEP 02',
                                                    title: isJa
                                                        ? '注文時は「日本語の指差しチケット」を店員さんに見せるだけ'
                                                        : 'Show the Japanese Order Ticket at the Table',
                                                    desc: isJa
                                                        ? '日本語が話せなくても安心。1タップで店員さん向けの大きな日本語注文票＆歓迎特典チケットを表示できます。'
                                                        : 'Tap once to display a large Japanese order ticket with your welcome perk included.',
                                                },
                                                {
                                                    step: 'STEP 03',
                                                    title: isJa
                                                        ? '食後は「完食御朱印」を押して、シェフへ絵葉書を送る'
                                                        : 'Collect Your Culinary Stamp & Send a Postcard',
                                                    desc: isJa
                                                        ? '完食したらデジタル御朱印をゲット！母国語で書いた感謝の絵葉書は日本語に自動翻訳されてシェフに届き、9:16ストーリーズ画像として保存できます。'
                                                        : 'Stamp your digital book, send an auto-translated thank-you postcard to the chef, and save a 9:16 Instagram Story card.',
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.step}
                                                    className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-4"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D]">
                                                            {item.step}
                                                        </span>
                                                        <h3 className="text-xs sm:text-sm font-extrabold text-[#1C2822]">
                                                            {item.title}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-[#526358] leading-relaxed font-medium">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-2 flex items-center justify-between gap-3">
                                            <Link
                                                href="/growth"
                                                className="h-11 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-[#1C2822] font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all"
                                            >
                                                <span>{isJa ? 'ストーリーズ生成を見る' : 'Open Story Studio'}</span>
                                            </Link>
                                            <Link
                                                href="/"
                                                className="h-11 px-5 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all"
                                            >
                                                <span>{isJa ? 'マップを開いて体験する →' : 'Explore Map Now →'}</span>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'store' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2.5">
                                            {[
                                                {
                                                    step: 'POINT 01',
                                                    title: isJa
                                                        ? '面倒な細かいチェックリストはゼロ。「看板の一皿」だけでOK'
                                                        : 'No Complex Checklists—Just Your Signature Dish',
                                                    desc: isJa
                                                        ? '「看板メニュー1皿」と「画面提示の歓迎特典（ミニドリンク等）」を入力するだけ。英語等の翻訳や指差し注文画面はすべて自動生成されます。'
                                                        : 'Enter your top dish and a small welcome perk in Japanese; we handle all translations and order tickets.',
                                                },
                                                {
                                                    step: 'POINT 02',
                                                    title: isJa
                                                        ? '届いた「ごちそうさま絵葉書」に日本語でひとこと返信'
                                                        : 'Reply to Traveler Postcards in Japanese',
                                                    desc: isJa
                                                        ? '世界中のゲストから日本語に翻訳された絵葉書が届きます。日本語で返信すると自動で英語翻訳され、次のお客様への最高のPRになります。'
                                                        : 'Read thank-you postcards in Japanese and reply in one line to delight future guests.',
                                                },
                                                {
                                                    step: 'POINT 03',
                                                    title: isJa
                                                        ? '初期費用・月額・送客手数料すべて完全無料（0円）'
                                                        : '100% Free—Zero Monthly or Booking Fees',
                                                    desc: isJa
                                                        ? '卓上QRポップの印刷も含め、店舗様から費用をいただくことは一切ありません。'
                                                        : 'All partner tools and printable table QR stands are completely free.',
                                                },
                                            ].map((item) => (
                                                <div
                                                    key={item.step}
                                                    className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-4"
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D]">
                                                            {item.step}
                                                        </span>
                                                        <h3 className="text-xs sm:text-sm font-extrabold text-[#1C2822]">
                                                            {item.title}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-[#526358] leading-relaxed font-medium">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-2 flex items-center justify-end">
                                            <Link
                                                href="/partner"
                                                className="h-11 px-5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_18px_rgba(22,163,74,0.22)] active:scale-95 transition-all"
                                            >
                                                <span>{isJa ? '店舗オーナースタジオを開く →' : 'Open Partner Studio →'}</span>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'faq' && (
                                    <div className="space-y-3">
                                        {[
                                            {
                                                q: isJa
                                                    ? 'Q. 第三者が勝手にお店のオーナーになりすまして書き換えたりできませんか？'
                                                    : 'Q. How do you prevent spoofing or unauthorized store edits?',
                                                a: isJa
                                                    ? 'A. 3段階のなりすまし防止ロック（①店舗の公式InstagramへのDMコード送信、②店舗固定電話での自動音声コード確認、③公式ドメインメール認証）を導入しており、6桁のOTPコードをクリアしたオーナー様のみが編集・返信できます。'
                                                    : 'A. We enforce a 3-tier OTP verification lock via Official Instagram DM, Store Landline, or Official Domain Email before any edits can be saved.',
                                            },
                                            {
                                                q: isJa
                                                    ? 'Q. 写真のリンク切れや営業時間の変更などの不具合はどうやって改善されますか？'
                                                    : 'Q. How are broken images or outdated store details handled?',
                                                a: isJa
                                                    ? 'A. クライアント常駐の「Self-Healing Guard」が画像エラーを検知した瞬間に代替高解像度写真へ自動置換し、バックエンドの自己修復エンジンへ記録します。また10秒修正レポートから誰でも即座にパッチを送信できます。'
                                                    : 'A. Our Self-Healing Guard automatically swaps broken images on the fly and logs telemetry to the self-healing backend.',
                                            },
                                            {
                                                q: isJa
                                                    ? 'Q. GoogleマップやHappyCowと何が一番違うのですか？'
                                                    : 'Q. How is Vegan.jp different from Google Maps or HappyCow?',
                                                a: isJa
                                                    ? 'A. 単なる検索ツールではなく、「看板の一皿＆歓迎特典」「店員さんにそのまま見せる日本語注文チケット」「完食御朱印＆シェフとの絵葉書交流」によって、旅の思い出とお店のファンづくりを同時にブーストする点です。'
                                                    : 'A. Instead of dry directory listings, Vegan.jp focuses on Chef Signature Dishes, Welcome Perks, Japanese Order Tickets, and Collectible Goshuin Stamps.',
                                            },
                                        ].map((faq, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-4 space-y-1"
                                            >
                                                <div className="text-xs sm:text-sm font-extrabold text-[#1C2822]">
                                                    {faq.q}
                                                </div>
                                                <p className="text-xs text-[#526358] leading-relaxed font-medium">
                                                    {faq.a}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2-Column Dashed Quick Links */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <Link
                                href="/partner"
                                className="nani-dashed p-4 text-left flex items-center justify-between gap-3 group"
                            >
                                <div>
                                    <div className="text-xs sm:text-[13.5px] font-extrabold text-[#1C2822]">
                                        {isJa ? '店舗オーナー認証を試す（10秒デモ）' : 'Try 10-Second Store Verification'}
                                    </div>
                                    <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                        {isJa
                                            ? '6桁コード発行から看板メニュー編集まで即座に体験'
                                            : 'Test the OTP unlock & signature dish editor'}
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                                    {isJa ? '開く →' : 'Open →'}
                                </span>
                            </Link>

                            <Link
                                href="/growth"
                                className="nani-dashed p-4 text-left flex items-center justify-between gap-3 group"
                            >
                                <div>
                                    <div className="text-xs sm:text-[13.5px] font-extrabold text-[#1C2822]">
                                        {isJa ? 'Instagram 自動集客＆自己修復を見る' : 'Explore Viral Growth & Auto-Heal'}
                                    </div>
                                    <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                        {isJa
                                            ? '9:16ストーリーズ画像生成とセルフヒーリング診断'
                                            : 'Download 9:16 Story cards & run diagnostics'}
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                                    {isJa ? '開く →' : 'Open →'}
                                </span>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
