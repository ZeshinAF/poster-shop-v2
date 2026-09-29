import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { poster } from '../lib/images';
import './PasteWall.css';

// Deterministic PRNG so the wall (layout + torn edges) is identical every visit.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rough torn-paper outline: jagged points walked around the rectangle's edge. */
function tornPolygon(rand: () => number): string {
  const pts: string[] = [];
  const steps = 9;
  const jag = () => (rand() * 4).toFixed(1);
  for (let i = 0; i <= steps; i++) pts.push(`${((i / steps) * 100).toFixed(1)}% ${jag()}%`);
  for (let i = 1; i <= steps; i++) pts.push(`${(100 - +jag()).toFixed(1)}% ${((i / steps) * 100).toFixed(1)}%`);
  for (let i = steps - 1; i >= 0; i--) pts.push(`${((i / steps) * 100).toFixed(1)}% ${(100 - +jag()).toFixed(1)}%`);
  for (let i = steps - 1; i > 0; i--) pts.push(`${jag()}% ${((i / steps) * 100).toFixed(1)}%`);
  return `polygon(${pts.join(', ')})`;
}

const TINTS = ['var(--acid)', 'var(--blood)', 'var(--ink)'];

/**
 * Hero background: a street wall of wheat-pasted, torn fragments of the
 * catalog's own posters, duotoned into the palette. Static layers (painted
 * once); only the whole wall moves, on the compositor, with the cursor.
 */
export function PasteWall({ images }: { images: string[] }) {
  const pieces = useMemo(() => {
    if (images.length === 0) return [];
    const rand = mulberry32(1509);
    const cols = 5;
    const rows = 3;
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        out.push({
          src: poster(images[i % images.length], 640),
          left: (c / cols) * 100 - 6 + rand() * 10,
          top: (r / rows) * 100 - 12 + rand() * 14,
          width: 20 + rand() * 12,
          rotate: -7 + rand() * 14,
          tint: TINTS[Math.floor(rand() * TINTS.length)],
          clip: tornPolygon(rand),
          z: Math.floor(rand() * 10),
        });
      }
    }
    return out;
  }, [images]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 60, damping: 20 });
  const y = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * -28);
      my.set((e.clientY / window.innerHeight - 0.5) * -18);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my]);

  return (
    <motion.div className="wall" style={{ x, y }} aria-hidden="true">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="wall__piece"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            // vw on wide screens, vh on tall phones — otherwise pieces shrink to
            // thumbnails on mobile and the wall shows big holes.
            width: `max(${p.width}vw, ${(p.width * 0.95).toFixed(1)}vh)`,
            transform: `rotate(${p.rotate}deg)`,
            clipPath: p.clip,
            background: p.tint,
            zIndex: p.z,
          }}
        >
          <img src={p.src} alt="" loading="eager" decoding="async" />
        </div>
      ))}
    </motion.div>
  );
}
