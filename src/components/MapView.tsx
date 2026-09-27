'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { PlaceWithPosts } from '@/lib/types';
import BottomSheet from './BottomSheet';
import UploadModal from './UploadModal';
import PlantMarker from './PlantMarker';

const JAPAN_CENTER = { lat: 36.2, lng: 138.2 };

/* ────────────────────────────────────────────
 *  Hakoniwa (箱庭) Map Style
 *  Pastel diorama — sand, moss, jade water
 * ──────────────────────────────────────────── */
const HAKONIWA_STYLES = [
  /* base landscape — warm ivory sandbox */
  { elementType: 'geometry', stylers: [{ color: '#f0e8d8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9e9378' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0e3' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  /* water — jade miniature pond */
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#b8d8cc' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#88b4a4' }] },

  /* roads — barely-there cream paths */
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ece4d0' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2d8c2' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#e8dfc8' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#e4d8be' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d6cab0' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  /* parks — soft moss patches */
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#d4e2c6' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#88a870' }] },

  /* hide clutter — clean diorama surface */
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  /* admin borders — pencil-thin outlines */
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d8d0bc' }, { weight: 0.8 }],
  },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },

  /* buildings — soft warm clay blocks */
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#ede4d4' }] },
  { featureType: 'landscape.natural', elementType: 'geometry.fill', stylers: [{ color: '#e6dece' }] },
  { featureType: 'landscape.natural.terrain', elementType: 'geometry.fill', stylers: [{ color: '#e0d8c4' }] },
];

/* ─── Apply styles via useMap (works alongside mapId) ─── */
function HakoniwaStyler() {
  const map = useMap();
  useEffect(() => {
    if (map) {
      (map as any).setOptions({ styles: HAKONIWA_STYLES });
    }
  }, [map]);
  return null;
}

/* ═══════════════════════════════════════════
 *  MapView — 箱庭メインコンポーネント
 * ═══════════════════════════════════════════ */
export default function MapView() {
  const [places, setPlaces] = useState<PlaceWithPosts[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, place:places!inner(*)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (postsData) {
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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey} libraries={['places']}>
        <Map
          defaultCenter={JAPAN_CENTER}
          defaultZoom={6}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="vegan-jp-map"
          className="w-full h-full"
        />

        {/* Hakoniwa pastel styling */}
        <HakoniwaStyler />

        {/* Plant markers */}
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
      </APIProvider>

      {/* ─── Header ─── */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="px-4 pt-4">
          <div
            className="pointer-events-auto inline-block px-5 py-3"
            style={{
              background: 'linear-gradient(145deg, rgba(255,253,248,0.92), rgba(245,240,230,0.88))',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              boxShadow: `
                0 4px 12px rgba(80,60,20,0.08),
                0 1px 3px rgba(80,60,20,0.06),
                inset 1px 1px 2px rgba(255,255,255,0.6)
              `,
            }}
          >
            <h1 className="text-2xl font-extrabold tracking-tight leading-none">
              <span className="text-vegan-600">vegan</span>
              <span className="text-bark-800">.jp</span>
            </h1>
            <p className="text-[10px] text-bark-700/45 tracking-[0.15em] uppercase mt-0.5">
              Plant-based Japan — Photo Map
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── FAB Upload ─── */}
      <motion.button
        onClick={() => setShowUpload(true)}
        className="absolute bottom-8 right-6 z-20 w-16 h-16 flex items-center justify-center text-white"
        style={{
          background: 'linear-gradient(145deg, #6aae4a, #4e8e34)',
          borderRadius: '50%',
          boxShadow: `
            0 6px 20px rgba(74,142,52,0.3),
            0 2px 6px rgba(74,142,52,0.2),
            inset 2px 2px 4px rgba(255,255,255,0.25),
            inset -1px -1px 3px rgba(0,0,0,0.1)
          `,
        }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      {/* ─── Bottom Sheet ─── */}
      <AnimatePresence>
        {selectedPlace && (
          <BottomSheet
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Upload Modal ─── */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onComplete={handleUploadComplete}
          />
        )}
      </AnimatePresence>

      {/* ─── Loading ─── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 text-sm"
            style={{
              background: 'linear-gradient(145deg, rgba(255,253,248,0.95), rgba(245,240,230,0.92))',
              backdropFilter: 'blur(12px)',
              padding: '8px 18px',
              borderRadius: '20px',
              color: '#9e9378',
              boxShadow: `
                0 3px 10px rgba(80,60,20,0.07),
                inset 1px 1px 2px rgba(255,255,255,0.5)
              `,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              🌱
            </motion.span>
            Planting pins…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
