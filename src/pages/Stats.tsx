import source from 'virtual:breach-stats';
import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { dataClassLabel, formatCount, HIBP_LICENSE_URL, HIBP_URL, RISKY_DATA_CLASSES } from '../lib/breaches';
import {
  computeStats,
  dataClassOptions,
  filterBreaches,
  formatBigCount,
  formatDelay,
  formatShare,
  yearSpan,
  type DataTypeStat,
  type StatBreach,
  type StatsFilter,
} from '../lib/breachStats';
import { useI18n } from '../i18n';
import { formatMonth } from '../lib/breachPages';
import { formatLong } from '../lib/dates';
import type { Lang } from '../lib/lang';

const ALL = source.breaches;
const YEARS = yearSpan(ALL);
const TYPES = dataClassOptions(ALL);

/* ---------- Filtres dans le fragment de l'adresse (#annee=2024&donnee=Passwords) ---------- */

function readFilter(hash: string): StatsFilter {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  const year = Number(q.get('annee'));
  const dataClass = q.get('donnee') ?? '';
  return {
    ...(YEARS.includes(year) && { year }),
    ...(TYPES.some((t) => t.key === dataClass) && { dataClass }),
  };
}

function writeFilter(filter: StatsFilter): void {
  const q = new URLSearchParams();
  if (filter.year !== undefined) q.set('annee', String(filter.year));
  if (filter.dataClass) q.set('donnee', filter.dataClass);
  const hash = q.toString();
  // Un fragment qui n'est pas un filtre (lien d'évitement #contenu) reste tel quel.
  if (!hash && !window.location.hash.includes('=')) return;
  // replaceState : pas d'entrée d'historique par clic ; le fragment n'est jamais envoyé au serveur.
  const url = window.location.pathname + (hash ? `#${hash}` : '');
  if (url !== window.location.pathname + window.location.hash)
    window.history.replaceState(window.history.state, '', url);
}

/* ---------- Marques ---------- */

/** Pourcentage arrondi pour les attributs SVG (la CSP interdit les styles en ligne). */
const pct = (value: number, max: number) => `${max > 0 ? Math.round((value / max) * 1000) / 10 : 0}%`;

/** Barre horizontale décorative : bout arrondi côté valeur, carré contre l'axe. */
function HBar({ value, max }: { value: number; max: number }) {
  return (
    <svg className="barlist__bar" aria-hidden="true" focusable="false">
      <rect width={pct(value, max)} height="100%" rx="4" />
      <rect width={pct(value, 2 * max)} height="100%" />
    </svg>
  );
}

/** « 3 fuites », « 1 breach », « 3 breaches ». */
const breachCount = (n: number, lang: Lang) =>
  lang === 'en' ? `${formatCount(n, 'en')} breach${n !== 1 ? 'es' : ''}` : `${formatCount(n)} fuite${n > 1 ? 's' : ''}`;

type SortKey = 'date' | 'pwnCount' | 'title';

const SORTERS: Record<SortKey, (a: StatBreach, b: StatBreach) => number> = {
  date: (a, b) => a.date.localeCompare(b.date),
  pwnCount: (a, b) => a.pwnCount - b.pwnCount,
  title: (a, b) => a.title.localeCompare(b.title, 'fr'),
};

export function Stats() {
  const uid = useId();
  const { t, lang, link, localize } = useI18n();
  const [filter, setFilter] = useState<StatsFilter>(() =>
    typeof window === 'undefined' ? {} : readFilter(window.location.hash),
  );
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'date', desc: true });

  useEffect(() => writeFilter(filter), [filter]);
  // Adresse filtrée ouverte alors que la page l'est déjà (lien collé, retour arrière).
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.includes('=')) setFilter(readFilter(hash));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const empty = ALL.length === 0;
  const scoped = filterBreaches(ALL, filter);
  const stats = computeStats(scoped);
  // Chaque graphique sert aussi de filtre : il tient compte de l'autre filtre, pas du sien.
  const yearChart = computeStats(filterBreaches(ALL, { dataClass: filter.dataClass }), { years: YEARS }).byYear;
  const typeBase = filterBreaches(ALL, { year: filter.year });
  const typeStats = computeStats(typeBase);
  let typeChart: DataTypeStat[] = typeStats.dataTypes;
  if (filter.dataClass && !typeChart.some((d) => d.key === filter.dataClass)) {
    // Le type choisi reste visible même s'il n'est pas dans les dix premiers.
    const selected = computeStats(typeBase, { dataTypes: Number.POSITIVE_INFINITY }).dataTypes.find(
      (d) => d.key === filter.dataClass,
    );
    typeChart = [
      ...typeChart,
      selected ?? {
        key: filter.dataClass,
        label: dataClassLabel(filter.dataClass, lang),
        count: 0,
        share: 0,
        risky: RISKY_DATA_CLASSES.has(filter.dataClass),
      },
    ];
  }
  const maxYear = Math.max(1, ...yearChart.map((y) => y.count));
  const maxShare = typeChart[0]?.share ?? 0;
  const maxAccounts = stats.biggest[0]?.pwnCount ?? 0;
  const rows = [...scoped].sort((a, b) => (sort.desc ? -1 : 1) * SORTERS[sort.key](a, b));

  const active = filter.year !== undefined || filter.dataClass !== undefined;
  const scopeText = [
    breachCount(stats.count, lang),
    filter.year !== undefined && t(`en ${filter.year}`, `in ${filter.year}`),
    filter.dataClass && t(`avec ${dataClassLabel(filter.dataClass)}`, `with ${dataClassLabel(filter.dataClass, 'en')}`),
  ]
    .filter(Boolean)
    .join(' ');

  const toggleYear = (year: number) => setFilter((f) => ({ ...f, year: f.year === year ? undefined : year }));
  const toggleType = (key: string) => setFilter((f) => ({ ...f, dataClass: f.dataClass === key ? undefined : key }));
  const onYear = (e: ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }));
  const onType = (e: ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, dataClass: e.target.value || undefined }));
  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'title' }));
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.desc ? 'descending' : 'ascending') : undefined);

  return (
    <>
      <PageHead
        eyebrow={t('Chiffres', 'Figures')}
        command={{
          input: t('shredrgpd chiffres --france', 'shredrgpd figures --france'),
          output: t(`${ALL.length} fuites analysées`, `${ALL.length} breaches analysed`),
        }}
        title={t('Les fuites de données en France, en chiffres', 'Data breaches in France, in figures')}
      >
        {t(
          'Ce que dit le catalogue public Have I Been Pwned des fuites qui ont touché des entreprises françaises. Filtre par année ou par type de données : tous les chiffres suivent. Mis à jour chaque jour.',
          'What the public Have I Been Pwned catalogue says about the breaches that hit French companies. Filter by year or by type of data: all the figures follow. Updated every day.',
        )}
      </PageHead>

      <div className="container page-body stats-page">
        {empty ? (
          <Notice tone="warn">
            <p>
              {t(
                "Chiffres indisponibles : le catalogue des fuites n'a pas pu être téléchargé lors de la dernière mise à jour du site. Reviens un peu plus tard.",
                'Figures unavailable: the breach catalogue could not be downloaded during the last site update. Come back a little later.',
              )}
            </p>
          </Notice>
        ) : (
          <>
            <div className="stats-filters" role="group" aria-label={t('Filtres', 'Filters')}>
              <div className="field">
                <label htmlFor={`${uid}-annee`}>{t('Année', 'Year')}</label>
                <select id={`${uid}-annee`} className="select" value={filter.year ?? ''} onChange={onYear}>
                  <option value="">{t('Toutes', 'All')}</option>
                  {[...YEARS].reverse().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`${uid}-donnee`}>{t('Donnée exposée', 'Exposed data')}</label>
                <select id={`${uid}-donnee`} className="select" value={filter.dataClass ?? ''} onChange={onType}>
                  <option value="">{t('Toutes', 'All')}</option>
                  {TYPES.map((type) => (
                    <option key={type.key} value={type.key}>
                      {dataClassLabel(type.key, lang)} ({type.count})
                    </option>
                  ))}
                </select>
              </div>
              <p className="stats-filters__scope" aria-live="polite">
                {scopeText}
              </p>
              {active && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFilter({})}>
                  <Icon name="close" size={16} />
                  {t('Tout afficher', 'Show all')}
                </button>
              )}
            </div>

            {stats.count === 0 ? (
              <div className="stats-empty">
                <Notice>
                  <p>
                    {t(
                      "Aucune fuite ne correspond à ces filtres. Change d'année ou de type de données.",
                      'No breach matches these filters. Change the year or the type of data.',
                    )}
                  </p>
                </Notice>
              </div>
            ) : (
              <dl className="figures">
                <div>
                  <dt>
                    {stats.count > 1
                      ? t("fuites d'entreprises françaises", 'breaches of French companies')
                      : t("fuite d'entreprise française", 'breach of a French company')}
                    {filter.year === undefined && YEARS.length > 0
                      ? t(` depuis ${YEARS[0]}`, ` since ${YEARS[0]}`)
                      : ''}
                  </dt>
                  <dd>{formatCount(stats.count, lang)}</dd>
                </div>
                <div>
                  <dt>{t("de plus d'un million de comptes", 'of more than a million accounts')}</dt>
                  <dd>{formatCount(stats.overMillion, lang)}</dd>
                </div>
                <div>
                  <dt>{t('contiennent des données bancaires', 'contain bank details')}</dt>
                  <dd>{formatShare(stats.bank.share, lang)}</dd>
                </div>
                {stats.medianDelayDays !== null && (
                  <div>
                    <dt>
                      {t(
                        'entre une fuite et son arrivée dans le catalogue (médiane)',
                        'between a breach and its arrival in the catalogue (median)',
                      )}
                    </dt>
                    <dd>{formatDelay(stats.medianDelayDays, lang)}</dd>
                  </div>
                )}
              </dl>
            )}

            <section className="stats-block" aria-labelledby="par-annee">
              <h2 id="par-annee">{t('Fuites par année', 'Breaches per year')}</h2>
              <p className="stats-block__lead">
                {t(
                  "Selon l'année où la fuite a eu lieu, pas celle de sa découverte : les dernières années sont incomplètes. Clique sur une année pour filtrer la page ; au survol, la liste de ses fuites.",
                  'By the year the breach happened, not the year it was discovered: the last few years are incomplete. Click a year to filter the page; hover to see its breaches.',
                )}
              </p>
              <ol className="colchart" data-filtered={filter.year !== undefined || undefined}>
                {yearChart.map((y) => {
                  const tip = `${uid}-tip-${y.year}`;
                  const shown = y.titles.slice(0, 6);
                  return (
                    <li key={y.year} className={y.year % 2 ? 'colchart__odd' : undefined}>
                      <button
                        type="button"
                        className="colchart__hit"
                        aria-pressed={filter.year === y.year}
                        aria-describedby={y.count ? tip : undefined}
                        disabled={y.count === 0}
                        onClick={() => toggleYear(y.year)}
                      >
                        <span className="colchart__value">
                          {y.count}
                          <span className="visually-hidden">
                            {t(` fuite${y.count > 1 ? 's' : ''} en`, ` breach${y.count !== 1 ? 'es' : ''} in`)}
                          </span>
                        </span>
                        <svg className="colchart__bar" aria-hidden="true" focusable="false">
                          {y.count > 0 && (
                            <>
                              <rect
                                y={pct(maxYear - y.count, maxYear)}
                                width="100%"
                                height={pct(y.count, maxYear)}
                                rx="4"
                              />
                              <rect
                                y={pct(2 * maxYear - y.count, 2 * maxYear)}
                                width="100%"
                                height={pct(y.count, 2 * maxYear)}
                              />
                            </>
                          )}
                        </svg>
                        <span className="colchart__year">{y.year}</span>
                      </button>
                      {y.count > 0 && (
                        <span role="tooltip" id={tip} className="colchart__tip">
                          <strong>{breachCount(y.count, lang)}</strong> {t('en', 'in')} {y.year}
                          <span className="colchart__tip-list">
                            {shown.join(', ')}
                            {y.titles.length > shown.length &&
                              t(
                                ` et ${y.titles.length - shown.length} autres`,
                                ` and ${y.titles.length - shown.length} others`,
                              )}
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="stats-block" aria-labelledby="donnees">
              <h2 id="donnees">{t('Les données les plus exposées', 'The most exposed data')}</h2>
              <p className="stats-block__lead">
                {t(
                  `Part des fuites${filter.year !== undefined ? ` de ${filter.year}` : ''} qui contiennent chaque type de données. Clique sur un type pour filtrer la page.`,
                  `Share of the breaches${filter.year !== undefined ? ` of ${filter.year}` : ''} that contain each type of data. Click a type to filter the page.`,
                )}
              </p>
              <ul className="barlist barlist--select" data-filtered={filter.dataClass !== undefined || undefined}>
                {typeChart.map((d) => (
                  <li key={d.key}>
                    <button type="button" aria-pressed={filter.dataClass === d.key} onClick={() => toggleType(d.key)}>
                      <span className="barlist__label">
                        {dataClassLabel(d.key, lang)}
                        {d.risky && <span className="barlist__tag">{t('sensible', 'sensitive')}</span>}
                      </span>
                      <HBar value={d.share} max={maxShare} />
                      <span className="barlist__value">
                        {formatShare(d.share, lang)}
                        <span className="visually-hidden">
                          {t(
                            ` des fuites (${d.count} sur ${typeStats.count})`,
                            ` of the breaches (${d.count} of ${typeStats.count})`,
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="small">
                {t(
                  `${formatShare(typeStats.passwords.share)} de ces fuites contiennent des mots de passe. Tu en as réutilisé un ? `,
                  `${formatShare(typeStats.passwords.share, 'en')} of these breaches contain passwords. Did you reuse one? `,
                )}
                <a href={link('/verifier', { parcours: 'mot-de-passe' })}>
                  {t('Teste-le sans le confier à personne', 'Test it without handing it to anyone')}
                </a>
                .
              </p>
            </section>

            {stats.biggest.length > 0 && (
              <section className="stats-block" aria-labelledby="plus-grosses">
                <h2 id="plus-grosses">{t('Les plus grosses fuites', 'The biggest breaches')}</h2>
                <p className="stats-block__lead">
                  {t(
                    `Nombre de comptes exposés${active ? `, pour ${scopeText}` : ''}. Chaque fuite a sa page : ce qui a fuité et quoi faire.`,
                    `Number of accounts exposed${active ? `, for ${scopeText}` : ''}. Each breach has its own page: what leaked and what to do.`,
                  )}
                </p>
                <ol className="barlist">
                  {stats.biggest.map((b) => (
                    <li key={b.path}>
                      <span className="barlist__label">
                        <a href={localize(b.path)}>{b.title}</a>
                        <span className="barlist__meta">{formatMonth(b.date, lang)}</span>
                      </span>
                      <HBar value={b.pwnCount} max={maxAccounts} />
                      <span className="barlist__value">
                        {formatBigCount(b.pwnCount, lang)}
                        <span className="visually-hidden">{t(' comptes', ' accounts')}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {rows.length > 0 && (
              <section className="stats-block" aria-labelledby="toutes">
                <h2 id="toutes">{t('Toutes les fuites', 'All breaches')}</h2>
                <p className="stats-block__lead">
                  {t('Clique sur un titre de colonne pour trier.', 'Click a column heading to sort.')}
                </p>
                <div
                  className="table-scroll"
                  role="region"
                  aria-label={t('Tableau des fuites, défilable', 'Table of breaches, scrollable')}
                  tabIndex={0}
                >
                  <table className="stats-table">
                    <caption className="visually-hidden">{scopeText}</caption>
                    <thead>
                      <tr>
                        <th scope="col" aria-sort={ariaSort('title')}>
                          <button type="button" onClick={() => sortBy('title')}>
                            {t('Fuite', 'Breach')}
                          </button>
                        </th>
                        <th scope="col" aria-sort={ariaSort('date')}>
                          <button type="button" onClick={() => sortBy('date')}>
                            Date
                          </button>
                        </th>
                        <th scope="col" className="num" aria-sort={ariaSort('pwnCount')}>
                          <button type="button" onClick={() => sortBy('pwnCount')}>
                            {t('Comptes', 'Accounts')}
                          </button>
                        </th>
                        <th scope="col">{t('Données exposées', 'Exposed data')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((b) => (
                        <tr key={b.path}>
                          <th scope="row">
                            <a href={localize(b.path)}>{b.title}</a>
                          </th>
                          <td>{formatMonth(b.date, lang)}</td>
                          <td className="num">{b.pwnCount > 0 ? formatCount(b.pwnCount, lang) : '—'}</td>
                          <td className="stats-table__types">
                            {b.dataClasses.map((dc) => dataClassLabel(dc, lang)).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <section className="stats-block prose" aria-labelledby="lire">
          <h2 id="lire">{t('Comment lire ces chiffres', 'How to read these figures')}</h2>
          {lang === 'en' ? (
            <ul>
              <li>
                <strong>“French” is an estimate.</strong> The catalogue gives no country. ShredRGPD counts a breach if
                the company’s domain ends in .fr, if the company is known to be French or if the description mentions
                France. Some breaches are surely missing, others may be counted wrongly.
              </li>
              <li>
                <strong>Only breaches known to Have I Been Pwned.</strong> The catalogue only lists breaches whose data
                circulated and were loaded into it. It is not the total number of breaches that hit France.
              </li>
              <li>
                <strong>Accounts, not people.</strong> The same person can appear in several breaches, and an account is
                not always a person. Adding up accounts does not give the number of people affected in France.
              </li>
              <li>
                Scope: breaches with an identified company, excluding spam lists, malware and breaches flagged as
                fabricated.
              </li>
            </ul>
          ) : (
            <ul>
              <li>
                <strong>« Française » est une estimation.</strong> Le catalogue n'indique pas de pays. ShredRGPD retient
                une fuite si le domaine de l'entreprise est en .fr, si l'entreprise est connue comme française ou si la
                description cite la France. Certaines fuites manquent sûrement, d'autres sont peut-être en trop.
              </li>
              <li>
                <strong>Seules les fuites connues de Have I Been Pwned.</strong> Le catalogue ne recense que les fuites
                dont les données ont circulé et y ont été chargées. Ce n'est pas le total des fuites qui ont touché la
                France.
              </li>
              <li>
                <strong>Des comptes, pas des personnes.</strong> Une même personne peut figurer dans plusieurs fuites,
                et un compte n'est pas toujours une personne. Additionner les comptes ne donne pas le nombre de Français
                touchés.
              </li>
              <li>
                Périmètre : les fuites qui ont une entreprise identifiée, hors listes de spam, logiciels malveillants et
                fuites signalées comme fabriquées.
              </li>
            </ul>
          )}
          <p className="small">
            {t('Source : ', 'Source: ')}
            <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>
            {t(', sous licence ', ', under the ')}
            <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
            {t('', ' licence')}
            {source.fetchedOn &&
              t(
                `, catalogue du ${formatLong(source.fetchedOn, 'fr')}`,
                `, catalogue of ${formatLong(source.fetchedOn, 'en')}`,
              )}
            {t(
              '. Ce sont des informations publiques sur les fuites, jamais les données fuitées. Les filtres restent dans ton navigateur.',
              '. This is public information about the breaches, never the breached data. The filters stay in your browser.',
            )}
          </p>
          <p>
            <a className="btn btn--primary" href={link('/verifier')}>
              <Icon name="search" size={18} />
              {t('Vérifier mes fuites', 'Check my breaches')}
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
