import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { copyText, downloadText } from '../browser';
import { ShredBurst } from '../components/ShredBurst';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { LetterLanguage } from '../components/LetterLanguage';
import { useI18n } from '../i18n';
import { translateDataList } from '../lib/breaches';
import { formatLong, gdprDeadlines, isValidIsoDate, todayIso, type IsoDate } from '../lib/dates';
import type { Lang } from '../lib/lang';
import {
  CONTEXT_LABELS,
  CONTEXT_LABELS_EN,
  DATA_CATEGORIES,
  dataCategoryLabel,
  generateLetter,
  INITIAL_KINDS,
  isInitialKind,
  kindLabel,
  LetterInputError,
  letterToText,
  mailtoHref,
  subjectLabel,
  type DataCategory,
  type InitialKind,
  type Letter,
  type LetterContext,
  type ReportTarget,
  type LetterKind,
} from '../lib/letters';
import { CLOUDFLARE_ABUSE_URL, extractDomain, icannLookupUrl } from '../lib/domain';
import { parseCategories } from '../lib/letterLink';
import { slugify } from '../lib/slug';
import { newId, withLetter, type TrackedRequest } from '../lib/tracking';
import type { Route } from '../router';
import { useTracking } from '../useTracking';

interface FormState {
  kind: LetterKind;
  fullName: string;
  email: string;
  postalAddress: string;
  siteName: string;
  contact: string;
  urls: string;
  dataCategories: DataCategory[];
  otherData: string;
  date: IsoDate;
  previousRequestDate: IsoDate;
  previousKind: InitialKind;
  context: LetterContext;
  breachName: string;
  breachDate: IsoDate;
  reportTarget: ReportTarget;
}

const KIND_OPTIONS: { value: LetterKind; fr: [string, string]; en: [string, string] }[] = [
  { value: 'effacement', fr: ['Effacement', 'Article 17'], en: ['Erasure', 'Article 17'] },
  { value: 'acces', fr: ['Accès', 'Article 15'], en: ['Access', 'Article 15'] },
  { value: 'opposition', fr: ['Opposition', 'Prospection, art. 21'], en: ['Objection', 'Marketing, art. 21'] },
  { value: 'fermeture', fr: ['Fermer un compte', 'Article 17'], en: ['Close an account', 'Article 17'] },
  { value: 'relance', fr: ['Relance', 'Après un mois'], en: ['Reminder', 'After one month'] },
  { value: 'signalement', fr: ['Signalement', 'Hébergeur, registrar'], en: ['Notice', 'Host, registrar'] },
];

const TARGET_OPTIONS: { value: ReportTarget; fr: string; en: string }[] = [
  { value: 'hebergeur', fr: "L'hébergeur du site", en: 'The website’s hosting provider' },
  { value: 'registrar', fr: 'Le registrar du nom de domaine', en: 'The domain name registrar' },
  { value: 'cloudflare', fr: 'Cloudflare', en: 'Cloudflare' },
];

/** Repère d'article affiché en puce : « 6 RGPD » devient « 6 GDPR » pour une lettre en anglais. */
function articleChip(article: string, lang: Lang): string {
  return lang === 'en' ? article.replace(' RGPD', ' GDPR') : article;
}

function asKind(value: string | null): LetterKind {
  if (isInitialKind(value) || value === 'relance' || value === 'signalement') return value;
  return 'effacement';
}

function initialState(route: Route): FormState {
  const q = route.query;
  const since = q.get('depuis') ?? '';
  const breachDate = q.get('date-fuite') ?? '';
  return {
    kind: asKind(q.get('type')),
    fullName: '',
    email: '',
    postalAddress: '',
    siteName: q.get('site') ?? '',
    contact: '',
    urls: '',
    dataCategories: parseCategories(q.get('donnees')),
    otherData: q.get('autres') ?? '',
    date: todayIso(),
    previousRequestDate: isValidIsoDate(since) ? since : '',
    previousKind: isInitialKind(q.get('premiere')) ? (q.get('premiere') as InitialKind) : 'effacement',
    context: q.get('contexte') === 'violation' ? 'violation' : 'exposition',
    breachName: q.get('fuite') ?? '',
    breachDate: isValidIsoDate(breachDate) ? breachDate : '',
    reportTarget:
      q.get('cible') === 'registrar' || q.get('cible') === 'cloudflare'
        ? (q.get('cible') as ReportTarget)
        : 'hebergeur',
  };
}

type Feedback = { tone: 'ok' | 'warn'; text: string } | null;

/** Étapes du formulaire, une à la fois. */
type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; label: string; en: string }[] = [
  { n: 1, label: 'Type de demande', en: 'Type of request' },
  { n: 2, label: 'Le site', en: 'The website' },
  { n: 3, label: 'Ce qui a fuité', en: 'What leaked' },
  { n: 4, label: 'Toi', en: 'You' },
  { n: 5, label: 'Ta lettre', en: 'Your letter' },
];

/**
 * Étape de départ : un lien pré-rempli (page de fuite, relance depuis le suivi)
 * a déjà le type et le site, on commence à « Toi » ; un type seul, au site.
 */
function firstStep(route: Route): Step {
  if (route.query.get('site')) return 4;
  if (route.query.get('type')) return 2;
  return 1;
}

export function Generator({ route }: { route: Route }) {
  const { t, lang, link } = useI18n();
  const [form, setForm] = useState<FormState>(() => initialState(route));
  /** Langue de la lettre, distincte de celle de la page (français par défaut). */
  const [letterLang, setLetterLang] = useState<Lang>('fr');
  const [step, setStep] = useState<Step>(() => firstStep(route));
  /** Étape la plus avancée atteinte : on peut revenir en arrière ou y retourner d'un clic. */
  const [reached, setReached] = useState<Step>(() => firstStep(route));
  const [stepError, setStepError] = useState<string[]>([]);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  /** Rejoue l'animation du broyeur à chaque copie ou téléchargement réussi. */
  const [burst, setBurst] = useState(0);
  const [keepCopy, setKeepCopy] = useState(false);
  const { requests, update, saveFailed } = useTracking();
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const trackedId = route.query.get('suivi');
  const tracked = trackedId ? requests.find((r) => r.id === trackedId) : undefined;

  const set =
    <K extends keyof FormState>(key: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: event.target.value as FormState[K] }));
      setFeedback(null);
    };

  const toggleCategory = (key: DataCategory) => {
    setForm((f) => ({
      ...f,
      dataCategories: f.dataCategories.includes(key)
        ? f.dataCategories.filter((k) => k !== key)
        : [...f.dataCategories, key],
    }));
    setFeedback(null);
  };

  const result = useMemo((): { letter: Letter | null; missing: string[] } => {
    const missing: string[] = [];
    if (!form.fullName.trim()) missing.push(t('ton nom', 'your name'));
    if (!form.siteName.trim())
      missing.push(
        form.context === 'violation' && form.kind !== 'signalement'
          ? t("le nom de l'entreprise", 'the company name')
          : t('le site concerné', 'the website concerned'),
      );
    if (form.kind === 'relance' && !isValidIsoDate(form.previousRequestDate))
      missing.push(t('la date de ta première demande', 'the date of your first request'));
    if (!isValidIsoDate(form.date)) missing.push(t('la date de la lettre', 'the date of the letter'));
    if (form.kind === 'signalement') {
      if (!form.urls.split('\n').some((u) => u.trim()))
        missing.push(t("l'adresse d'au moins une page", 'the address of at least one page'));
      if (!form.email.trim()) missing.push(t('ton adresse e-mail', 'your email address'));
    }
    if (missing.length > 0) return { letter: null, missing };
    try {
      const letter = generateLetter(
        {
          kind: form.kind,
          fullName: form.fullName,
          email: form.email,
          postalAddress: form.postalAddress,
          siteName: form.kind === 'signalement' ? (extractDomain(form.siteName) ?? form.siteName) : form.siteName,
          urls: form.urls.split('\n'),
          dataCategories: form.dataCategories,
          // Les types de données repris d'une fuite suivent la langue de la lettre ; le reste est gardé tel quel.
          otherData: translateDataList(form.otherData, letterLang),
          date: form.date,
          previousRequestDate: form.kind === 'relance' ? form.previousRequestDate : undefined,
          previousKind: form.kind === 'relance' ? form.previousKind : undefined,
          context: form.kind === 'signalement' ? 'exposition' : form.context,
          reportTarget: form.reportTarget,
          breachName: form.context === 'violation' && form.kind !== 'signalement' ? form.breachName : undefined,
          breachDate: form.context === 'violation' && isValidIsoDate(form.breachDate) ? form.breachDate : undefined,
        },
        letterLang,
      );
      return { letter, missing };
    } catch (error) {
      if (error instanceof LetterInputError) return { letter: null, missing: [error.message] };
      throw error;
    }
    // t ne dépend que de la langue de la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, letterLang, lang]);

  const { letter } = result;
  const relanceTooEarly =
    form.kind === 'relance' &&
    isValidIsoDate(form.previousRequestDate) &&
    isValidIsoDate(form.date) &&
    form.date <= gdprDeadlines(form.previousRequestDate).standard;

  const onCopy = async () => {
    if (!letter) return;
    const ok = await copyText(letterToText(letter));
    if (ok) setBurst((n) => n + 1);
    setFeedback(
      ok
        ? {
            tone: 'ok',
            text: t(
              'Lettre copiée. Colle-la dans ton e-mail ou dans le formulaire du site.',
              'Letter copied. Paste it into your email or into the website’s form.',
            ),
          }
        : {
            tone: 'warn',
            text: t(
              'La copie a échoué. Sélectionne le texte de la lettre à la main.',
              'Copying failed. Select the text of the letter by hand.',
            ),
          },
    );
  };

  const onDownload = () => {
    if (!letter) return;
    downloadText(`shred-${form.kind}-${slugify(form.siteName)}.txt`, letterToText(letter));
    setBurst((n) => n + 1);
  };

  const onTrack = () => {
    if (!letter) return;
    const copy = { date: form.date, subject: letter.subject, body: letter.body };
    if (form.kind === 'relance') {
      if (!tracked) return;
      update((list) =>
        list.map((r) =>
          r.id === tracked.id ? { ...(keepCopy ? withLetter(r, copy) : r), status: 'relancee' as const } : r,
        ),
      );
      setFeedback({
        tone: 'ok',
        text: t(
          'La demande est marquée comme relancée dans ton suivi.',
          'The request is marked as followed up in your tracker.',
        ),
      });
      return;
    }
    const request: TrackedRequest = {
      id: newId(),
      site: form.siteName.trim(),
      kind: form.kind as InitialKind,
      channel: 'email',
      sentOn: form.date,
      status: 'envoyee',
      notes: '',
      context: form.context,
    };
    update((list) => [...list, keepCopy ? withLetter(request, copy) : request]);
    setFeedback({
      tone: 'ok',
      text: t(
        `Ajoutée au suivi. Échéance de réponse : ${formatLong(gdprDeadlines(form.date).standard, 'fr')}.`,
        `Added to the tracker. Reply deadline: ${formatLong(gdprDeadlines(form.date).standard, 'en')}.`,
      ),
    });
  };

  const canTrack = form.kind === 'relance' ? Boolean(tracked) : form.kind !== 'signalement';
  const isReport = form.kind === 'signalement';
  const violation = form.context === 'violation' && !isReport;

  /** Ce qu'il manque pour quitter une étape (mêmes règles que la lettre). */
  const missingAt = (n: Step): string[] => {
    const missing: string[] = [];
    if (n === 1 && form.kind === 'relance' && !isValidIsoDate(form.previousRequestDate))
      missing.push(t('la date de ta première demande', 'the date of your first request'));
    if (n === 2 && !form.siteName.trim())
      missing.push(
        violation ? t("le nom de l'entreprise", 'the company name') : t('le site concerné', 'the website concerned'),
      );
    if (n === 3 && isReport && !form.urls.split('\n').some((u) => u.trim()))
      missing.push(t("l'adresse d'au moins une page", 'the address of at least one page'));
    if (n === 4) {
      if (!form.fullName.trim()) missing.push(t('ton nom', 'your name'));
      if (isReport && !form.email.trim()) missing.push(t('ton adresse e-mail', 'your email address'));
      if (!isValidIsoDate(form.date)) missing.push(t('la date de la lettre', 'the date of the letter'));
    }
    return missing;
  };

  const goTo = (n: Step) => {
    setStepError([]);
    setStep(n);
    setReached((r) => (n > r ? n : r));
  };

  const next = () => {
    const missing = missingAt(step);
    if (missing.length > 0) {
      setStepError(missing);
      return;
    }
    if (step < 5) goTo((step + 1) as Step);
  };

  // Changement d'étape : focus sur son titre (lecteurs d'écran) et retour en haut du formulaire.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeading.current?.focus({ preventScroll: true });
    document.getElementById(fieldId('wizard'))?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stepNav = (
    <div className="wizard__nav">
      {stepError.length > 0 && (
        <p className="wizard__error" role="alert">
          {t('Pour continuer, indique ', 'To continue, enter ')}
          {stepError.join(', ')}.
        </p>
      )}
      <div className="btn-row">
        {step > 1 && (
          <button type="button" className="btn" onClick={() => goTo((step - 1) as Step)}>
            {t('Retour', 'Back')}
          </button>
        )}
        {step < 5 && (
          <button type="submit" className="btn btn--primary">
            {step === 4 ? t('Voir ma lettre', 'See my letter') : t('Continuer', 'Continue')}
            <Icon name="arrow" size={18} />
          </button>
        )}
      </div>
    </div>
  );
  const domain = extractDomain(form.siteName);

  return (
    <>
      <PageHead
        eyebrow={t('Générateur', 'Generator')}
        command={{
          input: t('shredrgpd lettre --rgpd art.17', 'shredrgpd letter --gdpr art.17'),
          output: t("modèle prêt · rien n'est envoyé", 'template ready · nothing is sent'),
        }}
        title={t('Écris ta lettre', 'Write your letter')}
      >
        {t(
          "Cinq étapes courtes : le type de demande, le site, ce qui a fuité, toi, puis ta lettre prête à envoyer. Rien n'est envoyé, rien n'est enregistré tant que tu ne l'ajoutes pas au suivi.",
          'Five short steps: the type of request, the website, what leaked, you, then your letter ready to send, in English or French. Nothing is sent, nothing is stored unless you add it to the tracker.',
        )}
      </PageHead>

      <div className="container page-body">
        <div className="wizard" id={fieldId('wizard')}>
          <nav aria-label={t('Étapes de la lettre', 'Letter steps')}>
            <ol className="stepper">
              {STEPS.map((st) => (
                <li key={st.n} data-state={st.n === step ? 'current' : st.n <= reached ? 'done' : 'todo'}>
                  <button
                    type="button"
                    onClick={() => goTo(st.n)}
                    disabled={st.n > reached}
                    aria-current={st.n === step ? 'step' : undefined}
                  >
                    <span className="stepper__num" aria-hidden="true">
                      {st.n < step && st.n <= reached ? <Icon name="check" size={14} /> : st.n}
                    </span>
                    <span className="stepper__label">{t(st.label, st.en)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="stepper__compact" aria-hidden="true">
              {t(`Étape ${step} sur 5`, `Step ${step} of 5`)} · {t(STEPS[step - 1]!.label, STEPS[step - 1]!.en)}
            </p>
          </nav>

          {step < 5 && (
            <form
              className="generator__form"
              onSubmit={(event) => {
                event.preventDefault();
                next();
              }}
              noValidate
            >
              {step === 1 && (
                <section className="card" aria-labelledby={fieldId('t1')}>
                  <h2 className="card__title" id={fieldId('t1')} ref={stepHeading} tabIndex={-1}>
                    <span className="card__num">1</span>
                    {t('Quel type de demande ?', 'What type of request?')}
                  </h2>
                  <fieldset>
                    <legend className="visually-hidden">{t('Type de demande', 'Type of request')}</legend>
                    <div className="segmented">
                      {KIND_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name={fieldId('kind')}
                            value={option.value}
                            checked={form.kind === option.value}
                            onChange={set('kind')}
                          />
                          <strong>{option[lang][0]}</strong>
                          <span>{option[lang][1]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {(form.kind === 'effacement' || form.kind === 'fermeture') && (
                    <p className="hint">
                      {t(
                        "L'effacement n'est pas automatique : il faut l'un des motifs de l'article 17.1 (données plus nécessaires, consentement retiré, traitement illicite…). Selon ta situation, certaines données peuvent devoir être conservées pour respecter une obligation légale (article 17.3 b).",
                        'Erasure is not automatic: one of the grounds of Article 17(1) must apply (data no longer necessary, consent withdrawn, unlawful processing…). Depending on your situation, some data may have to be kept to comply with a legal obligation (Article 17(3)(b)).',
                      )}
                    </p>
                  )}

                  {form.kind === 'relance' && (
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor={fieldId('prevDate')}>
                          {t('Date de ta première demande', 'Date of your first request')}
                        </label>
                        <input
                          id={fieldId('prevDate')}
                          className="input"
                          type="date"
                          value={form.previousRequestDate}
                          onChange={set('previousRequestDate')}
                          max={form.date}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={fieldId('prevKind')}>
                          {t('Nature de la première demande', 'Type of the first request')}
                        </label>
                        <select
                          id={fieldId('prevKind')}
                          className="select"
                          value={form.previousKind}
                          onChange={set('previousKind')}
                        >
                          {(Object.keys(INITIAL_KINDS) as InitialKind[]).map((k) => (
                            <option key={k} value={k}>
                              {kindLabel(k, lang)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {step === 2 && (
                <section className="card" aria-labelledby={fieldId('t2')}>
                  <h2 className="card__title" id={fieldId('t2')} ref={stepHeading} tabIndex={-1}>
                    <span className="card__num">2</span>
                    {isReport
                      ? t('Le site et le destinataire', 'The website and the recipient')
                      : t('Le site ou l’entreprise', 'The website or the company')}
                  </h2>
                  {isReport ? (
                    <div className="field">
                      <label htmlFor={fieldId('target')}>
                        {t('Destinataire du signalement', 'Recipient of the notice')}
                      </label>
                      <select
                        id={fieldId('target')}
                        className="select"
                        value={form.reportTarget}
                        onChange={set('reportTarget')}
                      >
                        {TARGET_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(o.fr, o.en)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor={fieldId('context')}>{t('Situation', 'Situation')}</label>
                      <select id={fieldId('context')} className="select" value={form.context} onChange={set('context')}>
                        {(Object.keys(CONTEXT_LABELS) as LetterContext[]).map((c) => (
                          <option key={c} value={c}>
                            {(lang === 'en' ? CONTEXT_LABELS_EN : CONTEXT_LABELS)[c].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="field">
                    <label htmlFor={fieldId('site')}>
                      {violation
                        ? t("Nom de l'entreprise", 'Company name')
                        : t('Nom ou adresse du site', 'Website name or address')}
                    </label>
                    <input
                      id={fieldId('site')}
                      className="input"
                      value={form.siteName}
                      onChange={set('siteName')}
                      placeholder={t('exemple.com', 'example.com')}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {violation && (
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor={fieldId('breachName')}>
                          {t('Nom de la fuite', 'Breach name')}{' '}
                          <span className="optional">{t('(facultatif)', '(optional)')}</span>
                        </label>
                        <input
                          id={fieldId('breachName')}
                          className="input"
                          value={form.breachName}
                          onChange={set('breachName')}
                          autoComplete="off"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={fieldId('breachDate')}>
                          {t('Date de la fuite', 'Breach date')}{' '}
                          <span className="optional">{t('(facultatif)', '(optional)')}</span>
                        </label>
                        <input
                          id={fieldId('breachDate')}
                          className="input"
                          type="date"
                          value={form.breachDate}
                          onChange={set('breachDate')}
                        />
                      </div>
                    </div>
                  )}
                  <div className="field">
                    <label htmlFor={fieldId('contact')}>
                      {isReport
                        ? t("E-mail d'abus du destinataire", 'Abuse email of the recipient')
                        : t('E-mail du DPO ou du responsable', 'Email of the DPO or the controller')}{' '}
                      <span className="optional">{t('(facultatif)', '(optional)')}</span>
                    </label>
                    <input
                      id={fieldId('contact')}
                      className="input"
                      type="email"
                      value={form.contact}
                      onChange={set('contact')}
                      placeholder={t('dpo@exemple.com', 'dpo@example.com')}
                      autoComplete="off"
                      spellCheck={false}
                      aria-describedby={fieldId('contactHint')}
                    />
                    <p className="hint" id={fieldId('contactHint')}>
                      {isReport
                        ? t(
                            'Souvent de la forme abuse@… Il sert seulement à préremplir ton e-mail.',
                            'Often of the form abuse@… It is only used to pre-fill your email.',
                          )
                        : t(
                            'Cherche-le dans les mentions légales ou la politique de confidentialité du site. Il sert seulement à préremplir ton e-mail.',
                            'Look for it in the website’s legal notice or privacy policy. It is only used to pre-fill your email.',
                          )}
                    </p>
                  </div>
                  {!violation && (
                    <div className="finder">
                      <p className="finder__title">
                        <Icon name="search" size={16} />
                        {t('Trouver le bon contact', 'Find the right contact')}
                      </p>
                      <ul>
                        {!isReport && (
                          <li>
                            {t(
                              'Le responsable du site : ses mentions légales ou sa politique de confidentialité (lien en bas de page, souvent).',
                              'The website’s controller: its legal notice or privacy policy (often linked at the bottom of the page).',
                            )}
                          </li>
                        )}
                        <li>
                          {t("Le registrar et son e-mail d'abus : ", 'The registrar and its abuse email: ')}
                          {domain ? (
                            <ExternalLink href={icannLookupUrl(domain)}>
                              {t(`recherche ICANN pour ${domain}`, `ICANN lookup for ${domain}`)}
                            </ExternalLink>
                          ) : (
                            <ExternalLink href="https://lookup.icann.org/">
                              {t('recherche ICANN', 'ICANN lookup')}
                            </ExternalLink>
                          )}
                          {t(
                            ', rubrique « Registrar » puis « Abuse contact ».',
                            ', section “Registrar” then “Abuse contact”.',
                          )}
                        </li>
                        <li>
                          {t(
                            'Le site passe par Cloudflare (serveurs de noms en *.ns.cloudflare.com) ? Utilise leur ',
                            'The website uses Cloudflare (name servers in *.ns.cloudflare.com)? Use their ',
                          )}
                          <ExternalLink href={CLOUDFLARE_ABUSE_URL}>
                            {t("formulaire d'abus", 'abuse form')}
                          </ExternalLink>
                          {t(" : il transmet à l'hébergeur réel.", ': it forwards to the real hosting provider.')}
                        </li>
                        {!isReport && (
                          <li>
                            {t(
                              "Personne ne répond ou le site est anonyme ? Choisis « Signalement » pour écrire à l'hébergeur ou au registrar.",
                              'Nobody replies or the website is anonymous? Choose “Notice” to write to the hosting provider or the registrar.',
                            )}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {step === 3 && (
                <section className="card" aria-labelledby={fieldId('t3data')}>
                  <h2 className="card__title" id={fieldId('t3data')} ref={stepHeading} tabIndex={-1}>
                    <span className="card__num">3</span>
                    {t('Ce qui a fuité', 'What leaked')}
                  </h2>
                  <div className="field">
                    <label htmlFor={fieldId('urls')}>
                      {t('Pages où tes données apparaissent', 'Pages where your data appear')}{' '}
                      <span className="optional">
                        {isReport
                          ? t('(une par ligne)', '(one per line)')
                          : t('(facultatif, une par ligne)', '(optional, one per line)')}
                      </span>
                    </label>
                    <textarea
                      id={fieldId('urls')}
                      className="textarea"
                      value={form.urls}
                      onChange={set('urls')}
                      placeholder={t('https://exemple.com/page', 'https://example.com/page')}
                      spellCheck={false}
                    />
                  </div>
                  <fieldset>
                    <legend className="legend">{t('Données exposées', 'Exposed data')}</legend>
                    <div className="checks">
                      {(Object.keys(DATA_CATEGORIES) as DataCategory[]).map((key) => (
                        <label className="check" key={key}>
                          <input
                            type="checkbox"
                            checked={form.dataCategories.includes(key)}
                            onChange={() => toggleCategory(key)}
                          />
                          <span>
                            {dataCategoryLabel(key, lang).charAt(0).toUpperCase() +
                              dataCategoryLabel(key, lang).slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label htmlFor={fieldId('other')}>
                      {t('Autres données', 'Other data')}{' '}
                      <span className="optional">{t('(facultatif)', '(optional)')}</span>
                    </label>
                    <input id={fieldId('other')} className="input" value={form.otherData} onChange={set('otherData')} />
                  </div>
                </section>
              )}

              {step === 4 && (
                <>
                  <section className="card" aria-labelledby={fieldId('t3')}>
                    <h2 className="card__title" id={fieldId('t3')} ref={stepHeading} tabIndex={-1}>
                      <span className="card__num">4</span>
                      {t('Toi', 'You')}
                    </h2>
                    <div className="field">
                      <label htmlFor={fieldId('name')}>{t('Ton nom complet', 'Your full name')}</label>
                      <input
                        id={fieldId('name')}
                        className="input"
                        value={form.fullName}
                        onChange={set('fullName')}
                        autoComplete="name"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={fieldId('email')}>
                        {isReport ? (
                          t('Ton adresse e-mail', 'Your email address')
                        ) : (
                          <>
                            {t('E-mail concerné par la fuite', 'Email address in the breach')}{' '}
                            <span className="optional">{t('(facultatif)', '(optional)')}</span>
                          </>
                        )}
                      </label>
                      <input
                        id={fieldId('email')}
                        className="input"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        autoComplete="email"
                        spellCheck={false}
                        aria-describedby={fieldId('emailHint')}
                      />
                      <p className="hint" id={fieldId('emailHint')}>
                        {isReport
                          ? t(
                              'Obligatoire dans un signalement (article 16 du DSA) : le destinataire doit pouvoir te répondre.',
                              'Required in a notice (Article 16 DSA): the recipient must be able to reply to you.',
                            )
                          : t(
                              "Aide le site à retrouver tes données. N'ajoute pas de mot de passe.",
                              'Helps the company find your data. Do not add a password.',
                            )}
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor={fieldId('address')}>
                        {t('Adresse postale', 'Postal address')}{' '}
                        <span className="optional">
                          {t('(facultatif, utile pour un courrier)', '(optional, useful for a paper letter)')}
                        </span>
                      </label>
                      <textarea
                        id={fieldId('address')}
                        className="textarea"
                        value={form.postalAddress}
                        onChange={set('postalAddress')}
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={fieldId('date')}>{t('Date de la lettre', 'Date of the letter')}</label>
                      <input
                        id={fieldId('date')}
                        className="input"
                        type="date"
                        value={form.date}
                        onChange={set('date')}
                      />
                    </div>
                  </section>

                  <Notice>
                    <p>
                      {t(
                        'Ces champs restent dans cet onglet. Ton nom, ton e-mail et ton adresse ne sont jamais enregistrés, même dans le suivi.',
                        'These fields stay in this tab. Your name, email and address are never stored, not even in the tracker.',
                      )}
                    </p>
                  </Notice>
                </>
              )}

              {stepNav}
            </form>
          )}

          {step === 5 && (
            <section className="generator__preview" aria-labelledby={fieldId('preview')}>
              <div className="preview-window">
                <div className="preview-bar">
                  <h2 id={fieldId('preview')} ref={stepHeading} tabIndex={-1}>
                    {t('Ta lettre', 'Your letter')}
                  </h2>
                  {letter && (
                    <ul className="chips" aria-label={t('Articles du RGPD cités', 'GDPR articles cited')}>
                      {letter.articles.map((article) => (
                        <li className="chip" key={article}>
                          Art. {articleChip(article, letter.lang)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="preview-lang">
                  <LetterLanguage value={letterLang} onChange={setLetterLang} />
                </div>

                <div className="paper-wrap">
                  <article
                    className="paper"
                    aria-live="polite"
                    aria-atomic="false"
                    aria-label={t('Texte de la lettre', 'Text of the letter')}
                    lang={letterLang}
                    tabIndex={0}
                  >
                    {letter ? (
                      <>
                        <p className="paper__subject">
                          {subjectLabel(letter.lang)}
                          {letter.subject}
                        </p>
                        <pre className="paper__body">{letter.body}</pre>
                      </>
                    ) : (
                      <div className="paper__empty" lang={lang}>
                        <div className="bits-art" aria-hidden="true">
                          {'01001100 01100101 01110100\n01110100 01110010 01100101\n00100000 01110000 01110010'}
                        </div>
                        <p>
                          {t('Pour afficher ta lettre, indique ', 'To show your letter, enter ')}
                          {result.missing.join(', ')}.
                        </p>
                        <button type="button" className="btn btn--sm" onClick={() => goTo(1)}>
                          {t('Reprendre les étapes', 'Go back through the steps')}
                        </button>
                      </div>
                    )}
                  </article>
                  {burst > 0 && <ShredBurst key={burst} />}
                </div>

                <div className="preview-actions">
                  {relanceTooEarly && (
                    <Notice tone="warn">
                      <p>
                        {t(
                          `Le délai d'un mois court jusqu'au ${formatLong(gdprDeadlines(form.previousRequestDate).standard, 'fr')} environ. Une relance avant cette date reste possible, mais elle a moins de poids.`,
                          `The one-month period runs until about ${formatLong(gdprDeadlines(form.previousRequestDate).standard, 'en')}. A reminder before that date is still possible, but it carries less weight.`,
                        )}
                      </p>
                    </Notice>
                  )}

                  <div className="btn-row">
                    <button type="button" className="btn btn--primary" onClick={onCopy} disabled={!letter}>
                      <Icon name="copy" size={18} />
                      {t('Copier', 'Copy')}
                    </button>
                    {letter ? (
                      <a className="btn" href={mailtoHref(letter, form.contact)}>
                        <Icon name="mail" size={18} />
                        {t('Ouvrir dans ma messagerie', 'Open in my email app')}
                      </a>
                    ) : (
                      <button type="button" className="btn" disabled>
                        <Icon name="mail" size={18} />
                        {t('Ouvrir dans ma messagerie', 'Open in my email app')}
                      </button>
                    )}
                    <button type="button" className="btn" onClick={onDownload} disabled={!letter}>
                      <Icon name="download" size={18} />
                      {t('Télécharger', 'Download')}
                    </button>
                    <button type="button" className="btn" onClick={() => window.print()} disabled={!letter}>
                      <Icon name="printer" size={18} />
                      {t('Imprimer', 'Print')}
                    </button>
                  </div>

                  {canTrack && (
                    <label className="check small">
                      <input type="checkbox" checked={keepCopy} onChange={(e) => setKeepCopy(e.target.checked)} />
                      <span>
                        {t(
                          'Garder une copie de la lettre dans le suivi, pour un éventuel dossier CNIL (elle contient ton nom et reste dans ce navigateur)',
                          'Keep a copy of the letter in the tracker, for a possible complaint to the CNIL (it contains your name and stays in this browser)',
                        )}
                      </span>
                    </label>
                  )}
                  <div className="btn-row">
                    <button type="button" className="btn btn--ghost" onClick={onTrack} disabled={!letter || !canTrack}>
                      <Icon name="plus" size={18} />
                      {form.kind === 'relance'
                        ? t('Marquer comme relancée dans le suivi', 'Mark as followed up in the tracker')
                        : t('Ajouter au suivi', 'Add to the tracker')}
                    </button>
                    <a className="btn btn--ghost" href={link('/suivi')}>
                      {t('Voir mon suivi', 'See my tracker')}
                    </a>
                  </div>

                  {form.kind === 'relance' && !tracked && (
                    <p className="small muted">
                      {t(
                        'Pour relier cette relance à ton suivi, lance-la depuis la page ',
                        'To link this reminder to your tracker, start it from the ',
                      )}
                      <a href={link('/suivi')}>{t('Suivi', 'Tracker')}</a>
                      {t('.', ' page.')}
                    </p>
                  )}

                  <div aria-live="polite">
                    {feedback && (
                      <Notice tone={feedback.tone}>
                        <p>{feedback.text}</p>
                      </Notice>
                    )}
                    {saveFailed && (
                      <Notice tone="warn">
                        <p>
                          {t(
                            "Ton navigateur refuse l'enregistrement local (navigation privée ?). Exporte ton suivi pour le garder.",
                            'Your browser refuses local storage (private browsing?). Export your tracker to keep it.',
                          )}
                        </p>
                      </Notice>
                    )}
                  </div>

                  <p className="small muted">
                    {t(
                      "Modèle indicatif, pas un conseil juridique. Relis la lettre avant de l'envoyer. Certains logiciels de messagerie coupent les textes longs : si c'est le cas, utilise « Copier ». Garde une preuve de l'envoi : le délai d'un mois court à partir de la réception.",
                      'Indicative template, not legal advice. Read the letter again before sending it. Some email apps cut long texts: if so, use “Copy”. Keep proof that you sent it: the one-month period runs from receipt.',
                    )}{' '}
                    <a href={link('/ressources')}>{t("Comment l'envoyer", 'How to send it')}</a>
                  </p>
                </div>
              </div>
              {stepNav}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
