import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">🌿</div>
      <h1 className="text-3xl font-extrabold text-bark-800 mb-2">Page not found</h1>
      <p className="text-bark-700/50 mb-8 max-w-md">
        This path doesn't lead to any vegan spot... yet!
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-vegan-500 hover:bg-vegan-600 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-md"
      >
        🗺️ Back to the Map
      </Link>
    </div>
  );
}
