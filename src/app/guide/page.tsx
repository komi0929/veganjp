'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function GuideAndLandingPage() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [audience, setAudience] = useState<'restaurant' | 'traveler'>('restaurant');

  const isJa = lang === 'ja';

  return (
    <div className="min-h-screen bg-[#F6F9F6] text-slate-900 font-sans pb-24">
      {/* ─── Sticky Navigation Header ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-base font-black tracking-tight text-slate-900">
                vegan<span className="text-emerald-600">.jp</span>
              </span>
            </Link>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              {isJa
                ? '公式ガイド・飲食店様向けLP・よくある質問'
                : 'Official Guide, Restaurant Partner LP & FAQ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex bg-slate-100 p-1 rounded-full text-xs font-bold">
              <button
                onClick={() => setLang('ja')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  isJa ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                🇯🇵 日本語
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                  !isJa ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            <Link
              href="/partner"
              className="text-xs font-extrabold bg-emerald-900 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-full transition-colors"
            >
              🏪 {isJa ? '店舗オーナー管理画面' : 'Partner Portal'}
            </Link>

            <Link
              href="/"
              className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-full transition-colors"
            >
              🗺️ {isJa ? 'マップを開く' : 'Open Map'}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero LP Banner ─── */}
      <section className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white py-14 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-extrabold px-4 py-1.5 rounded-full">
            <span>🌱</span>
            <span>
              {isJa
                ? 'GoogleマップやHappyCowでは解決できなかった「出汁の不安」と「注文の言葉の壁」をゼロへ'
                : 'Solving Hidden Fish Dashi Anxiety & Table Ordering Barriers in Japan'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {isJa ? (
              <>
                訪日ゲストには「100%の安心と指差し注文」を。
                <br />
                日本の飲食店には「英語不要の接客と感謝の声」を。
              </>
            ) : (
              <>
                100% Dashi Transparency &amp; Point-to-Order for Travelers.
                <br />
                Zero-English Stress &amp; Direct Gratitude for Japanese Chefs.
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            {isJa
              ? 'vegan.jp は、単なる口コミ地図ではありません。店舗オーナー様が「日本語で3分」設定するだけで、世界8言語の指差し注文票・出汁の安全証明・双方向の感謝レターが動き出す実践プラットフォームです。'
              : 'vegan.jp is more than a map. It connects verified Japanese restaurant kitchens directly with global plant-based travelers through 8-point dashi audits, instant Japanese order tickets, and translated gratitude letters.'}
          </p>

          {/* Audience Switcher */}
          <div className="pt-3 flex justify-center">
            <div className="inline-flex bg-black/30 p-1.5 rounded-2xl border border-white/15 gap-2">
              <button
                onClick={() => setAudience('restaurant')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${
                  audience === 'restaurant'
                    ? 'bg-emerald-400 text-slate-950 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                🏪 {isJa ? '飲食店オーナー様向けガイド（導入メリット・本人確認）' : 'For Restaurant Owners (LP & Verification)'}
              </button>
              <button
                onClick={() => setAudience('traveler')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-all ${
                  audience === 'traveler'
                    ? 'bg-emerald-400 text-slate-950 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                🧳 {isJa ? '訪日旅行者向け（3ステップ活用法）' : 'For Travelers (How to Use in 3 Steps)'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 space-y-12">
        {audience === 'restaurant' ? (
          /* =====================================================================
           * 🏪 飲食店オーナー様向け LP・導入ガイド・なりすまし防止解説
           * ===================================================================== */
          <>
            {/* 1. Why vegan.jp beats Google Maps & HappyCow for Stores */}
            <section className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  WHY VEGAN.JP FOR RESTAURANTS
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {isJa
                    ? 'なぜ多くの飲食店が Googleマップ・HappyCow に加えて vegan.jp を導入するのか？'
                    : 'Why Japanese Restaurants Choose vegan.jp Over Google Maps & HappyCow'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold">
                    🗣️
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {isJa
                      ? '1. 英語接客ゼロ！「日本語の確定注文票」でお客様が注文してくれる'
                      : '1. Zero English Stress at the Table'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isJa
                      ? '外国人客が来店しても、スタッフが英語で原材料や出汁を説明する必要はありません。お客様がスマホでメニューを選ぶと、スタッフ向けに「大きな日本語の注文票（料理名・数量・五葷抜き等の要望）」が表示されるため、3秒で正確に注文を受けられます。'
                      : 'Guests select verified vegan items in their own language and show a crystal-clear Japanese Order Ticket to your staff. Zero miscommunication during busy rushes.'}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-bold">
                    🛡️
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {isJa
                      ? '2. 日本語で選ぶだけで「出汁・調理環境」を世界8言語へ自動変換'
                      : '2. 8-Language Auto-Translation'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isJa
                      ? '海外のヴィーガン客が最も恐れているのは「見えない鰹出汁・魚介エキス」です。100%ヴィーガン専門店はもちろん、一般メニューと併設の飲食店様も「どのメニューなら魚介出汁なしか」を日本語で登録するだけで8言語に自動翻訳されます。'
                      : 'Enter your menu and dashi policy in Japanese once — vegan.jp automatically presents it in English, Traditional/Simplified Chinese, Korean, French, German, and Spanish.'}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-2xl font-bold">
                    💌
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {isJa
                      ? '3. 外国のお客様から「日本語に翻訳された感謝レター」が届く'
                      : '3. Translated Gratitude Letters from Guests'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isJa
                      ? '普段は「Arigato」の一言で帰ってしまう海外ゲストから、食後に温かい感謝メッセージが日本語翻訳付きで厨房に届きます。オーナー様が日本語で返信すると英語に自動変換されて公開され、さらなるファンを生みます。'
                      : 'Receive heartwarming thank-you notes automatically translated into Japanese, and reply in Japanese to build global fan loyalty.'}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Simple 3-Step Onboarding for First-Time Stores */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase">
                    EASY 3-STEP ONBOARDING
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {isJa
                      ? 'はじめての店舗様でも迷わない！「3つのステップ」活用法（完全無料）'
                      : 'How Restaurant Owners Use vegan.jp in 3 Simple Steps (100% Free)'}
                  </h2>
                </div>
                <Link
                  href="/partner"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-xs transition-colors"
                >
                  🏪 {isJa ? '今すぐ店舗管理画面を開く →' : 'Open Partner Portal →'}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="inline-block bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-full">
                    STEP 1（初回のみ・2分）
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    🔍 自店を検索して「オーナー本人確認」＆メニュー登録
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    全国506店舗から自店を検索（未掲載なら新規登録）し、本人確認コードでロックを解除。ヴィーガン対応可能な看板メニュー（1品からOK）を登録します。
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="inline-block bg-emerald-700 text-white text-xs font-black px-3 py-1 rounded-full">
                    STEP 2（店頭に設置・1分）
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    🖨️ 「店頭用8言語QRポップ」を印刷してテーブルに置く
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    管理画面からワンクリックで印刷できるQRポップをレジ横やテーブルに設置。来店した外国人客がスキャンするだけで8言語メニュー＆指差し注文票が開きます。
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="inline-block bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full">
                    STEP 3（日々の運用・30秒）
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    💌 届いた感謝レターへの返信 ＆ 空席ステータス切替
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    食後のゲストから届いた感謝レターを読んで定型文や一言でお礼返信。「本日営業中・空席あり」「スープ残りわずか」も1タップで発信できます。
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Anti-Spoofing & Store Owner Verification System (なりすまし防止対策の詳細) */}
            <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-full">
                  <span>🔐 ANTI-SPOOFING &amp; SECURITY ARCHITECTURE</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white pt-1">
                  {isJa
                    ? 'どうやって本物の店舗オーナーと認識されるのか？（なりすまし防止・3段階本人確認システム）'
                    : 'How Store Ownership is Verified (3-Method Anti-Spoofing System)'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isJa
                    ? '第三者や悪意あるユーザーが勝手にお店のオーナーになりすまし、虚偽のメニュー登録や返信を行うことを防ぐため、vegan.jp では以下の「3つの本人確認ルート」のいずれかでワンタイム認証コード（OTP）照合を通過したアカウントにのみ編集権限と公式認定証明書（Certificate ID）を発行しています。'
                    : 'To prevent unauthorized third parties from impersonating restaurant owners or tampering with allergen/dashi information, vegan.jp enforces strict 3-method OTP ownership verification before unlocking editing privileges.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2">
                  <div className="text-emerald-300 font-extrabold text-sm">
                    認証方法① 公式Instagramアカウント照合
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    各店舗の公式Instagram（例: <code className="text-emerald-200">@soystories_yakuin</code>）に対し、6桁の認証コードを発行。公式アカウントからのDM送信またはプロフィール欄でのトークン照合により、店舗公式SNSの管理者本人であることを確認します。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2">
                  <div className="text-emerald-300 font-extrabold text-sm">
                    認証方法② 店舗登録固定電話 / 公式ドメインOTP
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Google Mapsに登録されている店舗の公式電話番号への自動音声/SMSワンタイムパスコード通知、または店舗公式Webサイトと同一ドメインのメールアドレス（例: <code className="text-emerald-200">owner@店舗ドメイン</code>）で6桁コードを照合します。
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2">
                  <div className="text-emerald-300 font-extrabold text-sm">
                    認証方法③ 保健所「飲食店営業許可証」番号照合
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    SNSやWebサイトを持たない個人店様でも、保健所交付の「飲食店営業許可証（許可番号・施設名・代表者名）」を登録・照合することで、公式オーナー認定バッジ（<code className="text-emerald-200">CERT-VGJP-XXXXX</code>）を取得できます。
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* =====================================================================
           * 🧳 訪日旅行者向け 3ステップ活用ガイド
           * ===================================================================== */
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-extrabold text-emerald-700 uppercase">
                FOR INBOUND TRAVELERS
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                {isJa
                  ? '訪日旅行者向け：3ステップで安心・快適に日本のヴィーガン料理を楽しむ方法'
                  : 'How to Dine Safely & Effortlessly in Japan in 3 Steps'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="text-2xl">1️⃣ 🔍</div>
                <h3 className="text-sm font-black text-slate-900">
                  {isJa
                    ? 'STEP 1: 8言語マップ＆出汁8項目監査でお店を選ぶ'
                    : 'STEP 1: Filter by Diet & Check the 8-Point Dashi Audit'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isJa
                    ? '右上の言語ボタンで地図の地名まで母国語に最適化。「100%完全ヴィーガン」「グルテンフリー」「五葷抜き」で絞り込み、鰹出汁や揚げ油の分離状況を一目で確認できます。'
                    : 'Switch the map into your native language. Filter by 100% Dedicated Vegan, Gluten-Free, or Allium-Free, and verify that the broth has zero bonito fish dashi.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="text-2xl">2️⃣ 🗣️</div>
                <h3 className="text-sm font-black text-slate-900">
                  {isJa
                    ? 'STEP 2: 席に着いたら「＋」で選んで日本語注文票を店員に見せる'
                    : 'STEP 2: Tap "+ Order" & Show the Japanese Order Ticket'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isJa
                    ? '入店後、メニューの「＋ Order」を押して「店員さんに注文画面を見せる」をタップすると、正確な日本語の料理名・数量・アレルゲン注意事項が大きく表示されます。'
                    : 'Select the dishes you want on the store card and tap "Show Japanese Order Ticket to Staff". Your waiter reads the exact Japanese dish names and dietary rules in 3 seconds!'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="text-2xl">3️⃣ 💌</div>
                <h3 className="text-sm font-black text-slate-900">
                  {isJa
                    ? 'STEP 3: 食後にスタンプで「感謝レター」をシェフへ贈る'
                    : 'STEP 3: Send a Translated Gratitude Card to the Chef'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isJa
                    ? '英語や母国語で書いた感謝メッセージは自動的に自然な日本語へ翻訳され、お店の管理画面へ届きます。シェフからの公式返信もマップ上で受け取れます。'
                    : 'Tap "Send Love" after your meal! Your note is automatically translated into warm Japanese for the kitchen staff, and the chef can reply directly to you.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── Frequently Asked Questions (Q&A) ─── */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              FREQUENTLY ASKED QUESTIONS (Q&amp;A)
            </span>
            <h2 className="text-xl font-black text-slate-900">
              {isJa ? 'よくある質問（飲食店様 ＆ 旅行者様）' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-2">
              <div className="text-xs font-black text-emerald-800">
                Q1. 飲食店が登録・利用するのに費用や手数料はかかりますか？
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>A. 完全無料（¥0）です。</strong> オーナー登録、8言語指差し注文メニューの作成、リアルタイム営業発信、店頭用QRコード印刷、感謝レターの送受信まで一切費用はかかりません。
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-2">
              <div className="text-xs font-black text-emerald-800">
                Q2. 100%ヴィーガン専門店ではなく、通常の肉・魚料理も扱う一般飲食店でも登録できますか？
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>A. はい、大歓迎です！</strong> 日本では一般のラーメン店や居酒屋・和食店が「1〜2品のヴィーガン対応メニュー」を提供しているケースが多くあります。その該当メニューだけを「指差し注文票」に登録でき、調理器具や揚げ油の共用有無も事前開示できるため、来店後のトラブルを100%防げます。
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-2">
              <div className="text-xs font-black text-emerald-800">
                Q3. 関係ない第三者が勝手にうちの店舗のオーナーになりすまして編集できませんか？
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>A. 編集ロックにより保護されています。</strong> 未認証の状態では店舗情報の書き換えや返信はできません。「①公式Instagram照合」「②店舗登録電話OTP」「③飲食店営業許可証番号」のいずれかで6桁の認証コード（OTP）照合を完了した正規オーナー様のみが編集でき、店舗カードには認証証明書（Certificate ID）が表示されます。
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-2">
              <div className="text-xs font-black text-emerald-800">
                Q4. お店のスタッフが英語をまったく話せないのですが、本当に大丈夫ですか？
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>A. 英語は一切不要です。</strong> オーナー様は管理画面で日本語を入力するだけ、現場スタッフの方は外国人客がスマホ画面で見せてくれる「日本語の確定オーダー票」を読んで調理・配膳するだけで完結します。
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-emerald-900 text-white rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-xl font-black">
            {isJa
              ? 'さっそくマップや店舗オーナーポータルを体験してみませんか？'
              : 'Ready to Explore the Map or Claim Your Restaurant?'}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/partner"
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-md transition-colors"
            >
              🏪 {isJa ? '飲食店オーナーポータルを開く (/partner)' : 'Open Store Partner Portal (/partner)'}
            </Link>
            <Link
              href="/"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-colors"
            >
              🗺️ {isJa ? '訪日旅行者マップを開く (/)' : 'Open Traveler Map (/)'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
