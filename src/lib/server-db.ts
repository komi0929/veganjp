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
        '創業100年「荒木豆腐店」の朝搾り濃厚豆乳を使った、乳・卵・小麦・白砂糖不使用の100%植物性クラフトアイス＆焼きたて米粉ワッフル専門店です。海外からのゲストも指差し注文で安心してご利用いただけます🌱',
      chef_greeting_en:
        'Welcome to SoyStories Yakuin! Every single scoop of our craft ice cream and freshly baked rice-flour waffle is 100% plant-based, gluten-free, and refined-sugar-free, crafted with fresh morning soy milk from a 100-year-old Fukuoka tofu master.',
      live_status: {
        status: 'open_available',
        message_ja:
          '🟢 本日営業中！朝搾り豆乳の「濃厚ピスタチオ」「八女抹茶」「あまおう苺」全フレーバー揃っています。イートイン席すぐご案内可能です🍨',
        message_en:
          '🟢 Open Now! Freshly churned Pistachio, Yame Matcha & Fukuoka Amaou Strawberry soy craft ice cream & hot rice-flour waffles ready. Walk-in seats available! 🍨',
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
            '荒木豆腐店の濃厚豆乳アイス2種（八女抹茶・ピスタチオ・リッチカカオ等）を、注文後に焼き上げるサクもち食感の国産米粉100%ワッフルと共に。乳・卵・小麦・白砂糖完全不使用。',
          description_en:
            'Choose any 2 artisan soy milk ice cream flavors served in a warm, crispy-chewy 100% Japanese rice-flour waffle bowl. Zero dairy, zero eggs, zero wheat, zero refined sugar.',
          price_jpy: 980,
          is_100_vegan: true,
          is_gluten_free: true,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: 'クラフトアイス ダブル（米粉ワッフルボウル）を1つお願いします',
        },
        {
          id: 'ss-menu-2',
          name_ja: '福岡・八女抹茶＆黒蜜きな粉の豆乳パフェ（グルテンフリー）',
          name_en: 'Fukuoka Yame Matcha & Kinako Kuromitsu Soy Parfait (GF)',
          description_ja:
            '福岡県産・星野村の香り高い八女抹茶アイスに、自家製米粉グラノーラ・白玉・黒蜜を重ねた和パフェ。',
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
        {
          id: 'ss-menu-4',
          name_ja: '朝搾り濃厚ソイラテ（ホット / アイス）',
          name_en: 'Freshly-Pressed Rich Soy Latte (Hot / Iced)',
          description_ja:
            '豆腐店直送の濃厚無調整豆乳とスペシャルティエスプレッソを合わせた、甘み際立つ看板ラテ。',
          description_en:
            'Specialty espresso paired with ultra-rich morning-pressed soy milk from Araki Tofu Shop.',
          price_jpy: 620,
          is_100_vegan: true,
          is_gluten_free: true,
          is_allium_free: true,
          order_note_ja: '濃厚ソイラテを1つお願いします',
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
        '当店は五葷（ねぎ・にんにく等）も動物性・魚介出汁も一切使わない100%植物性のラーメン専門店です。オリエンタルヴィーガンの方やグルテンフリーご希望の方も安心してスープの最後の一滴までお楽しみください！',
      chef_greeting_en:
        '100% Plant-Based & Oriental Vegan (Allium-Free) Ramen specialty shop in Hirao, Fukuoka. Zero meat, zero fish dashi, zero garlic/onions, and gluten-free rice noodles available!',
      live_status: {
        status: 'open_available',
        message_ja:
          '🟢 本日ランチ・ディナーとも営業！人気の「豆乳とんこつ風ラーメン」と「植物性焼き餃子」仕込み万全です🍜',
        message_en:
          '🟢 Open today for Lunch & Dinner! Our signature Soy-Tonkotsu Ramen and Crispy Vegan Gyoza are freshly prepped and ready 🍜',
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
          name_ja: '博多ヴィーガン豆乳とんこつ風ラーメン（五葷不使用）',
          name_en: 'Hakata Vegan Soy-Tonkotsu Style Ramen (Allium-Free)',
          description_ja:
            '動物性・魚介出汁・五葷を一切使わず、昆布と干し椎茸、濃厚豆乳で博多豚骨のコクを再現した看板の一杯。',
          description_en:
            'Rich, creamy Hakata-style broth crafted from kelp, shiitake, and soy milk. 100% vegan and free of garlic/onion.',
          price_jpy: 1150,
          is_100_vegan: true,
          is_gluten_free: false,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: '博多ヴィーガン豆乳とんこつ風ラーメンを1杯お願いします',
        },
        {
          id: 'yd-menu-2',
          name_ja: '五葷抜き・濃厚胡麻ヴィーガン担々麺',
          name_en: 'Rich Sesame Vegan Tantanmen (No Garlic / No Onion)',
          description_ja:
            '自家製焙煎胡麻ペーストと大豆ミートそぼろの旨辛担々麺。五葷不使用。',
          description_en:
            'House-roasted sesame broth with spiced soy meat mince. Completely vegan and allium-free.',
          price_jpy: 1280,
          is_100_vegan: true,
          is_gluten_free: false,
          is_allium_free: true,
          is_popular: true,
          order_note_ja: 'ヴィーガン担々麺（五葷抜き）を1杯お願いします',
        },
        {
          id: 'yd-menu-3',
          name_ja: 'グルテンフリー米粉麺への変更',
          name_en: 'Substitute with Gluten-Free Rice Noodles',
          description_ja: 'すべてのラーメンを＋200円で国産米粉100%グルテンフリー麺に変更可能。',
          description_en: 'Upgrade any ramen to 100% gluten-free rice noodles.',
          price_jpy: 200,
          is_100_vegan: true,
          is_gluten_free: true,
          is_allium_free: true,
          order_note_ja: '麺をグルテンフリー米粉麺に変更してください',
        },
        {
          id: 'yd-menu-4',
          name_ja: 'パリッと羽根つき 植物性ヴィーガン餃子（5個）',
          name_en: 'Crispy Winged Vegan Gyoza Dumplings (5 pcs)',
          description_ja: 'にんにく・ニラ・動物性ラード不使用でも驚くほどジューシーな特製焼き餃子。',
          description_en: 'Crispy pan-fried dumplings made without meat, lard, garlic, or chives.',
          price_jpy: 580,
          is_100_vegan: true,
          is_gluten_free: false,
          is_allium_free: true,
          order_note_ja: '植物性ヴィーガン餃子を1皿お願いします',
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
        '大阪・心斎橋エリアの100%植物性＆米粉麺対応ヴィーガンラーメン専門店です。世界中から訪れるヴィーガン旅行者の皆様に、本物の日本のラーメン体験をお届けします！',
      chef_greeting_en:
        'Osaka’s premier 100% dedicated vegan ramen shop! All broths are crafted from pure plant ingredients with gluten-free rice noodle options.',
      live_status: {
        status: 'open_available',
        message_ja: '🟢 本日11:30〜21:00通し営業中！米粉グルテンフリー麺も十分在庫ございます🍜',
        message_en: '🟢 Open all day 11:30–21:00! Gluten-free rice noodles and spicy miso broth fully stocked 🍜',
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
      stamp_emoji: '🍜',
      stamp_title_en: 'Mind-Blowing Delicious!',
      stamp_title_ja: '感動の美味しさ！',
      sender_name: 'Chloe & Sam',
      sender_country: 'Australia 🇦🇺',
      message_original:
        'Being both vegan and celiac (gluten-free), finding safe desserts in Japan was so hard until we found SoyStories! The freshly baked rice-flour waffle and pistachio soy ice cream blew our minds!',
      message_ja_translated:
        'ヴィーガンかつグルテンフリー（セリアック病）の私たちにとって、日本で安心して食べられるスイーツに出会えたのは奇跡のようでした！焼きたての米粉ワッフルとピスタチオ豆乳アイス、感動するほど美味しかったです！',
      ordered_dishes: [
        '濃厚豆乳クラフトアイス ダブル ＋ 焼きたて米粉ワッフルボウル',
        '福岡・八女抹茶＆黒蜜きな粉の豆乳パフェ（グルテンフリー）',
      ],
      owner_reply: {
        text_ja:
          'Chloeさん、Samさん、オーストラリアからのご来店本当にありがとうございました！当店は小麦も乳製品も工房内に一切持ち込まずお作りしているので、安心して笑顔で召し上がっていただけてスタッフ一同最高の励みになります🌱また福岡へお越しの際はぜひお立ち寄りください！',
        text_en:
          'Thank you so much for visiting us from Australia, Chloe & Sam! Since our kitchen is 100% free of wheat, dairy, and eggs, seeing you enjoy our freshly baked rice-flour waffles with complete peace of mind means the world to our whole team. We look forward to welcoming you back to Fukuoka! 🌱',
        chef_name: 'SoyStories 薬院 パティシエ・スタッフ一同',
        replied_at: '2026-10-15T11:30:00.000Z',
      },
      created_at: '2026-10-15T08:20:00.000Z',
    },
    {
      id: 'grat-seed-2',
      place_id: 'ChIJL8ZEXViRQTURgeN1wM_GJ6E',
      place_name: 'SoyStories（ソイストーリーズ）薬院',
      stamp: 'peace_of_mind',
      stamp_emoji: '🛡️',
      stamp_title_en: '100% Peace of Mind',
      stamp_title_ja: '安心して食べられました',
      sender_name: 'Mei-Ling (美玲)',
      sender_country: 'Taiwan 🇹🇼',
      message_original:
        'Point-and-order menu made ordering so easy! The Yame Matcha parfait with tofu-shop soy milk was rich yet refreshing. Thank you for creating such a kind vegan spot in Fukuoka!',
      message_ja_translated:
        '指差し注文メニューのおかげでとてもスムーズに注文できました！お豆腐屋さんの豆乳を使った八女抹茶パフェ、濃厚なのに後味すっきりで最高でした。福岡にこんなに優しいお店を作ってくださり感謝します！',
      ordered_dishes: ['福岡・八女抹茶＆黒蜜きな粉の豆乳パフェ（グルテンフリー）'],
      created_at: '2026-10-16T01:15:00.000Z',
    },
    {
      id: 'grat-seed-3',
      place_id: 'vegan-ramen-01',
      place_name: 'Vegan Ramen YADOKARI',
      stamp: 'saved_trip',
      stamp_emoji: '💚',
      stamp_title_en: 'You Saved My Trip!',
      stamp_title_ja: '日本旅行の救世主です！',
      sender_name: 'Lucas M.',
      sender_country: 'France 🇫🇷',
      message_original:
        'I was so worried about hidden fish dashi in ramen broths across Japan. Knowing YADOKARI is 100% plant-based and allium-free let me enjoy authentic Hakata tonkotsu-style ramen with zero anxiety!',
      message_ja_translated:
        '日本のラーメンには見えない魚介出汁が入っているのではないかとずっと不安でしたが、YADOKARIさんが100%植物性・五葷不使用だと分かり、心から安心して本場の博多とんこつ風ラーメンを堪能できました！',
      ordered_dishes: [
        '博多ヴィーガン豆乳とんこつ風ラーメン（五葷不使用）',
        'パリッと羽根つき 植物性ヴィーガン餃子（5個）',
      ],
      owner_reply: {
        text_ja:
          'Lucasさん、フランスからのご来店誠にありがとうございます！出汁の不安を忘れてスープまで完飲していただけたこと、ラーメン職人としてこれ以上の喜びはありません。またいつでも帰ってきてくださいね🍜',
        text_en:
          'Merci beaucoup for visiting from France, Lucas! As a ramen chef, nothing makes me happier than seeing you enjoy every last drop of broth without worrying about fish dashi. Come back anytime! 🍜',
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
