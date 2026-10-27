import { Fragment, useEffect, useMemo, useState } from 'react';
import { ActionPlan } from '../components/ActionPlan';
import { BreachMark } from '../components/BreachMark';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/PageHead';
import { loadBreachCatalog, loadedBreachCatalog } from '../breachCatalog';
import { BREACH_EDITORIAL } from '../data/breachEditorial';
import { BREACH_EDITORIAL_EN } from '../data/breachEditorial.en';
import { useI18n } from '../i18n';
import { DPO_CONTACTS } from '../data/contacts';
import { MANUAL_BREACHES } from '../data/manualBreaches';
import { breachPageMeta, breachPathsByName, findBreachBySlug, formatMonth, pageBreaches } from '../lib/breachPages';
import {
  countUnit,
  dataClassLabel,
  formatCount,
  HIBP_LICENSE_URL,
  logoNotice,
  HIBP_URL,
  hibpBreachUrl,
  RISKY_DATA_CLASSES,
  withManualBreaches,
  type BreachCatalog,
} from '../lib/breaches';
import { formatLong } from '../lib/dates';
import { breachLetterQuery } from '../lib/letterLink';
import { breachRisk, riskLabel, riskRule } from '../lib/risk';
import { NOT_FOUND, NOT_FOUND_EN } from '../seo';
import { NotFound } from './NotFound';

/** Nombre d'autres fuites proposées en bas de page. */
const OTHERS = 6;

/**
 * Page publique d'une fuite française (/fuite/free…) : ce qui a fuité, comment
 * savoir si on est concerné, quoi faire, et la lettre pré-remplie.
 * Métadonnées publiques du catalogue HIBP ou d'une fiche manuelle sourcée
 * (src/data/manualBreaches.ts) seulement (règle n° 2), plus le texte rédigé de
 * src/data/breachEditorial.ts quand il existe.
 */
export function BreachPage({ slug }: { slug: string }) {
  const { t, lang, link, localize } = useI18n();
  const date = (iso: string) => formatLong(iso, lang);
  const [catalog, setCatalog] = useState<BreachCatalog | null>(loadedBreachCatalog);

  useEffect(() => {
    let active = true;
    loadBreachCatalog().then((c) => {
      if (active) setCatalog(c);
    });
    return () => {
      active = false;
    };
  }, []);

  const breaches = useMemo(() => (catalog ? withManualBreaches(catalog.breaches, MANUAL_BREACHES) : null), [catalog]);
  const breach = breaches ? findBreachBySlug(breaches, slug) : null;

  useEffect(() => {
    if (breach) document.title = breachPageMeta(breach, slug, lang).title;
    else if (catalog) document.title = (lang === 'en' ? NOT_FOUND_EN : NOT_FOUND).title;
  }, [breach, catalog, slug, lang]);

  if (!catalog || !breaches) {
    return (
      <PageHead eyebrow={t('Fuite de données', 'Data breach')} title={t('Chargement…', 'Loading…')}>
        {t('Lecture du catalogue des fuites.', 'Reading the breach catalogue.')}
      </PageHead>
    );
  }
  if (!breach) return <NotFound />;

  const paths = breachPathsByName(breaches);
  const others = pageBreaches(breaches)
    .filter((b) => b.name !== breach.name)
    .slice(0, OTHERS);
  const contact = DPO_CONTACTS[breach.name];
  const editorialFr = BREACH_EDITORIAL[breach.name];
  const editorialEn = BREACH_EDITORIAL_EN[breach.name];
  // Texte rédigé dans la langue de la page ; sources (en français) et date du relevé communes.
  const editorial = editorialFr && (lang === 'en' && editorialEn ? { ...editorialFr, ...editorialEn } : editorialFr);
  const sourceLabel = (i: number, label: string) => (lang === 'en' ? (editorialEn?.sourceLabels[i] ?? label) : label);
  const risk = breachRisk(breach.dataClasses);
  const unit = countUnit(breach);
  const facts = [
    { label: t('Date de la fuite', 'Breach date'), value: date(breach.date) },
    ...(breach.pwnCount > 0
      ? [
          {
            label:
              unit === 'personnes'
                ? t('Personnes touchées', 'People affected')
                : t('Comptes touchés', 'Accounts affected'),
            value: formatCount(breach.pwnCount, lang),
          },
        ]
      : []),
    { label: t('Types de données', 'Types of data'), value: String(breach.dataClasses.length) },
    ...(breach.addedDate
      ? [
          {
            label: breach.manual
              ? t('Rendue publique le', 'Made public on')
              : t('Connue de HIBP depuis le', 'Known to HIBP since'),
            value: date(breach.addedDate),
          },
        ]
      : []),
  ];
  const where = breach.domain || breach.title;

  return (
    <>
      <PageHead
        eyebrow={t('Fuite de données', 'Data breach')}
        command={{
          input: t(`shredrgpd fuite ${slug}`, `shredrgpd breach ${slug}`),
          output: t(
            `${breach.dataClasses.length} types de données exposés`,
            `${breach.dataClasses.length} types of data exposed`,
          ),
        }}
        title={t(`Fuite ${breach.title}`, `${breach.title} data breach`)}
      >
        {breach.domain ? `${breach.title} (${breach.domain})` : breach.title}
        {t(
          ` a subi une fuite de données le ${date(breach.date)}. Voici ce qui a fuité, comment savoir si tu es concerné, et quoi faire.`,
          ` suffered a data breach on ${date(breach.date)}. Here is what leaked, how to find out whether you are affected, and what to do.`,
        )}
      </PageHead>

      <div className="container page-body breach-page">
        <div className="breach-summary">
          <BreachMark title={breach.title} name={breach.name} size="lg" />
          <div>
            <span className={`risk risk--${risk}`}>{riskLabel(risk, lang)}</span>
            <p className="hint">{riskRule(lang)}</p>
          </div>
        </div>
        <dl className="breach-facts">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="content-grid">
          <div className="prose">
            <h2>{t('Ce qui a fuité', 'What leaked')}</h2>
            <div className="chips">
              {breach.dataClasses.map((dc) => (
                <span key={dc} className={`chip${RISKY_DATA_CLASSES.has(dc) ? ' chip--danger' : ''}`}>
                  {dataClassLabel(dc, lang)}
                </span>
              ))}
            </div>
            {!breach.verified && (
              <p className="hint">
                {t(
                  "Have I Been Pwned n'a pas pu confirmer cette fuite auprès de l'entreprise.",
                  'Have I Been Pwned could not confirm this breach with the company.',
                )}
              </p>
            )}

            <h2>{t('Es-tu concerné ?', 'Are you affected?')}</h2>
            {breach.manual && editorial?.concerned ? (
              editorial.concerned.map((text) => <p key={text}>{text}</p>)
            ) : (
              <>
                <p>
                  {t(
                    `Cherche ton adresse e-mail sur Have I Been Pwned : si elle apparaît dans la fuite ${breach.title}, tes données en font partie. Ton e-mail ne passe jamais par ShredRGPD.`,
                    `Search for your email address on Have I Been Pwned: if it appears in the ${breach.title} breach, your data are part of it. Your email never goes through ShredRGPD.`,
                  )}
                </p>
                <p className="btn-row">
                  <ExternalLink href={HIBP_URL} className="btn btn--primary">
                    {t('Chercher mon e-mail', 'Search for my email')}
                  </ExternalLink>
                  <ExternalLink href={hibpBreachUrl(breach)} className="btn">
                    {t('Fiche de la fuite sur HIBP', 'Breach page on HIBP')}
                  </ExternalLink>
                </p>
              </>
            )}

            {editorial?.sections.map((section) => (
              <Fragment key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </Fragment>
            ))}

            <h2>{t('Que faire maintenant ?', 'What to do now?')}</h2>
            <ActionPlan dataClasses={breach.dataClasses} write={breach.verified} />
            <p>
              {t(
                'Un message qui cite la fuite, un appel « de ta banque » ? Vois les bons réflexes sur ',
                'A message that mentions the breach, a call “from your bank”? See what to do on ',
              )}
              <a href={link('/que-faire')}>{t('Que faire ?', 'What to do?')}</a>.
            </p>

            {breach.verified ? (
              <>
                <h2>{t(`Écris à ${breach.title}`, `Write to ${breach.title}`)}</h2>
                <p>
                  {t(
                    "Le RGPD te permet de demander à l'entreprise ce qu'elle détient sur toi et ce qui a fuité (articles 15 et 34), ou d'effacer tes données (article 17). Elle a un mois pour te répondre (article 12.3).",
                    'The GDPR lets you ask the company what data it holds about you and what leaked (Articles 15 and 34), or to erase your data (Article 17). It has one month to reply (Article 12(3)).',
                  )}
                </p>
                <p className="btn-row">
                  <a className="btn btn--primary" href={link('/lettre', breachLetterQuery(breach, 'acces', lang))}>
                    {t('Demander ce qui a fuité', 'Ask what leaked')}
                    <Icon name="arrow" size={18} />
                  </a>
                  <a className="btn" href={link('/lettre', breachLetterQuery(breach, 'effacement', lang))}>
                    {t("Demander l'effacement", 'Request erasure')}
                  </a>
                </p>
              </>
            ) : (
              <>
                <h2>{t('À qui écrire ?', 'Who to write to?')}</h2>
                <p>
                  {t(
                    `Have I Been Pwned n'a pas pu confirmer que ces données viennent de ${where}. Il n'y a donc peut-être pas d'entreprise responsable à qui écrire : une lettre risque de rester sans réponse.`,
                    `Have I Been Pwned could not confirm that these data come from ${where}. So there may be no responsible company to write to: a letter may go unanswered.`,
                  )}
                </p>
                {breach.dataClasses.includes('Passwords') && (
                  <p>
                    {t(
                      'La priorité : change le mot de passe de chaque compte où tu utilisais celui qui a fui. ',
                      'The priority: change the password of every account where you used the one that leaked. ',
                    )}
                    <a href={link('/verifier', { parcours: 'mot-de-passe' })}>
                      {t('Teste tes mots de passe', 'Test your passwords')}
                    </a>
                    {t(' sans les confier à personne.', ' without handing them to anyone.')}
                  </p>
                )}
                <p>
                  {t(
                    `Si tu penses que ${where} détient bien tes données, tu peux quand même lui demander ce qu'il a sur toi (article 15 du RGPD) ou l'effacement (article 17).`,
                    `If you think ${where} does hold your data, you can still ask what it has about you (Article 15 GDPR) or request erasure (Article 17).`,
                  )}
                </p>
                <p className="btn-row">
                  <a className="btn" href={link('/lettre', breachLetterQuery(breach, 'acces', lang))}>
                    {t('Demander ce qui a fuité', 'Ask what leaked')}
                  </a>
                  <a className="btn" href={link('/lettre', breachLetterQuery(breach, 'effacement', lang))}>
                    {t("Demander l'effacement", 'Request erasure')}
                  </a>
                </p>
              </>
            )}
            <p className="hint">
              {contact ? (
                <>
                  {t('Contact protection des données : ', 'Data protection contact: ')}
                  {contact.kind === 'email' ? (
                    contact.contact
                  ) : (
                    <ExternalLink href={contact.contact}>{t('formulaire', 'form')}</ExternalLink>
                  )}{' '}
                  (<ExternalLink href={contact.source}>source</ExternalLink>
                  {t(', vérifié le ', ', checked on ')}
                  {date(contact.verifiedOn)}).
                </>
              ) : (
                <>
                  {t(
                    `Le contact du délégué à la protection des données (DPO) figure en général dans la politique de confidentialité${breach.domain ? ` de ${breach.domain}` : ''}. Les lettres sont des modèles indicatifs, pas un conseil juridique.`,
                    `The contact of the data protection officer (DPO) is usually in the privacy policy${breach.domain ? ` of ${breach.domain}` : ''}. The letters are indicative templates, not legal advice.`,
                  )}
                </>
              )}
            </p>

            {editorial && editorial.faq.length > 0 && (
              <>
                <h2>{t('Questions fréquentes', 'Frequently asked questions')}</h2>
                {editorial.faq.map(({ q, a }) => (
                  <div key={q}>
                    <h3>{q}</h3>
                    <p>{a}</p>
                  </div>
                ))}
              </>
            )}

            {editorial && (
              <>
                <h2>{t('Sources', 'Sources')}</h2>
                <ul>
                  {editorial.sources.map((source, i) => (
                    <li key={source.url}>
                      <ExternalLink href={source.url}>{sourceLabel(i, source.label)}</ExternalLink>
                    </li>
                  ))}
                </ul>
                <p className="hint">
                  {t(
                    `Informations relevées le ${date(editorial.verifiedOn)}.`,
                    `Information gathered on ${date(editorial.verifiedOn)}.`,
                  )}
                </p>
              </>
            )}

            <p className="hint verify__credit">
              {breach.manual ? (
                <>
                  {t(
                    "Cette fuite n'est pas dans le catalogue de Have I Been Pwned : les informations viennent des sources ci-dessus.",
                    'This breach is not in the Have I Been Pwned catalogue: the information comes from the sources above.',
                  )}
                </>
              ) : (
                <>
                  {t('Informations : ', 'Information: ')}
                  <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>
                  {t(', sous licence ', ', under the ')}
                  <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
                  {t('', ' licence')}
                  {catalog.fetchedOn &&
                    t(`, mise à jour le ${date(catalog.fetchedOn)}`, `, updated on ${date(catalog.fetchedOn)}`)}
                  .
                </>
              )}{' '}
              {t(
                'Ce sont des informations publiques sur la fuite, pas les données fuitées.',
                'This is public information about the breach, not the breached data.',
              )}{' '}
              {logoNotice(lang)}
            </p>
          </div>

          <aside className="breach-page__side" aria-labelledby="autres-fuites">
            <h2 id="autres-fuites">{t('Autres fuites en France', 'Other breaches in France')}</h2>
            <ul className="breach-links">
              {others.map((b) => (
                <li key={b.name}>
                  <span className="breach-links__name">
                    <BreachMark title={b.title} name={b.name} size="sm" />
                    <a href={localize(paths.get(b.name)!)}>{b.title}</a>
                  </span>
                  <span className="hint">{formatMonth(b.date, lang)}</span>
                </li>
              ))}
            </ul>
            <p className="small">
              <a href={link('/nouvelles-fuites')}>{t('Suivre les nouvelles fuites', 'Follow new breaches')}</a>
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
