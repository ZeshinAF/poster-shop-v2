import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '../components/Page';
import { ProductCard } from '../components/ProductCard';
import { SplitReveal } from '../components/motion';
import type { Kind } from '../lib/api';
import { useStore } from '../lib/store';
import './Catalog.css';

type Filter = 'all' | Kind;
type Sort = 'new' | 'price-low' | 'price-high' | 'az';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Всички' },
  { id: 'film', label: 'Филми' },
  { id: 'band', label: 'Музика' },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: 'new', label: 'Най-нови' },
  { id: 'price-low', label: 'Цена ↑' },
  { id: 'price-high', label: 'Цена ↓' },
  { id: 'az', label: 'А—Я' },
];

export default function Catalog() {
  const { products, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const kindParam = params.get('kind');
  const filter: Filter = kindParam === 'film' || kindParam === 'band' ? kindParam : 'all';
  const [sort, setSort] = useState<Sort>('new');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (filter === 'all' || p.kind === filter) &&
        (!q || p.titleBg.toLowerCase().includes(q) || p.titleEn.toLowerCase().includes(q))
    );
    const sorted = [...list];
    if (sort === 'price-low') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'az') sorted.sort((a, b) => a.titleBg.localeCompare(b.titleBg, 'bg'));
    else sorted.reverse();
    return sorted;
  }, [products, filter, sort, query]);

  function setFilter(f: Filter) {
    if (f === 'all') setParams({});
    else setParams({ kind: f });
  }

  return (
    <Page>
      <header className="cat-head wrap">
        <div className="kicker kicker--acid">// каталог · {products.length} заглавия</div>
        <h1 className="display cat-head__title">
          <SplitReveal text="Целият" delay={0.4} />
          <br />
          <span className="outline outline--acid">
            <SplitReveal text="тираж" delay={0.6} />
          </span>
        </h1>
      </header>

      <div className="cat-bar">
        <div className="wrap cat-bar__inner">
          <LayoutGroup id="filters">
            <div className="chips" role="tablist" aria-label="Категория">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  className={`chip ${filter === f.id ? 'is-active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {filter === f.id && (
                    <motion.span layoutId="chip-pill" className="chip__pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  <span className="chip__label">{f.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>

          <div className="cat-search">
            <span className="cat-search__prompt">&gt;</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="търси заглавие_"
              aria-label="Търси заглавие"
            />
          </div>

          <LayoutGroup id="sorts">
            <div className="sorts">
              {SORTS.map((s) => (
                <button key={s.id} className={`sort ${sort === s.id ? 'is-active' : ''}`} onClick={() => setSort(s.id)}>
                  {s.label}
                  {sort === s.id && <motion.span layoutId="sort-line" className="sort__line" />}
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>
      </div>

      <section className="wrap cat-grid-wrap">
        {loading ? (
          <div className="cat-empty kicker">зареждане на тиража…</div>
        ) : (
          <motion.div layout className="cat-grid">
            <AnimatePresence mode="popLayout">
              {visible.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                >
                  <ProductCard product={p} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {!loading && visible.length === 0 && (
          <motion.div className="cat-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="display">Нищо.</span>
            <span className="kicker">Няма такова заглавие в тиража.</span>
          </motion.div>
        )}
      </section>
    </Page>
  );
}
