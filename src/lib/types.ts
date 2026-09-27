export interface Place {
  id: string;
  google_place_id: string;
  name: string;
  lat: number;
  lng: number;
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
