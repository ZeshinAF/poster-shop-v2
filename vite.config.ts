import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const isLocal = (host: string) => host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

/**
 * GitHub Pages can't send response headers, so the Content-Security-Policy
 * ships as a <meta> tag, injected at build time with the configured API
 * origin as the only connect target. Build-only: the dev server's HMR relies
 * on inline scripts this policy would block.
 */
function securityPolicy(apiUrl: string): Plugin {
  let apiOrigin = '';
  if (apiUrl) {
    const u = new URL(apiUrl);
    // Checkout posts names/emails/addresses: never let a production build send them in cleartext.
    if (u.protocol !== 'https:' && !isLocal(u.hostname)) {
      throw new Error(`VITE_API_URL must be https:// (got ${apiUrl})`);
    }
    apiOrigin = u.origin;
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // Motion writes inline style attributes on every animated element.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    // Posters are admin-supplied https URLs (R2 today); data: is the grain tile + favicon.
    "img-src 'self' https: data:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  return {
    name: 'security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`
      );
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), securityPolicy(env.VITE_API_URL ?? process.env.VITE_API_URL ?? '')],
    // GitHub Pages serves this repo under /poster-shop-v2/; dev server stays at root.
    base: command === 'build' ? '/poster-shop-v2/' : '/',
    // 5173 is the admin panel's port; the backend's ALLOWED_ORIGINS lists 5174 for this app.
    server: { port: 5174, strictPort: true },
    preview: { port: 4173, strictPort: true },
  };
});
