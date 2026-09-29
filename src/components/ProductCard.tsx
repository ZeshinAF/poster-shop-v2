import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { kindLabel, money, typeLabel, type Product } from '../lib/api';
import { posterImgProps } from '../lib/images';
import { useStore } from '../lib/store';
import './ProductCard.css';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useStore();
  const [added, setAdded] = useState(false);
  // Chromatic ghosts are only mounted while hovered — as always-present
  // copies they tripled image decode/raster work across the whole grid.
  const [hovered, setHovered] = useState(false);
  const soldOut = product.stock <= 0;
  const imgProps = product.image
    ? posterImgProps(product.image, '(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw')
    : null;
  const low = !soldOut && product.stock <= 3;

  function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    add(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <motion.article
      className="pcard"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 60, clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
    >
      <div className="pcard__media">
      <Link to={`/product/${product.id}`} className="pcard__link" data-cursor="view" aria-label={product.titleBg}>
        <div className="pcard__art">
          {product.image ? (
            <>
              {hovered && (
                <>
                  <img className="pcard__img pcard__img--r" {...imgProps} alt="" aria-hidden="true" decoding="async" />
                  <img className="pcard__img pcard__img--g" {...imgProps} alt="" aria-hidden="true" decoding="async" />
                </>
              )}
              <img className="pcard__img pcard__img--main" {...imgProps} alt={product.titleBg} loading="lazy" decoding="async" />
            </>
          ) : (
            <span className="pcard__ghost">{product.titleBg}</span>
          )}
          <span className="pcard__scan" aria-hidden="true" />
          <span className="pcard__reg">{product.reg}</span>
          <span className="pcard__ed">{product.edition}</span>
          {(soldOut || low) && (
            <span className={`pcard__flag ${soldOut ? 'pcard__flag--out' : ''}`}>
              {soldOut ? 'Изчерпан' : `Последни ${product.stock}`}
            </span>
          )}
          <span className="pcard__label">
            {typeLabel(product.kind)} // {product.titleEn}
          </span>
        </div>
      </Link>
      <motion.button
        className={`pcard__add ${added ? 'is-added' : ''}`}
        onClick={onAdd}
        disabled={soldOut}
        whileTap={{ scale: 0.85 }}
        aria-label={`Добави ${product.titleBg} в кош`}
      >
        <motion.span key={added ? 'y' : 'n'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
          {added ? '✓' : '+'}
        </motion.span>
      </motion.button>
      </div>
      <Link to={`/product/${product.id}`} className="pcard__body" tabIndex={-1}>
        <h3 className="pcard__title">{product.titleBg}</h3>
        <div className="pcard__meta">
          <span>
            {kindLabel(product.kind)} · {product.year}
          </span>
          <span className="pcard__price">{money(product.price)}</span>
        </div>
      </Link>
    </motion.article>
  );
}
