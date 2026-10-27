import { ExternalLink } from '../components/ExternalLink';
import { Icon, type IconName } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { FrenchTag, useI18n } from '../i18n';
import { localizePath } from '../lib/paths';

/*
 * Canaux officiels et démarches, vérifiés le 5 octobre 2026 :
 * - 33700 : plateforme des opérateurs pour les SMS et appels indésirables (33700.fr) ;
 * - Signal Spam (signal-spam.fr) : e-mails indésirables et hameçonnage ;
 * - Phishing Initiative (phishing-initiative.fr) : adresses de sites d'hameçonnage ;
 * - Pharos (internet-signalement.gouv.fr) : contenus et escroqueries en ligne ;
 * - démarchage téléphonique sans consentement préalable interdit depuis le
 *   11 août 2026 (loi du 30 juin 2025), fin de Bloctel ; signalement : SignalConso ;
 * - opposition interbancaire : 0 892 705 705, 7 j/7, 24 h/24, 0,34 €/min ;
 * - France Victimes : 116 006, 7 j/7 de 9 h à 19 h.
 */

interface Channel {
  icon: IconName;
  title: string;
  text: string;
  action: { label: string; href: string };
  /** Version anglaise (titre, texte). */
  en: [string, string];
}

const MESSAGES: Channel[] = [
  {
    icon: 'mail',
    title: 'Un SMS suspect',
    text: 'Transfère-le gratuitement au 33700, puis réponds au SMS automatique avec le numéro de l’expéditeur. Supprime-le ensuite sans cliquer sur le lien.',
    action: { label: '33700.fr', href: 'https://www.33700.fr/' },
    en: [
      'A suspicious text message',
      'Forward it for free to 33700, then reply to the automatic text with the sender’s number. Then delete it without clicking the link.',
    ],
  },
  {
    icon: 'bell',
    title: 'Un appel ou un message vocal suspect',
    text: 'Envoie « spam vocal » suivi du numéro qui t’a appelé, par SMS au 33700. Ne rappelle jamais un numéro inconnu qui cite tes informations.',
    action: { label: '33700.fr', href: 'https://www.33700.fr/' },
    en: [
      'A suspicious call or voicemail',
      'Text “spam vocal” followed by the number that called you to 33700. Never call back an unknown number that quotes your details.',
    ],
  },
  {
    icon: 'send',
    title: 'Un e-mail d’hameçonnage',
    text: "Ne clique sur rien, ne réponds pas. Signale-le sur Signal Spam : l'e-mail est transmis aux autorités et aux messageries.",
    action: { label: 'signal-spam.fr', href: 'https://www.signal-spam.fr/' },
    en: [
      'A phishing email',
      'Do not click anything, do not reply. Report it on Signal Spam: the email is passed on to the authorities and to email providers.',
    ],
  },
  {
    icon: 'external',
    title: 'Un lien vers un faux site',
    text: "Copie l'adresse du site (sans l'ouvrir) et signale-la sur Phishing Initiative pour qu'il soit bloqué. Pour une escroquerie, signale-la aussi sur Pharos.",
    action: { label: 'phishing-initiative.fr', href: 'https://phishing-initiative.fr/' },
    en: [
      'A link to a fake website',
      'Copy the website address (without opening it) and report it on Phishing Initiative so that it gets blocked. For a scam, also report it on Pharos.',
    ],
  },
  {
    icon: 'alert',
    title: 'Un démarchage téléphonique',
    text: "Depuis le 11 août 2026, un professionnel ne peut plus te démarcher par téléphone sans ton accord préalable (Bloctel n'existe plus). Signale l'entreprise à la répression des fraudes sur SignalConso.",
    action: { label: 'signal.conso.gouv.fr', href: 'https://signal.conso.gouv.fr/' },
    en: [
      'A cold call',
      'Since 11 August 2026, a business can no longer cold-call you without your prior consent (Bloctel no longer exists). Report the company to the consumer protection authority on SignalConso.',
    ],
  },
  {
    icon: 'shield',
    title: 'Une arnaque ou un contenu illicite en ligne',
    text: 'Signale-le aux policiers et gendarmes de la plateforme Pharos. Si tu as perdu de l’argent, dépose plainte.',
    action: { label: 'internet-signalement.gouv.fr', href: 'https://www.internet-signalement.gouv.fr/' },
    en: [
      'An online scam or illegal content',
      'Report it to the police and gendarmerie on the Pharos platform. If you lost money, file a complaint.',
    ],
  },
];

interface Guide {
  id: string;
  title: string;
  steps: string[];
  links: { label: string; href: string }[];
  /** Version anglaise : titre, étapes, libellés des liens (même ordre). */
  en: { title: string; steps: string[]; links: string[] };
}

const GUIDES: Guide[] = [
  {
    id: 'mot-de-passe',
    title: 'Mon mot de passe a fuité',
    steps: [
      "Change-le sur le site concerné, puis partout où tu l'as réutilisé.",
      'Active la double authentification, en commençant par ta messagerie : elle permet de réinitialiser tous tes autres comptes.',
      'Vérifie les appareils et sessions connectés à tes comptes importants et déconnecte ceux que tu ne reconnais pas.',
      'Utilise un mot de passe différent par site, gardé dans un gestionnaire de mots de passe.',
    ],
    links: [{ label: 'Tester un mot de passe et en créer un', href: '/verifier#parcours=mot-de-passe' }],
    en: {
      title: 'My password leaked',
      steps: [
        'Change it on the website concerned, then everywhere you reused it.',
        'Turn on two-factor authentication, starting with your email account: it can be used to reset all your other accounts.',
        'Check the devices and sessions connected to your important accounts and sign out the ones you do not recognise.',
        'Use a different password for each website, kept in a password manager.',
      ],
      links: ['Test a password and create one'],
    },
  },
  {
    id: 'carte',
    title: 'Ma carte ou mes coordonnées bancaires ont fuité',
    steps: [
      'Préviens ta banque et surveille tes relevés dans les jours et les semaines qui suivent.',
      "En cas d'opération que tu n'as pas faite, fais opposition tout de suite : auprès de ta banque, ou au 0 892 705 705 (service interbancaire, 7 j/7, 24 h/24, 0,34 €/min). Note le numéro d'enregistrement de l'opposition.",
      'Ta banque ne te demandera jamais un code reçu par SMS ni tes identifiants par téléphone ou par e-mail.',
      'Conteste les opérations frauduleuses auprès de ta banque et dépose plainte si nécessaire.',
    ],
    links: [
      {
        label: 'Fraude à la carte bancaire (cybermalveillance.gouv.fr)',
        href: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/fraude-carte-bancaire',
      },
    ],
    en: {
      title: 'My card or bank details leaked',
      steps: [
        'Tell your bank and watch your statements in the following days and weeks.',
        'If you see a payment you did not make, block your card straight away: with your bank, or on 0 892 705 705 (interbank line, 24/7, €0.34/min). Write down the blocking reference number.',
        'Your bank will never ask you for a code received by text message, or for your login details by phone or email.',
        'Dispute fraudulent payments with your bank and file a complaint if necessary.',
      ],
      links: ['Bank card fraud (cybermalveillance.gouv.fr)'],
    },
  },
  {
    id: 'identite',
    title: "Ma pièce d'identité ou mon numéro de sécurité sociale ont fuité",
    steps: [
      "Garde des preuves : captures d'écran datées, adresses des pages, messages reçus.",
      "Surveille ton courrier et tes comptes (banque, ameli, impôts) : un crédit ou un abonnement que tu n'as pas demandé est un signe d'usurpation.",
      "Ton numéro de sécurité sociale ne se change pas : méfie-toi longtemps des faux messages de l'Assurance maladie ou d'une mutuelle.",
      "En cas d'usurpation, dépose plainte et préviens les organismes concernés. France Victimes t'accompagne gratuitement au 116 006, 7 j/7 de 9 h à 19 h.",
    ],
    links: [
      {
        label: "Usurpation d'identité, que faire ? (cybermalveillance.gouv.fr)",
        href: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/usurpation-identite-que-faire',
      },
    ],
    en: {
      title: 'My ID document or social security number leaked',
      steps: [
        'Keep evidence: dated screenshots, page addresses, messages received.',
        'Watch your post and your accounts (bank, ameli, tax): a loan or subscription you did not ask for is a sign of identity theft.',
        'Your social security number cannot be changed: stay wary of fake messages from the Assurance maladie (health insurance) or a mutuelle for a long time.',
        'If your identity is misused, file a complaint and tell the organisations concerned. France Victimes supports you for free on 116 006, every day from 9 am to 7 pm.',
      ],
      links: ['Identity theft, what to do? (cybermalveillance.gouv.fr)'],
    },
  },
  {
    id: 'email',
    title: 'Mon adresse e-mail a fuité',
    steps: [
      "Attends-toi à de l'hameçonnage crédible, qui reprend ton nom ou les services que tu utilises.",
      'Sécurise ta messagerie en premier : mot de passe unique et double authentification.',
      'Vérifie les règles de transfert automatique de ta messagerie : un pirate peut en ajouter une pour lire ton courrier.',
    ],
    links: [
      {
        label: "Que faire en cas d'hameçonnage (cybermalveillance.gouv.fr)",
        href: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/hameconnage-phishing',
      },
    ],
    en: {
      title: 'My email address leaked',
      steps: [
        'Expect convincing phishing that uses your name or the services you use.',
        'Secure your email account first: a unique password and two-factor authentication.',
        'Check the automatic forwarding rules of your email account: an attacker can add one to read your mail.',
      ],
      links: ['What to do about phishing (cybermalveillance.gouv.fr)'],
    },
  },
  {
    id: 'telephone',
    title: 'Mon numéro de téléphone a fuité',
    steps: [
      'Signale les SMS et appels suspects au 33700.',
      'Méfie-toi des faux conseillers bancaires : raccroche et rappelle ta banque au numéro habituel.',
      'Si ton téléphone perd soudain le réseau, contacte ton opérateur : ce peut être un détournement de ta ligne (changement frauduleux de carte SIM).',
    ],
    links: [{ label: '33700.fr', href: 'https://www.33700.fr/' }],
    en: {
      title: 'My phone number leaked',
      steps: [
        'Report suspicious texts and calls to 33700.',
        'Beware of fake bank advisers: hang up and call your bank back on its usual number.',
        'If your phone suddenly loses network, contact your operator: your line may have been hijacked (fraudulent SIM swap).',
      ],
      links: ['33700.fr'],
    },
  },
];

export function WhatToDo() {
  const { t, lang, link } = useI18n();
  const en = lang === 'en';
  return (
    <>
      <PageHead
        eyebrow={t('Que faire ?', 'What to do?')}
        command={{
          input: t('shredrgpd aide --urgence', 'shredrgpd help --urgent'),
          output: t('canaux officiels · démarches', 'official channels · steps'),
        }}
        title={t('Les bons réflexes après une fuite', 'What to do after a data breach')}
      >
        {t(
          "Un message suspect, une carte exposée, un mot de passe dans la nature : voici à qui t'adresser, avec les canaux officiels.",
          'A suspicious message, an exposed card, a password out in the wild: here is who to contact, through the official channels in France.',
        )}
      </PageHead>

      <div className="container page-body">
        {en && (
          <div className="guides__notice guides__notice--top">
            <Notice>
              <p>
                These are the official French services. Their websites are mainly in French, and the steps assume you
                live in France.
              </p>
            </Notice>
          </div>
        )}
        <section aria-labelledby="message-suspect">
          <div className="section__head">
            <span className="eyebrow">{t('Message suspect', 'Suspicious message')}</span>
            <h2 id="message-suspect">{t("J'ai reçu un message suspect", 'I received a suspicious message')}</h2>
            <p className="lead">
              {t(
                'Les fuites servent souvent à rendre les arnaques plus crédibles. Ne clique pas, ne réponds pas, signale.',
                'Breaches are often used to make scams more convincing. Do not click, do not reply, report it.',
              )}
            </p>
          </div>
          <ul className="channels">
            {MESSAGES.map((c) => (
              <li className="channel" key={c.title}>
                <span className="step__icon">
                  <Icon name={c.icon} />
                </span>
                <h3>{en ? c.en[0] : c.title}</h3>
                <p>{en ? c.en[1] : c.text}</p>
                <ExternalLink href={c.action.href} className="channel__link">
                  {c.action.label}
                  {en && <FrenchTag />}
                  <Icon name="external" size={14} />
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="selon-donnee" className="guides">
          <div className="section__head">
            <span className="eyebrow">{t('Selon ce qui a fuité', 'Depending on what leaked')}</span>
            <h2 id="selon-donnee">{t('Les démarches, donnée par donnée', 'The steps, data type by data type')}</h2>
          </div>
          <div className="faq">
            {GUIDES.map((g) => (
              <details key={g.id} id={g.id}>
                <summary>
                  {en ? g.en.title : g.title}
                  <Icon name="plus" size={18} />
                </summary>
                <ol className="guide__steps">
                  {(en ? g.en.steps : g.steps).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <ul className="guide__links">
                  {g.links.map((l, i) => {
                    const label = en ? (g.en.links[i] ?? l.label) : l.label;
                    return (
                      <li key={l.href}>
                        {l.href.startsWith('/') ? (
                          <a href={localizePath(l.href, lang)}>{label}</a>
                        ) : (
                          <ExternalLink href={l.href}>
                            {label}
                            {en && <FrenchTag />}
                          </ExternalLink>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        </section>

        <div className="guides__notice">
          <Notice>
            <p>
              {t('Ensuite, exerce tes droits : ', 'Then exercise your rights: ')}
              <a href={link('/verifier')}>{t('vérifie ce qui a fuité', 'check what leaked')}</a>
              {t(' et ', ' and ')}
              <a href={link('/lettre')}>{t('écris aux entreprises concernées', 'write to the companies concerned')}</a>
              {t(
                ". En cas d'urgence ou de danger, compose le 17.",
                '. In an emergency or if you are in danger, call 17 (police) or 112.',
              )}
            </p>
          </Notice>
        </div>
      </div>
    </>
  );
}
