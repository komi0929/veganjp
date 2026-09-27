'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PlantMarkerProps {
  count: number;
  imageUrl?: string;
  onClick?: () => void;
}

type GrowthStage = {
  emoji: string;
  name: string;
  baseW: number;
  baseH: number;
  emojiSize: number;
  mound: string;
  highlight: string;
  accent: string;
};

const STAGES: GrowthStage[] = [
  {
    emoji: '🌱',
    name: 'sprout',
    baseW: 38,
    baseH: 26,
    emojiSize: 18,
    mound: '#c2b08e',
    highlight: '#ddd2b8',
    accent: '#a89870',
  },
  {
    emoji: '🌿',
    name: 'herb',
    baseW: 44,
    baseH: 30,
    emojiSize: 22,
    mound: '#b8a882',
    highlight: '#d6cab0',
    accent: '#9e8e68',
  },
  {
    emoji: '🌸',
    name: 'bloom',
    baseW: 52,
    baseH: 34,
    emojiSize: 28,
    mound: '#b0a078',
    highlight: '#cec2a4',
    accent: '#968660',
  },
  {
    emoji: '🌺',
    name: 'flower',
    baseW: 60,
    baseH: 38,
    emojiSize: 32,
    mound: '#a89870',
    highlight: '#c8ba9c',
    accent: '#8e7e58',
  },
  {
    emoji: '🌳',
    name: 'tree',
    baseW: 68,
    baseH: 42,
    emojiSize: 38,
    mound: '#a09068',
    highlight: '#c0b294',
    accent: '#867650',
  },
];

function getStage(count: number): GrowthStage {
  if (count >= 16) return STAGES[4];
  if (count >= 8) return STAGES[3];
  if (count >= 4) return STAGES[2];
  if (count >= 2) return STAGES[1];
  return STAGES[0];
}

export default function PlantMarker({ count, imageUrl, onClick }: PlantMarkerProps) {
  const stage = useMemo(() => getStage(count), [count]);
  const staggerDelay = useMemo(() => Math.random() * 0.5, []);
  const swayDuration = useMemo(() => 3.5 + Math.random() * 2, []);

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      style={{ width: stage.baseW, height: stage.baseH + stage.emojiSize }}
      onClick={onClick}
      initial={{ scale: 0, y: 40, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 600,
        damping: 14,
        mass: 0.5,
        delay: staggerDelay,
      }}
      whileHover={{
        y: -8,
        scale: 1.08,
        transition: { type: 'spring', stiffness: 400, damping: 12 },
      }}
      whileTap={{ scale: 0.92 }}
    >
      {/* ─── Ground shadow ─── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: -5,
          width: stage.baseW * 0.7,
          height: 7,
          background: 'radial-gradient(ellipse, rgba(80,60,30,0.18) 0%, transparent 72%)',
          filter: 'blur(2px)',
        }}
      />

      {/* ─── Plant emoji ─── */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        style={{
          height: stage.emojiSize,
          fontSize: stage.emojiSize,
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(40,30,10,0.18))',
        }}
        animate={{
          y: [0, -3, 0],
          rotate: [-1.5, 1.5, -1.5],
        }}
        transition={{
          duration: swayDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {stage.emoji}
      </motion.div>

      {/* ─── Clay mound (claymorphism) ─── */}
      <div
        className="relative overflow-hidden"
        style={{
          width: stage.baseW,
          height: stage.baseH,
          borderRadius: '40% 40% 48% 48% / 35% 35% 55% 55%',
          background: `linear-gradient(155deg, ${stage.highlight} 0%, ${stage.mound} 50%, ${stage.accent} 100%)`,
          boxShadow: `
            0 3px 8px rgba(60, 40, 10, 0.14),
            0 1px 3px rgba(60, 40, 10, 0.08),
            0 6px 14px rgba(60, 40, 10, 0.05),
            inset 3px 3px 6px rgba(255, 255, 255, 0.38),
            inset -2px -2px 5px rgba(60, 40, 10, 0.1)
          `,
        }}
      >
        {/* Clay highlight (top-left specular) */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '8%',
            left: '10%',
            width: '50%',
            height: '45%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 35% 35%, rgba(255,255,255,0.45), transparent 70%)',
          }}
        />

        {/* Tiny soil texture dots */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '55%',
            left: '20%',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: '60%',
            left: '60%',
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }}
        />

        {/* Photo thumbnail embedded in clay */}
        {imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center pt-1">
            <div
              className="rounded-full overflow-hidden"
              style={{
                width: stage.baseW * 0.48,
                height: stage.baseW * 0.48,
                border: '2px solid rgba(255,255,255,0.45)',
                boxShadow: `
                  inset 0 1px 4px rgba(0,0,0,0.18),
                  0 1px 2px rgba(255,255,255,0.3)
                `,
              }}
            >
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </div>
          </div>
        )}

        {/* Bottom edge shadow for grounding */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '30%',
            background: 'linear-gradient(to top, rgba(60,40,10,0.06), transparent)',
            borderRadius: 'inherit',
          }}
        />
      </div>
    </motion.div>
  );
}
