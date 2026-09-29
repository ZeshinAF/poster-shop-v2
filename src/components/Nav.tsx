import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DecryptedText from '../bits/DecryptedText';
import GlitchText from '../bits/GlitchText';
import Magnet from '../bits/Magnet';
import { lockScroll } from '../lib/smoothScroll';
import { useStore } from '../lib/store';
import './Nav.css';

const LINKS = [
  { to: '/', label: 'Начало' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/catalog?kind=film', label: 'Филми' },
  { to: '/catalog?kind=band', label: 'Музика' },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="nav__clock">
      SOF {now.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export function Nav() {
  const { count, bump, openDrawer } = useStore();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 160 && !menuOpen);
    setScrolled(y > 40);
  });

  useEffect(() => setMenuOpen(false), [location]);

  useEffect(() => {
    lockScroll(menuOpen);
    return () => lockScroll(false);
  }, [menuOpen]);

  // Sticky bars (catalog filters) offset by this so the nav never covers them.
  useEffect(() => {
    document.documentElement.style.setProperty('--nav-offset', hidden ? '0px' : 'var(--nav-h)');
  }, [hidden]);

  const isActive = (to: string) => {
    const [path, query] = to.split('?');
    if (query) return location.pathname === path && location.search === `?${query}`;
    if (path === '/catalog') return location.pathname === '/catalog' && !location.search;
    return location.pathname === path;
  };

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'nav--solid' : ''}`}
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="nav__inner">
          <Link to="/" className="nav__logo" aria-label="Тираж — начало">
            <GlitchText speed={0.6} enableShadows enableOnHover className="nav__glitch">
              ТИРАЖ
            </GlitchText>          </Link>

          <nav className="nav__links" aria-label="Основна навигация">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={`nav__link ${isActive(l.to) ? 'active' : ''}`}>
                <DecryptedText text={l.label} animateOn="hover" speed={40} maxIterations={8} sequential encryptedClassName="nav__enc" />
                {isActive(l.to) && <motion.span layoutId="nav-underline" className="nav__underline" />}
              </Link>
            ))}
          </nav>

          <div className="nav__right">
            <Clock />
            <Magnet padding={40} magnetStrength={4}>
              <button className="nav__cart" onClick={openDrawer} aria-label={`Кош, ${count} артикула`}>
                <span>Кош</span>
                <motion.span
                  key={bump}
                  className="nav__count"
                  initial={bump ? { scale: 1.9, backgroundColor: '#d23b3b' } : false}
                  animate={{ scale: 1, backgroundColor: count ? '#a3e635' : 'rgba(233,229,219,0.12)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                >
                  {count}
                </motion.span>
              </button>
            </Magnet>
            <button
              className={`nav__burger ${menuOpen ? 'is-open' : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Меню"
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="menu__links">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ y: '110%', rotate: 4 }}
                  animate={{ y: '0%', rotate: 0 }}
                  exit={{ y: '110%' }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="menu__row"
                >
                  <Link to={l.to} className="menu__link">
                    <span className="menu__idx">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="menu__foot kicker">// печатница за несъгласни</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
