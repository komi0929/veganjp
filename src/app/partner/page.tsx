'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import AppSidebar, { NavLang } from '@/components/AppSidebar';
import type {
    Place,
    StoreOfficialData,
    GratitudeNote,
    MenuItem,
    OwnerVerificationCertificate,
} from '@/lib/types';
import { MASTER_PLACES } from '@/lib/places-master';
import {
    getEffectiveVerifiedMenu,
    getEffectiveWelcomePerk,
} from '@/lib/kitchen-defaults';

type PartnerTab = 'dish' | 'postcards' | 'verify';

export default function PartnerPortalPage() {
    const [lang, setLang] = useState<NavLang>('ja');
    const [activeTab, setActiveTab] = useState<PartnerTab>('dish');
    const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
    const [notes, setNotes] = useState<GratitudeNote[]>([]);
    const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
        'ChIJL8ZEXViRQTURgeN1wM_GJ6E'
    );
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Anti-Spoofing OTP Verification States
    const [verifyMethod, setVerifyMethod] =
        useState<OwnerVerificationCertificate['method']>('instagram_official');
    const [verifyIdentifier, setVerifyIdentifier] = useState<string>('');
    const [verifyOwnerName, setVerifyOwnerName] = useState<string>('');
    const [issuedOtpDemo, setIssuedOtpDemo] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState<string>('');
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Simple Store Form States (Pillar 1: Signature Dish + Welcome Perk)
    const [sigNameJa, setSigNameJa] = useState('');
    const [sigNameEn, setSigNameEn] = useState('');
    const [sigPrice, setSigPrice] = useState<number>(1200);
    const [sigDescJa, setSigDescJa] = useState('');
    const [sigDescEn, setSigDescEn] = useState('');
    const [welcomePerkJa, setWelcomePerkJa] = useState('');
    const [welcomePerkEn, setWelcomePerkEn] = useState('');
    const [chefGreetingJa, setChefGreetingJa] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Reply States (Pillar 2: Gochisosama Postcard Reply)
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [replyingId, setReplyingId] = useState<string | null>(null);

    const isJa = lang === 'ja';

    const showNotice = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3500);
    };

    const fetchEcosystem = useCallback(async () => {
        try {
            const res = await fetch('/api/ecosystem', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.stores) setStoresMap(data.stores);
                if (data.gratitude_notes) setNotes(data.gratitude_notes);
                if (data.custom_places) setCustomPlaces(data.custom_places);
            }
        } catch {
            // Silent fallback
        }
    }, []);

    useEffect(() => {
        fetchEcosystem();
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const st = params.get('store') || params.get('claim');
            if (st) setSelectedPlaceId(st);
            if (params.get('claim')) setActiveTab('verify');
        }
    }, [fetchEcosystem]);

    const allPlaces = useMemo<Place[]>(() => {
        const existingIds = new Set(customPlaces.map((c) => c.google_place_id));
        return [
            ...customPlaces,
            ...MASTER_PLACES.filter((p) => !existingIds.has(p.google_place_id)),
        ];
    }, [customPlaces]);

    const currentPlace = useMemo(
        () =>
            allPlaces.find((p) => p.google_place_id === selectedPlaceId) ||
            allPlaces[0],
        [allPlaces, selectedPlaceId]
    );

    const currentOfficial = storesMap[selectedPlaceId] || null;
    const isVerifiedOwner = Boolean(
        currentOfficial?.verification_cert?.is_verified
    );

    useEffect(() => {
        if (!currentPlace) return;
        const menu = getEffectiveVerifiedMenu(currentPlace, currentOfficial);
        const sig = menu[0];
        const perk = getEffectiveWelcomePerk(currentPlace, currentOfficial);

        setSigNameJa(sig?.name_ja || '');
        setSigNameEn(sig?.name_en || '');
        setSigPrice(sig?.price_jpy || 1200);
        setSigDescJa(sig?.description_ja || '');
        setSigDescEn(sig?.description_en || '');
        setWelcomePerkJa(perk.ja);
        setWelcomePerkEn(perk.en);
        setChefGreetingJa(
            currentOfficial?.chef_greeting_ja || currentPlace.profile_text || ''
        );

        setIssuedOtpDemo(null);
        setOtpInput('');
        setVerifyError(null);
        setVerifyIdentifier(
            currentPlace.instagram_id
                ? `@${currentPlace.instagram_id}`
                : `@${currentPlace.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        );
        setVerifyOwnerName(
            `${currentPlace.name_ja || currentPlace.name} オーナーシェフ`
        );
    }, [currentPlace, currentOfficial]);

    const storeNotes = useMemo(
        () => notes.filter((n) => n.place_id === selectedPlaceId),
        [notes, selectedPlaceId]
    );

    const handleRequestOtp = async () => {
        setVerifyError(null);
        setIsVerifying(true);
        try {
            const res = await fetch('/api/ecosystem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'request_verification_otp',
                    place_id: selectedPlaceId,
                    method: verifyMethod,
                    identifier: verifyIdentifier || '@official_store',
                    owner_name: verifyOwnerName || '店舗オーナー',
                }),
            });
            const data = await res.json();
            if (data.ok && data.otp_code) {
                setIssuedOtpDemo(data.otp_code);
                setOtpInput(data.otp_code);
                showNotice(
                    `6桁の本人確認コード（${data.otp_code}）を発行しました`
                );
            }
        } catch {
            setVerifyError('通信エラーが発生しました');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleConfirmOtp = async () => {
        setVerifyError(null);
        setIsVerifying(true);
        try {
            const res = await fetch('/api/ecosystem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'confirm_verification_otp',
                    place_id: selectedPlaceId,
                    otp_code: otpInput,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                await fetchEcosystem();
                setIssuedOtpDemo(null);
                setActiveTab('dish');
                showNotice('オーナー本人確認が完了し、編集ロックが解除されました');
            } else {
                setVerifyError(data.error || '認証コードが一致しません');
            }
        } catch {
            setVerifyError('認証処理に失敗しました');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSaveSignatureAndPerk = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPlace) return;
        setIsSaving(true);

        const existingMenu = getEffectiveVerifiedMenu(
            currentPlace,
            currentOfficial
        );
        const updatedSig: MenuItem = {
            id: existingMenu[0]?.id || `${selectedPlaceId}-sig-1`,
            name_ja: sigNameJa.trim() || 'シェフ特製 看板メニュー',
            name_en: sigNameEn.trim() || "Chef's Signature Dish",
            description_ja: sigDescJa.trim(),
            description_en: sigDescEn.trim() || sigDescJa.trim(),
            price_jpy: Number(sigPrice) || 1200,
            is_100_vegan: true,
            is_gluten_free: existingMenu[0]?.is_gluten_free ?? true,
            is_allium_free: existingMenu[0]?.is_allium_free ?? true,
            is_popular: true,
            order_note_ja: `看板メニュー「${sigNameJa.trim()}」を1つお願いします`,
        };

        const updatedMenu = [updatedSig, ...existingMenu.slice(1)];

        try {
            const res = await fetch('/api/ecosystem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_store_data',
                    place_id: selectedPlaceId,
                    owner_id:
                        currentOfficial?.owner_id || `partner-${selectedPlaceId}`,
                    owner_name:
                        currentOfficial?.owner_name ||
                        `${currentPlace.name_ja || currentPlace.name} オーナー`,
                    chef_greeting_ja: chefGreetingJa.trim(),
                    welcome_perk_ja: welcomePerkJa.trim(),
                    welcome_perk_en:
                        welcomePerkEn.trim() || welcomePerkJa.trim(),
                    verified_menu: updatedMenu,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                await fetchEcosystem();
                showNotice(
                    '「看板の一皿」と「画面提示の歓迎特典」を保存・公開しました'
                );
            }
        } catch {
            showNotice('保存中にエラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendReply = async (noteId: string) => {
        const textJa = (replyDrafts[noteId] || '').trim();
        if (!textJa) return;
        setReplyingId(noteId);
        try {
            const res = await fetch('/api/ecosystem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reply_gratitude',
                    note_id: noteId,
                    text_ja: textJa,
                    chef_name:
                        currentOfficial?.owner_name ||
                        `${currentPlace?.name_ja || currentPlace?.name} シェフ`,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                await fetchEcosystem();
                showNotice('旅人の絵葉書へ直筆返信を届けました（自動翻訳済）');
            }
        } catch {
            // Ignore
        } finally {
            setReplyingId(null);
        }
    };

    return (
        <div className="min-h-dvh bg-[#EEF7F2] text-[#1C2822] md:grid md:grid-cols-[268px_1fr]">
            <AppSidebar lang={lang} onLangChange={setLang} />

            <div className="flex flex-col min-h-dvh overflow-x-hidden">
                {toastMsg && (
                    <div className="fixed bottom-5 right-5 z-50 rounded-full bg-[#1C2822] text-white px-4 py-2.5 text-xs font-bold shadow-[0_10px_28px_rgba(20,40,30,0.22)] flex items-center gap-2 animate-fade-in">
                        <span className="size-2 rounded-full bg-[#22C55E]" />
                        <span>{toastMsg}</span>
                    </div>
                )}

                {/* TOP CENTERED WORKSPACE (nani.now style) */}
                <main className="flex-1 px-4 sm:px-6 pt-8 md:pt-16 pb-16">
                    <div className="max-w-2xl mx-auto">
                        {/* Header + Rotated Handwritten Guidance */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 px-1">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-[13px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,0.25)] shrink-0">
                                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-[25px] font-extrabold tracking-tight text-[#1C2822] leading-tight">
                                        {isJa ? '店舗オーナースタジオ' : 'Restaurant Partner Studio'}
                                    </h1>
                                    <p className="text-xs font-semibold text-[#526358] mt-0.5">
                                        {isJa
                                            ? 'やることは「看板の一皿＆歓迎特典の登録」と「絵葉書への返信」の2つだけ'
                                            : 'Simply showcase your Signature Dish & Welcome Perk and reply to postcards'}
                                    </p>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-1.5 text-[#15803D] font-bold text-xs rotate-2 translate-y-1 select-none shrink-0">
                                <span>{isJa ? '手数料0円・30秒でマップに即時反映' : '100% Free · Live in 30s'}</span>
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

                        {/* Store Picker Pill Bar right above the Tray */}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-white/75 backdrop-blur-xs border border-[#DCECE3] rounded-[18px] px-3.5 py-2">
                            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                <span className="text-[11px] font-extrabold text-[#526358] shrink-0">
                                    {isJa ? '対象店舗:' : 'Store:'}
                                </span>
                                <select
                                    value={selectedPlaceId}
                                    onChange={(e) => setSelectedPlaceId(e.target.value)}
                                    className="flex-1 h-8 rounded-[10px] bg-[#F7FBF8] border border-[#DCECE3] px-2.5 text-xs font-extrabold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                >
                                    {allPlaces.map((p) => {
                                        const verified = Boolean(
                                            storesMap[p.google_place_id]?.verification_cert
                                                ?.is_verified
                                        );
                                        return (
                                            <option
                                                key={p.google_place_id}
                                                value={p.google_place_id}
                                            >
                                                {verified ? '✓ ' : '🔒 '}
                                                {p.name_ja || p.name} ({p.area || 'Tokyo'})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab('verify')}
                                className={`h-7 px-3 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                                    isVerifiedOwner
                                        ? 'bg-[#DCECE3] text-[#14532D]'
                                        : 'bg-[#1C2822] text-white'
                                }`}
                            >
                                <span
                                    className={`size-2 rounded-full ${
                                        isVerifiedOwner ? 'bg-[#16A34A]' : 'bg-amber-400'
                                    }`}
                                />
                                <span>
                                    {isVerifiedOwner
                                        ? isJa ? '公式オーナー認証済' : 'Verified Owner'
                                        : isJa ? '未認証（タップで本人確認）' : 'Unverified (Unlock)'}
                                </span>
                            </button>
                        </div>

                        {/* TWO-LAYER SQUIRCLE TRAY (.nani-well + .nani-sheet) */}
                        <div className="nani-well">
                            {/* Top Segmented Bar */}
                            <div className="px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1 bg-[#CBE2D4]/75 p-1 rounded-[16px]">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('dish')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 ${
                                            activeTab === 'dish'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        {isJa ? '1. 看板の一皿＆歓迎特典' : '1. Dish & Perk'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('postcards')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                                            activeTab === 'postcards'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        <span>{isJa ? '2. ごちそうさま絵葉書' : '2. Postcards'}</span>
                                        <span className="px-1.5 py-0.2 rounded-full bg-[#16A34A] text-white text-[10px]">
                                            {storeNotes.length}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('verify')}
                                        className={`h-8 px-3.5 rounded-[12px] text-xs font-bold transition-all active:scale-95 ${
                                            activeTab === 'verify'
                                                ? 'bg-white text-[#1C2822] shadow-xs'
                                                : 'text-[#3D5245] hover:text-[#1C2822]'
                                        }`}
                                    >
                                        {isJa ? '3. 本人確認＆店頭QR' : '3. Verify & QR'}
                                    </button>
                                </div>

                                <Link
                                    href={`/?store=${encodeURIComponent(selectedPlaceId)}`}
                                    className="h-7 px-3 rounded-full bg-white/80 hover:bg-white text-[11px] font-bold text-[#15803D] flex items-center gap-1 transition-all active:scale-95"
                                >
                                    <span>{isJa ? 'マップ上の表示を見る ↗' : 'View on Map ↗'}</span>
                                </Link>
                            </div>

                            {/* Inner White Sheet (.nani-sheet) */}
                            <div className="nani-sheet p-5 sm:p-6">
                                {activeTab === 'dish' && (
                                    <form onSubmit={handleSaveSignatureAndPerk} className="space-y-4">
                                        {!isVerifiedOwner && (
                                            <div className="rounded-[14px] bg-[#F2F9F5] border border-[#C5DDD0] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                <div className="text-xs text-[#14532D] font-semibold">
                                                    <span className="font-extrabold">
                                                        {isJa
                                                            ? 'なりすまし防止ロック中：'
                                                            : 'Anti-Spoofing Lock Active: '}
                                                    </span>
                                                    {isJa
                                                        ? '第三者による勝手な書き換えを防ぐため、保存前に10秒のオーナー認証を行ってください。'
                                                        : 'Verify ownership in 10 seconds before publishing changes.'}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('verify')}
                                                    className="h-8 px-3.5 rounded-full bg-[#16A34A] text-white text-xs font-bold shrink-0 active:scale-95 transition-all"
                                                >
                                                    {isJa ? '本人確認へ進む →' : 'Unlock Now →'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Dish Title & Price */}
                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_110px] gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '看板の一皿（日本語名）' : 'Signature Dish (JA)'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={sigNameJa}
                                                    onChange={(e) => setSigNameJa(e.target.value)}
                                                    className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '英語メニュー名 (訪日客表示)' : 'Signature Dish (EN)'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={sigNameEn}
                                                    onChange={(e) => setSigNameEn(e.target.value)}
                                                    className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '税込価格 (¥)' : 'Price (JPY)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={sigPrice}
                                                    onChange={(e) => setSigPrice(Number(e.target.value))}
                                                    className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                                />
                                            </div>
                                        </div>

                                        {/* Dish Appeal */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '一皿の魅力・こだわり（日本語）' : 'Dish Story (JA)'}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={sigDescJa}
                                                    onChange={(e) => setSigDescJa(e.target.value)}
                                                    className="w-full rounded-[12px] border border-[#DCECE3] bg-white p-2.5 text-xs text-[#1C2822] font-medium resize-none focus:outline-none focus:border-[#16A34A]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '英語の説明文（未入力なら自動補完）' : 'Dish Story (EN)'}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={sigDescEn}
                                                    onChange={(e) => setSigDescEn(e.target.value)}
                                                    className="w-full rounded-[12px] border border-[#DCECE3] bg-white p-2.5 text-xs text-[#1C2822] font-medium resize-none focus:outline-none focus:border-[#16A34A]"
                                                />
                                            </div>
                                        </div>

                                        {/* Welcome Perk */}
                                        <div className="rounded-[16px] bg-[#F7FBF8] border border-[#DCECE3] p-3.5 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-extrabold text-[#15803D]">
                                                    {isJa
                                                        ? '画面提示の歓迎特典（来店率が劇的に上がるおもてなし）'
                                                        : 'Show-Screen Welcome Perk'}
                                                </span>
                                                <span className="text-[10px] font-bold text-[#526358]">
                                                    {isJa ? '注文時にスマホ画面を提示' : 'Shown at ordering'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <input
                                                    type="text"
                                                    value={welcomePerkJa}
                                                    onChange={(e) => setWelcomePerkJa(e.target.value)}
                                                    placeholder="例: 画面提示でミニ烏龍茶またはトッピング1品サービス"
                                                    className="h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs font-semibold text-[#1C2822]"
                                                />
                                                <input
                                                    type="text"
                                                    value={welcomePerkEn}
                                                    onChange={(e) => setWelcomePerkEn(e.target.value)}
                                                    placeholder="e.g. Complimentary mini oolong tea or extra topping"
                                                    className="h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs font-semibold text-[#1C2822]"
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom Action Bar inside .nani-sheet */}
                                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                                            <Link
                                                href={`/?store=${encodeURIComponent(selectedPlaceId)}`}
                                                className="h-11 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-[#1C2822] font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all"
                                            >
                                                <span>{isJa ? '旅人からの見え方をプレビュー' : 'Preview Traveler Sheet'}</span>
                                            </Link>

                                            <button
                                                type="submit"
                                                disabled={!isVerifiedOwner || isSaving}
                                                className="h-11 px-5 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all disabled:opacity-45"
                                            >
                                                <span>
                                                    {isSaving
                                                        ? isJa ? '保存中...' : 'Saving...'
                                                        : isJa ? '看板の一皿＆歓迎特典を保存' : 'Save Dish & Perk'}
                                                </span>
                                                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'postcards' && (
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-sm font-extrabold text-[#1C2822]">
                                                {isJa
                                                    ? `${currentPlace?.name_ja || currentPlace?.name} に届いた「ごちそうさま絵葉書」`
                                                    : 'Traveler Gochisosama Postcards'}
                                            </h2>
                                            <p className="text-xs text-[#526358] mt-0.5">
                                                {isJa
                                                    ? '日本語でひとこと返信すると、英語へ自動翻訳されてマップ上の店舗シートに掲載されます。'
                                                    : 'Reply in Japanese and your message is automatically translated for global travelers.'}
                                            </p>
                                        </div>

                                        {storeNotes.length === 0 ? (
                                            <div className="rounded-[16px] bg-[#F7FBF8] border border-[#DCECE3] p-6 text-center text-xs text-[#526358] font-medium">
                                                {isJa
                                                    ? 'まだ絵葉書がありません。マップ画面からテスト送信するとここにリアルタイムで届きます。'
                                                    : 'No postcards yet for this store.'}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                                                {storeNotes.map((note) => (
                                                    <div
                                                        key={note.id}
                                                        className="rounded-[16px] bg-[#FAF7F0] border border-[#E5DEC9] p-4 space-y-2.5"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-extrabold text-[#1C2822]">
                                                                    {note.stamp_emoji} {note.sender_name} ({note.sender_country})
                                                                </span>
                                                                {note.ordered_dishes?.[0] && (
                                                                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#DCECE3] text-[#14532D]">
                                                                        完食: {note.ordered_dishes[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[#DC2626] border border-[#DC2626] px-1.5 py-0.5 rounded">
                                                                御朱印済
                                                            </span>
                                                        </div>

                                                        <p className="text-xs font-bold text-[#1C2822]">
                                                            “{note.message_ja_translated}”
                                                        </p>
                                                        <p className="text-[11px] text-[#526358]">
                                                            Original: “{note.message_original}”
                                                        </p>

                                                        {note.owner_reply?.text_ja ? (
                                                            <div className="rounded-[12px] bg-white border border-[#DCECE3] p-2.5 text-xs">
                                                                <div className="font-extrabold text-[#15803D]">
                                                                    ✓ シェフからの返信（公開中）:
                                                                </div>
                                                                <p className="text-[#1C2822] mt-0.5 font-medium">
                                                                    {note.owner_reply.text_ja}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <input
                                                                    type="text"
                                                                    value={replyDrafts[note.id] || ''}
                                                                    onChange={(e) =>
                                                                        setReplyDrafts((prev) => ({
                                                                            ...prev,
                                                                            [note.id]: e.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder="例: ご来店ありがとうございます！また日本にいらした際はぜひお立ち寄りください。"
                                                                    className="flex-1 h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSendReply(note.id)}
                                                                    disabled={replyingId === note.id}
                                                                    className="h-9 px-3.5 rounded-full bg-[#1C2822] text-white text-xs font-bold shrink-0 active:scale-95 transition-all"
                                                                >
                                                                    {replyingId === note.id ? '送信中...' : '返信する'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'verify' && (
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-sm font-extrabold text-[#1C2822]">
                                                {isJa
                                                    ? '3段階のなりすまし防止・公式オーナー本人確認'
                                                    : '3-Tier Anti-Spoofing Owner Verification'}
                                            </h2>
                                            <p className="text-xs text-[#526358] mt-0.5">
                                                {isJa
                                                    ? '公式Instagram DM・店舗固定電話・営業許可証照合のいずれかで6桁の認証コードを発行し、第三者のなりすましを防止します。'
                                                    : 'Prevent unauthorized edits via Official Instagram DM, Store Landline, or Business License OTP.'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {[
                                                {
                                                    id: 'instagram_official' as const,
                                                    title: '1. 公式Instagram DM',
                                                    sub: '公式アカウント宛にコード送信',
                                                },
                                                {
                                                    id: 'phone_otp' as const,
                                                    title: '2. 店舗の固定電話',
                                                    sub: '登録電話番号で音声確認',
                                                },
                                                {
                                                    id: 'business_license' as const,
                                                    title: '3. 飲食店営業許可番号',
                                                    sub: '許可証または公式ドメイン照合',
                                                },
                                            ].map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setVerifyMethod(m.id)}
                                                    className={`p-3 rounded-[13px] border text-left transition-all active:scale-95 ${
                                                        verifyMethod === m.id
                                                            ? 'border-[#16A34A] bg-[#F2F9F5]'
                                                            : 'border-[#DCECE3] bg-white'
                                                    }`}
                                                >
                                                    <div className="text-xs font-extrabold text-[#1C2822]">
                                                        {m.title}
                                                    </div>
                                                    <div className="text-[10.5px] text-[#526358] mt-0.5">
                                                        {m.sub}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '確認先アカウント / 電話番号' : 'Official Handle / Phone'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={verifyIdentifier}
                                                    onChange={(e) => setVerifyIdentifier(e.target.value)}
                                                    className="w-full h-9 rounded-[11px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '責任者・シェフ名' : 'Owner / Chef Name'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={verifyOwnerName}
                                                    onChange={(e) => setVerifyOwnerName(e.target.value)}
                                                    className="w-full h-9 rounded-[11px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822]"
                                                />
                                            </div>
                                        </div>

                                        {verifyError && (
                                            <div className="text-xs font-bold text-red-600">
                                                {verifyError}
                                            </div>
                                        )}

                                        <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={handleRequestOtp}
                                                disabled={isVerifying}
                                                className="h-10 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-xs font-bold text-[#1C2822] active:scale-95 transition-all"
                                            >
                                                {isJa
                                                    ? '6桁の本人確認コードを発行'
                                                    : 'Issue 6-Digit OTP Code'}
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={otpInput}
                                                    onChange={(e) => setOtpInput(e.target.value)}
                                                    placeholder="6桁コード"
                                                    className="w-28 h-10 rounded-full border border-[#DCECE3] bg-[#F7FBF8] px-3.5 text-center font-mono text-xs font-extrabold text-[#1C2822]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleConfirmOtp}
                                                    disabled={!otpInput || isVerifying}
                                                    className="h-10 px-5 rounded-full bg-[#16A34A] text-white text-xs font-bold active:scale-95 transition-all disabled:opacity-45"
                                                >
                                                    {isJa ? '認証してロック解除' : 'Verify & Unlock'}
                                                </button>
                                            </div>
                                        </div>

                                        {issuedOtpDemo && (
                                            <div className="rounded-[12px] bg-[#F2F9F5] border border-[#C5DDD0] px-3.5 py-2 text-xs font-bold text-[#14532D]">
                                                デモ用即時通知: 発行されたコード「{issuedOtpDemo}」を自動入力しました。「認証してロック解除」を押すと即座に完了します。
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SUB-ACTIONS: 2-Column Dashed Cards */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="nani-dashed p-4 text-left flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-[11px] bg-white border border-[#DCECE3] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                        <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9" />
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                            <rect x="6" y="14" width="12" height="8" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-[13.5px] font-extrabold text-[#1C2822]">
                                            {isJa ? '卓上用「完食御朱印ポップ」を印刷' : 'Print Table Stamp Stand'}
                                        </div>
                                        <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                            {isJa
                                                ? '食後のゲストがQRから絵葉書とストーリーズを投稿'
                                                : 'Let diners collect their stamp & share to Instagram'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                                    {isJa ? '印刷 →' : 'Print →'}
                                </span>
                            </button>

                            <Link
                                href="/growth"
                                className="nani-dashed p-4 text-left flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-[11px] bg-white border border-[#DCECE3] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                        <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-[13.5px] font-extrabold text-[#1C2822]">
                                            {isJa ? 'Instagram用 9:16 宣伝カードを作成' : 'Create 9:16 Instagram Story'}
                                        </div>
                                        <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                            {isJa
                                                ? '自店の看板メニュー紹介画像を1タップで生成'
                                                : 'Generate a vertical story card for your restaurant'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                                    {isJa ? '作成 →' : 'Create →'}
                                </span>
                            </Link>
                        </div>
                    </div>
                </main>

                {/* WAVE DIVIDER + CLEAN SHOWCASE */}
                <div className="nani-wave-bottom h-6 w-full" />

                <section className="bg-[#F7FBF8] pt-14 pb-20 px-4 sm:px-6 border-t border-[#E2EFE8]">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center max-w-xl mx-auto mb-10">
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C2822] leading-snug">
                                {isJa ? (
                                    <>
                                        お店の負担はゼロ。
                                        <span className="nani-highlight mx-1">旅の思い出と集客</span>
                                        だけに集中
                                    </>
                                ) : (
                                    <>
                                        Zero Commission. Built for{' '}
                                        <span className="nani-highlight mx-1">Hospitality & Joy</span>
                                    </>
                                )}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="nani-frame bg-[#EEF7F2] p-5">
                                <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D] mb-2">
                                    PILLAR 01 · SIGNATURE DISH
                                </span>
                                <h3 className="text-base font-extrabold text-[#1C2822]">
                                    {isJa
                                        ? '細かい成分チェックより「シェフの看板の一皿」'
                                        : "Highlight Your Chef's Signature Dish"}
                                </h3>
                                <p className="text-xs text-[#526358] mt-1.5 leading-relaxed font-medium">
                                    {isJa
                                        ? '複雑なアンケートは一切不要。お店が一番食べてほしい1皿と歓迎特典を登録するだけで、6言語の指差し注文票が自動生成されます。'
                                        : 'Register your best dish and welcome perk once—automatically translated into 6 languages with a point-and-order ticket.'}
                                </p>
                            </div>

                            <div className="nani-frame bg-[#EEF7F2] p-5">
                                <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D] mb-2">
                                    PILLAR 02 · GOCHISOSAMA POSTCARD
                                </span>
                                <h3 className="text-base font-extrabold text-[#1C2822]">
                                    {isJa
                                        ? '食後の「完食御朱印」が世界中の口コミに変わる'
                                        : 'Turn Every Meal Into a Collectible Stamp'}
                                </h3>
                                <p className="text-xs text-[#526358] mt-1.5 leading-relaxed font-medium">
                                    {isJa
                                        ? '旅人が食後にデジタル御朱印を集めて絵葉書を送信。シェフからの温かい返信が次の訪日客の来店動機になります。'
                                        : 'Diners collect your restaurant stamp and send a thank-you postcard that inspires the next traveler.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
