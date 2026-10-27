import { ExternalLink } from '../components/ExternalLink';
import { PageHead } from '../components/PageHead';
import { AUTHOR, SITE_URL, SOURCE_CODE_URL } from '../config';
import { HIBP_LICENSE_URL, HIBP_URL } from '../lib/breaches';
import { useI18n } from '../i18n';

/**
 * Mentions légales (loi n° 2004-575 du 21 juin 2004, LCEN, article 1-1, issu de la
 * loi SREN n° 2024-449 du 21 mai 2024 ; ancien article 6, III).
 * Hébergeur : adresse publiée par Vercel dans sa politique de confidentialité
 * (vercel.com/legal/privacy-notice), vérifiée le 5 octobre 2026.
 */
export function LegalNotice() {
  const { lang, link } = useI18n();
  if (lang === 'en') return <LegalNoticeEn />;
  return (
    <>
      <PageHead
        eyebrow="Mentions légales"
        command={{ input: 'shredrgpd --mentions-legales', output: 'éditeur · hébergeur · données' }}
        title="Qui édite et héberge ShredRGPD"
      >
        Informations prévues par l'article 1-1 de la loi pour la confiance dans l'économie numérique (LCEN).
      </PageHead>

      <div className="container page-body">
        <div className="prose">
          <h2 id="editeur">Éditeur</h2>
          <p>
            ShredRGPD est édité par <strong>{AUTHOR.name}</strong>, personne physique agissant à titre non
            professionnel. Comme le permet l'article 1-1, II de la LCEN, l'éditeur ne publie pas son identité ; ses
            éléments d'identification sont connus de l'hébergeur.
          </p>
          <p>
            Contact : <ExternalLink href={AUTHOR.url}>{AUTHOR.url.replace(/^https:\/\//, '')}</ExternalLink>
          </p>
          <p>Adresse du site : {SITE_URL.replace(/^https:\/\//, '')}</p>

          <h2 id="hebergeur">Hébergeur</h2>
          <p>
            Vercel Inc.
            <br />
            440 N Barranca Ave #4133
            <br />
            Covina, CA 91723, États-Unis
            <br />
            <ExternalLink href="https://vercel.com">vercel.com</ExternalLink>
          </p>

          <h2 id="donnees-personnelles">Données personnelles</h2>
          <p>
            L'application ShredRGPD ne collecte pas les données que tu saisis : pas de compte, pas de cookie, pas de
            mesure d'audience. Les lettres sont générées dans ton navigateur.
          </p>
          <p>Le stockage local de ton navigateur garde seulement ce que tu demandes, et rien n'en sort :</p>
          <ul>
            <li>
              tes demandes, quand tu les ajoutes au suivi ; tu peux les effacer depuis la page{' '}
              <a href={link('/suivi')}>Suivi</a> ;
            </li>
            <li>les étapes que tu coches dans un plan d'action (page Vérifier ou page d'une fuite) ;</li>
            <li>
              la date de ta dernière visite, seulement si tu as demandé à voir les nouvelles fuites ; le bouton « Ne
              plus me les signaler » l'efface.
            </li>
          </ul>
          <p>
            Ces informations servent uniquement aux fonctions que tu utilises : c'est pourquoi le site n'affiche pas de
            bandeau de consentement. Tu peux aussi tout effacer depuis les réglages de ton navigateur (données du site).
          </p>
          <p>
            Comme tout hébergeur, Vercel peut conserver des journaux techniques de connexion (adresse IP, page demandée,
            date) pour faire fonctionner et sécuriser le service. Les informations de pré-remplissage d'une lettre (site
            concerné, données exposées) restent dans la partie de l'adresse après le « # », que les navigateurs
            n'envoient jamais au serveur.
          </p>
          <p>
            Le test de mot de passe, si tu le lances, contacte le service Pwned Passwords : il reçoit ton adresse IP et
            les 5 premiers caractères de l'empreinte du mot de passe, jamais le mot de passe lui-même. Le détail figure
            sur la page <a href={link('/a-propos')}>À propos</a>.
          </p>

          <h2 id="licences">Contenus et licences</h2>
          <ul>
            <li>
              Liste des fuites : <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, sous licence{' '}
              <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>.
            </li>
            <li>Polices Inter et JetBrains Mono, sous licence SIL Open Font License 1.1.</li>
            <li>Textes, logo et code de ShredRGPD : {AUTHOR.name}, © 2026.</li>
            {SOURCE_CODE_URL && (
              <li>
                Code source publié sous licence MIT :{' '}
                <a href={SOURCE_CODE_URL} rel="noopener noreferrer">
                  dépôt GitHub
                </a>
                .
              </li>
            )}
          </ul>

          <h2 id="responsabilite">Responsabilité</h2>
          <p>
            Les modèles de lettres sont fournis à titre indicatif et ne constituent pas un conseil juridique. Relis
            chaque lettre et adapte-la à ta situation avant de l'envoyer. En cas de doute, rapproche-toi d'une
            association ou d'un professionnel du droit.
          </p>
        </div>
      </div>
    </>
  );
}

/** Traduction des mentions légales (même contenu, mêmes ancres). */
function LegalNoticeEn() {
  const { link } = useI18n();
  return (
    <>
      <PageHead
        eyebrow="Legal notice"
        command={{ input: 'shredrgpd --legal-notice', output: 'publisher · host · data' }}
        title="Who publishes and hosts ShredRGPD"
      >
        Information required by Article 1-1 of the French law on confidence in the digital economy (LCEN). This is a
        translation of the French legal notice.
      </PageHead>

      <div className="container page-body">
        <div className="prose">
          <h2 id="editeur">Publisher</h2>
          <p>
            ShredRGPD is published by <strong>{AUTHOR.name}</strong>, a private individual acting in a non-professional
            capacity. As allowed by Article 1-1, II of the LCEN, the publisher does not publish their identity; their
            identification details are known to the hosting provider.
          </p>
          <p>
            Contact: <ExternalLink href={AUTHOR.url}>{AUTHOR.url.replace(/^https:\/\//, '')}</ExternalLink>
          </p>
          <p>Website address: {SITE_URL.replace(/^https:\/\//, '')}</p>

          <h2 id="hebergeur">Hosting provider</h2>
          <p>
            Vercel Inc.
            <br />
            440 N Barranca Ave #4133
            <br />
            Covina, CA 91723, United States
            <br />
            <ExternalLink href="https://vercel.com">vercel.com</ExternalLink>
          </p>

          <h2 id="donnees-personnelles">Personal data</h2>
          <p>
            The ShredRGPD application does not collect the data you type: no account, no cookie, no audience
            measurement. Letters are generated in your browser.
          </p>
          <p>Your browser’s local storage only keeps what you ask for, and nothing leaves it:</p>
          <ul>
            <li>
              your requests, when you add them to the tracker; you can delete them from the{' '}
              <a href={link('/suivi')}>Tracker</a> page;
            </li>
            <li>the steps you tick in an action plan (Check page or a breach page);</li>
            <li>
              the date of your last visit, only if you asked to see new breaches; the “Stop showing them to me” button
              deletes it.
            </li>
          </ul>
          <p>
            This information is only used for the features you use: that is why the site shows no consent banner. You
            can also delete everything from your browser settings (site data).
          </p>
          <p>
            Like any hosting provider, Vercel may keep technical connection logs (IP address, page requested, date) to
            run and secure the service. The information used to pre-fill a letter (website concerned, exposed data)
            stays in the part of the address after the “#”, which browsers never send to the server.
          </p>
          <p>
            The password test, if you start it, contacts the Pwned Passwords service: it receives your IP address and
            the first 5 characters of the password’s hash, never the password itself. Details are on the{' '}
            <a href={link('/a-propos')}>About</a> page.
          </p>

          <h2 id="licences">Content and licences</h2>
          <ul>
            <li>
              List of breaches: <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, under the{' '}
              <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink> licence.
            </li>
            <li>Inter and JetBrains Mono fonts, under the SIL Open Font License 1.1.</li>
            <li>ShredRGPD texts, logo and code: {AUTHOR.name}, © 2026.</li>
            {SOURCE_CODE_URL && (
              <li>
                Source code published under the MIT licence:{' '}
                <a href={SOURCE_CODE_URL} rel="noopener noreferrer">
                  GitHub repository
                </a>
                .
              </li>
            )}
          </ul>

          <h2 id="responsabilite">Liability</h2>
          <p>
            The letter templates are provided for information only and do not constitute legal advice. Read each letter
            again and adapt it to your situation before sending it. If in doubt, contact a consumer association or a
            legal professional.
          </p>
        </div>
      </div>
    </>
  );
}
