// Generates web-sized WebP variants of the catalog's poster images.
//
// The source images are 1536×1920 print PNGs of 3–9 MB each (~70 MB for the
// catalog). Decoding those while scrolling was the main cause of dropped
// frames, and they're brutal on mobile data. This writes 640w and 1280w WebPs
// to public/posters/ plus a manifest keyed by the original URL; the app uses
// them when the URL matches and falls back to the original otherwise (e.g. a
// product added after the last run).
//
// Usage: node scripts/optimize-images.mjs   (re-run after refreshing the snapshot)
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const WIDTHS = [640, 1280];
const OUT_DIR = new URL('../public/posters/', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('../src/data/catalog-snapshot.json', import.meta.url), 'utf8'));

await mkdir(OUT_DIR, { recursive: true });
const manifest = {};
let before = 0;
let after = 0;

for (const p of snapshot) {
  if (!p.image_url) continue;
  const url = new URL(p.image_url);
  if (url.protocol !== 'https:') continue;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`skip ${p.slug}: HTTP ${res.status}`);
    continue;
  }
  const src = Buffer.from(await res.arrayBuffer());
  before += src.length;
  // Hash the URL so a replaced image (new URL) never maps to a stale variant.
  const key = `${p.slug.replace(/[^a-z0-9-]/g, '')}-${createHash('sha1').update(p.image_url).digest('hex').slice(0, 8)}`;
  const entry = {};
  for (const w of WIDTHS) {
    const buf = await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    await writeFile(new URL(`${key}-${w}.webp`, OUT_DIR), buf);
    after += buf.length;
    entry[w] = `posters/${key}-${w}.webp`;
  }
  manifest[p.image_url] = entry;
  console.log(`${p.slug}: ${(src.length / 1e6).toFixed(1)} MB -> ${WIDTHS.join('/')}w webp`);
}

await writeFile(new URL('../src/data/image-manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`total ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB (both sizes)`);
