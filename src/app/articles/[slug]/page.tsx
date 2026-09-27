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
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-bark-800 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-bark-800 mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-extrabold text-bark-800 mt-10 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-bark-800 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-2xl my-6 w-full shadow-sm" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-vegan-600 hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-bark-700/70">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-vegan-300 pl-4 italic text-bark-700/60 my-4">$1</blockquote>')
    .replace(/^(?!<[hlab-z])(\S.+)$/gm, '<p class="text-bark-700/70 leading-relaxed mb-4">$1</p>');
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) return notFound();

  return (
    <div className="min-h-screen bg-cream-50 text-bark-800">
      <header className="px-6 py-8 border-b border-bark-800/8 max-w-3xl mx-auto">
        <Link href="/articles" className="text-vegan-600 text-sm hover:underline mb-2 inline-block">
          ← All Guides
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight mt-4">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 mt-4">
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
      </header>

      <article
        className="max-w-3xl mx-auto px-6 py-8"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content_markdown) }}
      />

      <footer className="max-w-3xl mx-auto px-6 py-12 border-t border-bark-800/8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-vegan-500 hover:bg-vegan-600 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-md"
        >
          Explore the Map 🗺️
        </Link>
      </footer>
    </div>
  );
}
