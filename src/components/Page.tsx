import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const EASE = [0.76, 0, 0.24, 1] as const;
// Bottom-to-top stacking: blood lands first on exit, the bg-colored bar last
// (fully covering); on enter the bg bar lifts first, flashing acid + blood.
const BARS = ['var(--blood)', 'var(--acid)', 'var(--bg)'];

export function Page({ children }: { children: ReactNode }) {
  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 1 }}
      >
        {children}
      </motion.main>
      {BARS.map((color, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: color,
            zIndex: 120 + i,
            pointerEvents: 'none',
          }}
          initial={{ scaleY: 1, originY: 0 }}
          animate={{ scaleY: 0, originY: 0, transition: { duration: 0.65, ease: EASE, delay: (BARS.length - 1 - i) * 0.08 } }}
          exit={{ scaleY: 1, originY: 1, transition: { duration: 0.5, ease: EASE, delay: i * 0.08 } }}
        />
      ))}
    </>
  );
}
