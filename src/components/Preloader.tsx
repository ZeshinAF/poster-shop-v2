import { motion, useAnimationControls } from 'motion/react';
import { useEffect, useState } from 'react';
import './Preloader.css';

// Three screen-print plates of the logo land out of register, one per pass,
// then snap into alignment — the shop is called Тираж (a print run).
const PLATES = [
  { color: 'var(--blood)', from: { x: -26, y: 14, rotate: -2.5 } },
  { color: 'var(--acid)', from: { x: 22, y: -12, rotate: 2 } },
  { color: 'var(--ink)', from: { x: -6, y: -4, rotate: -0.6 } },
];
const PASS_MS = 260;
const SNAP_AT = PLATES.length * PASS_MS + 180;

export function Preloader({ onDone }: { onDone: () => void }) {
  const [pass, setPass] = useState(0);
  const [snapped, setSnapped] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const shake = useAnimationControls();

  useEffect(() => {
    const timers = PLATES.map((_, i) => setTimeout(() => setPass(i + 1), 120 + i * PASS_MS));
    timers.push(
      setTimeout(() => {
        setSnapped(true);
        shake.start({ x: [0, -7, 6, -3, 2, 0], transition: { duration: 0.32 } });
      }, SNAP_AT),
      setTimeout(() => setLeaving(true), SNAP_AT + 520)
    );
    return () => timers.forEach(clearTimeout);
  }, [shake]);

  return (
    <motion.div
      className="preloader"
      aria-hidden="true"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={leaving ? { clipPath: 'inset(0% 0% 100% 0%)' } : undefined}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => leaving && onDone()}
    >
      <motion.div className="preloader__sheet" animate={shake}>
        <div className="preloader__frame">
          {(['tl', 'tr', 'bl', 'br'] as const).map((c, i) => (
            <motion.span
              key={c}
              className={`crop crop--${c}`}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
          {(['l', 'r'] as const).map((s) => (
            <motion.span
              key={s}
              className={`reg reg--${s}`}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          <div className="preloader__word">
            {/* Invisible copy sizes the box; the plates stack on top of it. */}
            <span className="preloader__sizer">ТИРАЖ</span>
            {PLATES.map((p, i) => (
              <motion.span
                key={i}
                className="preloader__plate"
                style={{ color: p.color, mixBlendMode: i === PLATES.length - 1 ? 'normal' : undefined }}
                initial={{ opacity: 0, scale: 1.25, ...p.from }}
                animate={
                  pass > i
                    ? snapped
                      ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
                      : { opacity: 1, scale: 1, ...p.from }
                    : undefined
                }
                transition={
                  snapped
                    ? { type: 'spring', stiffness: 700, damping: 26 }
                    : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                }
              >
                ТИРАЖ
              </motion.span>
            ))}
          </div>
        </div>

        <div className="preloader__meta">
          <span>{snapped ? '✓ в регистър' : `прекарване ${Math.max(pass, 1)} / ${PLATES.length}`}</span>
          <span>// печатница за несъгласни</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
