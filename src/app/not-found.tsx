import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-botanical-50 border border-botanical-200/80 flex items-center justify-center text-botanical-700 text-2xl mb-6 shadow-sm">
        🌱
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-sm text-sm leading-relaxed">
        This trail hasn't been mapped yet. Return to the live interactive atlas to explore plant-based dining across Japan.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-botanical-900 text-white px-6 py-3 rounded-full text-xs font-bold tracking-wide transition-colors shadow-pill"
      >
        🗺️ Return to Interactive Map
      </Link>
    </div>
  );
}
