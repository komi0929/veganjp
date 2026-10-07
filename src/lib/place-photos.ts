// 2026 World-Class Culinary Photography Engine for vegan.jp
// Combines Google Places live photo fetch + curated ultra-high-definition plant-based food imagery

import { useState, useEffect } from 'react';
import type { PlaceWithPosts } from './types';

// Curated high-resolution plant-based cuisine photography bank
// Each photo is hand-selected to look appetizing, professional, and authentic to Japan's dining scene
export const GENRE_PHOTOS: Record<string, string[]> = {
  'ラーメン': [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1000&q=85',
  ],
  'Ramen': [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1000&q=85',
  ],
  'カフェ': [
    'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1000&q=85',
  ],
  'Cafe & Bakery': [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85',
  ],
  '和食・精進': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=85',
  ],
  'Traditional / Shojin Washoku': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=85',
  ],
  'Traditional Shojin & Washoku': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=85',
  ],
  'バーガー': [
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1000&q=85',
  ],
  'Burgers & Casual': [
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1000&q=85',
  ],
  'Burgers & Casual Dining': [
    'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1000&q=85',
  ],
  'カレー': [
    'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1000&q=85',
  ],
  'Curry & Spice': [
    'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1000&q=85',
  ],
  'イタリアン・ピザ': [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1000&q=85',
  ],
  'Pizza & Italian': [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1000&q=85',
  ],
  '中華・台湾素食': [
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=85',
  ],
  'Asian & Dim Sum': [
    'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=85',
  ],
  'マクロビ・オーガニック': [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1000&q=85',
  ],
  'Macrobiotic & Organic': [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1000&q=85',
  ],
  'ホテル': [
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85',
  ],
  '居酒屋・バー': [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=85',
  ],
};

// Hand-curated standout spot photos
export const SPOT_FEATURED_PHOTOS: Record<string, string[]> = {
  'soystories-yakuin': [
    'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=1000&q=85', // Craft ice cream
    'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=1000&q=85', // Waffles
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85', // Cafe cozy
  ],
};

const DEFAULT_FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85';

/**
 * Returns a stable curated list of photos for any place
 */
export function getCuratedPhotosForPlace(place: PlaceWithPosts): string[] {
  // 1. If community or user uploaded posts exist, use those first
  const uploaded = place.posts.map(p => p.image_url).filter(Boolean);
  if (uploaded.length > 0) {
    return uploaded;
  }

  // 2. Specific standout place photos
  if (SPOT_FEATURED_PHOTOS[place.google_place_id]) {
    return SPOT_FEATURED_PHOTOS[place.google_place_id];
  }

  // 3. Match by genre
  const genreKey = place.genre_en || place.genre || '';
  if (GENRE_PHOTOS[genreKey] && GENRE_PHOTOS[genreKey].length > 0) {
    return GENRE_PHOTOS[genreKey];
  }

  if (place.genre && GENRE_PHOTOS[place.genre]) {
    return GENRE_PHOTOS[place.genre];
  }

  return [DEFAULT_FALLBACK_PHOTO];
}

/**
 * Live Google Places Details & Photos hook
 * Fetches real-time photos, star ratings, and open status directly from Google Places API
 */
export interface GooglePlaceMeta {
  photos: string[];
  rating?: number;
  userRatingsTotal?: number;
  isOpenNow?: boolean;
  weekdayHours?: string[];
  phoneNumber?: string;
  website?: string;
  loading: boolean;
}

const memoryCache = new Map<string, GooglePlaceMeta>();

export function useGooglePlaceDetails(
  place: PlaceWithPosts | null,
  placesLibrary: google.maps.PlacesLibrary | null,
  map: google.maps.Map | null
): GooglePlaceMeta {
  const [meta, setMeta] = useState<GooglePlaceMeta>(() => {
    if (!place) return { photos: [], loading: false };
    const cached = memoryCache.get(place.google_place_id);
    if (cached) return cached;
    return { photos: getCuratedPhotosForPlace(place), loading: true };
  });

  useEffect(() => {
    if (!place) {
      setMeta({ photos: [], loading: false });
      return;
    }

    // Check memory cache
    const cached = memoryCache.get(place.google_place_id);
    if (cached) {
      setMeta(cached);
      return;
    }

    const fallbackPhotos = getCuratedPhotosForPlace(place);
    setMeta({ photos: fallbackPhotos, loading: true });

    if (!placesLibrary || typeof google === 'undefined' || !google.maps || !google.maps.places) {
      setMeta({ photos: fallbackPhotos, loading: false });
      return;
    }

    try {
      const dummyDiv = document.createElement('div');
      const service = new placesLibrary.PlacesService(map || dummyDiv);

      const handleDetailsResult = (result: any, status: any) => {
        if ((status === 'OK' || status === placesLibrary.PlacesServiceStatus.OK) && result) {
          const googlePhotos: string[] = [];
          if (result.photos && result.photos.length > 0) {
            for (const p of result.photos.slice(0, 8)) {
              try {
                const url = typeof p.getUrl === 'function' ? p.getUrl({ maxWidth: 1200, maxHeight: 900 }) : p.url;
                if (url) googlePhotos.push(url);
              } catch (e) {}
            }
          }

          const combinedPhotos = googlePhotos.length > 0 ? googlePhotos : fallbackPhotos;
          const newMeta: GooglePlaceMeta = {
            photos: combinedPhotos,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            isOpenNow: result.opening_hours?.isOpen ? result.opening_hours.isOpen() : undefined,
            weekdayHours: result.opening_hours?.weekday_text,
            phoneNumber: result.formatted_phone_number,
            website: result.website,
            loading: false,
          };

          memoryCache.set(place.google_place_id, newMeta);
          setMeta(newMeta);
        } else {
          // Fallback to curated
          const fallbackMeta: GooglePlaceMeta = {
            photos: fallbackPhotos,
            loading: false,
          };
          memoryCache.set(place.google_place_id, fallbackMeta);
          setMeta(fallbackMeta);
        }
      };

      // If place.google_place_id is a real Google Place ID (starts with ChIJ)
      if (place.google_place_id && place.google_place_id.startsWith('ChIJ')) {
        service.getDetails(
          {
            placeId: place.google_place_id,
            fields: ['photos', 'rating', 'user_ratings_total', 'opening_hours', 'formatted_phone_number', 'website'],
          },
          handleDetailsResult
        );
      } else {
        // Search by query (Name + Area)
        const query = `${place.name} ${place.area || ''} ${place.prefecture || ''}`.trim();
        service.findPlaceFromQuery(
          {
            query,
            fields: ['place_id', 'photos', 'rating', 'user_ratings_total', 'opening_hours'],
          },
          (results: any, status: any) => {
            if ((status === 'OK' || status === placesLibrary.PlacesServiceStatus.OK) && results && results[0]?.place_id) {
              service.getDetails(
                {
                  placeId: results[0].place_id,
                  fields: ['photos', 'rating', 'user_ratings_total', 'opening_hours', 'formatted_phone_number', 'website'],
                },
                handleDetailsResult
              );
            } else {
              handleDetailsResult(null, status);
            }
          }
        );
      }
    } catch (e) {
      setMeta({ photos: fallbackPhotos, loading: false });
    }
  }, [place?.google_place_id, placesLibrary, map]);

  return meta;
}
