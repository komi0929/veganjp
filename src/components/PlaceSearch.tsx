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
    debounceRef.current = setTimeout(() => search(value), 280);
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
      // Fallback for demo when Google Places API service is not loaded
      onSelect({
        google_place_id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        lat: 35.6812 + (Math.random() - 0.5) * 0.05,
        lng: 139.7671 + (Math.random() - 0.5) * 0.05,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search restaurant or cafe in Japan…"
          className="w-full bg-white border border-stone-200/80 rounded-2xl pl-12 pr-10 py-4 text-bark-900 placeholder-bark-600/40 text-base shadow-clay-sm focus:outline-none focus:ring-2 focus:ring-vegan-400 focus:border-transparent transition-all"
          autoFocus
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-bark-600/40 pointer-events-none">
          🔍
        </span>
        {isSearching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-vegan-300 border-t-vegan-600 animate-spin" />
        )}
      </div>

      {/* Autocomplete Predictions */}
      <div className="space-y-2">
        {predictions.map((pred, i) => (
          <motion.button
            key={pred.place_id}
            onClick={() => handleSelect(pred)}
            className="w-full flex items-start gap-3 p-3.5 bg-white hover:bg-vegan-50/70 border border-stone-200/60 rounded-2xl text-left transition-all shadow-clay-sm group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <span className="w-8 h-8 rounded-full bg-vegan-100 flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform">
              🌿
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif font-bold text-bark-900 group-hover:text-vegan-800 transition-colors truncate">
                {pred.structured_formatting.main_text}
              </p>
              <p className="text-xs text-bark-600/60 truncate mt-0.5">
                {pred.structured_formatting.secondary_text}
              </p>
            </div>
            <span className="text-xs text-vegan-600 opacity-0 group-hover:opacity-100 transition-opacity self-center">
              Select →
            </span>
          </motion.button>
        ))}
      </div>

      {query.length > 0 && predictions.length === 0 && !isSearching && (
        <div className="text-center py-10 bg-white/50 rounded-2xl border border-stone-200/60">
          <p className="text-sm text-bark-600 font-serif">No spots found matching "{query}"</p>
          <p className="text-xs text-bark-600/50 mt-1">Try typing the English or Japanese name</p>
        </div>
      )}

      {query.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <span className="text-4xl block">🌱</span>
          <p className="text-sm font-serif font-bold text-bark-900">
            Type a restaurant to plant
          </p>
          <p className="text-xs text-bark-600/50 max-w-xs mx-auto">
            From ramen counters in Tokyo to temple tea houses in Kyoto
          </p>
        </div>
      )}
    </div>
  );
}
