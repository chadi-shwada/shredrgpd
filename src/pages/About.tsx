import { ExternalLink } from '../components/ExternalLink';
import { PageHead } from '../components/PageHead';
import { AUTHOR, SOURCE_CODE_URL } from '../config';
import { KNOWN_SITES } from '../data/sites';
import { useLang } from '../i18n';

export function About() {
  if (useLang() === 'en') return <AboutEn />;
  return (
    <>
      <PageHead
        eyebrow="À propos"
        command={{ input: 'shredrgpd --a-propos', output: 'gratuit · sans compte · sans traceur' }}
        title="Un outil pour se défendre, pas pour surveiller"
      >
        ShredRGPD aide les personnes dont les données ont fuité à exercer leurs droits, sans rien leur demander en
        retour.
      </PageHead>

      <div className="container page-body">
        <div className="prose">
          <h2>Ce que fait ShredRGPD</h2>
          <ul>
            <li>Il rédige des lettres d'effacement, d'accès et de relance fondées sur le RGPD.</li>
            <li>Il calcule les délais légaux de réponse et t'aide à suivre tes demandes.</li>
            <li>Il te renvoie vers les bons interlocuteurs, à commencer par la CNIL.</li>
          </ul>

          <h2>Ce que ShredRGPD ne fera jamais</h2>
          <ul>
            <li>
              Envoyer ton e-mail, le contenu de tes lettres ou tes données de suivi à un serveur ou à un tiers. Le site
              est statique et n'a pas de serveur applicatif.
            </li>
            <li>Héberger une base de fuites, même partielle, même hachée.</li>
            <li>Inventer le contact d'un responsable de traitement ou d'un DPO.</li>
            <li>Se présenter comme un conseil juridique : les modèles sont indicatifs.</li>
          </ul>

          <h2>Vie privée</h2>
          <p>
            Pas de compte, pas de cookie, pas d'analytics, pas de police chargée depuis un CDN. La page déclare une
            politique de sécurité du contenu : ton navigateur bloque toute requête de la page vers un autre site, avec
            une seule exception, <code>api.pwnedpasswords.com</code>.
          </p>
          <p>
            Cette exception sert au test de mot de passe, et seulement quand tu le lances. ShredRGPD calcule l'empreinte
            SHA-1 du mot de passe dans ton navigateur et n'en envoie que les 5 premiers caractères. Le service renvoie
            des centaines d'empreintes qui commencent pareil et la comparaison se fait chez toi (k-anonymat).
          </p>
          <p>
            Pour ton adresse e-mail, ShredRGPD ne fait aucune requête : tu la cherches toi-même sur Have I Been Pwned.
            La liste des fuites connues est intégrée au site au moment de sa publication (source : Have I Been Pwned,
            licence CC BY 4.0). Elle contient des informations publiques sur les fuites, jamais les données fuitées.
          </p>
          <p>
            Le formulaire de lettre reste en mémoire dans l'onglet et disparaît quand tu le fermes. Le suivi enregistre
            seulement le site, le type de demande, les dates, le statut et tes notes, dans le stockage local de ton
            navigateur. Tu peux l'exporter ou l'effacer à tout moment.
          </p>
          <p>
            Le bouton « Ouvrir dans ma messagerie » passe la lettre à ton logiciel de messagerie : c'est lui qui
            l'envoie, pas ShredRGPD. Les liens vers des sites externes s'ouvrent sans transmettre d'adresse d'origine.
          </p>

          <h2>Sites connus</h2>
          <p>
            {KNOWN_SITES.length === 0
              ? "La liste des sites connus est vide pour l'instant. Un site n'y entre qu'avec une source publique et une date de vérification, et son contact n'est indiqué que s'il est sourcé."
              : `La liste compte ${KNOWN_SITES.length} site${KNOWN_SITES.length > 1 ? 's' : ''}, chacun avec une source publique et une date de vérification.`}
          </p>

          <h2>Contribuer</h2>
          {SOURCE_CODE_URL ? (
            <p>
              Le code est libre. Tu peux signaler une erreur dans une lettre, proposer une amélioration ou héberger ta
              propre copie :{' '}
              <ExternalLink href={SOURCE_CODE_URL}>{SOURCE_CODE_URL.replace(/^https:\/\//, '')}</ExternalLink>.
            </p>
          ) : (
            <p>
              Tu as repéré une erreur dans une lettre ou tu as une idée d'amélioration ? Écris à{' '}
              <ExternalLink href={AUTHOR.url}>{AUTHOR.name}</ExternalLink> sur X.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function AboutEn() {
  return (
    <>
      <PageHead
        eyebrow="About"
        command={{ input: 'shredrgpd --about', output: 'free · no account · no tracker' }}
        title="A tool to defend yourself, not to watch you"
      >
        ShredRGPD helps people whose data leaked to exercise their rights, without asking anything from them in return.
      </PageHead>

      <div className="container page-body">
        <div className="prose">
          <h2>What ShredRGPD does</h2>
          <ul>
            <li>It writes erasure, access and reminder letters based on the GDPR, in French or in English.</li>
            <li>It works out the legal reply deadlines and helps you track your requests.</li>
            <li>It points you to the right contacts, starting with the CNIL, the French data protection authority.</li>
          </ul>

          <h2>What ShredRGPD will never do</h2>
          <ul>
            <li>
              Send your email, the content of your letters or your tracking data to a server or a third party. The site
              is static and has no application server.
            </li>
            <li>Host a breach database, not even a partial or hashed one.</li>
            <li>Make up the contact details of a data controller or a DPO.</li>
            <li>Present itself as legal advice: the templates are indicative.</li>
          </ul>

          <h2>Privacy</h2>
          <p>
            No account, no cookie, no analytics, no font loaded from a CDN. The page declares a content security policy:
            your browser blocks any request from the page to another website, with a single exception,{' '}
            <code>api.pwnedpasswords.com</code>.
          </p>
          <p>
            This exception is used for the password test, and only when you start it. ShredRGPD computes the SHA-1 hash
            of the password in your browser and sends only its first 5 characters. The service returns hundreds of
            hashes that start the same way and the comparison happens on your device (k-anonymity).
          </p>
          <p>
            For your email address, ShredRGPD makes no request: you search for it yourself on Have I Been Pwned. The
            list of known breaches is built into the site when it is published (source: Have I Been Pwned, CC BY 4.0
            licence). It contains public information about the breaches, never the breached data.
          </p>
          <p>
            The letter form stays in memory in the tab and disappears when you close it. The tracker only stores the
            website, the type of request, the dates, the status and your notes, in your browser’s local storage. You can
            export or delete it at any time.
          </p>
          <p>
            The “Open in my email app” button hands the letter over to your email software: it sends it, not ShredRGPD.
            Links to external websites open without passing on the address you came from.
          </p>

          <h2>Known websites</h2>
          <p>
            {KNOWN_SITES.length === 0
              ? 'The list of known websites is empty for now. A website is only added with a public source and a verification date, and its contact is only given if it is sourced.'
              : `The list has ${KNOWN_SITES.length} website${KNOWN_SITES.length > 1 ? 's' : ''}, each with a public source and a verification date.`}
          </p>

          <h2>Contribute</h2>
          {SOURCE_CODE_URL ? (
            <p>
              The code is open source. You can report a mistake in a letter, suggest an improvement or host your own
              copy: <ExternalLink href={SOURCE_CODE_URL}>{SOURCE_CODE_URL.replace(/^https:\/\//, '')}</ExternalLink>.
            </p>
          ) : (
            <p>
              Spotted a mistake in a letter or have an idea for an improvement? Write to{' '}
              <ExternalLink href={AUTHOR.url}>{AUTHOR.name}</ExternalLink> on X.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
