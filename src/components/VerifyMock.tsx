import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { dataClassLabel } from '../lib/breaches';
import type { Lang } from '../lib/lang';
import { Icon } from './Icon';

/**
 * Aperçu animé de la page Vérifier (décoratif) : frappe de la recherche,
 * apparition des fuites, coches successives, compteur mis à jour, puis bouton
 * « Écrire la lettre » mis en avant.
 * Les fuites sont réelles : ce sont les trois premiers résultats de la recherche
 * « mobile » dans le catalogue Have I Been Pwned (vérifié le 6 octobre 2026),
 * avec leurs types de données (libellés HIBP) affichés comme sur la page Vérifier.
 * Ne tourne que lorsqu'il est visible ; état final fixe si prefers-reduced-motion.
 */

const BREACHES = [
  {
    title: 'Free',
    domain: 'free.fr',
    date: { fr: 'oct. 2024', en: 'Oct 2024' },
    classes: ['Bank account numbers', 'Dates of birth', 'Genders', 'Names', 'Phone numbers', 'Physical addresses'],
  },
  {
    title: 'La Poste Mobile',
    domain: 'lapostemobile.fr',
    date: { fr: 'juil. 2022', en: 'Jul 2022' },
    classes: [
      'Bank account numbers',
      'Dates of birth',
      'Email addresses',
      'Genders',
      'Names',
      'Phone numbers',
      'Physical addresses',
    ],
  },
  {
    title: 'ActMobile',
    domain: 'actmobile.com',
    date: { fr: 'oct. 2021', en: 'Oct 2021' },
    classes: ['Email addresses', 'IP addresses'],
  },
];

/** Nombre de types affichés par fuite, comme sur la page Vérifier ; les autres sont résumés en « +N ». */
const SHOWN = 3;

const QUERY = 'mobile';
const RISKY = new Set(['Passwords', 'Bank account numbers']);

interface Frame {
  query: string;
  rows: number;
  selected: number;
  cta: boolean;
}

const START: Frame = { query: '', rows: 0, selected: 0, cta: false };
const END: Frame = { query: QUERY, rows: BREACHES.length, selected: 2, cta: true };

/** Chronologie : [instant en ms, modification de l'état]. */
function timeline(): [number, Partial<Frame>][] {
  const steps: [number, Partial<Frame>][] = [[0, START]];
  for (let i = 1; i <= QUERY.length; i++) steps.push([400 + i * 110, { query: QUERY.slice(0, i) }]);
  steps.push([1350, { rows: 1 }], [1500, { rows: 2 }], [1650, { rows: 3 }]);
  steps.push([2600, { selected: 1 }], [3600, { selected: 2 }], [4400, { cta: true }]);
  return steps;
}

const LOOP_MS = 7800;

/** Nombre de types de données distincts parmi les fuites cochées. */
export function exposedCount(selected: number): number {
  return new Set(BREACHES.slice(0, selected).flatMap((b) => b.classes)).size;
}

function footerText(selected: number, lang: Lang): string {
  if (selected === 0) return lang === 'en' ? 'Tick the breaches found' : 'Coche les fuites trouvées';
  const types = exposedCount(selected);
  return lang === 'en'
    ? `${selected} breach${selected > 1 ? 'es' : ''} · ${types} data types exposed`
    : `${selected} fuite${selected > 1 ? 's' : ''} · ${types} types de données exposés`;
}

export function VerifyMock() {
  const ref = useRef<HTMLDivElement>(null);
  const { t, lang } = useI18n();
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [frame, setFrame] = useState<Frame>(reduced ? END : START);

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    let timers: number[] = [];
    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const play = () => {
      clear();
      for (const [at, change] of timeline()) {
        timers.push(window.setTimeout(() => setFrame((f) => ({ ...f, ...change })), at));
      }
      timers.push(window.setTimeout(play, LOOP_MS));
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) play();
      else clear();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clear();
    };
  }, [reduced]);

  return (
    <div className="mock" aria-hidden="true" ref={ref}>
      <div className="mock__bar">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="mock__url">{t('shred / vérifier', 'shred / check')}</span>
      </div>
      <div className="mock__body">
        <div className="mock__search" data-active={frame.query.length > 0}>
          <Icon name="search" size={16} />
          <span>
            {frame.query || (
              <span className="mock__placeholder">{t('Nom de la fuite ou du site', 'Breach or website name')}</span>
            )}
          </span>
          {!frame.cta && <span className="terminal__cursor" />}
        </div>
        {BREACHES.map((b, i) => (
          <div className="mock__row" key={b.title} data-visible={i < frame.rows} data-selected={i < frame.selected}>
            <span className="mock__check">{i < frame.selected && <Icon name="check" size={12} />}</span>
            <div>
              <strong>{b.title}</strong>
              <span className="mock__meta">
                {b.domain} · {b.date[lang]}
              </span>
              <span className="mock__chips">
                {b.classes.slice(0, SHOWN).map((c) => (
                  <span key={c} className={`chip${RISKY.has(c) ? ' chip--danger' : ''}`}>
                    {dataClassLabel(c, lang)}
                  </span>
                ))}
                {b.classes.length > SHOWN && <span className="chip">+{b.classes.length - SHOWN}</span>}
              </span>
            </div>
          </div>
        ))}
        <div className="mock__footer">
          <span>{footerText(frame.selected, lang)}</span>
          <span className="mock__cta" data-active={frame.cta}>
            {t('Écrire la lettre', 'Write the letter')} <Icon name="arrow" size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
