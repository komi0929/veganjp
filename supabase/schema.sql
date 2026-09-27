-- =============================================================
-- vegan.jp — Supabase Schema with Anonymous RLS Policies
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------
-- 1. Places table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS places (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_places_google_place_id ON places(google_place_id);
CREATE INDEX IF NOT EXISTS idx_places_location ON places(lat, lng);

-- Enable RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Allow anonymous SELECT
CREATE POLICY "places_anon_select"
  ON places FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous INSERT
CREATE POLICY "places_anon_insert"
  ON places FOR INSERT
  TO anon
  WITH CHECK (true);

-- -------------------------------------------
-- 2. Posts table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  google_place_id   TEXT NOT NULL REFERENCES places(google_place_id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  short_text        TEXT DEFAULT '' CHECK (char_length(short_text) <= 140),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_google_place_id ON posts(google_place_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous SELECT
CREATE POLICY "posts_anon_select"
  ON posts FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous INSERT
CREATE POLICY "posts_anon_insert"
  ON posts FOR INSERT
  TO anon
  WITH CHECK (true);

-- -------------------------------------------
-- 3. Curated articles table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS curated_articles (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  area              TEXT NOT NULL DEFAULT '',
  content_markdown  TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_curated_articles_slug ON curated_articles(slug);
CREATE INDEX IF NOT EXISTS idx_curated_articles_area ON curated_articles(area);

-- Enable RLS
ALTER TABLE curated_articles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous SELECT (articles are public)
CREATE POLICY "curated_articles_anon_select"
  ON curated_articles FOR SELECT
  TO anon
  USING (true);

-- -------------------------------------------
-- 4. Storage bucket for post images
-- -------------------------------------------
-- Run these in the Supabase Dashboard > SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous upload to post-images bucket
CREATE POLICY "post_images_anon_insert"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'post-images');

-- Allow public read from post-images bucket
CREATE POLICY "post_images_anon_select"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'post-images');
