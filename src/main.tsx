import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
// Global base styles must load before any component CSS so components can override them.
import './index.css';
import App from './App';

// HashRouter: GitHub Pages has no SPA fallback, so deep links like
// /poster-shop-v2/#/product/alien must not depend on the server.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
