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
import type {
  PlaceWithPosts,
  StoreOfficialData,
  GratitudeNote,
  Place,
} from '@/lib/types';
import { MASTER_PLACES } from '@/lib/places-master';
import { getSavedPlaceIds } from '@/lib/saved-places';
import BottomSheet from './BottomSheet';
import PlantMarker from './PlantMarker';
import GratitudeModal from './GratitudeModal';
import ToastContainer from './Toast';
import LanguageSelector from './LanguageSelector';
import SpotCardCarousel from './SpotCardCarousel';
import { SupportedLanguage, TRANSLATIONS, LANGUAGES } from '@/lib/i18n';
import { getTripStamps, TripStampRecord } from '@/lib/trip-stamps';

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

const INITIAL_MASTER_PLACES: PlaceWithPosts[] = MASTER_PLACES.map((p) => ({
  ...p,
  posts: [],
}));

function getInitialLang(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') as SupportedLanguage | null;
    if (urlLang && TRANSLATIONS[urlLang]) return urlLang;

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
  const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
  const [ecosystemStores, setEcosystemStores] = useState<Record<string, StoreOfficialData>>({});
  const [ecosystemNotes, setEcosystemNotes] = useState<GratitudeNote[]>([]);

  const places = useMemo<PlaceWithPosts[]>(() => {
    const customWithPosts: PlaceWithPosts[] = customPlaces.map((p) => ({
      ...p,
      posts: [],
    }));
    const existingIds = new Set(customWithPosts.map((c) => c.google_place_id));
    return [
      ...customWithPosts,
      ...INITIAL_MASTER_PLACES.filter((p) => !existingIds.has(p.google_place_id)),
    ];
  }, [customPlaces]);

  const [selectedPlace, setSelectedPlace] = useState<PlaceWithPosts | null>(null);
  const [activeCity, setActiveCity] = useState('all');
  const [activeDietary, setActiveDietary] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedFilterOnly, setSavedFilterOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [tripStamps, setTripStamps] = useState<TripStampRecord[]>([]);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gratitudeTarget, setGratitudeTarget] = useState<{
    place: PlaceWithPosts;
    mode: 'gratitude' | 'update';
    orderedDishes?: string[];
  } | null>(null);

  // Instant Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync Ecosystem Data from Real Server API
  const fetchEcosystem = useCallback(async () => {
    try {
      const res = await fetch('/api/ecosystem', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.stores) setEcosystemStores(data.stores);
        if (data.gratitude_notes) setEcosystemNotes(data.gratitude_notes);
        if (data.custom_places) setCustomPlaces(data.custom_places);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchEcosystem();
    window.addEventListener('vegan_jp_ecosystem_updated', fetchEcosystem);
    return () => window.removeEventListener('vegan_jp_ecosystem_updated', fetchEcosystem);
  }, [fetchEcosystem]);

  // Sync saved wishlist IDs & Trip Stamps
  const syncSaved = useCallback(() => {
    setSavedIds(getSavedPlaceIds());
    setTripStamps(getTripStamps());
  }, []);

  useEffect(() => {
    syncSaved();
    window.addEventListener('vegan_jp_saved_changed', syncSaved);
    window.addEventListener('vegan-jp-saved-updated', syncSaved);
    window.addEventListener('vegan_jp_stamps_updated', syncSaved);
    return () => {
      window.removeEventListener('vegan_jp_saved_changed', syncSaved);
      window.removeEventListener('vegan-jp-saved-updated', syncSaved);
      window.removeEventListener('vegan_jp_stamps_updated', syncSaved);
    };
  }, [syncSaved]);

  // Restore map center & zoom if switching languages
  useEffect(() => {
    if (!map) return;
    try {
      const savedCenter = sessionStorage.getItem('vegan_jp_map_center');
      if (savedCenter) {
        const parsed = JSON.parse(savedCenter);
        if (parsed.lat && parsed.lng) {
          map.panTo({ lat: parsed.lat, lng: parsed.lng });
          if (parsed.zoom) map.setZoom(parsed.zoom);
        }
        sessionStorage.removeItem('vegan_jp_map_center');
      }
    } catch (e) {}
  }, [map]);

  // Handle URL deep link (?place=... or ?store=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const placeId = params.get('place') || params.get('store');
      if (placeId) {
        const target = places.find(
          (p) => p.google_place_id === placeId || p.id === placeId
        );
        if (target) {
          setSelectedPlace(target);
          map?.panTo({ lat: target.lat, lng: target.lng });
          map?.setZoom(15);
        }
      }
    }
  }, [map, places]);

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

    // 3. Category / Cuisine Filter
    if (activeCategory !== 'all') {
      const targetCuisine = CUISINES_CONFIG.find((c) => c.id === activeCategory);
      if (targetCuisine && (targetCuisine.genre || targetCuisine.genreEn)) {
        result = result.filter((p) => {
          return (
            p.genre === targetCuisine.genre ||
            p.genre_en === targetCuisine.genreEn ||
            (p.genre && targetCuisine.genre && p.genre.includes(targetCuisine.genre))
          );
        });
      }
    }

    // 4. Instant Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const text = [
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
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(q);
      });
    }

    return result;
  }, [places, savedFilterOnly, savedIds, activeDietary, activeCategory, searchQuery]);

  // Autocomplete Suggestions for Search Bar
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !searchFocused) return [];
    const q = searchQuery.toLowerCase().trim();
    return places
      .filter((p) => {
        const name = (p.name || '').toLowerCase();
        const ja = (p.name_ja || '').toLowerCase();
        const area = (p.area || '').toLowerCase();
        const areaEn = (p.area_en || '').toLowerCase();
        const genre = (p.genre || '').toLowerCase();
        const genreEn = (p.genre_en || '').toLowerCase();
        return (
          name.includes(q) ||
          ja.includes(q) ||
          area.includes(q) ||
          areaEn.includes(q) ||
          genre.includes(q) ||
          genreEn.includes(q)
        );
      })
      .slice(0, 5);
  }, [places, searchQuery, searchFocused]);

  const handleSelectPlace = (place: PlaceWithPosts) => {
    setSelectedPlace(place);
    if (map) {
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(16);
    }
  };

  const handleSuggestionClick = (place: PlaceWithPosts) => {
    handleSelectPlace(place);
    setSearchFocused(false);
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (map) {
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        if (center) {
          sessionStorage.setItem(
            'vegan_jp_map_center',
            JSON.stringify({ lat: center.lat(), lng: center.lng(), zoom })
          );
        }
      } catch (e) {}
    }
    onSelectLang(newLang);
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

      {/* ─── Floating Native-App Pill Header (nani.now Monochromatic Style) ─── */}
      <motion.header
        className="absolute top-3 inset-x-0 z-30 pointer-events-none flex justify-center px-3"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      >
        <div className="pointer-events-auto px-2.5 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-[0_8px_24px_rgba(20,40,30,0.08)] border border-[#DCECE3] bg-white/95 backdrop-blur-xl">
          {/* Squircle Brand Logo */}
          <Link href="/" className="flex items-center gap-2 pl-1 pr-1.5 group shrink-0">
            <span className="size-7 rounded-[9px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(22,163,74,0.28)] group-hover:scale-105 transition-transform">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </span>
            <span className="text-sm font-extrabold tracking-tight text-[#1C2822]">
              Vegan.jp
            </span>
          </Link>

          <span className="w-px h-4 bg-[#DCECE3] shrink-0" />

          {/* Japan Culinary Stamp Passport Button */}
          <button
            onClick={() => setIsPassportOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold h-8 px-3 rounded-full bg-[#EEF7F2] hover:bg-[#DCECE3] text-[#1C2822] transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Japan Culinary Stamp Passport / 旅の美食御朱印帳"
          >
            <svg className="size-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span className="hidden sm:inline">
              {currentLang === 'ja' ? '御朱印帳' : 'Stamps'}
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#16A34A] text-white">
              {tripStamps.length}
            </span>
          </button>

          {/* Wishlist Toggle Button */}
          <button
            onClick={() => setSavedFilterOnly(!savedFilterOnly)}
            className={`flex items-center gap-1 text-xs font-bold h-8 px-2.5 rounded-full transition-all active:scale-95 shrink-0 cursor-pointer ${
              savedFilterOnly
                ? 'bg-[#1C2822] text-white'
                : 'text-[#4A5D52] hover:bg-[#EEF7F2] hover:text-[#1C2822]'
            }`}
            title={t.wishlist}
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill={savedFilterOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {savedIds.length > 0 && (
              <span className="text-[10px] font-extrabold">{savedIds.length}</span>
            )}
          </button>

          {/* Partner Studio Link */}
          <Link
            href="/partner"
            className="flex items-center gap-1.5 text-xs font-bold h-8 px-3 rounded-full text-[#4A5D52] hover:bg-[#EEF7F2] hover:text-[#1C2822] transition-all active:scale-95 shrink-0"
          >
            <svg className="size-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="hidden sm:inline">
              {currentLang === 'ja' ? '店舗スタジオ' : 'Partner'}
            </span>
          </Link>

          {/* Autonomous Growth & Self-Healing Link */}
          <Link
            href="/growth"
            className="flex items-center gap-1.5 text-xs font-bold h-8 px-3 rounded-full text-[#4A5D52] hover:bg-[#EEF7F2] hover:text-[#1C2822] transition-all active:scale-95 shrink-0"
          >
            <svg className="size-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            </svg>
            <span className="hidden md:inline">
              {currentLang === 'ja' ? '自動集客' : 'Growth'}
            </span>
          </Link>

          {/* Guide / FAQ Link */}
          <Link
            href="/guide"
            className="hidden sm:flex items-center gap-1 text-xs font-bold h-8 px-2.5 rounded-full text-[#4A5D52] hover:bg-[#EEF7F2] hover:text-[#1C2822] transition-all active:scale-95 shrink-0"
          >
            <span>{currentLang === 'ja' ? 'ガイド' : 'Guide'}</span>
          </Link>

          <span className="w-px h-4 bg-[#DCECE3] shrink-0" />

          {/* Language Selector */}
          <LanguageSelector currentLang={currentLang} onSelectLang={handleLanguageChange} />
        </div>
      </motion.header>

      {/* ─── Floating Two-Layer Search & City/Cuisine Tray (nani.now Squircle Well) ─── */}
      <motion.div
        className={`absolute top-16 right-0 z-20 pointer-events-none flex flex-col items-center px-3 transition-all duration-300 ${
          selectedPlace ? 'left-0 md:left-[454px]' : 'inset-x-0'
        }`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div
          ref={searchContainerRef}
          className="pointer-events-auto relative w-full max-w-xl mx-auto rounded-[22px] bg-[#DCECE3]/90 backdrop-blur-xl p-1.5 border border-white/80 shadow-[0_10px_28px_rgba(20,40,30,0.1)]"
        >
          {/* Top Mini Bar inside Well: City Quick-Jumps + Cuisine Filter */}
          <div className="flex items-center justify-between gap-1.5 px-1.5 pb-1.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
              {CITIES_CONFIG.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCitySelect(c)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-[10px] transition-all active:scale-95 shrink-0 cursor-pointer ${
                    activeCity === c.id
                      ? 'bg-white text-[#1C2822] shadow-2xs'
                      : 'text-[#3D5245] hover:text-[#1C2822]'
                  }`}
                >
                  {t[c.nameKey] || c.id}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {CUISINES_CONFIG.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[10.5px] font-bold px-2.5 py-1 rounded-[10px] transition-all active:scale-95 shrink-0 cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#16A34A] text-white shadow-2xs'
                      : 'bg-white/60 text-[#3D5245] hover:bg-white'
                  }`}
                >
                  {t[cat.nameKey] || cat.id}
                </button>
              ))}
            </div>
          </div>

          {/* Inner Elevated White Search Sheet */}
          <div className="flex items-center bg-white rounded-[16px] px-3.5 h-10 gap-2.5 shadow-[0_2px_8px_rgba(20,40,30,0.04)] border border-black/[0.04]">
            <svg className="size-4 text-[#16A34A] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t.search_placeholder}
              className="w-full text-xs font-semibold text-[#1C2822] placeholder:text-[#7A8E82] bg-transparent outline-none"
            />
            <span className="text-[10.5px] font-bold text-[#15803D] bg-[#EEF7F2] px-2 py-0.5 rounded-full shrink-0">
              {visiblePlaces.length} {currentLang === 'ja' ? '店' : 'spots'}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#526358] hover:text-[#1C2822] text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {searchSuggestions.length > 0 && (
              <motion.div
                className="absolute top-full left-0 right-0 mt-1.5 bg-white/98 backdrop-blur-xl rounded-[18px] shadow-[0_14px_34px_rgba(20,40,30,0.14)] border border-[#DCECE3] overflow-hidden z-50 divide-y divide-[#EEF7F2]"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <div className="px-3.5 py-2 bg-[#F7FBF8] text-[10px] font-extrabold text-[#526358] uppercase tracking-wider flex items-center justify-between">
                  <span>{t.verified_matches}</span>
                  <span className="text-[#16A34A]">{searchSuggestions.length}</span>
                </div>
                {searchSuggestions.map((place) => (
                  <div
                    key={place.google_place_id}
                    onClick={() => handleSuggestionClick(place)}
                    className="p-3 hover:bg-[#EEF7F2] cursor-pointer transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#1C2822] truncate">
                        {place.name}
                      </div>
                      <div className="text-[10.5px] text-[#526358] truncate flex items-center gap-1.5">
                        <span>{place.area_en || place.area}</span>
                        <span>•</span>
                        <span>{place.genre_en || place.genre}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 bg-[#EEF7F2] text-[#15803D]">
                      {place.dietary_type === '100%_vegan' ? t.tag_100vegan : t.tag_options}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─── Floating Utilities: GPS Locate Button ─── */}
      <div className={`absolute right-3.5 z-20 flex-col gap-2.5 pointer-events-auto transition-all ${selectedPlace ? 'hidden md:flex md:bottom-6' : 'flex bottom-40 sm:bottom-56'}`}>
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
      </div>

      {/* ─── Trending / Featured Food Photo Carousel (Reel) ─── */}
      <SpotCardCarousel
        places={visiblePlaces}
        currentLang={currentLang}
        selectedPlaceId={selectedPlace?.google_place_id || null}
        officialStoresMap={ecosystemStores}
        onSelectPlace={handleSelectPlace}
      />

      {/* ─── Place Detail Docked Panel / Bottom Sheet ─── */}
      {selectedPlace && (
        <BottomSheet
          place={selectedPlace}
          currentLang={currentLang}
          officialStoreData={ecosystemStores[selectedPlace.google_place_id] || null}
          gratitudeNotes={ecosystemNotes.filter(
            (n) => n.place_id === selectedPlace.google_place_id
          )}
          placesLibrary={placesLibrary}
          map={map}
          onClose={() => setSelectedPlace(null)}
          onOpenGratitude={(place, mode, orderedDishes) =>
            setGratitudeTarget({
              place,
              mode: mode || 'gratitude',
              orderedDishes: orderedDishes || [],
            })
          }
        />
      )}

      {/* ─── Gochisosama Postcard & Stamp Modal ─── */}
      {gratitudeTarget && (
        <GratitudeModal
          isOpen={!!gratitudeTarget}
          place={gratitudeTarget.place}
          currentLang={currentLang}
          officialStoreData={
            ecosystemStores[gratitudeTarget.place.google_place_id] || null
          }
          preselectedDishes={gratitudeTarget.orderedDishes}
          initialMode={gratitudeTarget.mode}
          onClose={() => setGratitudeTarget(null)}
          onSuccessRefresh={fetchEcosystem}
        />
      )}

      {/* ─── 💮 Japan Culinary Stamp Passport Modal (旅の美食御朱印帳) ─── */}
      <AnimatePresence>
        {isPassportOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#1C2822]/75 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPassportOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg nani-well overflow-hidden max-h-[88vh] flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#16A34A]" />
                  <span>
                    {currentLang === 'ja'
                      ? '日本旅の美食御朱印帳（コレクション）'
                      : 'My Japan Culinary Stamp Book'}
                  </span>
                </span>
                <button
                  onClick={() => setIsPassportOpen(false)}
                  className="size-7 rounded-full bg-white/80 hover:bg-white text-[#1C2822] flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="nani-sheet p-5 overflow-y-auto space-y-3">
                <p className="text-xs font-medium text-[#3D5245] bg-[#F2F9F5] border border-[#C5DDD0] rounded-[14px] p-3 leading-relaxed">
                  {currentLang === 'ja'
                    ? 'お店で「看板の一皿」を味わってシェフに『ごちそうさま！』を送ると、そのお店だけの完食御朱印スタンプと記念絵葉書がここにコレクションされます。'
                    : 'Enjoy a restaurant’s Signature Dish and send a Gochisosama postcard to collect your commemorative Japanese culinary stamps here!'}
                </p>

                {tripStamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="relative rounded-[18px] bg-[#FAF7F0] border border-[#E5DEC9] p-4 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-extrabold text-[#15803D] bg-[#EEF7F2] px-2 py-0.5 rounded-full">
                        #{stamp.seal_code} • {new Date(stamp.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#1C2822] truncate">
                        {stamp.place_name}
                      </h4>
                      <p className="text-xs font-bold text-[#15803D]">
                        🍽️ {stamp.signature_dish}
                      </p>
                      <p className="text-xs text-[#526358] font-medium">
                        &ldquo;{stamp.message}&rdquo;
                      </p>
                      <button
                        onClick={() => {
                          setIsPassportOpen(false);
                          const target = places.find((p) => p.google_place_id === stamp.place_id);
                          if (target) {
                            setSelectedPlace(target);
                            map?.panTo({ lat: target.lat, lng: target.lng });
                            map?.setZoom(15);
                          }
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#16A34A] hover:text-[#15803D] cursor-pointer"
                      >
                        <span>{currentLang === 'ja' ? 'このお店をマップで見る →' : 'View on Map →'}</span>
                      </button>
                    </div>

                    <div className="size-16 rounded-full border-2 border-[#DC2626] bg-white/90 flex flex-col items-center justify-center text-[#DC2626] shrink-0 rotate-[-8deg] shadow-2xs">
                      <span className="text-[7.5px] font-black">VEGAN.JP</span>
                      <span className="text-[10.5px] font-black leading-tight">完食御朱印</span>
                      <span className="text-xs">{stamp.stamp_emoji}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}

export default function MapView() {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyBXyY0Hxu72DchKbMm-bJGdfl5YXqA7fs0';
  const [currentLang, setCurrentLang] = useState<SupportedLanguage | null>(null);

  useEffect(() => {
    const lang = getInitialLang();
    setCurrentLang(lang);
    try {
      localStorage.setItem('vegan_jp_lang', lang);
    } catch (e) {}
  }, []);

  const handleSelectLang = (newLang: SupportedLanguage) => {
    try {
      localStorage.setItem('vegan_jp_lang', newLang);
    } catch (e) {}

    // Google Maps JavaScript API cannot dynamically re-render tile fonts/labels once loaded.
    // Seamlessly reload with ?lang=newLang so Google Maps API loads map tiles and labels in the selected language:
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.location.href = url.toString();
  };

  if (!currentLang) {
    return (
      <div className="w-full h-full bg-[#F8FAF8] flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping" />
      </div>
    );
  }

  const currentOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <APIProvider
      key={currentOption.googleMapsCode}
      apiKey={apiKey}
      libraries={['places']}
      language={currentOption.googleMapsCode}
      region={currentOption.regionCode}
    >
      <InnerMapView currentLang={currentLang} onSelectLang={handleSelectLang} />
    </APIProvider>
  );
}
