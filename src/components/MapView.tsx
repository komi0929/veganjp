'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { PlaceWithPosts } from '@/lib/types';
import BottomSheet from './BottomSheet';
import UploadModal from './UploadModal';
import PlantMarker from './PlantMarker';

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

/**
 * Hakoniwa Pastel Diorama Map Style
 */
const HAKONIWA_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f3ece0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a7d66' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fdfbf7' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#bdddd4' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6ea698' }] },

  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ece4d4' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0d6c2' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#e6dac4' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d5e6cb' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#688c52' }] },

  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#efe6d7' }] },
  { featureType: 'landscape.natural', elementType: 'geometry.fill', stylers: [{ color: '#e9e0cf' }] },
];

/**
 * Interactive Hakoniwa Diorama Canvas
 * Rendered when Google Maps API key is not yet configured or as an organic fallback
 */
function DioramaCanvas({
  places,
  onSelectPlace,
}: {
  places: PlaceWithPosts[];
  onSelectPlace: (place: PlaceWithPosts) => void;
}) {
  return (
    <div className="relative w-full h-full bg-[#f4ece1] overflow-hidden select-none diorama-grid">
      {/* Decorative Miniature Islands / Terrain patches */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 120 180 Q 220 120 380 200 T 640 260 T 900 190 Q 1100 240 1280 180" fill="none" stroke="#e0d4bf" strokeWidth="80" strokeLinecap="round" opacity="0.6" />
        <circle cx="280" cy="420" r="140" fill="#dcedc8" opacity="0.5" />
        <circle cx="720" cy="380" r="200" fill="#dcedc8" opacity="0.45" />
        <circle cx="1060" cy="520" r="160" fill="#dcedc8" opacity="0.5" />
      </svg>

      {/* Floating clouds drifting over the diorama */}
      <motion.div
        className="absolute w-48 h-20 bg-white/40 rounded-full blur-md pointer-events-none"
        style={{ top: '15%', left: '-10%' }}
        animate={{ x: ['0vw', '120vw'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-64 h-24 bg-white/30 rounded-full blur-lg pointer-events-none"
        style={{ top: '45%', left: '-20%' }}
        animate={{ x: ['0vw', '130vw'] }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear', delay: 15 }}
      />

      {/* Interactive Plant Markers placed on the miniature terrain */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        {places.map((place, idx) => {
          // Spread across canvas in an organic pattern around Japan's approximate geometry
          const positions = [
            { x: '0px', y: '0px' },      // Tokyo
            { x: '-160px', y: '80px' },  // Kyoto / Osaka
            { x: '-340px', y: '160px' }, // Fukuoka
            { x: '180px', y: '-140px' }, // Sendai
            { x: '280px', y: '-280px' }, // Sapporo
          ];
          const pos = positions[idx % positions.length];

          return (
            <div
              key={place.google_place_id}
              className="absolute z-10"
              style={{ transform: `translate(${pos.x}, ${pos.y})` }}
            >
              <PlantMarker
                count={place.posts.length}
                imageUrl={place.posts[0]?.image_url}
                onClick={() => onSelectPlace(place)}
              />
              {/* Place Name Tag */}
              <motion.div
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-clay-sm border border-stone-200/60 pointer-events-none whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs font-semibold text-bark-800">{place.name}</p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MapView() {
  const [places, setPlaces] = useState<PlaceWithPosts[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const hasValidKey = useMemo(() => apiKey && apiKey !== 'placeholder-google-maps-key', [apiKey]);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, place:places!inner(*)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (postsData && postsData.length > 0) {
      const placeMap = new globalThis.Map<string, PlaceWithPosts>();
      for (const post of postsData) {
        const place = post.place as any;
        const pid = place.google_place_id;
        if (!placeMap.has(pid)) {
          placeMap.set(pid, { ...place, posts: [] });
        }
        placeMap.get(pid)!.posts.push({
          id: post.id,
          google_place_id: post.google_place_id,
          image_url: post.image_url,
          short_text: post.short_text,
          created_at: post.created_at,
        });
      }
      setPlaces(Array.from(placeMap.values()));
    } else {
      // Fallback sample spot for immediate delight
      setPlaces([
        {
          id: 'sample-1',
          google_place_id: 'ChIJde22lE6LGGARWpW2_lQZ0w8',
          name: "T's TanTan Tokyo Station",
          lat: 35.6812,
          lng: 139.7671,
          created_at: new Date().toISOString(),
          posts: [
            {
              id: 'p-1',
              google_place_id: 'ChIJde22lE6LGGARWpW2_lQZ0w8',
              image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
              short_text: 'Golden Sesame DanDan Ramen! 100% plant-based comfort food 🌱🍜',
              created_at: new Date().toISOString(),
            },
          ],
        },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchPlaces();
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* ─── Map Layer: Google Maps or Hakoniwa Canvas Fallback ─── */}
      {hasValidKey ? (
        <APIProvider apiKey={apiKey} libraries={['places']}>
          <Map
            defaultCenter={JAPAN_CENTER}
            defaultZoom={6}
            gestureHandling="greedy"
            disableDefaultUI
            styles={HAKONIWA_STYLES}
            className="w-full h-full"
          >
            {places.map((place) => (
              <AdvancedMarker
                key={place.google_place_id}
                position={{ lat: place.lat, lng: place.lng }}
                onClick={() => setSelectedPlace(place)}
              >
                <PlantMarker
                  count={place.posts.length}
                  imageUrl={place.posts[0]?.image_url}
                />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      ) : (
        <DioramaCanvas
          places={places}
          onSelectPlace={(p) => setSelectedPlace(p)}
        />
      )}

      {/* ─── Editorial Brand Header ─── */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-5 flex items-center justify-between"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="bg-white/85 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-clay-sm border border-white/70">
            <h1 className="text-2xl font-serif font-black tracking-tight leading-none text-bark-900">
              vegan<span className="text-vegan-600 font-sans font-bold">.jp</span>
            </h1>
            <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-bark-600/50 mt-1">
              Hakoniwa Photo Community
            </p>
          </div>

          <Link
            href="/articles"
            className="hidden sm:inline-flex items-center gap-1.5 bg-white/85 hover:bg-white backdrop-blur-xl px-4 py-3 rounded-2xl shadow-clay-sm border border-white/70 text-xs font-semibold text-bark-800 transition-all hover:scale-105"
          >
            <span>📖 Curated Guides</span>
          </Link>
        </div>

        {/* Live Community Indicator */}
        <div className="pointer-events-auto bg-white/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-clay-sm border border-white/70 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-vegan-500 animate-pulse" />
          <span className="text-xs font-semibold text-bark-700">
            {places.length} {places.length === 1 ? 'garden blooming' : 'gardens blooming'}
          </span>
        </div>
      </motion.header>

      {/* ─── Claymorphic Planting Action Button (FAB) ─── */}
      <motion.button
        onClick={() => setShowUpload(true)}
        className="absolute bottom-8 right-6 z-30 group flex items-center gap-3"
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.2 }}
        aria-label="Plant a vegan memory"
      >
        <span className="hidden sm:inline-block bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-clay-sm text-xs font-bold text-bark-800 tracking-wide border border-white/80">
          Plant a spot 🌱
        </span>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-vegan-400 via-vegan-500 to-vegan-700 text-white flex items-center justify-center shadow-clay-md border border-white/40">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </motion.button>

      {/* ─── Bottom Sheet Album ─── */}
      <AnimatePresence>
        {selectedPlace && (
          <BottomSheet
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Upload Flow Modal ─── */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onComplete={handleUploadComplete}
          />
        )}
      </AnimatePresence>

      {/* ─── Loading Pill ─── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-clay-sm border border-stone-200 text-xs font-semibold text-bark-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className="animate-spin inline-block">🌱</span>
            Sprouting community gardens…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
