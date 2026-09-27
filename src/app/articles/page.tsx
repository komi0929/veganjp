import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import type { CuratedArticle } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getArticles(): Promise<CuratedArticle[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('curated_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return (data as CuratedArticle[]) || [];
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-bark-800 bg-noise">
      {/* Editorial Header */}
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-8 border-b border-soil-200/60">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-vegan-700 hover:text-vegan-800 transition-colors mb-6 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Hakoniwa Map
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-vegan-600 mb-2 block">
              Curated Community Anthologies
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-bark-900 tracking-tight leading-tight">
              Plant-Based Japan
            </h1>
          </div>
          <p className="text-sm text-bark-600 max-w-xs leading-relaxed">
            Authentic, ad-free photo guides documented by conscious travelers across Japan.
          </p>
        </div>
      </header>

      {/* Guide List */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {articles.length === 0 ? (
          <div className="text-center py-24 bg-white/60 rounded-3xl border border-soil-200/60 shadow-clay-sm p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-vegan-100 flex items-center justify-center text-2xl shadow-inner">
              🌱
            </div>
            <h3 className="text-xl font-serif font-bold text-bark-900 mb-2">Guides are sprouting</h3>
            <p className="text-sm text-bark-600 max-w-sm mx-auto mb-6 leading-relaxed">
              Every Monday, our community photos are curated into regional guides. Pin your favorite restaurant on the map to contribute!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-vegan-600 hover:bg-vegan-700 text-white text-xs font-semibold px-5 py-3 rounded-full shadow-clay-sm transition-all hover:scale-105"
            >
              Explore the Map 🗺️
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group bg-white p-7 rounded-3xl border border-stone-200/70 shadow-polaroid hover:shadow-clay-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-vegan-700 bg-vegan-100 px-2.5 py-0.5 rounded-full">
                      {article.area}
                    </span>
                    <span className="text-[11px] text-bark-600/50 font-mono">
                      {new Date(article.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-bark-900 group-hover:text-vegan-700 transition-colors leading-snug">
                    {article.title}
                  </h2>
                </div>
                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-vegan-700">
                  <span>Read field guide</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
