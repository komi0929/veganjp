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
import OnboardingModal from './OnboardingModal';

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

/**
 * Ultra-clean Modernist Map Palette (Linear / Apple Maps inspired)
 * Minimal contrast, sage water, zero visual clutter
 */
const REFINED_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#F7F9F7' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 3 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  // Water: Clean modern translucent sage
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#D4E2D9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5B7A66' }] },

  // Roads: Crisp white and subtle grey dividers
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E8EBE8' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#F0F3F0' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  // Parks: Soft natural moss
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#E2ECE4' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#487D59' }] },

  // Clutter elimination
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#CBD5E1' }, { weight: 0.8 }] },
];

export default function MapView() {
  const [places, setPlaces] = useState<PlaceWithPosts[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAmbientHint, setShowAmbientHint] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('vegan_jp_hint_dismissed');
    if (!hasSeenHint) {
      setShowAmbientHint(true);
    }
  }, []);

  const dismissHint = useCallback(() => {
    setShowAmbientHint(false);
    localStorage.setItem('vegan_jp_hint_dismissed', 'true');
  }, []);

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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F8FAF8]">
      {/* ─── Map Layer: Real Google Maps ─── */}
      <APIProvider apiKey={apiKey} libraries={['places']}>
        <Map
          mapId="vegan_jp_map"
          defaultCenter={JAPAN_CENTER}
          defaultZoom={6}
          gestureHandling="greedy"
          disableDefaultUI
          styles={REFINED_MAP_STYLES}
          className="w-full h-full"
        >
          {places.map((place) => (
            <AdvancedMarker
              key={place.google_place_id}
              position={{ lat: place.lat, lng: place.lng }}
              onClick={() => {
                setSelectedPlace(place);
                dismissHint();
              }}
            >
              <PlantMarker
                count={place.posts.length}
                imageUrl={place.posts[0]?.image_url}
                name={place.name}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      {/* ─── Floating Dynamic Island Header (Lume / Raycast style) ─── */}
      <motion.header
        className="absolute top-5 inset-x-0 z-30 pointer-events-none flex justify-center px-4"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      >
        <div className="pointer-events-auto glass-pill px-4 py-2.5 rounded-full flex items-center gap-3.5 shadow-glass-md">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-botanical-600 transition-transform group-hover:scale-125" />
            <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
              vegan<span className="text-botanical-600">.jp</span>
            </span>
          </Link>

          <span className="w-px h-3.5 bg-black/10" />

          {/* Live Spot Counter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="text-slate-900 font-semibold">{places.length}</span>
            <span className="text-slate-500 hidden sm:inline">spots mapped</span>
          </div>

          <span className="w-px h-3.5 bg-black/10" />

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            <Link
              href="/articles"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-full hover:bg-black/5 transition-colors"
            >
              Guides
            </Link>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-6 h-6 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-600 text-xs font-semibold transition-colors"
              title="About & Guide"
            >
              ?
            </button>
          </div>
        </div>
      </motion.header>

      {/* ─── Atmos-Style Ambient Guidance Pill ─── */}
      <AnimatePresence>
        {showAmbientHint && !selectedPlace && (
          <motion.div
            className="absolute top-20 inset-x-0 z-30 pointer-events-none flex justify-center px-4"
            initial={{ y: -10, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.4 }}
          >
            <div className="pointer-events-auto glass-pill px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-glass-sm text-xs font-medium text-slate-700 border border-botanical-300/50 bg-white/95">
              <span className="w-2 h-2 rounded-full bg-botanical-500 animate-pulse shrink-0" />
              <span>Tap any photo pin to preview plant-based dishes</span>
              <button
                onClick={dismissHint}
                className="ml-1 text-slate-400 hover:text-slate-700 text-xs font-bold leading-none p-1 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Dismiss hint"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Frictionless Shutter Pill (Hides smoothly when place is selected) ─── */}
      <AnimatePresence>
        {!selectedPlace && (
          <motion.div
            className="absolute bottom-8 inset-x-0 z-30 pointer-events-none flex justify-center px-4"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <motion.button
              onClick={() => setShowUpload(true)}
              className="pointer-events-auto group flex items-center gap-2.5 bg-slate-900 hover:bg-botanical-900 text-white pl-4 pr-5 py-3.5 rounded-full shadow-pill transition-all duration-300 border border-white/20"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <div className="w-6 h-6 rounded-full bg-botanical-500 text-slate-950 flex items-center justify-center text-sm font-bold shadow-sm group-hover:rotate-90 transition-transform duration-300">
                +
              </div>
              <span className="text-xs font-semibold tracking-wide text-white">
                Plant a spot
              </span>
              <span className="text-[11px] text-white/50 tracking-wider font-mono">
                NO AUTH
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Progressive Discovery Bottom Sheet (Stage 1 Peek / Stage 2 Expanded) ─── */}
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
            onComplete={() => {
              setShowUpload(false);
              fetchPlaces();
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Onboarding Walkthrough (Manual Trigger) ─── */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* ─── Micro Loading Indicator ─── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none glass-pill px-3.5 py-1.5 rounded-full text-[11px] font-medium text-slate-600 flex items-center gap-2 shadow-glass-sm"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-botanical-500 animate-ping" />
            Loading spots…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
