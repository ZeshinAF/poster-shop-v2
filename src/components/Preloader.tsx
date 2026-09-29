import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import './Preloader.css';

const BOOT_LINES = [
  '> ТИРАЖ OS v2.0 // boot',
  '> зареждане на мастило ........ ok',
  '> опъване на ситото ........... ok',
  '> кроене на несъгласие ........ ok',
  '> позиция ...................... 100%',
];

export function Preloader({ onDone }: { onDone: () => void }) {
  const progress = useMotionValue(0);
  const counter = useTransform(progress, (v) => String(Math.round(v)).padStart(3, '0'));
  const barScale = useTransform(progress, [0, 100], [0, 1]);
  const [lines, setLines] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: 2,
      ease: [0.65, 0, 0.35, 1],
      onComplete: () => setLeaving(true),
    });
    const timers = BOOT_LINES.map((_, i) => setTimeout(() => setLines(i + 1), 180 + i * 330));
    return () => {
      controls.stop();
      timers.forEach(clearTimeout);
    };
  }, [progress]);

  return (
    <motion.div className="preloader" aria-hidden="true">
      <motion.div
        className="preloader__half preloader__half--top"
        animate={leaving ? { y: '-100%' } : { y: 0 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        onAnimationComplete={() => leaving && onDone()}
      >
        <div className="preloader__term">
          {BOOT_LINES.slice(0, lines).map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              {l}
            </motion.div>
          ))}
          <span className="preloader__caret">█</span>
        </div>
      </motion.div>
      <motion.div
        className="preloader__half preloader__half--bottom"
        animate={leaving ? { y: '100%' } : { y: 0 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
      >
        <div className="preloader__foot">
          <motion.span className="preloader__count">{counter}</motion.span>
          <span className="preloader__label">// тиражът се подготвя</span>
        </div>
      </motion.div>
      <motion.div
        className="preloader__bar"
        style={{ scaleX: barScale }}
        animate={leaving ? { opacity: 0 } : { opacity: 1 }}
      />
    </motion.div>
  );
}
