import MapView from '@/components/MapView';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="w-screen h-screen">
      <MapView />
    </main>
  );
}
