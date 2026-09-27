'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';

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
  const placesLib = useMapsLibrary('places');
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const map = useMap();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!placesLib) return;
    autocompleteService.current = new placesLib.AutocompleteService();
  }, [placesLib]);

  useEffect(() => {
    if (!map || !placesLib) return;
    placesService.current = new placesLib.PlacesService(map);
  }, [map, placesLib]);

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
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

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
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-bark-700/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search for a restaurant in Japan…"
          className="w-full bg-white border border-bark-800/10 rounded-2xl pl-12 pr-4 py-4 text-bark-800 placeholder-bark-700/30 text-base focus:outline-none focus:border-vegan-400 focus:ring-2 focus:ring-vegan-100 transition-all shadow-sm"
          autoFocus
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <motion.div
              className="w-5 h-5 border-2 border-vegan-200 border-t-vegan-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-1">
        {predictions.map((pred, i) => (
          <motion.button
            key={pred.place_id}
            onClick={() => handleSelect(pred)}
            className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-vegan-50 text-left transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <div className="mt-0.5 w-8 h-8 rounded-full bg-vegan-100 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-vegan-600">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-bark-800 truncate">
                {pred.structured_formatting.main_text}
              </p>
              <p className="text-xs text-bark-700/40 truncate mt-0.5">
                {pred.structured_formatting.secondary_text}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {query.length > 0 && predictions.length === 0 && !isSearching && (
        <div className="text-center py-8 text-bark-700/30 text-sm">
          No restaurants found. Try a different search.
        </div>
      )}

      {query.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🌱</div>
          <p className="text-bark-700/30 text-sm">
            Type a restaurant name or area to start
          </p>
        </div>
      )}
    </div>
  );
}
