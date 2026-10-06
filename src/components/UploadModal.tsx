'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { addMyPostId } from '@/lib/local-posts';
import { compressImage } from '@/lib/compress-image';
import { showToast } from './Toast';
import { v4 as uuidv4 } from 'uuid';
import PlaceSearch from './PlaceSearch';
import { PlaceWithPosts } from '@/lib/types';

interface UploadModalProps {
  onClose: () => void;
  onComplete?: () => void;
  onSuccess?: () => void;
  initialPlace?: PlaceWithPosts | null;
}

interface SelectedPlace {
  google_place_id: string;
  name: string;
  lat: number;
  lng: number;
}

const DIETARY_TAGS = [
  '🌱 100% Vegan',
  '🥗 Vegan Options',
  '🍜 Vegan Ramen',
  '🍱 Shojin / Traditional',
  '☕ Cafe & Sweets',
  '🧄 No Garlic/Onion (五葷)',
  '🌾 Gluten-Free Option',
  '🇬🇧 English Menu',
];

export default function UploadModal({ onClose, onComplete, onSuccess, initialPlace }: UploadModalProps) {
  const [step, setStep] = useState<'place' | 'photo' | 'uploading' | 'done'>(
    initialPlace ? 'photo' : 'place'
  );
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    initialPlace
      ? {
          google_place_id: initialPlace.google_place_id,
          name: initialPlace.name,
          lat: initialPlace.lat,
          lng: initialPlace.lng,
        }
      : null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shortText, setShortText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePlaceSelect = useCallback((place: SelectedPlace) => {
    setSelectedPlace(place);
    setStep('photo');
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError('Please choose an image under 25MB');
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

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
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

      const combinedText = [
        ...selectedTags,
        shortText.trim(),
      ]
        .filter(Boolean)
        .join(' · ');

      const postId = uuidv4();
      const { error: postError } = await supabase.from('posts').insert({
        id: postId,
        google_place_id: selectedPlace.google_place_id,
        image_url: imageUrl,
        short_text: combinedText,
      });

      if (postError) throw postError;

      addMyPostId(postId);
      showToast('Spot successfully planted on live map!', '🌱');

      setStep('done');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else if (onComplete) onComplete();
      }, 1000);
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
              Zero Login · Instant Community Share
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {step === 'place' && '1. Select Restaurant'}
              {step === 'photo' && '2. Add Dish Photo & Details'}
              {step === 'uploading' && 'Planting on Map…'}
              {step === 'done' && 'Planted Successfully ✨'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Body */}
        <div className="p-6 overflow-y-auto scrollbar-hide pb-8">
          {step === 'place' && (
            <PlaceSearch onSelect={handlePlaceSelect} />
          )}

          {step === 'photo' && selectedPlace && (
            <div className="space-y-4">
              {/* Selected Place Badge */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Spot</span>
                  <p className="text-sm font-bold text-slate-900 truncate">{selectedPlace.name}</p>
                </div>
                <button
                  onClick={() => setStep('place')}
                  className="text-xs font-semibold text-botanical-700 hover:underline shrink-0"
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
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md transition-colors"
                  >
                    Change Photo
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
                    <p className="text-xs font-bold text-slate-800">Tap to choose dish photo</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Camera or library · Auto-compressed to WebP</p>
                  </div>
                </button>
              )}

              {/* Inbound Vegan Dietary Tags (Crucial for Japan travel) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Dietary & Facility Badges
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-botanical-700 text-white border-botanical-800 font-semibold shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 font-medium'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note Input */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 focus-within:border-botanical-500 transition-colors">
                <input
                  type="text"
                  value={shortText}
                  onChange={(e) => setShortText(e.target.value.slice(0, 140))}
                  placeholder="Additional notes (e.g. Rich sesame broth, friendly English-speaking staff)"
                  className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</p>
              )}

              {/* Action Button */}
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
