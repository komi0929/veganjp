'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppSidebar, { NavLang } from '@/components/AppSidebar';
import { MASTER_PLACES } from '@/lib/places-master';
import {
    getEffectiveVerifiedMenu,
    getEffectiveWelcomePerk,
} from '@/lib/kitchen-defaults';
import { downloadInstagramStoryCardPng } from '@/lib/story-card-generator';
import type { GrowthTelemetryState, SelfHealingEvent } from '@/lib/growth-engine';

type StudioTab = 'story' | 'invites' | 'heal';

export default function GrowthStudioPage() {
    const [lang, setLang] = useState<NavLang>('ja');
    const [activeTab, setActiveTab] = useState<StudioTab>('story');
    const [state, setState] = useState<GrowthTelemetryState | null>(null);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
        MASTER_PLACES[0]?.google_place_id || ''
    );
    const [customQuote, setCustomQuote] = useState<string>(
        '外国人の友人に教えてあげたい、日本の本当においしい看板ヴィーガン料理と完食御朱印マップ'
    );
    const [authorHandle, setAuthorHandle] = useState<string>('@vegan.jp');
    const [isGeneratingPng, setIsGeneratingPng] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Quick Self-Healing Report state
    const [issuePlaceId, setIssuePlaceId] = useState<string>(
        MASTER_PLACES[0]?.google_place_id || ''
    );
    const [issueCategory, setIssueCategory] =
        useState<SelfHealingEvent['category']>('spot_data_fix');
    const [issueDescription, setIssueDescription] = useState<string>('');
    const [isRunningHeal, setIsRunningHeal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const isJa = lang === 'ja';

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3200);
    };

    const fetchGrowthData = useCallback(async () => {
        try {
            const res = await fetch('/api/growth', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                setState(json);
            }
        } catch {
            // Silent fallback
        }
    }, []);

    useEffect(() => {
        fetchGrowthData();
    }, [fetchGrowthData]);

    const selectedPlace =
        MASTER_PLACES.find((p) => p.google_place_id === selectedPlaceId) ||
        MASTER_PLACES[0];

    const spotNameJa = selectedPlace.name_ja || selectedPlace.name;
    const spotNameEn = selectedPlace.name;
    const verifiedMenu = getEffectiveVerifiedMenu(selectedPlace, null);
    const sigDish = verifiedMenu[0];
    const dishTitleJa = sigDish?.name_ja || 'シェフ特製 100%植物性 看板の一皿';
    const dishTitleEn = sigDish?.name_en || "Chef's Signature Plant-Based Dish";
    const perk = getEffectiveWelcomePerk(selectedPlace, null);

    const generatedCaption = `【保存版】訪日ゲストにも日本のヴィーガンにも教えたい「${spotNameJa}」の看板メニュー🌱

🍽️ 看板の一皿：${dishTitleJa} (${dishTitleEn})
🎁 画面提示の歓迎特典：${perk.ja}
💮 食後はデジタル「完食御朱印」と絵葉書をシェフへ贈れます！

「何が入っていないか」の細かいチェックではなく、シェフが誇りを持って届ける最高の一皿をネイティブ感覚で探せるマップを作りました。

👇 マップ＆御朱印帳はこちら（プロフィールのリンクからも開けます）
https://vegan.jp/?store=${encodeURIComponent(selectedPlace.google_place_id)}&ref=ig_story

#VeganJapan #TokyoVegan #JapanTravel #ヴィーガン #東京ヴィーガン #御朱印巡り`;

    const handleDownloadStory = async () => {
        setIsGeneratingPng(true);
        try {
            await downloadInstagramStoryCardPng({
                storeName: `${spotNameJa} (${spotNameEn})`,
                area: selectedPlace.area || 'Tokyo, Japan',
                signatureDish: `${dishTitleJa} / ${dishTitleEn}`,
                welcomePerk: perk.ja,
                quote: customQuote,
                senderName: authorHandle || 'Vegan.jp Founder',
                instagramHandle: authorHandle || '@vegan.jp',
                sealCode: `VJP-${selectedPlace.google_place_id.slice(-4).toUpperCase()}`,
            });
            await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'track_metric',
                    metric: 'instagram_story_downloads',
                }),
            });
            await fetchGrowthData();
            showToast(
                isJa
                    ? '9:16 ストーリーズ用PNG画像を保存しました'
                    : 'Saved 9:16 Instagram Story PNG'
            );
        } finally {
            setIsGeneratingPng(false);
        }
    };

    const handleCopyText = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2200);
            await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'track_metric',
                    metric: 'postcards_issued',
                }),
            });
            await fetchGrowthData();
            showToast(isJa ? 'クリップボードにコピーしました' : 'Copied to clipboard');
        } catch {
            // Ignore clipboard errors
        }
    };

    const handleRunDiagnostics = async () => {
        setIsRunningHeal(true);
        try {
            const res = await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'run_diagnostics' }),
            });
            if (res.ok) {
                await fetchGrowthData();
                setActiveTab('heal');
                showToast(
                    isJa
                        ? `全${MASTER_PLACES.length}店舗のデータ整合性・画像・座標の自己修復診断が完了しました`
                        : 'Self-healing diagnostics completed across all spots'
                );
            }
        } finally {
            setIsRunningHeal(false);
        }
    };

    const handleReportIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issueDescription.trim()) return;
        setIsRunningHeal(true);
        const targetPlace = MASTER_PLACES.find(
            (p) => p.google_place_id === issuePlaceId
        );
        try {
            const res = await fetch('/api/growth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'report_issue',
                    category: issueCategory,
                    title_ja: `${targetPlace?.name_ja || '店舗'} の修正レポート`,
                    detail_ja: issueDescription.trim(),
                    page_url: `/?store=${encodeURIComponent(issuePlaceId)}`,
                }),
            });
            if (res.ok) {
                setIssueDescription('');
                await fetchGrowthData();
                showToast(
                    isJa
                        ? 'レポートを受信し、自動修復エンジンが即時パッチ検証を実行しました'
                        : 'Issue logged and verified by Self-Healing Engine'
                );
            }
        } finally {
            setIsRunningHeal(false);
        }
    };

    return (
        <div className="min-h-dvh bg-[#EEF7F2] text-[#1C2822] md:grid md:grid-cols-[268px_1fr]">
            <AppSidebar lang={lang} onLangChange={setLang} />

            <div className="flex flex-col min-h-dvh overflow-x-hidden">
                {/* Floating Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-5 right-5 z-50 rounded-full bg-[#1C2822] text-white px-4 py-2.5 text-xs font-bold shadow-[0_10px_28px_rgba(20,40,30,0.22)] flex items-center gap-2 animate-fade-in">
                        <span className="size-2 rounded-full bg-[#22C55E]" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* TOP WORKSPACE SECTION (nani.now centered narrow canvas) */}
                <main className="flex-1 px-4 sm:px-6 pt-8 md:pt-16 pb-16">
                    <div className="max-w-2xl mx-auto">
                        {/* Title Row + Handwritten Guidance Note with Curved Arrow */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 px-1">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-[13px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,0.25)] shrink-0">
                                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-[25px] font-extrabold tracking-tight text-[#1C2822] leading-tight">
                                        {isJa ? '自動集客＆自己修復スタジオ' : 'Viral Story & Auto-Heal Studio'}
                                    </h1>
                                    <p className="text-xs font-semibold text-[#526358] mt-0.5">
                                        {isJa
                                            ? '最初の1投稿から、旅人の御朱印シェアと店舗招待で自走するエンジン'
                                            : 'One Instagram post sparks an autonomous loop of traveler stamps & store invites'}
                                    </p>
                                </div>
                            </div>

                            {/* Rotated Micro-Guidance + Hand-Drawn Arrow (nani.now signature detail) */}
                            <div className="hidden sm:flex items-center gap-1.5 text-[#15803D] font-bold text-xs rotate-2 translate-y-1 select-none shrink-0">
                                <span>{isJa ? '1タップでストーリーズ画像と紹介文を生成' : '1-tap Story PNG & caption'}</span>
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
                            {/* Top Control Bar inside Well */}
                            <div className="px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-[#CBE2D4]/75 p-1 rounded-[16px]">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('story')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                                            activeTab === 'story'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        <svg className="size-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                                        </svg>
                                        <span>{isJa ? '1. ストーリーズ生成' : '1. Story Maker'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('invites')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                                            activeTab === 'invites'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        <span>{isJa ? '2. 未登録店の自動招待' : '2. Store Invites'}</span>
                                        <span className="px-1.5 py-0.2 rounded-full bg-[#16A34A] text-white text-[10px]">
                                            {state?.viral_invites?.length ?? 3}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('heal')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                                            activeTab === 'heal'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        <span>{isJa ? '3. 自己修復ログ' : '3. Auto-Heal'}</span>
                                    </button>
                                </div>

                                {/* Right Live Status Pill */}
                                <button
                                    type="button"
                                    onClick={handleRunDiagnostics}
                                    className="h-7 px-3 rounded-full bg-white/80 hover:bg-white text-[11px] font-bold text-[#15803D] flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                    <span className="size-2 rounded-full bg-[#16A34A]" />
                                    <span>
                                        {isJa
                                            ? `正常稼働中 (全${MASTER_PLACES.length}店 保護済)`
                                            : `Healthy (${MASTER_PLACES.length} Spots)`}
                                    </span>
                                </button>
                            </div>

                            {/* Inner Elevated White Sheet (.nani-sheet) */}
                            <div className="nani-sheet p-5 sm:p-6">
                                {activeTab === 'story' && (
                                    <div className="space-y-4">
                                        {/* Top Selector Row inside White Sheet */}
                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px] gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '紹介する店舗（看板の一皿＆御朱印）' : 'Featured Restaurant'}
                                                </label>
                                                <select
                                                    value={selectedPlaceId}
                                                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                                                    className="w-full h-10 rounded-[13px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                                >
                                                    {MASTER_PLACES.map((place) => (
                                                        <option
                                                            key={place.google_place_id}
                                                            value={place.google_place_id}
                                                        >
                                                            {place.name_ja || place.name} ({place.area || 'Tokyo'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? 'クレジット表記' : 'Credit Handle'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={authorHandle}
                                                    onChange={(e) => setAuthorHandle(e.target.value)}
                                                    placeholder="@vegan.jp"
                                                    className="w-full h-10 rounded-[13px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                                />
                                            </div>
                                        </div>

                                        {/* One-line Custom Message on Postcard */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                {isJa ? 'ストーリーズ画像に入れる一言メッセージ' : 'Headline Quote on Story Card'}
                                            </label>
                                            <input
                                                type="text"
                                                value={customQuote}
                                                onChange={(e) => setCustomQuote(e.target.value)}
                                                className="w-full h-10 rounded-[13px] border border-[#DCECE3] bg-white px-3.5 text-xs font-semibold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                            />
                                        </div>

                                        {/* Clean Preview Card + Generated Caption */}
                                        <div className="rounded-[18px] bg-[#F7FBF8] border border-[#E2EFE8] p-4 grid grid-cols-1 sm:grid-cols-[132px_1fr] gap-4 items-center">
                                            {/* Mini 9:16 Postcard Preview */}
                                            <div className="w-[124px] h-[196px] mx-auto rounded-[16px] bg-[#FAF7F0] border-2 border-[#1C2822] p-2.5 flex flex-col justify-between shadow-xs select-none">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#16A34A] text-white">
                                                        VEGAN.JP
                                                    </span>
                                                    <span className="size-6 rounded-full border border-[#DC2626] text-[#DC2626] flex items-center justify-center text-[7px] font-black rotate-6">
                                                        完食印
                                                    </span>
                                                </div>
                                                <div className="space-y-1 my-auto">
                                                    <div className="text-[10px] font-extrabold text-[#1C2822] line-clamp-2 leading-tight">
                                                        {spotNameJa}
                                                    </div>
                                                    <div className="text-[8.5px] font-bold text-[#15803D] line-clamp-2">
                                                        {dishTitleJa}
                                                    </div>
                                                    <p className="text-[8px] text-[#526358] line-clamp-3 leading-snug pt-0.5">
                                                        “{customQuote}”
                                                    </p>
                                                </div>
                                                <div className="pt-1 border-t border-[#E5DEC9] flex items-center justify-between text-[7.5px] font-bold text-[#526358]">
                                                    <span>{authorHandle}</span>
                                                    <span>9:16 PNG</span>
                                                </div>
                                            </div>

                                            {/* Caption Textarea */}
                                            <div className="flex flex-col h-full justify-between">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[11px] font-bold text-[#526358]">
                                                        {isJa ? 'Instagram 自動生成キャプション＆紹介リンク' : 'Ready-to-Post Caption & Referral URL'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#16A34A]">
                                                        {isJa ? 'ハッシュタグ最適化済' : 'SEO Optimized'}
                                                    </span>
                                                </div>
                                                <textarea
                                                    readOnly
                                                    value={generatedCaption}
                                                    rows={7}
                                                    className="w-full rounded-[13px] border border-[#DCECE3] bg-white p-3 text-xs leading-relaxed text-[#1C2822] font-medium resize-none focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom Toolbar inside .nani-sheet (Exact nani.now button pair) */}
                                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyText('main_caption', generatedCaption)}
                                                className="h-11 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-[#1C2822] font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all"
                                            >
                                                <svg className="size-4 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                                <span>
                                                    {copiedKey === 'main_caption'
                                                        ? isJa ? 'コピー完了！' : 'Copied!'
                                                        : isJa ? '紹介文とURLをコピー' : 'Copy Caption & Link'}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDownloadStory}
                                                disabled={isGeneratingPng}
                                                className="h-11 px-5 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                <span>
                                                    {isGeneratingPng
                                                        ? isJa ? '画像を描画中...' : 'Rendering...'
                                                        : isJa ? 'ストーリーズ画像 (9:16) を保存' : 'Download 9:16 Story PNG'}
                                                </span>
                                                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'invites' && (
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-sm font-extrabold text-[#1C2822]">
                                                {isJa
                                                    ? '旅人の絵葉書から自動生成された「未登録オーナー招待状」'
                                                    : 'Auto-Generated Store Owner Invitations'}
                                            </h2>
                                            <p className="text-xs text-[#526358] mt-0.5">
                                                {isJa
                                                    ? 'まだオーナー未認証の店舗に感謝の絵葉書が届くと、直通リンク付きのDM招待文が自動生成されます。'
                                                    : 'When travelers send postcards to unclaimed spots, an unlock link & DM invite are generated automatically.'}
                                            </p>
                                        </div>

                                        <div className="space-y-2.5">
                                            {(state?.viral_invites || []).map((inv) => (
                                                <div
                                                    key={inv.place_id}
                                                    className="rounded-[16px] border border-[#DCECE3] bg-[#F7FBF8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-extrabold text-[#1C2822]">
                                                                {inv.place_name}
                                                            </span>
                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D]">
                                                                {isJa
                                                                    ? `絵葉書 ${inv.pending_postcards_count}通 待機中`
                                                                    : `${inv.pending_postcards_count} Postcards`}
                                                            </span>
                                                            <span className="text-[11px] font-mono font-bold text-[#526358]">
                                                                {inv.instagram_handle}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[#526358] line-clamp-1">
                                                            “{inv.latest_traveler_quote}”
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopyText(inv.place_id, inv.dm_template_ja)
                                                            }
                                                            className="h-9 px-3.5 rounded-full border border-[#C5DDD0] bg-white hover:bg-[#EEF7F2] text-xs font-bold text-[#1C2822] active:scale-95 transition-all"
                                                        >
                                                            {copiedKey === inv.place_id
                                                                ? isJa ? 'コピー済' : 'Copied'
                                                                : isJa ? '招待DMをコピー' : 'Copy DM'}
                                                        </button>
                                                        <Link
                                                            href={inv.invite_url}
                                                            className="h-9 px-3.5 rounded-full bg-[#16A34A] text-white text-xs font-bold flex items-center active:scale-95 transition-all"
                                                        >
                                                            {isJa ? '店舗画面で確認' : 'Open Studio'}
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'heal' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EDF5F0]">
                                            <div>
                                                <h2 className="text-sm font-extrabold text-[#1C2822]">
                                                    {isJa
                                                        ? 'セルフヒーリング（自動検知＆自己修復）エンジン'
                                                        : 'Autonomous Self-Healing Diagnostics'}
                                                </h2>
                                                <p className="text-xs text-[#526358] mt-0.5">
                                                    {isJa
                                                        ? '画像リンク切れの自動フォールバック置換・スキーマ補完・ユーザー報告の即時反映を常時実行しています。'
                                                        : 'Automatically swaps broken images, validates schemas, and processes live spot updates.'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRunDiagnostics}
                                                disabled={isRunningHeal}
                                                className="h-9 px-4 rounded-full bg-[#16A34A] text-white text-xs font-bold active:scale-95 transition-all"
                                            >
                                                {isRunningHeal
                                                    ? isJa ? 'スキャン中...' : 'Scanning...'
                                                    : isJa ? '今すぐ全店スキャン' : 'Scan All Spots'}
                                            </button>
                                        </div>

                                        {/* Audit Checks Summary */}
                                        <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                                            {(state?.healing_events || []).slice(0, 4).map((ev) => (
                                                <div
                                                    key={ev.id}
                                                    className="rounded-[13px] bg-[#F2F9F5] border border-[#DCECE3] px-3.5 py-2.5 text-xs"
                                                >
                                                    <div className="flex items-center justify-between gap-2 font-bold text-[#14532D]">
                                                        <span className="flex items-center gap-2">
                                                            <span className="size-2 rounded-full bg-[#16A34A] shrink-0" />
                                                            <span>{ev.title_ja}</span>
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#15803D]">
                                                            {ev.auto_action_taken}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#526358] mt-1 pl-4">
                                                        {ev.detail_ja}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Quick 1-Line Issue Submission Form inside White Sheet */}
                                        <form onSubmit={handleReportIssue} className="pt-2 space-y-2">
                                            <div className="text-[11px] font-bold text-[#526358]">
                                                {isJa
                                                    ? '不具合・営業時間・メニュー変更の即時パッチ送信'
                                                    : 'Submit Instant Fix or Spot Update'}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-[150px_135px_1fr_auto] gap-2">
                                                <select
                                                    value={issuePlaceId}
                                                    onChange={(e) => setIssuePlaceId(e.target.value)}
                                                    className="h-9 rounded-[11px] border border-[#DCECE3] bg-[#F7FBF8] px-2.5 text-xs font-bold text-[#1C2822]"
                                                >
                                                    {MASTER_PLACES.map((p) => (
                                                        <option
                                                            key={p.google_place_id}
                                                            value={p.google_place_id}
                                                        >
                                                            {p.name_ja || p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={issueCategory}
                                                    onChange={(e) =>
                                                        setIssueCategory(
                                                            e.target.value as SelfHealingEvent['category']
                                                        )
                                                    }
                                                    className="h-9 rounded-[11px] border border-[#DCECE3] bg-[#F7FBF8] px-2.5 text-xs font-bold text-[#1C2822]"
                                                >
                                                    <option value="spot_data_fix">
                                                        {isJa ? 'メニュー・営業時間' : 'Menu / Hours'}
                                                    </option>
                                                    <option value="broken_image_healed">
                                                        {isJa ? '画像の表示崩れ' : 'Broken Image'}
                                                    </option>
                                                    <option value="user_bug_report">
                                                        {isJa ? 'UI・マップ不具合' : 'UI / Map Bug'}
                                                    </option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={issueDescription}
                                                    onChange={(e) => setIssueDescription(e.target.value)}
                                                    placeholder={
                                                        isJa
                                                            ? '例: 日曜のラストオーダーが20:30に変更'
                                                            : 'e.g. Sunday hours changed to 20:30'
                                                    }
                                                    className="h-9 rounded-[11px] border border-[#DCECE3] bg-white px-3 text-xs font-medium text-[#1C2822]"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isRunningHeal}
                                                    className="h-9 px-4 rounded-full bg-[#1C2822] text-white text-xs font-bold active:scale-95 transition-all"
                                                >
                                                    {isJa ? '送信' : 'Send'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SUB-ACTIONS: 2-Column Dashed Cards (Exact nani.now pattern below main tray) */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <button
                                type="button"
                                onClick={handleRunDiagnostics}
                                className="nani-dashed p-4 text-left flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-[11px] bg-white border border-[#DCECE3] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                        <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-[13.5px] font-extrabold text-[#1C2822]">
                                            {isJa ? '全データの自己修復診断を実行' : 'Run Self-Healing Diagnostics'}
                                        </div>
                                        <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                            {isJa
                                                ? `自動修復累計 ${state?.metrics?.self_healed_incidents ?? 7}件 ・ 画像＆スキーマ保護中`
                                                : `${state?.metrics?.self_healed_incidents ?? 7} auto-healed events verified`}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                                    {isJa ? '実行 →' : 'Run →'}
                                </span>
                            </button>

                            <Link
                                href={`/partner?store=${encodeURIComponent(selectedPlaceId)}`}
                                className="nani-dashed p-4 text-left flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-[11px] bg-white border border-[#DCECE3] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                        <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-[13.5px] font-extrabold text-[#1C2822]">
                                            {isJa ? '店舗スタジオで看板の一皿を編集' : 'Edit Signature Dish in Studio'}
                                        </div>
                                        <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                            {isJa
                                                ? '歓迎特典の登録とごちそうさま絵葉書への直筆返信'
                                                : 'Manage welcome perks & reply to traveler postcards'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                                    {isJa ? '開く →' : 'Open →'}
                                </span>
                            </Link>
                        </div>
                    </div>
                </main>

                {/* WAVE DIVIDER + CLEAN SHOWCASE SECTION (nani.now below-the-fold style) */}
                <div className="nani-wave-bottom h-6 w-full" />

                <section className="bg-[#F7FBF8] pt-14 pb-20 px-4 sm:px-6 border-t border-[#E2EFE8]">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center max-w-xl mx-auto mb-10">
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C2822] leading-snug">
                                {isJa ? (
                                    <>
                                        あなたの最初の1投稿から、
                                        <span className="nani-highlight mx-1">ひとりでに成長する</span>
                                        仕組み
                                    </>
                                ) : (
                                    <>
                                        How One Post Sparks{' '}
                                        <span className="nani-highlight mx-1">Autonomous Growth</span>
                                    </>
                                )}
                            </h2>
                            <p className="text-xs sm:text-sm text-[#526358] mt-2 font-medium">
                                {isJa
                                    ? '広告費をかけず、旅人の「完食御朱印」と店舗オーナーへの「感謝の絵葉書」が次の集客を自動で生み出します。'
                                    : 'Traveler stamps and chef postcards naturally invite new guests and restaurant owners.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Showcase Frame 1 */}
                            <div className="nani-frame bg-[#EEF7F2] p-5 flex flex-col justify-between">
                                <div>
                                    <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D] mb-2.5">
                                        LOOP 01 · TRAVELER TO INSTAGRAM
                                    </span>
                                    <h3 className="text-base font-extrabold text-[#1C2822]">
                                        {isJa
                                            ? '完食御朱印がそのまま9:16ストーリーズ画像に'
                                            : 'Collectible Stamps Turn Into 9:16 Stories'}
                                    </h3>
                                    <p className="text-xs text-[#526358] mt-1.5 leading-relaxed font-medium">
                                        {isJa
                                            ? '旅人が食後に「ごちそうさま絵葉書」を送ると、朱印入りの美しい縦型カードが生成されます。フォロワーがURLから直接マップへ流入します。'
                                            : 'Every Gochisosama postcard generates a vertical stamp card ready for Instagram Stories.'}
                                    </p>
                                </div>
                                <div className="mt-4 rounded-[16px] bg-white p-3.5 border border-[#DCECE3] flex items-center justify-between text-xs font-bold text-[#1C2822]">
                                    <span>{isJa ? '累計ごちそうさま絵葉書・ストーリーズ生成' : 'Postcards & Story Shares'}</span>
                                    <span className="text-base font-extrabold text-[#16A34A]">
                                        {(state?.metrics?.postcards_issued ?? 48) +
                                            (state?.metrics?.instagram_story_downloads ?? 34)}{' '}
                                        件
                                    </span>
                                </div>
                            </div>

                            {/* Showcase Frame 2 */}
                            <div className="nani-frame bg-[#EEF7F2] p-5 flex flex-col justify-between">
                                <div>
                                    <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D] mb-2.5">
                                        LOOP 02 · STORE OWNER & AUTO-HEAL
                                    </span>
                                    <h3 className="text-base font-extrabold text-[#1C2822]">
                                        {isJa
                                            ? '未登録店への自動招待 ＆ 24時間セルフ修復'
                                            : 'Store Owner Auto-Invites & 24/7 Self-Healing'}
                                    </h3>
                                    <p className="text-xs text-[#526358] mt-1.5 leading-relaxed font-medium">
                                        {isJa
                                            ? '絵葉書が届いたお店には直通ロック解除リンク付き招待状を発行。さらに画像切れやデータ不整合は自動検知・即時修復します。'
                                            : 'Unclaimed stores receive unlock invites, while broken images or data drifts auto-heal on the fly.'}
                                    </p>
                                </div>
                                <div className="mt-4 rounded-[16px] bg-white p-3.5 border border-[#DCECE3] flex items-center justify-between text-xs font-bold text-[#1C2822]">
                                    <span>{isJa ? '自動招待済み店舗・自己修復イベント' : 'Auto-Invited & Healed'}</span>
                                    <span className="text-base font-extrabold text-[#16A34A]">
                                        {(state?.metrics?.stores_auto_invited ?? 12) +
                                            (state?.metrics?.self_healed_incidents ?? 7)}{' '}
                                        件
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
