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
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-slate-900 mt-8 mb-3 tracking-tight">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mt-12 mb-4 tracking-tight border-b border-slate-100 pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-slate-700">$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-8 rounded-2xl overflow-hidden border border-black/[0.06] bg-slate-100 shadow-sm"><img src="$2" alt="$1" class="w-full object-cover max-h-[460px]" loading="lazy" /></div>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-botanical-700 font-semibold underline underline-offset-4 decoration-botanical-300 hover:decoration-botanical-600 transition-colors">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-slate-600 leading-relaxed text-sm">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="my-6 border-l-2 border-botanical-500 pl-4 italic text-slate-600 text-base leading-relaxed bg-botanical-50/50 py-3 rounded-r-xl">$1</blockquote>')
    .replace(/^(?!<[hlab-z]|<div)(\S.+)$/gm, '<p class="text-slate-600 leading-relaxed text-sm sm:text-base mb-4 font-sans">$1</p>');
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) return notFound();

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-slate-900">
      <nav className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← Back to Guides
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-4 pb-16">
        <header className="mb-8 pb-6 border-b border-black/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-botanical-700 bg-botanical-50 px-2.5 py-0.5 rounded-full border border-botanical-200/60">
              {article.area} Guide
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {new Date(article.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>
        </header>

        <div
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content_markdown) }}
        />
      </article>

      <footer className="max-w-3xl mx-auto px-6 py-12 border-t border-black/[0.06] text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-botanical-900 text-white text-xs font-bold px-5 py-3 rounded-full shadow-sm transition-colors"
        >
          Explore Interactive Map 🗺️
        </Link>
      </footer>
    </div>
  );
}
