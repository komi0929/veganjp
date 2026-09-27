import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 30;

const AREAS = [
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, radius: 0.3 },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, radius: 0.3 },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681, radius: 0.2 },
  { name: 'Fukuoka', lat: 33.5904, lng: 130.4017, radius: 0.3 },
  { name: 'Nagoya', lat: 35.1815, lng: 136.9066, radius: 0.3 },
  { name: 'Yokohama', lat: 35.4437, lng: 139.638, radius: 0.2 },
  { name: 'Sapporo', lat: 43.0618, lng: 141.3545, radius: 0.3 },
  { name: 'Okinawa', lat: 26.3344, lng: 127.8056, radius: 0.5 },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Template-based article generator — ZERO external API calls.
 *
 * Aggregates community posts by area and generates structured SEO
 * articles from templates. No LLM token cost whatsoever.
 *
 * For higher-quality, hand-crafted articles, ask Antigravity directly:
 *   "vegan.jp の東京エリアの記事を生成して"
 */
function generateArticleMarkdown(
  areaName: string,
  places: { name: string; google_place_id: string }[],
  posts: { google_place_id: string; image_url: string; short_text: string; created_at: string }[]
): string {
  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const placeEntries = places
    .map((place) => {
      const placePosts = posts.filter((p) => p.google_place_id === place.google_place_id);
      if (placePosts.length === 0) return null;

      const reviews = placePosts
        .filter((p) => p.short_text && p.short_text.trim() !== '')
        .map((p) => `> "${p.short_text}"`)
        .slice(0, 3);

      const photoSection = placePosts
        .slice(0, 2)
        .map((p) => `![Photo at ${place.name}](${p.image_url})`)
        .join('\n\n');

      return `## ${place.name}

**${placePosts.length} photo${placePosts.length !== 1 ? 's' : ''}** shared by the vegan.jp community.

${photoSection}

${reviews.length > 0 ? `### What travelers are saying\n\n${reviews.join('\n\n')}\n` : ''}
📍 Find it on the [vegan.jp map](/) — tap the photo pin to see all community photos.
`;
    })
    .filter(Boolean)
    .join('\n---\n\n');

  return `# ${areaName} Vegan Photo Map — ${monthYear}

Your community-powered guide to plant-based dining in **${areaName}**, Japan. Every restaurant listed here has been visited and photographed by real vegan travelers — no sponsored content, no ads, just honest photos and first-hand reviews.

**${places.length} restaurants** · **${posts.length} photos** shared by the community

---

${placeEntries}

---

## 🌱 Help grow this guide

Visited a vegan-friendly spot in ${areaName}? **Share your photo in seconds** — no sign-up required. Just tap the green **+** button on the [vegan.jp map](/) and pin your photo.

Every photo you share helps the next vegan traveler discover something delicious.
`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const results: string[] = [];

  for (const area of AREAS) {
    const { data: places } = await supabase
      .from('places')
      .select('google_place_id, name, lat, lng')
      .gte('lat', area.lat - area.radius)
      .lte('lat', area.lat + area.radius)
      .gte('lng', area.lng - area.radius)
      .lte('lng', area.lng + area.radius);

    if (!places || places.length === 0) continue;

    const placeIds = places.map((p) => p.google_place_id);
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .in('google_place_id', placeIds)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!posts || posts.length < 2) continue;

    const markdown = generateArticleMarkdown(area.name, places, posts);
    const title = `${area.name} Vegan Photo Map`;
    const slug = slugify(title) + '-' + new Date().toISOString().slice(0, 7);

    const { error } = await supabase.from('curated_articles').upsert(
      {
        title,
        slug,
        area: area.name,
        content_markdown: markdown,
      },
      { onConflict: 'slug' }
    );

    if (!error) {
      results.push(`Generated: ${title}`);
    }
  }

  return NextResponse.json({
    ok: true,
    generated: results.length,
    articles: results,
  });
}
