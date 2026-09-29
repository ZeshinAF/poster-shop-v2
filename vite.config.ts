import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this repo under /poster-shop-v2/; dev server stays at root.
  base: command === 'build' ? '/poster-shop-v2/' : '/',
}));
