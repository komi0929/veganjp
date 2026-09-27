'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { addMyPostId } from '@/lib/local-posts';
import { compressImage } from '@/lib/compress-image';
import { v4 as uuidv4 } from 'uuid';
import PlaceSearch from './PlaceSearch';

interface UploadModalProps {
  onClose: () => void;
  onComplete: () => void;
}

interface SelectedPlace {
  google_place_id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function UploadModal({ onClose, onComplete }: UploadModalProps) {
  const [step, setStep] = useState<'place' | 'photo' | 'uploading' | 'done'>('place');
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shortText, setShortText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlaceSelect = useCallback((place: SelectedPlace) => {
    setSelectedPlace(place);
    setStep('photo');
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Please choose a photo under 15MB');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
      setError(null);
    } catch {
      setError('Could not process photo. Please try another one.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlace || !imageFile) return;
    setStep('uploading');
    setError(null);

    try {
      const fileExt = imageFile.name.split('.').pop() || 'webp';
      const fileName = `${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      await supabase.from('places').upsert(
        {
          google_place_id: selectedPlace.google_place_id,
          name: selectedPlace.name,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
        },
        { onConflict: 'google_place_id' }
      );

      const postId = uuidv4();
      const { error: postError } = await supabase.from('posts').insert({
        id: postId,
        google_place_id: selectedPlace.google_place_id,
        image_url: imageUrl,
        short_text: shortText.trim(),
      });

      if (postError) throw postError;

      addMyPostId(postId);

      setStep('done');
      setTimeout(() => onComplete(), 1400);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setStep('photo');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-2xl flex flex-col justify-between"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-soil-200/50">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-vegan-700">
            Frictionless Sharing
          </span>
          <h2 className="text-xl font-serif font-bold text-bark-900 leading-tight">
            {step === 'place' && 'Find the Restaurant'}
            {step === 'photo' && 'Add Your Photo'}
            {step === 'uploading' && 'Planting in Ground…'}
            {step === 'done' && 'A New Flower Bloomed! 🎉'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-soil-100 hover:bg-soil-200 text-bark-700 transition-colors shadow-clay-sm"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Main Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg w-full mx-auto">
        {step === 'place' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PlaceSearch onSelect={handlePlaceSelect} />
          </motion.div>
        )}

        {step === 'photo' && selectedPlace && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Selected Spot Chip */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200 shadow-clay-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-full bg-vegan-100 flex items-center justify-center text-sm shadow-inner">
                  📍
                </span>
                <span className="text-sm font-serif font-bold text-bark-900 truncate">
                  {selectedPlace.name}
                </span>
              </div>
              <button
                onClick={() => setStep('place')}
                className="text-xs font-semibold text-vegan-700 hover:underline px-2"
              >
                Change
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Photo Selection / Preview Area (Polaroid style) */}
            {imagePreview ? (
              <div className="bg-white p-4 rounded-3xl shadow-polaroid border border-stone-200">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-200 shadow-inner">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md shadow-md transition-all"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-vegan-300 hover:border-vegan-500 bg-white/60 hover:bg-vegan-50/50 flex flex-col items-center justify-center gap-3 transition-all p-6 shadow-clay-sm group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-14 h-14 rounded-full bg-vegan-100 text-vegan-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                  📷
                </div>
                <div className="text-center">
                  <p className="text-sm font-serif font-bold text-bark-900">
                    Snap or choose a photo
                  </p>
                  <p className="text-xs text-bark-600/60 mt-1">
                    Auto-compressed to WebP for zero lag
                  </p>
                </div>
              </motion.button>
            )}

            {/* Short Caption Input */}
            <div className="relative bg-white p-3 rounded-2xl border border-stone-200 shadow-clay-sm">
              <textarea
                value={shortText}
                onChange={(e) => setShortText(e.target.value.slice(0, 140))}
                placeholder="What dish was it? 🌱 (optional notes for travelers)"
                className="w-full bg-transparent text-sm text-bark-900 placeholder-bark-600/40 resize-none focus:outline-none"
                rows={2}
              />
              <div className="text-right text-[10px] text-bark-600/40 font-mono">
                {shortText.length}/140
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            {/* Submit Action */}
            <motion.button
              onClick={handleSubmit}
              disabled={!imageFile}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-vegan-500 to-vegan-700 text-white font-serif font-bold text-base shadow-clay-md hover:brightness-105 disabled:opacity-40 disabled:pointer-events-none transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Plant on Map 🌸
            </motion.button>
          </motion.div>
        )}

        {step === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-vegan-200 border-t-vegan-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-base font-serif font-bold text-bark-900">
              Planting your photo into the garden…
            </p>
          </div>
        )}

        {step === 'done' && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-20 h-20 bg-vegan-100 rounded-full flex items-center justify-center text-4xl shadow-clay-md">
              🌸
            </div>
            <h3 className="text-2xl font-serif font-bold text-bark-900">
              Planted Successfully!
            </h3>
            <p className="text-sm text-bark-600">
              Your memory is now rooted in the Hakoniwa map.
            </p>
          </motion.div>
        )}
      </div>

      <div className="py-2 text-center text-[10px] text-bark-600/40">
        No account required · Pure community love
      </div>
    </motion.div>
  );
}
