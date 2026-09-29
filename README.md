# poster-shop-v2 — Тираж, visual overhaul (test build)

A full visual/motion redesign of the [poster-shop](https://github.com/ZeshinAF/poster-shop) storefront. Same palette (near-black, bone, acid `#a3e635`, blood `#d23b3b`), same Oswald / IBM Plex type, same grunge-cyber-punk voice — rebuilt around motion.

**Status: testing only.** Deployed to GitHub Pages as a separate site; the production store (v1) is untouched.

## Stack

- Vite + React + TypeScript
- [Motion](https://motion.dev) for all animation (scroll-linked transforms, layout animations, springs, page transitions)
- [React Bits](https://github.com/DavidHDev/react-bits) components, copied into `src/bits/` and themed: DecryptedText, GlitchText, ScrollVelocity, TiltedCard, ClickSpark, Noise, Magnet, LetterGlitch, FuzzyText
- Lenis smooth scrolling, React Router (hash routing — GitHub Pages has no SPA fallback)

Changes made to the React Bits copies (so an upstream refresh doesn't silently undo them):
- **ClickSpark** — viewport-sized fixed canvas instead of parent-sized (wrapping the whole app would otherwise allocate a document-tall canvas, drawn beneath the content).
- **Noise** — 512² texture instead of 1024² (4× less work per refresh).
- **FuzzyText** — `document.fonts.load` is given the actual text, so Cyrillic glyphs load (otherwise only Latin loads and Cyrillic falls back to a serif).
- **LetterGlitch** — null-guard in the draw loop (it can fire after unmount during route transitions).
- **GlitchText / TiltedCard** — recolored to the palette, square corners.

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
npm run dev      # http://localhost:5173
npm run build    # outputs dist/ with base /poster-shop-v2/
```

Motion respects `prefers-reduced-motion` (Motion's `reducedMotion="user"`, Lenis disabled, CSS animations collapsed). The custom cursor only appears on fine pointers.
