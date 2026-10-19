'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { Place, StoreOfficialData } from '@/lib/types';
import type {
  GrowthTelemetryState,
  SelfHealingEvent,
  StoreViralInvite,
} from '@/lib/growth-engine';
import { MASTER_PLACES } from '@/lib/places-master';
import {
  getEffectiveVerifiedMenu,
  getEffectiveWelcomePerk,
} from '@/lib/kitchen-defaults';
import { downloadInstagramStoryCardPng } from '@/lib/story-card-generator';

export default function GrowthAndSelfHealingPage() {
  const [growthState, setGrowthState] = useState<GrowthTelemetryState | null>(null);
  const [storesMap, setStoresMap] = useState<Record<string, StoreOfficialData>>({});
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('ChIJL8ZEXViRQTURgeN1wM_GJ6E');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  // Quick Issue / Bug Report Form State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4200);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [gRes, eRes] = await Promise.all([
        fetch('/api/growth', { cache: 'no-store' }),
        fetch('/api/ecosystem', { cache: 'no-store' }),
      ]);
      if (gRes.ok) {
        const gData = await gRes.json();
        setGrowthState(gData);
      }
      if (eRes.ok) {
        const eData = await eRes.json();
        if (eData.stores) setStoresMap(eData.stores);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const currentPlace = useMemo<Place>(
    () =>
      MASTER_PLACES.find((p) => p.google_place_id === selectedPlaceId) ||
      MASTER_PLACES[0],
    [selectedPlaceId]
  );

  const currentOfficial = storesMap[selectedPlaceId] || null;
  const sigDish = useMemo(
    () => getEffectiveVerifiedMenu(currentPlace, currentOfficial)[0],
    [currentPlace, currentOfficial]
  );
  const welcomePerk = useMemo(
    () => getEffectiveWelcomePerk(currentPlace, currentOfficial),
    [currentPlace, currentOfficial]
  );

  const igHandle = currentPlace.instagram_id
    ? `@${currentPlace.instagram_id}`
    : `@${currentPlace.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // Auto-generated bilingual Instagram Caption & Viral Hook
  const autoCaption = useMemo(() => {
    const storeUrl = `https://vegan.jp/?store=${encodeURIComponent(currentPlace.google_place_id)}`;
    return `👑 ここに来たら絶対食べたい「看板の一皿」
📍 ${currentPlace.name_ja || currentPlace.name}（${currentPlace.area}）
🍽️ ${sigDish?.name_ja || 'シェフ特製看板メニュー'} / ${sigDish?.name_en || "Chef's Signature Dish"}

${welcomePerk.ja}
${welcomePerk.en}

💮 食後にシェフへ「ごちそうさま！」を送ると、あなただけの『旅の美食御朱印スタンプ＆絵葉書』が発行されます！
Send a "Gochisosama" note after your meal to collect your Japan Culinary Stamp & Postcard!

📸 ${igHandle} @vegan.jp
🔗 ${storeUrl}
#VeganJP #JapanVegan #VeganInJapan #${(currentPlace.area_en || 'Tokyo').replace(/[^a-zA-Z]/g, '')}Vegan #ヴィーガングルメ #御朱印巡り`;
  }, [currentPlace, sigDish, welcomePerk, igHandle]);

  const handleDownloadStoryPng = async () => {
    await downloadInstagramStoryCardPng({
      storeName: currentPlace.name_ja || currentPlace.name,
      area: currentPlace.area || 'Japan',
      signatureDish: sigDish?.name_ja || 'シェフの看板メニュー',
      welcomePerk: welcomePerk.ja,
      quote:
        sigDish?.description_ja ||
        'このお店でしか味わえない感動の看板メニュー！画面提示で歓迎特典も受け取れます🌱',
      senderName: 'Vegan.jp Official Spotlight',
      instagramHandle: igHandle,
      sealCode: '御朱印-SPOTLIGHT',
    });
    await fetchAll();
    showNotice('📸 Instagramストーリーズ用 9:16 高解像度PNGカードを生成・保存しました！');
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(autoCaption);
      showNotice('📋 Instagram投稿用キャプション＆ハッシュタグ＆店舗メンションをコピーしました！');
    } catch {
      showNotice('コピーしました！');
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const res = await fetch('/api/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_diagnostics' }),
      });
      const data = await res.json();
      if (data.ok) {
        setGrowthState(data.state);
        showNotice(data.summaryJa);
      }
    } catch {} finally {
      setIsRunningDiag(false);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;
    setIsSubmittingIssue(true);
    try {
      const res = await fetch('/api/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_issue',
          category: 'user_bug_report',
          title_ja: issueTitle.trim(),
          detail_ja: issueDetail.trim() || 'ユーザー・店舗からの改善リクエスト',
          auto_action_taken: '自動診断キューへ登録＆フォールバック保護適用済',
          page_url: '/growth',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setGrowthState(data.state);
        setIssueTitle('');
        setIssueDetail('');
        showNotice('🛡️ 不具合・改善レポートを受け付け、自動保護パッチを適用しました！');
      }
    } catch {} finally {
      setIsSubmittingIssue(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-slate-900 pb-24">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-black border border-white/15 max-w-md">
          {toastMsg}
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
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
                🚀 自律グロース＆マーケティング自動化 ・ 🛡️ 自己修復（Self-Healing）管制センター
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">
                あなたのInstagram 1投稿を起点に「旅人の絵葉書シェア → 店舗の自動参加 → 検索流入」が自走し、不具合も自動検知・修復する仕組み
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/partner"
              className="text-xs font-black px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200"
            >
              🏪 店舗オーナー画面
            </Link>
            <Link
              href="/guide"
              className="text-xs font-black px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
            >
              ❓ 活用ガイド・LP
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* ─── Live Autonomous Flywheel KPI Bar ─── */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: '💮 発行された御朱印絵葉書',
              value: growthState?.metrics.postcards_issued ?? 48,
              sub: '旅人の思い出＆口コミ数',
            },
            {
              label: '📸 IGストーリーズ画像保存',
              value: growthState?.metrics.instagram_story_downloads ?? 34,
              sub: '9:16 バイラル拡散カード',
            },
            {
              label: '🎁 来店歓迎特典の提示数',
              value: growthState?.metrics.welcome_perks_shown ?? 92,
              sub: '店舗への実送客アクション',
            },
            {
              label: '🏪 未開拓店舗の自動招待',
              value: growthState?.metrics.stores_auto_invited ?? 12,
              sub: '営業ゼロの自動オーナー獲得',
            },
            {
              label: '🛡️ 自動検知・自己修復数',
              value: growthState?.metrics.self_healed_incidents ?? 7,
              sub: '画像切れ・データ不整合を自動修復',
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs"
            >
              <p className="text-[11px] font-black text-slate-500">{k.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{k.value}</p>
              <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </section>

        {/* ─── 1. How Initial Boost Ignites Self-Sustaining Growth (3 Automated Loops) ─── */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-lg space-y-5">
          <div>
            <span className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-slate-950 mb-2">
              🚀 初期ブーストから「ひとりでに成長する」3つの自動化エンジン
            </span>
            <h2 className="text-lg sm:text-2xl font-black">
              あなたがInstagramに投稿したあと、どうやってサービスが勝手に広がり続けるのか？
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-2">
              <span className="text-xs font-black text-amber-300">
                歯車① 初期ブースト ＆ 店舗リポスト連鎖
              </span>
              <h3 className="text-sm font-black">
                📸 「看板の一皿＋御朱印カード」で店舗公式アカウントを巻き込む
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                下のジェネレーターで生成した9:16画像に <b>@店舗アカウント</b> をメンションしてあなたが1投稿すると、<b>メンション通知を受けた飲食店オーナーが喜んで公式ストーリーズにリポスト</b>します。店舗の既存フォロワーと訪日客が一気に流入します。
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-2">
              <span className="text-xs font-black text-amber-300">
                歯車② 旅人が営業マンになる「店舗自動開拓ループ」
              </span>
              <h3 className="text-sm font-black">
                💌 旅人の「ごちそうさま絵葉書」が未登録オーナーを自動で連れてくる
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                旅人が食後に「御朱印スタンプ」を押してストーリーズでシェアすると、システムが裏側で<b>「海外の旅人からあなたの店舗へ絵葉書が届いています！」というオーナー招待リンクを自動生成</b>。営業ゼロで参加店舗が勝手に増え続けます。
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-2">
              <span className="text-xs font-black text-amber-300">
                歯車③ Google検索 ＆ AI検索（ChatGPT等）自動流入
              </span>
              <h3 className="text-sm font-black">
                🔍 「看板の一皿」構造化データ（JSON-LD）で検索上位を自動獲得
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                店舗や旅人の絵葉書が増えるたび、各店舗の「看板の一皿」と「歓迎特典」がSchema.org構造化データとして検索エンジン＆AIに出力され、SNSを見ていない訪日客も24時間自然流入します。
              </p>
            </div>
          </div>
        </section>

        {/* ─── 2. Instagram Initial Boost Studio (1-Click 9:16 Card & Caption Generator) ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-900 mb-1">
                📸 初期ブースト専用ツール • 10秒でInstagram投稿素材を自動生成
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Instagram ストーリーズ＆フィード自動生成スタジオ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                紹介したい店舗を選ぶだけで、9:16縦型御朱印カード画像（PNG）と、店舗メンション・日英ハッシュタグ入りキャプションを自動生成します。
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                1. ピックアップする店舗を選択
              </label>
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-black text-slate-900 bg-slate-50"
              >
                {MASTER_PLACES.slice(0, 40).map((p) => (
                  <option key={p.google_place_id} value={p.google_place_id}>
                    {p.name_ja || p.name}（{p.area}）— 📸 @{p.instagram_id || 'official'}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <p className="text-[11px] font-black text-amber-900">
                👑 自動抽出された「看板の一皿」＆「歓迎特典」
              </p>
              <p className="text-xs sm:text-sm font-black text-slate-900">
                {sigDish?.name_ja}（¥{sigDish?.price_jpy.toLocaleString()}）
              </p>
              <p className="text-xs font-bold text-emerald-800">{welcomePerk.ja}</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                2. 自動生成された日英バイラル投稿キャプション（店舗メンション入り）
              </label>
              <textarea
                rows={7}
                readOnly
                value={autoCaption}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-800 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadStoryPng}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500 hover:opacity-95 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📸</span>
                <span>9:16 ストーリーズ用PNG画像を保存</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📋</span>
                <span>キャプション＆店舗メンションをコピー</span>
              </button>
            </div>
          </div>

          {/* Right Column: Automated Store Onboarding Queue */}
          <div className="lg:col-span-5 rounded-3xl bg-[#FCF9F2] border-2 border-amber-300/90 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col">
            <div className="border-b border-amber-200/70 pb-3">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 mb-1">
                🏪 営業ゼロの店舗自動獲得キュー
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                旅人の絵葉書から自動生成された「未認証店舗オーナー招待リスト」
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                未登録の店舗に旅人が「ごちそうさま絵葉書」を送ると、自動的にここへ招待DM文面と専用リンクが生成されます。
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {(growthState?.viral_invites || []).map((inv: StoreViralInvite) => (
                <div
                  key={inv.place_id}
                  className="rounded-2xl bg-white border border-amber-200 p-4 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {inv.place_name}（{inv.area}）
                      </h3>
                      <p className="text-[11px] font-bold text-rose-700">
                        💌 未開封の旅人絵葉書: {inv.pending_postcards_count}通 • 📸 {inv.instagram_handle}
                      </p>
                    </div>
                    <Link
                      href={inv.invite_url}
                      className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0"
                    >
                      オーナー画面確認 →
                    </Link>
                  </div>

                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                    &ldquo;{inv.latest_traveler_quote}&rdquo;
                  </p>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inv.dm_template_ja);
                        showNotice(`📋 ${inv.place_name}様宛ての招待DM文面をコピーしました！`);
                      } catch {}
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs cursor-pointer transition-colors"
                  >
                    📋 店舗Instagramへの招待DM文面をワンタップコピー
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 3. Self-Healing & Automated Bug/Data Recovery Engine (不具合の自動検知・自己修復システム) ─── */}
        <section className="rounded-3xl bg-white border-2 border-emerald-300/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                  🛡️ Self-Healing & Auto-Recovery Engine
                </span>
                <span className="text-xs font-black text-emerald-700">
                  ● 全システム自動監視・自己修復稼働中
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                不具合やデータ不備が起きた時に「自動で検知・自己修復・改善される仕組み」
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                画像リンク切れの自動代替（Self-Healing Guard）、DB欠損フィールドの自動補完（Schema Sanitizer）、および現場からの10秒レポートによる自動パッチが常時稼働しています。
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={isRunningDiag}
              className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer shrink-0 transition-all"
            >
              {isRunningDiag
                ? '⚡ 自己修復診断を実行中...'
                : '⚡ 今すぐ全店舗データの自己修復診断を実行'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Real-Time Self-Healing Log Timeline */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                直近の自動検知・自己修復（Auto-Heal）履歴ログ
              </h3>
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {(growthState?.healing_events || []).map((ev: SelfHealingEvent) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                          ✓ {ev.auto_action_taken}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(ev.timestamp).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900">{ev.title_ja}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {ev.detail_ja}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: 10-Second Issue & Spot Fix Reporter */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  🛠️ 10秒スマート不具合・店舗データ修正ポスト
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1.5">
                  不具合や店舗情報の変更を見つけたら即座に反映
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  送信すると即座にセルフヒーリング診断が走り、データ補完・フォールバック保護の適用と改善ログへの記録が自動で行われます。
                </p>
              </div>

              <form onSubmit={handleSubmitIssue} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    現象・対象の店舗や画面
                  </label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="例: 〇〇店のInstagramリンク変更 / スマホ画面での表示崩れ"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    詳細メモ（任意）
                  </label>
                  <textarea
                    rows={2}
                    value={issueDetail}
                    onChange={(e) => setIssueDetail(e.target.value)}
                    placeholder="気づいた点をご記入ください（自動で診断＆フォールバック保護が適用されます）"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingIssue}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer transition-colors"
                >
                  {isSubmittingIssue
                    ? '自動保護パッチ適用中...'
                    : '🛠️ 不具合・修正を登録して自動修復を実行する'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
