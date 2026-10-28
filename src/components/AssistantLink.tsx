import { useState } from 'react';
import { ASSISTANT_URL } from '../config';
import { useI18n } from '../i18n';

/** Mascotte de l'assistant (nuage bleu à deux yeux), comme sur sa page Grok Bot. Décorative. */
function AssistantMascot({ className = 'assistant-link__mascot' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 96" aria-hidden="true" focusable="false">
      <path
        fill="#3474e0"
        d="M30 86a22 22 0 0 1-4-43.6A28 28 0 0 1 58 14a26 26 0 0 1 32 22 24 24 0 0 1 4 47.4A20 20 0 0 1 60 88a22 22 0 0 1-30-2z"
      />
      <rect x="40" y="38" width="9" height="22" rx="4.5" fill="#0b0d14" />
      <rect x="66" y="38" width="9" height="22" rx="4.5" fill="#0b0d14" />
    </svg>
  );
}

function useAssistantText() {
  const { t } = useI18n();
  return {
    title: t('Assistant IA ShredRGPD', 'ShredRGPD AI assistant'),
    text: t(
      'Retrouve tes vieux comptes dans tes mails, prépare tes demandes de suppression RGPD et suit les réponses. Tu valides chaque envoi.',
      'Finds your old accounts in your inbox, drafts your GDPR erasure requests and tracks the replies. You approve every email.',
    ),
    requires: t('Nécessite Grok Bot · nouvel onglet', 'Requires Grok Bot · new tab'),
    short: t('Assistant IA', 'AI assistant'),
  };
}

/**
 * Lien de l'en-tête vers l'assistant ShredRGPD sur Grok Bot (service de xAI, hors du
 * site) : nuage, libellé « Assistant IA » quand la place le permet, et bulle explicative
 * au survol et au focus (fermée par Échap, WCAG 1.4.13). Aucun script tiers ni requête.
 */
export function AssistantLink() {
  const text = useAssistantText();
  const [dismissed, setDismissed] = useState(false);
  return (
    <div
      className="assistant"
      data-dismissed={dismissed}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setDismissed(true);
      }}
    >
      <a
        className="assistant-link"
        href={ASSISTANT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby="assistant-tip"
      >
        <AssistantMascot />
        <span className="assistant-link__label" aria-hidden="true">
          {text.short}
        </span>
        <span className="visually-hidden">{text.title}</span>
      </a>
      <div className="assistant-tip" id="assistant-tip" role="tooltip">
        <strong>{text.title}</strong> <span>{text.text}</span> <small>{text.requires}</small>
      </div>
    </div>
  );
}

/** Entrée du menu replié (mobile) : pas de survol sur écran tactile, donc le texte est affiché. */
export function AssistantMenuItem() {
  const text = useAssistantText();
  return (
    <a className="assistant-menu" href={ASSISTANT_URL} target="_blank" rel="noopener noreferrer">
      <AssistantMascot className="assistant-menu__mascot" />
      <span>
        <strong>{text.title}</strong> <span>{text.text}</span> <small>{text.requires}</small>
      </span>
    </a>
  );
}
