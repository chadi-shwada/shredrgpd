import { ASSISTANT_URL } from '../config';
import { useI18n } from '../i18n';

/** Mascotte de l'assistant (nuage bleu à deux yeux), comme sur sa page Grok Bot. Décorative. */
function AssistantMascot() {
  return (
    <svg className="assistant-link__mascot" viewBox="0 0 120 96" aria-hidden="true" focusable="false">
      <path
        fill="#3474e0"
        d="M30 86a22 22 0 0 1-4-43.6A28 28 0 0 1 58 14a26 26 0 0 1 32 22 24 24 0 0 1 4 47.4A20 20 0 0 1 60 88a22 22 0 0 1-30-2z"
      />
      <rect x="40" y="38" width="9" height="22" rx="4.5" fill="#0b0d14" />
      <rect x="66" y="38" width="9" height="22" rx="4.5" fill="#0b0d14" />
    </svg>
  );
}

/**
 * Petite icône de l'en-tête vers l'assistant ShredRGPD sur Grok Bot (service de xAI,
 * hors du site) : un lien sortant, aucun script ni requête.
 */
export function AssistantLink() {
  const { t } = useI18n();
  const label = t(
    'Assistant ShredRGPD sur Grok Bot (nécessite Grok Bot)',
    'ShredRGPD assistant on Grok Bot (requires Grok Bot)',
  );
  return (
    <a className="assistant-link" href={ASSISTANT_URL} target="_blank" rel="noopener noreferrer" title={label}>
      <AssistantMascot />
      <span className="visually-hidden">
        {label}
        {t(' (nouvel onglet)', ' (new tab)')}
      </span>
    </a>
  );
}
