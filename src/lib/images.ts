import manifest from '../data/image-manifest.json';

type Variants = Partial<Record<'640' | '1280', string>>;
const MAP = manifest as Record<string, Variants>;
const BASE = import.meta.env.BASE_URL;

/**
 * Web-sized WebP for a poster (see scripts/optimize-images.mjs), or the
 * original URL for images that haven't been processed yet.
 */
export function poster(url: string, width: 640 | 1280): string {
  const v = MAP[url]?.[String(width) as '640' | '1280'];
  return v ? BASE + v : url;
}

/** Pick the variant for an on-screen CSS width, accounting for pixel density. */
export function posterFor(url: string, cssWidth: number): string {
  const need = cssWidth * Math.min(window.devicePixelRatio || 1, 2);
  return poster(url, need > 640 ? 1280 : 640);
}

/** src/srcSet/sizes for a plain <img>; the browser picks the right variant. */
export function posterImgProps(url: string, sizes: string) {
  const v = MAP[url];
  if (!v?.['640'] || !v['1280']) return { src: url };
  return {
    src: BASE + v['640'],
    srcSet: `${BASE + v['640']} 640w, ${BASE + v['1280']} 1280w`,
    sizes,
  };
}
