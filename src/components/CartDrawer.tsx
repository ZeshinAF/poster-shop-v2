import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FREE_SHIPPING_THRESHOLD, money } from '../lib/api';
import { lockScroll } from '../lib/smoothScroll';
import { useStore } from '../lib/store';
import './CartDrawer.css';

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, subtotal, shipping, total, count, inc, dec, remove } = useStore();

  useEffect(() => {
    lockScroll(drawerOpen);
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            className="drawer-backdrop"
            onClick={closeDrawer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-label="Кош"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            data-lenis-prevent
          >
            <header className="drawer__head">
              <div>
                <div className="kicker">// кош</div>
                <h2 className="display drawer__title">
                  {count} {count === 1 ? 'брой' : 'броя'}
                </h2>
              </div>
              <button className="drawer__close" onClick={closeDrawer} aria-label="Затвори">
                ✕
              </button>
            </header>

            <div className="drawer__ship">
              <div className="drawer__ship-text">
                {subtotal === 0
                  ? 'Кошът е празен. Това е позиция, не проблем.'
                  : toFree > 0
                    ? `Още ${money(toFree)} до безплатна доставка`
                    : '✓ Безплатна доставка'}
              </div>
              <div className="drawer__ship-track">
                <motion.div
                  className="drawer__ship-fill"
                  initial={false}
                  animate={{ scaleX: progress, backgroundColor: progress >= 1 ? '#a3e635' : '#d23b3b' }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            <ul className="drawer__lines">
              <AnimatePresence initial={false}>
                {lines.map(({ product, qty, lineTotal }) => (
                  <motion.li
                    key={product.id}
                    layout
                    className="drawer__line"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link to={`/product/${product.id}`} onClick={closeDrawer} className="drawer__thumb">
                      {product.image && <img src={product.image} alt="" loading="lazy" />}
                    </Link>
                    <div className="drawer__info">
                      <div className="drawer__name">{product.titleBg}</div>
                      <div className="drawer__meta">
                        {product.reg} · {money(product.price)}
                      </div>
                      <div className="drawer__qty">
                        <button onClick={() => dec(product.id)} aria-label="Намали">
                          −
                        </button>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={qty}
                            initial={{ y: -14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 14, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {qty}
                          </motion.span>
                        </AnimatePresence>
                        <button onClick={() => inc(product.id)} disabled={qty >= product.stock} aria-label="Увеличи">
                          +
                        </button>
                      </div>
                    </div>
                    <div className="drawer__right">
                      <div className="drawer__line-total">{money(lineTotal)}</div>
                      <button className="drawer__remove" onClick={() => remove(product.id)}>
                        махни
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <footer className="drawer__foot">
              <div className="drawer__row">
                <span>Междинна сума</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="drawer__row">
                <span>Доставка</span>
                <span>{shipping === 0 ? (subtotal ? 'безплатна' : '—') : money(shipping)}</span>
              </div>
              <div className="drawer__row drawer__row--total">
                <span>Общо</span>
                <motion.span key={total} initial={{ opacity: 0.3, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  {money(total)}
                </motion.span>
              </div>
              {lines.length > 0 ? (
                <Link to="/checkout" onClick={closeDrawer} className="drawer__cta">
                  <span>Към плащане</span>
                  <span>→</span>
                </Link>
              ) : (
                <Link to="/catalog" onClick={closeDrawer} className="drawer__cta drawer__cta--ghost">
                  <span>Към каталога</span>
                  <span>→</span>
                </Link>
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
