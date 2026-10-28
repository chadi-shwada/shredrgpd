import { ASSISTANT_URL } from '../config';
import { useI18n } from '../i18n';
import { ExternalLink } from './ExternalLink';
import { Icon } from './Icon';

/** Mascotte de l'assistant (nuage bleu à deux yeux), comme sur sa page Grok Bot. Décorative. */
function AssistantMascot() {
  return (
    <svg className="assistant-card__mascot" viewBox="0 0 120 96" aria-hidden="true" focusable="false">
      <path
        fill="#3474e0"
        d="M30 86a22 22 0 0 1-4-43.6A28 28 0 0 1 58 14a26 26 0 0 1 32 22 24 24 0 0 1 4 47.4A20 20 0 0 1 60 88a22 22 0 0 1-30-2z"
      />
      <rect x="40" y="38" width="9" height="22" rx="4.5" fill="#0b0d14" />
      <rect x="66" y="38" width="9" height="22" rx="4.5" fill="#0b0d14" />
    </svg>
  );
}

/** Encart vers l'assistant ShredRGPD sur Grok Bot : un lien sortant, aucun script ni requête. */
export function AssistantPromo() {
  const { t } = useI18n();
  return (
    <section className="section section--tight" aria-labelledby="assistant">
      <div className="container">
        <article className="assistant-card">
          <div className="assistant-card__inner">
            <div className="assistant-card__banner">
              <span className="assistant-card__badge">{t('Assistant IA', 'AI assistant')}</span>
              <AssistantMascot />
            </div>
            <div className="assistant-card__body">
              <h2 id="assistant">ShredRGPD</h2>
              <p className="assistant-card__by">{t('Assistant sur Grok Bot', 'Assistant on Grok Bot')}</p>
              <p className="assistant-card__text">
                {t(
                  "Envie d'aller plus loin ? L'assistant ShredRGPD retrouve tes vieux comptes dans tes mails, prépare tes demandes de suppression RGPD et suit les réponses. Tu valides chaque envoi.",
                  'Want to go further? The ShredRGPD assistant finds your old accounts in your inbox, drafts your GDPR erasure requests and tracks the replies. You approve every email.',
                )}
              </p>
              <hr />
              <p className="assistant-card__note">
                {t(
                  "Nécessite Grok Bot, un service de xAI distinct de ce site : ses propres conditions et sa politique de confidentialité s'appliquent.",
                  'Requires Grok Bot, an xAI service separate from this site: its own terms and privacy policy apply.',
                )}
              </p>
              <ExternalLink href={ASSISTANT_URL} className="assistant-card__cta">
                {t("Essayer l'assistant (Grok Bot)", 'Try the assistant (Grok Bot)')}
                <Icon name="external" size={18} />
              </ExternalLink>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
