import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DecryptedText from '../bits/DecryptedText';
import ScrollVelocity from '../bits/ScrollVelocity';
import TiltedCard from '../bits/TiltedCard';
import { Page } from '../components/Page';
import { ProductCard } from '../components/ProductCard';
import { Reveal, SplitReveal } from '../components/motion';
import { kindLabel, money, typeLabel } from '../lib/api';
import { useStore } from '../lib/store';
import NotFound from './NotFound';
import './Product.css';

// Poster keeps 2:3 and never exceeds the viewport width on phones.
const POSTER_W = 'min(52vh, 480px, calc(100vw - 2 * var(--gutter)))';

const SPECS = [
  { k: 'Формат', v: '50 × 70 см' },
  { k: 'Хартия', v: 'Мат 250 г' },
  { k: 'Печат', v: 'Сито, ръчно' },
  { k: 'Рамка', v: 'Без. Рамката е компромис.' },
];

export default function Product() {
  const { id } = useParams();
  const { products, loading, add, openDrawer, lines } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const posterY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  const product = products.find((p) => p.id === id);
  if (loading) return <Page><div className="pd-loading kicker wrap">зареждане…</div></Page>;
  if (!product) return <NotFound />;

  const idx = products.indexOf(product);
  const prev = products[(idx - 1 + products.length) % products.length];
  const next = products[(idx + 1) % products.length];
  const related = products.filter((p) => p.kind === product.kind && p.id !== product.id).slice(0, 4);
  const inCart = lines.find((l) => l.product.id === product.id)?.qty ?? 0;
  const soldOut = product.stock <= 0;
  const segments = 10;
  const filled = Math.min(segments, product.stock);

  function onAdd() {
    if (soldOut || inCart >= product!.stock) return;
    add(product!.id);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <Page>
      <section ref={heroRef} className="pd">
        <div className="pd__ghost" aria-hidden="true">
          <ScrollVelocity texts={[`${product.titleEn} ✕ `]} velocity={30} numCopies={4} className="pd__ghost-text" />
        </div>

        <div className="wrap pd__grid">
          <motion.div className="pd__art" style={{ y: posterY }}>
            <motion.div
              initial={{ clipPath: 'inset(0 0 100% 0)', scale: 1.1 }}
              animate={{ clipPath: 'inset(0 0 0% 0)', scale: 1 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
            >
              {product.image ? (
                <TiltedCard
                  imageSrc={product.image}
                  altText={product.titleBg}
                  captionText={`${product.reg} · ${product.edition}`}
                  containerHeight={`calc(${POSTER_W} * 1.5)`}
                  containerWidth="100%"
                  imageHeight={`calc(${POSTER_W} * 1.5)`}
                  imageWidth={POSTER_W}
                  rotateAmplitude={8}
                  scaleOnHover={1.02}
                  showMobileWarning={false}
                  showTooltip
                />
              ) : (
                <div className="pd__placeholder display">{product.titleBg}</div>
              )}
            </motion.div>
            <span className="pd__reg">{product.reg}</span>
          </motion.div>

          <div className="pd__info">
            <Link to="/catalog" className="pd__back">
              ← каталог
            </Link>

            <DecryptedText
              text={`// ${kindLabel(product.kind)} · ${product.year} · тираж ${product.edition}`}
              animateOn="view"
              sequential
              speed={30}
              className="kicker kicker--acid"
              encryptedClassName="kicker"
              parentClassName="pd__kicker"
            />

            <h1 className="display pd__title">
              <SplitReveal text={product.titleBg} delay={0.45} stagger={0.03} />
            </h1>
            <motion.div
              className="pd__en"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {typeLabel(product.kind)} // {product.titleEn}
            </motion.div>

            <Reveal delay={0.6}>
              <p className="pd__desc">{product.desc}</p>
            </Reveal>

            <Reveal delay={0.7}>
              <div className="pd__stock">
                <div className="pd__stock-head">
                  <span className="kicker">Наличност</span>
                  <span className={`pd__stock-n ${product.stock <= 3 ? 'is-low' : ''}`}>
                    {soldOut ? 'Изчерпан' : `Остават ${product.stock}`}
                  </span>
                </div>
                <div className="pd__segments">
                  {Array.from({ length: segments }).map((_, i) => (
                    <motion.span
                      key={i}
                      className={`pd__seg ${i < filled ? 'is-on' : ''} ${product.stock <= 3 && i < filled ? 'is-low' : ''}`}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.9 + i * 0.05, type: 'spring', stiffness: 400, damping: 18 }}
                    />
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.8}>
              <dl className="pd__specs">
                {SPECS.map((s) => (
                  <div key={s.k} className="pd__spec">
                    <dt className="kicker">{s.k}</dt>
                    <dd>{s.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.9}>
              <div className="pd__buy">
                <div className="pd__price">
                  <span className="kicker">Цена</span>
                  <span className="display">{money(product.price)}</span>
                </div>
                <motion.button
                  className={`pd__add ${justAdded ? 'is-added' : ''}`}
                  onClick={onAdd}
                  disabled={soldOut || inCart >= product.stock}
                  whileTap={{ scale: 0.97 }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={justAdded ? 'added' : soldOut ? 'out' : 'add'}
                      initial={{ y: 22, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -22, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      {justAdded
                        ? '✓ В коша'
                        : soldOut
                          ? 'Изчерпан'
                          : inCart >= product.stock
                            ? 'Всичко е в коша ти'
                            : 'Добави в кош'}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
              <AnimatePresence>
                {inCart > 0 && (
                  <motion.button
                    className="pd__view-cart"
                    onClick={openDrawer}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {inCart} в коша → виж коша
                  </motion.button>
                )}
              </AnimatePresence>
            </Reveal>

            <div className="pd__pager">
              <Link to={`/product/${prev.id}`} className="pd__pager-link">
                <span className="kicker">← предишен</span>
                <span>{prev.titleBg}</span>
              </Link>
              <Link to={`/product/${next.id}`} className="pd__pager-link pd__pager-link--next">
                <span className="kicker">следващ →</span>
                <span>{next.titleBg}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="wrap pd-related">
          <div className="kicker kicker--acid">// от същата партида</div>
          <h2 className="display pd-related__title">
            <SplitReveal text="Още" onView />{' '}
            <span className="outline">
              <SplitReveal text="такива" onView delay={0.1} />
            </span>
          </h2>
          <div className="pd-related__grid">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
