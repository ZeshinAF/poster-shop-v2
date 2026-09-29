# poster-shop-v2 — Тираж, visual overhaul (test build)

A full visual/motion redesign of the [poster-shop](https://github.com/ZeshinAF/poster-shop) storefront. Same palette (near-black, bone, acid `#a3e635`, blood `#d23b3b`), same Oswald / IBM Plex type, same grunge-cyber-punk voice — rebuilt around motion.

**Status: testing only.** Deployed to GitHub Pages as a separate site; the production store (v1) is untouched.

## Stack

- Vite + React + TypeScript
- [Motion](https://motion.dev) for all animation (scroll-linked transforms, layout animations, springs, page transitions)
- [React Bits](https://github.com/DavidHDev/react-bits) components, copied into `src/bits/` and themed: DecryptedText, GlitchText, ScrollVelocity, TiltedCard, ClickSpark, Magnet, FuzzyText
- Lenis smooth scrolling, React Router (hash routing — GitHub Pages has no SPA fallback)

Changes made to the React Bits copies (so an upstream refresh doesn't silently undo them):
- **ClickSpark** — viewport-sized fixed canvas instead of parent-sized, and the draw loop only runs while sparks are alive (it cleared a full-screen canvas every frame forever).
- **FuzzyText** — `document.fonts.load` is given the actual text so Cyrillic glyphs load (otherwise they fall back to a serif); the render loop sleeps while offscreen / in a background tab; touchmove no longer calls `preventDefault` (it blocked page scrolling over the footer on phones).
- **Magnet** — no state update on idle mouse moves (it re-rendered on every mousemove anywhere on the page).
- **TiltedCard** — recolored, square corners, `transform-style: flat` instead of `preserve-3d` (the unused 3D context cost ~7 fps of raster while scrolling past the gallery).
- **GlitchText** — recolored.
- **LetterGlitch** and **Noise** were replaced by `components/GlitchField.tsx` and `components/Grain.tsx`: the originals redrew ~6k canvas glyphs per frame and regenerated a noise texture on the main thread respectively, and were the main causes of the site feeling sluggish (idle was ~28 fps; now 60).

## Performance notes

- **Poster images:** the source PNGs are 3–9 MB each (~70 MB for the catalog), and decoding them while scrolling dropped frames. `npm run optimize-images` writes 640w/1280w WebPs to `public/posters/` (~8 MB total for both sizes) plus `src/data/image-manifest.json`; `src/lib/images.ts` serves those via `srcset` and falls back to the original URL for images it hasn't processed (e.g. a product added since). Re-run it after refreshing the snapshot. The real fix belongs upstream: have the admin/upload flow store web-sized images.
- **Overlays:** grain + scanlines are a single fixed layer, jittered with a CSS transform that pauses while Lenis is scrolling. Two separate full-screen overlays with blend modes cost ~15 fps on their own.

## Security

- A Content-Security-Policy `<meta>` is injected at build time (`vite.config.ts`) — scripts from self only, `connect-src` limited to the configured API origin. (GitHub Pages can't send real headers, so `frame-ancestors` isn't enforceable here.)
- The build **fails** if `VITE_API_URL` isn't `https://` (localhost excepted), so checkout can never post names/addresses in cleartext.
- API data is treated as untrusted: image URLs must be http(s), product kinds and stock are validated; the persisted cart is sanitized on load (slug keys, positive integer quantities, capped at 50).

## Data & checkout

- `VITE_API_URL` unset (the default GitHub Pages build): the catalog comes from `src/data/catalog-snapshot.json` (a snapshot of the real `/api/products`), and checkout runs in **demo mode** — it shows a confirmation but sends nothing.
- `VITE_API_URL` set (e.g. the Railway backend URL): live catalog and real orders via `POST /api/orders`. Set it as a repo variable (Settings → Secrets and variables → Actions → Variables) to switch the Pages build over.

Refresh the snapshot from a running backend:

```bash
curl -s http://127.0.0.1:8787/api/products > src/data/catalog-snapshot.json
```

## Dev

```bash
npm install
npm run dev      # http://localhost:5174 (5173 is the admin panel's)
npm run build    # outputs dist/ with base /poster-shop-v2/
```

Against the local backend (`poster-shop-backend`, whose `ALLOWED_ORIGINS` includes `http://localhost:5174`):

```bash
# terminal 1 — in poster-shop-backend
npm run build && npm start
# terminal 2 — here
VITE_API_URL=http://127.0.0.1:8787 npm run dev
```

Use `127.0.0.1`, not `localhost`, in `VITE_API_URL`: the backend binds IPv4 and Node resolves `localhost` to `::1` first.

Motion respects `prefers-reduced-motion` (Motion's `reducedMotion="user"`, Lenis disabled, CSS animations collapsed). The custom cursor only appears on fine pointers.
