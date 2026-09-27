'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PlantMarkerProps {
  count: number;
  imageUrl?: string;
  onClick?: () => void;
}

/**
 * 3D Claymorphic Plant Artworks
 * Hand-crafted layered vectors for tactile Hakoniwa feeling
 */
function PlantGraphic({ stage }: { stage: number }) {
  switch (stage) {
    case 1:
      // Sprout: Plump tiny two-leaf sprout
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-[0_4px_6px_rgba(40,30,15,0.18)]">
          <defs>
            <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a3db70" />
              <stop offset="60%" stopColor="#67b243" />
              <stop offset="100%" stopColor="#458a27" />
            </linearGradient>
            <linearGradient id="stemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#82c753" />
              <stop offset="100%" stopColor="#458a27" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path d="M 20 38 Q 20 28 20 22" stroke="url(#stemGrad)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* Left leaf */}
          <path d="M 20 24 C 11 20 10 11 18 13 C 21 14 20 22 20 24 Z" fill="url(#leafGrad1)" />
          {/* Right leaf */}
          <path d="M 20 23 C 29 18 31 9 23 11 C 19 13 20 21 20 23 Z" fill="url(#leafGrad1)" />
          {/* Dew specular dot */}
          <circle cx="16" cy="14" r="1.5" fill="#ffffff" opacity="0.75" />
        </svg>
      );
    case 2:
      // Herb / Bush: Lush multi-leaf sprig
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[0_5px_8px_rgba(40,30,15,0.22)]">
          <defs>
            <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b4e578" />
              <stop offset="50%" stopColor="#5fab3a" />
              <stop offset="100%" stopColor="#3d7e22" />
            </linearGradient>
          </defs>
          <path d="M 24 44 Q 24 30 24 16" stroke="#488b28" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Lower leaves */}
          <path d="M 24 34 C 13 32 11 20 22 23 C 24 24 24 32 24 34 Z" fill="url(#leafGrad2)" />
          <path d="M 24 32 C 35 30 37 18 26 21 C 24 22 24 30 24 32 Z" fill="url(#leafGrad2)" />
          {/* Top leaves */}
          <path d="M 24 22 C 16 16 15 6 23 9 C 25 10 24 20 24 22 Z" fill="url(#leafGrad2)" />
          <path d="M 24 20 C 32 14 33 4 25 7 C 23 8 24 18 24 20 Z" fill="url(#leafGrad2)" />
          {/* Center crown */}
          <circle cx="24" cy="14" r="3" fill="#c3ee88" />
        </svg>
      );
    case 3:
      // Blossom: Spring pink & gold wildflower
      return (
        <svg viewBox="0 0 52 52" className="w-full h-full drop-shadow-[0_6px_10px_rgba(40,30,15,0.24)]">
          <defs>
            <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd4e3" />
              <stop offset="50%" stopColor="#f79bbd" />
              <stop offset="100%" stopColor="#e26694" />
            </linearGradient>
            <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="100%" stopColor="#f3b83f" />
            </linearGradient>
          </defs>
          <path d="M 26 48 Q 26 36 26 28" stroke="#4f8f2e" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Small side leaf */}
          <path d="M 26 38 C 18 36 17 28 25 30 Z" fill="#67b243" />
          {/* 5 Plump clay petals */}
          <circle cx="26" cy="16" r="8" fill="url(#petalGrad)" />
          <circle cx="16" cy="23" r="8" fill="url(#petalGrad)" />
          <circle cx="36" cy="23" r="8" fill="url(#petalGrad)" />
          <circle cx="20" cy="33" r="8" fill="url(#petalGrad)" />
          <circle cx="32" cy="33" r="8" fill="url(#petalGrad)" />
          {/* Glowing blossom center */}
          <circle cx="26" cy="25" r="7" fill="url(#centerGrad)" />
          <circle cx="24.5" cy="23.5" r="2" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    case 4:
      // Vibrant Flower: Rich camellia / hibiscus bloom
      return (
        <svg viewBox="0 0 58 58" className="w-full h-full drop-shadow-[0_8px_14px_rgba(40,30,15,0.26)]">
          <defs>
            <linearGradient id="camelliaPetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8a7a" />
              <stop offset="60%" stopColor="#ee4b5a" />
              <stop offset="100%" stopColor="#be203d" />
            </linearGradient>
            <radialGradient id="sunPollen" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fff7b8" />
              <stop offset="100%" stopColor="#e59819" />
            </radialGradient>
          </defs>
          <path d="M 29 54 Q 28 42 29 32" stroke="#3d7224" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {/* Deep green backdrop leaves */}
          <path d="M 12 30 C 18 20 28 26 29 32 C 18 36 12 30 12 30 Z" fill="#447e28" />
          <path d="M 46 30 C 40 20 30 26 29 32 C 40 36 46 30 46 30 Z" fill="#447e28" />
          {/* Big layered petals */}
          <circle cx="29" cy="17" r="10" fill="url(#camelliaPetal)" />
          <circle cx="17" cy="26" r="10" fill="url(#camelliaPetal)" />
          <circle cx="41" cy="26" r="10" fill="url(#camelliaPetal)" />
          <circle cx="22" cy="38" r="10" fill="url(#camelliaPetal)" />
          <circle cx="36" cy="38" r="10" fill="url(#camelliaPetal)" />
          {/* Flower core with pollen studs */}
          <circle cx="29" cy="28" r="8" fill="url(#sunPollen)" />
          <circle cx="27" cy="26" r="1.5" fill="#78350f" opacity="0.4" />
          <circle cx="31" cy="27" r="1.5" fill="#78350f" opacity="0.4" />
          <circle cx="29" cy="30" r="1.5" fill="#78350f" opacity="0.4" />
        </svg>
      );
    default:
      // Big Majestic Oak / Bento Tree
      return (
        <svg viewBox="0 0 66 66" className="w-full h-full drop-shadow-[0_10px_18px_rgba(40,30,15,0.3)]">
          <defs>
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#966a4b" />
              <stop offset="40%" stopColor="#7a5135" />
              <stop offset="100%" stopColor="#543622" />
            </linearGradient>
            <radialGradient id="canopyLight" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a7e06a" />
              <stop offset="50%" stopColor="#55a532" />
              <stop offset="100%" stopColor="#306b1b" />
            </radialGradient>
          </defs>
          {/* Trunk */}
          <path d="M 33 60 L 33 34 M 27 60 Q 31 46 29 36 M 39 60 Q 35 46 37 36" stroke="url(#trunkGrad)" strokeWidth="6" strokeLinecap="round" />
          {/* Cloud-like fluffy canopy clumps */}
          <circle cx="22" cy="28" r="14" fill="url(#canopyLight)" />
          <circle cx="44" cy="28" r="14" fill="url(#canopyLight)" />
          <circle cx="24" cy="16" r="13" fill="url(#canopyLight)" />
          <circle cx="42" cy="16" r="13" fill="url(#canopyLight)" />
          <circle cx="33" cy="20" r="16" fill="url(#canopyLight)" />
          {/* Sun highlight puffs */}
          <circle cx="28" cy="14" r="5" fill="#d9f79c" opacity="0.6" />
          <circle cx="38" cy="14" r="4" fill="#d9f79c" opacity="0.6" />
        </svg>
      );
  }
}

export default function PlantMarker({ count, imageUrl, onClick }: PlantMarkerProps) {
  const stage = useMemo(() => {
    if (count >= 16) return 5;
    if (count >= 8) return 4;
    if (count >= 4) return 3;
    if (count >= 2) return 2;
    return 1;
  }, [count]);

  const sizes = useMemo(() => {
    switch (stage) {
      case 1: return { w: 46, h: 54, moundW: 42, moundH: 18 };
      case 2: return { w: 54, h: 62, moundW: 48, moundH: 20 };
      case 3: return { w: 62, h: 70, moundW: 54, moundH: 22 };
      case 4: return { w: 68, h: 76, moundW: 60, moundH: 24 };
      default: return { w: 76, h: 84, moundW: 66, moundH: 26 };
    }
  }, [stage]);

  const swayDuration = useMemo(() => 3.2 + Math.random() * 1.5, []);

  return (
    <motion.div
      className="relative cursor-pointer select-none -translate-x-1/2 -translate-y-full"
      style={{ width: sizes.w, height: sizes.h }}
      onClick={onClick}
      initial={{ scale: 0, y: 30, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 550,
        damping: 18,
        mass: 0.7,
      }}
      whileHover={{
        y: -10,
        scale: 1.12,
        transition: { type: 'spring', stiffness: 450, damping: 14 },
      }}
      whileTap={{ scale: 0.94 }}
    >
      {/* ─── Ground Soil Mound (Tactile Clay) ─── */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%/40%] z-0"
        style={{
          width: sizes.moundW,
          height: sizes.moundH,
          background: 'linear-gradient(175deg, #d8c6a9 0%, #bca584 55%, #8f7757 100%)',
          boxShadow: `
            0 8px 16px rgba(46, 39, 32, 0.22),
            0 2px 4px rgba(46, 39, 32, 0.12),
            inset 0 3px 4px rgba(255, 255, 255, 0.6),
            inset 0 -3px 4px rgba(46, 39, 32, 0.25)
          `,
        }}
      >
        {/* Soil pebbles / texture dots */}
        <div className="absolute top-[28%] left-[25%] w-1.5 h-1 rounded-full bg-white/40" />
        <div className="absolute top-[35%] right-[25%] w-2 h-1.5 rounded-full bg-black/10" />
      </div>

      {/* ─── Plant Artwork (Gentle Wind Sway) ─── */}
      <motion.div
        className="absolute inset-x-0 top-0 bottom-[14px] z-10 flex items-end justify-center"
        animate={{
          rotate: [-1.8, 1.8, -1.8],
          y: [0, -2, 0],
        }}
        transition={{
          duration: swayDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <PlantGraphic stage={stage} />
      </motion.div>

      {/* ─── Embedded Community Photo Thumbnail ─── */}
      {imageUrl && (
        <motion.div
          className="absolute -top-1.5 -right-1.5 z-20 w-8 h-8 rounded-full border-2 border-white shadow-clay-sm overflow-hidden bg-cream-100"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </motion.div>
      )}

      {/* ─── Soft Ground Shadow ─── */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-[50%] z-[-1]"
        style={{
          width: sizes.moundW * 0.9,
          height: 8,
          background: 'radial-gradient(ellipse, rgba(46,39,32,0.25) 0%, transparent 75%)',
          filter: 'blur(3px)',
        }}
      />
    </motion.div>
  );
}
