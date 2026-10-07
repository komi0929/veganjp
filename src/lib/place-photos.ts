// 2026 Modern Google Places API (New) Real Photography & Meta Engine for vegan.jp
// Powered by google.maps.places.Place.searchByText & Place.fetchFields

import { useState, useEffect } from 'react';
import type { PlaceWithPosts } from './types';

export interface GooglePlaceMeta {
  placeId?: string;
  displayName?: string;
  photos: string[];
  rating?: number;
  userRatingsTotal?: number;
  isOpenNow?: boolean;
  phoneNumber?: string;
  website?: string;
  loading: boolean;
}

const MEMORY_CACHE = new Map<string, GooglePlaceMeta>();
const LOCAL_STORAGE_KEY = 'vegan_jp_google_place_cache_v3';

// Load existing cache from localStorage if available
function loadPersistentCache(): Record<string, Partial<GooglePlaceMeta>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function savePersistentCache(key: string, data: GooglePlaceMeta) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPersistentCache();
    current[key] = {
      placeId: data.placeId,
      displayName: data.displayName,
      photos: data.photos,
      rating: data.rating,
      userRatingsTotal: data.userRatingsTotal,
      isOpenNow: data.isOpenNow,
      phoneNumber: data.phoneNumber,
      website: data.website,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {}
}

let placesPromise: Promise<any> | null = null;

export async function ensureGooglePlaces(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).google?.maps?.importLibrary) {
    try {
      const { Place } = await (window as any).google.maps.importLibrary('places');
      return Place;
    } catch (e) {
      console.warn('Error importing places library', e);
    }
  }

  if (placesPromise) return placesPromise;

  placesPromise = new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if ((window as any).google?.maps?.importLibrary) {
        clearInterval(interval);
        try {
          const { Place } = await (window as any).google.maps.importLibrary('places');
          resolve(Place);
        } catch (e) {
          resolve(null);
        }
      } else if (attempts > 50) {
        clearInterval(interval);
        resolve(null);
      }
    }, 200);
  });

  return placesPromise;
}

export function cleanSearchName(name: string): string {
  // Remove parenthetical noise like （完全菜食） or （ヴィーガン対応）
  return name.replace(/（.*?）|\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Fetch real Google Place details using the modern Places API (New)
 */
export async function fetchGooglePlaceMeta(place: PlaceWithPosts): Promise<GooglePlaceMeta> {
  const cacheKey = place.google_place_id || place.id;
  
  // 1. Check memory cache (only if it has valid photos or was successfully fetched)
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // 2. Check localStorage cache
  const disk = loadPersistentCache();
  if (disk[cacheKey] && disk[cacheKey].photos && disk[cacheKey].photos!.length > 0) {
    const cached: GooglePlaceMeta = {
      ...disk[cacheKey],
      photos: disk[cacheKey].photos!,
      loading: false,
    };
    MEMORY_CACHE.set(cacheKey, cached);
    return cached;
  }

  // 3. User uploaded posts if present
  const userPhotos = place.posts.map(p => p.image_url).filter(Boolean);

  try {
    const Place = await ensureGooglePlaces();
    if (!Place) {
      return { photos: userPhotos, loading: false };
    }

    let googlePlace: any = null;

    // A. If place.google_place_id is a real Google Place ID (e.g. starts with ChIJ)
    if (place.google_place_id && place.google_place_id.startsWith('ChIJ')) {
      const p = new Place({ id: place.google_place_id });
      await p.fetchFields({
        fields: ['id', 'displayName', 'photos', 'rating', 'userRatingCount', 'currentOpeningHours', 'websiteURI', 'nationalPhoneNumber'],
      });
      googlePlace = p;
    } else {
      // B. Search by clean text query with location bias
      const cleaned = cleanSearchName(place.name);
      const query = `${cleaned} ${place.area || place.prefecture || ''}`.trim();
      
      const request: any = {
        textQuery: query,
        fields: ['id', 'displayName', 'photos', 'rating', 'userRatingCount', 'currentOpeningHours', 'websiteURI', 'nationalPhoneNumber'],
        maxResultCount: 1,
      };

      if (place.lat && place.lng) {
        request.locationBias = { lat: place.lat, lng: place.lng };
      }

      const { places } = await Place.searchByText(request);
      if (places && places.length > 0) {
        googlePlace = places[0];
      }
    }

    if (googlePlace) {
      const realPhotos: string[] = [];
      if (googlePlace.photos && Array.isArray(googlePlace.photos)) {
        for (const photo of googlePlace.photos.slice(0, 8)) {
          try {
            const uri = photo.getURI({ maxWidth: 1200, maxHeight: 900 });
            if (uri) realPhotos.push(uri);
          } catch (e) {}
        }
      }

      const finalPhotos = Array.from(new Set([...userPhotos, ...realPhotos]));

      const meta: GooglePlaceMeta = {
        placeId: googlePlace.id,
        displayName: googlePlace.displayName,
        photos: finalPhotos,
        rating: googlePlace.rating,
        userRatingsTotal: googlePlace.userRatingCount,
        isOpenNow: googlePlace.currentOpeningHours?.openNow,
        phoneNumber: googlePlace.nationalPhoneNumber,
        website: googlePlace.websiteURI,
        loading: false,
      };

      MEMORY_CACHE.set(cacheKey, meta);
      savePersistentCache(cacheKey, meta);
      return meta;
    }
  } catch (err) {
    console.warn('Google Places API (New) fetch error for', place.name, err);
  }

  const fallback: GooglePlaceMeta = {
    photos: userPhotos,
    loading: false,
  };
  return fallback;
}

/**
 * Hook to get real-time Google details for the selected place in BottomSheet
 */
export function useGooglePlaceDetails(
  place: PlaceWithPosts | null,
  map?: google.maps.Map | null
): GooglePlaceMeta {
  const [meta, setMeta] = useState<GooglePlaceMeta>(() => {
    if (!place) return { photos: [], loading: false };
    const cacheKey = place.google_place_id || place.id;
    if (MEMORY_CACHE.has(cacheKey)) return MEMORY_CACHE.get(cacheKey)!;
    const disk = loadPersistentCache();
    if (disk[cacheKey]?.photos?.length) {
      return { ...disk[cacheKey], photos: disk[cacheKey].photos!, loading: false };
    }
    const userPhotos = place.posts.map(p => p.image_url).filter(Boolean);
    return { photos: userPhotos, loading: true };
  });

  useEffect(() => {
    if (!place) {
      setMeta({ photos: [], loading: false });
      return;
    }

    let active = true;
    const cacheKey = place.google_place_id || place.id;

    if (MEMORY_CACHE.has(cacheKey)) {
      setMeta(MEMORY_CACHE.get(cacheKey)!);
      return;
    }

    fetchGooglePlaceMeta(place).then((res) => {
      if (active) {
        setMeta(res);
      }
    });

    return () => {
      active = false;
    };
  }, [place?.google_place_id, place?.name]);

  return meta;
}

/**
 * Hook for carousel and markers to fetch and display the real Google photo
 */
export function useRealPlacePhoto(place: PlaceWithPosts): string | null {
  const cacheKey = place.google_place_id || place.id;
  const userPhoto = place.posts[0]?.image_url;

  const [photo, setPhoto] = useState<string | null>(() => {
    if (userPhoto) return userPhoto;
    if (MEMORY_CACHE.has(cacheKey)) {
      return MEMORY_CACHE.get(cacheKey)?.photos[0] || null;
    }
    const disk = loadPersistentCache();
    return disk[cacheKey]?.photos?.[0] || null;
  });

  useEffect(() => {
    if (photo && photo !== userPhoto) return;
    let active = true;

    fetchGooglePlaceMeta(place).then((meta) => {
      if (active && meta.photos.length > 0) {
        setPhoto(meta.photos[0]);
      }
    });

    return () => {
      active = false;
    };
  }, [cacheKey, place]);

  return photo;
}
