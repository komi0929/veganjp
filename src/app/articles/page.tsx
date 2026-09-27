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
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
      {/* Refined Navigation Bar */}
      <nav className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between border-b border-black/[0.04]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-tight text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Return to Interactive Map
        </Link>
        <span className="text-xs font-bold text-botanical-700 bg-botanical-50 px-2.5 py-1 rounded-full border border-botanical-200/60">
          Field Guides
        </span>
      </nav>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Plant-Based Japan Guides
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-lg leading-relaxed">
          Region-by-region community anthologies curated from traveler photo pins. Unbiased, unsponsored, and 100% plant-based.
        </p>
      </header>

      {/* Feed */}
      <main className="max-w-4xl mx-auto px-6 py-6 pb-20">
        {articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.04] p-8 shadow-sm">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-botanical-50 text-botanical-700 flex items-center justify-center text-lg">
              🌱
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Guides are Curating</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
              Every week, community photos are clustered into curated neighborhood food guides. Pin your favorite restaurant on the map to contribute!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-botanical-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-sm transition-colors"
            >
              Open Live Map ↗
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group bg-white p-6 rounded-3xl border border-black/[0.04] shadow-sm hover:shadow-photo-card transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-botanical-700 bg-botanical-50 px-2 py-0.5 rounded-md">
                      {article.area}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(article.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-botanical-700 transition-colors leading-snug">
                    {article.title}
                  </h2>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-slate-900">
                  <span>Explore article</span>
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
