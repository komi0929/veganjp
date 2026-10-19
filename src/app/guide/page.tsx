'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppSidebar, { NavLang } from '@/components/AppSidebar';

export default function GuidePage() {
    const [lang, setLang] = useState<NavLang>('ja');
    const isJa = lang === 'ja';

    return (
        <div className="min-h-dvh bg-[#EEF7F2] text-[#1C2822] lg:grid lg:grid-cols-[248px_1fr]">
            <AppSidebar lang={lang} onLangChange={setLang} />

            <div className="flex flex-col min-h-dvh overflow-x-hidden">
                <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-20 max-w-6xl w-full mx-auto space-y-6">
                    {/* Hero Banner */}
                    <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-5 sm:p-6 border border-[#DCECE3] shadow-[0_6px_20px_rgba(20,40,30,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EEF7F2] text-[#15803D]">
                                HOW VEGAN.JP WORKS • 仕組みと活用ガイド
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C2822]">
                                {isJa
                                    ? '「看板の一皿」と「完食御朱印」で、旅人と名店を幸せにつなぐ'
                                    : 'Connecting Travelers & Japanese Restaurants via Signature Dishes & Stamps'}
                            </h1>
                            <p className="text-xs sm:text-sm font-medium text-[#526358]">
                                {isJa
                                    ? '細かい成分チェックリストではなく、シェフが誇りを持って届ける最高の一皿と旅の思い出づくりに特化しています。'
                                    : 'Built around hospitality, point-and-order tickets, and collectible culinary stamps.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <Link
                                href="/"
                                className="h-10 px-4 rounded-full bg-[#1C2822] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                            >
                                <span>{isJa ? 'マップを開く →' : 'Open Map →'}</span>
                            </Link>
                            <Link
                                href="/partner"
                                className="h-10 px-4 rounded-full bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                            >
                                <span>{isJa ? '店舗スタジオ →' : 'Partner Studio →'}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Side-by-Side: For Travelers vs. For Restaurants (Visible at a glance!) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: For Travelers */}
                        <div className="nani-well">
                            <div className="px-3.5 py-2 flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#16A34A]" />
                                    <span>
                                        {isJa
                                            ? '🌏 訪日ゲスト・旅人の使い方（3ステップ）'
                                            : '🌏 For Travelers (3 Simple Steps)'}
                                    </span>
                                </span>
                                <span className="text-[10.5px] font-bold text-[#15803D] bg-white/80 px-2.5 py-0.5 rounded-full">
                                    6 Languages
                                </span>
                            </div>

                            <div className="nani-sheet p-5 space-y-3.5">
                                {[
                                    {
                                        step: '01',
                                        title: isJa
                                            ? '母国語マップで「看板の一皿」と「歓迎特典」を発見'
                                            : "Discover a Chef's Signature Dish & Welcome Perk",
                                        desc: isJa
                                            ? '選んだ言語（英語・繁体字・韓国語・仏語・西語・日本語）に合わせてマップタイルも最適化。お店が一番食べてほしい1皿と歓迎特典がひと目でわかります。'
                                            : 'Map labels match your language. Instantly see each spot’s #1 signature dish and free welcome perk.',
                                    },
                                    {
                                        step: '02',
                                        title: isJa
                                            ? 'テーブルで「日本語の指差し注文票」を店員さんに提示'
                                            : 'Show the Interactive Japanese Order Ticket',
                                        desc: isJa
                                            ? '人数分の数量（1つ〜8つ）やサイドメニューを選んで店員さんに見せるだけ。言葉の壁ゼロで注文と歓迎特典の受け取りが完了します。'
                                            : 'Adjust quantity, add side dishes, and show the large Japanese ticket directly to staff.',
                                    },
                                    {
                                        step: '03',
                                        title: isJa
                                            ? '食後に「完食御朱印」を集めて9:16ストーリーズでシェア'
                                            : 'Collect Your Culinary Stamp & Share to Instagram',
                                        desc: isJa
                                            ? '母国語で書いた「ごちそうさま絵葉書」は日本語に自動翻訳されてシェフへ届き、朱印入りの記念ストーリーズ画像を保存できます。'
                                            : 'Send an auto-translated postcard to the chef and save a 9:16 Story card.',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-4 flex items-start gap-3"
                                    >
                                        <span className="size-7 rounded-[9px] bg-[#16A34A] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                            {item.step}
                                        </span>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-extrabold text-[#1C2822]">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-[#526358] leading-relaxed mt-1 font-medium">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: For Restaurant Owners */}
                        <div className="nani-well">
                            <div className="px-3.5 py-2 flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#16A34A]" />
                                    <span>
                                        {isJa
                                            ? '🏪 飲食店オーナー様の活用法（完全無料）'
                                            : '🏪 For Restaurant Owners (100% Free)'}
                                    </span>
                                </span>
                                <span className="text-[10.5px] font-bold text-[#15803D] bg-white/80 px-2.5 py-0.5 rounded-full">
                                    手数料 0円
                                </span>
                            </div>

                            <div className="nani-sheet p-5 space-y-3.5">
                                {[
                                    {
                                        step: '01',
                                        title: isJa
                                            ? '10秒のなりすまし防止認証（Instagram DM / 固定電話）'
                                            : '10-Second Anti-Spoofing Verification',
                                        desc: isJa
                                            ? '公式Instagramまたは店舗固定電話で6桁コードを確認し、第三者による勝手な書き換えを完全にブロックします。'
                                            : 'Verify via Official Instagram DM or store landline so only the real owner can edit.',
                                    },
                                    {
                                        step: '02',
                                        title: isJa
                                            ? '「看板の一皿」と「画面提示の歓迎特典」を登録するだけ'
                                            : 'Register Your Signature Dish & Welcome Perk',
                                        desc: isJa
                                            ? '面倒な細かいチェックシートは不要。自慢の1皿とちょっとした歓迎特典（ミニドリンク等）を入れるだけで、右側のスマホプレビュー通り6言語の注文票が自動生成されます。'
                                            : 'Just enter your best dish and a small welcome treat—we generate the multilingual order tickets.',
                                    },
                                    {
                                        step: '03',
                                        title: isJa
                                            ? '届いた絵葉書にひとこと返信 ＆ 卓上QRポップで自動集客'
                                            : 'Reply to Postcards & Print Your Table QR Stand',
                                        desc: isJa
                                            ? '旅人から届く感謝の絵葉書に日本語で返信すると英語へ自動翻訳され、次の訪日客が来店する強力な口コミになります。'
                                            : 'Reply in Japanese to build warm word-of-mouth that brings in more international guests.',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-4 flex items-start gap-3"
                                    >
                                        <span className="size-7 rounded-[9px] bg-[#1C2822] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                            {item.step}
                                        </span>
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-extrabold text-[#1C2822]">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-[#526358] leading-relaxed mt-1 font-medium">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Security & FAQ Section */}
                    <div className="nani-well">
                        <div className="px-3.5 py-2">
                            <span className="text-xs font-extrabold text-[#14532D]">
                                {isJa
                                    ? 'よくあるご質問・なりすまし対策・自動修復の仕組み (FAQ)'
                                    : 'Frequently Asked Questions & Security'}
                            </span>
                        </div>
                        <div className="nani-sheet p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    q: isJa
                                        ? 'Q. 店舗オーナーのなりすまし対策はどうなっていますか？'
                                        : 'Q. How do you prevent store owner spoofing?',
                                    a: isJa
                                        ? '公式Instagram DM・店舗固定電話・営業許可証の3段階OTPロックにより、本人確認をクリアしたオーナーのみが「公式オーナー認証店バッジ」と編集権限を取得できます。'
                                        : '3-tier OTP verification ensures only verified owners can edit store info.',
                                },
                                {
                                    q: isJa
                                        ? 'Q. 写真のリンク切れや情報変更はどうやって改善されますか？'
                                        : 'Q. How are broken images or outdated hours fixed?',
                                    a: isJa
                                        ? '常駐の「Self-Healing Guard」が画像エラーを検知した瞬間に代替写真へ自動切替し、自動修復スタジオ（/growth）で24時間データ整合性を監視・即時パッチ反映しています。'
                                        : 'Our Self-Healing Guard swaps broken images automatically and processes live updates.',
                                },
                                {
                                    q: isJa
                                        ? 'Q. GoogleマップやHappyCowとの違いは何ですか？'
                                        : 'Q. How is Vegan.jp different from HappyCow?',
                                    a: isJa
                                        ? '単なる検索ディレクトリではなく、「看板の一皿＋歓迎特典」「数量変更できる日本語注文チケット」「完食御朱印＆シェフとの絵葉書交流」で来店とSNS拡散を直結させています。'
                                        : 'We combine Signature Dishes, Welcome Perks, Japanese Order Tickets, and Collectible Stamps.',
                                },
                            ].map((faq, i) => (
                                <div
                                    key={i}
                                    className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-4 space-y-1.5"
                                >
                                    <h4 className="text-xs font-extrabold text-[#1C2822]">
                                        {faq.q}
                                    </h4>
                                    <p className="text-xs text-[#526358] leading-relaxed font-medium">
                                        {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
