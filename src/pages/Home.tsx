import { AssistantPromo } from '../components/AssistantPromo';
import { BinaryField } from '../components/BinaryField';
import { SOURCE_CODE_URL } from '../config';
import { DataStream } from '../components/DataStream';
import { Icon, type IconName } from '../components/Icon';
import { ScrambleText } from '../components/ScrambleText';
import { ShredSheet } from '../components/ShredSheet';
import { VerifyMock } from '../components/VerifyMock';
import { ShowcaseVideo } from '../components/ShowcaseVideo';
import { presentation } from '../data/videos';
import summary from 'virtual:catalog-summary';
import { useI18n } from '../i18n';
import { formatMonth } from '../lib/breachPages';
import { dataClassLabel, formatCount, logoNotice, translateDataList } from '../lib/breaches';
import { riskLabel, riskRule } from '../lib/risk';
import { BreachMark } from '../components/BreachMark';
import { formatLong, gdprDeadlines } from '../lib/dates';
import type { Lang } from '../lib/lang';
import { generateLetter, subjectLabel, type LetterInput } from '../lib/letters';
import { href, type RoutePath } from '../router';

/** Points d'entrée selon la situation (page Vérifier, paramètre « parcours »). */
const STARTS: {
  icon: IconName;
  to: RoutePath;
  query?: Record<string, string>;
  fr: { title: string; text: string; action: string };
  en: { title: string; text: string; action: string };
}[] = [
  {
    icon: 'search',
    to: '/verifier',
    fr: {
      title: 'Je veux savoir si je suis concerné',
      text: 'Cherche ton e-mail sur Have I Been Pwned, colle les résultats : ShredRGPD coche les fuites pour toi.',
      action: 'Vérifier mes fuites',
    },
    en: {
      title: 'I want to know if I am affected',
      text: 'Search for your email on Have I Been Pwned, paste the results: ShredRGPD ticks the breaches for you.',
      action: 'Check my breaches',
    },
  },
  {
    icon: 'mail',
    to: '/verifier',
    query: { parcours: 'message' },
    fr: {
      title: "Une entreprise m'a prévenu",
      text: 'Retrouve la fuite, vois ce qui est exposé et demande à l’entreprise ce qu’elle détient sur toi.',
      action: 'Partir du message',
    },
    en: {
      title: 'A company warned me',
      text: 'Find the breach, see what was exposed and ask the company what data it holds about you.',
      action: 'Start from the message',
    },
  },
  {
    icon: 'database',
    to: '/verifier',
    query: { parcours: 'publie' },
    fr: {
      title: 'Mes données sont publiées',
      text: 'Demande l’effacement au site qui les publie, puis signale la page à son hébergeur.',
      action: 'Faire retirer',
    },
    en: {
      title: 'My data are published',
      text: 'Ask the website that publishes them to erase them, then report the page to its hosting provider.',
      action: 'Get them removed',
    },
  },
  {
    icon: 'alert',
    to: '/que-faire',
    fr: {
      title: "J'ai reçu un message suspect",
      text: 'SMS, appel ou e-mail qui cite tes informations : ne clique pas, signale-le au bon endroit.',
      action: 'Les bons réflexes',
    },
    en: {
      title: 'I received a suspicious message',
      text: 'A text, call or email that quotes your details: do not click, report it to the right place.',
      action: 'What to do',
    },
  },
];

const FAQ_EN = [
  {
    q: 'Can ShredRGPD see my data?',
    a: 'No. Everything happens in your browser: there is no application server, no account, no cookie. The page blocks any request to another website, except to Pwned Passwords when you run a password test: only 5 characters of its hash are sent, never the password. To know how many people use the site, Vercel, the hosting provider, counts page views without a cookie: nothing you type is sent.',
  },
  {
    q: 'Does ShredRGPD check whether my data leaked?',
    a: 'It helps you do it without seeing your data. You search for your email on Have I Been Pwned, then tick the breaches found in ShredRGPD, which shows the exposed data and prepares the letter. ShredRGPD hosts no database of breached data: only the public list of known breaches.',
  },
  {
    q: 'Is one letter enough to get my data deleted?',
    a: 'Often, but not always. The company must reply within one month (Article 12(3) GDPR). Without a reply, you can send a reminder and then complain to the CNIL, the French data protection authority. The templates are indicative and do not replace legal advice.',
  },
  {
    q: 'Do I need to attach an ID document?',
    a: 'Not by default. The company may ask for additional information only if it has reasonable doubts about your identity (Article 12(6) GDPR).',
  },
];

const FAQ = [
  {
    q: 'Est-ce que ShredRGPD voit mes données ?',
    a: "Non. Tout se passe dans ton navigateur : il n'y a pas de serveur applicatif, pas de compte, pas de cookie. La page bloque toute requête vers un autre site, sauf vers Pwned Passwords quand tu lances un test de mot de passe : seuls 5 caractères de son empreinte partent, jamais le mot de passe. Pour savoir combien de personnes utilisent le site, Vercel, l'hébergeur, compte les pages vues sans cookie : rien de ce que tu saisis ne part.",
  },
  {
    q: 'Est-ce que ShredRGPD vérifie si mes données ont fuité ?',
    a: "Il t'y aide sans voir tes données. Tu cherches ton e-mail sur Have I Been Pwned, puis tu coches les fuites trouvées dans ShredRGPD, qui affiche les données exposées et prépare la lettre. ShredRGPD n'héberge aucune base de fuites : seulement la liste publique des fuites connues.",
  },
  {
    q: 'Une lettre suffit-elle à faire supprimer mes données ?',
    a: "Souvent, mais pas toujours. Le site doit répondre dans un délai d'un mois (article 12.3 du RGPD). Sans réponse, tu peux relancer puis saisir la CNIL. Les modèles sont indicatifs et ne remplacent pas un conseil juridique.",
  },
  {
    q: "Dois-je joindre une pièce d'identité ?",
    a: "Pas d'office. Le site ne peut te demander des informations supplémentaires qu'en cas de doute raisonnable sur ton identité (article 12.6 du RGPD).",
  },
];

const SAMPLE_DATE = '2026-10-05';
/** Exemple réel : la fuite Free d'octobre 2024 (catalogue HIBP), personne fictive. */
const SAMPLE_INPUT: LetterInput = {
  kind: 'effacement',
  context: 'violation',
  fullName: 'Camille Martin',
  siteName: 'Free',
  breachDate: '2024-10-17',
  urls: [],
  dataCategories: ['bancaire', 'dateNaissance', 'nomPrenom', 'telephone', 'adresse'],
  otherData: 'genre',
  date: SAMPLE_DATE,
};

/** Lettre d'exemple dans la langue de la page. */
function sample(lang: Lang) {
  const letter = generateLetter({ ...SAMPLE_INPUT, otherData: translateDataList('genre', lang) }, lang);
  return { letter, excerpt: letter.body.split('\n\n').slice(0, 4).join('\n\n') };
}

export function Home() {
  const { t, lang, link, localize } = useI18n();
  const { letter: SAMPLE, excerpt: SAMPLE_EXCERPT } = sample(lang);
  const faq = lang === 'en' ? FAQ_EN : FAQ;
  return (
    <div className="theme-dark">
      <section className="hero" aria-labelledby="titre">
        <BinaryField />
        <div className="hero__veil" />
        <div className="container hero__grid">
          <div>
            <span className="pill">
              <span className="pill__tag">{t('Sans cookie', 'No cookie')}</span>
              <span className="pill__text">
                {t('Gratuit, sans compte', 'Free, no account')}
                <span className="pill__more">{t(', sans publicité', ', no ads')}</span>
              </span>
            </span>
            <h1 id="titre">
              {t(
                <>
                  Demande l'effacement de <ScrambleText className="accent" text="tes données" />
                </>,
                <>
                  Request the erasure of <ScrambleText className="accent" text="your data" />
                </>,
              )}
            </h1>
            <p className="lead">
              {t(
                "Un site expose tes informations issues d'une fuite ? ShredRGPD rédige ta demande RGPD, calcule les délais et t'aide à relancer. Sans jamais voir tes données.",
                'A website or a company exposed your details in a data breach? ShredRGPD writes your GDPR request, works out the deadlines and helps you follow up. Without ever seeing your data.',
              )}
            </p>
            <div className="btn-row">
              <a className="btn btn--primary btn--lg btn--glow" href={link('/verifier')}>
                <Icon name="search" size={18} />
                {t('Vérifier mes fuites', 'Check my breaches')}
              </a>
              <a className="btn btn--outline btn--lg" href={link('/lettre')}>
                {t('Écrire ma lettre', 'Write my letter')}
                <Icon name="arrow" size={18} />
              </a>
            </div>
            <ul className="hero__trust">
              <li>
                <Icon name="check" size={14} />
                {t('0 serveur applicatif', '0 application server')}
              </li>
              <li>
                <Icon name="check" size={14} />
                {t('0 cookie', '0 cookies')}
              </li>
              <li>
                <Icon name="check" size={14} />
                {SOURCE_CODE_URL ? t('Code ouvert', 'Open source') : t('Gratuit', 'Free')}
              </li>
            </ul>
          </div>
          <div className="hero__art">
            <ShredSheet />
          </div>
        </div>
      </section>

      <DataStream />

      {summary.latest.length > 0 && (
        <section className="section section--tight" aria-labelledby="recentes">
          <div className="container">
            <div className="section__head">
              <span className="eyebrow eyebrow--live">{t('En ce moment', 'Right now')}</span>
              <h2 id="recentes">{t('Les dernières fuites en France', 'The latest breaches in France')}</h2>
              <p className="lead">
                {t(
                  <>
                    {formatCount(summary.total)} fuites connues dans le monde, dont {summary.french} touchant la France
                    {summary.fetchedOn && <> (catalogue Have I Been Pwned du {formatLong(summary.fetchedOn, 'fr')})</>}.
                    Tu étais client ? Vois ce qui a fuité et quoi faire.
                  </>,
                  <>
                    {formatCount(summary.total, 'en')} known breaches worldwide, {summary.french} of them affecting
                    France
                    {summary.fetchedOn && <> (Have I Been Pwned catalogue of {formatLong(summary.fetchedOn, 'en')})</>}.
                    Were you a customer? See what leaked and what to do.
                  </>,
                )}
              </p>
            </div>
            <ul className="recent-breaches">
              {summary.latest.map((b) => (
                <li key={b.path}>
                  <a className="start recent-breach" href={localize(b.path)}>
                    <span className="recent-breach__head">
                      <BreachMark title={b.title} name={b.name} />
                      <strong>{b.title}</strong>
                      <span className="recent-breach__date">{formatMonth(b.date, lang)}</span>
                    </span>
                    <span className="recent-breach__meta">
                      {b.pwnCount > 0 && (
                        <span className="recent-breach__count">
                          {formatCount(b.pwnCount, lang)}{' '}
                          {t(b.countUnit, b.countUnit === 'personnes' ? 'people' : 'accounts')}
                        </span>
                      )}
                      <span className={`risk risk--${b.risk}`}>{riskLabel(b.risk, lang)}</span>
                    </span>
                    <span className="recent-breach__types">
                      {b.dataClasses
                        .slice(0, 3)
                        .map((dc) => dataClassLabel(dc, lang))
                        .join(' · ')}
                      {b.dataClasses.length > 3 && ` · +${b.dataClasses.length - 3}`}
                    </span>
                    <span className="start__action">
                      {t('Que faire ?', 'What to do?')}
                      <Icon name="arrow" size={16} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="recent-breaches__more">
              <a href={link('/verifier')}>{t('Chercher parmi toutes les fuites', 'Search all breaches')}</a>
              <a href={link('/chiffres')}>{t('Les fuites en France, en chiffres', 'Breaches in France, in figures')}</a>
              <a href={link('/nouvelles-fuites')}>{t('Suivre les nouvelles fuites', 'Follow new breaches')}</a>
            </p>
            <p className="hint recent-breaches__rule">
              {riskRule(lang)} {logoNotice(lang)}
            </p>
          </div>
        </section>
      )}

      <section className="section section--tight" aria-labelledby="video">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">{t('En vidéo', 'Video')}</span>
            <h2 id="video">{t('Vois ShredRGPD en action', 'See ShredRGPD in action')}</h2>
            <p className="lead">
              {t(
                "Le principe en 45 secondes, sur de vraies fuites : voir ce qui a fuité, écrire à l'entreprise, suivre le délai.",
                'How it works in 45 seconds, on real breaches: see what leaked, write to the company, track the deadline.',
              )}
            </p>
          </div>
          <ShowcaseVideo video={presentation(lang)} />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="commencer-par">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">{t('Par où commencer ?', 'Where to start?')}</span>
            <h2 id="commencer-par">{t('Pars de ta situation', 'Start from your situation')}</h2>
          </div>
          <ul className="starts">
            {STARTS.map((s) => (
              <li key={s.fr.title}>
                <a className="start" href={href(s.to, s.query, lang)}>
                  <span className="step__icon">
                    <Icon name={s.icon} />
                  </span>
                  <strong className="start__title">{s[lang].title}</strong>
                  <span className="start__text">{s[lang].text}</span>
                  <span className="start__action">
                    {s[lang].action}
                    <Icon name="arrow" size={16} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--glow" aria-labelledby="verifier">
        <div className="container showcase showcase--reverse">
          <div>
            <span className="eyebrow">{t('Vérifier', 'Check')}</span>
            <h2 id="verifier">{t('Sais exactement ce qui a fuité', 'Know exactly what leaked')}</h2>
            <p className="lead">
              {t(
                "Repère les fuites qui contiennent ton e-mail, vois quelles données sont exposées, puis écris à l'entreprise en un clic.",
                'Find the breaches that contain your email, see which data were exposed, then write to the company in one click.',
              )}
            </p>
            <ul className="checklist">
              <li>
                <Icon name="check" size={18} />
                {t(
                  'Plus de mille fuites connues, avec les types de données exposées.',
                  'More than a thousand known breaches, with the types of data exposed.',
                )}
              </li>
              <li>
                <Icon name="check" size={18} />
                {t(
                  'Ton e-mail ne passe jamais par ShredRGPD : tu le cherches sur Have I Been Pwned.',
                  'Your email never goes through ShredRGPD: you search for it on Have I Been Pwned.',
                )}
              </li>
              <li>
                <Icon name="check" size={18} />
                {t(
                  'Test de mot de passe sans le confier à personne (k‑anonymat).',
                  'Password test without handing it to anyone (k‑anonymity).',
                )}
              </li>
            </ul>
            <a className="btn btn--primary btn--lg" href={link('/verifier')}>
              <Icon name="search" size={18} />
              {t('Vérifier mes fuites', 'Check my breaches')}
            </a>
          </div>
          <VerifyMock />
        </div>
      </section>

      <section className="section" aria-labelledby="principes">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow eyebrow--ok">{t('Confidentialité', 'Privacy')}</span>
            <h2 id="principes">{t('Tes données restent chez toi', 'Your data stay with you')}</h2>
            <p className="lead">
              {t(
                "Un outil pour te défendre, qui n'héberge rien : ShredRGPD n'a rien à protéger, parce qu'il ne garde rien.",
                'A tool to defend yourself that hosts nothing: ShredRGPD has nothing to protect, because it keeps nothing.',
              )}
            </p>
          </div>
          <div className="bento">
            <article className="tile tile--wide">
              <h3>{t('Ce que tu saisis reste dans ton navigateur', 'What you type stays in your browser')}</h3>
              <p>
                {t(
                  "La page déclare une politique de sécurité qui bloque toute requête vers un autre site, sauf le test de mot de passe par k-anonymat. Ce n'est pas une promesse : c'est ton navigateur qui l'applique.",
                  'The page declares a security policy that blocks any request to another website, except the k-anonymity password test. It is not a promise: your browser enforces it.',
                )}
              </p>
              <div className="tile__visual">
                <pre
                  className="code-block"
                  tabIndex={0}
                  aria-label={t('Extrait de la politique de sécurité', 'Extract from the security policy')}
                >
                  <span className="c">
                    {t('<!-- en-tête de chaque page publiée -->', '<!-- header of every published page -->')}
                  </span>
                  {'\n'}
                  <span className="k">Content-Security-Policy</span>
                  {': '}
                  {'\n  '}
                  <span className="k">connect-src</span> <span className="v">https://api.pwnedpasswords.com</span>
                  {'\n    '}
                  <span className="v">https://shredrgpd.fr/_vercel/insights/</span>
                  {';\n  '}
                  <span className="k">form-action</span> <span className="v">'none'</span>
                  {';\n  '}
                  <span className="k">default-src</span> <span className="v">'self'</span>;
                </pre>
              </div>
            </article>
            <article className="tile tile--narrow">
              <h3>{t('Le délai légal, calculé', 'The legal deadline, worked out')}</h3>
              <p>
                {t(
                  'Un mois à compter de la réception, trois si le site prolonge (article 12.3).',
                  'One month from receipt, three if the company extends it (Article 12(3)).',
                )}
              </p>
              <div className="tile__visual">
                <ul className="mini-timeline">
                  <li>
                    {t('Envoyée', 'Sent')} <span>{formatLong(SAMPLE_DATE, lang)}</span>
                  </li>
                  <li>
                    {t('Échéance', 'Deadline')} <span>{formatLong(gdprDeadlines(SAMPLE_DATE).standard, lang)}</span>
                  </li>
                </ul>
              </div>
            </article>
            <article className="tile tile--half">
              <h3>{t('Des lettres sourcées', 'Letters that cite their sources')}</h3>
              <p>
                {t(
                  "Chaque lettre cite les articles du RGPD qu'elle invoque, sur la structure du modèle de la CNIL.",
                  'Each letter cites the GDPR articles it relies on, following the structure of the CNIL template.',
                )}
              </p>
              <div className="tile__visual">
                <ul className="article-cloud">
                  {['Art. 15', 'Art. 17.1', 'Art. 17.2', 'Art. 19', 'Art. 12.3', 'Art. 12.4', 'Art. 77'].map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="tile tile--half">
              <h3>{t('Aucune base de fuites', 'No breach database')}</h3>
              <p>
                {t(
                  "ShredRGPD ne stocke et ne recherche aucune donnée fuitée, même hachée. Il aide, il n'archive pas.",
                  'ShredRGPD neither stores nor searches any breached data, not even hashed. It helps, it does not archive.',
                )}
              </p>
              <div className="tile__visual" aria-hidden="true">
                <div className="bits-art">
                  {'01101110 01101111 '}
                  <b>00000000</b>
                  {' 01101100 01100101\n'}
                  {'01100001 01101011 01110011 '}
                  <b>00000000</b>
                  {' 01101000\n'}
                  {'01100101 01110010 01100101 01101111 '}
                  <b>00000000</b>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="lettre">
        <div className="container showcase">
          <div>
            <span className="eyebrow">{t('Générateur', 'Generator')}</span>
            <h2 id="lettre">
              {t('Une lettre prête à envoyer, en quelques minutes', 'A letter ready to send, in a few minutes')}
            </h2>
            <ul className="checklist">
              <li>
                <Icon name="check" size={18} />
                {t(
                  'Effacement (article 17), accès (article 15) ou relance après un mois.',
                  'Erasure (Article 17), access (Article 15) or a reminder after one month.',
                )}
              </li>
              <li>
                <Icon name="check" size={18} />
                {t(
                  'Copie, ouverture dans ta messagerie, téléchargement ou impression.',
                  'Copy, open in your email app, download or print.',
                )}
              </li>
              {lang === 'en' && (
                <li>
                  <Icon name="check" size={18} />
                  In English or in French, with the same content.
                </li>
              )}
              <li>
                <Icon name="check" size={18} />
                {t('Ton nom et ton e-mail ne sont jamais enregistrés.', 'Your name and email are never stored.')}
              </li>
            </ul>
            <a className="btn btn--primary btn--lg" href={link('/lettre')}>
              {t('Ouvrir le générateur', 'Open the generator')}
              <Icon name="arrow" size={18} />
            </a>
          </div>
          <div
            className="preview-window"
            role="figure"
            aria-label={t("Extrait d'une lettre d'effacement générée", 'Extract from a generated erasure letter')}
          >
            <div className="preview-bar">
              <span className="small mono muted">{t('lettre-effacement-free.txt', 'erasure-letter-free.txt')}</span>
              <ul className="chips">
                {SAMPLE.articles.slice(0, 4).map((a) => (
                  <li className="chip" key={a}>
                    Art. {a}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="paper"
              tabIndex={0}
              role="region"
              aria-label={t("Texte de la lettre d'exemple", 'Text of the sample letter')}
            >
              <p className="paper__subject">
                {subjectLabel(SAMPLE.lang)}
                {SAMPLE.subject}
              </p>
              <pre className="paper__body">{SAMPLE_EXCERPT}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq">
        <div className="container">
          <div className="section__head section__head--center">
            <span className="eyebrow">{t('Questions', 'Questions')}</span>
            <h2 id="faq">{t('Questions fréquentes', 'Frequently asked questions')}</h2>
          </div>
          <div className="faq">
            {faq.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="plus" size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <AssistantPromo />

      <section className="section" aria-labelledby="commencer">
        <div className="container">
          <div className="cta-band">
            <BinaryField density={0.25} />
            <div className="cta-band__veil" />
            <span className="eyebrow">{t("Passe à l'action", 'Take action')}</span>
            <h2 id="commencer">{t('Reprends le contrôle de tes données', 'Take back control of your data')}</h2>
            <p>
              {t(
                "Ta lettre est prête en quelques minutes. Rien n'est enregistré sans ton accord.",
                'Your letter is ready in a few minutes. Nothing is stored without your consent.',
              )}
            </p>
            <a className="btn btn--primary btn--lg btn--glow" href={link('/lettre')}>
              {t('Écrire ma lettre', 'Write my letter')}
              <Icon name="arrow" size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
