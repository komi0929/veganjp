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

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Safely retrieve places library and map
  const placesLib = useMapsLibrary('places');
  const map = useMap();

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!placesLib) return;
    try {
      if (!autocompleteService.current) {
        autocompleteService.current = new placesLib.AutocompleteService();
      }
      if (!placesService.current) {
        // Fallback to dummy div if map is not attached
        const container = map ? map : document.createElement('div');
        placesService.current = new placesLib.PlacesService(container);
      }
    } catch (e) {
      console.warn('Google Places service init fallback', e);
    }
  }, [placesLib, map]);

  const search = useCallback(
    (input: string) => {
      if (!autocompleteService.current || input.length < 2) {
        setPredictions([]);
        return;
      }
      setIsSearching(true);
      autocompleteService.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'jp' },
          types: ['restaurant', 'cafe', 'food', 'bakery', 'meal_takeaway'],
        },
        (results, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    },
    []
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['place_id', 'name', 'geometry'],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            onSelect({
              google_place_id: place.place_id!,
              name: place.name || prediction.structured_formatting.main_text,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    } else {
      onSelect({
        google_place_id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        lat: 35.6812,
        lng: 139.7671,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Modern Search Input Bar (Raycast / Spotlight style) */}
      <div className="relative flex items-center bg-slate-100 rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-botanical-500 focus-within:bg-white transition-all">
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
        {isSearching && (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-botanical-600 animate-spin" />
        )}
      </div>

      {/* Autocomplete Predictions List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-hide">
        {predictions.map((pred) => (
          <button
            key={pred.place_id}
            onClick={() => handleSelect(pred)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 text-xs font-semibold group-hover:bg-botanical-100 group-hover:text-botanical-700 transition-colors">
              📍
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {pred.structured_formatting.main_text}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {pred.structured_formatting.secondary_text}
              </p>
            </div>
          </button>
        ))}
      </div>

      {query.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">Search by restaurant name in English or Japanese</p>
        </div>
      )}
    </div>
  );
}
