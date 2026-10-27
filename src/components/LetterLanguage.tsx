import { useId } from 'react';
import { useI18n } from '../i18n';
import type { Lang } from '../lib/lang';

/**
 * Langue d'une lettre (ou du récapitulatif de plainte CNIL), indépendante de celle de la
 * page : le français par défaut (entreprises françaises, formulaire de la CNIL), l'anglais
 * pour la lire ou écrire à un service étranger. Le RGPD n'impose aucune langue ; le contenu
 * est le même dans les deux.
 */
export function LetterLanguage({
  value,
  onChange,
  label = 'letter',
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  /** Ce dont on choisit la langue : une lettre, des lettres groupées, le récapitulatif de plainte. */
  label?: 'letter' | 'letters' | 'summary';
}) {
  const id = useId();
  const { t } = useI18n();
  const summary = label === 'summary';
  const options: { value: Lang; label: string; hint: string }[] = [
    {
      value: 'fr',
      label: 'Français',
      hint: summary ? t('formulaire CNIL', 'recommended') : t('entreprise française', 'recommended'),
    },
    {
      value: 'en',
      label: 'English',
      hint: summary ? t('pour le lire', 'to read it') : t('service étranger', 'to read it'),
    },
  ];
  const legend = {
    letter: t('Langue de la lettre', 'Language of the letter'),
    letters: t('Langue des lettres', 'Language of the letters'),
    summary: t('Langue du récapitulatif', 'Language of the summary'),
  }[label];
  return (
    <fieldset className="letter-lang">
      <legend className="legend">{legend}</legend>
      <div className="segmented segmented--compact">
        {options.map((o) => (
          <label key={o.value} lang={o.value}>
            <input
              type="radio"
              name={`${id}-lang`}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <strong>{o.label}</strong>
            <span lang={t('fr', 'en')}>{o.hint}</span>
          </label>
        ))}
      </div>
      <p className="hint">
        {summary
          ? t(
              'Le formulaire de plainte de la CNIL est en français. Les deux versions disent la même chose.',
              'The CNIL complaint form is in French: a summary in French is the safest choice. Both versions say the same thing.',
            )
          : t(
              "Le RGPD n'impose aucune langue. Pour une entreprise française, une lettre en français est le choix le plus sûr. Les deux versions disent la même chose.",
              'The GDPR does not require any particular language. For a French company, a letter in French is the safest choice. Both versions say the same thing: switch to English to read what the French letter says.',
            )}
      </p>
    </fieldset>
  );
}
