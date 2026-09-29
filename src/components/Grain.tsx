import { useState, type CSSProperties } from 'react';

function makeTile(size = 160, alpha = 26): string {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

/**
 * Film grain. Replaces React Bits' Noise, which regenerated a 512² random
 * texture on the main thread every few frames and was full-screen blended.
 * Here one small tile is generated once and jittered with a stepped CSS
 * transform — compositor-only, no per-frame JS, no blend mode. Scanlines are
 * baked into the same layer (see .grain in index.css).
 */
export function Grain() {
  const [tile] = useState(makeTile);
  const style = { '--grain-tile': tile ? `url(${tile})` : 'none' } as CSSProperties;
  return <div className="grain" aria-hidden="true" style={style} />;
}
