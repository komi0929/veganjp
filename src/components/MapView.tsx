'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
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
import TravelerToolkitModal, { ToolkitTab } from './TravelerToolkitModal';
import GratitudeModal from './GratitudeModal';
import ToastContainer from './Toast';
import LanguageSelector from './LanguageSelector';
import SpotCardCarousel from './SpotCardCarousel';
import { SupportedLanguage, TRANSLATIONS, LANGUAGES } from '@/lib/i18n';

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

const INITIAL_MASTER_PLACES: PlaceWithPosts[] = MASTER_PLACES.map((p) => ({
  ...p,
  posts: [],
}));

function getInitialLang(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('vegan_jp_lang') as SupportedLanguage | null;
    if (saved && TRANSLATIONS[saved]) return saved;
    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk')) return 'zh-TW';
    if (browserLang.startsWith('zh')) return 'zh-CN';
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('ja')) return 'ja';
  } catch (e) {}
  return 'en';
}

interface CityConfig {
  id: string;
  nameKey: string;
  lat: number;
  lng: number;
  zoom: number;
}

const CITIES_CONFIG: CityConfig[] = [
  { id: 'all', nameKey: 'city_all', lat: 36.2048, lng: 138.2529, zoom: 6 },
  { id: 'tokyo', nameKey: 'city_tokyo', lat: 35.6812, lng: 139.7671, zoom: 12 },
  { id: 'kyoto', nameKey: 'city_kyoto', lat: 35.0116, lng: 135.7681, zoom: 13 },
  { id: 'osaka', nameKey: 'city_osaka', lat: 34.6937, lng: 135.5023, zoom: 13 },
  { id: 'fukuoka', nameKey: 'city_fukuoka', lat: 33.5904, lng: 130.4017, zoom: 13 },
];

const CUISINES_CONFIG = [
  { id: 'all', nameKey: 'cuisine_all' },
  { id: 'ramen', nameKey: 'cuisine_ramen', genre: 'ラーメン', genreEn: 'Ramen' },
  { id: 'cafe', nameKey: 'cuisine_cafe', genre: 'カフェ', genreEn: 'Cafe & Bakery' },
  { id: 'washoku', nameKey: 'cuisine_washoku', genre: '和食・精進', genreEn: 'Traditional Shojin & Washoku' },
  { id: 'burger', nameKey: 'cuisine_burger', genre: 'バーガー', genreEn: 'Burgers & Casual Dining' },
  { id: 'curry', nameKey: 'cuisine_curry', genre: 'カレー', genreEn: 'Curry & Spice' },
  { id: 'italian', nameKey: 'cuisine_italian', genre: 'イタリアン・ピザ', genreEn: 'Pizza & Italian' },
  { id: 'chinese', nameKey: 'cuisine_chinese', genre: '中華・台湾素食', genreEn: 'Asian & Dim Sum' },
];

const DIETARY_CONFIG = [
  { id: 'all', nameKey: 'diet_all' },
  { id: '100vegan', nameKey: 'diet_100vegan', is100: true },
  { id: 'gluten_free', nameKey: 'diet_gluten_free' },
  { id: 'gokun', nameKey: 'diet_gokun' },
  { id: 'organic', nameKey: 'diet_organic' },
  { id: 'options', nameKey: 'diet_options', isOption: true },
];

interface InnerMapViewProps {
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
}

function InnerMapView({ currentLang, onSelectLang }: InnerMapViewProps) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const [places, setPlaces] = useState<PlaceWithPosts[]>(INITIAL_MASTER_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTargetPlace, setUploadTargetPlace] = useState<PlaceWithPosts | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [toolkitTab, setToolkitTab] = useState<ToolkitTab>('passport');
  const [showAmbientHint, setShowAmbientHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCity, setActiveCity] = useState('all');
  const [activeDietary, setActiveDietary] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedFilterOnly, setSavedFilterOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [gratitudeTarget, setGratitudeTarget] = useState<{
    place: PlaceWithPosts;
    mode: 'gratitude' | 'update';
  } | null>(null);

  // Instant Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
  const handleCitySelect = (city: CityConfig) => {
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

  // Filtered places based on wishlist, dietary needs, cuisine & search query
  const visiblePlaces = useMemo(() => {
    let result = places;

    // 1. Wishlist
    if (savedFilterOnly) {
      result = result.filter((p) => savedIds.includes(p.google_place_id));
    }

    // 2. Strict Dietary Filter (Decisive differentiator vs Google Maps)
    if (activeDietary !== 'all') {
      if (activeDietary === '100vegan') {
        result = result.filter(
          (p) =>
            p.dietary_type === '100%_vegan' ||
            (!p.dietary_type &&
              p.features?.some(
                (f) =>
                  f.includes('100%植物性') ||
                  f.includes('全メニューヴィーガン') ||
                  f.includes('100%ヴィーガン')
              ))
        );
      } else if (activeDietary === 'gluten_free') {
        result = result.filter((p) => {
          const str = `${p.features?.join(' ') || ''} ${p.features_en?.join(' ') || ''} ${
            p.profile_text || ''
          } ${p.profile_text_en || ''}`;
          return /グルテン|gluten/i.test(str);
        });
      } else if (activeDietary === 'gokun') {
        result = result.filter((p) => {
          const str = `${p.features?.join(' ') || ''} ${p.features_en?.join(' ') || ''} ${
            p.profile_text || ''
          } ${p.profile_text_en || ''}`;
          return /五葷|oriental|garlic|allium/i.test(str);
        });
      } else if (activeDietary === 'organic') {
        result = result.filter((p) => {
          const str = `${p.features?.join(' ') || ''} ${p.features_en?.join(' ') || ''} ${
            p.profile_text || ''
          } ${p.profile_text_en || ''}`;
          return /オーガニック|organic|マクロビ|macrobiotic/i.test(str);
        });
      } else if (activeDietary === 'options') {
        result = result.filter(
          (p) =>
            p.dietary_type === 'vegan_friendly' ||
            (!p.dietary_type &&
              !p.features?.some(
                (f) =>
                  f.includes('100%植物性') ||
                  f.includes('全メニューヴィーガン') ||
                  f.includes('100%ヴィーガン')
              ))
        );
      }
    }

    // 3. Cuisine Genre Filter
    if (activeCategory !== 'all') {
      const cat = CUISINES_CONFIG.find((c) => c.id === activeCategory);
      if (cat?.genre) {
        result = result.filter(
          (p) => p.genre === cat.genre || (cat.genreEn && p.genre_en === cat.genreEn)
        );
      }
    }

    // 4. Free-Text Omni Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const textBlob = [
          p.name,
          p.name_ja,
          p.genre,
          p.genre_en,
          p.area,
          p.area_en,
          p.prefecture,
          p.prefecture_en,
          ...(p.features || []),
          ...(p.features_en || []),
          p.profile_text,
          p.profile_text_en,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return textBlob.includes(q);
      });
    }

    return result;
  }, [places, savedFilterOnly, savedIds, activeDietary, activeCategory, searchQuery]);

  // Top autocomplete suggestions for live search
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return places
      .filter((p) => {
        const textBlob = [
          p.name,
          p.name_ja,
          p.genre,
          p.genre_en,
          p.area,
          p.area_en,
          ...(p.features || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return textBlob.includes(q);
      })
      .slice(0, 5);
  }, [places, searchQuery]);

  const handleSelectPlace = useCallback(
    (place: PlaceWithPosts) => {
      setSelectedPlace(place);
      dismissHint();
      if (map) {
        map.panTo({ lat: place.lat, lng: place.lng });
        map.setZoom(15);
      }
    },
    [map, dismissHint]
  );

  const handleSelectSuggestion = (place: PlaceWithPosts) => {
    handleSelectPlace(place);
    setSearchFocused(false);
  };

  const openToolkitWithTab = (tab: ToolkitTab) => {
    setToolkitTab(tab);
    setShowToolkit(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#F8FAF8]">
      {/* ─── Map Layer: Real Google Maps with English Locale ─── */}
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
            onClick={() => handleSelectPlace(place)}
          >
            <PlantMarker
              count={place.posts.length}
              imageUrl={place.posts[0]?.image_url}
              name={place.name}
              genre={place.genre}
              genre_en={place.genre_en}
              dietary_type={place.dietary_type}
            />
          </AdvancedMarker>
        ))}
      </Map>

      {/* ─── Floating Dynamic Island Header ─── */}
      <motion.header
        className="absolute top-3 inset-x-0 z-30 pointer-events-none flex justify-center px-3"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      >
        <div className="pointer-events-auto glass-pill px-3.5 py-1.5 rounded-full flex items-center gap-2.5 shadow-glass-md border border-black/[0.06] bg-white/95 backdrop-blur-xl">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-1.5 group shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 transition-transform group-hover:scale-125" />
            <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
              vegan<span className="text-emerald-600">.jp</span>
            </span>
          </Link>

          <span className="w-px h-3.5 bg-black/10 shrink-0" />

          {/* Live Verified Spots Count */}
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 shrink-0">
            <span className="text-emerald-700 font-bold">{visiblePlaces.length}</span>
            <span className="text-slate-500 hidden sm:inline">{t.verified_spots}</span>
          </div>

          <span className="w-px h-3.5 bg-black/10 shrink-0" />

          {/* Wishlist Toggle */}
          <button
            onClick={() => setSavedFilterOnly(!savedFilterOnly)}
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
              savedFilterOnly
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
            title={t.wishlist}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={savedFilterOnly ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">{t.wishlist}</span>
            {savedIds.length > 0 && <span className="text-[10px]">({savedIds.length})</span>}
          </button>

          <span className="w-px h-3.5 bg-black/10 shrink-0" />

          {/* Survival Kit Triggers */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Chef Card */}
            <button
              onClick={() => openToolkitWithTab('passport')}
              className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              title={t.chef_card_title}
            >
              <span>🗣️</span>
              <span className="hidden sm:inline">{t.chef_card}</span>
            </button>

            {/* Why Not Google Maps? (Direct Objection Solver) */}
            <button
              onClick={() => openToolkitWithTab('why_us')}
              className="hidden md:flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              title={t.why_not_google_title}
            >
              <span>🛡️</span>
              <span>{t.why_not_google}</span>
            </button>

            {/* Konbini Guide */}
            <button
              onClick={() => openToolkitWithTab('konbini')}
              className="hidden lg:flex items-center gap-1 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              title={t.konbini_title}
            >
              <span>🏪</span>
              <span>{t.konbini}</span>
            </button>

            <Link
              href="/articles"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-full hover:bg-black/5 transition-colors hidden sm:inline"
            >
              {t.guides}
            </Link>

            <span className="w-px h-3.5 bg-black/10 shrink-0" />

            {/* Language Selector */}
            <LanguageSelector currentLang={currentLang} onSelectLang={onSelectLang} />
          </div>
        </div>
      </motion.header>

      {/* ─── Floating Search & Dietary Filter Control Cluster ─── */}
      <motion.div
        className="absolute top-14 inset-x-0 z-20 pointer-events-none flex flex-col items-center gap-1.5 px-3 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Instant Omni-Search Bar */}
        <div
          ref={searchContainerRef}
          className="pointer-events-auto relative w-full max-w-md shadow-glass-md rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.08]"
        >
          <div className="flex items-center px-3 py-1.5 gap-2">
            <span className="text-slate-400 text-sm select-none">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t.search_placeholder}
              className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {searchFocused && searchSuggestions.length > 0 && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 z-50 max-h-72 overflow-y-auto"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.verified_matches} ({searchSuggestions.length})
                </div>
                {searchSuggestions.map((place) => (
                  <div
                    key={place.google_place_id}
                    onClick={() => handleSelectSuggestion(place)}
                    className="p-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {place.name}
                        </span>
                        {place.name_ja && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {place.name_ja}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                        <span>📍 {place.area_en || place.area}</span>
                        <span>•</span>
                        <span>{place.genre_en || place.genre}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        place.dietary_type === '100%_vegan'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {place.dietary_type === '100%_vegan' ? t.tag_100vegan : t.tag_options}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dietary Requirement Pills (The Non-Negotiables for Vegans) */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-hide py-0.5">
          {DIETARY_CONFIG.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDietary(d.id)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all shrink-0 border cursor-pointer ${
                activeDietary === d.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white/90 text-slate-700 border-black/[0.08] hover:bg-white hover:text-slate-900'
              }`}
            >
              {t[d.nameKey] || d.id}
            </button>
          ))}
        </div>

        {/* City Quick-Jumps & Cuisines row */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-hide py-0.5">
          {/* City Chips */}
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-0.5 rounded-full border border-black/[0.06] shrink-0">
            {CITIES_CONFIG.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCitySelect(c)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all shrink-0 cursor-pointer ${
                  activeCity === c.id
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t[c.nameKey] || c.id}
              </button>
            ))}
          </div>

          <span className="w-px h-3.5 bg-black/10 shrink-0" />

          {/* Cuisine Chips */}
          {CUISINES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all shrink-0 border cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white/85 text-slate-600 border-black/[0.06] hover:bg-white hover:text-slate-900'
              }`}
            >
              {t[cat.nameKey] || cat.id}
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
          className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-glass-md flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all border-2 border-white cursor-pointer"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          title="Plant a Photo"
          aria-label="Add photo"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
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
            <span>🌱 500+ verified vegan spots across Japan. Tap any pin for details.</span>
            <button
              onClick={dismissHint}
              className="text-white/60 hover:text-white font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Trending / Featured Food Photo Carousel (Reel) ─── */}
      {!selectedPlace && (
        <SpotCardCarousel
          places={visiblePlaces}
          currentLang={currentLang}
          onSelectPlace={handleSelectPlace}
        />
      )}

      {/* ─── Place Detail Bottom Sheet ─── */}
      {selectedPlace && (
        <BottomSheet
          place={selectedPlace}
          currentLang={currentLang}
          placesLibrary={placesLibrary}
          map={map}
          onClose={() => setSelectedPlace(null)}
          onOpenUpload={(target) => {
            setUploadTargetPlace(target);
            setShowUpload(true);
          }}
          onOpenToolkit={(tab) => openToolkitWithTab(tab || 'passport')}
          onOpenGratitude={(place, mode) =>
            setGratitudeTarget({ place, mode: mode || 'gratitude' })
          }
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

      {/* ─── First-time Onboarding Modal ─── */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* ─── Comprehensive Traveler Survival Toolkit Modal ─── */}
      <TravelerToolkitModal
        isOpen={showToolkit}
        initialTab={toolkitTab}
        onClose={() => setShowToolkit(false)}
      />

      {/* ─── Community Gratitude & Friendly Update Modal ─── */}
      {gratitudeTarget && (
        <GratitudeModal
          isOpen={!!gratitudeTarget}
          place={gratitudeTarget.place}
          initialMode={gratitudeTarget.mode}
          onClose={() => setGratitudeTarget(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
}

export default function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');

  useEffect(() => {
    setCurrentLang(getInitialLang());
  }, []);

  const handleSelectLang = (newLang: SupportedLanguage) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('vegan_jp_lang', newLang);
    } catch (e) {}
  };

  const googleMapsCode = LANGUAGES.find((l) => l.code === currentLang)?.googleMapsCode || 'en';

  return (
    <APIProvider apiKey={apiKey} libraries={['places']} language={googleMapsCode} region="JP">
      <InnerMapView currentLang={currentLang} onSelectLang={handleSelectLang} />
    </APIProvider>
  );
}
