'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GuideAndFaqPage() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [audience, setAudience] = useState<'owner' | 'traveler'>('owner');
  const isJa = lang === 'ja';

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-slate-900 pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <span>←</span>
              <span>{isJa ? 'マップへ戻る' : 'Back to Map'}</span>
            </Link>
            <span className="text-sm font-black tracking-tight text-slate-900">
              vegan<span className="text-emerald-600">.jp</span>{' '}
              <span className="text-xs font-bold text-slate-500">
                {isJa ? 'コンセプト ＆ 活用ガイド' : 'Concept & Guide'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(isJa ? 'en' : 'ja')}
              className="text-xs font-black px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
            >
              {isJa ? '🇬🇧 English' : '🇯🇵 日本語'}
            </button>
            <Link
              href="/partner"
              className="text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              {isJa ? '🏪 店舗オーナー画面へ' : '🏪 Partner Studio'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* ─── Hero Section: The Single Unmistakable Core Identity ─── */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-black px-3.5 py-1 rounded-full bg-amber-400 text-slate-950">
            <span>💮</span>
            <span>
              {isJa
                ? 'Vegan.jp だけの「選択と集中」：旅の思い出ブースト × お店のファン集客'
                : 'Why Vegan.jp: Boost Travel Memories × Grow Happy Restaurant Fans'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
            {isJa ? (
              <>
                「看板の一皿」で出会い、
                <br />
                「ごちそうさま御朱印＆絵葉書」で
                <br />
                旅の思い出とお店のファンが増える。
              </>
            ) : (
              <>
                Discover by the Chef’s Signature Dish.
                <br />
                Boost Trip Memories with Gochisosama Stamps & Postcards.
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-3xl leading-relaxed">
            {isJa
              ? 'Googleマップや既存サイトの「無機質な星評価・細かすぎるチェック項目」をすべて手放しました。Vegan.jpは、シェフが誇りを持って届ける『看板の一皿＋歓迎特典』と、旅人が食後に集める『美食御朱印スタンプ＆絵葉書』の2つだけで、訪日客の旅を一生の思い出に変え、お店に新しいお客様を次々と呼び込むサービスです。'
              : 'No dry star ratings or overwhelming checklists. Vegan.jp connects travelers and restaurants through two joyful pillars: the Chef’s #1 Signature Dish (+ Welcome Treat) and collectible Japan Culinary Stamps & Postcards.'}
          </p>

          {/* Audience Switcher */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setAudience('owner')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                audience === 'owner'
                  ? 'bg-amber-400 text-slate-950 shadow-lg scale-[1.02]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>🏪</span>
              <span>
                {isJa
                  ? '飲食店オーナー様：どうやってお客様が増える？（2ステップ）'
                  : 'For Restaurant Owners (How You Get More Guests)'}
              </span>
            </button>
            <button
              onClick={() => setAudience('traveler')}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                audience === 'traveler'
                  ? 'bg-amber-400 text-slate-950 shadow-lg scale-[1.02]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>🧳</span>
              <span>
                {isJa
                  ? '訪日旅行者の方：どうやって旅の思い出がブーストする？'
                  : 'For Travelers (How It Boosts Your Japan Trip)'}
              </span>
            </button>
          </div>
        </section>

        {/* ─── Audience-Specific 2-Pillar Value Breakdown ─── */}
        {audience === 'owner' ? (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Owner Pillar 1 */}
              <div className="rounded-3xl bg-white border-2 border-amber-300 p-6 shadow-sm space-y-3">
                <span className="inline-block text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                  STEP 1 • 新規来店が増える仕掛け
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  👑 「看板の一皿」と「🎁 画面提示の歓迎特典」を1つ載せるだけ
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  旅人がお店を選ぶ決め手は「細かい成分表」ではなく、<b>「このお店のこの一皿を絶対に食べたい！」という感動</b>です。
                  自慢の看板メニュー1品と、注文画面提示時のミニ歓迎特典（例：一口餃子2個・ミニ豆乳アイス進呈など）を登録するだけで、「この一皿目当て」の訪日客が迷わず来店し、日本語の注文カードを見せてスムーズにオーダーします。
                </p>
              </div>

              {/* Owner Pillar 2 */}
              <div className="rounded-3xl bg-[#FCF9F2] border-2 border-rose-300 p-6 shadow-sm space-y-3">
                <span className="inline-block text-xs font-black px-3 py-1 rounded-full bg-rose-100 text-rose-900">
                  STEP 2 • 旅人の口コミで次のお客様が増える仕掛け
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  💌 届いた「ごちそうさま絵葉書」に日本語で一言返信するだけ
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  食後に旅人が送った「ごちそうさま絵葉書」は日本語に自動翻訳されて届きます。オーナー様が日本語で一言返信すると英語へ自動翻訳され、旅人の<b>『旅の美食御朱印帳』にシェフ直筆返信として刻まれます</b>。感動した旅人がSNSや仲間に絵葉書をシェアし、それを見た次の旅行者が「こんな温かいお店に行きたい！」と次々来店する好循環が生まれます。
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-emerald-950 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black">
                  ✨ 初期費用・月額費用・送客手数料 すべて ¥0（完全無料）
                </h3>
                <p className="text-xs text-emerald-200">
                  所要時間2分。今すぐあなたのお店の「看板の一皿」と「歓迎特典」を設定できます。
                </p>
              </div>
              <Link
                href="/partner"
                className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shrink-0 shadow-md transition-all"
              >
                🏪 店舗オーナー画面を開く →
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Traveler Pillar 1 */}
            <div className="rounded-3xl bg-white border-2 border-amber-300 p-6 shadow-sm space-y-3">
              <span className="inline-block text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900">
                EXPERIENCE 1 • 最高の一皿と出会う
              </span>
              <h2 className="text-lg font-black text-slate-900">
                👑 シェフの「看板の一皿」と「🎁 画面提示の歓迎特典」を楽しむ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                どのお店を開いても、シェフが一番誇りを持つ「看板の一皿」が一目でわかります。席に着いたら「店員さんに見せて注文」ボタンを押すだけで、看板メニューの注文と同時に<b>お店からの歓迎プレゼント（ミニデザートやトッピング等）</b>が受け取れます！
              </p>
            </div>

            {/* Traveler Pillar 2 */}
            <div className="rounded-3xl bg-[#FCF9F2] border-2 border-rose-300 p-6 shadow-sm space-y-3">
              <span className="inline-block text-xs font-black px-3 py-1 rounded-full bg-rose-100 text-rose-900">
                EXPERIENCE 2 • 旅の思い出を形に残す
              </span>
              <h2 className="text-lg font-black text-slate-900">
                💮 食後に「ごちそうさま」を送って『日本の美食御朱印＆絵葉書』を集める
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                食事のあとにシェフへ「ごちそうさま！」を送ると、そのお店固有の<b>『完食御朱印スタンプ』があなたの御朱印帳に押印</b>され、美しい記念絵葉書が発行されます。さらにシェフからあなた宛ての直筆返信が届き、一生忘れられない日本旅の宝物になります。
              </p>
            </div>
          </section>
        )}

        {/* ─── Anti-Spoofing & Owner Verification Architecture ─── */}
        <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <span className="inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 mb-2">
              🛡️ Security & Trust / なりすまし防止の仕組み
            </span>
            <h2 className="text-xl font-black text-slate-900">
              どうやって本物の店舗オーナーだと証明するの？（なりすまし防止対策）
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              無関係な第三者が勝手に店舗オーナーを名乗って看板メニューや返信を書き換えられないよう、Vegan.jpでは<b>「3方式の6桁ワンタイム認証コード（OTP）ゲート」</b>による本人確認を義務付けています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-2xl">📸</div>
              <h3 className="text-sm font-black text-slate-900">
                ① 公式Instagram 認証コード照合
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                店舗の公式Instagramアカウント宛に6桁のワンタイム認証コードを発行し、本人確認を行います。
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-2xl">📞</div>
              <h3 className="text-sm font-black text-slate-900">
                ② 店舗固定電話 / 公式ドメインOTP
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                地図データに登録されている店舗電話番号または公式ドメインメール宛に6桁OTPを送信して照合します。
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-2xl">📜</div>
              <h3 className="text-sm font-black text-slate-900">
                ③ 飲食店営業許可証 番号照合
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                保健所発行の「飲食店営業許可証」番号と店舗所在地を照合し、認定証明書（CERT-VGJP）を発行します。
              </p>
            </div>
          </div>
        </section>

        {/* ─── Simple Q&A ─── */}
        <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-xl font-black text-slate-900">
            ❓ よくある質問（Q&A）
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                Q. 店舗側で細かいメニュー表や成分チェックリストを全部入力する必要はありますか？
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <b>A. 一切不要です！</b> Vegan.jpは「選択と集中」を徹底しており、オーナー様が設定するのは<b>「👑 自慢の看板の一皿（1品）」と「🎁 画面提示の歓迎特典」だけ</b>です。2分で設定でき、日々の運用は届いた「ごちそうさま絵葉書」に楽しく一言返信するだけで完結します。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                Q. なぜ「看板の一皿＋歓迎特典」と「ごちそうさま御朱印＆絵葉書」でお客様が増えるのですか？
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <b>A. 来店前の「強い動機づけ」と、食後の「思い出シェア」が直結しているからです。</b> 旅人は「この看板料理が食べたい！しかも画面を見せれば歓迎してもらえる！」というポジティブな理由でお店を選びます。そして食後に発行される御朱印絵葉書とシェフの温かい返信が旅人のSNSや友人へと広がり、次の訪日客を自然に呼び込みます。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                Q. 悪質な低評価レビューや嫌がらせ投稿が書かれる心配はありませんか？
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <b>A. ありません。</b> Vegan.jpには1〜5つ星の採点やクレーム掲示板は存在せず、旅人が食後に「ごちそうさま！」の感謝と感動を届けるポジティブな絵葉書システムのみを採用しています。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
