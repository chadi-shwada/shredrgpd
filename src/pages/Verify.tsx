import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { IconName } from '../components/Icon';
import { loadBreachCatalog } from '../breachCatalog';
import { readStorage, removeStorage, writeStorage } from '../browser';
import { ActionPlan } from '../components/ActionPlan';
import { BatchLetters } from '../components/BatchLetters';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { BreachMark } from '../components/BreachMark';
import { PasswordGenerator } from '../components/PasswordGenerator';
import { PasteResults } from '../components/PasteResults';
import { useI18n } from '../i18n';
import { breachPathsByName } from '../lib/breachPages';
import {
  dataClassLabel,
  formatCount,
  HIBP_LICENSE_URL,
  logoNotice,
  HIBP_URL,
  hibpBreachUrl,
  newFrenchBreachesSince,
  recentFrenchBreaches,
  RISKY_DATA_CLASSES,
  searchBreaches,
  type Breach,
  type BreachCatalog,
} from '../lib/breaches';
import { formatLong, isValidIsoDate, todayIso } from '../lib/dates';
import { breachLetterQuery } from '../lib/letterLink';
import { pwnedCount, PwnedServiceError } from '../lib/pwned';
import { navigate, useRoute } from '../router';

/**
 * Date de la dernière visite, gardée seulement si la personne a demandé à voir les nouvelles fuites
 * (traceur exempté de consentement car demandé expressément). L'ancienne clé, écrite d'office avant
 * le 7 octobre 2026, est effacée.
 */
const LAST_VISIT_KEY = 'shred.verifier.nouvellesFuites';
const OLD_LAST_VISIT_KEY = 'shred.verifier.derniereVisite';

/** Ce que la personne veut vérifier (paramètre « parcours » du fragment). */
type Situation = 'verifier' | 'mot-de-passe' | 'message' | 'publie';

const SITUATIONS: { value: Situation; icon: IconName; fr: [string, string]; en: [string, string] }[] = [
  {
    value: 'verifier',
    icon: 'mail',
    fr: ['Mon adresse e-mail', 'a-t-elle fuité ?'],
    en: ['My email address', 'has it leaked?'],
  },
  {
    value: 'mot-de-passe',
    icon: 'lock',
    fr: ['Un mot de passe', 'a-t-il fuité ? en créer un solide'],
    en: ['A password', 'has it leaked? create a strong one'],
  },
  {
    value: 'message',
    icon: 'alert',
    fr: ["Une entreprise m'a prévenu", 'e-mail ou courrier reçu'],
    en: ['A company warned me', 'email or letter received'],
  },
  {
    value: 'publie',
    icon: 'database',
    fr: ['Mes données sont publiées', 'sur un site ou un forum'],
    en: ['My data are published', 'on a website or forum'],
  },
];

function asSituation(value: string | null): Situation {
  return value === 'message' || value === 'publie' || value === 'mot-de-passe' ? value : 'verifier';
}

/** Types de données qui imposent de changer ses mots de passe. */
const PASSWORD_CLASSES = new Set(['Passwords', 'Historical passwords', 'Password hints']);

const RISKY = RISKY_DATA_CLASSES;

type PwnedState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; count: number }
  | { status: 'clean' }
  | { status: 'error'; message: string };

function PasswordCheck() {
  const id = useId();
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [state, setState] = useState<PwnedState>({ status: 'idle' });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setState({ status: 'loading' });
    try {
      const count = await pwnedCount(password, (url, init) => fetch(url, init));
      setState(count > 0 ? { status: 'found', count } : { status: 'clean' });
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof PwnedServiceError
            ? t(error.message, 'The Pwned Passwords service did not respond correctly. Try again later.')
            : t("Le test n'a pas pu aboutir. Réessaie plus tard.", 'The test could not be completed. Try again later.'),
      });
    } finally {
      // On ne garde pas le mot de passe en mémoire plus que nécessaire.
      setPassword('');
    }
  };

  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <h2 className="card__title" id={`${id}-title`}>
        <span className="card__num">
          <Icon name="lock" size={14} />
        </span>
        {t('Teste un mot de passe', 'Test a password')}
      </h2>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${id}-pw`}>{t('Mot de passe', 'Password')}</label>
          <input
            id={`${id}-pw`}
            className="input input--mono"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-how`}
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={!password || state.status === 'loading'}>
          <Icon name="search" size={18} />
          {state.status === 'loading' ? t('Test en cours…', 'Testing…') : t('Tester', 'Test')}
        </button>
      </form>

      <div aria-live="polite" className="verify__result">
        {state.status === 'found' && (
          <Notice tone="danger">
            <p>
              <strong>
                {t(
                  `Ce mot de passe apparaît ${formatCount(state.count)} fois dans des fuites connues.`,
                  `This password appears ${formatCount(state.count, 'en')} times in known breaches.`,
                )}
              </strong>
            </p>
            <p>
              {t(
                "Ne l'utilise plus nulle part et remplace-le partout où il sert encore.",
                'Stop using it anywhere and replace it wherever it is still used.',
              )}
            </p>
          </Notice>
        )}
        {state.status === 'clean' && (
          <Notice tone="ok">
            <p>
              <strong>{t('Aucune occurrence connue.', 'No known occurrence.')}</strong>{' '}
              {t(
                "Ça ne prouve pas qu'il est solide : garde-le unique et long.",
                'That does not prove it is strong: keep it unique and long.',
              )}
            </p>
          </Notice>
        )}
        {state.status === 'error' && (
          <Notice tone="warn">
            <p>{state.message}</p>
          </Notice>
        )}
      </div>

      <p className="hint verify__how" id={`${id}-how`}>
        {t(
          "ShredRGPD calcule l'empreinte SHA-1 dans ton navigateur et n'envoie que ses 5 premiers caractères à ",
          'ShredRGPD computes the SHA-1 hash in your browser and sends only its first 5 characters to ',
        )}
        <ExternalLink href="https://haveibeenpwned.com/Passwords">Pwned Passwords</ExternalLink>
        {t(
          ". Le service renvoie des centaines d'empreintes qui commencent pareil, et la comparaison se fait chez toi. Ton mot de passe ne quitte jamais ton appareil.",
          '. The service returns hundreds of hashes that start the same way, and the comparison happens on your device. Your password never leaves your device.',
        )}
      </p>
    </section>
  );
}

function BreachRow({ breach, selected, onToggle }: { breach: Breach; selected: boolean; onToggle: () => void }) {
  const { t, lang } = useI18n();
  const shown = breach.dataClasses.slice(0, 3);
  const more = breach.dataClasses.length - shown.length;
  const meta = [
    breach.domain,
    formatLong(breach.date, lang),
    breach.pwnCount > 0 ? `${formatCount(breach.pwnCount, lang)} ${t('comptes', 'accounts')}` : '',
  ].filter(Boolean);
  return (
    <li className="breach" data-selected={selected}>
      <label className="breach__pick">
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span className="breach__main">
          <span className="breach__title">
            <BreachMark title={breach.title} name={breach.name} size="sm" />
            {breach.title}
            {!breach.verified && <span className="breach__flag">{t('non vérifiée', 'unverified')}</span>}
            {breach.fabricated && (
              <span className="breach__flag">{t('possiblement fabriquée', 'possibly fabricated')}</span>
            )}
            {breach.spamList && <span className="breach__flag">{t('liste de spam', 'spam list')}</span>}
            {breach.malware && <span className="breach__flag">{t('logiciel malveillant', 'malware')}</span>}
          </span>
          <span className="breach__meta">{meta.join(' · ')}</span>
          <span className="breach__classes">
            {shown.map((dc) => (
              <span key={dc} className={`chip${RISKY.has(dc) ? ' chip--danger' : ''}`}>
                {dataClassLabel(dc, lang)}
              </span>
            ))}
            {more > 0 && <span className="chip">+{more}</span>}
          </span>
        </span>
      </label>
      <ExternalLink
        href={hibpBreachUrl(breach)}
        className="breach__more"
        title={t('Voir la fiche sur Have I Been Pwned', 'See the page on Have I Been Pwned')}
      >
        <Icon name="external" size={16} />
        <span className="visually-hidden">
          {t(`Fiche de ${breach.title} sur Have I Been Pwned`, `${breach.title} on Have I Been Pwned`)}
        </span>
      </ExternalLink>
    </li>
  );
}

/** Nombre de fuites affichées avant « Afficher plus ». */
const FIRST_ROWS = 6;

/** Indicateur d'étapes cliquable (mêmes styles que le générateur de lettre). */
function Stepper({
  steps,
  step,
  reached,
  onGo,
}: {
  steps: string[];
  step: number;
  reached: number;
  onGo: (n: number) => void;
}) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('Étapes', 'Steps')}>
      <ol className={`stepper stepper--${steps.length}`}>
        {steps.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label} data-state={n === step ? 'current' : n <= reached ? 'done' : 'todo'}>
              <button
                type="button"
                onClick={() => onGo(n)}
                disabled={n > reached}
                aria-current={n === step ? 'step' : undefined}
              >
                <span className="stepper__num" aria-hidden="true">
                  {n < step ? <Icon name="check" size={14} /> : n}
                </span>
                <span className="stepper__label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="stepper__compact" aria-hidden="true">
        {t(`Étape ${step} sur ${steps.length}`, `Step ${step} of ${steps.length}`)} · {steps[step - 1]}
      </p>
    </nav>
  );
}

/**
 * Parcours « fuites » en étapes, une à la fois : chercher son e-mail sur Have I
 * Been Pwned (mode « verifier ») ou partir du message reçu (« message »), cocher
 * les fuites, puis voir quoi faire.
 */
function BreachFlow({ mode, catalog }: { mode: 'verifier' | 'message'; catalog: BreachCatalog | null }) {
  const id = useId();
  const { t, lang, link, localize } = useI18n();
  const steps =
    mode === 'verifier'
      ? [
          t('Cherche ton e-mail', 'Search your email'),
          t('Coche les fuites', 'Tick the breaches'),
          t('Quoi faire', 'What to do'),
        ]
      : [t("Trouve l'entreprise", 'Find the company'), t('Quoi faire', 'What to do')];
  const last = steps.length;
  const pickStep = mode === 'verifier' ? 2 : 1;
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const goTo = (n: number) => {
    setStep(n);
    setReached((r) => Math.max(r, n));
  };

  // Changement d'étape : retour en haut du parcours, focus sur le titre de l'étape.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  const frenchRecent = useMemo(() => (catalog ? recentFrenchBreaches(catalog.breaches, 12) : []), [catalog]);
  const showFrench = !query && frenchRecent.length > 0;
  const results = useMemo(() => {
    if (!catalog) return [];
    if (!query && frenchRecent.length > 0) return frenchRecent;
    return searchBreaches(catalog.breaches, query, 12);
  }, [catalog, query, frenchRecent]);
  const chosen = useMemo(
    () => (catalog ? catalog.breaches.filter((b) => selected.includes(b.name)) : []),
    [catalog, selected],
  );
  const exposed = useMemo(() => [...new Set(chosen.flatMap((b) => b.dataClasses))], [chosen]);
  const breachPaths = useMemo(() => breachPathsByName(catalog?.breaches ?? []), [catalog]);
  const passwordsLeaked = exposed.some((dc) => PASSWORD_CLASSES.has(dc));

  const toggle = (name: string) => setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));
  const addMany = (names: string[]) => {
    setSelected((s) => [...s, ...names.filter((n) => !s.includes(n))]);
    goTo(pickStep);
  };

  const unavailable = catalog !== null && catalog.breaches.length === 0;

  // Nouvelles fuites françaises depuis la dernière visite, seulement si la personne l'a demandé.
  const [lastVisit] = useState(() => {
    const raw = readStorage(LAST_VISIT_KEY);
    return raw && isValidIsoDate(raw) ? raw : null;
  });
  const [watching, setWatching] = useState(lastVisit !== null);
  const [watchNote, setWatchNote] = useState<'on' | 'refused' | null>(null);
  useEffect(() => removeStorage(OLD_LAST_VISIT_KEY), []);
  useEffect(() => {
    if (watching && catalog && catalog.breaches.length > 0) writeStorage(LAST_VISIT_KEY, todayIso());
  }, [watching, catalog]);
  const startWatching = () => {
    if (writeStorage(LAST_VISIT_KEY, todayIso())) {
      setWatching(true);
      setWatchNote('on');
    } else {
      setWatchNote('refused');
    }
  };
  const stopWatching = () => {
    removeStorage(LAST_VISIT_KEY);
    setWatching(false);
    setWatchNote(null);
  };
  const fresh = useMemo(
    () => (catalog && watching ? newFrenchBreachesSince(catalog.breaches, lastVisit) : []),
    [catalog, watching, lastVisit],
  );

  const titleProps = { ref: heading, tabIndex: -1 } as const;

  return (
    <div className="verify-flow" ref={top}>
      <Stepper steps={steps} step={step} reached={reached} onGo={goTo} />

      {mode === 'verifier' && step === 1 && (
        <section className="card" aria-labelledby={`${id}-s1`}>
          <h2 className="card__title" id={`${id}-s1`} {...titleProps}>
            <span className="card__num">1</span>
            {t('Cherche ton adresse e-mail', 'Search for your email address')}
          </h2>
          <p className="muted">
            {t(
              'Have I Been Pwned, le service de référence, liste les fuites qui contiennent ton adresse. Ton e-mail ne passe jamais par ShredRGPD : tu le tapes sur leur site.',
              'Have I Been Pwned, the reference service, lists the breaches that contain your address. Your email never goes through ShredRGPD: you type it on their website.',
            )}
          </p>
          <ol className="howto">
            <li>
              <span className="howto__num">1</span>
              <div>
                <strong>
                  {t(
                    'Ouvre Have I Been Pwned et tape ton adresse e-mail.',
                    'Open Have I Been Pwned and type your email address.',
                  )}
                </strong>
                <ExternalLink href={HIBP_URL} className="btn btn--primary btn--sm">
                  {t('Ouvrir Have I Been Pwned', 'Open Have I Been Pwned')}
                  <Icon name="external" size={16} />
                </ExternalLink>
              </div>
            </li>
            <li>
              <span className="howto__num">2</span>
              <div>
                <strong>
                  {t(
                    'Sur la page de résultats, sélectionne tout et copie.',
                    'On the results page, select all and copy.',
                  )}
                </strong>
                <span className="hint">
                  {t(
                    'Ctrl+A puis Ctrl+C, ou « Tout sélectionner » puis « Copier » sur téléphone.',
                    'Ctrl+A then Ctrl+C, or “Select all” then “Copy” on a phone.',
                  )}
                </span>
              </div>
            </li>
            <li>
              <span className="howto__num">3</span>
              <div>
                <strong>
                  {t(
                    'Colle ici : ShredRGPD reconnaît les fuites pour toi.',
                    'Paste here: ShredRGPD recognises the breaches for you.',
                  )}
                </strong>
                {catalog && catalog.breaches.length > 0 && <PasteResults breaches={catalog.breaches} onAdd={addMany} />}
              </div>
            </li>
          </ol>
          <div className="wizard__nav">
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => goTo(2)}>
                {t('Je préfère chercher les fuites moi-même', 'I would rather search for the breaches myself')}
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
          <details className="verify__none">
            <summary>{t("Have I Been Pwned n'a rien trouvé ?", 'Have I Been Pwned found nothing?')}</summary>
            <p>
              {t(
                "Bonne nouvelle, mais pas une garantie : le service ne connaît que les fuites rendues publiques et ne voit que l'adresse cherchée. Refais la recherche avec tes autres adresses, anciennes comprises. Pense aussi à ",
                'Good news, but not a guarantee: the service only knows breaches that were made public and only sees the address you searched for. Search again with your other addresses, old ones included. Also remember to ',
              )}
              <a href={link('/verifier', { parcours: 'mot-de-passe' })}>
                {t('tester tes mots de passe', 'test your passwords')}
              </a>
              .
            </p>
          </details>
        </section>
      )}

      {step === pickStep && (
        <section className="card" aria-labelledby={`${id}-s2`}>
          <h2 className="card__title" id={`${id}-s2`} {...titleProps}>
            <span className="card__num">{pickStep}</span>
            {mode === 'message'
              ? t("Trouve l'entreprise", 'Find the company')
              : t('Coche les fuites qui te concernent', 'Tick the breaches that concern you')}
          </h2>

          {catalog === null && (
            <p className="muted">{t('Chargement de la liste des fuites…', 'Loading the list of breaches…')}</p>
          )}

          {unavailable && (
            <Notice tone="warn">
              <p>
                {t(
                  "La liste des fuites n'est pas disponible dans cette version du site.",
                  'The list of breaches is not available in this version of the site.',
                )}
              </p>
              <p>
                {t('Tu peux quand même écrire ta lettre : ', 'You can still write your letter: ')}
                <a href={link('/lettre', { contexte: 'violation' })}>
                  {t('choisis « Une entreprise a subi une fuite »', 'choose “A company suffered a breach”')}
                </a>
                .
              </p>
            </Notice>
          )}

          {catalog && catalog.breaches.length > 0 && (
            <>
              {chosen.length > 0 && (
                <div className="picked">
                  <p className="picked__title">
                    {t(
                      `${chosen.length} fuite${chosen.length > 1 ? 's' : ''} choisie${chosen.length > 1 ? 's' : ''}`,
                      `${chosen.length} breach${chosen.length > 1 ? 'es' : ''} chosen`,
                    )}
                  </p>
                  <ul>
                    {chosen.map((b) => (
                      <li key={b.name}>
                        <button
                          type="button"
                          className="fresh__item"
                          onClick={() => toggle(b.name)}
                          aria-label={t(`Retirer ${b.title}`, `Remove ${b.title}`)}
                        >
                          {b.title}
                          <Icon name="close" size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {watching && fresh.length > 0 && lastVisit && (
                <div className="fresh" role="status">
                  <p>
                    <strong>
                      {t(
                        `${fresh.length} nouvelle${fresh.length > 1 ? 's' : ''} fuite${fresh.length > 1 ? 's' : ''} française${fresh.length > 1 ? 's' : ''}`,
                        `${fresh.length} new French breach${fresh.length > 1 ? 'es' : ''}`,
                      )}
                    </strong>{' '}
                    {t(
                      `depuis ta dernière visite, le ${formatLong(lastVisit, 'fr')} :`,
                      `since your last visit on ${formatLong(lastVisit, 'en')}:`,
                    )}
                  </p>
                  <ul>
                    {fresh.slice(0, 6).map((b) => (
                      <li key={b.name}>
                        <button type="button" className="fresh__item" onClick={() => toggle(b.name)}>
                          {selected.includes(b.name) && <Icon name="check" size={14} />}
                          {b.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="watch">
                {watching ? (
                  <>
                    <p role="status">
                      {watchNote === 'on'
                        ? t(
                            `C'est noté : à ta prochaine visite, tu verras les fuites françaises ajoutées depuis le ${formatLong(todayIso(), 'fr')}.`,
                            `Noted: on your next visit, you will see the French breaches added since ${formatLong(todayIso(), 'en')}.`,
                          )
                        : t(
                            'Tu vois les fuites françaises ajoutées depuis ta dernière visite.',
                            'You see the French breaches added since your last visit.',
                          )}
                    </p>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={stopWatching}>
                      {t('Ne plus me les signaler', 'Stop showing them to me')}
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      {t(
                        "À ta prochaine visite, veux-tu voir les fuites françaises ajoutées d'ici là ? ShredRGPD garde alors la date du jour dans ton navigateur, rien d'autre, et ne l'envoie nulle part.",
                        'On your next visit, do you want to see the French breaches added in the meantime? ShredRGPD then keeps today’s date in your browser, nothing else, and sends it nowhere.',
                      )}
                    </p>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={startWatching}>
                      <Icon name="bell" size={16} />
                      {t('Me signaler les nouvelles fuites', 'Show me new breaches')}
                    </button>
                    {watchNote === 'refused' && (
                      <p className="watch__error" role="status">
                        {t(
                          "Ton navigateur refuse l'enregistrement (navigation privée ?) : rien n'a été gardé.",
                          'Your browser refuses storage (private browsing?): nothing was kept.',
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="field">
                <label htmlFor={`${id}-q`}>
                  {mode === 'message'
                    ? t("Nom de l'entreprise ou du site", 'Company or website name')
                    : t('Nom de la fuite ou du site', 'Breach or website name')}
                </label>
                <input
                  id={`${id}-q`}
                  className="input"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setExpanded(false);
                  }}
                  placeholder={
                    mode === 'message'
                      ? t('Ex. le nom cité dans le message reçu', 'E.g. the name in the message you received')
                      : t('Ex. le nom affiché par Have I Been Pwned', 'E.g. the name shown by Have I Been Pwned')
                  }
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <p className="hint" aria-live="polite">
                {query
                  ? t(
                      `${results.length} résultat${results.length > 1 ? 's' : ''}`,
                      `${results.length} result${results.length !== 1 ? 's' : ''}`,
                    )
                  : showFrench
                    ? t(
                        'Les fuites récentes en France. Cherche ci-dessus pour voir toutes les autres, y compris les services étrangers.',
                        'Recent breaches in France. Search above to see all the others, including services based abroad.',
                      )
                    : t('Les fuites les plus récentes :', 'The most recent breaches:')}
              </p>
              <ul className="breach-list">
                {(expanded ? results : results.slice(0, FIRST_ROWS)).map((b) => (
                  <BreachRow
                    key={b.name}
                    breach={b}
                    selected={selected.includes(b.name)}
                    onToggle={() => toggle(b.name)}
                  />
                ))}
              </ul>
              {!expanded && results.length > FIRST_ROWS && (
                <button type="button" className="btn btn--sm breach-list__more" onClick={() => setExpanded(true)}>
                  <Icon name="plus" size={16} />
                  {t(
                    `Afficher ${results.length - FIRST_ROWS} fuite${results.length - FIRST_ROWS > 1 ? 's' : ''} de plus`,
                    `Show ${results.length - FIRST_ROWS} more breach${results.length - FIRST_ROWS > 1 ? 'es' : ''}`,
                  )}
                </button>
              )}
              {mode === 'message' && (
                <p className="hint verify__credit">
                  {t("L'entreprise n'est pas dans la liste ? ", 'The company is not in the list? ')}
                  <a href={link('/lettre', { contexte: 'violation' })}>
                    {t('Écris-lui directement', 'Write to it directly')}
                  </a>
                  {t(
                    " : la lettre s'adapte à une fuite subie par l'entreprise.",
                    ': the letter adapts to a breach suffered by the company.',
                  )}
                </p>
              )}
              <p className="hint verify__credit">
                {t('Liste des fuites : ', 'List of breaches: ')}
                <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>
                {t(', sous licence ', ', under the ')}
                <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
                {t('', ' licence')}
                {catalog.fetchedOn &&
                  t(
                    `, mise à jour le ${formatLong(catalog.fetchedOn, 'fr')}`,
                    `, updated on ${formatLong(catalog.fetchedOn, 'en')}`,
                  )}
                {t(
                  '. Ce sont des informations publiques sur les fuites, pas les données fuitées. ',
                  '. This is public information about the breaches, not the breached data. ',
                )}
                {logoNotice(lang)}
              </p>
            </>
          )}

          <div className="wizard__nav">
            {chosen.length === 0 && catalog && catalog.breaches.length > 0 && (
              <p className="hint">
                {t('Coche au moins une fuite pour voir quoi faire.', 'Tick at least one breach to see what to do.')}
              </p>
            )}
            <div className="btn-row">
              {pickStep > 1 && (
                <button type="button" className="btn" onClick={() => goTo(pickStep - 1)}>
                  {t('Retour', 'Back')}
                </button>
              )}
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => goTo(last)}
                disabled={chosen.length === 0}
              >
                {t('Voir quoi faire', 'See what to do')}
                {chosen.length > 0 &&
                  t(
                    ` (${chosen.length} fuite${chosen.length > 1 ? 's' : ''})`,
                    ` (${chosen.length} breach${chosen.length > 1 ? 'es' : ''})`,
                  )}
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === last && (
        <section className="card" aria-labelledby={`${id}-s3`}>
          <h2 className="card__title" id={`${id}-s3`} {...titleProps}>
            <span className="card__num">{last}</span>
            {t('Ce qui a fuité, et quoi faire', 'What leaked, and what to do')}
          </h2>
          {chosen.length === 0 ? (
            <p className="muted">{t("Aucune fuite cochée pour l'instant.", 'No breach ticked yet.')}</p>
          ) : (
            <>
              <div className="chips verify__exposed">
                {exposed.map((dc) => (
                  <span key={dc} className={`chip${RISKY.has(dc) ? ' chip--danger' : ''}`}>
                    {dataClassLabel(dc, lang)}
                  </span>
                ))}
              </div>

              {passwordsLeaked && (
                <div className="callout callout--danger">
                  <span className="callout__icon" aria-hidden="true">
                    <Icon name="lock" />
                  </span>
                  <div>
                    <strong>
                      {t('Des mots de passe font partie de ces fuites.', 'Passwords are part of these breaches.')}
                    </strong>
                    <p>
                      {t(
                        'Teste ceux que tu utilises encore, sans les confier à personne, et change ceux qui sont connus.',
                        'Test the ones you still use, without handing them to anyone, and change the ones that are known.',
                      )}
                    </p>
                    <a className="btn btn--primary btn--sm" href={link('/verifier', { parcours: 'mot-de-passe' })}>
                      {t('Tester mes mots de passe', 'Test my passwords')}
                      <Icon name="arrow" size={16} />
                    </a>
                  </div>
                </div>
              )}

              <ActionPlan dataClasses={exposed} />

              <ul className="letter-targets">
                {chosen.map((b) => (
                  <li key={b.name}>
                    <div>
                      <strong>{b.title}</strong>
                      <span className="hint">
                        {t(`Fuite du ${formatLong(b.date, 'fr')}`, `Breach of ${formatLong(b.date, 'en')}`)}
                        {breachPaths.has(b.name) && (
                          <>
                            {' · '}
                            <a href={localize(breachPaths.get(b.name)!)}>
                              {t('Tout savoir sur cette fuite', 'All about this breach')}
                            </a>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="btn-row">
                      <a
                        className="btn btn--primary btn--sm"
                        href={link('/lettre', breachLetterQuery(b, 'acces', lang))}
                      >
                        {t('Demander ce qui a fuité', 'Ask what leaked')}
                      </a>
                      <a className="btn btn--sm" href={link('/lettre', breachLetterQuery(b, 'effacement', lang))}>
                        {t("Demander l'effacement", 'Request erasure')}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="hint">
                {t(
                  "« Demander ce qui a fuité » s'appuie sur les articles 15 et 34 du RGPD : l'entreprise doit te dire quelles données te concernent et ce qu'elle a fait. Les lettres sont des modèles indicatifs.",
                  '“Ask what leaked” relies on Articles 15 and 34 of the GDPR: the company must tell you which data concern you and what it has done. The letters are indicative templates.',
                )}
              </p>
              {chosen.length > 1 && <BatchLetters breaches={chosen} />}
            </>
          )}
          <div className="wizard__nav">
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => goTo(pickStep)}>
                {t('Retour aux fuites', 'Back to the breaches')}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** Parcours « mot de passe » : fonctionnement visible, test, générateur et bons réflexes. */
function PasswordFlow() {
  const { t, link } = useI18n();
  return (
    <div className="password-flow">
      <section className="card" aria-labelledby="mdp-comment">
        <h2 className="card__title" id="mdp-comment">
          <span className="card__num">
            <Icon name="shield" size={14} />
          </span>
          {t('Ton mot de passe ne quitte jamais ton appareil', 'Your password never leaves your device')}
        </h2>
        <ol className="how-pw">
          <li>
            <span className="how-pw__icon" aria-hidden="true">
              <Icon name="lock" />
            </span>
            <strong>{t('Empreinte calculée ici', 'Hash computed here')}</strong>
            <span>
              {t(
                'Ton navigateur transforme le mot de passe en empreinte SHA-1.',
                'Your browser turns the password into a SHA-1 hash.',
              )}
            </span>
          </li>
          <li>
            <span className="how-pw__icon" aria-hidden="true">
              <Icon name="send" />
            </span>
            <strong>{t('5 caractères envoyés', '5 characters sent')}</strong>
            <span>
              {t(
                "Seul le début de l'empreinte part vers Pwned Passwords, jamais le mot de passe.",
                'Only the start of the hash goes to Pwned Passwords, never the password.',
              )}
            </span>
          </li>
          <li>
            <span className="how-pw__icon" aria-hidden="true">
              <Icon name="check" />
            </span>
            <strong>{t('Comparaison chez toi', 'Compared on your device')}</strong>
            <span>
              {t(
                "Le service renvoie des centaines d'empreintes ; ShredRGPD cherche la tienne dans ton navigateur.",
                'The service returns hundreds of hashes; ShredRGPD looks for yours in your browser.',
              )}
            </span>
          </li>
        </ol>
      </section>

      <div className="password-flow__tools">
        <PasswordCheck />
        <PasswordGenerator />
      </div>

      <section className="card" aria-labelledby="mdp-reflexes">
        <h2 className="card__title" id="mdp-reflexes">
          <span className="card__num">
            <Icon name="check" size={14} />
          </span>
          {t('Les bons réflexes', 'Good habits')}
        </h2>
        <ul className="checklist">
          <li>
            <Icon name="check" size={18} />
            {t(
              'Un mot de passe apparaît dans une fuite ? Change-le partout où il sert, en commençant par ta messagerie.',
              'A password appears in a breach? Change it everywhere it is used, starting with your email account.',
            )}
          </li>
          <li>
            <Icon name="check" size={18} />
            {t(
              'Un mot de passe différent par site : un gestionnaire de mots de passe les retient pour toi.',
              'A different password for each website: a password manager remembers them for you.',
            )}
          </li>
          <li>
            <Icon name="check" size={18} />
            {t(
              'Active la double authentification sur ta messagerie, ta banque et tes réseaux sociaux.',
              'Turn on two-factor authentication for your email, your bank and your social networks.',
            )}
          </li>
        </ul>
        <p className="hint">
          {t(
            'Tu veux savoir quels sites ont laissé fuiter tes données ? ',
            'Want to know which websites leaked your data? ',
          )}
          <a href={link('/verifier')}>{t('Vérifie ton adresse e-mail', 'Check your email address')}</a>.
        </p>
      </section>
    </div>
  );
}

export function Verify() {
  const id = useId();
  const { t, lang, link } = useI18n();
  const route = useRoute();
  const situation = asSituation(route.query.get('parcours'));
  const setSituation = (value: Situation) =>
    navigate(link('/verifier', value === 'verifier' ? undefined : { parcours: value }), { replace: true });
  const [catalog, setCatalog] = useState<BreachCatalog | null>(null);

  useEffect(() => {
    let active = true;
    loadBreachCatalog().then((c) => {
      if (active) setCatalog(c);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHead
        eyebrow={t('Vérifier', 'Check')}
        command={{
          input: t('shredrgpd verifier --email ••••••', 'shredrgpd check --email ••••••'),
          output: t('aucune donnée envoyée à ShredRGPD', 'no data sent to ShredRGPD'),
        }}
        title={t("Qu'est-ce qui a fuité ?", 'What leaked?')}
      >
        {t(
          "Vérifie ton adresse e-mail ou un mot de passe, vois quelles données sont exposées, puis écris à l'entreprise en un clic. Rien de ce que tu vérifies ne passe par ShredRGPD.",
          'Check your email address or a password, see which data were exposed, then write to the company in one click. Nothing you check goes through ShredRGPD.',
        )}
      </PageHead>

      <div className="container page-body verify-page">
        <fieldset className="situation">
          <legend className="situation__legend">{t('Que veux-tu vérifier ?', 'What do you want to check?')}</legend>
          <div className="choices">
            {SITUATIONS.map((s) => (
              <label key={s.value} className="choice">
                <input
                  type="radio"
                  name={`${id}-situation`}
                  value={s.value}
                  checked={situation === s.value}
                  onChange={() => setSituation(s.value)}
                />
                <span className="choice__icon" aria-hidden="true">
                  <Icon name={s.icon} />
                </span>
                <strong>{s[lang][0]}</strong>
                <span className="choice__hint">{s[lang][1]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {situation === 'mot-de-passe' && <PasswordFlow />}

        {(situation === 'verifier' || situation === 'message') && (
          <BreachFlow key={situation} mode={situation} catalog={catalog} />
        )}

        {situation === 'publie' && (
          <section className="card" aria-labelledby={`${id}-pub`}>
            <h2 className="card__title" id={`${id}-pub`}>
              <span className="card__num">1</span>
              {t('Fais retirer les données publiées', 'Get the published data removed')}
            </h2>
            <p className="muted">
              {t(
                "Écris d'abord au site qui publie tes données pour demander leur effacement. S'il ne répond pas ou reste introuvable, signale la page à son hébergeur : il doit agir sur un signalement précis.",
                'First write to the website that publishes your data to request their erasure. If it does not reply or cannot be found, report the page to its hosting provider: it must act on a precise notice.',
              )}
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href={link('/lettre', { type: 'effacement', contexte: 'exposition' })}>
                {t('Écrire au site', 'Write to the website')}
              </a>
              <a className="btn" href={link('/lettre', { type: 'signalement' })}>
                {t("Signaler à l'hébergeur", 'Report to the hosting provider')}
              </a>
            </div>
            <p className="hint verify__credit">
              {t(
                "Garde des preuves avant tout : captures d'écran datées et adresse exacte des pages. Les démarches selon la donnée exposée sont sur la page ",
                'Keep evidence first: dated screenshots and the exact address of the pages. The steps for each type of exposed data are on the page ',
              )}
              <a href={link('/que-faire')}>{t('Que faire ?', 'What to do?')}</a>
            </p>
          </section>
        )}
      </div>
    </>
  );
}
