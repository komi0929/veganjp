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
import { MASTER_PLACES } from '@/lib/places-master';
import { getSavedPlaceIds } from '@/lib/saved-places';
import BottomSheet from './BottomSheet';
import UploadModal from './UploadModal';
import PlantMarker from './PlantMarker';
import OnboardingModal from './OnboardingModal';
import ToastContainer from './Toast';

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

const CITIES = [
  { id: 'all', label: 'All Japan', lat: 36.2048, lng: 138.2529, zoom: 6 },
  { id: 'tokyo', label: 'Tokyo', lat: 35.6812, lng: 139.7671, zoom: 12 },
  { id: 'kyoto', label: 'Kyoto', lat: 35.0116, lng: 135.7681, zoom: 13 },
  { id: 'osaka', label: 'Osaka', lat: 34.6937, lng: 135.5023, zoom: 13 },
  { id: 'fukuoka', label: 'Fukuoka', lat: 33.5904, lng: 130.4017, zoom: 13 },
  { id: 'nagoya', label: 'Nagoya', lat: 35.1802, lng: 136.9066, zoom: 13 },
  { id: 'sapporo', label: 'Sapporo', lat: 43.0642, lng: 141.3469, zoom: 13 },
  { id: 'okinawa', label: 'Okinawa', lat: 26.2124, lng: 127.6809, zoom: 11 },
  { id: 'sendai', label: 'Sendai', lat: 38.2682, lng: 140.8694, zoom: 13 },
  { id: 'hiroshima', label: 'Hiroshima', lat: 34.3966, lng: 132.4596, zoom: 13 },
];

const CATEGORIES = [
  { id: 'all', label: 'All Foods' },
  { id: 'ramen', label: '🍜 Ramen', genre: 'ラーメン' },
  { id: 'cafe', label: '☕ Cafe & Sweets', genre: 'カフェ' },
  { id: 'washoku', label: '🍱 Shojin / Washoku', genre: '和食・精進' },
  { id: 'burger', label: '🍔 Burger', genre: 'バーガー' },
  { id: 'curry', label: '🍛 Curry', genre: 'カレー' },
  { id: 'italian', label: '🍕 Italian / Pizza', genre: 'イタリアン・ピザ' },
  { id: 'chinese', label: '🥟 Chinese / Asian', genre: '中華・台湾素食' },
  { id: 'macro', label: '🥗 Macrobiotic', genre: 'マクロビ・オーガニック' },
  { id: '100vegan', label: '🌱 100% Vegan', is100: true },
];

function InnerMapView() {
  const map = useMap();
  const [places, setPlaces] = useState<PlaceWithPosts[]>(MASTER_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTargetPlace, setUploadTargetPlace] = useState<PlaceWithPosts | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAmbientHint, setShowAmbientHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCity, setActiveCity] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
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

  // Fetch community posts and merge with master places
  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, place:places(*)')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Create a map starting with MASTER_PLACES
      const placeMap = new globalThis.Map<string, PlaceWithPosts>();
      for (const master of MASTER_PLACES) {
        placeMap.set(master.google_place_id, { ...master, posts: [] });
      }

      if (postsData && postsData.length > 0) {
        for (const post of postsData) {
          const place = post.place as any;
          if (!place) continue;
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
      }

      const placesList = Array.from(placeMap.values());
      setPlaces(placesList);

      // Deep link support (?place=vegan-ramen-01)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const placeId = params.get('place');
        if (placeId) {
          const target = placesList.find((p) => p.google_place_id === placeId);
          if (target) {
            setSelectedPlace(target);
            map?.panTo({ lat: target.lat, lng: target.lng });
            map?.setZoom(15);
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync posts:', err);
    } finally {
      setLoading(false);
    }
  }, [map]);

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

  // Filtered places based on wishlist toggle & category
  const visiblePlaces = useMemo(() => {
    let result = places;
    if (savedFilterOnly) {
      result = result.filter((p) => savedIds.includes(p.google_place_id));
    }
    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (cat) {
        if (cat.is100) {
          result = result.filter((p) =>
            p.features?.some((f) => f.includes('100%植物性') || f.includes('全メニューヴィーガン'))
          );
        } else if (cat.genre) {
          result = result.filter((p) => p.genre === cat.genre);
        }
      }
    }
    return result;
  }, [places, savedFilterOnly, savedIds, activeCategory]);

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
              genre={place.genre}
            />
          </AdvancedMarker>
        ))}
      </Map>

      {/* ─── Floating Dynamic Island Header ─── */}
      <motion.header
        className="absolute top-4 inset-x-0 z-30 pointer-events-none flex justify-center px-4"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      >
        <div className="pointer-events-auto glass-pill px-4 py-2 rounded-full flex items-center gap-3 shadow-glass-md border border-black/[0.06] bg-white/90 backdrop-blur-xl">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 transition-transform group-hover:scale-125" />
            <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
              vegan<span className="text-emerald-600">.jp</span>
            </span>
          </Link>

          <span className="w-px h-3.5 bg-black/10" />

          {/* Live Spot Counter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="text-slate-900 font-bold">{visiblePlaces.length}</span>
            <span className="text-slate-500 hidden sm:inline">verified spots</span>
          </div>

          <span className="w-px h-3.5 bg-black/10" />

          {/* Saved Wishlist Toggle */}
          <button
            onClick={() => setSavedFilterOnly(!savedFilterOnly)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
              savedFilterOnly
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
            title="Filter by saved places"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={savedFilterOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.4">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Wishlist {savedIds.length > 0 && `(${savedIds.length})`}</span>
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

      {/* ─── Quick-Jump & Category Control Cluster ─── */}
      <motion.div
        className="absolute top-16 inset-x-0 z-20 pointer-events-none flex flex-col items-center gap-2 px-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* City Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-sm overflow-x-auto max-w-full scrollbar-hide">
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

        {/* Category Filters */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-hide py-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all shrink-0 border ${
                activeCategory === cat.id
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white/85 text-slate-600 border-black/[0.06] hover:bg-white hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Floating Utilities (GPS + Add Post) ─── */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col gap-2.5 pointer-events-auto">
        {/* GPS Locate Button */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-glass-md flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-white transition-all active:scale-95 disabled:opacity-50"
          title="Current Location"
          aria-label="Find my location"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className={locating ? 'animate-spin' : ''}
          >
            <circle cx="12" cy="12" r="7" />
            <line x1="12" y1="1" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="1" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="23" y2="12" />
          </svg>
        </button>

        {/* Plant Photo (Primary FAB) */}
        <motion.button
          onClick={() => {
            setUploadTargetPlace(null);
            setShowUpload(true);
          }}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-white"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          title="Plant a Photo"
          aria-label="Add photo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
      </div>

      {/* ─── Ambient Onboarding Tooltip ─── */}
      <AnimatePresence>
        {showAmbientHint && (
          <motion.div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-900/90 text-white px-4 py-2.5 rounded-full text-xs backdrop-blur-md shadow-glass-lg flex items-center gap-2 border border-white/10"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <span>🌱 Explore 500+ verified vegan spots across Japan! Tap any pin for details.</span>
            <button
              onClick={dismissHint}
              className="text-white/60 hover:text-white font-bold ml-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Place Detail Bottom Sheet ─── */}
      {selectedPlace && (
        <BottomSheet
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onOpenUpload={(target) => {
            setUploadTargetPlace(target);
            setShowUpload(true);
          }}
        />
      )}

      {/* ─── Photo Upload Modal ─── */}
      {showUpload && (
        <UploadModal
          initialPlace={uploadTargetPlace}
          onClose={() => {
            setShowUpload(false);
            setUploadTargetPlace(null);
          }}
          onSuccess={() => {
            setShowUpload(false);
            setUploadTargetPlace(null);
            fetchPlaces();
          }}
        />
      )}

      {/* ─── Onboarding Modal ─── */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      <ToastContainer />
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
