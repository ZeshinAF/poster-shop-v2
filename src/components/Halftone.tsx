import { useEffect, useRef } from 'react';

const SP = 12; // dot pitch (css px)
const R = 160; // cursor influence radius
const BG = '#0a0a0b';
const INK = '#e9e5db';
const ACID = '#a3e635';

/**
 * Hero background: a poster rendered as a halftone dot screen. Dots near the
 * cursor swell like spreading ink. The full grid is painted once per layout;
 * pointer/scroll updates repaint only the rectangles around the old and new
 * cursor position, so it stays cheap (the old letter-glitch repainted all of
 * its ~6k cells every frame).
 */
export function Halftone({ src }: { src: string | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !parent || !ctx) return;

    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;
    let lum = new Float32Array(0);
    let img: HTMLImageElement | null = null;
    let cursor = { x: -9999, y: -9999 };
    let lastBox: [number, number, number, number] | null = null;

    const sample = () => {
      lum = new Float32Array(cols * rows);
      if (!img) {
        // Fallback before the image loads / if it fails: a soft radial field.
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const dx = c / cols - 0.62;
            const dy = r / rows - 0.45;
            lum[r * cols + c] = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 1.8);
          }
        return;
      }
      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const o = off.getContext('2d', { willReadFrequently: true });
      if (!o) return;
      // cover-fit the poster into the grid, biased to the right half of the hero
      const s = Math.max(cols / img.width, rows / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      o.drawImage(img, cols - dw, (rows - dh) / 2, dw, dh);
      const d = o.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) {
        lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
      }
    };

    const paint = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.fillStyle = BG;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const c0 = Math.max(0, Math.floor(x0 / SP) - 1);
      const c1 = Math.min(cols - 1, Math.ceil(x1 / SP) + 1);
      const r0 = Math.max(0, Math.floor(y0 / SP) - 1);
      const r1 = Math.min(rows - 1, Math.ceil(y1 / SP) + 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      const ink = new Path2D();
      const acid = new Path2D();
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const cx = c * SP + SP / 2;
          const cy = r * SP + SP / 2;
          const base = Math.pow(lum[r * cols + c], 1.3) * SP * 0.48;
          const d = Math.hypot(cx - cursor.x, cy - cursor.y);
          const boost = d < R ? (1 - d / R) ** 2 : 0;
          const rad = Math.min(SP * 0.72, base * (1 + boost * 1.2) + boost * 2.4);
          if (rad < 0.35) continue;
          const path = boost > 0.08 ? acid : ink;
          path.moveTo(cx + rad, cy);
          path.arc(cx, cy, rad, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = INK;
      ctx.fill(ink);
      ctx.fillStyle = ACID;
      ctx.fill(acid);
      ctx.restore();
    };

    const layout = () => {
      const rect = parent.getBoundingClientRect();
      w = Math.ceil(rect.width);
      h = Math.ceil(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / SP);
      rows = Math.ceil(h / SP);
      sample();
      paint(0, 0, w, h);
      lastBox = null;
    };

    const boxAround = (x: number, y: number): [number, number, number, number] => [x - R - SP, y - R - SP, x + R + SP, y + R + SP];

    let frame = 0;
    let pointer = { x: -9999, y: -9999 };
    const update = () => {
      frame = 0;
      const rect = canvas.getBoundingClientRect();
      cursor = { x: pointer.x - rect.left, y: pointer.y - rect.top };
      const inside = cursor.x > -R && cursor.y > -R && cursor.x < w + R && cursor.y < h + R;
      if (!inside) cursor = { x: -9999, y: -9999 };
      const box = inside ? boxAround(cursor.x, cursor.y) : null;
      // repaint the union of where the ink blob was and where it is now
      for (const b of [lastBox, box]) if (b) paint(Math.max(0, b[0]), Math.max(0, b[1]), Math.min(w, b[2]), Math.min(h, b[3]));
      lastBox = box;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };

    layout();
    if (src) {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        img = im;
        layout();
      };
      im.src = src;
    }

    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fine && !reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', schedule, { passive: true });
    }
    let resizeT = 0;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(layout, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resizeT);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
    };
  }, [src]);

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden="true" />;
}
