import { useId, useState } from 'react';
import { findBreachesInText, PASTE_MAX_LENGTH, type Breach, type PastedMatch } from '../lib/breaches';
import { formatLong } from '../lib/dates';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { Notice } from './Notice';

/**
 * Coller la page de résultats de Have I Been Pwned pour cocher les fuites d'un
 * coup. Le texte collé contient l'adresse e-mail : il reste dans le navigateur
 * et est effacé dès l'analyse.
 */
export function PasteResults({ breaches, onAdd }: { breaches: Breach[]; onAdd: (names: string[]) => void }) {
  const id = useId();
  const { t, lang } = useI18n();
  const [text, setText] = useState('');
  const [matches, setMatches] = useState<PastedMatch[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const analyse = () => {
    const found = findBreachesInText(breaches, text);
    setMatches(found);
    setPicked(found.filter((m) => m.certain).map((m) => m.breach.name));
    setText('');
  };

  const togglePick = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  const confirm = () => {
    onAdd(picked);
    setMatches(null);
    setPicked([]);
  };

  return (
    <div className="paste">
      <div className="field">
        <label htmlFor={`${id}-text`}>{t('Colle ici la page de résultats', 'Paste the results page here')}</label>
        <textarea
          id={`${id}-text`}
          className="textarea paste__input"
          rows={4}
          value={text}
          maxLength={PASTE_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${id}-hint`}
        />
        <p className="hint" id={`${id}-hint`}>
          {t(
            "Sur la page de résultats, sélectionne tout (Ctrl+A, ou « Tout sélectionner » sur téléphone), copie, puis colle ici. Le texte reste dans ton navigateur et est effacé dès l'analyse.",
            'On the results page, select all (Ctrl+A, or “Select all” on a phone), copy, then paste here. The text stays in your browser and is deleted as soon as it has been analysed.',
          )}
        </p>
      </div>
      <button type="button" className="btn btn--primary" onClick={analyse} disabled={!text.trim()}>
        <Icon name="search" size={18} />
        {t('Repérer les fuites', 'Find the breaches')}
      </button>

      <div aria-live="polite">
        {matches && matches.length === 0 && (
          <Notice tone="warn">
            <p>
              {t(
                'Aucune fuite reconnue dans ce texte. Vérifie que tu as copié la page de résultats, ou cherche les noms dans la liste ci-dessous.',
                'No breach recognised in this text. Check that you copied the results page, or search for the names in the list below.',
              )}
            </p>
          </Notice>
        )}
        {matches && matches.length > 0 && (
          <div className="paste__found">
            <p>
              <strong>
                {t(
                  `${matches.length} fuite${matches.length > 1 ? 's' : ''} reconnue${matches.length > 1 ? 's' : ''}.`,
                  `${matches.length} breach${matches.length > 1 ? 'es' : ''} recognised.`,
                )}
              </strong>{' '}
              {t(
                'Vérifie la liste avant de continuer : décoche ce qui ne te concerne pas.',
                'Check the list before you continue: untick anything that does not concern you.',
              )}
            </p>
            <ul className="paste__list">
              {matches.map(({ breach, certain }) => (
                <li key={breach.name}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={picked.includes(breach.name)}
                      onChange={() => togglePick(breach.name)}
                    />
                    <span>
                      <strong>{breach.title}</strong>{' '}
                      <span className="hint">
                        {breach.domain || breach.name} · {formatLong(breach.date, lang)}
                      </span>
                      {!certain && <span className="breach__flag">{t('à confirmer', 'to confirm')}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {matches.some((m) => !m.certain) && (
              <p className="hint">
                {t(
                  "« À confirmer » : nom repéré dans une phrase, un menu ou un pied de page, ou porté par plusieurs fuites. Coche-le seulement s'il figure bien dans tes résultats.",
                  '“To confirm”: a name found in a sentence, a menu or a footer, or shared by several breaches. Tick it only if it really is in your results.',
                )}
              </p>
            )}
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={confirm} disabled={picked.length === 0}>
                <Icon name="check" size={18} />
                {t(
                  `Cocher ${picked.length > 1 ? `ces ${picked.length} fuites` : 'cette fuite'}`,
                  `Tick ${picked.length > 1 ? `these ${picked.length} breaches` : 'this breach'}`,
                )}
              </button>
              <button type="button" className="btn" onClick={() => setMatches(null)}>
                {t('Annuler', 'Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
