import { useEffect, useRef } from 'react';

const CW = 10;
const CH = 20;
const BG = '#0a0a0b';

/**
 * Glitching letter-grid background, after React Bits' LetterGlitch, rebuilt for
 * cost: the original repainted every cell each frame (~6k fillText calls at
 * 1440×900) and never stopped. This draws the full grid once, then only
 * repaints the few cells that change each tick, and sleeps when offscreen,
 * in a background tab, or under prefers-reduced-motion.
 */
export function GlitchField({
  colors,
  characters,
  tickMs = 70,
  changeFraction = 0.035,
}: {
  colors: string[];
  characters: string;
  tickMs?: number;
  changeFraction?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !parent || !ctx) return;

    const chars = Array.from(characters);
    const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];
    let cols = 0;
    let cells: { ch: string; color: string }[] = [];

    const paintCell = (i: number) => {
      const x = (i % cols) * CW;
      const y = ((i / cols) | 0) * CH;
      ctx.fillStyle = BG;
      ctx.fillRect(x, y, CW, CH);
      ctx.fillStyle = cells[i].color;
      ctx.fillText(cells[i].ch, x, y + 2);
    };

    const layout = () => {
      const { width, height } = parent.getBoundingClientRect();
      // 1× density on purpose: it sits dimmed behind a vignette, crispness is invisible.
      canvas.width = Math.max(1, Math.ceil(width));
      canvas.height = Math.max(1, Math.ceil(height));
      cols = Math.ceil(width / CW);
      const rows = Math.ceil(height / CH);
      cells = Array.from({ length: cols * rows }, () => ({ ch: pick(chars), color: pick(colors) }));
      ctx.font = '16px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cells.length; i++) paintCell(i);
    };

    const tick = () => {
      const n = Math.max(1, Math.floor(cells.length * changeFraction));
      for (let k = 0; k < n; k++) {
        const i = (Math.random() * cells.length) | 0;
        cells[i].ch = pick(chars);
        cells[i].color = pick(colors);
        paintCell(i);
      }
    };

    layout();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let visible = true;
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      if (visible && !document.hidden) timer = window.setTimeout(loop, tickMs);
    };
    const loop = () => {
      tick();
      schedule();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      schedule();
    });
    io.observe(canvas);
    const onVis = () => schedule();
    document.addEventListener('visibilitychange', onVis);

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(layout, 150);
    };
    window.addEventListener('resize', onResize);
    schedule();

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(resizeT);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  }, [colors, characters, tickMs, changeFraction]);

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden="true" />;
}
