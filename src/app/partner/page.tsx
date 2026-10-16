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
} from '@/lib/types';
import {
  getEffectiveKitchenAudit,
  getEffectiveVerifiedMenu,
  translateOwnerReplyToEn,
} from '@/lib/kitchen-defaults';
import ToastContainer, { showToast } from '@/components/Toast';

type DashboardTab = 'inbox' | 'live' | 'menu' | 'audit' | 'qr' | 'register_store';

function PartnerDashboardInner() {
  const searchParams = useSearchParams();
  const initialPlaceParam = searchParams.get('placeId');

  // ─── Ecosystem Server State ───
  const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
  const [gratitudeNotes, setGratitudeNotes] = useState<GratitudeNote[]>([]);
  const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Active Partner Account & Selected Store ───
  const [ownerName, setOwnerName] = useState('SoyStories 薬院 オーナーシェフ');
  const [ownerEmail, setOwnerEmail] = useState('owner@soystories.jp');
  const [ownerRole, setOwnerRole] = useState('ストアマネージャー / パティシエ');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    initialPlaceParam || 'ChIJL8ZEXViRQTURgeN1wM_GJ6E'
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('inbox');

  // ─── Store Search / Claim Selector ───
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authNameInput, setAuthNameInput] = useState('');
  const [authRoleInput, setAuthRoleInput] = useState('オーナーシェフ / 店長');

  // ─── Editable Store State ───
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
  const [newMenuDescEn, setNewMenuDescEn] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('1200');
  const [newMenuGF, setNewMenuGF] = useState(true);
  const [newMenuAlliumFree, setNewMenuAlliumFree] = useState(true);
  const [newMenuPopular, setNewMenuPopular] = useState(true);
  const [newMenuOrderNote, setNewMenuOrderNote] = useState('');

  // ─── Gratitude Reply Drafts ───
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // ─── Brand-New Store Registration Form ───
  const [newStoreNameJa, setNewStoreNameJa] = useState('');
  const [newStoreNameEn, setNewStoreNameEn] = useState('');
  const [newStoreCity, setNewStoreCity] = useState<'tokyo' | 'kyoto' | 'osaka' | 'fukuoka'>('tokyo');
  const [newStoreArea, setNewStoreArea] = useState('');
  const [newStoreGenre, setNewStoreGenre] = useState('カフェ');
  const [newStoreDietary, setNewStoreDietary] = useState<'100%_vegan' | 'vegan_friendly'>('100%_vegan');
  const [newStoreProfileJa, setNewStoreProfileJa] = useState('');
  const [newStoreProfileEn, setNewStoreProfileEn] = useState('');
  const [newStoreInstagram, setNewStoreInstagram] = useState('');

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

  // Synchronize form fields whenever selectedPlaceId or storesMap changes
  useEffect(() => {
    if (!currentPlace) return;
    const official = storesMap[currentPlace.google_place_id];
    const effectiveAudit = getEffectiveKitchenAudit(currentPlace, official);
    const effectiveMenu = getEffectiveVerifiedMenu(currentPlace, official);

    setAuditState(effectiveAudit);
    setMenuList(effectiveMenu);

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
      setOwnerName(`${currentPlace.name} オーナーシェフ`);
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

  const storeGratitudeNotes = useMemo(() => {
    if (!currentPlace) return [];
    return gratitudeNotes.filter(
      (n) => n.place_id === currentPlace.google_place_id
    );
  }, [gratitudeNotes, currentPlace]);

  const filteredSearchPlaces = useMemo(() => {
    if (!storeSearchQuery.trim()) return [];
    const q = storeSearchQuery.toLowerCase().trim();
    return allPlaces
      .filter((p) => {
        const text = `${p.name} ${p.name_ja || ''} ${p.area || ''} ${
          p.area_en || ''
        } ${p.prefecture || ''}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 8);
  }, [allPlaces, storeSearchQuery]);

  // ─── Save Store Official Data to Server API ───
  const handleSaveStoreData = async (
    customMenuOverride?: MenuItem[],
    toastMessage = '店舗公式データを保存し、ライブマップへ即時反映しました！'
  ) => {
    if (!currentPlace) return;
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

  // ─── Add New Menu Item ───
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuNameJa.trim()) return;

    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name_ja: newMenuNameJa.trim(),
      name_en:
        newMenuNameEn.trim() ||
        `${newMenuNameJa.trim()} (Verified Plant-Based Dish)`,
      description_ja:
        newMenuDescJa.trim() || '動物性食材・魚介出汁を一切使用しない特製ヴィーガンメニュー。',
      description_en:
        newMenuDescEn.trim() ||
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
    setNewMenuDescEn('');
    setNewMenuOrderNote('');

    await handleSaveStoreData(
      updatedMenu,
      `新メニュー「${newItem.name_ja}」を指差し注文票に追加しました！`
    );
  };

  const handleDeleteMenuItem = async (id: string) => {
    const updatedMenu = menuList.filter((m) => m.id !== id);
    setMenuList(updatedMenu);
    await handleSaveStoreData(
      updatedMenu,
      'メニュー構成を更新しました'
    );
  };

  // ─── Reply to Traveler Gratitude Note ───
  const handleSendOwnerReply = async (note: GratitudeNote) => {
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
        showToast('訪日客への公式返信を公開しました！マップ上の店舗カードにも表示されます💌', '👨‍🍳');
      }
    } catch (e) {
      showToast('エラーが発生しました', '⚠️');
    } finally {
      setSaving(false);
    }
  };

  // ─── Register a Brand-New Store onto the Map ───
  const handleRegisterNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreNameJa.trim()) return;

    const cityCoords: Record<string, { lat: number; lng: number; prefJa: string; prefEn: string }> = {
      tokyo: { lat: 35.669 + (Math.random() - 0.5) * 0.02, lng: 139.705 + (Math.random() - 0.5) * 0.02, prefJa: '東京都', prefEn: 'Tokyo' },
      kyoto: { lat: 35.008 + (Math.random() - 0.5) * 0.02, lng: 135.768 + (Math.random() - 0.5) * 0.02, prefJa: '京都府', prefEn: 'Kyoto' },
      osaka: { lat: 34.678 + (Math.random() - 0.5) * 0.02, lng: 135.502 + (Math.random() - 0.5) * 0.02, prefJa: '大阪府', prefEn: 'Osaka' },
      fukuoka: { lat: 33.585 + (Math.random() - 0.5) * 0.02, lng: 130.398 + (Math.random() - 0.5) * 0.02, prefJa: '福岡県', prefEn: 'Fukuoka' },
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
          : newStoreGenre === '和食・精進'
          ? 'Traditional Shojin & Washoku'
          : 'Plant-Based Bistro',
      area: newStoreArea.trim() || coords.prefJa,
      area_en: `${newStoreArea.trim() || coords.prefEn}, ${coords.prefEn}`,
      prefecture: coords.prefJa,
      prefecture_en: coords.prefEn,
      profile_text:
        newStoreProfileJa.trim() ||
        `${newStoreNameJa.trim()}。植物性食材にこだわった公式登録店舗です。`,
      profile_text_en:
        newStoreProfileEn.trim() ||
        `Official partner restaurant ${newStoreNameEn.trim() || newStoreNameJa.trim()}. Verified plant-based kitchen.`,
      features: ['100%ヴィーガン', '店舗公式登録', '魚介出汁不使用'],
      features_en: ['Official Partner', 'No Fish Dashi', 'Point & Order Menu'],
      dietary_type: newStoreDietary,
      instagram_id: newStoreInstagram.trim() || undefined,
      created_at: new Date().toISOString(),
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
        setActiveTab('live');
        showToast(`新規店舗「${newPlace.name_ja}」をマップに公開しました！`, '🎉');
      }
    } catch (e) {
      showToast('登録中にエラーが発生しました', '⚠️');
    } finally {
      setSaving(false);
    }
  };

  // ─── Handle Partner Account Login / Register Modal ───
  const handlePartnerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'partner_auth',
          mode: authMode,
          email: authEmailInput,
          password: authPasswordInput,
          owner_name: authNameInput || `${currentPlace?.name} オーナー`,
          role_title: authRoleInput,
          claim_place_id: currentPlace?.google_place_id,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        showToast(data.error || '認証エラー', '⚠️');
        return;
      }
      if (data.partner) {
        setOwnerName(data.partner.owner_name);
        setOwnerEmail(data.partner.email);
        setOwnerRole(data.partner.role_title);
        if (data.partner.claimed_place_ids?.[0]) {
          setSelectedPlaceId(data.partner.claimed_place_ids[0]);
        }
      }
      setShowAuthModal(false);
      showToast('店舗オーナーアカウントでログインしました！', '🏪');
    } catch (err) {
      showToast('通信エラー', '⚠️');
    }
  };

  const isOfficial = !!(currentPlace && storesMap[currentPlace.google_place_id]?.is_official_verified);
  const deepLinkUrl =
    typeof window !== 'undefined' && currentPlace
      ? `${window.location.origin}/?place=${encodeURIComponent(currentPlace.google_place_id)}`
      : `https://vegan.jp/?place=${encodeURIComponent(currentPlace?.google_place_id || '')}`;

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-slate-900 font-sans pb-20">
      {/* ─── Top Navigation Bar ─── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href={`/?place=${encodeURIComponent(currentPlace?.google_place_id || '')}`}
              className="flex items-center gap-1.5 group"
            >
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-base font-black tracking-tight text-slate-900">
                vegan<span className="text-emerald-600">.jp</span>
              </span>
            </Link>
            <span className="text-xs font-extrabold bg-emerald-950 text-emerald-200 px-2.5 py-1 rounded-full">
              🏪 飲食店パートナー管理ポータル (For Restaurants)
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="text-xs text-slate-600 hidden md:flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <span>👨‍🍳</span>
              <span className="font-bold text-slate-900">{ownerName}</span>
              <span className="text-slate-400">|</span>
              <span>{ownerEmail}</span>
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              🔑 アカウント切替・新規オーナー登録
            </button>

            <Link
              href={`/?place=${encodeURIComponent(currentPlace?.google_place_id || '')}`}
              className="text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-full shadow-xs transition-colors flex items-center gap-1"
            >
              <span>🗺️ マップでこの店舗を確認する</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* ─── Store Switcher & Claim Banner ─── */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isOfficial
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {isOfficial ? '🏅 公式オーナー認定済店舗' : '🔓 オーナー未連携（今すぐ無料連携可能）'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  📍 {currentPlace?.area} ({currentPlace?.genre})
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {currentPlace?.name_ja || currentPlace?.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                日本語で入力したメニュー・出汁情報・返信は、自動的に世界8言語へ変換され訪日旅行者マップに即時反映されます。
              </p>
            </div>

            {/* Quick Flagship Store Switcher + Search Any 506 Spot */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <optgroup label="🏅 公式認定パートナー店舗（デモ切替）">
                  <option value="ChIJL8ZEXViRQTURgeN1wM_GJ6E">
                    🍨 SoyStories（ソイストーリーズ）薬院 [福岡]
                  </option>
                  <option value="vegan-ramen-01">
                    🍜 Vegan Ramen YADOKARI [福岡]
                  </option>
                  <option value="vegan-ramen-07">
                    🍜 MERCY Vegan Ramen [大阪]
                  </option>
                  <option value="vegan-ramen-03">
                    🍜 BUGORO ALL VEGAN [福岡]
                  </option>
                </optgroup>
                {customPlaces.length > 0 && (
                  <optgroup label="✨ 新規追加された店舗">
                    {customPlaces.map((cp) => (
                      <option key={cp.google_place_id} value={cp.google_place_id}>
                        🌱 {cp.name_ja || cp.name} [{cp.area}]
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <button
                onClick={() => setActiveTab('register_store')}
                className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl transition-colors cursor-pointer shrink-0"
              >
                ➕ 新規店舗登録 / 506店から検索連携
              </button>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60">
              <div className="text-[11px] font-bold text-rose-800">💌 届いた感謝レター</div>
              <div className="text-xl font-black text-rose-950 mt-0.5">
                {storeGratitudeNotes.length}{' '}
                <span className="text-xs font-semibold">通</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
              <div className="text-[11px] font-bold text-emerald-800">
                🗣️ 指差し注文登録メニュー
              </div>
              <div className="text-xl font-black text-emerald-950 mt-0.5">
                {menuList.length} <span className="text-xs font-semibold">品目</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60">
              <div className="text-[11px] font-bold text-amber-900">
                🛡️ 出汁・調理環境開示
              </div>
              <div className="text-xl font-black text-amber-950 mt-0.5">
                8 / 8 <span className="text-xs font-semibold">項目完了</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-600">
                🌏 多言語メニュー自動変換
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                8 <span className="text-xs font-semibold">言語稼働中</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Dashboard Tabs ─── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            {
              id: 'inbox' as const,
              label: `💌 感謝レター受信箱＆返信 (${storeGratitudeNotes.length})`,
            },
            { id: 'live' as const, label: '📡 リアルタイム営業・空席発信' },
            {
              id: 'menu' as const,
              label: `🍜 指差し注文メニュー管理 (${menuList.length})`,
            },
            { id: 'audit' as const, label: '🛡️ 出汁・調理環境8項目シート' },
            { id: 'qr' as const, label: '🖨️ 店頭設置用QRポップ出力' },
            { id: 'register_store' as const, label: '➕ 店舗の検索連携・新規登録' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold shrink-0 transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: GRATITUDE INBOX & CHEF REPLY ─── */}
        {activeTab === 'inbox' && (
          <section className="space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    💌 訪日旅行者から届いた感謝レター＆公式返信
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    海外ゲストからの英語・中国語・韓国語等のメッセージが自動翻訳されて届きます。日本語で返信すると英語翻訳付きで店舗カードに公開されます。
                  </p>
                </div>
              </div>

              {storeGratitudeNotes.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="text-3xl">💌</div>
                  <div className="text-sm font-bold text-slate-800">
                    まだこの店舗宛ての感謝レターはありません
                  </div>
                  <p className="text-xs text-slate-500">
                    マップの店舗カードから感謝レターを送信すると、リアルタイムでここに届きます。
                  </p>
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

                      {/* Ordered Dishes */}
                      {note.ordered_dishes && note.ordered_dishes.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500">
                            注文したメニュー:
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

                      {/* Translated Japanese Message & Original */}
                      <div className="p-3.5 rounded-2xl bg-white border border-rose-200/80 space-y-1.5">
                        <div className="text-[10px] font-extrabold text-rose-800 uppercase">
                          🇯🇵 スタッフ向け日本語自動翻訳
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

                      {/* Existing Owner Reply or Reply Input */}
                      {note.owner_reply ? (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-900">
                            <span>👨‍🍳 送信済みの公式オーナー返信 ({note.owner_reply.chef_name})</span>
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
                              👨‍🍳 シェフ・スタッフからのお礼返信を書く（自動で英語にも翻訳されます）
                            </label>
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [note.id]: `${note.sender_name}さん、ご来店と温かいメッセージをありがとうございます！安心して美味しく召し上がっていただけてスタッフ一同最高の励みになります🌱またのお越しを心よりお待ちしております！`,
                                  }))
                                }
                                className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-2.5 py-1 rounded-full border border-slate-200 cursor-pointer"
                              >
                                ✨ 定型文を挿入
                              </button>
                            </div>
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
                            placeholder="例：ご来店ありがとうございました！当店の100%植物性メニューを喜んでいただけて本当に嬉しいです🌱"
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleSendOwnerReply(note)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-colors"
                            >
                              👨‍🍳 公式返信を公開する（英語自動翻訳付）
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── TAB 2: LIVE KITCHEN BROADCAST ─── */}
        {activeTab === 'live' && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900">
                📡 リアルタイム店頭ステータス＆本日のメッセージ配信
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                「今すぐ入れるか？」「スープ売り切れではないか？」という訪日客の最大の不安を解消し、来店率を劇的に高めます。
              </p>
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
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    liveStatusType === st.id
                      ? 'bg-emerald-950 text-white border-emerald-950 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold">{st.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      liveStatusType === st.id ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    {st.sub}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  🇯🇵 本日の店頭メッセージ（日本語）
                </label>
                <textarea
                  rows={3}
                  value={liveMessageJa}
                  onChange={(e) => setLiveMessageJa(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  🌏 訪日客向け英語メッセージ（編集可能）
                </label>
                <textarea
                  rows={3}
                  value={liveMessageEn}
                  onChange={(e) => setLiveMessageEn(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleSaveStoreData(
                    undefined,
                    'リアルタイム営業ステータスをマップへ即時配信しました！'
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-sm cursor-pointer transition-colors"
              >
                📡 マップへ即時配信する (Publish Live Status)
              </button>
            </div>
          </section>
        )}

        {/* ─── TAB 3: POINT-AND-ORDER VEGAN MENU BUILDER ─── */}
        {activeTab === 'menu' && (
          <section className="space-y-5">
            {/* Add New Dish Form */}
            <form
              onSubmit={handleAddMenuItem}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-xs space-y-4"
            >
              <div>
                <h2 className="text-base font-black text-slate-900">
                  ➕ 指差し注文・公式ヴィーガンメニューを追加
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ここに登録したメニューは、訪日客がスマホ上で選んで「店員さんに見せる日本語オーダー票」としてそのまま使われます。接客の言葉の壁がゼロになります！
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    英語メニュー名（任意・自動補完あり）
                  </label>
                  <input
                    type="text"
                    value={newMenuNameEn}
                    onChange={(e) => setNewMenuNameEn(e.target.value)}
                    placeholder="例：Rich Soy Milk Vegan Tantanmen"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    料理の特徴・こだわり（日本語）
                  </label>
                  <input
                    type="text"
                    value={newMenuDescJa}
                    onChange={(e) => setNewMenuDescJa(e.target.value)}
                    placeholder="例：魚介出汁・乳・卵・白砂糖完全不使用"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    店員向けオーダー票に表示する注記（任意）
                  </label>
                  <input
                    type="text"
                    value={newMenuOrderNote}
                    onChange={(e) => setNewMenuOrderNote(e.target.value)}
                    placeholder="例：ヴィーガン仕様（魚介出汁・五葷抜き）でお願いします"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
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
                    <span>★ 人気No.1バッジ</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  ＋ このメニューを指差し注文票に追加する
                </button>
              </div>
            </form>

            {/* Current Menu List */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">
                🍜 現在公開中の指差し注文メニュー ({menuList.length}品)
              </h3>
              <div className="space-y-2.5">
                {menuList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {item.is_popular && (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                            ★ 人気メニュー
                          </span>
                        )}
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                          🌱 100%植物性
                        </span>
                        {item.is_gluten_free && (
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md">
                            🌾 グルテンフリー
                          </span>
                        )}
                        {item.is_allium_free && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md">
                            🧅 五葷不使用
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {item.name_ja} — ¥{item.price_jpy.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">{item.name_en}</div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        {item.description_ja}
                      </div>
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
          </section>
        )}

        {/* ─── TAB 4: 8-POINT KITCHEN & DASHI SAFETY AUDIT ─── */}
        {activeTab === 'audit' && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900">
                🛡️ 公式「出汁・調理環境」8項目安全開示シート
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                GoogleマップやHappyCowでは分からない「鰹出汁の有無」「揚げ油」「五葷」「白砂糖」を明確に開示することで、世界中のヴィーガン・アレルギー旅行者から圧倒的な信頼を獲得できます。
              </p>
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
                  <option value="ask_staff">注文時にスタッフへ要確認</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  2. 🍳 揚げ油・フライヤー環境
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
                  <option value="dedicated">植物性専用フライヤー・専用油（完全分離）</option>
                  <option value="shared">一般食材とフライヤー共用</option>
                  <option value="no_fried">揚げ物メニューなし</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  3. 🧅 五葷（ねぎ・にんにく・ニラ・玉ねぎ・らっきょう）対応
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
                  <option value="all_free">全品 五葷完全不使用（オリエンタルヴィーガン完全対応）</option>
                  <option value="customizable">注文時に「五葷抜き」変更可能</option>
                  <option value="contains_allium">スープ等に五葷使用あり（変更不可）</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  4. 🌾 グルテンフリー（小麦不使用）対応
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
                  <option value="100_gf">店内100%完全グルテンフリー（小麦持ち込みなし）</option>
                  <option value="gf_option">グルテンフリーメニュー・米粉麺変更オプションあり</option>
                  <option value="contains_wheat">小麦・通常醤油を使用</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  5. 🍯 白砂糖・はちみつ
                </label>
                <select
                  value={auditState.sugar_honey}
                  onChange={(e) =>
                    setAuditState({
                      ...auditState,
                      sugar_honey: e.target.value as KitchenAudit['sugar_honey'],
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="no_bone_char_no_honey">
                    白砂糖・はちみつ完全不使用（甜菜糖・有機メープル・アガベ等を使用）
                  </option>
                  <option value="honey_free">はちみつ完全不使用</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  6. 📅 予約・飛び込み入店ルール
                </label>
                <select
                  value={auditState.reservation_policy}
                  onChange={(e) =>
                    setAuditState({
                      ...auditState,
                      reservation_policy: e.target.value as KitchenAudit['reservation_policy'],
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="walk_in_ok">予約不要（ウォークイン・飛び込み来店歓迎）</option>
                  <option value="reservation_recommended">予約推奨（当日空席あれば入店可）</option>
                  <option value="reservation_required">完全予約制</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  👨‍🍳 オーナー・シェフからのご挨拶（日本語）
                </label>
                <textarea
                  rows={3}
                  value={chefGreetingJa}
                  onChange={(e) => setChefGreetingJa(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  🌏 訪日客向け英語ご挨拶
                </label>
                <textarea
                  rows={3}
                  value={chefGreetingEn}
                  onChange={(e) => setChefGreetingEn(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleSaveStoreData(
                    undefined,
                    '出汁・調理環境8項目シートを公式保存しました！'
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-sm cursor-pointer transition-colors"
              >
                🛡️ 公式監査シートを保存してマップに反映する
              </button>
            </div>
          </section>
        )}

        {/* ─── TAB 5: PRINTABLE TABLETOP QR STAND ─── */}
        {activeTab === 'qr' && (
          <section className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  🖨️ 店頭テーブル設置用「8言語メニュー＆感謝レター」QRポップ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  レジ横や各テーブルに置くだけで、外国人ゲストが自分のスマホで8言語メニューを読み、指差し注文票を表示し、食後に感謝レターを送れるようになります。
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl cursor-pointer transition-colors"
              >
                🖨️ この店頭QRポップを印刷する (Print POP)
              </button>
            </div>

            {/* Printable Card Preview */}
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

              {/* Dynamic QR Code Image via Public QR API */}
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

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-900">
                💌 Enjoyed your meal? Scan to send a Thank-You Card directly to our Chef!
                <br />
                （食後にシェフへの感謝メッセージもこちらから送れます）
              </div>
            </div>
          </section>
        )}

        {/* ─── TAB 6: CLAIM EXISTING 506 SPOT OR REGISTER BRAND-NEW STORE ─── */}
        {activeTab === 'register_store' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search & Claim from 506 Spots */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  🔍 既存506店舗から自店を検索してオーナー連携
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  すでにマップに掲載されている全国506店舗からあなたのお店を検索し、即座に公式オーナーとして管理を開始できます。
                </p>
              </div>

              <input
                type="text"
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                placeholder="店名・エリアで検索（例：薬院、東京、AIN SOPH、京都...）"
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredSearchPlaces.map((p) => (
                  <div
                    key={p.google_place_id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {p.name_ja || p.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.area} · {p.genre}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlaceId(p.google_place_id);
                        setActiveTab('live');
                        showToast(
                          `「${p.name_ja || p.name}」を管理対象に選択しました！`,
                          '🏪'
                        );
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer"
                    >
                      この店舗を管理する →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Register Brand-New Restaurant */}
            <form
              onSubmit={handleRegisterNewStore}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-xs space-y-4"
            >
              <div>
                <h2 className="text-base font-black text-slate-900">
                  ➕ マップに未掲載の新規店舗を公式登録する
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  新しくヴィーガン対応を始めたお店を登録すると、即座にライブマップ上にピンが立ち、世界中の訪日客から検索・注文可能になります。
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">都市エリア</label>
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
                  <label className="font-bold text-slate-800 block mb-1">詳細エリア名</label>
                  <input
                    type="text"
                    value={newStoreArea}
                    onChange={(e) => setNewStoreArea(e.target.value)}
                    placeholder="例：渋谷区代官山 / 福岡市薬院"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">料理ジャンル</label>
                  <select
                    value={newStoreGenre}
                    onChange={(e) => setNewStoreGenre(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="カフェ">☕ カフェ＆スイーツ</option>
                    <option value="ラーメン">🍜 ラーメン</option>
                    <option value="和食・精進">🍱 和食・精進料理</option>
                    <option value="カレー">🍛 カレー＆スパイス</option>
                    <option value="バーガー">🍔 バーガー＆ダイニング</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-800 block mb-1">
                  店舗紹介・ヴィーガン対応の特徴（日本語）
                </label>
                <textarea
                  rows={2}
                  value={newStoreProfileJa}
                  onChange={(e) => setNewStoreProfileJa(e.target.value)}
                  placeholder="例：動物性食材・魚介出汁・白砂糖を一切使用しない100%植物性カフェです。"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer transition-colors"
              >
                🎉 この店舗を新規公式登録してマップに公開する
              </button>
            </form>
          </section>
        )}
      </main>

      {/* ─── Partner Account Auth Modal ─── */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  🔑 飲食店オーナー アカウント登録 / ログイン
                </h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-xl cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  新規オーナー登録（無料）
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-xl cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  既存アカウントでログイン
                </button>
              </div>

              <form onSubmit={handlePartnerAuth} className="space-y-3 text-xs">
                {authMode === 'register' && (
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      お名前 / オーナー・店長名
                    </label>
                    <input
                      type="text"
                      required
                      value={authNameInput}
                      onChange={(e) => setAuthNameInput(e.target.value)}
                      placeholder="例：荒木 健太（オーナーシェフ）"
                      className="w-full p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    店舗メールアドレス
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmailInput}
                    onChange={(e) => setAuthEmailInput(e.target.value)}
                    placeholder="owner@soystories.jp"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    パスワード
                  </label>
                  <input
                    type="password"
                    required
                    value={authPasswordInput}
                    onChange={(e) => setAuthPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  {authMode === 'register'
                    ? '🏪 オーナーアカウントを作成して店舗と連携する'
                    : '🔑 ログインする'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
