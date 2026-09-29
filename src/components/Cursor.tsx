import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import './Cursor.css';

type Mode = 'default' | 'link' | 'view';

// Crosshair reticle that snaps a label ("ВИЖ") onto anything marked
// data-cursor="view", and swells over links/buttons. Fine pointers only.
export function Cursor() {
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });
  const [mode, setMode] = useState<Mode>('default');
  const [down, setDown] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add('has-cursor');
    let lastX = -100;
    let lastY = -100;
    const classify = (t: Element | null) => {
      if (t?.closest('[data-cursor="view"]')) setMode('view');
      else if (t?.closest('a, button, input, select, textarea, label')) setMode('link');
      else setMode('default');
    };
    const move = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      x.set(lastX);
      y.set(lastY);
      setHidden(false);
      classify(e.target as Element | null);
    };
    // Content scrolls under a still pointer (smooth scroll, pinned gallery),
    // so re-check what's beneath it instead of waiting for the next move.
    const onScroll = () => classify(document.elementFromPoint(lastX, lastY));
    const leave = () => setHidden(true);
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    return () => {
      document.body.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = mode === 'view' ? 96 : mode === 'link' ? 46 : 22;

  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} animate={{ opacity: hidden ? 0 : 1 }} />
      <motion.div
        className={`cursor-ring cursor-ring--${mode}`}
        style={{ x: sx, y: sy }}
        animate={{
          width: size,
          height: size,
          opacity: hidden ? 0 : 1,
          scale: down ? 0.8 : 1,
          rotate: mode === 'link' ? 45 : 0,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      >
        <span className="cursor-tick cursor-tick--t" />
        <span className="cursor-tick cursor-tick--r" />
        <span className="cursor-tick cursor-tick--b" />
        <span className="cursor-tick cursor-tick--l" />
        {mode === 'view' && (
          <motion.span className="cursor-label" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
            ВИЖ
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
