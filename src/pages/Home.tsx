import { motion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DecryptedText from '../bits/DecryptedText';
import Magnet from '../bits/Magnet';
import ScrollVelocity from '../bits/ScrollVelocity';
import TiltedCard from '../bits/TiltedCard';
import { GlitchField } from '../components/GlitchField';
import { Page } from '../components/Page';
import { CountUp, Reveal, ScrubText, SplitReveal } from '../components/motion';
import { money, typeLabel, type Kind, type Product } from '../lib/api';
import { poster, posterFor } from '../lib/images';
import { useStore } from '../lib/store';
import './Home.css';

// Module-level so the canvas effect never sees a "new" array and re-lays out.
const GLITCH_COLORS = ['#1c2412', '#2b3d14', '#3f5c17', '#a3e635', '#2a1212'];
const GLITCH_CHARS = 'ТИРАЖ//ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*<>0123456789';

function Stamp() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const spin = useSpring(useTransform(velocity, [-2000, 0, 2000], [-40, 0, 40]), { stiffness: 80, damping: 30 });
  return (
    <motion.div className="stamp" style={{ rotate: spin }} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="stamp__ring">
        <defs>
          <path id="stamp-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text>
          {/* textLength = the circle's circumference (2π·78): the letter spacing stretches so
              the text closes the ring exactly, leaving just one space before it starts again. */}
          <textPath href="#stamp-circle" textLength={490} lengthAdjust="spacing">
            {`ПЕЧАТ ✕ ПЛАТ ✕ ПОЗИЦИЯ ✕ БЕЗ КОМПРОМИС ✕${NBSP}`}
          </textPath>
        </text>
      </svg>
      <span className="stamp__core">//</span>
    </motion.div>
  );
}

function Hero({ count }: { count: number }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '38%']);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [0.34, 0]);

  return (
    <section ref={ref} className="hero">
      <motion.div className="hero__bg" style={{ opacity: bgOpacity }} aria-hidden="true">
        <GlitchField colors={GLITCH_COLORS} characters={GLITCH_CHARS} />
      </motion.div>
      <div className="hero__fade" aria-hidden="true" />

      <div className="wrap hero__inner">
        <motion.div className="hero__top" style={{ opacity: fade }}>
          <DecryptedText
            text="// печатница за несъгласни"
            animateOn="view"
            speed={45}
            maxIterations={14}
            sequential
            className="kicker kicker--acid"
            encryptedClassName="kicker"
          />
          <span className="kicker">сезон 04 · софия · 2026</span>
        </motion.div>

        <motion.h1 className="display hero__title" style={{ y: titleY, scale: titleScale }}>
          <SplitReveal text="ТИРАЖ" delay={0.25} stagger={0.07} />
        </motion.h1>

        <motion.div className="hero__row" style={{ opacity: fade }}>
          <motion.p
            className="hero__lede"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            Плакати за стени и дрехи за хора, които обявяват позиция. Отпечатано и скроено без компромис. Без реклами —
            само писмо от нас в пакета.
          </motion.p>

          <motion.div
            className="hero__cta-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
          >
            <Magnet padding={70} magnetStrength={3}>
              <Link to="/catalog" className="cta">
                <span className="cta__label">Виж тиража</span>
                <span className="cta__arrow">→</span>
              </Link>
            </Magnet>
            <span className="kicker hero__count">{count || '—'} заглавия в обращение</span>
          </motion.div>
        </motion.div>
      </div>

      <Stamp />

      <motion.div className="hero__scroll" style={{ opacity: fade }} aria-hidden="true">
        <span className="kicker">скрол</span>
        <span className="hero__scroll-line" />
      </motion.div>
    </section>
  );
}

// Leading non-breaking space on each repeated marquee copy: a plain space at the
// edge of a copy gets collapsed, gluing the previous copy's ✕ to the first word.
const NBSP = String.fromCharCode(160);

function Tape() {
  return (
    <section className="tape" aria-hidden="true">
      <div className="tape__band tape__band--acid">
        <ScrollVelocity
          texts={[`${NBSP}Плакати ✕ Дрехи ✕ Мастило ✕ Плат ✕ Позиция ✕`]}
          velocity={60}
          numCopies={6}
          className="tape__text"
        />
      </div>
      <div className="tape__band tape__band--blood">
        <ScrollVelocity
          texts={[`${NBSP}Без реклами ✕ Без компромис ✕ С писмо вътре ✕`]}
          velocity={-50}
          numCopies={6}
          className="tape__text"
        />
      </div>
    </section>
  );
}

function Gallery({ products }: { products: Product[] }) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const smoothX = useSpring(x, { stiffness: 120, damping: 30, mass: 0.3 });
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useLayoutEffect(() => {
    const measure = () => {
      if (track.current) setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [products.length]);

  const featured = products.slice(0, 7);

  return (
    <section ref={ref} className="gallery" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="gallery__sticky">
        <motion.div ref={track} className="gallery__track" style={{ x: smoothX }}>
          <div className="gallery__intro">
            <div className="kicker kicker--acid">// нови в тиража</div>
            <h2 className="display gallery__heading">
              <SplitReveal text="Тази" onView />
              <br />
              <span className="outline">
                <SplitReveal text="партида" onView delay={0.15} />
              </span>
            </h2>
            <p className="gallery__note">Скролни. Постерите идват при теб. Задръж курсора — наклони ги.</p>
          </div>

          {featured.map((p, i) => (
            <Link key={p.id} to={`/product/${p.id}`} className="gallery__item" data-cursor="view">
              <div className="gallery__num">
                {String(i + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
              </div>
              {p.image ? (
                <TiltedCard
                  imageSrc={posterFor(p.image, 373)}
                  altText={p.titleBg}
                  captionText={`${typeLabel(p.kind)} // ${money(p.price)}`}
                  containerHeight="min(62vh, 560px)"
                  containerWidth="min(41vh, 373px)"
                  imageHeight="min(62vh, 560px)"
                  imageWidth="min(41vh, 373px)"
                  rotateAmplitude={11}
                  scaleOnHover={1.04}
                  showMobileWarning={false}
                  showTooltip={false}
                />
              ) : (
                <div className="gallery__placeholder">{p.titleBg}</div>
              )}
              <div className="gallery__caption">
                <span className="gallery__name">{p.titleBg}</span>
                <span className="gallery__price">{money(p.price)}</span>
              </div>
            </Link>
          ))}

          <Link to="/catalog" className="gallery__more" data-cursor="view">
            <span className="display">
              Целият
              <br />
              тираж →
            </span>
          </Link>
        </motion.div>
        <div className="gallery__progress wrap">
          <motion.span style={{ scaleX: bar }} />
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="manifesto wrap">
      <div className="manifesto__side">
        <div className="kicker kicker--acid">// манифест</div>
        <div className="manifesto__index display">01</div>
      </div>
      <ScrubText
        className="manifesto__text"
        text="Не сме бутик и не сме галерия. Правим плакати и дрехи за хора, които знаят какво искат. Опаковаме всяка поръчка така, сякаш я пращаме на приятел. Донякъде така и е."
        accents={['искат.', 'приятел.']}
      />
    </section>
  );
}

function Specs({ count }: { count: number }) {
  const items = [
    { k: 'Заглавия', v: <CountUp to={count} />, note: 'В обращение сега.' },
    { k: 'Реклами', v: <CountUp to={0} />, note: 'Нито една. Никъде.' },
    { k: 'Писма в пакета', v: <CountUp to={1} />, note: 'Във всяка поръчка. Прочети го.' },
    { k: 'Безплатна доставка', v: <CountUp to={80} suffix=" €" />, note: 'Над тази сума. Под нея — 6 €.' },
  ];
  return (
    <section className="specs wrap">
      {items.map((it, i) => (
        <Reveal key={it.k} delay={i * 0.08} className="spec">
          <motion.span
            className="spec__line"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.1 }}
          />
          <div className="kicker">{it.k}</div>
          <div className="display spec__value">{it.v}</div>
          <div className="spec__note">{it.note}</div>
        </Reveal>
      ))}
    </section>
  );
}

function Split({ products }: { products: Product[] }) {
  const [hover, setHover] = useState<Kind | null>(null);
  const cover = (k: Kind) => products.find((p) => p.kind === k && p.image)?.image ?? null;
  const panels: { kind: Kind; label: string; sub: string }[] = [
    { kind: 'film', label: 'Филми', sub: 'Кино, отпечатано като улика' },
    { kind: 'band', label: 'Музика', sub: 'Плочи, които не се въртят' },
  ];
  return (
    <section className="split wrap">
      {panels.map((p) => {
        const img = cover(p.kind);
        const active = hover === p.kind;
        return (
          <motion.div
            key={p.kind}
            className="split__panel"
            animate={{ flexGrow: hover ? (active ? 1.7 : 0.8) : 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 24 }}
            onHoverStart={() => setHover(p.kind)}
            onHoverEnd={() => setHover(null)}
          >
            <Link to={`/catalog?kind=${p.kind}`} className="split__link" data-cursor="view">
              {img && (
                <motion.img
                  src={poster(img, 1280)}
                  decoding="async"
                  alt=""
                  className="split__img"
                  animate={{ scale: active ? 1.08 : 1.2, opacity: active ? 0.55 : 0.18 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <div className="split__shade" />
              <div className="split__content">
                <span className="kicker kicker--acid">{p.kind === 'film' ? '// A' : '// B'}</span>
                <span className={`display split__label ${active ? '' : 'outline'}`}>{p.label}</span>
                <span className="split__sub">{p.sub} →</span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </section>
  );
}

export default function Home() {
  const { products } = useStore();
  return (
    <Page>
      <Hero count={products.length} />
      <Tape />
      {products.length > 0 && <Gallery products={products} />}
      <Manifesto />
      <Specs count={products.length} />
      {products.length > 0 && <Split products={products} />}
    </Page>
  );
}
