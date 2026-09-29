import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/Page';
import { SplitReveal } from '../components/motion';
import { isDemo, money, OrderError, placeOrder } from '../lib/api';
import { useStore } from '../lib/store';
import './Checkout.css';

const FIELDS = [
  { name: 'name', label: 'Име и фамилия', type: 'text', autoComplete: 'name', wide: true },
  { name: 'email', label: 'Имейл', type: 'email', autoComplete: 'email', wide: true },
  { name: 'address', label: 'Адрес / офис на куриер', type: 'text', autoComplete: 'street-address', wide: true },
  { name: 'city', label: 'Град', type: 'text', autoComplete: 'address-level2', wide: false },
  { name: 'postcode', label: 'Пощ. код', type: 'text', autoComplete: 'postal-code', wide: false },
] as const;

export default function Checkout() {
  const { lines, subtotal, shipping, total, clear } = useStore();
  const [pay, setPay] = useState<'CARD' | 'COD'>('CARD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current?.reportValidity() || lines.length === 0) return;
    const fd = new FormData(formRef.current);
    setBusy(true);
    setError(null);
    try {
      const result = await placeOrder(
        {
          name: String(fd.get('name')),
          email: String(fd.get('email')),
          address: String(fd.get('address')),
          city: String(fd.get('city')),
          postcode: String(fd.get('postcode')),
          paymentMethod: pay,
          lines: lines.map((l) => ({ variantId: l.product.variantId, qty: l.qty })),
        },
        total
      );
      clear();
      navigate('/confirmation', { state: result });
    } catch (err) {
      setError(err instanceof OrderError ? err.message : 'Нещо се обърка. Опитай отново.');
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <Page>
        <section className="wrap co-empty">
          <div className="kicker kicker--acid">// плащане</div>
          <h1 className="display co-empty__title">
            <SplitReveal text="Кошът е празен." delay={0.4} />
          </h1>
          <Link to="/catalog" className="co-empty__link">
            Към каталога →
          </Link>
        </section>
      </Page>
    );
  }

  return (
    <Page>
      <section className="wrap co">
        <header className="co__head">
          <div className="kicker kicker--acid">// плащане · стъпка 01/01</div>
          <h1 className="display co__title">
            <SplitReveal text="Последна" delay={0.4} />
            <br />
            <span className="outline">
              <SplitReveal text="крачка" delay={0.55} />
            </span>
          </h1>
          <p className="co__sub">Ти вече плати с вниманието си. Това са само пари.</p>
          {isDemo && (
            <motion.div
              className="co__demo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              ⚠ Тестова версия — поръчката няма да бъде изпратена.
            </motion.div>
          )}
        </header>

        <div className="co__grid">
          <form ref={formRef} className="co__form" onSubmit={submit} noValidate={false}>
            <div className="co__section kicker">01 — Доставка</div>
            <div className="co__fields">
              {FIELDS.map((f, i) => (
                <motion.label
                  key={f.name}
                  className={`field ${f.wide ? 'field--wide' : ''}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <input name={f.name} type={f.type} autoComplete={f.autoComplete} placeholder=" " required />
                  <span className="field__label">{f.label}</span>
                  <span className="field__line" />
                </motion.label>
              ))}
            </div>

            <div className="co__section kicker">02 — Плащане</div>
            <LayoutGroup id="pay">
              <div className="pay">
                {(['CARD', 'COD'] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`pay__opt ${pay === m ? 'is-active' : ''}`}
                    onClick={() => setPay(m)}
                    aria-pressed={pay === m}
                  >
                    {pay === m && <motion.span layoutId="pay-bg" className="pay__bg" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                    <span className="pay__label">{m === 'CARD' ? 'Карта / Apple Pay' : 'Наложен платеж'}</span>
                    <span className="pay__hint">{m === 'CARD' ? 'потвърждение по имейл' : 'плащаш на куриера'}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="co__error"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -4, 4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  role="alert"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" className="co__submit" disabled={busy} whileTap={{ scale: 0.98 }}>
              <span>{busy ? 'Печатаме поръчката…' : 'Плати сега'}</span>
              <span>{money(total)} →</span>
              {busy && <motion.span className="co__submit-bar" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.1 }} />}
            </motion.button>
          </form>

          <aside className="co__summary">
            <div className="kicker">// обобщение</div>
            <ul className="co__lines">
              {lines.map((l, i) => (
                <motion.li
                  key={l.product.id}
                  className="co__line"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                >
                  <div className="co__thumb">{l.product.image && <img src={l.product.image} alt="" />}</div>
                  <div className="co__line-info">
                    <span className="co__line-name">{l.product.titleBg}</span>
                    <span className="co__line-meta">
                      {l.qty} × {money(l.product.price)}
                    </span>
                  </div>
                  <span className="co__line-total">{money(l.lineTotal)}</span>
                </motion.li>
              ))}
            </ul>
            <div className="co__row">
              <span>Междинна сума</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="co__row">
              <span>Доставка</span>
              <span>{shipping === 0 ? 'безплатна' : money(shipping)}</span>
            </div>
            <div className="co__row co__row--total">
              <span>Общо</span>
              <span>{money(total)}</span>
            </div>
          </aside>
        </div>
      </section>
    </Page>
  );
}
