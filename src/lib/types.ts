export interface KitchenAudit {
  dashi_type: '100_plant' | 'plant_menu_only' | 'ask_staff';
  fryer_oil: 'dedicated' | 'shared' | 'no_fried';
  cookware: 'dedicated' | 'washed';
  allium_free: 'all_free' | 'customizable' | 'contains_allium';
  gluten_free: '100_gf' | 'gf_option' | 'contains_wheat';
  alcohol_free: 'alcohol_free' | 'option' | 'used';
  sugar_honey: 'no_bone_char_no_honey' | 'honey_free';
  payment_methods: string[];
  reservation_policy: 'walk_in_ok' | 'reservation_recommended' | 'reservation_required';
  english_support: 'english_menu_and_staff' | 'english_menu' | 'point_and_order';
}

export interface MenuItem {
  id: string;
  name_ja: string;
  name_en: string;
  description_ja: string;
  description_en: string;
  price_jpy: number;
  is_100_vegan: boolean;
  is_gluten_free: boolean;
  is_allium_free: boolean;
  is_popular?: boolean;
  order_note_ja?: string;
}

export interface LiveKitchenStatus {
  status: 'open_available' | 'busy_low_stock' | 'reservation_only' | 'closed_today';
  message_ja: string;
  message_en: string;
  updated_at: string;
}

export interface GratitudeOwnerReply {
  text_ja: string;
  text_en: string;
  chef_name: string;
  replied_at: string;
}

export interface GratitudeNote {
  id: string;
  place_id: string;
  place_name: string;
  stamp: 'saved_trip' | 'delicious' | 'hospitality' | 'peace_of_mind';
  stamp_emoji: string;
  stamp_title_en: string;
  stamp_title_ja: string;
  sender_name: string;
  sender_country: string;
  message_original: string;
  message_ja_translated: string;
  ordered_dishes?: string[];
  owner_reply?: GratitudeOwnerReply;
  created_at: string;
}

export interface OwnerVerificationCertificate {
  is_verified: boolean;
  method: 'instagram_official' | 'phone_otp' | 'business_license';
  method_label_ja: string;
  method_label_en: string;
  verified_identifier: string;
  verified_at: string;
  certificate_id: string;
}

export interface StorePartnerAccount {
  id: string;
  email: string;
  password_hash: string;
  owner_name: string;
  role_title: string;
  claimed_place_ids: string[];
  created_at: string;
}

export interface StoreOfficialData {
  place_id: string;
  is_official_verified: boolean;
  owner_id: string;
  owner_name: string;
  role_title?: string;
  verification_cert?: OwnerVerificationCertificate;
  chef_greeting_ja?: string;
  chef_greeting_en?: string;
  welcome_perk_ja?: string;
  welcome_perk_en?: string;
  live_status?: LiveKitchenStatus;
  kitchen_audit: KitchenAudit;
  verified_menu: MenuItem[];
  reservation_url?: string;
  custom_place_data?: Place;
  updated_at: string;
}

export interface Place {
  id: string;
  google_place_id: string;
  name: string;
  name_ja?: string;
  lat: number;
  lng: number;
  genre?: string;
  genre_en?: string;
  area?: string;
  area_en?: string;
  prefecture?: string;
  prefecture_en?: string;
  profile_text?: string;
  profile_text_en?: string;
  features?: string[];
  features_en?: string[];
  dietary_type?: '100%_vegan' | 'vegan_friendly';
  instagram_id?: string;
  instagram_url?: string;
  created_at: string;
}

export interface Post {
  id: string;
  google_place_id: string;
  image_url: string;
  short_text: string;
  created_at: string;
  place?: Place;
}

export interface CuratedArticle {
  id: string;
  title: string;
  slug: string;
  area: string;
  content_markdown: string;
  created_at: string;
}

export interface PlaceWithPosts extends Place {
  posts: Post[];
}
