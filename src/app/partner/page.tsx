'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
  const [notes, setNotes] = useState<GratitudeNote[]>([]);
  const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('ChIJL8ZEXViRQTURgeN1wM_GJ6E');
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

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
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
    } catch {}
  }, []);

  useEffect(() => {
    fetchEcosystem();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const st = params.get('store') || params.get('claim');
      if (st) setSelectedPlaceId(st);
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
      allPlaces.find((p) => p.google_place_id === selectedPlaceId) || allPlaces[0],
    [allPlaces, selectedPlaceId]
  );

  const currentOfficial = storesMap[selectedPlaceId] || null;
  const isVerifiedOwner = Boolean(currentOfficial?.verification_cert?.is_verified);

  // Populate form when switching stores
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

    // Reset OTP box on store switch
    setIssuedOtpDemo(null);
    setOtpInput('');
    setVerifyError(null);
    setVerifyIdentifier(
      currentPlace.instagram_id
        ? `@${currentPlace.instagram_id}`
        : `@${currentPlace.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    );
    setVerifyOwnerName(`${currentPlace.name_ja || currentPlace.name} オーナーシェフ`);
  }, [currentPlace, currentOfficial]);

  const storeNotes = useMemo(
    () => notes.filter((n) => n.place_id === selectedPlaceId),
    [notes, selectedPlaceId]
  );

  // Request 6-digit Anti-Spoofing OTP
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
        showNotice(`🔐 6桁の本人確認コード（${data.otp_code}）を発行しました`);
      }
    } catch {
      setVerifyError('通信エラーが発生しました');
    } finally {
      setIsVerifying(false);
    }
  };

  // Confirm 6-digit OTP to unlock store
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
        showNotice('✅ オーナー本人確認が完了し、認定証明書が発行されました！');
      } else {
        setVerifyError(data.error || '認証コードが一致しません');
      }
    } catch {
      setVerifyError('認証処理に失敗しました');
    } finally {
      setIsVerifying(false);
    }
  };

  // Save Signature Dish & Welcome Perk
  const handleSaveSignatureAndPerk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlace) return;
    setIsSaving(true);

    const existingMenu = getEffectiveVerifiedMenu(currentPlace, currentOfficial);
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
          owner_id: currentOfficial?.owner_id || `partner-${selectedPlaceId}`,
          owner_name:
            currentOfficial?.owner_name ||
            `${currentPlace.name_ja || currentPlace.name} オーナー`,
          chef_greeting_ja: chefGreetingJa.trim(),
          welcome_perk_ja: welcomePerkJa.trim(),
          welcome_perk_en: welcomePerkEn.trim() || welcomePerkJa.trim(),
          verified_menu: updatedMenu,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEcosystem();
        showNotice('✨ 「看板の一皿」と「画面提示の歓迎特典」を保存・公開しました！');
      }
    } catch {
      showNotice('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Reply to Traveler's Gochisosama Postcard
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
        showNotice('💌 旅人の絵葉書へ直筆返信を届けました（英語へ自動翻訳済）！');
      }
    } catch {} finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-slate-900 pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-black border border-white/15">
          {toastMsg}
        </div>
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <span>←</span>
              <span>マップへ戻る</span>
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900">
                🏪 Vegan.jp 店舗オーナー画面（集客＆ファンづくりスタジオ）
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">
                やることは「① 看板の一皿＆歓迎特典の登録」と「② ごちそうさま絵葉書への返信」の2つだけ！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/growth"
              className="text-xs font-black px-3 py-1.5 rounded-full bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200 transition-colors"
            >
              🚀 自動集客・自己修復センター
            </Link>
            <Link
              href="/guide"
              className="text-xs font-black px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
            >
              ❓ 活用ガイド・Q&A
            </Link>
            <Link
              href={`/?store=${encodeURIComponent(selectedPlaceId)}`}
              className="text-xs font-black px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              📱 旅人から見える画面を確認
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* ─── Top Store Selector & Anti-Spoofing Status Bar ─── */}
        <section className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
              管理する店舗を選択 / Select Your Restaurant
            </label>
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="w-full max-w-md rounded-2xl border-2 border-slate-200 px-3.5 py-2.5 text-sm font-black text-slate-900 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
            >
              {allPlaces.slice(0, 60).map((p) => {
                const verified = storesMap[p.google_place_id]?.verification_cert?.is_verified;
                return (
                  <option key={p.google_place_id} value={p.google_place_id}>
                    {verified ? '✅ [本人確認済] ' : '🔒 [未認証] '}
                    {p.name_ja || p.name}（{p.area}）
                  </option>
                );
              })}
            </select>
          </div>

          {isVerifiedOwner && currentOfficial?.verification_cert ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-black text-emerald-900">
                <span>🛡️ 公式オーナー本人確認済</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px]">
                  {currentOfficial.verification_cert.certificate_id}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {currentOfficial.verification_cert.method_label_ja}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs">
              <p className="font-black text-amber-950">
                🔒 未認証店舗（なりすまし防止ロック中）
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                第三者による勝手な書き換えを防ぐため、6桁コードでオーナー確認を行ってください。
              </p>
            </div>
          )}
        </section>

        {/* ─── If Unverified: Anti-Spoofing 6-Digit OTP Verification Gate ─── */}
        {!isVerifiedOwner ? (
          <section className="rounded-3xl bg-white border-2 border-amber-300 p-6 shadow-md space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 mb-2">
                  🛡️ なりすまし防止・店舗オーナー本人確認ゲート
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  「{currentPlace?.name_ja || currentPlace?.name}」のオーナー様ですか？
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  無関係な第三者が店舗の看板メニューや返信を改ざんできないよう、以下3つのいずれかで6桁のワンタイム認証コード（OTP）を発行・照合します。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'instagram_official' as const,
                  icon: '📸',
                  title: '① 公式Instagram 照合',
                  desc: '店舗公式InstagramのDMへ6桁の認証コードを送信',
                },
                {
                  id: 'phone_otp' as const,
                  icon: '📞',
                  title: '② 店舗固定電話 / ドメインOTP',
                  desc: '地図登録の店舗電話番号へ自動音声/SMSコード送信',
                },
                {
                  id: 'business_license' as const,
                  icon: '📜',
                  title: '③ 飲食店営業許可証 照合',
                  desc: '保健所の営業許可番号と店舗所在地を照合',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setVerifyMethod(m.id)}
                  className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    verifyMethod === m.id
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <p className="text-xs font-black text-slate-900">{m.title}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  照合先アカウント / 電話番号 / 許可番号
                </label>
                <input
                  type="text"
                  value={verifyIdentifier}
                  onChange={(e) => setVerifyIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  オーナー・ご担当者名
                </label>
                <input
                  type="text"
                  value={verifyOwnerName}
                  onChange={(e) => setVerifyOwnerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isVerifying}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-sm"
              >
                🔑 6桁の本人確認コード（OTP）を発行する
              </button>

              {issuedOtpDemo && (
                <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-400 px-4 py-2 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-950">
                    発行コード: <b className="text-base font-black">{issuedOtpDemo}</b>
                  </span>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="6桁コード"
                    className="w-28 rounded-xl border border-emerald-300 px-2.5 py-1.5 text-xs font-black text-center bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmOtp}
                    disabled={isVerifying}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                  >
                    認証してロック解除
                  </button>
                </div>
              )}
            </div>

            {verifyError && (
              <p className="text-xs font-bold text-rose-600">{verifyError}</p>
            )}
          </section>
        ) : (
          /* ─── Verified Store Owner Studio: ONLY 2 POWERFUL PILLARS! ─── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN (7 cols): PILLAR 1 — Signature Dish & Welcome Perk (新規来店を増やす) */}
            <section className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3.5">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 mb-1">
                  STEP 1 • 新規の訪日客が「この一皿目当て」に来店する
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  👑 「看板の一皿」と「🎁 画面提示の歓迎特典」の設定
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  細かいメニュー表は不要です。「絶対に食べてほしい自慢の1品」と「画面提示のちょっと嬉しい特典」を載せるだけで、旅人の来店率と客単価が劇的に上がります。
                </p>
              </div>

              <form onSubmit={handleSaveSignatureAndPerk} className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                  <p className="text-xs font-black text-amber-950">
                    🍽️ ここに来たら絶対これ！お店の「看板の一皿（Signature Dish）」
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        看板メニュー名（日本語）
                      </label>
                      <input
                        type="text"
                        value={sigNameJa}
                        onChange={(e) => setSigNameJa(e.target.value)}
                        className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        税込価格（円）
                      </label>
                      <input
                        type="number"
                        value={sigPrice}
                        onChange={(e) => setSigPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      英語メニュー名（海外の旅人に表示されます）
                    </label>
                    <input
                      type="text"
                      value={sigNameEn}
                      onChange={(e) => setSigNameEn(e.target.value)}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      この一皿のストーリー・こだわり（地元食材や味の決め手など）
                    </label>
                    <textarea
                      rows={2}
                      value={sigDescJa}
                      onChange={(e) => setSigDescJa(e.target.value)}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Welcome Perk Setting */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <p className="text-xs font-black text-emerald-950">
                    🎁 Vegan.jp 注文画面提示の「来店歓迎特典（Welcome Treat）」
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    旅人が注文時にスマホ画面を見せた際のミニ特典（例：トッピング1品、ミニクッキー、替え玉ハーフ等）を設定すると、他店より圧倒的に選ばれます。
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      歓迎特典の内容（日本語）
                    </label>
                    <input
                      type="text"
                      value={welcomePerkJa}
                      onChange={(e) => setWelcomePerkJa(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      歓迎特典の内容（英語）
                    </label>
                    <input
                      type="text"
                      value={welcomePerkEn}
                      onChange={(e) => setWelcomePerkEn(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Chef's Greeting */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    👨‍🍳 シェフ・スタッフからの歓迎メッセージ
                  </label>
                  <textarea
                    rows={2}
                    value={chefGreetingJa}
                    onChange={(e) => setChefGreetingJa(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all"
                >
                  {isSaving
                    ? '保存中...'
                    : '✨ 「看板の一皿」と「歓迎特典」を保存してマップに公開する'}
                </button>
              </form>
            </section>

            {/* RIGHT COLUMN (5 cols): PILLAR 2 — Gochisosama Postcards & Replies (旅の思い出ブースト＆口コミ連鎖) */}
            <section className="lg:col-span-5 rounded-3xl bg-[#FCF9F2] border-2 border-rose-200/90 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col">
              <div className="border-b border-rose-200/60 pb-3.5">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 mb-1">
                  STEP 2 • 旅の思い出がブーストし、口コミで次のお客様が増える
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  💌 届いた「ごちそうさま絵葉書」への返信（{storeNotes.length}件）
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  日本語で一言返信するだけで英語へ自動翻訳され、旅人の「御朱印絵葉書」にシェフの返信が刻まれます！
                </p>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[540px] pr-1">
                {storeNotes.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/80 border border-amber-200 text-center space-y-1">
                    <p className="text-2xl">💮</p>
                    <p className="text-xs font-bold text-slate-700">
                      まだこの店舗への絵葉書はありません。
                    </p>
                  </div>
                ) : (
                  storeNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl bg-white border border-amber-200/90 p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900">
                          {note.stamp_emoji} {note.sender_name}{' '}
                          <span className="text-slate-500 font-semibold">
                            ({note.sender_country})
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          💮 {note.stamp_title_ja}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                        <p className="text-xs font-bold text-slate-900 leading-relaxed">
                          🇯🇵 {note.message_ja_translated}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          原文: &ldquo;{note.message_original}&rdquo;
                        </p>
                      </div>

                      {note.owner_reply ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                          <p className="text-[10px] font-black text-emerald-900">
                            ✓ 返信済み（{note.owner_reply.chef_name}）
                          </p>
                          <p className="text-xs text-emerald-950">
                            {note.owner_reply.text_ja}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            value={
                              replyDrafts[note.id] ??
                              `${note.sender_name}さん、ご来店と温かい絵葉書をありがとうございます！素敵な日本旅行になりますように🌱またいつでもお立ち寄りください！`
                            }
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [note.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                          />
                          <button
                            type="button"
                            disabled={replyingId === note.id}
                            onClick={() => {
                              if (!replyDrafts[note.id]) {
                                replyDrafts[note.id] = `${note.sender_name}さん、ご来店と温かい絵葉書をありがとうございます！素敵な日本旅行になりますように🌱またいつでもお立ち寄りください！`;
                              }
                              handleSendReply(note.id);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer transition-colors"
                          >
                            {replyingId === note.id
                              ? '送信中...'
                              : '💌 この内容で返信する（英語へ自動翻訳）'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
