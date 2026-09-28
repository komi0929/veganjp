'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceSearchProps {
  onSelect: (place: {
    google_place_id: string;
    name: string;
    lat: number;
    lng: number;
  }) => void;
}

interface UnifiedPrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  source: 'new' | 'legacy';
  raw?: any;
}

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<UnifiedPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const placesLib = useMapsLibrary('places');
  const map = useMap();

  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!placesLib) return;
    try {
      if (placesLib.AutocompleteService && !autocompleteService.current) {
        autocompleteService.current = new placesLib.AutocompleteService();
      }
      if (placesLib.PlacesService && !placesService.current) {
        const container = map ? map : document.createElement('div');
        placesService.current = new placesLib.PlacesService(container);
      }
    } catch (e) {
      console.warn('Google Places service init fallback', e);
    }
  }, [placesLib, map]);

  const search = useCallback(
    async (input: string) => {
      if (!input || input.trim().length < 2) {
        setPredictions([]);
        return;
      }

      setIsSearching(true);
      const cleanInput = input.trim();

      // 1. Try modern Places API (New) AutocompleteSuggestion (2025/2026 standard)
      if (placesLib && (placesLib as any).AutocompleteSuggestion) {
        try {
          const res = await (placesLib as any).AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: cleanInput,
            includedRegionCodes: ['jp'],
          });

          if (res && res.suggestions && res.suggestions.length > 0) {
            const list: UnifiedPrediction[] = res.suggestions.map((s: any) => {
              const pred = s.placePrediction;
              return {
                placeId: pred.placeId || Math.random().toString(),
                mainText: pred.mainText?.text || pred.text?.text || cleanInput,
                secondaryText: pred.secondaryText?.text || 'Japan',
                source: 'new',
                raw: pred,
              };
            });
            setPredictions(list);
            setIsSearching(false);
            return;
          }
        } catch (err) {
          // If Places API (New) errors, fall through to legacy or custom
          console.warn('Places API (New) suggestion fallback:', err);
        }
      }

      // 2. Fallback to legacy AutocompleteService if available
      if (autocompleteService.current) {
        try {
          autocompleteService.current.getPlacePredictions(
            {
              input: cleanInput,
              componentRestrictions: { country: 'jp' },
              types: ['restaurant', 'cafe', 'food', 'bakery', 'meal_takeaway'],
            },
            (results: any, status: any) => {
              setIsSearching(false);
              if (status === 'OK' && results && results.length > 0) {
                const list: UnifiedPrediction[] = results.map((r: any) => ({
                  placeId: r.place_id,
                  mainText: r.structured_formatting?.main_text || r.description,
                  secondaryText: r.structured_formatting?.secondary_text || '',
                  source: 'legacy',
                  raw: r,
                }));
                setPredictions(list);
              } else {
                setPredictions([]);
              }
            }
          );
          return;
        } catch (legacyErr) {
          console.warn('Legacy PlacesService fallback:', legacyErr);
        }
      }

      setIsSearching(false);
      setPredictions([]);
    },
    [placesLib]
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 220);
  };

  const handleSelectPrediction = async (pred: UnifiedPrediction) => {
    // If modern Places API
    if (pred.source === 'new' && pred.raw && typeof pred.raw.toPlace === 'function') {
      try {
        const place = pred.raw.toPlace();
        await place.fetchFields({ fields: ['id', 'displayName', 'location'] });
        if (place.location) {
          onSelect({
            google_place_id: place.id || pred.placeId,
            name: place.displayName || pred.mainText,
            lat: place.location.lat(),
            lng: place.location.lng(),
          });
          return;
        }
      } catch (err) {
        console.warn('Error fetching new Place details:', err);
      }
    }

    // If legacy PlacesService
    if (pred.source === 'legacy' && placesService.current) {
      placesService.current.getDetails(
        {
          placeId: pred.placeId,
          fields: ['place_id', 'name', 'geometry'],
        },
        (place: any, status: any) => {
          if (status === 'OK' && place?.geometry?.location) {
            onSelect({
              google_place_id: place.place_id || pred.placeId,
              name: place.name || pred.mainText,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          } else {
            handleCustomSpotSelect(pred.mainText);
          }
        }
      );
      return;
    }

    // Default fallback
    handleCustomSpotSelect(pred.mainText);
  };

  // Custom fallback: Pin using map center or default coordinates
  const handleCustomSpotSelect = (customName: string) => {
    const center = map?.getCenter();
    const lat = center ? center.lat() : 35.6812;
    const lng = center ? center.lng() : 139.7671;
    const customId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    onSelect({
      google_place_id: customId,
      name: customName.trim(),
      lat,
      lng,
    });
  };

  return (
    <div className="space-y-3">
      {/* Modern Search Input Bar (Raycast / Spotlight style) */}
      <div className="relative flex items-center bg-slate-100 rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-botanical-600 focus-within:bg-white transition-all">
        <svg className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search restaurant or cafe in Japan…"
          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setPredictions([]);
            }}
            className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 text-[10px] flex items-center justify-center mr-1"
          >
            ✕
          </button>
        )}
        {isSearching && (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-botanical-600 animate-spin" />
        )}
      </div>

      {/* Predictions List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-hide">
        {predictions.map((pred) => (
          <button
            key={pred.placeId}
            onClick={() => handleSelectPrediction(pred)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 text-xs font-semibold group-hover:bg-botanical-100 group-hover:text-botanical-700 transition-colors">
              📍
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {pred.mainText}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {pred.secondaryText}
              </p>
            </div>
          </button>
        ))}

        {/* Custom Spot Option: NEVER leaves the user stranded! */}
        {query.trim().length >= 2 && (
          <button
            onClick={() => handleCustomSpotSelect(query)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-botanical-50/50 hover:bg-botanical-50 border border-dashed border-botanical-200 text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-botanical-100 flex items-center justify-center text-botanical-700 shrink-0 text-sm font-semibold">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-botanical-900 truncate">
                Pin &quot;{query.trim()}&quot; as custom spot
              </p>
              <p className="text-[11px] text-botanical-700/70 truncate mt-0.5">
                Will be pinned at current map position
              </p>
            </div>
            <span className="text-xs font-bold text-botanical-700 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </button>
        )}
      </div>

      {query.length === 0 && (
        <div className="py-8 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-600">Type restaurant or cafe name in English or Japanese</p>
          <p className="text-[11px] text-slate-400">e.g. Ain Soph, T&apos;s TanTan, Brown Rice Canteen</p>
        </div>
      )}
    </div>
  );
}
