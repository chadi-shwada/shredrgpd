/**
 * Récapitulatif à coller dans le formulaire de plainte de la CNIL (article 77
 * du RGPD), à partir d'une demande du suivi. Rien n'est envoyé : c'est du texte.
 * En français par défaut (le formulaire de la CNIL est en français), ou en anglais.
 */

import { formatLong, gdprDeadlines, type IsoDate } from './dates';
import type { Lang } from './lang';
import { INITIAL_KINDS, INITIAL_KINDS_EN } from './letters';
import type { TrackedRequest } from './tracking';

export const CNIL_COMPLAINT_URL = 'https://www.cnil.fr/fr/adresser-une-plainte';

export function complaintSummary(request: TrackedRequest, today: IsoDate, lang: Lang = 'fr'): string {
  const kind = INITIAL_KINDS[request.kind];
  const deadline = gdprDeadlines(request.sentOn)[request.status === 'prolongee' ? 'extended' : 'standard'];
  const date = (iso: IsoDate) => formatLong(iso, lang);
  const notes = request.notes.trim();
  if (lang === 'en') {
    const lines = [
      `Organisation concerned: ${request.site}`,
      '',
      `On ${date(request.sentOn)}, I sent this organisation ${INITIAL_KINDS_EN[request.kind].noun}, based on Article ${kind.article} of the GDPR.`,
      `The time limit for a reply set by Article 12(3) of the GDPR expired on ${date(deadline)}.`,
      request.status === 'relancee'
        ? 'I sent a reminder, without a satisfactory reply to date.'
        : 'I have not received a satisfactory reply to date.',
      `Date of this summary: ${date(today)}.`,
    ];
    if (notes) lines.push('', `Details: ${notes}`);
    lines.push(
      '',
      'I attach a copy of my request, of any reminder, and evidence showing the disclosure of my data (dated screenshots, page addresses).',
    );
    return lines.join('\n');
  }
  const lines = [
    `Organisme concerné : ${request.site}`,
    '',
    `Le ${date(request.sentOn)}, j'ai adressé à cet organisme une ${kind.noun}, fondée sur l'article ${kind.article} du RGPD.`,
    `Le délai de réponse prévu à l'article 12.3 du RGPD expirait le ${date(deadline)}.`,
    request.status === 'relancee'
      ? "Je l'ai relancé, sans réponse satisfaisante à ce jour."
      : "Je n'ai pas reçu de réponse satisfaisante à ce jour.",
    `Date de ce récapitulatif : ${date(today)}.`,
  ];
  if (notes) lines.push('', `Précisions : ${notes}`);
  lines.push(
    '',
    "Je joins une copie de ma demande, de ma relance éventuelle et des éléments montrant la diffusion de mes données (captures d'écran datées, adresses des pages).",
  );
  return lines.join('\n');
}

const DOSSIER = {
  fr: {
    title: 'DOSSIER DE PLAINTE CNIL (préparé avec ShredRGPD, modèle indicatif)',
    letters: (n: number) => `LETTRES ENVOYÉES (${n})`,
    noLetter: 'Aucune copie gardée dans le suivi. Joins les lettres que tu as envoyées.',
    attach: 'PIÈCES À JOINDRE',
    items: [
      "- captures d'écran datées des pages qui exposent tes données ;",
      "- preuves d'envoi et de réception (accusés, captures, numéros de ticket) ;",
      '- réponses éventuelles de l’organisme.',
    ],
  },
  en: {
    title: 'CNIL COMPLAINT FILE (prepared with ShredRGPD, indicative template)',
    letters: (n: number) => `LETTERS SENT (${n})`,
    noLetter: 'No copy kept in the tracker. Attach the letters you sent.',
    attach: 'DOCUMENTS TO ATTACH',
    items: [
      '- dated screenshots of the pages that expose your data;',
      '- proof of sending and receipt (acknowledgements, screenshots, ticket numbers);',
      '- any replies from the organisation.',
    ],
  },
};

/**
 * Dossier complet à joindre à une plainte : récapitulatif, puis le texte de
 * chaque lettre gardée en copie dans le suivi (dans la langue où elle a été écrite).
 */
export function cnilDossier(request: TrackedRequest, today: IsoDate, lang: Lang = 'fr'): string {
  const d = DOSSIER[lang];
  const parts = [d.title, '', complaintSummary(request, today, lang)];
  const letters = request.letters ?? [];
  parts.push('', '', d.letters(letters.length));
  if (letters.length === 0) parts.push('', d.noLetter);
  for (const letter of letters) {
    parts.push(
      '',
      `--- ${formatLong(letter.date, lang)}${lang === 'en' ? ':' : ' :'} ${letter.subject} ---`,
      '',
      letter.body,
    );
  }
  parts.push('', '', d.attach, ...d.items);
  return parts.join('\n');
}
