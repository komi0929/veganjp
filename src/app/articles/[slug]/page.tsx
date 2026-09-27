import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CuratedArticle } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getArticle(slug: string): Promise<CuratedArticle | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('curated_articles')
    .select('*')
    .eq('slug', slug)
    .single();
  return data as CuratedArticle | null;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-serif font-bold text-bark-900 mt-10 mb-3 tracking-tight">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-3xl font-serif font-bold text-bark-900 mt-14 mb-4 tracking-tight border-b border-soil-200/50 pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-4xl sm:text-5xl font-serif font-extrabold text-bark-900 mb-6 tracking-tight leading-tight">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-bark-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-bark-700">$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-8 rounded-3xl overflow-hidden shadow-polaroid border border-stone-200 bg-white p-2"><img src="$2" alt="$1" class="rounded-2xl w-full object-cover max-h-[500px]" loading="lazy" /></div>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-vegan-700 underline underline-offset-4 decoration-vegan-300 hover:decoration-vegan-600 transition-colors font-medium">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 list-disc text-bark-700 leading-relaxed">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="my-6 border-l-4 border-vegan-400 pl-5 italic text-bark-700/80 font-serif text-lg leading-relaxed bg-vegan-50/50 py-3 rounded-r-2xl">$1</blockquote>')
    .replace(/^(?!<[hlab-z]|<div)(\S.+)$/gm, '<p class="text-bark-700 leading-relaxed text-base mb-5 font-sans">$1</p>');
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) return notFound();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-bark-800 bg-noise">
      {/* Top Bar */}
      <nav className="max-w-3xl mx-auto px-6 pt-10 pb-4">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-vegan-700 hover:text-vegan-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Guides
        </Link>
      </nav>

      {/* Article Content Container */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <header className="mb-10 pb-8 border-b border-soil-200/60">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-vegan-700 bg-vegan-100 px-3 py-1 rounded-full border border-vegan-200">
              {article.area} Region
            </span>
            <span className="text-xs text-bark-600/50 font-mono">
              Published {new Date(article.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black text-bark-900 tracking-tight leading-[1.15]">
            {article.title}
          </h1>
        </header>

        {/* Prose Body */}
        <div
          className="prose prose-stone max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content_markdown) }}
        />
      </article>

      {/* Footer Call to Action */}
      <footer className="max-w-3xl mx-auto px-6 py-16 border-t border-soil-200/60 mt-12 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-clay-sm border border-stone-200/70">
          <h3 className="text-2xl font-serif font-bold text-bark-900 mb-2">
            Contribute to the Map
          </h3>
          <p className="text-sm text-bark-600 max-w-md mx-auto mb-6">
            Found an unforgettable plant-based dish in Japan? Pin your photo in seconds without an account.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-vegan-600 hover:bg-vegan-700 text-white text-sm font-semibold px-6 py-3.5 rounded-full shadow-clay-md transition-all hover:scale-105"
          >
            Open Interactive Map 🗺️
          </Link>
        </div>
      </footer>
    </div>
  );
}
