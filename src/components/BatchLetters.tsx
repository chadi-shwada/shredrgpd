import { useId, useMemo, useState } from 'react';
import { copyText, downloadText } from '../browser';
import { DPO_CONTACTS } from '../data/contacts';
import { useI18n } from '../i18n';
import type { Breach } from '../lib/breaches';
import { todayIso } from '../lib/dates';
import type { Lang } from '../lib/lang';
import { breachLetterInput } from '../lib/letterLink';
import { generateLetter, kindLabel, letterToText, mailtoHref, type InitialKind } from '../lib/letters';
import { newId, withLetter, type TrackedRequest } from '../lib/tracking';
import { useTracking } from '../useTracking';
import { ExternalLink } from './ExternalLink';
import { Icon } from './Icon';
import { LetterLanguage } from './LetterLanguage';
import { Notice } from './Notice';

const KINDS: InitialKind[] = ['acces', 'effacement', 'fermeture'];

/** Une lettre par fuite cochée, en une fois, avec ajout groupé au suivi. */
export function BatchLetters({ breaches }: { breaches: Breach[] }) {
  const id = useId();
  const { t, lang, link } = useI18n();
  const [kind, setKind] = useState<InitialKind>('acces');
  const [letterLang, setLetterLang] = useState<Lang>('fr');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [keepCopy, setKeepCopy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { update } = useTracking();
  const today = todayIso();

  const letters = useMemo(() => {
    if (!fullName.trim()) return [];
    return breaches.map((breach) => ({
      breach,
      letter: generateLetter(breachLetterInput(breach, kind, { fullName, email }, today, letterLang), letterLang),
      contact: DPO_CONTACTS[breach.name],
    }));
  }, [breaches, kind, fullName, email, today, letterLang]);

  const onDownloadAll = () => {
    const text = letters
      .map(({ breach, letter, contact }) =>
        [`===== ${breach.title}${contact ? ` (${contact.contact})` : ''} =====`, '', letterToText(letter)].join('\n'),
      )
      .join('\n\n');
    downloadText(`shred-${t('lettres', 'letters')}-${today}.txt`, text);
  };

  const onTrackAll = () => {
    update((list) => [
      ...list,
      ...letters.map(({ breach, letter }) => {
        const request: TrackedRequest = {
          id: newId(),
          site: breach.title,
          kind,
          channel: 'email',
          sentOn: today,
          status: 'envoyee',
          notes: `${t('Fuite HIBP : ', 'HIBP breach: ')}${breach.name}`,
        };
        return keepCopy ? withLetter(request, { date: today, subject: letter.subject, body: letter.body }) : request;
      }),
    ]);
    const n = letters.length;
    setFeedback(
      t(
        `${n} demande${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''} au suivi.`,
        `${n} request${n > 1 ? 's' : ''} added to the tracker.`,
      ),
    );
  };

  return (
    <div className="batch">
      <h3>{t('Écrire à toutes les entreprises', 'Write to all the companies')}</h3>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-kind`}>{t('Demande', 'Request')}</label>
          <select
            id={`${id}-kind`}
            className="select"
            value={kind}
            onChange={(e) => setKind(e.target.value as InitialKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k === 'acces'
                  ? t('Savoir ce qui a fuité (accès)', 'Find out what leaked (access)')
                  : kindLabel(k, lang)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-name`}>{t('Ton nom complet', 'Your full name')}</label>
          <input
            id={`${id}-name`}
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-email`}>
          {t('E-mail concerné par les fuites', 'Email address in the breaches')}{' '}
          <span className="optional">{t('(facultatif)', '(optional)')}</span>
        </label>
        <input
          id={`${id}-email`}
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          spellCheck={false}
        />
      </div>
      <LetterLanguage value={letterLang} onChange={setLetterLang} label="letters" />

      {letters.length === 0 ? (
        <p className="hint">
          {t(
            `Indique ton nom pour préparer les ${breaches.length} lettres.`,
            `Enter your name to prepare the ${breaches.length} letters.`,
          )}
        </p>
      ) : (
        <>
          <ul className="batch__list">
            {letters.map(({ breach, letter, contact }) => (
              <li key={breach.name}>
                <div>
                  <strong>{breach.title}</strong>
                  <span className="hint">
                    {contact ? (
                      <>
                        DPO : {contact.contact} · <ExternalLink href={contact.source}>source</ExternalLink>
                      </>
                    ) : (
                      t(
                        'Contact à trouver dans sa politique de confidentialité',
                        'Find the contact in its privacy policy',
                      )
                    )}
                  </span>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn btn--sm" onClick={() => copyText(letterToText(letter))}>
                    <Icon name="copy" size={16} />
                    {t('Copier', 'Copy')}
                  </button>
                  <a
                    className="btn btn--sm"
                    href={mailtoHref(letter, contact?.kind === 'email' ? contact.contact : '')}
                  >
                    <Icon name="mail" size={16} />
                    {t('Messagerie', 'Email app')}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <label className="check">
            <input type="checkbox" checked={keepCopy} onChange={(e) => setKeepCopy(e.target.checked)} />
            <span>
              {t(
                'Garder une copie des lettres dans le suivi, pour un éventuel dossier CNIL (elles contiennent ton nom et restent dans ce navigateur)',
                'Keep a copy of the letters in the tracker, for a possible complaint to the CNIL (they contain your name and stay in this browser)',
              )}
            </span>
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={onTrackAll}>
              <Icon name="plus" size={18} />
              {t('Tout ajouter au suivi', 'Add all to the tracker')}
            </button>
            <button type="button" className="btn" onClick={onDownloadAll}>
              <Icon name="download" size={18} />
              {t('Tout télécharger', 'Download all')}
            </button>
          </div>
          <div aria-live="polite">
            {feedback && (
              <Notice tone="ok">
                <p>
                  {feedback} <a href={link('/suivi')}>{t('Voir le suivi', 'See the tracker')}</a>
                </p>
              </Notice>
            )}
          </div>
        </>
      )}
    </div>
  );
}
