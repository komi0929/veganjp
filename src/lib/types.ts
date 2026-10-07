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
