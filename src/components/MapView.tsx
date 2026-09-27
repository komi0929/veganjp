'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { PlaceWithPosts } from '@/lib/types';
import { getSavedPlaceIds } from '@/lib/saved-places';
import BottomSheet from './BottomSheet';
import UploadModal from './UploadModal';
import PlantMarker from './PlantMarker';
import OnboardingModal from './OnboardingModal';

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

const CITIES = [
  { id: 'all', label: 'All Japan', lat: 36.2048, lng: 138.2529, zoom: 6 },
  { id: 'tokyo', label: 'Tokyo', lat: 35.6812, lng: 139.7671, zoom: 12 },
  { id: 'kyoto', label: 'Kyoto', lat: 35.0116, lng: 135.7681, zoom: 13 },
  { id: 'osaka', label: 'Osaka', lat: 34.6937, lng: 135.5023, zoom: 13 },
  { id: 'fukuoka', label: 'Fukuoka', lat: 33.5904, lng: 130.4017, zoom: 13 },
];

function InnerMapView() {
  const map = useMap();
  const [places, setPlaces] = useState<PlaceWithPosts[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAmbientHint, setShowAmbientHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState('all');
  const [savedFilterOnly, setSavedFilterOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);

  // Sync saved wishlist IDs
  const syncSaved = useCallback(() => {
    setSavedIds(getSavedPlaceIds());
  }, []);

  useEffect(() => {
    syncSaved();
    window.addEventListener('vegan_jp_saved_changed', syncSaved);
    return () => window.removeEventListener('vegan_jp_saved_changed', syncSaved);
  }, [syncSaved]);

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

  // Handle City Quick-Jump
  const handleCitySelect = (city: typeof CITIES[number]) => {
    setActiveCity(city.id);
    if (map) {
      map.panTo({ lat: city.lat, lng: city.lng });
      map.setZoom(city.zoom);
    }
  };

  // Handle GPS Current Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        if (map) {
          map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          map.setZoom(14);
        }
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Filtered places based on wishlist toggle
  const visiblePlaces = useMemo(() => {
    if (savedFilterOnly) {
      return places.filter((p) => savedIds.includes(p.google_place_id));
    }
    return places;
  }, [places, savedFilterOnly, savedIds]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F8FAF8]">
      {/* ─── Map Layer: Real Google Maps ─── */}
      <Map
        mapId="vegan_jp_map"
        defaultCenter={JAPAN_CENTER}
        defaultZoom={6}
        gestureHandling="greedy"
        disableDefaultUI
        className="w-full h-full"
      >
        {visiblePlaces.map((place) => (
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

      {/* ─── Floating Dynamic Island Header (Lume / Raycast style) ─── */}
      <motion.header
        className="absolute top-4 inset-x-0 z-30 pointer-events-none flex justify-center px-4"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      >
        <div className="pointer-events-auto glass-pill px-4 py-2 rounded-full flex items-center gap-3 shadow-glass-md border border-black/[0.06]">
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
            <span className="text-slate-500 hidden sm:inline">spots</span>
          </div>

          <span className="w-px h-3.5 bg-black/10" />

          {/* Saved Wishlist Toggle */}
          <button
            onClick={() => setSavedFilterOnly(!savedFilterOnly)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
              savedFilterOnly
                ? 'bg-botanical-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
            title="Filter by saved places"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={savedFilterOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.4">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Saved {savedIds.length > 0 && `(${savedIds.length})`}</span>
          </button>

          <span className="w-px h-3.5 bg-black/10" />

          {/* Navigation Items */}
          <div className="flex items-center gap-1.5">
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

      {/* ─── City Quick-Jump Filter Bar (Customer Journey Enhancement) ─── */}
      <motion.div
        className="absolute top-16 inset-x-0 z-20 pointer-events-none flex justify-center px-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-sm overflow-x-auto max-w-full scrollbar-hide">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCitySelect(c)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all shrink-0 ${
                activeCity === c.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Floating Locate Me Compass Button ─── */}
      <div className="absolute top-28 right-4 z-20">
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-glass-md flex items-center justify-center text-slate-700 hover:text-botanical-700 hover:bg-white transition-all disabled:opacity-50"
          title="Locate my position"
        >
          {locating ? (
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-botanical-600 animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          )}
        </button>
      </div>

      {/* ─── Atmos-Style Ambient Guidance Pill ─── */}
      <AnimatePresence>
        {showAmbientHint && !selectedPlace && (
          <motion.div
            className="absolute top-28 inset-x-0 z-10 pointer-events-none flex justify-center px-4"
            initial={{ y: -8, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.95 }}
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

      {/* ─── Upload Modal (Now inside APIProvider, zero context errors) ─── */}
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
            className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none glass-pill px-3.5 py-1.5 rounded-full text-[11px] font-medium text-slate-600 flex items-center gap-2 shadow-glass-sm"
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

export default function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <InnerMapView />
    </APIProvider>
  );
}
