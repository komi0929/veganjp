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
    if (file.size > 20 * 1024 * 1024) {
      setError('Please choose an image under 20MB');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
      setError(null);
    } catch {
      setError('Image compression failed. Please try another photo.');
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
      setTimeout(() => onComplete(), 1100);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setStep('photo');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[92vh]"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      >
        {/* Navigation Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-botanical-600 block">
              Frictionless Upload · No Sign-Up
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {step === 'place' && 'Select Restaurant'}
              {step === 'photo' && 'Add Dish Photo'}
              {step === 'uploading' && 'Planting on Map…'}
              {step === 'done' && 'Planted Successfully ✨'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Body */}
        <div className="p-6 overflow-y-auto scrollbar-hide">
          {step === 'place' && (
            <PlaceSearch onSelect={handlePlaceSelect} />
          )}

          {step === 'photo' && selectedPlace && (
            <div className="space-y-5">
              {/* Selected Place Badge */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Target spot</span>
                  <p className="text-sm font-bold text-slate-900 truncate">{selectedPlace.name}</p>
                </div>
                <button
                  onClick={() => setStep('place')}
                  className="text-xs font-semibold text-botanical-600 hover:underline shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Photo Box */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md transition-colors"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 hover:border-botanical-400 bg-slate-50/50 hover:bg-botanical-50/20 flex flex-col items-center justify-center gap-2.5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700 text-xl group-hover:scale-110 transition-transform">
                    📸
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">Tap to upload dish photo</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Auto-converted to modern WebP</p>
                  </div>
                </button>
              )}

              {/* Note Input */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 focus-within:border-botanical-500 transition-colors">
                <input
                  type="text"
                  value={shortText}
                  onChange={(e) => setShortText(e.target.value.slice(0, 140))}
                  placeholder="Notes about this vegan dish (e.g. Soy milk tantanmen)"
                  className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</p>
              )}

              {/* Action */}
              <button
                onClick={handleSubmit}
                disabled={!imageFile}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-botanical-900 text-white text-xs font-bold tracking-wide shadow-pill disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                Publish to Live Map
              </button>
            </div>
          )}

          {step === 'uploading' && (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-botanical-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Connecting with map coordinates…</p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-botanical-100 text-botanical-700 flex items-center justify-center text-xl mx-auto">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-900">Spot Rooted!</h3>
              <p className="text-xs text-slate-500">Your memory is now visible to all travelers.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
