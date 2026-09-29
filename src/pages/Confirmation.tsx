import { motion } from 'motion/react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import DecryptedText from '../bits/DecryptedText';
import { Page } from '../components/Page';
import { SplitReveal } from '../components/motion';
import { money, type OrderResult } from '../lib/api';
import './Confirmation.css';

export default function Confirmation() {
  const order = useLocation().state as OrderResult | null;
  if (!order) return <Navigate to="/" replace />;

  return (
    <Page>
      <section className="done wrap">
        <motion.div
          className="done__stamp"
          initial={{ scale: 3.2, rotate: -28, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 520, damping: 22, mass: 1.2 }}
          aria-hidden="true"
        >
          <span>Отпечатано</span>
          <span className="done__stamp-sub">{order.demo ? 'демо' : 'тираж потвърден'}</span>
        </motion.div>

        <div className="kicker kicker--acid">// поръчката е приета</div>
        <h1 className="display done__title">
          <SplitReveal text="Мастилото" delay={0.4} />
          <br />
          <span className="outline outline--acid">
            <SplitReveal text="е твое." delay={0.6} />
          </span>
        </h1>

        <div className="done__meta">
          <div>
            <span className="kicker">Номер</span>
            <DecryptedText
              text={order.orderNumber}
              animateOn="view"
              sequential
              speed={60}
              className="done__num"
              encryptedClassName="done__num done__num--enc"
            />
          </div>
          <div>
            <span className="kicker">Общо</span>
            <span className="done__num">{money(order.total)}</span>
          </div>
        </div>

        <motion.p className="done__text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
          Ще пристигне в тубус. Без реклами, без благодарствено писмо. Закачи го и не питай никого.
          {order.demo && ' (Това беше тестова поръчка — нищо не е изпратено.)'}
        </motion.p>

        <Link to="/catalog" className="done__cta">
          Обратно към тиража →
        </Link>
      </section>
    </Page>
  );
}
