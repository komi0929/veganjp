'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MASTER_PLACES } from '@/lib/places-master';
import type {
  Place,
  StoreOfficialData,
  GratitudeNote,
  MenuItem,
  KitchenAudit,
  LiveKitchenStatus,
  OwnerVerificationCertificate,
} from '@/lib/types';
import {
  getEffectiveKitchenAudit,
  getEffectiveVerifiedMenu,
  translateOwnerReplyToEn,
} from '@/lib/kitchen-defaults';
import ToastContainer, { showToast } from '@/components/Toast';

type StepTab = 'step1_menu_audit' | 'step2_qr' | 'step3_inbox_live' | 'find_or_add';

function PartnerDashboardInner() {
  const searchParams = useSearchParams();
  const initialPlaceParam = searchParams.get('placeId');

  // ─── Ecosystem Server State ───
  const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
  const [gratitudeNotes, setGratitudeNotes] = useState<GratitudeNote[]>([]);
  const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Active Store & Step Navigation ───
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    initialPlaceParam || 'ChIJL8ZEXViRQTURgeN1wM_GJ6E'
  );
  const [activeTab, setActiveTab] = useState<StepTab>('step3_inbox_live');
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(true);

  // ─── Anti-Spoofing Verification State (なりすまし防止・3段階本人確認) ───
  const [verifyMethod, setVerifyMethod] =
    useState<OwnerVerificationCertificate['method']>('instagram_official');
  const [verifyIdentifier, setVerifyIdentifier] = useState('');
  const [verifyOwnerName, setVerifyOwnerName] = useState('');
  const [issuedOtpPreview, setIssuedOtpPreview] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // ─── Editable Store State ───
  const [ownerName, setOwnerName] = useState('SoyStories 薬院 オーナーシェフ');
  const [ownerRole, setOwnerRole] = useState('ストアマネージャー / パティシエ');
  const [liveStatusType, setLiveStatusType] =
    useState<LiveKitchenStatus['status']>('open_available');
  const [liveMessageJa, setLiveMessageJa] = useState('');
  const [liveMessageEn, setLiveMessageEn] = useState('');
  const [chefGreetingJa, setChefGreetingJa] = useState('');
  const [chefGreetingEn, setChefGreetingEn] = useState('');
  const [auditState, setAuditState] = useState<KitchenAudit>({
    dashi_type: '100_plant',
    fryer_oil: 'dedicated',
    cookware: 'dedicated',
    allium_free: 'all_free',
    gluten_free: '100_gf',
    alcohol_free: 'alcohol_free',
    sugar_honey: 'no_bone_char_no_honey',
    payment_methods: ['Credit Card', 'PayPay / QR', 'Suica / IC', 'Cash'],
    reservation_policy: 'walk_in_ok',
    english_support: 'english_menu_and_staff',
  });
  const [menuList, setMenuList] = useState<MenuItem[]>([]);

  // ─── New Menu Item Form ───
  const [newMenuNameJa, setNewMenuNameJa] = useState('');
  const [newMenuNameEn, setNewMenuNameEn] = useState('');
  const [newMenuDescJa, setNewMenuDescJa] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('1200');
  const [newMenuGF, setNewMenuGF] = useState(true);
  const [newMenuAlliumFree, setNewMenuAlliumFree] = useState(true);
  const [newMenuPopular, setNewMenuPopular] = useState(true);
  const [newMenuOrderNote, setNewMenuOrderNote] = useState('');

  // ─── Gratitude Reply Drafts ───
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // ─── Store Search & Brand-New Store Form ───
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [newStoreNameJa, setNewStoreNameJa] = useState('');
  const [newStoreNameEn, setNewStoreNameEn] = useState('');
  const [newStoreCity, setNewStoreCity] = useState<'tokyo' | 'kyoto' | 'osaka' | 'fukuoka'>('tokyo');
  const [newStoreArea, setNewStoreArea] = useState('');
  const [newStoreGenre, setNewStoreGenre] = useState('カフェ');
  const [newStoreProfileJa, setNewStoreProfileJa] = useState('');
  const [newStorePermitNumber, setNewStorePermitNumber] = useState('');

  const allPlaces = useMemo<Place[]>(() => {
    const existingIds = new Set(customPlaces.map((c) => c.google_place_id));
    return [
      ...customPlaces,
      ...MASTER_PLACES.filter((p) => !existingIds.has(p.google_place_id)),
    ];
  }, [customPlaces]);

  const currentPlace = useMemo<Place>(() => {
    return (
      allPlaces.find(
        (p) => p.google_place_id === selectedPlaceId || p.id === selectedPlaceId
      ) || allPlaces[0]
    );
  }, [allPlaces, selectedPlaceId]);

  const fetchEcosystem = useCallback(async () => {
    try {
      const res = await fetch('/api/ecosystem', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStoresMap(data.stores || {});
        setGratitudeNotes(data.gratitude_notes || []);
        setCustomPlaces(data.custom_places || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEcosystem();
  }, [fetchEcosystem]);

  // Synchronize form fields when store changes
  useEffect(() => {
    if (!currentPlace) return;
    const official = storesMap[currentPlace.google_place_id];
    const effectiveAudit = getEffectiveKitchenAudit(currentPlace, official);
    const effectiveMenu = getEffectiveVerifiedMenu(currentPlace, official);

    setAuditState(effectiveAudit);
    setMenuList(effectiveMenu);
    setIssuedOtpPreview(null);
    setOtpInput('');
    setVerifyIdentifier(currentPlace.instagram_id || '福岡市保健所 許可第2026-0841号');
    setVerifyOwnerName(`${currentPlace.name_ja || currentPlace.name} オーナーシェフ`);

    if (official) {
      setOwnerName(official.owner_name || `${currentPlace.name} オーナー`);
      setOwnerRole(official.role_title || 'オーナーシェフ');
      setChefGreetingJa(official.chef_greeting_ja || currentPlace.profile_text || '');
      setChefGreetingEn(official.chef_greeting_en || currentPlace.profile_text_en || '');
      setLiveStatusType(official.live_status?.status || 'open_available');
      setLiveMessageJa(
        official.live_status?.message_ja ||
          `🟢 本日営業中！100%植物性の厳選メニューをご用意してお待ちしております🌱`
      );
      setLiveMessageEn(
        official.live_status?.message_en ||
          `🟢 Open today! Freshly prepared plant-based dishes ready for you 🌱`
      );
    } else {
      setOwnerName(`${currentPlace.name_ja || currentPlace.name} オーナーシェフ`);
      setOwnerRole('店舗代表 / オーナー');
      setChefGreetingJa(currentPlace.profile_text || '');
      setChefGreetingEn(currentPlace.profile_text_en || '');
      setLiveStatusType('open_available');
      setLiveMessageJa(
        `🟢 本日営業中！${currentPlace.name}のヴィーガンメニューをご用意してお待ちしております🌱`
      );
      setLiveMessageEn(
        `🟢 Open Now! Welcome to ${currentPlace.name}. Verified plant-based options available today 🌱`
      );
    }
  }, [currentPlace, storesMap]);

  const currentOfficialData = currentPlace
    ? storesMap[currentPlace.google_place_id]
    : undefined;
  const isVerifiedOwner = !!currentOfficialData?.is_official_verified;
  const verificationCert = currentOfficialData?.verification_cert;

  const storeGratitudeNotes = useMemo(() => {
    if (!currentPlace) return [];
    return gratitudeNotes.filter(
      (n) => n.place_id === currentPlace.google_place_id
    );
  }, [gratitudeNotes, currentPlace]);

  const filteredSearchPlaces = useMemo(() => {
    const q = storeSearchQuery.toLowerCase().trim();
    if (!q) return allPlaces.slice(0, 6);
    return allPlaces
      .filter((p) => {
        const text = `${p.name} ${p.name_ja || ''} ${p.area || ''} ${
          p.area_en || ''
        } ${p.prefecture || ''}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 8);
  }, [allPlaces, storeSearchQuery]);

  // ─── Anti-Spoofing Step 1: Request 6-Digit OTP Verification Code ───
  const handleRequestVerificationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlace) return;
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_verification_otp',
          place_id: currentPlace.google_place_id,
          method: verifyMethod,
          identifier: verifyIdentifier.trim() || '@official_store',
          owner_name: verifyOwnerName.trim() || `${currentPlace.name} オーナー`,
        }),
      });
      const data = await res.json();
      if (data.ok && data.otp_code) {
        setIssuedOtpPreview(data.otp_code);
        setOtpInput(data.otp_code);
        showToast('本人確認用の6桁ワンタイム認証コードを発行しました！', '🔐');
      }
    } catch (err) {
      showToast('通信エラーが発生しました', '⚠️');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ─── Anti-Spoofing Step 2: Confirm 6-Digit OTP & Unlock Store Ownership ───
  const handleConfirmVerificationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlace) return;
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_verification_otp',
          place_id: currentPlace.google_place_id,
          otp_code: otpInput,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        showToast(data.error || '認証コードが一致しません', '⚠️');
        return;
      }
      await fetchEcosystem();
      setIssuedOtpPreview(null);
      setActiveTab('step1_menu_audit');
      showToast(
        `本人確認が完了し、認定証明書 (${data.cert?.certificate_id}) が発行されました！`,
        '🏅'
      );
    } catch (err) {
      showToast('通信エラーが発生しました', '⚠️');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ─── Save Store Official Data ───
  const handleSaveStoreData = async (
    customMenuOverride?: MenuItem[],
    toastMessage = '店舗公式データを保存し、ライブマップへ即時反映しました！'
  ) => {
    if (!currentPlace || !isVerifiedOwner) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_store',
          place_id: currentPlace.google_place_id,
          owner_id: `partner-${currentPlace.id}`,
          owner_name: ownerName,
          role_title: ownerRole,
          verification_cert: verificationCert,
          chef_greeting_ja: chefGreetingJa,
          chef_greeting_en: chefGreetingEn,
          live_status: {
            status: liveStatusType,
            message_ja: liveMessageJa,
            message_en: liveMessageEn,
            updated_at: new Date().toISOString(),
          },
          kitchen_audit: auditState,
          verified_menu: customMenuOverride ?? menuList,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEcosystem();
        showToast(toastMessage, '🏅');
      }
    } catch (e) {
      showToast('通信エラーが発生しました', '⚠️');
    } finally {
      setSaving(false);
    }
  };

  // ─── Add / Delete Menu Item ───
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuNameJa.trim() || !isVerifiedOwner) return;

    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name_ja: newMenuNameJa.trim(),
      name_en:
        newMenuNameEn.trim() ||
        `${newMenuNameJa.trim()} (Verified Plant-Based Dish)`,
      description_ja:
        newMenuDescJa.trim() ||
        '動物性食材・魚介出汁を一切使用しない特製ヴィーガンメニュー。',
      description_en:
        '100% plant-based specialty prepared completely free of animal ingredients and fish dashi.',
      price_jpy: parseInt(newMenuPrice, 10) || 1000,
      is_100_vegan: true,
      is_gluten_free: newMenuGF,
      is_allium_free: newMenuAlliumFree,
      is_popular: newMenuPopular,
      order_note_ja:
        newMenuOrderNote.trim() || `${newMenuNameJa.trim()}を1つお願いします`,
    };

    const updatedMenu = [newItem, ...menuList];
    setMenuList(updatedMenu);
    setNewMenuNameJa('');
    setNewMenuNameEn('');
    setNewMenuDescJa('');
    setNewMenuOrderNote('');

    await handleSaveStoreData(
      updatedMenu,
      `新メニュー「${newItem.name_ja}」を指差し注文票に追加しました！`
    );
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!isVerifiedOwner) return;
    const updatedMenu = menuList.filter((m) => m.id !== id);
    setMenuList(updatedMenu);
    await handleSaveStoreData(updatedMenu, 'メニュー構成を更新しました');
  };

  // ─── Reply to Gratitude Note ───
  const handleSendOwnerReply = async (note: GratitudeNote) => {
    if (!isVerifiedOwner) return;
    const textJa = (replyDrafts[note.id] || '').trim();
    if (!textJa) {
      showToast('返信メッセージを入力してください', '✏️');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_gratitude',
          note_id: note.id,
          text_ja: textJa,
          text_en: translateOwnerReplyToEn(textJa, currentPlace.name),
          chef_name: `${ownerName} (${currentPlace.name})`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEcosystem();
        showToast(
          '訪日客への公式返信を公開しました！マップ上の店舗カードにも表示されます💌',
          '👨‍🍳'
        );
      }
    } catch (e) {
      showToast('エラーが発生しました', '⚠️');
    } finally {
      setSaving(false);
    }
  };

  // ─── Register a Brand-New Store with Permit Verification ───
  const handleRegisterNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreNameJa.trim()) return;

    const cityCoords: Record<
      string,
      { lat: number; lng: number; prefJa: string; prefEn: string }
    > = {
      tokyo: {
        lat: 35.669 + (Math.random() - 0.5) * 0.02,
        lng: 139.705 + (Math.random() - 0.5) * 0.02,
        prefJa: '東京都',
        prefEn: 'Tokyo',
      },
      kyoto: {
        lat: 35.008 + (Math.random() - 0.5) * 0.02,
        lng: 135.768 + (Math.random() - 0.5) * 0.02,
        prefJa: '京都府',
        prefEn: 'Kyoto',
      },
      osaka: {
        lat: 34.678 + (Math.random() - 0.5) * 0.02,
        lng: 135.502 + (Math.random() - 0.5) * 0.02,
        prefJa: '大阪府',
        prefEn: 'Osaka',
      },
      fukuoka: {
        lat: 33.585 + (Math.random() - 0.5) * 0.02,
        lng: 130.398 + (Math.random() - 0.5) * 0.02,
        prefJa: '福岡県',
        prefEn: 'Fukuoka',
      },
    };

    const coords = cityCoords[newStoreCity] || cityCoords.tokyo;
    const newId = `custom-spot-${Date.now()}`;
    const newPlace: Place = {
      id: newId,
      google_place_id: newId,
      name: newStoreNameEn.trim() || newStoreNameJa.trim(),
      name_ja: newStoreNameJa.trim(),
      lat: coords.lat,
      lng: coords.lng,
      genre: newStoreGenre,
      genre_en:
        newStoreGenre === 'ラーメン'
          ? 'Ramen'
          : newStoreGenre === 'カフェ'
          ? 'Cafe & Bakery'
          : 'Plant-Based Bistro',
      area: newStoreArea.trim() || coords.prefJa,
      area_en: `${newStoreArea.trim() || coords.prefEn}, ${coords.prefEn}`,
      prefecture: coords.prefJa,
      prefecture_en: coords.prefEn,
      profile_text:
        newStoreProfileJa.trim() ||
        `${newStoreNameJa.trim()}。植物性食材にこだわった公式登録店舗です。`,
      profile_text_en: `Official partner restaurant ${
        newStoreNameEn.trim() || newStoreNameJa.trim()
      }. Verified plant-based kitchen.`,
      features: ['100%ヴィーガン', '店舗公式登録', '魚介出汁不使用'],
      features_en: ['Official Partner', 'No Fish Dashi', 'Point & Order Menu'],
      dietary_type: '100%_vegan',
      created_at: new Date().toISOString(),
    };

    const newCert: OwnerVerificationCertificate = {
      is_verified: true,
      method: 'business_license',
      method_label_ja: `保健所・飲食店営業許可証 (${
        newStorePermitNumber.trim() || '許可番号照合済'
      }) 照合済`,
      method_label_en: `Verified via Restaurant Operating Permit (${
        newStorePermitNumber.trim() || 'Permit Verified'
      })`,
      verified_identifier: newStorePermitNumber.trim() || '飲食店営業許可証照合済',
      verified_at: new Date().toISOString(),
      certificate_id: `CERT-VGJP-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setSaving(true);
    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_store',
          place_id: newPlace.google_place_id,
          owner_id: `partner-${Date.now()}`,
          owner_name: `${newPlace.name_ja} オーナーシェフ`,
          role_title: 'オーナーシェフ',
          verification_cert: newCert,
          chef_greeting_ja: newPlace.profile_text,
          chef_greeting_en: newPlace.profile_text_en,
          live_status: {
            status: 'open_available',
            message_ja: `🟢 新規公式オープン！${newPlace.name_ja}のヴィーガンメニューをご用意してお待ちしております🌱`,
            message_en: `🟢 Newly Verified Partner! Welcome to ${newPlace.name}. Fresh plant-based menu ready 🌱`,
            updated_at: new Date().toISOString(),
          },
          kitchen_audit: auditState,
          verified_menu: getEffectiveVerifiedMenu(newPlace, null),
          custom_place_data: newPlace,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEcosystem();
        setSelectedPlaceId(newPlace.google_place_id);
        setActiveTab('step1_menu_audit');
        showToast(
          `新規店舗「${newPlace.name_ja}」を営業許可証照合付きでマップに公開しました！`,
          '🎉'
        );
      }
    } catch (e) {
      showToast('登録中にエラーが発生しました', '⚠️');
    } finally {
      setSaving(false);
    }
  };

  const deepLinkUrl =
    typeof window !== 'undefined' && currentPlace
      ? `${window.location.origin}/?place=${encodeURIComponent(
          currentPlace.google_place_id
        )}`
      : `https://vegan.jp/?place=${encodeURIComponent(
          currentPlace?.google_place_id || ''
        )}`;

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-slate-900 font-sans pb-24">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href={`/?place=${encodeURIComponent(
                currentPlace?.google_place_id || ''
              )}`}
              className="flex items-center gap-1.5"
            >
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-base font-black tracking-tight text-slate-900">
                vegan<span className="text-emerald-600">.jp</span>
              </span>
            </Link>
            <span className="text-xs font-extrabold bg-emerald-950 text-emerald-200 px-3 py-1 rounded-full">
              🏪 飲食店パートナー管理画面
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/guide"
              className="text-xs font-extrabold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-full transition-colors"
            >
              📖 はじめての店舗様へ（導入LP・なりすまし防止Q&amp;A）
            </Link>

            <Link
              href={`/?place=${encodeURIComponent(
                currentPlace?.google_place_id || ''
              )}`}
              className="text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-full shadow-xs transition-colors flex items-center gap-1"
            >
              <span>🗺️ マップでこの店舗を見る</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* ─── First-Time Visual 3-Step Guide Banner (初見でも3秒でわかる案内) ─── */}
        {showOnboardingGuide && (
          <section className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  WELCOME TO VEGAN.JP PARTNER PORTAL — 完全無料・英語不要
                </span>
                <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                  飲食店オーナー様がやることは、シンプルな「3ステップ」だけです
                </h2>
              </div>
              <button
                onClick={() => setShowOnboardingGuide(false)}
                className="text-xs text-emerald-200 hover:text-white bg-white/10 px-2.5 py-1 rounded-full cursor-pointer shrink-0"
              >
                ガイドを閉じる ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div
                onClick={() => setActiveTab('step1_menu_audit')}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer transition-all space-y-1"
              >
                <div className="font-black text-emerald-300">
                  STEP 1. 🍜 指差しメニュー＆出汁の登録
                </div>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  ヴィーガン対応可能な料理名と価格を日本語で登録。外国人客がスマホで選んで「日本語の確定注文票」を店員に見せてくれるため、英語接客がゼロになります。
                </p>
              </div>

              <div
                onClick={() => setActiveTab('step2_qr')}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer transition-all space-y-1"
              >
                <div className="font-black text-emerald-300">
                  STEP 2. 🖨️ 店頭用QRポップを印刷して設置
                </div>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  専用QRコードを印刷してテーブルやレジ横に置くだけ。来店客がスキャンすると世界8言語のメニューと指差し注文票が開きます。
                </p>
              </div>

              <div
                onClick={() => setActiveTab('step3_inbox_live')}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 cursor-pointer transition-all space-y-1"
              >
                <div className="font-black text-emerald-300">
                  STEP 3. 💌 感謝レター返信＆営業状況発信
                </div>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  食後の外国人客から「日本語に自動翻訳された感謝レター」が届きます。日本語で一言返信すると英語翻訳付きでマップに公開されます。
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── Active Store Header & Anti-Spoofing Verification Status ─── */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {isVerifiedOwner ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                    <span>🛡️ 本人確認済オーナー</span>
                    {verificationCert && (
                      <span className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded-full">
                        {verificationCert.certificate_id}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                    <span>🔒 未認証店舗（なりすまし防止ロック中）</span>
                  </span>
                )}
                <span className="text-xs text-slate-500 font-semibold">
                  📍 {currentPlace?.area} ({currentPlace?.genre})
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentPlace?.name_ja || currentPlace?.name}
              </h1>

              {isVerifiedOwner && verificationCert && (
                <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span>✓ なりすまし防止認証記録:</span>
                  <span>{verificationCert.method_label_ja}</span>
                </p>
              )}
            </div>

            {/* Store Selector Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <optgroup label="🛡️ 本人確認済パートナー店舗（すぐに管理画面を試せます）">
                  <option value="ChIJL8ZEXViRQTURgeN1wM_GJ6E">
                    🍨 SoyStories（ソイストーリーズ）薬院 [福岡・本人確認済]
                  </option>
                  <option value="vegan-ramen-01">
                    🍜 Vegan Ramen YADOKARI [福岡・本人確認済]
                  </option>
                  <option value="vegan-ramen-07">
                    🍜 MERCY Vegan Ramen [大阪・本人確認済]
                  </option>
                </optgroup>
                <optgroup label="🔒 未認証店舗（なりすまし防止・本人確認ロックのテスト用）">
                  <option value="vegan-ramen-02">
                    🔒 鮨しま（ヴィーガン豚骨風ラーメン）[未認証ロック中]
                  </option>
                  <option value="vegan-ramen-03">
                    🔒 BUGORO ALL VEGAN [未認証ロック中]
                  </option>
                  <option value="vegan-ramen-06">
                    🔒 Rota Cafe 大名店 [未認証ロック中]
                  </option>
                </optgroup>
                {customPlaces.length > 0 && (
                  <optgroup label="✨ 新規登録された店舗">
                    {customPlaces.map((cp) => (
                      <option key={cp.google_place_id} value={cp.google_place_id}>
                        🌱 {cp.name_ja || cp.name} [{cp.area}]
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <button
                onClick={() => setActiveTab('find_or_add')}
                className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl transition-colors cursor-pointer shrink-0"
              >
                🔍 506店から検索 / 新規店舗登録
              </button>
            </div>
          </div>
        </section>

        {/* =======================================================================
         * 🔒 ANTI-SPOOFING OWNER VERIFICATION GATE (未認証店舗を選択した際に表示)
         * ======================================================================= */}
        {!isVerifiedOwner && activeTab !== 'find_or_add' ? (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-md space-y-6">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shrink-0">
                🔐
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  ANTI-SPOOFING SECURITY LOCK / なりすまし防止・本人確認ロック
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  「{currentPlace?.name_ja || currentPlace?.name}」の編集にはオーナー本人確認が必要です
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  第三者による「なりすまし編集」や「虚偽のアレルゲン・出汁情報の書き換え」を防ぐため、以下の3つの公式確認方法のいずれかで<strong>6桁のワンタイム認証コード（OTP）照合</strong>を完了したオーナー様のみが管理画面をロック解除できます。
                </p>
              </div>
            </div>

            {/* 3 Verification Methods Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                {
                  id: 'instagram_official' as const,
                  icon: '📸',
                  title: '方法① 公式Instagram照合',
                  desc: `店舗公式Instagram (${
                    currentPlace?.instagram_id || '@店舗公式ID'
                  }) で6桁認証コードを照合`,
                  defaultId: currentPlace?.instagram_id || '@official_vegan_shop',
                },
                {
                  id: 'phone_otp' as const,
                  icon: '📞',
                  title: '方法② 店舗登録固定電話OTP',
                  desc: 'Googleマップ登録の店舗固定電話へ自動音声/SMSで6桁コードを通知',
                  defaultId: '092-555-0199（Google Maps登録番号）',
                },
                {
                  id: 'business_license' as const,
                  icon: '📄',
                  title: '方法③ 飲食店営業許可証番号',
                  desc: '保健所交付の「飲食店営業許可証」の許可番号と施設名で公的照合',
                  defaultId: '福岡市保健所 許可第2026-0841号',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setVerifyMethod(m.id);
                    setVerifyIdentifier(m.defaultId);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    verifyMethod === m.id
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="font-black text-slate-900">{m.title}</div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Step 1: Request OTP Code */}
            <form
              onSubmit={handleRequestVerificationOtp}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    照合する公式アカウントID / 電話番号 / 営業許可番号
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyIdentifier}
                    onChange={(e) => setVerifyIdentifier(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    申請者名（オーナーシェフ / 店長名）
                  </label>
                  <input
                    type="text"
                    required
                    value={verifyOwnerName}
                    onChange={(e) => setVerifyOwnerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-[11px] text-slate-500">
                  ※ボタンを押すとサーバーで6桁のワンタイム認証コード（OTP）が生成されます。
                </span>
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  🔐 6桁の本人確認コード（OTP）を発行する
                </button>
              </div>
            </form>

            {/* Step 2: Enter OTP Code & Unlock */}
            {issuedOtpPreview && (
              <motion.form
                onSubmit={handleConfirmVerificationOtp}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-emerald-950 text-white border border-emerald-500 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                      ONE-TIME PASSCODE ISSUED (動作確認用・即時通知プレビュー)
                    </span>
                    <div className="text-sm font-bold mt-0.5">
                      送信先 <span className="text-emerald-300">{verifyIdentifier}</span> 宛てに発行された認証コード:{' '}
                      <span className="text-lg font-black bg-emerald-400 text-slate-950 px-3 py-0.5 rounded-lg ml-1">
                        {issuedOtpPreview}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="6桁の認証コードを入力"
                    className="p-3 rounded-xl bg-white text-slate-950 font-black text-sm tracking-widest w-full sm:w-56 text-center"
                  />
                  <button
                    type="submit"
                    disabled={verifyingOtp}
                    className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs px-6 py-3 rounded-xl cursor-pointer transition-colors"
                  >
                    🛡️ 認証コードを照合してオーナー管理画面をロック解除する →
                  </button>
                </div>
              </motion.form>
            )}
          </section>
        ) : (
          /* =======================================================================
           * 🛠️ VERIFIED OWNER 3-STEP WORKFLOW TABS
           * ======================================================================= */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'step3_inbox_live' as const,
                  step: '日々の運用 (STEP 3)',
                  label: `💌 感謝レター返信＆営業発信 (${storeGratitudeNotes.length})`,
                },
                {
                  id: 'step1_menu_audit' as const,
                  step: '初期設定 (STEP 1)',
                  label: `🍜 指差しメニュー＆出汁設定 (${menuList.length}品)`,
                },
                {
                  id: 'step2_qr' as const,
                  step: '店頭設置 (STEP 2)',
                  label: '🖨️ 店頭用8言語QRポップ印刷',
                },
                {
                  id: 'find_or_add' as const,
                  step: '店舗切替・追加',
                  label: '🔍 506店検索 / 新規店舗登録',
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold ${
                      activeTab === tab.id ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    {tab.step}
                  </div>
                  <div className="text-xs font-extrabold mt-0.5 truncate">
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>

            {/* ─── TAB A: STEP 3 — GRATITUDE INBOX & LIVE KITCHEN BROADCAST ─── */}
            {activeTab === 'step3_inbox_live' && (
              <div className="space-y-6">
                {/* 1. Quick 1-Tap Live Status Broadcast */}
                <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        📡 本日の営業・空席ステータス発信（1タップ切替）
                      </h2>
                      <p className="text-xs text-slate-500">
                        「今開いているか？」「スープ売り切れではないか？」を訪日客へリアルタイムに知らせます。
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleSaveStoreData(
                          undefined,
                          '本日の営業ステータスをマップへ即時配信しました！'
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer transition-colors"
                    >
                      📡 マップへ即時反映する
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'open_available' as const,
                        label: '🟢 営業中・空席あり',
                        sub: '飛び込み来店歓迎',
                      },
                      {
                        id: 'busy_low_stock' as const,
                        label: '🟡 混雑・残りわずか',
                        sub: '早めの来店推奨',
                      },
                      {
                        id: 'reservation_only' as const,
                        label: '🟠 本日予約満席',
                        sub: '予約客のみ案内中',
                      },
                      {
                        id: 'closed_today' as const,
                        label: '🔴 本日終了・休業',
                        sub: '営業時間外・定休日',
                      },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setLiveStatusType(st.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          liveStatusType === st.id
                            ? 'bg-emerald-950 text-white border-emerald-950 shadow-sm'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{st.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            liveStatusType === st.id
                              ? 'text-emerald-200'
                              : 'text-slate-500'
                          }`}
                        >
                          {st.sub}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      本日のシェフからの一言（日本語で入力すると海外ゲストにも案内されます）
                    </label>
                    <input
                      type="text"
                      value={liveMessageJa}
                      onChange={(e) => setLiveMessageJa(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </section>

                {/* 2. Gratitude Letters Inbox & Chef Reply */}
                <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      💌 訪日ゲストから届いた感謝レター受信箱 ＆ シェフ公式返信
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      海外ゲストのメッセージが日本語に自動翻訳されて届きます。日本語で返信すると英語翻訳付きでマップ上に公開されます。
                    </p>
                  </div>

                  {storeGratitudeNotes.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <div className="text-3xl">💌</div>
                      <div className="text-sm font-bold text-slate-800">
                        まだ感謝レターはありません
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {storeGratitudeNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-5 rounded-3xl bg-slate-50/70 border border-slate-200/90 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{note.stamp_emoji}</span>
                              <div>
                                <div className="text-sm font-black text-slate-900">
                                  {note.stamp_title_ja}{' '}
                                  <span className="text-xs font-normal text-slate-500">
                                    ({note.stamp_title_en})
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 font-semibold">
                                  差出人: {note.sender_name} （{note.sender_country}）
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(note.created_at).toLocaleString('ja-JP')}
                            </span>
                          </div>

                          {note.ordered_dishes && note.ordered_dishes.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-500">
                                注文した料理:
                              </span>
                              {note.ordered_dishes.map((d, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] font-bold bg-emerald-100/80 text-emerald-900 px-2.5 py-0.5 rounded-full"
                                >
                                  🍽️ {d}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="p-3.5 rounded-2xl bg-white border border-rose-200/80 space-y-1">
                            <div className="text-[10px] font-extrabold text-rose-800">
                              🇯🇵 日本語自動翻訳
                            </div>
                            <p className="text-xs font-bold text-slate-900 leading-relaxed">
                              「{note.message_ja_translated}」
                            </p>
                            {note.message_original && (
                              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                                原文: &quot;{note.message_original}&quot;
                              </p>
                            )}
                          </div>

                          {note.owner_reply ? (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-900">
                                <span>
                                  👨‍🍳 公式返信済 ({note.owner_reply.chef_name})
                                </span>
                                <span>✓ マップ上に公開中</span>
                              </div>
                              <p className="text-xs text-emerald-950 font-semibold">
                                {note.owner_reply.text_ja}
                              </p>
                              <p className="text-[11px] text-emerald-800/80 italic">
                                自動英訳: {note.owner_reply.text_en}
                              </p>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="text-xs font-extrabold text-slate-800">
                                  👨‍🍳 お礼の返信を書く（自動で英語へ翻訳されます）
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyDrafts((prev) => ({
                                      ...prev,
                                      [note.id]: `${note.sender_name}さん、ご来店と温かいメッセージをありがとうございます！安心して美味しく召し上がっていただけてスタッフ一同最高の励みになります🌱またのお越しを心よりお待ちしております！`,
                                    }))
                                  }
                                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 cursor-pointer"
                                >
                                  ✨ 1クリック定型文を挿入
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={replyDrafts[note.id] || ''}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [note.id]: e.target.value,
                                  }))
                                }
                                placeholder="日本語で返信を入力してください..."
                                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSendOwnerReply(note)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer"
                                >
                                  👨‍🍳 公式返信を公開する
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ─── TAB B: STEP 1 — POINT-AND-ORDER MENU & 8-POINT DASHI AUDIT ─── */}
            {activeTab === 'step1_menu_audit' && (
              <div className="space-y-6">
                {/* Add New Point-and-Order Menu Item */}
                <form
                  onSubmit={handleAddMenuItem}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-xs space-y-4"
                >
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      🍜 外国人客が「日本語の注文票」で指差し注文できるメニューを登録
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ここに登録したメニューは8言語で案内され、お客様が注文時に「大きな日本語の確定オーダー票」をスタッフに提示してくれます。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        料理名（日本語・必須）
                      </label>
                      <input
                        type="text"
                        required
                        value={newMenuNameJa}
                        onChange={(e) => setNewMenuNameJa(e.target.value)}
                        placeholder="例：特製 濃厚豆乳ヴィーガン担々麺"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        英語メニュー名（空欄なら自動生成）
                      </label>
                      <input
                        type="text"
                        value={newMenuNameEn}
                        onChange={(e) => setNewMenuNameEn(e.target.value)}
                        placeholder="例：Rich Soy Milk Vegan Tantanmen"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        税込価格 (¥)
                      </label>
                      <input
                        type="number"
                        required
                        value={newMenuPrice}
                        onChange={(e) => setNewMenuPrice(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                    <div className="flex items-center gap-3 flex-wrap text-xs font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuGF}
                          onChange={(e) => setNewMenuGF(e.target.checked)}
                        />
                        <span>🌾 グルテンフリー (GF)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuAlliumFree}
                          onChange={(e) => setNewMenuAlliumFree(e.target.checked)}
                        />
                        <span>🧅 五葷（ねぎ・にんにく）不使用</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMenuPopular}
                          onChange={(e) => setNewMenuPopular(e.target.checked)}
                        />
                        <span>★ 人気No.1</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      ＋ このメニューを指差し注文票に追加する
                    </button>
                  </div>
                </form>

                {/* Registered Menu Items */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900">
                    現在登録されている指差し注文メニュー ({menuList.length}品)
                  </h3>
                  <div className="space-y-2.5">
                    {menuList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-slate-900">
                            {item.name_ja} — ¥{item.price_jpy.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">{item.name_en}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 cursor-pointer shrink-0"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8-Point Kitchen & Dashi Safety Audit */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        🛡️ 出汁・調理環境 8項目安全チェックシート
                      </h3>
                      <p className="text-xs text-slate-500">
                        選ぶだけで8言語に自動翻訳され、来店前の外国人客の不安を解消します。
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleSaveStoreData(
                          undefined,
                          '出汁・調理環境シートを保存しました！'
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      🛡️ 設定を保存する
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        1. 🍲 出汁（だし）・スープベース
                      </label>
                      <select
                        value={auditState.dashi_type}
                        onChange={(e) =>
                          setAuditState({
                            ...auditState,
                            dashi_type: e.target.value as KitchenAudit['dashi_type'],
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                      >
                        <option value="100_plant">
                          店内すべて100%植物性出汁（昆布・椎茸・野菜のみ／魚介ゼロ）
                        </option>
                        <option value="plant_menu_only">
                          ヴィーガンメニューは魚介出汁完全不使用で個別調理
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        2. 🍳 揚げ油・調理器具
                      </label>
                      <select
                        value={auditState.fryer_oil}
                        onChange={(e) =>
                          setAuditState({
                            ...auditState,
                            fryer_oil: e.target.value as KitchenAudit['fryer_oil'],
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                      >
                        <option value="dedicated">植物性専用キッチン・専用フライヤー</option>
                        <option value="shared">一般食材とフライヤー共用（洗浄徹底）</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        3. 🧅 五葷（ねぎ・にんにく等）対応
                      </label>
                      <select
                        value={auditState.allium_free}
                        onChange={(e) =>
                          setAuditState({
                            ...auditState,
                            allium_free: e.target.value as KitchenAudit['allium_free'],
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                      >
                        <option value="all_free">全品 五葷完全不使用</option>
                        <option value="customizable">五葷抜き変更可能</option>
                        <option value="contains_allium">一部五葷使用あり</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        4. 🌾 グルテンフリー対応
                      </label>
                      <select
                        value={auditState.gluten_free}
                        onChange={(e) =>
                          setAuditState({
                            ...auditState,
                            gluten_free: e.target.value as KitchenAudit['gluten_free'],
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                      >
                        <option value="100_gf">店内100%完全グルテンフリー</option>
                        <option value="gf_option">グルテンフリー選択・米粉麺変更可</option>
                        <option value="contains_wheat">小麦使用</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB C: STEP 2 — PRINTABLE TABLETOP QR STAND ─── */}
            {activeTab === 'step2_qr' && (
              <section className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      🖨️ STEP 2: 店頭テーブル設置用「8言語メニュー＆感謝レター」QRポップ
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      このページを印刷してテーブルやレジ横に置くだけで、来店した外国人客がスマホで読み取り、日本語オーダー票で注文できるようになります。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl cursor-pointer"
                  >
                    🖨️ 店頭用QRポップを印刷する (Print POP)
                  </button>
                </div>

                <div className="max-w-md mx-auto p-6 rounded-3xl border-4 border-emerald-800 bg-gradient-to-b from-white to-emerald-50/40 text-center space-y-4 shadow-lg">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-900 text-emerald-100 text-[11px] font-black px-3 py-1 rounded-full">
                    <span>🌱 vegan.jp OFFICIAL VERIFIED PARTNER</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      {currentPlace?.name}
                    </h3>
                    <p className="text-xs font-bold text-emerald-800 mt-0.5">
                      8-Language Verified Vegan Menu &amp; Point-to-Order
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 inline-block shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        deepLinkUrl
                      )}`}
                      alt="Store QR Code"
                      className="w-44 h-44 mx-auto"
                    />
                  </div>

                  <div className="space-y-1 text-xs font-bold text-slate-800">
                    <div>🇬🇧 Scan for English Vegan Menu &amp; Staff Order Ticket</div>
                    <div>🇹🇼 掃描查看繁體中文純素菜單 ＆ 點餐卡</div>
                    <div>🇰🇷 한국어 비건 메뉴 및 주문 카드 스캔</div>
                    <div>🇫🇷 Menu Végan &amp; Carte de Commande en Français</div>
                  </div>
                </div>
              </section>
            )}

            {/* ─── TAB D: SEARCH 506 SPOTS OR ADD NEW STORE ─── */}
            {activeTab === 'find_or_add' && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      🔍 既存506店舗から検索してオーナー本人確認へ進む
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      未認証の店舗を選択すると「なりすまし防止・3段階本人確認ロック画面」の動作をテストできます。
                    </p>
                  </div>

                  <input
                    type="text"
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    placeholder="店名・エリアで検索（例：薬院、東京、京都、大阪...）"
                    className="w-full p-3 rounded-2xl border border-slate-300 text-xs"
                  />

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredSearchPlaces.map((p) => {
                      const verified = !!storesMap[p.google_place_id]?.is_official_verified;
                      return (
                        <div
                          key={p.google_place_id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{verified ? '🛡️' : '🔒'}</span>
                              <span>{p.name_ja || p.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {p.area} · {p.genre}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlaceId(p.google_place_id);
                              setActiveTab('step3_inbox_live');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer"
                          >
                            {verified ? '管理画面を開く →' : '本人確認へ進む →'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Register Brand-New Store */}
                <form
                  onSubmit={handleRegisterNewStore}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-xs space-y-4"
                >
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      ➕ マップ未掲載の新規店舗を登録（営業許可証照合付）
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      登録すると即座にマップ上に新しいピンが立ち、認定証明書が発行されます。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        店舗名（日本語・必須）
                      </label>
                      <input
                        type="text"
                        required
                        value={newStoreNameJa}
                        onChange={(e) => setNewStoreNameJa(e.target.value)}
                        placeholder="例：博多ヴィーガン茶寮 翠"
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        英語表記店舗名
                      </label>
                      <input
                        type="text"
                        value={newStoreNameEn}
                        onChange={(e) => setNewStoreNameEn(e.target.value)}
                        placeholder="例：Hakata Vegan Saryo SUI"
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        都市エリア
                      </label>
                      <select
                        value={newStoreCity}
                        onChange={(e) => setNewStoreCity(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="tokyo">東京 (Tokyo)</option>
                        <option value="kyoto">京都 (Kyoto)</option>
                        <option value="osaka">大阪 (Osaka)</option>
                        <option value="fukuoka">福岡 (Fukuoka)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        飲食店営業許可証番号（本人確認用）
                      </label>
                      <input
                        type="text"
                        required
                        value={newStorePermitNumber}
                        onChange={(e) => setNewStorePermitNumber(e.target.value)}
                        placeholder="例：保健所 許可第2026-0912号"
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
                  >
                    🎉 本人確認済の新規店舗としてマップに公開する
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}

export default function PartnerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center text-xs font-bold text-slate-600">
          Loading Store Partner Portal...
        </div>
      }
    >
      <PartnerDashboardInner />
    </Suspense>
  );
}
