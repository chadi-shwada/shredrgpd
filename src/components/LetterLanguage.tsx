import { useId } from 'react';
import { useI18n } from '../i18n';
import type { Lang } from '../lib/lang';

/**
 * Langue de la lettre, indépendante de celle de la page : le français par défaut
 * (entreprises françaises), l'anglais pour la lire ou écrire à un service étranger.
 * Le RGPD n'impose aucune langue ; le contenu est le même dans les deux.
 */
export function LetterLanguage({
  value,
  onChange,
  plural = false,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  plural?: boolean;
}) {
  const id = useId();
  const { t } = useI18n();
  const options: { value: Lang; label: string; hint: string }[] = [
    { value: 'fr', label: 'Français', hint: t('entreprise française', 'recommended') },
    { value: 'en', label: 'English', hint: t('service étranger', 'to read it') },
  ];
  return (
    <fieldset className="letter-lang">
      <legend className="legend">
        {plural
          ? t('Langue des lettres', 'Language of the letters')
          : t('Langue de la lettre', 'Language of the letter')}
      </legend>
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
        {t(
          "Le RGPD n'impose aucune langue. Pour une entreprise française, une lettre en français est le choix le plus sûr. Les deux versions disent la même chose.",
          'The GDPR does not require any particular language. For a French company, a letter in French is the safest choice. Both versions say the same thing: switch to English to read what the French letter says.',
        )}
      </p>
    </fieldset>
  );
}
