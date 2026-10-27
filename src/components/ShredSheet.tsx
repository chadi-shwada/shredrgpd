import type { CSSProperties } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

/**
 * Animation d'accueil (décorative) : une fiche de fuite est analysée,
 * découpée en bandes comme le logo, puis remplacée par la confirmation.
 * La fiche reprend une vraie fuite (Deezer, 2019, catalogue Have I Been
 * Pwned) avec une personne fictive aux valeurs masquées.
 * Respecte prefers-reduced-motion (voir global.css).
 */

const SLICES = 12;
const WIDTH = 100 / SLICES;

function LeakCard() {
  const { t } = useI18n();
  return (
    <div className="terminal">
      <div className="terminal__bar">
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__title">{t('extrait de fuite · deezer_2019', 'breach extract · deezer_2019')}</span>
      </div>
      <div className="terminal__body">
        <span className="terminal__alert">
          {t('Fuite détectée · 4 champs exposés', 'Breach detected · 4 fields exposed')}
        </span>
        <dl className="terminal__rows">
          <div className="terminal__row">
            <dt>email</dt>
            <dd>c•••••.m•••••@gmail.com</dd>
          </div>
          <div className="terminal__row">
            <dt>birthdate</dt>
            <dd>1993-••-14</dd>
          </div>
          <div className="terminal__row">
            <dt>ip</dt>
            <dd className="hl">86.2••.•••.41</dd>
          </div>
          <div className="terminal__row">
            <dt>location</dt>
            <dd>Paris, France</dd>
          </div>
        </dl>
        <p className="terminal__prompt">
          <b>$</b> {t('shredrgpd --effacer --rgpd art.17', 'shredrgpd --erase --gdpr art.17')}
          <span className="terminal__cursor" />
        </p>
        <p className="terminal__hex">
          0x53 0x68 0x72 0x65 0x64 0x00 0x6c 0x65 0x61 0x6b 0x00 0x64 0x61 0x74 0x61 0x3a 0x01 0x00
        </p>
      </div>
    </div>
  );
}

export function ShredSheet() {
  const { t } = useI18n();
  return (
    <div className="shred" aria-hidden="true">
      <div className="shred__stage">
        <div className="shred__done">
          <span className="shred__check">
            <Icon name="check" size={28} />
          </span>
          <div>
            <strong>{t("Demande d'effacement envoyée", 'Erasure request sent')}</strong>
            <span>{t('art. 17 RGPD · réponse sous un mois', 'art. 17 GDPR · reply within one month')}</span>
          </div>
        </div>
        {Array.from({ length: SLICES }, (_, i) => (
          <div
            key={i}
            className="shred__slice"
            style={
              {
                clipPath: `inset(0 ${100 - (i + 1) * WIDTH}% 0 ${i * WIDTH}%)`,
                '--i': i,
                '--r': `${(i % 2 === 0 ? 1 : -1) * (1 + (i % 3))}deg`,
              } as CSSProperties
            }
          >
            <LeakCard />
          </div>
        ))}
        <span className="shred__scan" />
      </div>
      <div className="shred__bits">
        {Array.from({ length: SLICES }, (_, i) => (
          <span key={i}>{((i * 2654435761) >>> 0).toString(2).padStart(10, '1').slice(0, 10)}</span>
        ))}
      </div>
    </div>
  );
}
