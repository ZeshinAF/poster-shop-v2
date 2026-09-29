import { AnimatePresence, MotionConfig } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ClickSpark from './bits/ClickSpark';
import Noise from './bits/Noise';
import { CartDrawer } from './components/CartDrawer';
import { Cursor } from './components/Cursor';
import { Footer } from './components/Footer';
import { Nav } from './components/Nav';
import { Preloader } from './components/Preloader';
import { scrollToTop, useSmoothScroll } from './lib/smoothScroll';
import { StoreProvider } from './lib/store';
import Home from './pages/Home';

const Catalog = lazy(() => import('./pages/Catalog'));
const Product = lazy(() => import('./pages/Product'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const NotFound = lazy(() => import('./pages/NotFound'));

const BOOT_KEY = 'tirazh-v2:booted';

function shouldBoot(): boolean {
  try {
    return !sessionStorage.getItem(BOOT_KEY);
  } catch {
    return true;
  }
}

export default function App() {
  const location = useLocation();
  const [booting, setBooting] = useState(shouldBoot);
  useSmoothScroll();

  function finishBoot() {
    try {
      sessionStorage.setItem(BOOT_KEY, '1');
    } catch {
      /* ignore */
    }
    setBooting(false);
  }

  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <ClickSpark sparkColor="#a3e635" sparkSize={12} sparkRadius={26} sparkCount={10} duration={420}>
          <Nav />
          <Suspense fallback={null}>
            <AnimatePresence mode="wait" onExitComplete={() => scrollToTop()}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
          <Footer />
          <CartDrawer />
        </ClickSpark>
        <div className="grain" aria-hidden="true">
          <Noise patternAlpha={22} patternRefreshInterval={3} />
        </div>
        <div className="scanlines" aria-hidden="true" />
        <Cursor />
        {booting && <Preloader onDone={finishBoot} />}
      </StoreProvider>
    </MotionConfig>
  );
}
