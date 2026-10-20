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

export default function PartnerPortalPage() {
    const [lang, setLang] = useState<NavLang>('ja');
    const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
    const [notes, setNotes] = useState<GratitudeNote[]>([]);
    const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
        'ChIJL8ZEXViRQTURgeN1wM_GJ6E'
    );
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [showVerifyPanel, setShowVerifyPanel] = useState(false);
    const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');

    // Anti-Spoofing OTP Verification States
    const [verifyMethod, setVerifyMethod] =
        useState<OwnerVerificationCertificate['method']>('instagram_official');
    const [verifyIdentifier, setVerifyIdentifier] = useState<string>('');
    const [verifyOwnerName, setVerifyOwnerName] = useState<string>('');
    const [issuedOtpDemo, setIssuedOtpDemo] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState<string>('');
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Store Form States (Pillar 1: Signature Dish + Welcome Perk)
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
            if (params.get('claim')) setShowVerifyPanel(true);
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
        setShowVerifyPanel(!Boolean(currentOfficial?.verification_cert?.is_verified));
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
                setShowVerifyPanel(false);
                showNotice('オーナー本人確認が完了し、認定証明書が発行されました');
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
                    '「看板の一皿」と「画面提示の歓迎特典」をマップに公開しました'
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
        <div className="min-h-dvh bg-[#EEF7F2] text-[#1C2822] lg:grid lg:grid-cols-[248px_1fr]">
            <AppSidebar lang={lang} onLangChange={setLang} />

            <div className="flex flex-col min-h-dvh overflow-x-hidden">
                {toastMsg && (
                    <div className="fixed bottom-5 right-5 z-50 rounded-full bg-[#1C2822] text-white px-4 py-2.5 text-xs font-bold shadow-[0_10px_28px_rgba(20,40,30,0.22)] flex items-center gap-2 animate-fade-in">
                        <span className="size-2 rounded-full bg-[#22C55E]" />
                        <span>{toastMsg}</span>
                    </div>
                )}

                <main className="flex-1 px-3.5 sm:px-6 lg:px-8 pt-4 lg:pt-10 pb-28 max-w-6xl w-full mx-auto space-y-5">
                    {/* Top Header + Store Selector Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-white/90 backdrop-blur-md rounded-[24px] p-4 sm:p-5 border border-[#DCECE3] shadow-[0_6px_20px_rgba(20,40,30,0.04)]">
                        <div className="flex items-center gap-3">
                            <div className="size-10 sm:size-11 rounded-[14px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(22,163,74,0.25)] shrink-0">
                                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-[#1C2822]">
                                        {isJa ? '店舗オーナースタジオ' : 'Restaurant Partner Studio'}
                                    </h1>
                                    <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF7F2] text-[#15803D]">
                                        {isJa ? '初期費用・手数料 0円' : '100% Free'}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-[#526358] mt-0.5">
                                    {isJa
                                        ? '「看板の一皿＆歓迎特典」を登録すると、訪日客のスマホ画面（6言語注文票）へ即時反映されます'
                                        : 'Register your Signature Dish & Welcome Perk for instant live preview across 6 languages'}
                                </p>
                            </div>
                        </div>

                        {/* Store Selector & Verification Toggle */}
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={selectedPlaceId}
                                onChange={(e) => setSelectedPlaceId(e.target.value)}
                                className="h-10 rounded-[14px] bg-[#F7FBF8] border border-[#DCECE3] px-3 text-xs font-extrabold text-[#1C2822] focus:outline-none focus:border-[#16A34A] w-full sm:w-auto sm:max-w-[270px]"
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

                            <button
                                type="button"
                                onClick={() => setShowVerifyPanel((v) => !v)}
                                className={`h-10 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                    isVerifiedOwner
                                        ? 'bg-[#EEF7F2] text-[#14532D] border border-[#C5DDD0]'
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
                                        : isJa ? '未認証（10秒で本人確認）' : 'Verify Ownership'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Optional Expandable 3-Tier Anti-Spoofing Verification Card */}
                    {showVerifyPanel && (
                        <div className="nani-well">
                            <div className="px-3.5 py-2 flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#16A34A]" />
                                    <span>
                                        {isJa
                                            ? 'なりすまし防止：3段階の公式オーナー本人確認（10秒でロック解除）'
                                            : '3-Tier Anti-Spoofing Owner Verification'}
                                    </span>
                                </span>
                                {isVerifiedOwner && (
                                    <button
                                        type="button"
                                        onClick={() => setShowVerifyPanel(false)}
                                        className="text-xs font-bold text-[#526358] hover:text-[#1C2822]"
                                    >
                                        閉じる ✕
                                    </button>
                                )}
                            </div>
                            <div className="nani-sheet p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {[
                                        {
                                            id: 'instagram_official' as const,
                                            title: '1. 公式Instagram DM認証',
                                            sub: '店舗公式アカウントへ6桁コード送信',
                                        },
                                        {
                                            id: 'phone_otp' as const,
                                            title: '2. 店舗の固定電話認証',
                                            sub: 'Google登録の店舗電話番号で確認',
                                        },
                                        {
                                            id: 'business_license' as const,
                                            title: '3. 飲食店営業許可番号',
                                            sub: '許可証番号または公式ドメイン照合',
                                        },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setVerifyMethod(m.id)}
                                            className={`p-3 rounded-[14px] border text-left transition-all active:scale-98 ${
                                                verifyMethod === m.id
                                                    ? 'border-[#16A34A] bg-[#F2F9F5]'
                                                    : 'border-[#DCECE3] bg-white'
                                            }`}
                                        >
                                            <div className="text-xs font-extrabold text-[#1C2822]">
                                                {m.title}
                                            </div>
                                            <div className="text-[11px] text-[#526358] mt-0.5">
                                                {m.sub}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                            {isJa ? '確認先アカウント / 固定電話番号' : 'Official Handle / Phone'}
                                        </label>
                                        <input
                                            type="text"
                                            value={verifyIdentifier}
                                            onChange={(e) => setVerifyIdentifier(e.target.value)}
                                            className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                            {isJa ? 'オーナー・責任者名' : 'Owner / Chef Name'}
                                        </label>
                                        <input
                                            type="text"
                                            value={verifyOwnerName}
                                            onChange={(e) => setVerifyOwnerName(e.target.value)}
                                            className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3 text-xs font-bold text-[#1C2822]"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={isVerifying}
                                        className="h-10 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-xs font-bold text-[#1C2822] active:scale-95 transition-all"
                                    >
                                        {isJa ? '6桁コードを発行' : 'Send 6-Digit OTP'}
                                    </button>
                                </div>

                                {(issuedOtpDemo || otpInput) && (
                                    <div className="rounded-[14px] bg-[#F2F9F5] border border-[#16A34A] p-3.5 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-xs font-bold text-[#14532D]">
                                            {issuedOtpDemo
                                                ? `発行された本人確認コード「${issuedOtpDemo}」を自動セットしました：`
                                                : '6桁の本人確認コードを入力してください：'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={otpInput}
                                                onChange={(e) => setOtpInput(e.target.value)}
                                                className="w-28 h-9 rounded-full border border-[#DCECE3] bg-white px-3 text-center font-mono text-xs font-extrabold text-[#1C2822]"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleConfirmOtp}
                                                className="h-9 px-4 rounded-full bg-[#16A34A] text-white text-xs font-bold active:scale-95 transition-all"
                                            >
                                                {isJa ? '認証して編集ロック解除 →' : 'Verify & Unlock →'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {verifyError && (
                                    <p className="text-xs font-bold text-red-600">{verifyError}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile 1-Tap Switcher between Editor & Live iPhone Preview */}
                    <div className="lg:hidden bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-[#DCECE3] grid grid-cols-2 gap-1 shadow-xs">
                        <button
                            type="button"
                            onClick={() => setMobileView('edit')}
                            className={`h-9 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                                mobileView === 'edit'
                                    ? 'bg-[#1C2822] text-white shadow-xs'
                                    : 'text-[#526358]'
                            }`}
                        >
                            {isJa ? '✏️ メニュー・絵葉書を編集' : '✏️ Edit Menu & Notes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileView('preview')}
                            className={`h-9 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mobileView === 'preview'
                                    ? 'bg-[#16A34A] text-white shadow-xs'
                                    : 'text-[#15803D] bg-[#EEF7F2]'
                            }`}
                        >
                            <span className="size-2 rounded-full bg-current" />
                            <span>{isJa ? '📱 スマホ画面プレビュー' : '📱 Live Preview'}</span>
                        </button>
                    </div>

                    {/* ─── 2-COLUMN SPLIT WORKSPACE: Left Editor + Inbox / Right Live iPhone Preview ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-6 items-start">
                        {/* LEFT COLUMN: Pillar 1 (Dish & Perk Editor) + Pillar 2 (Postcard Inbox) */}
                        <div className={`space-y-6 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
                            {/* PILLAR 1: Signature Dish & Welcome Perk Editor */}
                            <div className="nani-well">
                                <div className="px-3.5 py-2 flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#16A34A] shrink-0" />
                                        <span>
                                            {isJa
                                                ? '① 看板の一皿 ＆ 歓迎特典の登録'
                                                : "1. Chef's Signature Dish & Perk"}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setMobileView('preview')}
                                        className="lg:hidden text-[10.5px] font-extrabold text-[#15803D] bg-white px-2.5 py-0.5 rounded-full shrink-0 border border-[#C5DDD0]"
                                    >
                                        {isJa ? 'プレビューを見る →' : 'Preview →'}
                                    </button>
                                    <span className="hidden lg:inline-block text-[11px] font-bold text-[#15803D] bg-white/80 px-2.5 py-0.5 rounded-full shrink-0">
                                        {isJa ? '右側のプレビューに即時反映' : 'Live Preview Active'}
                                    </span>
                                </div>

                                <form
                                    onSubmit={handleSaveSignatureAndPerk}
                                    className="nani-sheet p-5 sm:p-6 space-y-4"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                {isJa
                                                    ? '看板の一皿（日本語メニュー名 — 店員さん提示票にも表示）'
                                                    : 'Signature Dish Name (Japanese)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={sigNameJa}
                                                onChange={(e) => setSigNameJa(e.target.value)}
                                                className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3.5 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
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
                                                className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3.5 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                            {isJa
                                                ? '英語メニュー名（海外ゲストのマップ画面に表示）'
                                                : 'Signature Dish Name (English)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={sigNameEn}
                                            onChange={(e) => setSigNameEn(e.target.value)}
                                            className="w-full h-10 rounded-[12px] border border-[#DCECE3] bg-[#F7FBF8] px-3.5 text-xs font-bold text-[#1C2822] focus:outline-none focus:border-[#16A34A]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                {isJa ? '一皿の魅力・こだわり（日本語）' : 'Dish Story (Japanese)'}
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={sigDescJa}
                                                onChange={(e) => setSigDescJa(e.target.value)}
                                                className="w-full rounded-[12px] border border-[#DCECE3] bg-white p-3 text-xs text-[#1C2822] font-medium resize-none focus:outline-none focus:border-[#16A34A]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-[#5A6E62] mb-1">
                                                {isJa ? '英語の説明文' : 'Dish Story (English)'}
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={sigDescEn}
                                                onChange={(e) => setSigDescEn(e.target.value)}
                                                className="w-full rounded-[12px] border border-[#DCECE3] bg-white p-3 text-xs text-[#1C2822] font-medium resize-none focus:outline-none focus:border-[#16A34A]"
                                            />
                                        </div>
                                    </div>

                                    {/* Welcome Perk Inputs (Full-width so nothing gets cut off!) */}
                                    <div className="rounded-[16px] bg-[#F7FBF8] border border-[#DCECE3] p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-[#15803D]">
                                                {isJa
                                                    ? '🎁 画面提示の歓迎特典（ミニドリンクやトッピング1品など）'
                                                    : '🎁 Show-Screen Welcome Perk'}
                                            </span>
                                            <span className="text-[10.5px] font-bold text-[#526358]">
                                                {isJa ? '来店率が最も上がる設定です' : 'Boosts walk-ins'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-[10.5px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '日本語表記（注文チケットに表示）' : 'Perk (Japanese)'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={welcomePerkJa}
                                                    onChange={(e) => setWelcomePerkJa(e.target.value)}
                                                    className="w-full h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs font-semibold text-[#1C2822]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10.5px] font-bold text-[#5A6E62] mb-1">
                                                    {isJa ? '英語表記（訪日ゲストに表示）' : 'Perk (English)'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={welcomePerkEn}
                                                    onChange={(e) => setWelcomePerkEn(e.target.value)}
                                                    className="w-full h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs font-semibold text-[#1C2822]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                                        <Link
                                            href={`/?store=${encodeURIComponent(selectedPlaceId)}`}
                                            className="h-11 px-4 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#F2F9F5] text-[#1C2822] font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
                                        >
                                            <span>{isJa ? '実際のマップ画面で確認 ↗' : 'View on Live Map ↗'}</span>
                                        </Link>

                                        <button
                                            type="submit"
                                            disabled={!isVerifiedOwner || isSaving}
                                            className="h-11 px-6 rounded-full bg-[#1C2822] hover:bg-[#2C3E35] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_18px_rgba(28,40,34,0.18)] active:scale-95 transition-all disabled:opacity-45 cursor-pointer"
                                        >
                                            <span>
                                                {isSaving
                                                    ? isJa ? '保存中...' : 'Saving...'
                                                    : isJa ? '看板の一皿＆歓迎特典を保存して公開 ✓' : 'Save & Publish ✓'}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* PILLAR 2: Traveler Gochisosama Postcards Inbox (Always visible!) */}
                            <div className="nani-well">
                                <div className="px-3.5 py-2 flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#16A34A]" />
                                        <span>
                                            {isJa
                                                ? `② 旅人から届いた「ごちそうさま絵葉書」（${storeNotes.length}通）`
                                                : `2. Traveler Gochisosama Postcards (${storeNotes.length})`}
                                        </span>
                                    </span>
                                    <span className="text-[11px] font-bold text-[#15803D]">
                                        {isJa ? '日本語で返信 → 英語へ自動翻訳' : 'Auto-translated replies'}
                                    </span>
                                </div>

                                <div className="nani-sheet p-5 space-y-3">
                                    {storeNotes.length === 0 ? (
                                        <div className="rounded-[14px] bg-[#F7FBF8] border border-[#DCECE3] p-5 text-center text-xs text-[#526358]">
                                            {isJa
                                                ? 'まだこの店舗宛の絵葉書はありません。マップ画面から絵葉書を送るとここに届きます。'
                                                : 'No postcards yet for this restaurant.'}
                                        </div>
                                    ) : (
                                        storeNotes.map((note) => (
                                            <div
                                                key={note.id}
                                                className="rounded-[16px] bg-[#FAF7F0] border border-[#E5DEC9] p-4 space-y-2"
                                            >
                                                <div className="flex items-center justify-between flex-wrap gap-2">
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
                                                        完食御朱印済
                                                    </span>
                                                </div>

                                                <p className="text-xs font-bold text-[#1C2822]">
                                                    “{note.message_ja_translated}”
                                                </p>
                                                <p className="text-[11px] text-[#526358]">
                                                    Original: “{note.message_original}”
                                                </p>

                                                {note.owner_reply?.text_ja ? (
                                                    <div className="rounded-[12px] bg-white border border-[#DCECE3] p-3 text-xs">
                                                        <div className="font-extrabold text-[#15803D]">
                                                            ✓ シェフからの直筆返信（マップ上で公開中）:
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
                                                            placeholder="例: ご来店ありがとうございます！また日本へお越しの際はぜひお立ち寄りください。"
                                                            className="flex-1 h-9 rounded-[10px] border border-[#DCECE3] bg-white px-3 text-xs"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSendReply(note.id)}
                                                            disabled={replyingId === note.id}
                                                            className="h-9 px-4 rounded-full bg-[#16A34A] text-white text-xs font-bold shrink-0 active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            {replyingId === note.id ? '送信中...' : '返信を公開'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sticky Real-Time Traveler iPhone Preview + Table QR Print */}
                        <div className={`space-y-4 lg:sticky lg:top-6 ${mobileView === 'edit' ? 'hidden lg:block' : 'block'}`}>
                            <div className="rounded-[28px] bg-[#1C2822] p-3.5 text-white shadow-[0_16px_40px_rgba(20,40,30,0.18)]">
                                <div className="flex items-center justify-between px-2 pb-2.5">
                                    <span className="text-[11px] font-extrabold text-[#86EFAC] flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-[#22C55E]" />
                                        <span>
                                            {isJa
                                                ? '訪日客のスマホ画面（リアルタイムプレビュー）'
                                                : 'Live Traveler iPhone Preview'}
                                        </span>
                                    </span>
                                    <span className="text-[10px] font-bold text-white/60">
                                        EN / 日本語
                                    </span>
                                </div>

                                {/* Simulated iPhone Screen */}
                                <div className="rounded-[20px] bg-white text-[#1C2822] p-4 space-y-3.5">
                                    {/* Store Header */}
                                    <div className="border-b border-[#EDF5F0] pb-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-extrabold text-[#1C2822] truncate">
                                                {currentPlace?.name}
                                            </span>
                                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#EEF7F2] text-[#15803D] shrink-0">
                                                ✓ Verified
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#526358] font-medium">
                                            {currentPlace?.area_en || currentPlace?.area} •{' '}
                                            {currentPlace?.genre_en || currentPlace?.genre}
                                        </p>
                                    </div>

                                    {/* Live Signature Dish Card for Tourists */}
                                    <div className="rounded-[15px] bg-[#F7FBF8] border border-[#DCECE3] p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold text-[#15803D]">
                                                👑 CHEF&apos;S SIGNATURE DISH
                                            </span>
                                            <span className="text-xs font-extrabold text-[#1C2822] bg-white px-2 py-0.5 rounded-full border border-[#DCECE3]">
                                                ¥{Number(sigPrice || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-extrabold text-[#1C2822] leading-snug">
                                                {sigNameEn || "Chef's Signature Vegan Dish"}
                                            </p>
                                            <p className="text-[11px] font-bold text-[#15803D]">
                                                {sigNameJa}
                                            </p>
                                            <p className="text-[11px] text-[#526358] mt-1 line-clamp-2">
                                                {sigDescEn || sigDescJa}
                                            </p>
                                        </div>
                                        <div className="rounded-[11px] bg-[#EEF7F2] border border-[#C5DDD0] p-2.5">
                                            <span className="block text-[9.5px] font-extrabold text-[#15803D]">
                                                🎁 FREE WELCOME PERK
                                            </span>
                                            <p className="text-[11px] font-bold text-[#1C2822] mt-0.5 leading-snug">
                                                {welcomePerkEn || welcomePerkJa}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Simulated Staff Order Ticket Preview */}
                                    <div className="rounded-[15px] bg-[#FAF7F0] border-2 border-[#1C2822] p-3 space-y-1.5">
                                        <span className="text-[9.5px] font-extrabold text-[#15803D]">
                                            🗣️ 店員さんに提示される日本語注文票
                                        </span>
                                        <p className="text-xs font-black text-[#1C2822]">
                                            「{sigNameJa || '看板メニュー'}」をお願いします
                                        </p>
                                        <p className="text-[10.5px] font-bold text-[#526358]">
                                            特典: {welcomePerkJa}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Printable Table QR Stand Card */}
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="w-full nani-dashed p-4 text-left flex items-center justify-between gap-3 bg-white/80 hover:bg-white cursor-pointer"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-[11px] bg-[#EEF7F2] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9" />
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                            <rect x="6" y="14" width="12" height="8" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-xs font-extrabold text-[#1C2822]">
                                            {isJa
                                                ? '卓上用「完食御朱印＆絵葉書QRポップ」を印刷'
                                                : 'Print Tabletop Stamp & Postcard QR Stand'}
                                        </div>
                                        <p className="text-[11px] text-[#526358] mt-0.5 font-medium">
                                            {isJa
                                                ? '食後のゲストがQRから御朱印を集めてInstagram拡散'
                                                : 'Let diners scan after eating to collect your stamp'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-[#15803D] shrink-0">
                                    {isJa ? '印刷 →' : 'Print →'}
                                </span>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
