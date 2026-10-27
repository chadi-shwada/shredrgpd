import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { VideoPlayer } from '../components/VideoPlayer';
import { presentation } from '../data/videos';
import { FrenchTag, useI18n } from '../i18n';

const TIMELINE = [
  {
    title: 'Garde des preuves',
    text: "Fais des captures d'écran datées des pages qui t'exposent et note leurs adresses exactes. Elles serviront si tu dois saisir la CNIL.",
  },
  {
    title: 'Trouve le bon contact',
    text: "Cherche un e-mail de DPO ou un formulaire « données personnelles » dans les mentions légales ou la politique de confidentialité. Sans contact, écris à l'adresse de contact générale. Le générateur t'aide à trouver le registrar et l'hébergeur.",
  },
  {
    title: "Envoie ta demande d'effacement",
    text: "Le site doit répondre dans un délai d'un mois à compter de la réception (article 12.3 du RGPD). Il peut le prolonger de deux mois s'il te prévient dans le premier mois.",
  },
  {
    title: 'Relance après un mois',
    text: "Sans réponse, envoie une relance. S'il refuse, il doit te dire pourquoi (article 12.4).",
  },
  {
    title: "Signale le contenu à l'hébergeur",
    text: 'Site anonyme ou muet ? Écris à son hébergeur : il doit traiter les signalements de contenus illicites (article 16 du règlement européen sur les services numériques). Le registrar et Cloudflare peuvent aussi transmettre.',
  },
  {
    title: 'Saisis la CNIL',
    text: 'Sans réponse satisfaisante, tu peux introduire une réclamation auprès de la CNIL (article 77). Joins ta demande, ta relance et tes preuves.',
  },
];

const TIMELINE_EN = [
  {
    title: 'Keep evidence',
    text: 'Take dated screenshots of the pages that expose you and write down their exact addresses. You will need them if you have to complain to the CNIL.',
  },
  {
    title: 'Find the right contact',
    text: 'Look for a DPO email address or a “personal data” form in the legal notice or the privacy policy. With no contact, write to the general contact address. The generator helps you find the registrar and the hosting provider.',
  },
  {
    title: 'Send your erasure request',
    text: 'The company must reply within one month of receipt (Article 12(3) GDPR). It may extend this by two months if it tells you so within the first month.',
  },
  {
    title: 'Send a reminder after one month',
    text: 'Without a reply, send a reminder. If it refuses, it must tell you why (Article 12(4)).',
  },
  {
    title: 'Report the content to the hosting provider',
    text: 'Anonymous or silent website? Write to its hosting provider: it must handle notices of illegal content (Article 16 of the EU Digital Services Act). The registrar and Cloudflare can also forward them.',
  },
  {
    title: 'Complain to the CNIL',
    text: 'Without a satisfactory reply, you can lodge a complaint with the CNIL, the French data protection authority (Article 77). Attach your request, your reminder and your evidence.',
  },
];

/** Liens utiles ; `en` : version anglaise (titre, texte), `french` : site en français. */
const LINKS = [
  {
    href: 'https://www.cnil.fr/fr/comprendre-mes-droits/le-droit-leffacement-supprimer-vos-donnees-en-ligne',
    title: "Le droit à l'effacement",
    text: 'Explications de la CNIL',
    host: 'cnil.fr',
    en: ['The right to erasure', 'Explained by the CNIL'],
    french: true,
  },
  {
    href: 'https://www.cnil.fr/fr/modele/courrier/supprimer-des-donnees-personnelles',
    title: 'Modèle de courrier de la CNIL',
    text: 'Supprimer des données personnelles',
    host: 'cnil.fr',
    en: ['CNIL letter template', 'Deleting personal data'],
    french: true,
  },
  {
    href: 'https://www.cnil.fr/fr/adresser-une-plainte',
    title: 'Adresser une plainte à la CNIL',
    text: 'Après une demande restée sans réponse',
    host: 'cnil.fr',
    en: ['File a complaint with the CNIL', 'After a request left unanswered'],
    french: true,
  },
  {
    href: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr',
    hrefEn: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=en',
    title: 'Texte du RGPD',
    text: 'Règlement (UE) 2016/679, version officielle',
    host: 'eur-lex.europa.eu',
    en: ['Text of the GDPR', 'Regulation (EU) 2016/679, official version'],
    french: false,
  },
  {
    href: 'https://www.cybermalveillance.gouv.fr',
    title: 'Cybermalveillance.gouv.fr',
    text: "Assistance aux victimes d'actes de cybermalveillance",
    host: 'cybermalveillance.gouv.fr',
    en: ['Cybermalveillance.gouv.fr', 'French government help for victims of cybercrime'],
    french: true,
  },
  {
    href: 'https://www.internet-signalement.gouv.fr',
    title: 'Pharos',
    text: 'Signaler un contenu illicite en ligne',
    host: 'internet-signalement.gouv.fr',
    en: ['Pharos', 'Report illegal content online (French police)'],
    french: true,
  },
  {
    href: 'https://haveibeenpwned.com',
    title: 'Have I Been Pwned',
    text: 'Vérifier si ton e-mail figure dans une fuite connue (service tiers)',
    host: 'haveibeenpwned.com',
    en: ['Have I Been Pwned', 'Check whether your email is in a known breach (third-party service)'],
    french: false,
  },
];

export function Resources() {
  const { t, lang, link } = useI18n();
  const en = lang === 'en';
  return (
    <>
      <PageHead
        eyebrow={t('Ressources', 'Resources')}
        command={{
          input: t('shredrgpd droits --aide', 'shredrgpd rights --help'),
          output: t('RGPD · CNIL · DSA', 'GDPR · CNIL · DSA'),
        }}
        title={t('Tes droits, étape par étape', 'Your rights, step by step')}
      >
        {t(
          "Le RGPD te permet d'obtenir l'effacement de données publiées sans base légale. Voici comment t'y prendre, et vers qui te tourner.",
          'The GDPR lets you get data published without a legal basis erased. Here is how to go about it, and who to turn to.',
        )}
      </PageHead>

      <div className="container page-body">
        <div className="content-grid">
          <div className="prose">
            <h2>{t('La marche à suivre', 'The steps to follow')}</h2>
            <ol className="timeline">
              {(en ? TIMELINE_EN : TIMELINE).map((step, i) => (
                <li key={step.title}>
                  <span className="timeline__dot" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
            <p>
              <a className="btn btn--primary" href={link('/lettre')}>
                {t('Écrire ma lettre', 'Write my letter')}
              </a>
            </p>

            <h2>{t('En vidéo', 'Video')}</h2>
            <p>
              {t(
                'Le principe de ShredRGPD en 45 secondes, sur de vraies fuites (Free, Deezer), avec une personne fictive.',
                'How ShredRGPD works in 45 seconds, on real breaches (Free, Deezer), with a fictitious person. The text in the video is in French; English subtitles and a transcript are provided.',
              )}
            </p>
            <VideoPlayer video={presentation(lang)} />

            <h2>{t('Comment envoyer ta demande', 'How to send your request')}</h2>
            <p>
              {t(
                "Le RGPD n'impose pas de forme : un e-mail ou le formulaire du site suffisent. Ce qui compte, c'est de pouvoir prouver la date de réception, car le délai d'un mois part de là.",
                'The GDPR does not require any particular form: an email or the website’s form is enough. What matters is being able to prove the date of receipt, because the one-month period starts from there.',
              )}
            </p>
            {en ? (
              <ul>
                <li>
                  <strong>Email or form</strong>: keep a copy of your message, the sending date and any acknowledgement
                  (screenshot of the confirmation, ticket number).
                </li>
                <li>
                  <strong>Registered letter with acknowledgement of receipt</strong> (lettre recommandée avec accusé de
                  réception): the strongest proof, useful if the company does not answer emails or if you plan to
                  complain to the CNIL. La Poste also offers registered letters online.
                </li>
                <li>
                  Note the date of receipt in the <a href={link('/suivi')}>tracker</a>: ShredRGPD works out the deadline
                  and can add it to your calendar.
                </li>
              </ul>
            ) : (
              <ul>
                <li>
                  <strong>E-mail ou formulaire</strong> : garde une copie de ton message, la date d'envoi et tout accusé
                  de réception (capture d'écran de la confirmation, numéro de ticket).
                </li>
                <li>
                  <strong>Lettre recommandée avec accusé de réception</strong> : la preuve la plus solide, utile si le
                  site ne répond pas aux e-mails ou si tu prévois de saisir la CNIL. La Poste propose aussi un envoi
                  recommandé en ligne.
                </li>
                <li>
                  Note la date de réception dans le <a href={link('/suivi')}>suivi</a> : ShredRGPD calcule l'échéance et
                  peut l'ajouter à ton agenda.
                </li>
              </ul>
            )}

            {en ? (
              <>
                <h2>Protect yourself at the same time</h2>
                <ul>
                  <li>Change the exposed password everywhere you use it, and never reuse it again.</li>
                  <li>Turn on two-factor authentication on your important accounts, starting with your email.</li>
                  <li>
                    Be wary of emails, text messages and calls that quote your data: breaches are often used for
                    phishing.
                  </li>
                  <li>If bank details were exposed, tell your bank.</li>
                </ul>

                <h2>Frequently asked questions</h2>
                <h3>Do I need to attach an ID document?</h3>
                <p>
                  Not by default. The company may ask for additional information only if it has reasonable doubts about
                  your identity (Article 12(6) GDPR). If so, hide what is not needed.
                </p>
                <h3>What if the website is outside the European Union?</h3>
                <p>
                  The GDPR also applies to websites that target people in the Union (Article 3(2)), but enforcing it is
                  harder. Write anyway, keep your evidence and report the content to its hosting provider.
                </p>
                <h3>Does ShredRGPD check whether my data leaked?</h3>
                <p>
                  ShredRGPD helps you do it without seeing your data: you search for your email on Have I Been Pwned,
                  then tick the breaches found on the <a href={link('/verifier')}>Check</a> page. ShredRGPD shows the
                  exposed data and prepares the letter. It hosts no breach database.
                </p>

                <Notice>
                  <p>
                    This information is general and does not replace legal advice. If in doubt, contact a consumer
                    association or a legal professional.
                  </p>
                </Notice>
              </>
            ) : (
              <>
                <h2>Protège-toi en parallèle</h2>
                <ul>
                  <li>Change le mot de passe exposé partout où tu l'utilises, et n'en réutilise plus.</li>
                  <li>Active la double authentification sur tes comptes importants, en priorité ta messagerie.</li>
                  <li>
                    Méfie-toi des e-mails, SMS et appels qui citent tes données : la fuite sert souvent à l'hameçonnage.
                  </li>
                  <li>Si des coordonnées bancaires sont exposées, préviens ta banque.</li>
                </ul>

                <h2>Questions fréquentes</h2>
                <h3>Dois-je joindre une pièce d'identité ?</h3>
                <p>
                  Pas d'office. Le site ne peut te demander des informations supplémentaires qu'en cas de doute
                  raisonnable sur ton identité (article 12.6 du RGPD). Si c'est le cas, masque ce qui n'est pas utile.
                </p>
                <h3>Et si le site est hors de l'Union européenne ?</h3>
                <p>
                  Le RGPD s'applique aussi aux sites qui ciblent des personnes dans l'Union (article 3.2), mais le faire
                  respecter est plus difficile. Écris quand même, garde tes preuves et signale le contenu à son
                  hébergeur.
                </p>
                <h3>Est-ce que ShredRGPD vérifie si mes données ont fuité ?</h3>
                <p>
                  ShredRGPD t'y aide sans voir tes données : tu cherches ton e-mail sur Have I Been Pwned, puis tu
                  coches les fuites trouvées sur la page <a href={link('/verifier')}>Vérifier</a>. ShredRGPD affiche les
                  données exposées et prépare la lettre. Il n'héberge aucune base de fuites.
                </p>

                <Notice>
                  <p>
                    Ces informations sont générales et ne remplacent pas un conseil juridique. En cas de doute,
                    rapproche-toi d'une association ou d'un professionnel du droit.
                  </p>
                </Notice>
              </>
            )}
          </div>

          <aside aria-labelledby="liens">
            <div className="card">
              <h2 className="card__title" id="liens">
                {t('Liens utiles', 'Useful links')}
              </h2>
              <ul className="link-list">
                {LINKS.map((item) => (
                  <li key={item.href}>
                    <ExternalLink href={en && item.hrefEn ? item.hrefEn : item.href}>
                      <strong>
                        {en ? item.en[0] : item.title}
                        {en && item.french && <FrenchTag />}
                      </strong>
                      <span>{en ? item.en[1] : item.text}</span>
                      <span className="host">{item.host}</span>
                      <Icon name="external" size={16} />
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
