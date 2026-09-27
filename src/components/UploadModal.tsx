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
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
      setError(null);
    } catch {
      setError('Failed to process image. Try another photo.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlace || !imageFile) return;
    setStep('uploading');
    setError(null);

    try {
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
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
      setTimeout(() => onComplete(), 1200);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setStep('photo');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-cream-50/98 backdrop-blur-xl flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-bark-800/8">
        <motion.h2
          className="text-lg font-bold text-bark-800"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {step === 'place' && 'Find the restaurant'}
          {step === 'photo' && 'Share your photo'}
          {step === 'uploading' && 'Uploading…'}
          {step === 'done' && 'Done! 🎉'}
        </motion.h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-bark-800/5 hover:bg-bark-800/10 text-bark-700/60 hover:text-bark-800 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Step 1: Place Search */}
        {step === 'place' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PlaceSearch onSelect={handlePlaceSelect} />
          </motion.div>
        )}

        {/* Step 2: Photo + Text */}
        {step === 'photo' && selectedPlace && (
          <motion.div
            className="space-y-5 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Selected place badge */}
            <div className="flex items-center gap-2 bg-vegan-50 border border-vegan-200 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-vegan-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-vegan-600">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-bark-800 truncate">
                  {selectedPlace.name}
                </p>
              </div>
              <button
                onClick={() => setStep('place')}
                className="text-xs text-vegan-600 hover:text-vegan-700 font-medium"
              >
                Change
              </button>
            </div>

            {/* Image picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {imagePreview ? (
              <motion.div
                className="relative rounded-2xl overflow-hidden aspect-square bg-cream-200"
                layoutId="preview"
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md text-bark-800 text-xs px-3 py-1.5 rounded-full hover:bg-white transition-colors shadow-sm"
                >
                  Change photo
                </button>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-vegan-300 hover:border-vegan-400 flex flex-col items-center justify-center gap-3 text-vegan-500 hover:text-vegan-600 transition-colors bg-vegan-50/50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-sm font-medium">Tap to take or choose a photo</span>
              </motion.button>
            )}

            {/* Text input */}
            <div className="relative">
              <textarea
                value={shortText}
                onChange={(e) => setShortText(e.target.value.slice(0, 140))}
                placeholder="What did you eat? 🌱 (optional)"
                className="w-full bg-white border border-bark-800/10 rounded-xl px-4 py-3 text-bark-800 placeholder-bark-700/30 text-sm resize-none focus:outline-none focus:border-vegan-400 focus:ring-2 focus:ring-vegan-100 transition-all"
                rows={2}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-bark-700/30">
                {shortText.length}/140
              </span>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!imageFile}
              className="w-full py-4 rounded-2xl bg-vegan-500 hover:bg-vegan-600 disabled:bg-bark-800/10 disabled:text-bark-700/30 text-white font-semibold text-base transition-colors shadow-md shadow-vegan-500/15 disabled:shadow-none"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Share on Map 📍
            </motion.button>
          </motion.div>
        )}

        {/* Uploading state */}
        {step === 'uploading' && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-16 h-16 border-4 border-vegan-200 border-t-vegan-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-bark-700/60 text-sm">Uploading your photo…</p>
          </motion.div>
        )}

        {/* Done state */}
        {step === 'done' && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-20 h-20 bg-vegan-100 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-vegan-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <p className="text-bark-800 font-semibold text-lg">Photo shared!</p>
            <p className="text-bark-700/50 text-sm">Your pin is now on the map</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
