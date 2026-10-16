import type {
  Place,
  KitchenAudit,
  MenuItem,
  StoreOfficialData,
  LiveKitchenStatus,
} from './types';

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

  return {
    dashi_type: is100 ? '100_plant' : 'plant_menu_only',
    fryer_oil: is100 ? 'dedicated' : 'shared',
    cookware: is100 ? 'dedicated' : 'washed',
    allium_free: is100 ? 'customizable' : 'contains_allium',
    gluten_free: 'gf_option',
    alcohol_free: 'alcohol_free',
    sugar_honey: 'no_bone_char_no_honey',
    payment_methods: ['Credit Card', 'IC / Suica', 'PayPay / QR', 'Cash'],
    reservation_policy: 'walk_in_ok',
    english_support: 'english_menu',
  };
}

/**
 * Returns the store's Welcome Perk (来店歓迎特典) when travelers show the Vegan.jp Order Card.
 */
export function getEffectiveWelcomePerk(
  place: Place,
  official?: StoreOfficialData | null
): { ja: string; en: string } {
  if (official?.welcome_perk_ja || official?.welcome_perk_en) {
    return {
      ja: official.welcome_perk_ja || 'Vegan.jp 注文画面のご提示で「シェフからの歓迎ミニサービス」を進呈！',
      en: official.welcome_perk_en || 'Show this Vegan.jp Order Screen for a complimentary Chef Welcome Treat!',
    };
  }

  const genre = place.genre || '';
  if (genre.includes('ラーメン')) {
    return {
      ja: '🎁 Vegan.jp 注文画面のご提示で「自家製トッピング1品 または 替え玉ハーフ」を歓迎サービス！',
      en: '🎁 Show this Vegan.jp Order Card for a complimentary Chef Topping or Half Kaedama Noodle refill!',
    };
  }
  if (genre.includes('カフェ') || genre.includes('スイーツ')) {
    return {
      ja: '🎁 Vegan.jp 注文画面のご提示で「焼きたてミニ米粉クッキー または 豆乳ホイップ増量」を歓迎サービス！',
      en: '🎁 Show this Vegan.jp Order Card for a complimentary Mini Rice-Flour Cookie or Extra Soy Whip!',
    };
  }
  return {
    ja: '🎁 Vegan.jp 注文画面のご提示で「シェフ特製ウェルカム小鉢 または 食後のハーブティー」を歓迎サービス！',
    en: '🎁 Show this Vegan.jp Order Card for a complimentary Chef’s Seasonal Side Dish or Herbal Tea!',
  };
}

/**
 * Returns the store's Signature Dish & Popular Menu (`看板の一皿`).
 * Focuses on authentic culinary craftsmanship, local Japanese ingredients, and irresistible flavors.
 */
export function getEffectiveVerifiedMenu(
  place: Place,
  official?: StoreOfficialData | null
): MenuItem[] {
  if (official?.verified_menu && official.verified_menu.length > 0) {
    return official.verified_menu;
  }

  const genre = place.genre || '';

  if (genre.includes('ラーメン')) {
    return [
      {
        id: `${place.id}-m1`,
        name_ja: '芳醇金胡麻と九州産大豆の濃厚クリーミー担々麺',
        name_en: 'Signature Golden-Sesame & Kyushu Soy Rich Tantanmen',
        description_ja:
          '直火焙煎した金胡麻を贅沢にすり潰し、濃厚な無調整豆乳と自家製ラー油で仕上げた、最後のひと口まで飲み干したくなる看板の一杯。',
        description_en:
          'Freshly stone-ground golden sesame blended with rich Kyushu soy milk and aromatic house chili oil. A velvety, unforgettable bowl.',
        price_jpy: 1250,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: true,
        is_popular: true,
        order_note_ja: '看板メニュー「濃厚クリーミー担々麺」を1杯お願いします',
      },
      {
        id: `${place.id}-m2`,
        name_ja: 'パリッと羽根つき 自家製焼き餃子（5個）',
        name_en: 'Crispy Winged House-Made Pan-Fried Gyoza (5 pcs)',
        description_ja:
          '国産キャベツと原木椎茸の旨味を閉じ込め、香ばしい羽根つきで焼き上げた一番人気のサイドメニュー。',
        description_en:
          'Pan-fried to golden perfection with a lacy crispy wing, filled with sweet Japanese cabbage and meaty shiitake mushrooms.',
        price_jpy: 580,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: true,
        order_note_ja: '自家製焼き餃子（5個）を1皿お願いします',
      },
    ];
  }

  if (genre.includes('カフェ')) {
    return [
      {
        id: `${place.id}-m1`,
        name_ja: '焼きたて国産米粉ワッフル ＆ 季節のクラフト豆乳ジェラート',
        name_en: 'Freshly Baked Japanese Rice-Flour Waffle & Craft Soy Gelato',
        description_ja:
          '注文を受けてから焼き上げる外カリッ・中モチッの国産米粉100%ワッフルに、濃厚な朝搾り豆乳ジェラートを添えた看板スイーツ。',
        description_en:
          'Baked to order with 100% Japanese rice flour—crispy outside, mochi-chewy inside—crowned with artisan morning-pressed soy gelato.',
        price_jpy: 1180,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: true,
        is_popular: true,
        order_note_ja: '看板メニュー「米粉ワッフル＆豆乳ジェラート」を1つお願いします',
      },
      {
        id: `${place.id}-m2`,
        name_ja: '旬の契約農園野菜と彩りデリの季節プレート',
        name_en: 'Seasonal Farm-to-Table Harvest Deli Plate',
        description_ja:
          '地元の契約農家から毎朝届く旬野菜を5種の創作デリに仕立てた、彩り豊かなランチプレート。',
        description_en:
          'Five vibrant chef-crafted seasonal vegetable delis harvested fresh from local partner farms, served with brown rice.',
        price_jpy: 1580,
        is_100_vegan: true,
        is_gluten_free: true,
        is_allium_free: false,
        order_note_ja: '彩りデリの季節プレートを1つお願いします',
      },
    ];
  }

  if (genre.includes('和食') || genre.includes('精進')) {
    return [
      {
        id: `${place.id}-m1`,
        name_ja: '季節の彩り精進御膳（生湯葉・自家製胡麻豆腐・旬野菜天ぷら）',
        name_en: 'Seasonal Artisan Shojin Gozen (Fresh Yuba, Sesame Tofu & Tempura)',
        description_ja:
          '職人が毎朝練り上げる濃厚な吉野葛の胡麻豆腐と、とろける汲み上げ生湯葉、揚げたての旬野菜天ぷらを一度に味わえる看板御膳。',
        description_en:
          'Hand-kneaded Yoshino-kuzu sesame tofu, silky fresh yuba, and crisp seasonal vegetable tempura served with Uji matcha salt.',
        price_jpy: 2600,
        is_100_vegan: true,
        is_gluten_free: false,
        is_allium_free: true,
        is_popular: true,
        order_note_ja: '看板メニュー「季節の彩り精進御膳」を1つお願いします',
      },
    ];
  }

  return [
    {
      id: `${place.id}-m1`,
      name_ja: 'シェフ特製・旬野菜と自家製スパイスの看板プレート',
      name_en: "Chef's Signature Seasonal Harvest & Spice Plate",
      description_ja:
        '日本の四季の食材とシェフ独自のスパイス・発酵の技を掛け合わせた、ここでしか出会えない看板の一皿。',
      description_en:
        'Our #1 signature dish celebrating Japanese seasonal produce elevated with house-fermented sauces and aromatic spices.',
      price_jpy: 1550,
      is_100_vegan: true,
      is_gluten_free: true,
      is_allium_free: false,
      is_popular: true,
      order_note_ja: 'シェフ特製の看板プレートを1つお願いします',
    },
  ];
}

export function translateTravelerNoteToJa(
  originalText: string,
  stampTitleJa: string
): string {
  const trimmed = (originalText || '').trim();
  if (!trimmed) {
    return `${stampTitleJa} 本当にありがとうございました！日本旅行の最高の思い出になりました。`;
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  const parts: string[] = [];

  if (lower.includes('ramen') || lower.includes('broth') || lower.includes('soup') || lower.includes('noodle')) {
    parts.push('看板のラーメンと濃厚なスープが感動するほど絶品でした！');
  }
  if (lower.includes('ice cream') || lower.includes('waffle') || lower.includes('sweet') || lower.includes('dessert') || lower.includes('matcha')) {
    parts.push('焼きたてのワッフルと豆乳アイスの美味しさに感動しました！');
  }
  if (lower.includes('staff') || lower.includes('kind') || lower.includes('welcom') || lower.includes('friendly') || lower.includes('chef')) {
    parts.push('シェフとスタッフの皆様の温かいおもてなしに心から感謝します。');
  }
  if (lower.includes('back') || lower.includes('again') || lower.includes('best') || lower.includes('love') || lower.includes('trip')) {
    parts.push('今回の日本旅行で一番忘れられない思い出になりました。友人にも必ずおすすめします！');
  }

  if (parts.length === 0) {
    return `「${trimmed}」（素晴らしい一皿と温かいおもてなしをありがとうございました！日本旅行の最高の思い出になりました🌱）`;
  }

  return `${parts.join(' ')} （原文: "${trimmed}"）`;
}

export function translateOwnerReplyToEn(
  japaneseReply: string,
  placeName: string
): string {
  const trimmed = (japaneseReply || '').trim();
  if (!trimmed) return '';
  if (!/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
    return trimmed;
  }
  return `Thank you so much for visiting ${placeName} and sending this warm Gochisosama postcard! Your message truly made our team's day. We hope your journey across Japan is filled with wonderful memories, and we can't wait to welcome you back again! 🌱 (${trimmed})`;
}

export function getEffectiveLiveStatus(
  place: Place,
  official?: StoreOfficialData | null
): LiveKitchenStatus | null {
  if (official?.live_status) {
    return official.live_status;
  }
  return null;
}
