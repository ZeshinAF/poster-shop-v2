import { useState } from 'react';
import { Link } from 'react-router-dom';
import FuzzyText from '../bits/FuzzyText';
import { Page } from '../components/Page';

export default function NotFound() {
  const [size] = useState(() => Math.round(Math.min(300, Math.max(110, window.innerWidth * 0.26))));
  return (
    <Page>
      <section
        className="wrap"
        style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 24,
          paddingTop: 120,
        }}
      >
        <div className="kicker kicker--acid">// грешка · сигналът е изгубен</div>
        <FuzzyText fontSize={size} fontWeight={700} fontFamily="Oswald" color="#d23b3b" baseIntensity={0.2} hoverIntensity={0.6} enableHover glitchMode>
          404
        </FuzzyText>
        <p style={{ color: 'var(--ink-2)', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
          Този плакат не съществува. Или никога не е бил отпечатан, или тиражът свърши преди да стигнеш.
        </p>
        <Link
          to="/catalog"
          style={{ fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--acid)' }}
        >
          Към каталога →
        </Link>
      </section>
    </Page>
  );
}
