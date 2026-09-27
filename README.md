# 🌱 vegan.jp

**Interactive Vegan Map & Photo Community in Japan**

A map-based photo sharing community for vegan travelers visiting Japan. No sign-up required — snap a photo, pin it on the map, and help fellow travelers discover plant-based food.

## Features

- **🗺️ Map-First Discovery** — Full-screen Google Maps with custom “hakoniwa” (miniature garden) styling
- **📸 No-Login Upload** — Share photos in seconds without creating an account
- **🌿 Plant Markers** — Organic, clay-morphism markers that grow as more photos are shared
- **📝 Curated Guides** — Auto-generated area guides at `/articles`
- **📱 PWA Ready** — Add to Home Screen for native app-like experience

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Maps | Google Maps via @vis.gl/react-google-maps |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (with client-side WebP compression) |
| Hosting | Vercel |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/vegan.jp.git
cd vegan.jp
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Set up Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API** and **Places API**
3. Create an API key (restrict to Maps JS API + Places API)
4. Create a **Map ID** (Settings > Map Management > Create Map ID)
   - Name: `vegan-jp-map`
   - Map type: JavaScript

### 4. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
CRON_SECRET=your-random-secret-string
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy — done!

The cron job (`/api/cron/curate`) runs automatically every Monday at 3 AM UTC.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + SEO meta
│   ├── page.tsx            # Map page
│   ├── not-found.tsx       # Custom 404
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # Robots.txt
│   ├── manifest.ts         # PWA manifest
│   ├── articles/           # Curated guides
│   └── api/cron/curate/    # Article generation cron
├── components/
│   ├── MapView.tsx         # Main map + hakoniwa styling
│   ├── PlantMarker.tsx     # Clay-morphism plant pins
│   ├── BottomSheet.tsx     # Photo album sheet
│   ├── UploadModal.tsx     # Photo upload flow
│   └── PlaceSearch.tsx     # Places autocomplete
└── lib/
    ├── supabase.ts         # Supabase client
    ├── compress-image.ts   # Client-side WebP compression
    ├── local-posts.ts      # localStorage tracking
    └── types.ts            # TypeScript interfaces
```

## Cost

**$0/month** on all free tiers:

| Service | Free Tier |
|---------|----------|
| Vercel | Hobby (free) |
| Supabase | 500MB DB + 1GB Storage |
| Google Maps | $200/month credit |

Client-side image compression (WebP, 1200px max) keeps photos at ~150KB each, allowing ~5,000-10,000 photos within the 1GB free storage.

## License

MIT
