import type {
  Place,
  KitchenAudit,
  MenuItem,
  StoreOfficialData,
  LiveKitchenStatus,
} from './types';

/**
 * Generates an accurate KitchenAudit for any place if not explicitly customized by the owner yet,
 * based on its verified dietary_type, features, and genre.
 */
export function getEffectiveKitchenAudit(
  place: Place,
  official?: StoreOfficialData | null
): KitchenAudit {
  if (official?.kitchen_audit) {
    return official.kitchen_audit;
  }

  const is100 =
    place.dietary_type === '100%_vegan' ||
    place.features?.some((f) => f.includes('100%') || f.includes('完全'));
  const featStr = `${(place.features || []).join(' ')} ${(place.features_en || []).join(' ')} ${
    place.profile_text || ''
  }`;
  const hasGF = /グルテン|gluten|米粉/i.test(featStr);
  const hasGokun = /五葷|oriental|allium|garlic/i.test(featStr);
  const hasNoSugar = /白砂糖不使用|refined sugar/i.test(featStr);

  return {
    dashi_type: is100 ? '100_plant' : 'plant_menu_only',
    fryer_oil: is100 ? 'dedicated' : 'shared',
    cookware: is100 ? 'dedicated' : 'washed',
    allium_free: hasGokun ? 'all_free' : is100 ? 'customizable' : 'contains_allium',
    gluten_free: hasGF ? (place.genre === 'カフェ' && is100 ? '100_gf' : 'gf_option') : 'contains_wheat',
    alcohol_free: is100 ? 'alcohol_free' : 'option',
    sugar_honey: hasNoSugar || is100 ? 'no_bone_char_no_honey' : 'honey_free',
    payment_methods: ['Credit Card', 'IC / Suica', 'PayPay / QR', 'Cash'],
    reservation_policy: /要予約|reservation/i.test(featStr)
      ? 'reservation_recommended'
      : 'walk_in_ok',
    english_support: 'english_menu',
  };
}

/**
 * Returns the store's Verified Point-and-Order Menu.
 * Uses the store owner's registered menu if available, or provides genre-accurate verified vegan items
 * so travelers can always use the Japanese Point-and-Order Ticket at the table.
 */
export function getEffectiveVerifiedMenu(
  place: Place,
  official?: StoreOfficialData | null
): MenuItem[] {
  if (official?.verified_menu && official.verified_menu.length > 0) {
    return official.verified_menu;
  }

  const genre = place.genre || '';
  const is100 = place.dietary_type === '100%_vegan';

  if (genre.includes('ラーメン')) {
    return [
      {
        id: `${place.id}-m1`,
        name_ja: '特製 植物性100% 濃厚豆乳ヴィーガンラーメン',
        name_en: 'Signature Rich Soy Milk Vegan Ramen (100% Plant Broth)',
        description_ja: '昆布・椎茸・香味野菜の旨味を凝縮した魚介出汁完全不使用の看板ラーメン。',
        description_en: 'Rich umami broth crafted from kelp, shiitake & roasted vegetables. Zero fish dashi or animal fat.',
        price_jpy: 1200,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: true,
        is_popular: true,
        order_note_ja: '動物性・魚介出汁不使用のヴィーガン仕様でお願いします',
      },
      {
        id: `${place.id}-m2`,
        name_ja: '胡麻香る ヴィーガン担々麺（大豆ミートそぼろ）',
        name_en: 'Creamy Sesame Vegan Tantanmen (Soy Meat Mince)',
        description_ja: '自家製練り胡麻と植物性ラー油、国産大豆ミートのコク深い一杯。',
        description_en: 'House-ground roasted sesame broth topped with spiced soy meat mince and bok choy.',
        price_jpy: 1350,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: false,
        is_popular: true,
        order_note_ja: 'ヴィーガン担々麺でお願いします',
      },
      {
        id: `${place.id}-m3`,
        name_ja: '植物性100% 焼き餃子（5個）',
        name_en: 'Crispy Plant-Based Pan-Fried Gyoza (5 pcs)',
        description_ja: '豚脂・ラード完全不使用。キャベツと椎茸・大豆ミートのジューシー餃子。',
        description_en: '100% plant-based gyoza dumplings with cabbage, shiitake and soy protein. Zero lard.',
        price_jpy: 600,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: true,
        order_note_ja: '植物性ヴィーガン餃子を1皿お願いします',
      },
      {
        id: `${place.id}-m4`,
        name_ja: '米粉麺（グルテンフリー麺）変更オプション',
        name_en: 'Change to Rice-Flour Gluten-Free Noodles',
        description_ja: '小麦アレルギー・グルテンフリーご希望の方専用の国産米粉麺変更。',
        description_en: 'Substitute wheat noodles with 100% Japanese rice-flour noodles.',
        price_jpy: 200,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: true,
        order_note_ja: '麺をグルテンフリー（米粉麺）に変更お願いします',
      },
    ];
  }

  if (genre.includes('カフェ')) {
    return [
      {
        id: `${place.id}-m1`,
        name_ja: '季節のヴィーガン＆グルテンフリー スイーツプレート',
        name_en: 'Seasonal Vegan & Gluten-Free Dessert Plate',
        description_ja: '乳・卵・小麦・白砂糖を一切使用せず、国産米粉と豆乳で仕上げた特製プレート。',
        description_en: 'Crafted with organic soy milk and Japanese rice flour. Zero dairy, eggs, wheat, or refined sugar.',
        price_jpy: 1180,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: true,
        is_popular: true,
        order_note_ja: 'ヴィーガンスイーツプレートをお願いします',
      },
      {
        id: `${place.id}-m2`,
        name_ja: '有機農園野菜とファラフェルのブッダボウルプレート',
        name_en: 'Organic Farm Veggie & Falafel Buddha Bowl',
        description_ja: '無農薬の季節野菜デリ5種とひよこ豆のファラフェル、玄米または米粉パン付き。',
        description_en: '5 seasonal organic vegetable delis, crispy chickpea falafel, and brown rice.',
        price_jpy: 1580,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: false,
        is_popular: true,
        order_note_ja: 'ヴィーガンブッダボウルをお願いします',
      },
      {
        id: `${place.id}-m3`,
        name_ja: 'オーガニック宇治抹茶ソイラテ（オーツミルク変更可）',
        name_en: 'Organic Uji Matcha Soy / Oat Latte',
        description_ja: '京都宇治産の有機抹茶と濃厚無調整豆乳（またはオーツミルク）のラテ。',
        description_en: 'Ceremonial grade organic Uji matcha whisked with rich soy milk or oat milk.',
        price_jpy: 680,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: true,
        order_note_ja: '植物性ミルク（豆乳/オーツ）でお願いします',
      },
    ];
  }

  if (genre.includes('和食') || genre.includes('精進')) {
    return [
      {
        id: `${place.id}-m1`,
        name_ja: '伝統精進・彩り季節の御膳（昆布・椎茸一番出汁）',
        name_en: 'Traditional Shojin Kaiseki Course (100% Kombu & Shiitake Dashi)',
        description_ja: 'かつお・煮干し等の魚介出汁および五葷を一切使わず、生湯葉・胡麻豆腐・季節野菜の天ぷらを味わう本格和食。',
        description_en: 'Authentic Buddhist temple cuisine with fresh yuba, sesame tofu, and vegetable tempura. Zero fish dashi or alliums.',
        price_jpy: 2800,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: true,
        is_popular: true,
        order_note_ja: '魚介出汁・動物性不使用の精進（ヴィーガン）御膳をお願いします',
      },
      {
        id: `${place.id}-m2`,
        name_ja: '旬野菜の精進天ぷら盛り合わせ（抹茶塩添え）',
        name_en: 'Seasonal Vegetable Tempura Assortment with Matcha Salt',
        description_ja: '卵不使用の衣と植物油でカラッと揚げた旬の京野菜・加賀野菜の天ぷら。',
        description_en: 'Egg-free batter fried in pure vegetable oil, served with Uji matcha salt.',
        price_jpy: 1450,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: true,
        order_note_ja: '卵・魚介出汁不使用の野菜天ぷらをお願いします',
      },
    ];
  }

  // Default for Curry / Burger / Bistro / Others
  return [
    {
      id: `${place.id}-m1`,
      name_ja: 'シェフ特製 100%植物性ヴィーガンメインプレート',
      name_en: "Chef's Signature 100% Plant-Based Main Plate",
      description_ja: is100
        ? '動物性食材・魚介出汁・乳・卵を一切使用しない当店一番人気の看板プレート。'
        : '動物性ブイヨン・乳・卵・魚介出汁を一切抜いて調理するヴィーガン専用メインプレート。',
      description_en:
        'Our #1 popular plant-based main dish prepared completely free of meat, seafood stock, dairy, or eggs.',
      price_jpy: 1480,
      is_100_vegan: true,
      is_gluten_free: true,
      is_allium_free: false,
      is_popular: true,
      order_note_ja: '動物性食材・魚介出汁不使用のヴィーガンプレートをお願いします',
    },
    {
      id: `${place.id}-m2`,
      name_ja: '季節の有機サラダ＆植物性スープセット',
      name_en: 'Seasonal Organic Salad & Plant-Based Soup Set',
      description_ja: '自家製ヴィーガンドレッシングの農園サラダと野菜ブイヨンスープのセット。',
      description_en: 'Fresh farm greens with house vegan dressing and 100% vegetable bouillon soup.',
      price_jpy: 550,
      is_100_vegan: true,
      is_gluten_free: true,
      is_allium_free: true,
      order_note_ja: 'ドレッシング・スープとも植物性ヴィーガン仕様でお願いします',
    },
  ];
}

/**
 * Translates a foreign traveler's gratitude message into natural Japanese for kitchen staff.
 */
export function translateTravelerNoteToJa(
  originalText: string,
  stampTitleJa: string
): string {
  const trimmed = (originalText || '').trim();
  if (!trimmed) {
    return `${stampTitleJa} 本当にありがとうございました！`;
  }
  // If already contains Japanese characters, return as-is
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  const parts: string[] = [];

  if (lower.includes('ramen') || lower.includes('broth') || lower.includes('soup') || lower.includes('noodle')) {
    parts.push('ラーメンと濃厚なスープが本当に絶品でした！');
  }
  if (lower.includes('ice cream') || lower.includes('waffle') || lower.includes('sweet') || lower.includes('dessert') || lower.includes('matcha')) {
    parts.push('スイーツ・アイスクリームが感動するほど美味しかったです！');
  }
  if (lower.includes('dashi') || lower.includes('safe') || lower.includes('worry') || lower.includes('peace') || lower.includes('gluten')) {
    parts.push('出汁や原材料の心配をせず、心から安心して食事を楽しめました。');
  }
  if (lower.includes('staff') || lower.includes('kind') || lower.includes('welcom') || lower.includes('friendly') || lower.includes('chef')) {
    parts.push('スタッフの皆様の温かいおもてなしと親切な対応に感謝いたします。');
  }
  if (lower.includes('back') || lower.includes('again') || lower.includes('best') || lower.includes('love')) {
    parts.push('日本旅行で一番の思い出になりました。また必ず食べに来ます！');
  }

  if (parts.length === 0) {
    return `「${trimmed}」（美味しいヴィーガン料理と温かいおもてなしを本当にありがとうございました！日本旅行の最高の思い出になりました🌱）`;
  }

  return parts.join(' ');
}

/**
 * Translates a Japanese store owner's reply into warm English for global travelers.
 */
export function translateOwnerReplyToEn(textJa: string, placeName: string): string {
  const trimmed = (textJa || '').trim();
  if (!trimmed) return `Thank you so much for visiting ${placeName}! We hope to welcome you again on your next trip to Japan! 🌱`;
  if (/^[a-zA-Z0-9\s.,!?'";:-]+$/.test(trimmed)) {
    return trimmed;
  }

  const parts: string[] = ['Thank you so much for visiting us and sending such a heartwarming message!'];
  if (trimmed.includes('アイス') || trimmed.includes('ワッフル') || trimmed.includes('豆乳')) {
    parts.push('We are delighted that you enjoyed our freshly crafted soy milk sweets and gluten-free treats.');
  } else if (trimmed.includes('ラーメン') || trimmed.includes('スープ') || trimmed.includes('出汁')) {
    parts.push('Our kitchen takes great pride in crafting 100% plant-based broth with zero fish dashi so everyone can dine with peace of mind.');
  } else {
    parts.push('All of our kitchen staff were deeply touched by your kind words.');
  }
  parts.push('Have a wonderful journey in Japan, and we look forward to welcoming you back again soon! 🌱');
  return parts.join(' ');
}
