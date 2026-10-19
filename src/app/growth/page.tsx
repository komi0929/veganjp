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
import type { StoreOfficialData } from '@/lib/types';

export default function GrowthStudioPage() {
    const [lang, setLang] = useState<NavLang>('ja');
    const [state, setState] = useState<GrowthTelemetryState | null>(null);
    const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
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
            const [res, ecoRes] = await Promise.all([
                fetch('/api/growth', { cache: 'no-store' }),
                fetch('/api/ecosystem', { cache: 'no-store' }),
            ]);
            if (res.ok) {
                const json = await res.json();
                setState(json);
            }
            if (ecoRes.ok) {
                const ecoJson = await ecoRes.json();
                if (ecoJson.stores) setStoresMap(ecoJson.stores);
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
    const activeOfficial = storesMap[selectedPlace.google_place_id] || null;
    const verifiedMenu = getEffectiveVerifiedMenu(selectedPlace, activeOfficial);
    const sigDish = verifiedMenu[0];
    const dishTitleJa = sigDish?.name_ja || 'シェフ特製 100%植物性 看板の一皿';
    const dishTitleEn = sigDish?.name_en || "Chef's Signature Plant-Based Dish";
    const perk = getEffectiveWelcomePerk(selectedPlace, activeOfficial);

    const generatedCaption = `【保存版】訪日ゲストにも日本のヴィーガンにも教えたい「${spotNameJa}」の看板メニュー🌱

🍽️ 看板の一皿：${dishTitleJa} (${dishTitleEn})
🎁 画面提示の歓迎特典：${perk.ja}
💮 食後はデジタル「完食御朱印」と絵葉書をシェフへ贈れます！

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
                    ? '1080×1920 (9:16) ストーリーズ用PNG画像を保存しました'
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
            // Ignore
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
        <div className="min-h-dvh bg-[#EEF7F2] text-[#1C2822] lg:grid lg:grid-cols-[248px_1fr]">
            <AppSidebar lang={lang} onLangChange={setLang} />

            <div className="flex flex-col min-h-dvh overflow-x-hidden">
                {toastMessage && (
                    <div className="fixed bottom-5 right-5 z-50 rounded-full bg-[#1C2822] text-white px-4 py-2.5 text-xs font-bold shadow-[0_10px_28px_rgba(20,40,30,0.22)] flex items-center gap-2 animate-fade-in">
                        <span className="size-2 rounded-full bg-[#22C55E]" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-20 max-w-6xl w-full mx-auto space-y-6">
                    {/* Top Header + Live Telemetry Summary Pills */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md rounded-[24px] p-4 sm:p-5 border border-[#DCECE3] shadow-[0_6px_20px_rgba(20,40,30,0.04)]">
                        <div className="flex items-center gap-3.5">
                            <div className="size-11 rounded-[14px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,0.25)] shrink-0">
                                <svg className="size-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1C2822]">
                                    {isJa
                                        ? 'Instagram 自動集客 ＆ 自己修復スタジオ'
                                        : 'Autonomous Viral Growth & Auto-Heal Studio'}
                                </h1>
                                <p className="text-xs font-medium text-[#526358] mt-0.5">
                                    {isJa
                                        ? '① 9:16ストーリーズ画像生成 → ② 旅人の御朱印から未登録店へ自動招待 → ③ 不具合の24時間セルフ修復'
                                        : '1. 9:16 Story Generator · 2. Unclaimed Store Auto-Invites · 3. 24/7 Self-Healing Engine'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="h-9 px-3.5 rounded-full bg-[#F7FBF8] border border-[#DCECE3] text-xs font-extrabold text-[#1C2822] flex items-center gap-1.5">
                                <span className="text-[#16A34A]">
                                    {state?.metrics?.postcards_issued ?? 48}
                                </span>
                                <span className="text-[#526358] font-semibold">
                                    {isJa ? '御朱印・絵葉書' : 'Postcards'}
                                </span>
                            </span>
                            <span className="h-9 px-3.5 rounded-full bg-[#F7FBF8] border border-[#DCECE3] text-xs font-extrabold text-[#1C2822] flex items-center gap-1.5">
                                <span className="text-[#16A34A]">
                                    {state?.metrics?.instagram_story_downloads ?? 34}
                                </span>
                                <span className="text-[#526358] font-semibold">
                                    {isJa ? 'ストーリーズ保存' : 'Story PNGs'}
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={handleRunDiagnostics}
                                disabled={isRunningHeal}
                                className="h-9 px-3.5 rounded-full bg-[#EEF7F2] hover:bg-[#DCECE3] text-xs font-extrabold text-[#14532D] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                                <span className="size-2 rounded-full bg-[#16A34A]" />
                                <span>
                                    {isRunningHeal
                                        ? isJa ? '診断中...' : 'Scanning...'
                                        : isJa
                                        ? `全${MASTER_PLACES.length}店 正常保護中`
                                        : `${MASTER_PLACES.length} Spots Healthy`}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* ─── 2-COLUMN WORKSPACE: Left 9:16 Story Studio / Right Store Invites + Self-Healing ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
                        {/* LEFT COLUMN: 9:16 Instagram Story & Referral Generator */}
                        <div className="nani-well">
                            <div className="px-3.5 py-2 flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#16A34A]" />
                                    <span>
                                        {isJa
                                            ? 'STEP 1: 9:16 Instagram ストーリーズ画像 ＆ 紹介リンク生成'
                                            : 'STEP 1: 9:16 Instagram Story & Referral Generator'}
                                    </span>
                                </span>
                                <span className="text-[11px] font-bold text-[#15803D] bg-white/80 px-2.5 py-0.5 rounded-full">
                                    1080 × 1920 PNG
                                </span>
                            </div>

                            <div className="nani-sheet p-5 sm:p-6 space-y-5">
                                {/* Store & Credit Inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                            {isJa
                                                ? '紹介する店舗（看板の一皿＆歓迎特典を自動取得）'
                                                : 'Select Featured Restaurant'}
                                        </label>
                                        <select
                                            value={selectedPlaceId}
                                            onChange={(e) => setSelectedPlaceId(e.target.value)}
                                            className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-extrabold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
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
                                            className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                        {isJa
                                            ? 'ストーリーズ画像に入れる推薦コメント（リアルタイム反映）'
                                            : 'Headline Quote on Story Postcard'}
                                    </label>
                                    <input
                                        type="text"
                                        value={customQuote}
                                        onChange={(e) => setCustomQuote(e.target.value)}
                                        className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-white px-3.5 text-xs font-semibold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                    />
                                </div>

                                {/* Large 9:16 Story Card Live Preview + Ready-to-Post Caption */}
                                <div className="rounded-[20px] bg-[#F7FBF8] border border-[#DCECE3] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[204px_1fr] gap-5 items-stretch">
                                    {/* High-Impact 9:16 Washi Postcard Mockup */}
                                    <div className="w-[204px] h-[348px] mx-auto rounded-[22px] bg-[#1C2822] p-2.5 flex flex-col shadow-[0_12px_30px_rgba(20,40,30,0.18)] select-none shrink-0">
                                        <div className="flex-1 rounded-[16px] bg-[#FAF7F0] border-2 border-[#E5DEC9] p-3.5 flex flex-col justify-between relative overflow-hidden">
                                            {/* Top Ribbon & Vermilion Stamp */}
                                            <div className="flex items-start justify-between gap-1">
                                                <span className="text-[8.5px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#16A34A] text-white">
                                                    VEGAN.JP 御朱印帳
                                                </span>
                                                <div className="size-11 rounded-full border-2 border-[#DC2626] bg-white/95 flex flex-col items-center justify-center text-[#DC2626] rotate-[-8deg] shrink-0 shadow-2xs">
                                                    <span className="text-[6px] font-black">VEGAN.JP</span>
                                                    <span className="text-[8px] font-black leading-none my-0.5">
                                                        完食御朱印
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Store & Dish Info */}
                                            <div className="space-y-2 my-auto pt-1">
                                                <div>
                                                    <p className="text-[9px] font-bold text-[#526358]">
                                                        📍 {selectedPlace.area || 'Japan'}
                                                    </p>
                                                    <h4 className="text-xs font-black text-[#1C2822] leading-snug line-clamp-2">
                                                        {spotNameJa}
                                                    </h4>
                                                </div>

                                                <div className="rounded-[10px] bg-white border border-[#E5DEC9] p-2 space-y-0.5">
                                                    <span className="text-[8px] font-extrabold text-[#15803D]">
                                                        👑 看板の一皿
                                                    </span>
                                                    <p className="text-[10px] font-extrabold text-[#1C2822] line-clamp-2 leading-tight">
                                                        {dishTitleJa}
                                                    </p>
                                                </div>

                                                <div className="rounded-[10px] bg-[#EEF7F2] border border-[#C5DDD0] p-2">
                                                    <span className="block text-[7.5px] font-extrabold text-[#15803D]">
                                                        🎁 画面提示の歓迎特典
                                                    </span>
                                                    <p className="text-[8.5px] font-bold text-[#1C2822] line-clamp-2 leading-tight mt-0.5">
                                                        {perk.ja}
                                                    </p>
                                                </div>

                                                <p className="text-[9px] text-[#3D5245] font-medium line-clamp-3 leading-snug italic pt-0.5">
                                                    “{customQuote}”
                                                </p>
                                            </div>

                                            <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-[8px] font-extrabold text-[#526358]">
                                                <span>{authorHandle}</span>
                                                <span className="text-[#15803D]">vegan.jp ↗</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Caption + Action Buttons */}
                                    <div className="flex flex-col justify-between space-y-3">
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-extrabold text-[#1C2822]">
                                                    {isJa
                                                        ? 'Instagram 投稿キャプション＆直通URL'
                                                        : 'Auto-Generated Caption & Deep Link'}
                                                </span>
                                                <span className="text-[10.5px] font-bold text-[#16A34A]">
                                                    {isJa ? 'そのまま貼り付けOK' : 'Ready to paste'}
                                                </span>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={generatedCaption}
                                                rows={10}
                                                className="w-full flex-1 rounded-[14px] border border-[#DCECE3] bg-white p-3.5 text-xs leading-relaxed text-[#1C2822] font-medium resize-none focus:outline-none"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopyText('main_caption', generatedCaption)
                                                }
                                                className="h-11 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-[#1C2822] font-bold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                                            >
                                                <span>
                                                    {copiedKey === 'main_caption'
                                                        ? isJa ? '✓ コピー完了' : '✓ Copied'
                                                        : isJa ? '紹介文とURLをコピー' : 'Copy Caption & URL'}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDownloadStory}
                                                disabled={isGeneratingPng}
                                                className="h-11 px-5 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs flex items-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <span>
                                                    {isGeneratingPng
                                                        ? isJa ? '描画中...' : 'Rendering...'
                                                        : isJa
                                                        ? 'ストーリーズ画像 (9:16) を保存 ↓'
                                                        : 'Download 9:16 Story PNG ↓'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Auto-Invites + Self-Healing Engine (Visible at a glance!) */}
                        <div className="space-y-6">
                            {/* Card 1: Auto-Generated Store Owner Invitations */}
                            <div className="nani-well">
                                <div className="px-3.5 py-2 flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#16A34A]" />
                                        <span>
                                            {isJa
                                                ? 'STEP 2: 未登録オーナーへの自動招待状'
                                                : 'STEP 2: Auto-Generated Store Invites'}
                                        </span>
                                    </span>
                                    <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-[#16A34A] text-white">
                                        {state?.viral_invites?.length ?? 2} {isJa ? '店 待機中' : 'Pending'}
                                    </span>
                                </div>

                                <div className="nani-sheet p-4 sm:p-5 space-y-3">
                                    <p className="text-xs text-[#526358] font-medium leading-relaxed">
                                        {isJa
                                            ? '旅人が未認証の店舗へ「ごちそうさま絵葉書」を送ると、ロック解除URL付きのDM招待文が自動生成されます。'
                                            : 'When travelers send postcards to unclaimed restaurants, an unlock link & DM invite are generated automatically.'}
                                    </p>

                                    <div className="space-y-2.5">
                                        {(state?.viral_invites || []).map((inv) => (
                                            <div
                                                key={inv.place_id}
                                                className="rounded-[14px] border border-[#DCECE3] bg-[#F7FBF8] p-3.5 space-y-2"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-extrabold text-[#1C2822] truncate">
                                                        {inv.place_name}
                                                    </span>
                                                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D] shrink-0">
                                                        絵葉書 {inv.pending_postcards_count}通
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#526358] line-clamp-1">
                                                    “{inv.latest_traveler_quote}”
                                                </p>
                                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                                    <span className="text-[10.5px] font-mono font-bold text-[#526358]">
                                                        {inv.instagram_handle.replace(/^@+/, '@')}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopyText(
                                                                    inv.place_id,
                                                                    inv.dm_template_ja
                                                                )
                                                            }
                                                            className="h-8 px-3 rounded-full border border-[#C5DDD0] bg-white hover:bg-[#EEF7F2] text-[11px] font-bold text-[#1C2822] active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            {copiedKey === inv.place_id
                                                                ? '✓ コピー済'
                                                                : '招待DMをコピー'}
                                                        </button>
                                                        <Link
                                                            href={inv.invite_url}
                                                            className="h-8 px-3 rounded-full bg-[#16A34A] text-white text-[11px] font-bold flex items-center active:scale-95 transition-all"
                                                        >
                                                            確認 →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: 24/7 Self-Healing Diagnostics & 10-Second Patch Form */}
                            <div className="nani-well">
                                <div className="px-3.5 py-2 flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#16A34A]" />
                                        <span>
                                            {isJa
                                                ? 'STEP 3: 24時間セルフ修復 ＆ 10秒修正レポート'
                                                : 'STEP 3: 24/7 Self-Healing & Instant Fix'}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRunDiagnostics}
                                        className="text-[11px] font-bold text-[#15803D] bg-white/80 hover:bg-white px-2.5 py-0.5 rounded-full cursor-pointer"
                                    >
                                        {isJa ? '今すぐスキャン ↻' : 'Scan Now ↻'}
                                    </button>
                                </div>

                                <div className="nani-sheet p-4 sm:p-5 space-y-3.5">
                                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                        {(state?.healing_events || []).slice(0, 3).map((ev) => (
                                            <div
                                                key={ev.id}
                                                className="rounded-[12px] bg-[#F2F9F5] border border-[#DCECE3] p-3 text-xs"
                                            >
                                                <div className="flex items-center justify-between gap-2 font-bold text-[#14532D]">
                                                    <span className="truncate">✓ {ev.title_ja}</span>
                                                </div>
                                                <p className="text-[11px] text-[#526358] mt-0.5 line-clamp-2">
                                                    {ev.detail_ja}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <form
                                        onSubmit={handleReportIssue}
                                        className="pt-2.5 border-t border-[#EDF5F0] space-y-2"
                                    >
                                        <label className="block text-[11px] font-bold text-[#526358]">
                                            {isJa
                                                ? '営業時間・メニュー変更・不具合の10秒パッチ送信'
                                                : 'Submit 10-Second Spot Update or Bug Report'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={issuePlaceId}
                                                onChange={(e) => setIssuePlaceId(e.target.value)}
                                                className="h-9 rounded-[10px] border border-[#DCECE3] bg-[#F7FBF8] px-2.5 text-xs font-bold text-[#1C2822]"
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
                                                className="h-9 rounded-[10px] border border-[#DCECE3] bg-[#F7FBF8] px-2.5 text-xs font-bold text-[#1C2822]"
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
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={issueDescription}
                                                onChange={(e) => setIssueDescription(e.target.value)}
                                                placeholder={
                                                    isJa
                                                        ? '例: 日曜のラストオーダーが20:30に変更'
                                                        : 'e.g. Sunday hours changed to 20:30'
                                                }
                                                className="flex-1 h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs font-medium text-[#1C2822]"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isRunningHeal}
                                                className="h-9 px-4 rounded-full bg-[#1C2822] text-white text-xs font-bold active:scale-95 transition-all shrink-0 cursor-pointer"
                                            >
                                                {isJa ? '即時反映' : 'Apply'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
