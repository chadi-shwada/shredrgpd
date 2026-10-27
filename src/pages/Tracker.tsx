import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { copyText, downloadText } from '../browser';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ExternalLink } from '../components/ExternalLink';
import { ShredBurst } from '../components/ShredBurst';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { LetterLanguage } from '../components/LetterLanguage';
import { useI18n } from '../i18n';
import { CNIL_COMPLAINT_URL, cnilDossier, complaintSummary } from '../lib/complaint';
import { formatLong, isValidIsoDate, todayIso } from '../lib/dates';
import { buildIcs } from '../lib/ics';
import type { Lang } from '../lib/lang';
import { slugify } from '../lib/slug';
import { CONTEXT_LABELS, CONTEXT_LABELS_EN, kindLabel, type InitialKind, type LetterContext } from '../lib/letters';
import {
  CHANNEL_LABELS,
  channelLabel,
  ImportError,
  KIND_LABELS,
  mergeRequests,
  newId,
  parseExport,
  serializeExport,
  sortRequests,
  stateOf,
  STATUS_LABELS,
  statusLabel,
  type Channel,
  type RequestState,
  type Status,
  type TrackedRequest,
  type Urgency,
} from '../lib/tracking';
import { useTracking } from '../useTracking';

const URGENCY_LABELS: Record<Lang, Record<Urgency, string>> = {
  fr: {
    depassee: 'Délai dépassé',
    bientot: 'Échéance proche',
    'en-cours': 'En attente',
    close: 'Close',
  },
  en: {
    depassee: 'Deadline passed',
    bientot: 'Deadline soon',
    'en-cours': 'Waiting',
    close: 'Closed',
  },
};

function urgencyText(state: RequestState, lang: Lang): string {
  if (state.urgency === 'close') return URGENCY_LABELS[lang].close;
  if (lang === 'en') {
    if (state.daysLeft < 0) {
      const days = -state.daysLeft;
      return `${days} day${days > 1 ? 's' : ''} overdue`;
    }
    if (state.daysLeft === 0) return 'Due today';
    return `${state.daysLeft} day${state.daysLeft > 1 ? 's' : ''} left`;
  }
  if (state.daysLeft < 0) {
    const days = -state.daysLeft;
    return `Dépassé de ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (state.daysLeft === 0) return "Échéance aujourd'hui";
  return `${state.daysLeft} jour${state.daysLeft > 1 ? 's' : ''} restant${state.daysLeft > 1 ? 's' : ''}`;
}

interface Draft {
  site: string;
  kind: InitialKind;
  context: LetterContext;
  channel: Channel;
  sentOn: string;
  notes: string;
}

const emptyDraft = (): Draft => ({
  site: '',
  kind: 'effacement',
  context: 'exposition',
  channel: 'email',
  sentOn: todayIso(),
  notes: '',
});

type Feedback = { tone: 'ok' | 'warn' | 'danger'; text: string } | null;

export function Tracker() {
  const { t, lang, link } = useI18n();
  const { requests, update, saveFailed } = useTracking();
  /** Langue du récapitulatif de plainte : français par défaut (formulaire de la CNIL en français). */
  const [complaintLang, setComplaintLang] = useState<Lang>('fr');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftError, setDraftError] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [complaintFor, setComplaintFor] = useState<string | null>(null);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const today = todayIso();
  const sorted = sortRequests(requests, today);
  const counts: Record<Urgency, number> = { depassee: 0, bientot: 0, 'en-cours': 0, close: 0 };
  for (const r of requests) counts[stateOf(r, today).urgency] += 1;
  const satisfied = requests.filter((r) => r.status === 'satisfaite').length;

  const setField =
    <K extends keyof Draft>(key: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setDraft((d) => ({ ...d, [key]: event.target.value }));
      setDraftError('');
    };

  const onAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.site.trim()) {
      setDraftError(t('Indique le site concerné.', 'Enter the website concerned.'));
      return;
    }
    if (!isValidIsoDate(draft.sentOn)) {
      setDraftError(t("Indique une date d'envoi valide.", 'Enter a valid sending date.'));
      return;
    }
    update((list) => [
      ...list,
      {
        id: newId(),
        site: draft.site.trim(),
        kind: draft.kind,
        context: draft.context,
        channel: draft.channel,
        sentOn: draft.sentOn,
        status: 'envoyee',
        notes: draft.notes.trim(),
      },
    ]);
    setDraft(emptyDraft());
    setFeedback({
      tone: 'ok',
      text: t(`Demande à ${draft.site.trim()} ajoutée.`, `Request to ${draft.site.trim()} added.`),
    });
  };

  /** Demande tout juste passée en « Satisfaite » : petite fête, rejouée à chaque fois. */
  const [celebrate, setCelebrate] = useState<{ id: string; n: number } | null>(null);

  const setStatus = (id: string, status: Status) => {
    update((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    if (status === 'satisfaite') setCelebrate((c) => ({ id, n: (c?.n ?? 0) + 1 }));
  };

  /** Suppression en attente de confirmation : une demande, ou tout le suivi. */
  const [pendingDelete, setPendingDelete] = useState<TrackedRequest | 'all' | null>(null);

  const remove = (request: TrackedRequest) => {
    update((list) => list.filter((r) => r.id !== request.id));
    setFeedback({
      tone: 'ok',
      text: t(`Demande à ${request.site} supprimée.`, `Request to ${request.site} deleted.`),
    });
  };

  const onReminder = (request: TrackedRequest, deadline: string) => {
    const ics = buildIcs({
      uid: request.id,
      date: deadline,
      summary: t(`Échéance RGPD : ${request.site}`, `GDPR deadline: ${request.site}`),
      description: t(
        `Demande (${KIND_LABELS[request.kind].toLowerCase()}) envoyée le ${formatLong(request.sentOn, 'fr')}. Sans réponse satisfaisante, prépare une relance depuis le suivi de ShredRGPD.`,
        `Request (${kindLabel(request.kind, 'en').toLowerCase()}) sent on ${formatLong(request.sentOn, 'en')}. Without a satisfactory reply, prepare a reminder from the ShredRGPD tracker.`,
      ),
    });
    downloadText(`shred-${t('echeance', 'deadline')}-${slugify(request.site)}.ics`, ics, 'text/calendar');
  };

  const onCopyComplaint = async (text: string) => {
    const ok = await copyText(text);
    setFeedback(
      ok
        ? {
            tone: 'ok',
            text: t(
              'Récapitulatif copié. Colle-le dans le formulaire de plainte de la CNIL.',
              'Summary copied. Paste it into the CNIL complaint form.',
            ),
          }
        : {
            tone: 'warn',
            text: t('La copie a échoué. Sélectionne le texte à la main.', 'Copying failed. Select the text by hand.'),
          },
    );
  };

  const onExport = () => {
    downloadText(`shred-${t('suivi', 'tracker')}-${today}.json`, serializeExport(requests, today), 'application/json');
  };

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = parseExport(await file.text(), lang);
      update((list) => mergeRequests(list, imported));
      const n = imported.length;
      setFeedback({
        tone: 'ok',
        text: t(
          `${n} demande${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''}.`,
          `${n} request${n > 1 ? 's' : ''} imported.`,
        ),
      });
    } catch (error) {
      setFeedback({
        tone: 'danger',
        text:
          error instanceof ImportError ? error.message : t('Impossible de lire ce fichier.', 'Cannot read this file.'),
      });
    }
  };

  const onClear = () => {
    update(() => []);
    setFeedback({ tone: 'ok', text: t('Suivi effacé.', 'Tracker cleared.') });
  };

  const confirmDelete = () => {
    if (pendingDelete === 'all') onClear();
    else if (pendingDelete) remove(pendingDelete);
    setPendingDelete(null);
  };

  return (
    <>
      <PageHead
        eyebrow={t('Suivi', 'Tracker')}
        command={{
          input: t('shredrgpd suivi --echeances', 'shredrgpd track --deadlines'),
          output: t('délai légal : 1 mois (art. 12.3)', 'legal deadline: 1 month (art. 12(3))'),
        }}
        title={t('Tes demandes en cours', 'Your open requests')}
      >
        {t(
          "Le site a un mois pour te répondre à compter de la réception (article 12.3 du RGPD), trois s'il t'a prévenu d'une prolongation. Le suivi reste dans ce navigateur.",
          'The company has one month to reply from receipt (Article 12(3) GDPR), three if it told you it is extending the deadline. The tracker stays in this browser.',
        )}
      </PageHead>

      <div className="container page-body">
        <div className="stats" role="group" aria-label={t('Résumé', 'Summary')}>
          {(['depassee', 'bientot', 'en-cours', 'close'] as const).map((u) => (
            <div className={`stat stat--${u}`} key={u}>
              <span className="stat__label">{URGENCY_LABELS[lang][u]}</span>
              <span className="stat__value">{counts[u]}</span>
            </div>
          ))}
        </div>

        <div className="tracker">
          <div className="tracker__side">
            <form className="card" onSubmit={onAdd} noValidate aria-labelledby={fieldId('addTitle')}>
              <h2 className="card__title" id={fieldId('addTitle')}>
                {t('Ajouter une demande', 'Add a request')}
              </h2>
              <div className="field">
                <label htmlFor={fieldId('site')}>{t('Site ou entreprise', 'Website or company')}</label>
                <input
                  id={fieldId('site')}
                  className="input"
                  value={draft.site}
                  onChange={setField('site')}
                  placeholder={t('exemple.com', 'example.com')}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={
                    draftError === t('Indique le site concerné.', 'Enter the website concerned.') || undefined
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={fieldId('context')}>{t('Situation', 'Situation')}</label>
                <select
                  id={fieldId('context')}
                  className="select"
                  value={draft.context}
                  onChange={setField('context')}
                  aria-describedby={fieldId('contextHint')}
                >
                  {(Object.keys(CONTEXT_LABELS) as LetterContext[]).map((c) => (
                    <option key={c} value={c}>
                      {(lang === 'en' ? CONTEXT_LABELS_EN : CONTEXT_LABELS)[c].label}
                    </option>
                  ))}
                </select>
                <p className="hint" id={fieldId('contextHint')}>
                  {t(
                    'La relance reprendra les articles adaptés à ta situation.',
                    'The reminder will cite the articles that fit your situation.',
                  )}
                </p>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor={fieldId('kind')}>{t('Type', 'Type')}</label>
                  <select id={fieldId('kind')} className="select" value={draft.kind} onChange={setField('kind')}>
                    {(Object.keys(KIND_LABELS) as InitialKind[]).map((k) => (
                      <option key={k} value={k}>
                        {kindLabel(k, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={fieldId('channel')}>{t('Canal', 'Channel')}</label>
                  <select
                    id={fieldId('channel')}
                    className="select"
                    value={draft.channel}
                    onChange={setField('channel')}
                  >
                    {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                      <option key={c} value={c}>
                        {channelLabel(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor={fieldId('sentOn')}>{t("Date d'envoi", 'Sending date')}</label>
                <input
                  id={fieldId('sentOn')}
                  className="input"
                  type="date"
                  value={draft.sentOn}
                  onChange={setField('sentOn')}
                  aria-describedby={fieldId('sentOnHint')}
                />
                <p className="hint" id={fieldId('sentOnHint')}>
                  {t(
                    "Pour un courrier recommandé, mets plutôt la date de réception indiquée sur l'avis.",
                    'For a registered letter, use the date of receipt shown on the acknowledgement instead.',
                  )}
                </p>
              </div>
              <div className="field">
                <label htmlFor={fieldId('notes')}>
                  {t('Notes', 'Notes')} <span className="optional">{t('(facultatif)', '(optional)')}</span>
                </label>
                <textarea
                  id={fieldId('notes')}
                  className="textarea"
                  value={draft.notes}
                  onChange={setField('notes')}
                  placeholder={t('N° de ticket, réponse reçue…', 'Ticket number, reply received…')}
                />
              </div>
              {draftError && (
                <p className="small" role="alert">
                  <strong>{draftError}</strong>
                </p>
              )}
              <button type="submit" className="btn btn--primary">
                <Icon name="plus" size={18} />
                {t('Ajouter', 'Add')}
              </button>
            </form>

            <div className="card">
              <h2 className="card__title">{t('Sauvegarde', 'Backup')}</h2>
              <p className="small muted">
                {t(
                  'Le suivi vit dans ce navigateur. Exporte-le pour le garder ou le transférer sur un autre appareil.',
                  'The tracker lives in this browser. Export it to keep it or move it to another device.',
                )}
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn--sm" onClick={onExport} disabled={requests.length === 0}>
                  <Icon name="download" size={16} />
                  {t('Exporter', 'Export')}
                </button>
                <button type="button" className="btn btn--sm" onClick={() => fileInput.current?.click()}>
                  <Icon name="upload" size={16} />
                  {t('Importer', 'Import')}
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost btn--danger"
                  onClick={() => setPendingDelete('all')}
                  disabled={requests.length === 0}
                >
                  <Icon name="trash" size={16} />
                  {t('Tout effacer', 'Clear all')}
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={onImport}
              />
            </div>
          </div>

          <section aria-labelledby={fieldId('listTitle')}>
            <div className="toolbar">
              <h2 id={fieldId('listTitle')}>
                {t(
                  `${requests.length} demande${requests.length > 1 ? 's' : ''}`,
                  `${requests.length} request${requests.length !== 1 ? 's' : ''}`,
                )}
              </h2>
              <a className="btn btn--sm" href={link('/lettre')}>
                {t('Écrire une lettre', 'Write a letter')}
              </a>
            </div>

            <div aria-live="polite" className="stack">
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

            {satisfied > 0 && (
              <div className="tracker-win">
                <span className="tracker-win__icon" aria-hidden="true">
                  <Icon name="check" />
                </span>
                <p>
                  <strong>
                    {satisfied === 1
                      ? t('1 entreprise a répondu favorablement', '1 company replied favourably')
                      : t(
                          `${satisfied} entreprises ont répondu favorablement`,
                          `${satisfied} companies replied favourably`,
                        )}
                  </strong>
                  <span>
                    {t(
                      'Tu as fait respecter tes droits. Garde leur réponse avec ton suivi.',
                      'You enforced your rights. Keep their reply with your tracker.',
                    )}
                  </span>
                </p>
              </div>
            )}

            {sorted.length === 0 ? (
              <div className="empty">
                <span className="empty__icon">
                  <Icon name="database" />
                </span>
                <h2>{t("Aucune demande pour l'instant", 'No request yet')}</h2>
                <p>
                  {t(
                    'Ajoute une demande déjà envoyée, ou écris ta première lettre.',
                    'Add a request you already sent, or write your first letter.',
                  )}
                </p>
                <a className="btn btn--primary" href={link('/lettre')}>
                  {t('Écrire ma lettre', 'Write my letter')}
                </a>
              </div>
            ) : (
              <ul className="request-list">
                {sorted.map((request) => {
                  const state = stateOf(request, today);
                  return (
                    <li key={request.id} className="request" data-urgency={state.urgency} data-status={request.status}>
                      <div className="request__head">
                        <h3 className="request__site">{request.site}</h3>
                        <span className={`badge badge--${state.urgency}`}>{urgencyText(state, lang)}</span>
                      </div>
                      <dl className="request__meta">
                        <div>
                          <dt>{t('Type', 'Type')}</dt>
                          <dd>{kindLabel(request.kind, lang)}</dd>
                        </div>
                        {request.context && (
                          <div>
                            <dt>{t('Situation', 'Situation')}</dt>
                            <dd>{(lang === 'en' ? CONTEXT_LABELS_EN : CONTEXT_LABELS)[request.context].short}</dd>
                          </div>
                        )}
                        <div>
                          <dt>{t('Canal', 'Channel')}</dt>
                          <dd>{channelLabel(request.channel, lang)}</dd>
                        </div>
                        <div>
                          <dt>{t('Envoyée le', 'Sent on')}</dt>
                          <dd>{formatLong(request.sentOn, lang)}</dd>
                        </div>
                        <div>
                          <dt>{t('Échéance', 'Deadline')}</dt>
                          <dd>{formatLong(state.deadline, lang)}</dd>
                        </div>
                      </dl>
                      {request.status === 'satisfaite' && (
                        <p className="request__win">
                          <Icon name="check" size={18} />
                          {t('Demande satisfaite, bravo !', 'Request satisfied, well done!')}
                        </p>
                      )}
                      {celebrate?.id === request.id && <ShredBurst key={celebrate.n} tone="ok" />}
                      {request.notes && <p className="request__notes">{request.notes}</p>}
                      {request.letters && request.letters.length > 0 && (
                        <p className="hint request__letters">
                          {t(
                            `${request.letters.length} lettre${request.letters.length > 1 ? 's' : ''} gardée${request.letters.length > 1 ? 's' : ''} en copie pour le dossier CNIL`,
                            `${request.letters.length} letter${request.letters.length > 1 ? 's' : ''} kept as a copy for the CNIL file`,
                          )}
                        </p>
                      )}
                      <div className="request__controls">
                        <label className="visually-hidden" htmlFor={`${uid}-status-${request.id}`}>
                          {t(`Statut de la demande à ${request.site}`, `Status of the request to ${request.site}`)}
                        </label>
                        <select
                          id={`${uid}-status-${request.id}`}
                          className="select"
                          value={request.status}
                          onChange={(event) => setStatus(request.id, event.target.value as Status)}
                        >
                          {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s, lang)}
                            </option>
                          ))}
                        </select>
                        {state.urgency !== 'close' && (
                          <a
                            className="btn btn--sm"
                            href={link('/lettre', {
                              type: 'relance',
                              site: request.site,
                              depuis: request.sentOn,
                              premiere: request.kind,
                              suivi: request.id,
                              ...(request.context && { contexte: request.context }),
                            })}
                          >
                            {t('Préparer une relance', 'Prepare a reminder')}
                          </a>
                        )}
                        {state.urgency !== 'close' && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => onReminder(request, state.deadline)}
                            title={t(
                              "Ajoute l'échéance à ton agenda (fichier .ics)",
                              'Add the deadline to your calendar (.ics file)',
                            )}
                          >
                            <Icon name="bell" size={16} />
                            {t('Rappel', 'Reminder')}
                          </button>
                        )}
                        {(state.urgency === 'depassee' || request.status === 'relancee') && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            aria-expanded={complaintFor === request.id}
                            onClick={() => setComplaintFor((id) => (id === request.id ? null : request.id))}
                          >
                            {t('Plainte CNIL', 'CNIL complaint')}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost btn--danger request__delete"
                          onClick={() => setPendingDelete(request)}
                          aria-label={t(
                            `Supprimer la demande à ${request.site}`,
                            `Delete the request to ${request.site}`,
                          )}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                      {complaintFor === request.id && (
                        <div className="complaint">
                          <p className="small">
                            {t(
                              'Récapitulatif à coller dans le formulaire de la CNIL. Joins ta demande, ta relance et tes preuves.',
                              'Summary to paste into the CNIL form. Attach your request, your reminder and your evidence.',
                            )}
                          </p>
                          <LetterLanguage value={complaintLang} onChange={setComplaintLang} label="summary" />
                          <textarea
                            className="textarea textarea--mono"
                            readOnly
                            rows={9}
                            lang={complaintLang}
                            value={complaintSummary(request, today, complaintLang)}
                            aria-label={t(
                              `Récapitulatif de plainte pour ${request.site}`,
                              `Complaint summary for ${request.site}`,
                            )}
                          />
                          <div className="btn-row">
                            <button
                              type="button"
                              className="btn btn--sm btn--primary"
                              onClick={() => onCopyComplaint(complaintSummary(request, today, complaintLang))}
                            >
                              <Icon name="copy" size={16} />
                              {t('Copier', 'Copy')}
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm"
                              onClick={() =>
                                downloadText(
                                  `shred-${t('dossier-cnil', 'cnil-file')}-${slugify(request.site)}.txt`,
                                  cnilDossier(request, today, complaintLang),
                                )
                              }
                            >
                              <Icon name="download" size={16} />
                              {t('Dossier complet', 'Full file')}
                            </button>
                            <ExternalLink href={CNIL_COMPLAINT_URL} className="btn btn--sm">
                              {t('Adresser une plainte à la CNIL', 'File a complaint with the CNIL')}
                              <Icon name="external" size={16} />
                            </ExternalLink>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete === 'all'
            ? t('Effacer tout le suivi ?', 'Clear the whole tracker?')
            : t('Supprimer cette demande ?', 'Delete this request?')
        }
        confirmLabel={pendingDelete === 'all' ? t('Tout effacer', 'Clear all') : t('Supprimer', 'Delete')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingDelete === 'all' ? (
          <p>
            {t(
              `Les ${requests.length} demande${requests.length > 1 ? 's' : ''} de ce navigateur seront effacées. Exporte le suivi avant si tu veux le garder.`,
              `The ${requests.length} request${requests.length > 1 ? 's' : ''} in this browser will be deleted. Export the tracker first if you want to keep it.`,
            )}
          </p>
        ) : pendingDelete ? (
          <p>
            {t('La demande à ', 'The request to ')}
            <strong>{pendingDelete.site}</strong>
            {t(
              " sera retirée du suivi de ce navigateur. Ça n'annule pas la demande envoyée à l'entreprise.",
              ' will be removed from the tracker in this browser. This does not cancel the request sent to the company.',
            )}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
