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
    <div className="min-h-screen bg-cream-50 text-bark-800">
      <header className="px-6 py-8 border-b border-bark-800/8">
        <Link href="/" className="text-vegan-600 text-sm hover:underline mb-2 inline-block">
          ← Back to Map
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight mt-2">
          <span className="text-vegan-600">vegan</span>
          <span className="text-bark-800">.jp</span>
          <span className="text-bark-700/40 text-lg font-normal ml-3">Curated Guides</span>
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🌿</div>
            <p className="text-bark-700/40">
              No articles yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="block p-6 rounded-2xl bg-white hover:bg-vegan-50 border border-bark-800/5 hover:border-vegan-300 transition-all group shadow-sm hover:shadow-md"
              >
                <h2 className="text-xl font-bold text-bark-800 group-hover:text-vegan-700 transition-colors">
                  {article.title}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs bg-vegan-100 text-vegan-700 px-2.5 py-1 rounded-full font-medium">
                    {article.area}
                  </span>
                  <span className="text-xs text-bark-700/40">
                    {new Date(article.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
