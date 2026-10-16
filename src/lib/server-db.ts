import fs from 'fs';
import path from 'path';
import type {
  StorePartnerAccount,
  StoreOfficialData,
  GratitudeNote,
  Place,
  MenuItem,
  KitchenAudit,
  LiveKitchenStatus,
  OwnerVerificationCertificate,
} from './types';
import { translateTravelerNoteToJa, translateOwnerReplyToEn } from './kitchen-defaults';

export interface PendingVerificationRequest {
  place_id: string;
  method: OwnerVerificationCertificate['method'];
  identifier: string;
  otp_code: string;
  owner_name: string;
  created_at: string;
}

export interface EcosystemDatabase {
  partners: StorePartnerAccount[];
  stores: Record<string, StoreOfficialData>;
  gratitude_notes: GratitudeNote[];
  custom_places: Place[];
  pending_verifications?: Record<string, PendingVerificationRequest>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'store-ecosystem.json');

const INITIAL_SEED_DB: EcosystemDatabase = {
  partners: [
    {
      id: 'partner-soystories',
      email: 'owner@soystories.jp',
      password_hash: 'vegan2026',
      owner_name: 'SoyStories 薬院 オーナーシェフ',
      role_title: 'ストアマネージャー / パティシエ',
      claimed_place_ids: ['ChIJL8ZEXViRQTURgeN1wM_GJ6E'],
      created_at: '2026-10-01T09:00:00.000Z',
    },
    {
      id: 'partner-yadokari',
      email: 'chef@yadokari-vegan.jp',
      password_hash: 'vegan2026',
      owner_name: 'YADOKARI 大将',
      role_title: 'オーナーシェフ',
      claimed_place_ids: ['vegan-ramen-01'],
      created_at: '2026-10-01T09:00:00.000Z',
    },
    {
      id: 'partner-mercy',
      email: 'hello@mercy-vegan.jp',
      password_hash: 'vegan2026',
      owner_name: 'MERCY Vegan Kitchen 代表',
      role_title: 'オーナーシェフ',
      claimed_place_ids: ['vegan-ramen-07'],
      created_at: '2026-10-01T09:00:00.000Z',
    },
  ],
  stores: {
    ChIJL8ZEXViRQTURgeN1wM_GJ6E: {
      place_id: 'ChIJL8ZEXViRQTURgeN1wM_GJ6E',
      is_official_verified: true,
      owner_id: 'partner-soystories',
      owner_name: 'SoyStories 薬院 オーナーシェフ',
      role_title: 'ストアマネージャー / パティシエ',
      verification_cert: {
        is_verified: true,
        method: 'instagram_official',
        method_label_ja: '公式Instagram (@soystories_yakuin) ＆ 福岡市飲食店営業許可証 照合済',
        method_label_en: 'Verified via Official Instagram (@soystories_yakuin) & Restaurant Permit',
        verified_identifier: '@soystories_yakuin / 福岡市保健所 許可第2026-0192号',
        verified_at: '2026-10-01T09:00:00.000Z',
        certificate_id: 'CERT-VGJP-88412',
      },
      chef_greeting_ja:
        '創業100年「荒木豆腐店」の朝搾り濃厚豆乳と、福岡県産・八女抹茶やあまおう苺を重ねたクラフトアイス＆焼きたて米粉ワッフル専門店です。福岡の旅の思い出に残る特別な一皿をご用意してお待ちしています🍨',
      chef_greeting_en:
        'Welcome to SoyStories Yakuin! Every scoop of our craft ice cream and freshly baked rice-flour waffle is made with fresh morning soy milk from a 100-year-old Fukuoka tofu master and local Kyushu ingredients.',
      welcome_perk_ja:
        '🎁 Vegan.jp 注文画面のご提示で「焼きたてミニ米粉クッキー または 豆乳ホイップ増量」を歓迎サービス！',
      welcome_perk_en:
        '🎁 Show this Vegan.jp Order Card for a complimentary Freshly Baked Mini Rice-Flour Cookie or Extra Soy Whip!',
      live_status: {
        status: 'open_available',
        message_ja:
          '🟢 本日営業中！朝搾り豆乳の「濃厚ピスタチオ」「八女抹茶」「あまおう苺」全フレーバー揃っています🍨',
        message_en:
          '🟢 Open Now! Freshly churned Pistachio, Yame Matcha & Fukuoka Amaou Strawberry soy craft ice cream & hot rice-flour waffles ready! 🍨',
        updated_at: new Date().toISOString(),
      },
      kitchen_audit: {
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
      },
      verified_menu: [
        {
          id: 'ss-menu-1',
          name_ja: '濃厚豆乳クラフトアイス ダブル ＋ 焼きたて米粉ワッフルボウル',
          name_en: 'Double Soy Craft Ice Cream in Freshly Baked Rice-Flour Waffle Bowl',
          description_ja:
            '荒木豆腐店の濃厚豆乳アイス2種（八女抹茶・ピスタチオ・リッチカカオ等）を、注文後に焼き上げるサクもち食感の国産米粉100%ワッフルと共に。',
          description_en:
            'Choose any 2 artisan soy milk ice cream flavors served in a warm, crispy-chewy 100% Japanese rice-flour waffle bowl.',
          price_jpy: 980,
          is_100_vegan: true,
          is_gluten_free: true,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: '看板メニュー「クラフトアイス ダブル（米粉ワッフルボウル）」を1つお願いします',
        },
        {
          id: 'ss-menu-2',
          name_ja: '福岡・八女抹茶＆黒蜜きな粉の豆乳パフェ（グルテンフリー）',
          name_en: 'Fukuoka Yame Matcha & Kinako Kuromitsu Soy Parfait (GF)',
          description_ja:
            '福岡県産・星野村の香り高い八女抹茶アイスに、自家製米粉グラノーラ・白玉・黒蜜を重ねた贅沢な和パフェ。',
          description_en:
            'Premium Fukuoka Yame matcha ice cream layered with house-baked gluten-free rice granola, mochi pearls, and organic brown sugar syrup.',
          price_jpy: 1280,
          is_100_vegan: true,
          is_gluten_free: true,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: '八女抹茶＆黒蜜きな粉の豆乳パフェを1つお願いします',
        },
        {
          id: 'ss-menu-3',
          name_ja: '焼きたて国産米粉ワッフル プレート（有機メープル＆豆乳ホイップ）',
          name_en: 'Freshly Baked 100% Rice-Flour Waffle Plate (Organic Maple & Soy Whip)',
          description_ja:
            '外はカリッと中はモチモチの国産米粉100%ワッフルに、軽やかな自家製豆乳ホイップと有機メープルシロップを添えて。',
          description_en:
            'Crispy-outside, mochi-chewy inside 100% rice-flour waffle topped with house-whipped soy cream and pure organic maple syrup.',
          price_jpy: 950,
          is_100_vegan: true,
          is_gluten_free: true,
          is_allium_free: true,
          order_note_ja: '米粉ワッフルプレート（豆乳ホイップ添え）を1つお願いします',
        },
      ],
      updated_at: '2026-10-16T02:00:00.000Z',
    },
    'vegan-ramen-01': {
      place_id: 'vegan-ramen-01',
      is_official_verified: true,
      owner_id: 'partner-yadokari',
      owner_name: 'YADOKARI 大将',
      role_title: 'オーナーシェフ',
      verification_cert: {
        is_verified: true,
        method: 'instagram_official',
        method_label_ja: '公式Instagram (@vegan.halalramen__yadokari) ＆ 店舗電話OTP 照合済',
        method_label_en: 'Verified via Official Instagram & Registered Landline OTP',
        verified_identifier: '@vegan.halalramen__yadokari',
        verified_at: '2026-10-02T10:00:00.000Z',
        certificate_id: 'CERT-VGJP-88509',
      },
      chef_greeting_ja:
        '九州産大豆の濃厚豆乳と羅臼昆布・原木椎茸を2日間じっくり熟成させ、本場・博多豚骨のクリーミーなコクと旨味を極めたラーメン専門店です。熱々の一杯で最高の博多の夜をお楽しみください🍜',
      chef_greeting_en:
        'Welcome to YADOKARI in Hirao, Fukuoka! We slow-simmer Kyushu soy milk, Rausu kelp, and shiitake for 48 hours to create our ultra-creamy Hakata Tonkotsu-style ramen.',
      welcome_perk_ja:
        '🎁 Vegan.jp 注文画面のご提示で「パリッと羽根つき一口餃子（2個）または 替え玉ハーフ」を歓迎サービス！',
      welcome_perk_en:
        '🎁 Show this Vegan.jp Order Card for 2 complimentary Crispy Gyoza Dumplings or a Half Kaedama Noodle refill!',
      live_status: {
        status: 'open_available',
        message_ja:
          '🟢 本日ランチ・ディナーとも営業！看板の「博多豆乳とんこつラーメン」と「羽根つき焼き餃子」仕込み万全です🍜',
        message_en:
          '🟢 Open today for Lunch & Dinner! Our signature Hakata Soy-Tonkotsu Ramen and Crispy Winged Gyoza are freshly prepped 🍜',
        updated_at: new Date().toISOString(),
      },
      kitchen_audit: {
        dashi_type: '100_plant',
        fryer_oil: 'dedicated',
        cookware: 'dedicated',
        allium_free: 'all_free',
        gluten_free: 'gf_option',
        alcohol_free: 'alcohol_free',
        sugar_honey: 'no_bone_char_no_honey',
        payment_methods: ['Credit Card', 'PayPay / QR', 'Cash'],
        reservation_policy: 'walk_in_ok',
        english_support: 'english_menu_and_staff',
      },
      verified_menu: [
        {
          id: 'yd-menu-1',
          name_ja: '熟成濃厚・博多豆乳とんこつラーメン',
          name_en: 'Signature Rich Hakata Soy-Tonkotsu Ramen',
          description_ja:
            '九州産の一番搾り豆乳と香味野菜を強火で炊き上げ、クリーミーで奥深い博多豚骨の旨味を表現した不動の看板メニュー。',
          description_en:
            'Our #1 signature bowl: ultra-creamy Hakata-style broth crafted from first-press Kyushu soy milk and slow-roasted aromatics.',
          price_jpy: 1150,
          is_100_vegan: true,
          is_gluten_free: false,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: '看板メニュー「博多豆乳とんこつラーメン」を1杯お願いします',
        },
        {
          id: 'yd-menu-2',
          name_ja: '自家製焙煎・金胡麻の濃厚担々麺',
          name_en: 'House-Roasted Golden Sesame Rich Tantanmen',
          description_ja:
            '香り高い自家製焙煎胡麻ペーストと旨辛大豆ミートそぼろが絡み合う、リピーター続出の一杯。',
          description_en:
            'Fragrant stone-ground golden sesame broth crowned with savory spiced soy mince.',
          price_jpy: 1280,
          is_100_vegan: true,
          is_gluten_free: false,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: '金胡麻の濃厚担々麺を1杯お願いします',
        },
        {
          id: 'yd-menu-4',
          name_ja: 'パリッと羽根つき 自家製焼き餃子（5個）',
          name_en: 'Crispy Winged House-Made Gyoza Dumplings (5 pcs)',
          description_ja: '香ばしい羽根とキャベツ・椎茸のジューシーな旨味が溢れる特製焼き餃子。',
          description_en: 'Pan-fried dumplings with a lacy crispy wing and juicy cabbage-shiitake filling.',
          price_jpy: 580,
          is_100_vegan: true,
          is_gluten_free: false,
          is_allium_free: true,
          order_note_ja: '自家製焼き餃子（5個）を1皿お願いします',
        },
      ],
      updated_at: '2026-10-16T02:00:00.000Z',
    },
    'vegan-ramen-07': {
      place_id: 'vegan-ramen-07',
      is_official_verified: true,
      owner_id: 'partner-mercy',
      owner_name: 'MERCY Vegan Kitchen 代表',
      role_title: 'オーナーシェフ',
      verification_cert: {
        is_verified: true,
        method: 'business_license',
        method_label_ja: '大阪市飲食店営業許可証 ＆ 公式SNS 照合済',
        method_label_en: 'Verified via Osaka Restaurant Operating License & Official Social',
        verified_identifier: '大阪市保健所 飲食店営業許可照合済',
        verified_at: '2026-10-03T11:00:00.000Z',
        certificate_id: 'CERT-VGJP-88620',
      },
      chef_greeting_ja:
        '大阪・心斎橋エリアで「一番記憶に残る日本のソウルフード体験」をお届けするラーメン＆ビストロです。米粉麺への変更もご用意しています🍜',
      chef_greeting_en:
        'Osaka’s premier plant-based ramen & bistro! Crafted to give travelers an unforgettable Japanese soul-food memory.',
      welcome_perk_ja:
        '🎁 Vegan.jp 注文画面のご提示で「自家製スパイス味玉風トッピング または ミニ乌龍茶」を歓迎サービス！',
      welcome_perk_en:
        '🎁 Show this Vegan.jp Order Card for a complimentary Spiced Topping or Iced Oolong Tea!',
      live_status: {
        status: 'open_available',
        message_ja: '🟢 本日11:30〜21:00通し営業中！人気の熟成味噌ラーメンご用意できています🍜',
        message_en: '🟢 Open all day 11:30–21:00! Our signature Aged Miso Ramen is hot and ready 🍜',
        updated_at: new Date().toISOString(),
      },
      kitchen_audit: {
        dashi_type: '100_plant',
        fryer_oil: 'dedicated',
        cookware: 'dedicated',
        allium_free: 'customizable',
        gluten_free: 'gf_option',
        alcohol_free: 'alcohol_free',
        sugar_honey: 'no_bone_char_no_honey',
        payment_methods: ['Credit Card', 'PayPay / QR', 'Suica / IC', 'Cash'],
        reservation_policy: 'walk_in_ok',
        english_support: 'english_menu_and_staff',
      },
      verified_menu: [],
      updated_at: '2026-10-16T02:00:00.000Z',
    },
  },
  gratitude_notes: [
    {
      id: 'grat-seed-1',
      place_id: 'ChIJL8ZEXViRQTURgeN1wM_GJ6E',
      place_name: 'SoyStories（ソイストーリーズ）薬院',
      stamp: 'delicious',
      stamp_emoji: '🍨',
      stamp_title_en: 'Unforgettable Signature Dish!',
      stamp_title_ja: '忘れられない看板の一皿！',
      sender_name: 'Chloe & Sam',
      sender_country: 'Australia 🇦🇺',
      message_original:
        'The freshly baked rice-flour waffle bowl with Yame Matcha & Pistachio soy ice cream was the highlight of our Kyushu trip! Collecting our Gochisosama stamp here made our day!',
      message_ja_translated:
        '焼きたての米粉ワッフルボウルと八女抹茶＆ピスタチオ豆乳アイス、今回の九州旅行で一番のハイライトになりました！ここでごちそうさまスタンプを集められて最高の1日です！',
      ordered_dishes: [
        '濃厚豆乳クラフトアイス ダブル ＋ 焼きたて米粉ワッフルボウル',
      ],
      owner_reply: {
        text_ja:
          'Chloeさん、Samさん、オーストラリアからのご来店本当にありがとうございました！焼きたての米粉ワッフルと八女抹茶アイス、お二人の九州旅行の思い出の1ページになれてパティシエ・スタッフ一同最高の喜びです🌱また福岡へお越しの際はぜひお立ち寄りください！',
        text_en:
          'Thank you so much for visiting us from Australia, Chloe & Sam! Knowing our freshly baked rice-flour waffle and Yame matcha ice cream became a highlight of your Kyushu journey means the world to our whole team. See you again in Fukuoka! 🌱',
        chef_name: 'SoyStories 薬院 パティシエ・スタッフ一同',
        replied_at: '2026-10-15T11:30:00.000Z',
      },
      created_at: '2026-10-15T08:20:00.000Z',
    },
    {
      id: 'grat-seed-2',
      place_id: 'ChIJL8ZEXViRQTURgeN1wM_GJ6E',
      place_name: 'SoyStories（ソイストーリーズ）薬院',
      stamp: 'hospitality',
      stamp_emoji: '💐',
      stamp_title_en: 'Best Memory in Japan!',
      stamp_title_ja: '最高の旅の思い出！',
      sender_name: 'Mei-Ling (美玲)',
      sender_country: 'Taiwan 🇹🇼',
      message_original:
        'Saw the Signature Yame Matcha Parfait on Vegan.jp and came straight here! The welcome cookie perk and warm smiles from the staff made us fall in love with Fukuoka!',
      message_ja_translated:
        'Vegan.jpで看板メニューの「八女抹茶パフェ」を見て一目惚れして来店しました！歓迎特典の米粉クッキーとスタッフ皆さんの温かい笑顔のおかげで、福岡がもっと大好きになりました！',
      ordered_dishes: ['福岡・八女抹茶＆黒蜜きな粉の豆乳パフェ（グルテンフリー）'],
      created_at: '2026-10-16T01:15:00.000Z',
    },
    {
      id: 'grat-seed-3',
      place_id: 'vegan-ramen-01',
      place_name: 'Vegan Ramen YADOKARI',
      stamp: 'saved_trip',
      stamp_emoji: '🍜',
      stamp_title_en: 'Best Bowl of My Trip!',
      stamp_title_ja: '人生最高の一杯！',
      sender_name: 'Lucas M.',
      sender_country: 'France 🇫🇷',
      message_original:
        'The Signature Hakata Soy-Tonkotsu Ramen and crispy winged gyoza were out of this world! Showing the order card got me extra gyoza and the chef’s big smile. Sharing my postcard with all my friends in Paris!',
      message_ja_translated:
        '看板メニューの博多豆乳とんこつラーメンと羽根つき餃子、信じられない美味しさでした！注文画面を見せたら歓迎ギョーザと大将の最高の笑顔までいただけて感激です。パリの友人全員にこの絵葉書をシェアします！',
      ordered_dishes: [
        '熟成濃厚・博多豆乳とんこつラーメン',
        'パリッと羽根つき 自家製焼き餃子（5個）',
      ],
      owner_reply: {
        text_ja:
          'Lucasさん、フランス・パリからのご来店誠にありがとうございます！スープの最後の一滴まで笑顔で完飲していただけて、ラーメン職人としてこれ以上の幸せはありません。パリの皆様にもよろしくお伝えください🍜',
        text_en:
          'Merci beaucoup for visiting from Paris, Lucas! As a ramen chef, nothing makes me happier than seeing you enjoy every last drop of our Hakata broth. Thank you for sharing your postcard with your friends in Paris! 🍜',
        chef_name: 'Vegan Ramen YADOKARI 大将',
        replied_at: '2026-10-15T16:00:00.000Z',
      },
      created_at: '2026-10-15T12:40:00.000Z',
    },
  ],
  custom_places: [],
  pending_verifications: {},
};

const globalForDb = globalThis as unknown as {
  __veganJpEcosystemDb?: EcosystemDatabase;
};

export function getEcosystemDb(): EcosystemDatabase {
  if (globalForDb.__veganJpEcosystemDb) {
    return globalForDb.__veganJpEcosystemDb;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as EcosystemDatabase;
      // Ensure verification_cert exists on seeded stores
      if (parsed.stores?.ChIJL8ZEXViRQTURgeN1wM_GJ6E && !parsed.stores.ChIJL8ZEXViRQTURgeN1wM_GJ6E.verification_cert) {
        parsed.stores.ChIJL8ZEXViRQTURgeN1wM_GJ6E.verification_cert = INITIAL_SEED_DB.stores.ChIJL8ZEXViRQTURgeN1wM_GJ6E.verification_cert;
      }
      globalForDb.__veganJpEcosystemDb = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to read store-ecosystem.json, using initial seed:', e);
  }

  const seeded = JSON.parse(JSON.stringify(INITIAL_SEED_DB)) as EcosystemDatabase;
  globalForDb.__veganJpEcosystemDb = seeded;
  saveEcosystemDb(seeded);
  return seeded;
}

export function saveEcosystemDb(db: EcosystemDatabase): void {
  globalForDb.__veganJpEcosystemDb = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write store-ecosystem.json to disk (in-memory updated):', e);
  }
}

export function addGratitudeNoteToDb(params: {
  place_id: string;
  place_name: string;
  stamp: GratitudeNote['stamp'];
  stamp_emoji: string;
  stamp_title_en: string;
  stamp_title_ja: string;
  sender_name: string;
  sender_country: string;
  message_original: string;
  ordered_dishes?: string[];
}): GratitudeNote {
  const db = getEcosystemDb();
  const translatedJa = translateTravelerNoteToJa(
    params.message_original,
    params.stamp_title_ja
  );

  const newNote: GratitudeNote = {
    id: `grat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    place_id: params.place_id,
    place_name: params.place_name,
    stamp: params.stamp,
    stamp_emoji: params.stamp_emoji,
    stamp_title_en: params.stamp_title_en,
    stamp_title_ja: params.stamp_title_ja,
    sender_name: params.sender_name.trim() || 'A Grateful Traveler',
    sender_country: params.sender_country,
    message_original: params.message_original.trim(),
    message_ja_translated: translatedJa,
    ordered_dishes: params.ordered_dishes || [],
    created_at: new Date().toISOString(),
  };

  db.gratitude_notes.unshift(newNote);
  saveEcosystemDb(db);
  return newNote;
}

export function replyToGratitudeNoteInDb(params: {
  note_id: string;
  text_ja: string;
  text_en?: string;
  chef_name: string;
}): GratitudeNote | null {
  const db = getEcosystemDb();
  const target = db.gratitude_notes.find((n) => n.id === params.note_id);
  if (!target) return null;

  const autoEn =
    params.text_en?.trim() || translateOwnerReplyToEn(params.text_ja, target.place_name);

  target.owner_reply = {
    text_ja: params.text_ja.trim(),
    text_en: autoEn,
    chef_name: params.chef_name.trim() || `${target.place_name} オーナー`,
    replied_at: new Date().toISOString(),
  };

  saveEcosystemDb(db);
  return target;
}

export function upsertStoreOfficialDataInDb(params: {
  place_id: string;
  owner_id: string;
  owner_name: string;
  role_title?: string;
  verification_cert?: OwnerVerificationCertificate;
  chef_greeting_ja?: string;
  chef_greeting_en?: string;
  welcome_perk_ja?: string;
  welcome_perk_en?: string;
  live_status?: LiveKitchenStatus;
  kitchen_audit?: KitchenAudit;
  verified_menu?: MenuItem[];
  reservation_url?: string;
  custom_place_data?: Place;
}): StoreOfficialData {
  const db = getEcosystemDb();
  const existing = db.stores[params.place_id];

  const updated: StoreOfficialData = {
    place_id: params.place_id,
    is_official_verified: true,
    owner_id: params.owner_id,
    owner_name: params.owner_name,
    role_title: params.role_title ?? existing?.role_title ?? 'オーナーシェフ',
    verification_cert: params.verification_cert ?? existing?.verification_cert,
    chef_greeting_ja: params.chef_greeting_ja ?? existing?.chef_greeting_ja ?? '',
    chef_greeting_en: params.chef_greeting_en ?? existing?.chef_greeting_en ?? '',
    welcome_perk_ja: params.welcome_perk_ja ?? existing?.welcome_perk_ja,
    welcome_perk_en: params.welcome_perk_en ?? existing?.welcome_perk_en,
    live_status: params.live_status ?? existing?.live_status,
    kitchen_audit:
      params.kitchen_audit ??
      existing?.kitchen_audit ?? {
        dashi_type: '100_plant',
        fryer_oil: 'dedicated',
        cookware: 'dedicated',
        allium_free: 'customizable',
        gluten_free: 'gf_option',
        alcohol_free: 'alcohol_free',
        sugar_honey: 'no_bone_char_no_honey',
        payment_methods: ['Credit Card', 'PayPay / QR', 'Cash'],
        reservation_policy: 'walk_in_ok',
        english_support: 'english_menu',
      },
    verified_menu: params.verified_menu ?? existing?.verified_menu ?? [],
    reservation_url: params.reservation_url ?? existing?.reservation_url,
    custom_place_data: params.custom_place_data ?? existing?.custom_place_data,
    updated_at: new Date().toISOString(),
  };

  db.stores[params.place_id] = updated;

  if (params.custom_place_data) {
    const idx = db.custom_places.findIndex(
      (p) => p.google_place_id === params.custom_place_data!.google_place_id
    );
    if (idx >= 0) {
      db.custom_places[idx] = params.custom_place_data;
    } else {
      db.custom_places.unshift(params.custom_place_data);
    }
  }

  const partner = db.partners.find((p) => p.id === params.owner_id);
  if (partner && !partner.claimed_place_ids.includes(params.place_id)) {
    partner.claimed_place_ids.push(params.place_id);
  }

  saveEcosystemDb(db);
  return updated;
}

export function requestStoreVerificationOtp(params: {
  place_id: string;
  method: OwnerVerificationCertificate['method'];
  identifier: string;
  owner_name: string;
}): { otp_code: string; request: PendingVerificationRequest } {
  const db = getEcosystemDb();
  if (!db.pending_verifications) db.pending_verifications = {};

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const reqObj: PendingVerificationRequest = {
    place_id: params.place_id,
    method: params.method,
    identifier: params.identifier,
    otp_code: otpCode,
    owner_name: params.owner_name,
    created_at: new Date().toISOString(),
  };

  db.pending_verifications[params.place_id] = reqObj;
  saveEcosystemDb(db);
  return { otp_code: otpCode, request: reqObj };
}

export function confirmStoreVerificationOtp(params: {
  place_id: string;
  otp_code: string;
}): { ok: boolean; cert?: OwnerVerificationCertificate; error?: string } {
  const db = getEcosystemDb();
  const pending = db.pending_verifications?.[params.place_id];
  if (!pending) {
    return { ok: false, error: '認証リクエストが見つかりません。もう一度コードを発行してください。' };
  }
  if (pending.otp_code !== params.otp_code.trim()) {
    return { ok: false, error: '認証コード（6桁）が一致しません。' };
  }

  const methodLabels: Record<
    OwnerVerificationCertificate['method'],
    { ja: string; en: string }
  > = {
    instagram_official: {
      ja: `公式Instagram (${pending.identifier}) 認証コード照合済`,
      en: `Verified via Official Instagram (${pending.identifier})`,
    },
    phone_otp: {
      ja: `店舗登録電話番号 (${pending.identifier}) SMS/自動音声OTP照合済`,
      en: `Verified via Registered Store Phone OTP (${pending.identifier})`,
    },
    business_license: {
      ja: `保健所・飲食店営業許可証 (${pending.identifier}) 照合済`,
      en: `Verified via Restaurant Operating Permit (${pending.identifier})`,
    },
  };

  const cert: OwnerVerificationCertificate = {
    is_verified: true,
    method: pending.method,
    method_label_ja: methodLabels[pending.method].ja,
    method_label_en: methodLabels[pending.method].en,
    verified_identifier: pending.identifier,
    verified_at: new Date().toISOString(),
    certificate_id: `CERT-VGJP-${Math.floor(10000 + Math.random() * 90000)}`,
  };

  upsertStoreOfficialDataInDb({
    place_id: params.place_id,
    owner_id: `partner-${params.place_id}`,
    owner_name: pending.owner_name || '公式認定オーナー',
    verification_cert: cert,
  });

  delete db.pending_verifications![params.place_id];
  saveEcosystemDb(db);
  return { ok: true, cert };
}

export function registerOrAuthenticatePartner(params: {
  mode: 'login' | 'register';
  email: string;
  password: string;
  owner_name?: string;
  role_title?: string;
  claim_place_id?: string;
}): { ok: boolean; partner?: StorePartnerAccount; error?: string } {
  const db = getEcosystemDb();
  const normalizedEmail = params.email.trim().toLowerCase();

  if (params.mode === 'login') {
    const found = db.partners.find((p) => p.email.toLowerCase() === normalizedEmail);
    if (!found) {
      return {
        ok: false,
        error: '該当するメールアドレスの店舗アカウントが見つかりません。新規登録タブからご登録ください。',
      };
    }
    return { ok: true, partner: found };
  }

  let partner = db.partners.find((p) => p.email.toLowerCase() === normalizedEmail);
  if (!partner) {
    partner = {
      id: `partner-${Date.now()}`,
      email: normalizedEmail,
      password_hash: params.password || 'vegan2026',
      owner_name: params.owner_name?.trim() || '店舗オーナー',
      role_title: params.role_title?.trim() || 'オーナーシェフ / 店長',
      claimed_place_ids: params.claim_place_id ? [params.claim_place_id] : [],
      created_at: new Date().toISOString(),
    };
    db.partners.push(partner);
  } else if (
    params.claim_place_id &&
    !partner.claimed_place_ids.includes(params.claim_place_id)
  ) {
    partner.claimed_place_ids.push(params.claim_place_id);
  }

  saveEcosystemDb(db);
  return { ok: true, partner };
}
