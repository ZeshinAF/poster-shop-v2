import { animate, motion, useInView, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Letters rise out of a mask, one after another. */
export function SplitReveal({
  text,
  className,
  delay = 0,
  stagger = 0.035,
  onView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  onView?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const go = onView ? inView : true;
  const words = text.split(' ');
  let i = 0;
  return (
    <span ref={ref} className={className} aria-label={text} style={{ display: 'inline-block' }}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {[...w].map((ch) => {
            const idx = i++;
            return (
              <span key={idx} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
                <motion.span
                  style={{ display: 'inline-block' }}
                  initial={{ y: '110%', rotate: 8, filter: 'blur(6px)' }}
                  animate={go ? { y: '0%', rotate: 0, filter: 'blur(0px)' } : undefined}
                  transition={{ duration: 0.9, ease: EASE, delay: delay + idx * stagger }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
          {wi < words.length - 1 && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/** Generic fade-and-rise on scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 40,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function ScrubWord({
  word,
  progress,
  range,
  accent,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  accent: boolean;
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const color = useTransform(progress, [range[0], range[1]], ['#56534d', accent ? '#a3e635' : '#e9e5db']);
  return (
    <motion.span style={{ opacity, color, display: 'inline-block', marginRight: '0.28em' }}>{word}</motion.span>
  );
}

/** Paragraph whose words light up one by one as it scrolls through the viewport. */
export function ScrubText({ text, className, accents = [] }: { text: string; className?: string; accents?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <ScrubWord
          key={i}
          word={w}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          accent={accents.includes(w)}
        />
      ))}
    </p>
  );
}

/** Number that ticks up from 0 the first time it scrolls into view. */
export function CountUp({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: EASE, onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}
