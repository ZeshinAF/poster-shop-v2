import { useState } from 'react';
import { Link } from 'react-router-dom';
import FuzzyText from '../bits/FuzzyText';
import { isDemo } from '../lib/api';
import './Footer.css';

export function Footer() {
  // FuzzyText renders to canvas, whose font string can't take clamp() — size it in px up front.
  const [size] = useState(() => Math.round(Math.min(352, Math.max(72, window.innerWidth * 0.22))));
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          <div>
            <div className="kicker kicker--acid">// тираж</div>
            <p className="foot__lede">
              Печатница за несъгласни. Плакати, дрехи и други улики за хора с позиция. Без реклами. Без благодарствено писмо.
            </p>
          </div>
          <div>
            <div className="kicker">// навигация</div>
            <ul className="foot__list">
              <li>
                <Link to="/">Начало</Link>
              </li>
              <li>
                <Link to="/catalog">Каталог</Link>
              </li>
              <li>
                <Link to="/catalog?kind=film">Филми</Link>
              </li>
              <li>
                <Link to="/catalog?kind=band">Музика</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="kicker">// доставка</div>
            <ul className="foot__list foot__list--mono">
              <li>6 € до адрес или офис</li>
              <li>Безплатна над 80 €</li>
              <li>Карта или наложен платеж</li>
              <li>Опаковано без реклами</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="foot__giant" aria-hidden="true">
        <FuzzyText
          fontSize={size}
          fontWeight={700}
          fontFamily="Oswald"
          color="#e9e5db"
          baseIntensity={0.08}
          hoverIntensity={0.45}
          enableHover
          glitchMode
          glitchInterval={3200}
          glitchDuration={180}
        >
          ТИРАЖ
        </FuzzyText>
      </div>

      <div className="wrap foot__bar">
        <span>© {new Date().getFullYear()} Тираж</span>
        <span>{isDemo ? 'v2 · тестова версия · демо режим' : 'v2 · тестова версия'}</span>
        <span>Без реклами. Без благодарствено писмо.</span>
      </div>
    </footer>
  );
}
