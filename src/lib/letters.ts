/**
 * Génération des lettres RGPD, en français ou en anglais.
 *
 * Les modèles sont indicatifs et ne constituent pas un conseil juridique.
 * Ils s'inspirent de la structure du modèle de la CNIL
 * (cnil.fr/modele/courrier/supprimer-des-donnees-personnelles) :
 * article 17.1 pour l'effacement, article 12.3 pour le délai d'un mois,
 * article 19 pour la notification aux destinataires.
 *
 * Deux contextes :
 * - « exposition » : un site publie des données issues d'une fuite (art. 17.1 d, 17.2) ;
 * - « violation » : l'entreprise a elle-même subi la fuite. La lettre demande alors
 *   aussi la description de la violation (art. 34.2, qui renvoie à l'art. 33.3 b, c, d).
 *
 * Signalements (hors RGPD pour la procédure, RGPD pour l'illégalité) :
 * - hébergeur : notification au titre de l'article 16 du règlement (UE) 2022/2065
 *   (DSA), avec ses quatre éléments obligatoires (art. 16.2) : explication de
 *   l'illégalité, URL exactes, nom et e-mail, déclaration de bonne foi ;
 * - registrar et Cloudflare : pas des hébergeurs au sens du DSA ; demande au titre
 *   de leur politique anti-abus, de transmission et d'identification de l'hébergeur.
 *
 * Langues : le texte de chaque paragraphe est dans PHRASES (fr, en) ; l'assemblage,
 * l'ordre des paragraphes et la liste des articles cités sont communs, donc
 * identiques dans les deux langues. La version anglaise reprend les termes de la
 * version anglaise officielle du RGPD (« controller », « without undue delay »,
 * « supervisory authority ») et la numérotation anglaise (« Article 17(1)(d) »).
 *
 * Toute modification d'une lettre cite l'article concerné et met à jour
 * letters.test.ts.
 */

import { formatLong, gdprDeadlines, type IsoDate } from './dates';
import type { Lang } from './lang';

export type LetterKind = 'effacement' | 'acces' | 'opposition' | 'fermeture' | 'relance' | 'signalement';
/** Demandes RGPD avec délai légal de réponse (art. 12.3), suivies dans le suivi. */
export type InitialKind = 'effacement' | 'acces' | 'opposition' | 'fermeture';

/** Table de référence des demandes RGPD : libellé, nom dans une phrase, article fondateur. */
export const INITIAL_KINDS: Record<InitialKind, { label: string; noun: string; article: string }> = {
  effacement: { label: 'Effacement', noun: "demande d'effacement de mes données personnelles", article: '17' },
  acces: { label: 'Accès', noun: "demande d'accès à mes données personnelles", article: '15' },
  opposition: { label: 'Opposition', noun: 'opposition au traitement de mes données personnelles', article: '21' },
  fermeture: {
    label: 'Fermeture de compte',
    noun: "demande de fermeture de mon compte et d'effacement de mes données",
    article: '17',
  },
};

/** Les mêmes demandes en anglais ; le nom porte son article (« a request », « an objection »). */
export const INITIAL_KINDS_EN: Record<InitialKind, { label: string; noun: string }> = {
  effacement: { label: 'Erasure', noun: 'a request for the erasure of my personal data' },
  acces: { label: 'Access', noun: 'a request for access to my personal data' },
  opposition: { label: 'Objection', noun: 'an objection to the processing of my personal data' },
  fermeture: { label: 'Account closure', noun: 'a request to close my account and erase my data' },
};

/** Libellé d'une demande dans la langue de l'interface. */
export function kindLabel(kind: InitialKind, lang: Lang): string {
  return lang === 'en' ? INITIAL_KINDS_EN[kind].label : INITIAL_KINDS[kind].label;
}

export function isInitialKind(value: unknown): value is InitialKind {
  return typeof value === 'string' && value in INITIAL_KINDS;
}
/** Destinataire d'un signalement. */
export type ReportTarget = 'hebergeur' | 'registrar' | 'cloudflare';
export type LetterContext = 'exposition' | 'violation';

/** Libellés des deux situations, partagés par le générateur et le suivi. */
export const CONTEXT_LABELS: Record<LetterContext, { label: string; short: string }> = {
  exposition: { label: "Un site publie mes données issues d'une fuite", short: 'Un site publie mes données' },
  violation: { label: 'Une entreprise a subi une fuite de mes données', short: "Fuite chez l'entreprise" },
};

export const CONTEXT_LABELS_EN: Record<LetterContext, { label: string; short: string }> = {
  exposition: { label: 'A website publishes my data from a breach', short: 'A website publishes my data' },
  violation: { label: 'A company suffered a breach of my data', short: 'Breach at the company' },
};

export const DATA_CATEGORIES = {
  nomPrenom: 'nom et prénom',
  email: 'adresse e-mail',
  motDePasse: 'mot de passe ou son empreinte (hash)',
  telephone: 'numéro de téléphone',
  adresse: 'adresse postale',
  dateNaissance: 'date de naissance',
  bancaire: 'coordonnées bancaires',
  identifiant: 'identifiant ou pseudonyme',
  ip: 'adresse IP',
} as const;

export type DataCategory = keyof typeof DATA_CATEGORIES;

export const DATA_CATEGORIES_EN: Record<DataCategory, string> = {
  nomPrenom: 'first and last name',
  email: 'email address',
  motDePasse: 'password or its hash',
  telephone: 'phone number',
  adresse: 'postal address',
  dateNaissance: 'date of birth',
  bancaire: 'bank details',
  identifiant: 'username or nickname',
  ip: 'IP address',
};

/** Libellé d'une catégorie de données (minuscule, comme dans la lettre). */
export function dataCategoryLabel(key: DataCategory, lang: Lang): string {
  return lang === 'en' ? DATA_CATEGORIES_EN[key] : DATA_CATEGORIES[key];
}

export interface LetterInput {
  kind: LetterKind;
  /** Nom de la personne qui signe. Obligatoire. */
  fullName: string;
  /** E-mail concerné par la fuite ou de contact. Facultatif. */
  email?: string;
  /** Adresse postale pour la réponse. Facultative. */
  postalAddress?: string;
  /** Nom du site ou du responsable de traitement. Obligatoire. */
  siteName: string;
  /** Pages où les données apparaissent. */
  urls?: string[];
  dataCategories?: DataCategory[];
  /** Autres données, en texte libre. */
  otherData?: string;
  /** Date de la lettre. */
  date: IsoDate;
  /** Relance seulement : date de la première demande. */
  previousRequestDate?: IsoDate;
  /** Relance seulement : nature de la première demande. */
  previousKind?: InitialKind;
  /** Exposition par un site tiers (par défaut) ou violation subie par l'entreprise elle-même. */
  context?: LetterContext;
  /** Violation seulement : nom public de la fuite (ex. référence Have I Been Pwned). */
  breachName?: string;
  /** Violation seulement : date de la fuite. */
  breachDate?: IsoDate;
  /** Signalement seulement : à qui il est adressé. */
  reportTarget?: ReportTarget;
}

export interface Letter {
  subject: string;
  body: string;
  /** Articles du RGPD cités dans la lettre, dans l'ordre d'apparition (mêmes repères dans les deux langues). */
  articles: string[];
  /** Langue de la lettre (pour « Objet : » ou « Subject: »). */
  lang: Lang;
}

export class LetterInputError extends Error {}

/* ---------- Textes ---------- */

interface Phrases {
  salutation: string;
  closing: string;
  /** « le 5 octobre 2026 » sous la signature. */
  signedOn: (date: string) => string;
  subjectLabel: string;
  dataLabel: { violation: string; exposition: string };
  /** Référence de la fuite : nom et date, selon ce qui est connu (date déjà mise en forme). */
  breachReference: (name: string, date: string) => string;
  violationIntro: (site: string, ref: string) => string;
  breachDetails: string;
  deadline: string;
  complaint: string;
  notifyRecipients: string;
  identification: (email: string) => string;
  pagesAt: string;
  pagesSeemAt: string;
  pagesReminder: string;
  pagesMessages: string;
  pagesReference: string;
  pagesReport: string;
  erasure: {
    subject: string;
    violationRequest: string;
    expositionIntro: (site: string) => string;
    expositionRequest: string;
    publicData: string;
  };
  access: {
    subject: string;
    request: (extra: string) => string;
    items: string[];
    violationExtra: string;
    expositionIntro: (site: string) => string;
    expositionExtra: string;
  };
  reminder: {
    subject: (noun: string, article: string) => string;
    intro: (date: string, noun: string, article: string, about: string) => string;
    aboutViolation: (site: string, ref: string) => string;
    aboutExposition: (site: string) => string;
    deadline: (date: string) => string;
    refusal: string;
    request: string;
    complaint: string;
  };
  objection: {
    subject: string;
    intro: (site: string) => string;
    marketing: string;
    legitimate: string;
    consequence: string;
  };
  closure: {
    subject: string;
    violationIntro: (intro: string) => string;
    expositionIntro: (site: string) => string;
    request: string;
    legalObligation: string;
  };
  report: {
    illegality: string;
    goodFaith: string;
    intro: Record<ReportTarget, (site: string) => string>;
    request: Record<ReportTarget, string>;
    subject: Record<ReportTarget, string>;
  };
  errors: {
    reminder: string;
    reportUrl: string;
    reportEmail: string;
    name: string;
    site: string;
  };
  kindNoun: (kind: InitialKind) => string;
}

const RGPD = 'règlement (UE) 2016/679 (RGPD)';

const FR: Phrases = {
  salutation: 'Madame, Monsieur,',
  closing: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
  signedOn: (date) => `Le ${date}`,
  subjectLabel: 'Objet : ',
  dataLabel: {
    violation: "D'après les informations publiques sur cette fuite, les catégories de données exposées sont :",
    exposition: 'Les données concernées sont :',
  },
  breachReference: (name, date) => {
    let ref = '';
    if (name) ref += ` (référencée sous le nom « ${name} »`;
    if (date) ref += `${name ? ', ' : ' ('}datée du ${date}`;
    if (ref) ref += ')';
    return ref;
  },
  violationIntro: (site, ref) =>
    `J'ai appris que des données personnelles me concernant ont été exposées lors d'une violation de données subie par ${site}${ref}.`,
  breachDetails:
    "Si cette violation est susceptible d'engendrer un risque élevé pour mes droits et libertés, l'article 34 du RGPD vous impose de m'en informer. Je vous demande dans tous les cas de me décrire la nature de cette violation, ses conséquences probables, les mesures prises pour y remédier et en atténuer les effets, ainsi que les coordonnées de votre délégué à la protection des données (article 34.2, qui renvoie à l'article 33.3).",
  deadline:
    "L'article 12.3 du RGPD vous impose de me répondre dans les meilleurs délais et au plus tard dans un délai d'un mois à compter de la réception de cette demande. Cette démarche est gratuite (article 12.5 du RGPD).",
  complaint:
    "À défaut de réponse satisfaisante dans ce délai, je me réserve la possibilité d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), conformément à l'article 77 du RGPD.",
  notifyRecipients:
    "Conformément à l'article 19 du RGPD, je vous demande également de notifier cet effacement à chaque destinataire auquel ces données ont été communiquées.",
  identification: (email) => `Pour vous permettre de retrouver ces données, l'adresse e-mail concernée est : ${email}.`,
  pagesAt: 'Elles apparaissent notamment aux adresses suivantes :',
  pagesSeemAt: 'Elles semblent apparaître aux adresses suivantes :',
  pagesReminder: 'Pour rappel, ces données apparaissent aux adresses suivantes :',
  pagesMessages: 'Ces sollicitations font notamment référence aux pages suivantes :',
  pagesReference: 'Pour référence, les pages concernées sont les suivantes :',
  pagesReport: 'Les pages concernées sont les suivantes :',
  erasure: {
    subject: "Demande d'effacement de données personnelles (article 17 du RGPD)",
    violationRequest: `En application de l'article 17.1 du ${RGPD}, je vous demande d'effacer l'ensemble des données me concernant, dans la mesure où elles ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées (point a) ou où je retire mon consentement à leur traitement (point b).`,
    expositionIntro: (site) =>
      `Le site ${site} publie ou rend accessibles des données personnelles me concernant, qui proviennent selon toute vraisemblance d'une fuite de données. Je n'ai jamais consenti à cette diffusion.`,
    expositionRequest: `En application de l'article 17.1 du ${RGPD}, et notamment de son point d) (données ayant fait l'objet d'un traitement illicite), je vous demande d'effacer ces données dans les meilleurs délais.`,
    publicData:
      "Ces données ayant été rendues publiques, je vous demande, conformément à l'article 17.2 du RGPD, de prendre les mesures raisonnables pour informer les autres responsables de traitement qui les reproduisent de ma demande d'effacement de tout lien vers ces données et de toute copie de celles-ci.",
  },
  access: {
    subject: "Demande d'accès à mes données personnelles (article 15 du RGPD)",
    request: (list) =>
      `En application de l'article 15 du ${RGPD}, je vous demande de me confirmer si vous traitez des données me concernant et, si c'est le cas, de m'en communiquer une copie (article 15.3), ainsi que les informations suivantes :\n${list}`,
    items: [
      'les finalités du traitement ;',
      'les catégories de données concernées ;',
      'les destinataires auxquels ces données ont été ou seront communiquées ;',
      'la durée de conservation envisagée ;',
    ],
    violationExtra: 'la liste précise des données me concernant touchées par cette violation.',
    expositionIntro: (site) =>
      `J'ai des raisons de penser que le site ${site} traite des données personnelles me concernant, qui proviennent selon toute vraisemblance d'une fuite de données.`,
    expositionExtra:
      "toute information disponible sur la source de ces données, puisqu'elles n'ont pas été collectées auprès de moi (article 15.1 g).",
  },
  reminder: {
    subject: (noun, article) => `Relance : ${noun} (article ${article} du RGPD)`,
    intro: (date, noun, article, about) =>
      `Le ${date}, je vous ai adressé une ${noun}, fondée sur l'article ${article} du ${RGPD}, au sujet de données me concernant ${about}.`,
    aboutViolation: (site, ref) => `exposées lors d'une violation de données subie par ${site}${ref}`,
    aboutExposition: (site) => `diffusées sur le site ${site}`,
    deadline: (date) =>
      `L'article 12.3 du RGPD vous imposait d'y répondre dans un délai d'un mois à compter de sa réception, soit au plus tard vers le ${date} pour une réception le jour de l'envoi. Je n'ai pas reçu de réponse satisfaisante à ce jour.`,
    refusal:
      "Si vous estimez ne pas devoir donner suite à ma demande, l'article 12.4 du RGPD vous oblige à m'en informer et à m'en indiquer les motifs.",
    request: 'Je vous demande donc de traiter ma demande sans plus attendre.',
    complaint:
      "Sans réponse de votre part, j'introduirai une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL), conformément à l'article 77 du RGPD. Je conserve une copie de mes échanges avec vous.",
  },
  objection: {
    subject: 'Opposition au traitement de mes données personnelles (article 21 du RGPD)',
    intro: (site) =>
      `Je reçois de ${site} des sollicitations commerciales (e-mails, SMS ou appels) auxquelles je n'ai jamais consenti. Je soupçonne que mes coordonnées proviennent d'une fuite de données.`,
    marketing: `En application de l'article 21.2 du ${RGPD}, je m'oppose au traitement de mes données à des fins de prospection, y compris au profilage lié à cette prospection. Conformément à l'article 21.3 du RGPD, mes données ne doivent plus être traitées à ces fins.`,
    legitimate:
      "Je m'oppose également, au titre de l'article 21.1 du RGPD, à tout autre traitement de mes données fondé sur votre intérêt légitime : il vous appartient de démontrer l'existence de motifs légitimes et impérieux qui prévaudraient sur mes droits.",
    consequence:
      "En conséquence, je vous demande d'effacer mes données (article 17.1 c du RGPD) et de m'indiquer leur source, puisqu'elles n'ont pas été collectées auprès de moi (article 15.1 g du RGPD).",
  },
  closure: {
    subject: "Fermeture de compte et demande d'effacement de mes données (article 17 du RGPD)",
    violationIntro: (intro) => `${intro} Je ne souhaite plus utiliser votre service.`,
    expositionIntro: (site) => `Je suis titulaire d'un compte sur ${site} et je ne souhaite plus utiliser ce service.`,
    request: `Je vous demande de clôturer mon compte et, en application de l'article 17.1 du ${RGPD}, d'effacer l'ensemble des données me concernant : je retire mon consentement à leur traitement (articles 7.3 et 17.1 b) et elles ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées (article 17.1 a).`,
    legalObligation:
      'Si certaines données doivent être conservées pour respecter une obligation légale (article 17.3 b du RGPD), je vous demande de me préciser lesquelles, sur quel fondement et pour quelle durée.',
  },
  report: {
    illegality:
      "Ces données sont diffusées sans mon consentement et sans aucune autre base légale prévue à l'article 6 du règlement (UE) 2016/679 (RGPD). Leur publication constitue un traitement illicite de données personnelles, contraire aux articles 5 et 6 du RGPD.",
    goodFaith:
      'Je déclare de bonne foi que les informations et allégations contenues dans ce signalement sont exactes et complètes.',
    intro: {
      hebergeur: (site) =>
        `Votre service héberge le site ${site}, qui publie des données personnelles me concernant, issues selon toute vraisemblance d'une fuite de données.`,
      registrar: (site) =>
        `Le nom de domaine du site ${site} est enregistré auprès de vos services. Ce site publie des données personnelles me concernant, issues selon toute vraisemblance d'une fuite de données.`,
      cloudflare: (site) =>
        `Le site ${site} utilise vos services. Il publie des données personnelles me concernant, issues selon toute vraisemblance d'une fuite de données.`,
    },
    request: {
      hebergeur:
        "En application de l'article 16 du règlement (UE) 2022/2065 sur les services numériques (DSA), je vous notifie ce contenu illicite et vous demande de le retirer ou d'en rendre l'accès impossible dans les meilleurs délais, puis de m'informer de votre décision.",
      registrar:
        "Je vous demande de prendre les mesures prévues par vos conditions d'utilisation et votre politique de lutte contre les abus, de transmettre ce signalement au titulaire du nom de domaine et de m'informer des suites données.",
      cloudflare:
        "Je vous demande de transmettre ce signalement à l'hébergeur du site et au titulaire du compte, et de me communiquer l'identité de l'hébergeur afin que je puisse le saisir directement.",
    },
    subject: {
      hebergeur:
        "Signalement de contenu illicite : données personnelles issues d'une fuite (article 16 du règlement (UE) 2022/2065)",
      registrar: "Signalement d'abus : publication de données personnelles issues d'une fuite",
      cloudflare: "Signalement d'abus : publication de données personnelles issues d'une fuite",
    },
  },
  errors: {
    reminder: 'Une relance demande la date et la nature de la première demande.',
    reportUrl: "Un signalement doit indiquer l'adresse exacte (URL) d'au moins une page.",
    reportEmail: 'Un signalement doit indiquer ton adresse e-mail.',
    name: 'Le nom est obligatoire.',
    site: 'Le nom du site est obligatoire.',
  },
  kindNoun: (kind) => INITIAL_KINDS[kind].noun,
};

const GDPR = 'Regulation (EU) 2016/679 (GDPR)';
const CNIL_EN =
  "the Commission nationale de l'informatique et des libertés (CNIL), the French data protection supervisory authority";

const EN: Phrases = {
  salutation: 'Dear Sir or Madam,',
  closing: 'Yours faithfully,',
  signedOn: (date) => date,
  subjectLabel: 'Subject: ',
  dataLabel: {
    violation: 'According to public information about this breach, the categories of data exposed are:',
    exposition: 'The data concerned are:',
  },
  breachReference: (name, date) => {
    let ref = '';
    if (name) ref += ` (listed under the name "${name}"`;
    if (date) ref += `${name ? ', ' : ' ('}dated ${date}`;
    if (ref) ref += ')';
    return ref;
  },
  violationIntro: (site, ref) =>
    `I have learned that personal data concerning me were exposed in a personal data breach suffered by ${site}${ref}.`,
  breachDetails:
    'If this breach is likely to result in a high risk to my rights and freedoms, Article 34 of the GDPR requires you to communicate it to me. In any event, I ask you to describe the nature of this breach, its likely consequences, the measures taken to address it and to mitigate its possible adverse effects, as well as the contact details of your data protection officer (Article 34(2), which refers to Article 33(3)).',
  deadline:
    'Under Article 12(3) of the GDPR, you must reply to me without undue delay and in any event within one month of receipt of this request. This request is free of charge (Article 12(5) of the GDPR).',
  complaint: `If I do not receive a satisfactory reply within this period, I reserve the right to lodge a complaint with ${CNIL_EN}, in accordance with Article 77 of the GDPR.`,
  notifyRecipients:
    'In accordance with Article 19 of the GDPR, I also ask you to communicate this erasure to each recipient to whom these data have been disclosed.',
  identification: (email) => `To help you find these data, the email address concerned is: ${email}.`,
  pagesAt: 'They appear in particular at the following addresses:',
  pagesSeemAt: 'They appear to be available at the following addresses:',
  pagesReminder: 'As a reminder, these data appear at the following addresses:',
  pagesMessages: 'These messages refer in particular to the following pages:',
  pagesReference: 'For reference, the pages concerned are:',
  pagesReport: 'The pages concerned are:',
  erasure: {
    subject: 'Request for erasure of personal data (Article 17 GDPR)',
    violationRequest: `Under Article 17(1) of ${GDPR}, I ask you to erase all personal data concerning me, as they are no longer necessary in relation to the purposes for which they were collected (point (a)) or as I withdraw my consent to their processing (point (b)).`,
    expositionIntro: (site) =>
      `The website ${site} publishes or makes available personal data concerning me, which in all likelihood come from a data breach. I never consented to this disclosure.`,
    expositionRequest: `Under Article 17(1) of ${GDPR}, and in particular point (d) (personal data that have been unlawfully processed), I ask you to erase these data without undue delay.`,
    publicData:
      'As these data have been made public, I ask you, in accordance with Article 17(2) of the GDPR, to take reasonable steps to inform the other controllers processing them that I have requested the erasure of any links to, or copies of, these data.',
  },
  access: {
    subject: 'Request for access to my personal data (Article 15 GDPR)',
    request: (list) =>
      `Under Article 15 of ${GDPR}, I ask you to confirm whether or not you process personal data concerning me and, where that is the case, to provide me with a copy of these data (Article 15(3)), together with the following information:\n${list}`,
    items: [
      'the purposes of the processing;',
      'the categories of personal data concerned;',
      'the recipients to whom these data have been or will be disclosed;',
      'the envisaged period for which the data will be stored;',
    ],
    violationExtra: 'the precise list of the data concerning me that were affected by this breach.',
    expositionIntro: (site) =>
      `I have reason to believe that the website ${site} processes personal data concerning me, which in all likelihood come from a data breach.`,
    expositionExtra:
      'any available information as to the source of these data, since they were not collected from me (Article 15(1)(g)).',
  },
  reminder: {
    subject: (noun, article) => `Reminder: ${noun.replace(/^an? /, '')} (Article ${article} GDPR)`,
    intro: (date, noun, article, about) =>
      `On ${date}, I sent you ${noun}, based on Article ${article} of ${GDPR}, concerning data relating to me ${about}.`,
    aboutViolation: (site, ref) => `exposed in a personal data breach suffered by ${site}${ref}`,
    aboutExposition: (site) => `published on the website ${site}`,
    deadline: (date) =>
      `Under Article 12(3) of the GDPR, you had to reply within one month of its receipt, that is by around ${date} at the latest if it was received on the day it was sent. To date, I have not received a satisfactory reply.`,
    refusal:
      'If you consider that you should not act on my request, Article 12(4) of the GDPR requires you to inform me of this and of the reasons for not taking action.',
    request: 'I therefore ask you to deal with my request without further delay.',
    complaint: `If I receive no reply from you, I will lodge a complaint with ${CNIL_EN}, in accordance with Article 77 of the GDPR. I am keeping a copy of my correspondence with you.`,
  },
  objection: {
    subject: 'Objection to the processing of my personal data (Article 21 GDPR)',
    intro: (site) =>
      `I receive marketing messages (emails, text messages or calls) from ${site} to which I never consented. I suspect that my contact details come from a data breach.`,
    marketing: `Under Article 21(2) of ${GDPR}, I object to the processing of my personal data for direct marketing purposes, including profiling related to such marketing. In accordance with Article 21(3) of the GDPR, my data must no longer be processed for these purposes.`,
    legitimate:
      'Under Article 21(1) of the GDPR, I also object to any other processing of my data based on your legitimate interests: it is for you to demonstrate compelling legitimate grounds which would override my rights.',
    consequence:
      'Consequently, I ask you to erase my data (Article 17(1)(c) of the GDPR) and to tell me their source, since they were not collected from me (Article 15(1)(g) of the GDPR).',
  },
  closure: {
    subject: 'Account closure and request for erasure of my data (Article 17 GDPR)',
    violationIntro: (intro) => `${intro} I no longer wish to use your service.`,
    expositionIntro: (site) => `I hold an account on ${site} and no longer wish to use this service.`,
    request: `I ask you to close my account and, under Article 17(1) of ${GDPR}, to erase all personal data concerning me: I withdraw my consent to their processing (Articles 7(3) and 17(1)(b)) and they are no longer necessary in relation to the purposes for which they were collected (Article 17(1)(a)).`,
    legalObligation:
      'If some data must be kept to comply with a legal obligation (Article 17(3)(b) of the GDPR), I ask you to tell me which data, on what legal basis and for how long.',
  },
  report: {
    illegality:
      'These data are disclosed without my consent and without any other legal basis provided for in Article 6 of Regulation (EU) 2016/679 (GDPR). Their publication is unlawful processing of personal data, contrary to Articles 5 and 6 of the GDPR.',
    goodFaith:
      'I declare in good faith that the information and allegations contained in this notice are accurate and complete.',
    intro: {
      hebergeur: (site) =>
        `Your service hosts the website ${site}, which publishes personal data concerning me that in all likelihood come from a data breach.`,
      registrar: (site) =>
        `The domain name of the website ${site} is registered with you. This website publishes personal data concerning me that in all likelihood come from a data breach.`,
      cloudflare: (site) =>
        `The website ${site} uses your services. It publishes personal data concerning me that in all likelihood come from a data breach.`,
    },
    request: {
      hebergeur:
        'Under Article 16 of Regulation (EU) 2022/2065 on a Single Market for Digital Services (Digital Services Act), I notify you of this illegal content and ask you to remove it or disable access to it without undue delay, and then to inform me of your decision.',
      registrar:
        'I ask you to take the measures provided for in your terms of service and your abuse policy, to forward this notice to the domain name holder, and to inform me of the action taken.',
      cloudflare:
        'I ask you to forward this notice to the hosting provider of the website and to the account holder, and to give me the identity of the hosting provider so that I can contact them directly.',
    },
    subject: {
      hebergeur:
        'Notice of illegal content: personal data from a data breach (Article 16 of Regulation (EU) 2022/2065)',
      registrar: 'Abuse report: publication of personal data from a data breach',
      cloudflare: 'Abuse report: publication of personal data from a data breach',
    },
  },
  errors: {
    reminder: 'A reminder needs the date and type of the first request.',
    reportUrl: 'A notice must give the exact address (URL) of at least one page.',
    reportEmail: 'A notice must give your email address.',
    name: 'The name is required.',
    site: 'The website name is required.',
  },
  kindNoun: (kind) => INITIAL_KINDS_EN[kind].noun,
};

const PHRASES: Record<Lang, Phrases> = { fr: FR, en: EN };

/* ---------- Assemblage (commun aux deux langues) ---------- */

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function dataList(input: LetterInput, lang: Lang): string[] {
  const items: string[] = (input.dataCategories ?? []).map((key) => dataCategoryLabel(key, lang));
  const other = clean(input.otherData);
  if (other) items.push(other);
  return items;
}

function urlList(input: LetterInput): string[] {
  return (input.urls ?? []).map((url) => url.trim()).filter(Boolean);
}

function isViolation(input: LetterInput): boolean {
  return input.context === 'violation';
}

/** Rédaction d'une lettre : les textes de la langue et la personne qui écrit. */
interface Writer {
  p: Phrases;
  lang: Lang;
  input: LetterInput;
}

function locationParagraph({ p, lang, input }: Writer, intro: string): string | null {
  const urls = urlList(input);
  const data = dataList(input, lang);
  const parts: string[] = [];
  if (urls.length > 0) parts.push(`${intro}\n${bulletList(urls)}`);
  if (data.length > 0) {
    const label = isViolation(input) ? p.dataLabel.violation : p.dataLabel.exposition;
    parts.push(`${label}\n${bulletList(data)}`);
  }
  return parts.length > 0 ? parts.join('\n\n') : null;
}

/** « (référencée sous le nom « Exemple », datée du 3 mars 2024) », selon ce qui est connu. */
function breachReference({ p, lang, input }: Writer): string {
  return p.breachReference(clean(input.breachName), input.breachDate ? formatLong(input.breachDate, lang) : '');
}

function violationIntro(w: Writer): string {
  return w.p.violationIntro(clean(w.input.siteName), breachReference(w));
}

function identificationParagraph({ p, input }: Writer): string | null {
  const email = clean(input.email);
  return email ? p.identification(email) : null;
}

function signature({ p, lang, input }: Writer): string {
  const lines = [clean(input.fullName)];
  const email = clean(input.email);
  const address = clean(input.postalAddress);
  if (address) lines.push(address);
  if (email) lines.push(email);
  lines.push('', p.signedOn(formatLong(input.date, lang)));
  return lines.join('\n');
}

function assemble(w: Writer, paragraphs: (string | null)[]): string {
  return [w.p.salutation, ...paragraphs.filter((x): x is string => x !== null), w.p.closing, signature(w)].join('\n\n');
}

function letter(w: Writer, subject: string, paragraphs: (string | null)[], articles: string[]): Letter {
  return { subject, body: assemble(w, paragraphs), articles, lang: w.lang };
}

function effacement(w: Writer): Letter {
  const { p, input } = w;
  if (isViolation(input)) {
    return letter(
      w,
      p.erasure.subject,
      [
        violationIntro(w),
        locationParagraph(w, p.pagesAt),
        identificationParagraph(w),
        p.erasure.violationRequest,
        p.notifyRecipients,
        p.breachDetails,
        p.deadline,
        p.complaint,
      ],
      ['17.1', '19', '34', '34.2', '33.3', '12.3', '12.5', '77'],
    );
  }
  return letter(
    w,
    p.erasure.subject,
    [
      p.erasure.expositionIntro(clean(input.siteName)),
      locationParagraph(w, p.pagesAt),
      identificationParagraph(w),
      p.erasure.expositionRequest,
      p.erasure.publicData,
      p.notifyRecipients,
      p.deadline,
      p.complaint,
    ],
    ['17.1', '17.2', '19', '12.3', '12.5', '77'],
  );
}

function accessRequest(p: Phrases, extra: string): string {
  return p.access.request(bulletList([...p.access.items, extra]));
}

function acces(w: Writer): Letter {
  const { p, input } = w;
  if (isViolation(input)) {
    return letter(
      w,
      p.access.subject,
      [
        violationIntro(w),
        locationParagraph(w, p.pagesSeemAt),
        identificationParagraph(w),
        accessRequest(p, p.access.violationExtra),
        p.breachDetails,
        p.deadline,
        p.complaint,
      ],
      ['15', '15.3', '34', '34.2', '33.3', '12.3', '12.5', '77'],
    );
  }
  return letter(
    w,
    p.access.subject,
    [
      p.access.expositionIntro(clean(input.siteName)),
      locationParagraph(w, p.pagesSeemAt),
      identificationParagraph(w),
      accessRequest(p, p.access.expositionExtra),
      p.deadline,
      p.complaint,
    ],
    ['15', '15.3', '15.1 g', '12.3', '12.5', '77'],
  );
}

function relance(w: Writer): Letter {
  const { p, lang, input } = w;
  const previousDate = input.previousRequestDate;
  const previousKind = input.previousKind;
  if (!previousDate || !previousKind) throw new LetterInputError(p.errors.reminder);
  const site = clean(input.siteName);
  const noun = p.kindNoun(previousKind);
  const article = INITIAL_KINDS[previousKind].article;
  const deadline = gdprDeadlines(previousDate).standard;
  const about = isViolation(input)
    ? p.reminder.aboutViolation(site, breachReference(w))
    : p.reminder.aboutExposition(site);
  return letter(
    w,
    p.reminder.subject(noun, article),
    [
      p.reminder.intro(formatLong(previousDate, lang), noun, article, about),
      locationParagraph(w, p.pagesReminder),
      p.reminder.deadline(formatLong(deadline, lang)),
      p.reminder.refusal,
      p.reminder.request,
      p.reminder.complaint,
    ],
    [article, '12.3', '12.4', '77'],
  );
}

function opposition(w: Writer): Letter {
  const { p, input } = w;
  return letter(
    w,
    p.objection.subject,
    [
      p.objection.intro(clean(input.siteName)),
      locationParagraph(w, p.pagesMessages),
      identificationParagraph(w),
      p.objection.marketing,
      p.objection.legitimate,
      p.objection.consequence,
      p.deadline,
      p.complaint,
    ],
    ['21.2', '21.3', '21.1', '17.1 c', '15.1 g', '12.3', '12.5', '77'],
  );
}

function fermeture(w: Writer): Letter {
  const { p, input } = w;
  const violation = isViolation(input);
  return letter(
    w,
    p.closure.subject,
    [
      violation ? p.closure.violationIntro(violationIntro(w)) : p.closure.expositionIntro(clean(input.siteName)),
      locationParagraph(w, p.pagesReference),
      identificationParagraph(w),
      p.closure.request,
      p.closure.legalObligation,
      p.notifyRecipients,
      violation ? p.breachDetails : null,
      p.deadline,
      p.complaint,
    ],
    violation
      ? ['17.1', '7.3', '17.3 b', '19', '34', '34.2', '33.3', '12.3', '12.5', '77']
      : ['17.1', '7.3', '17.3 b', '19', '12.3', '12.5', '77'],
  );
}

function signalement(w: Writer): Letter {
  const { p, input } = w;
  const target = input.reportTarget ?? 'hebergeur';
  if (urlList(input).length === 0) throw new LetterInputError(p.errors.reportUrl);
  if (!clean(input.email)) throw new LetterInputError(p.errors.reportEmail);
  return letter(
    w,
    p.report.subject[target],
    [
      p.report.intro[target](clean(input.siteName)),
      locationParagraph(w, p.pagesReport),
      p.report.illegality,
      p.report.request[target],
      p.report.goodFaith,
    ],
    target === 'hebergeur' ? ['6 RGPD', '5 RGPD', '16 DSA'] : ['6 RGPD', '5 RGPD'],
  );
}

/** Lettre en français (par défaut) ou en anglais. */
export function generateLetter(input: LetterInput, lang: Lang = 'fr'): Letter {
  const w: Writer = { p: PHRASES[lang], lang, input };
  if (!clean(input.fullName)) throw new LetterInputError(w.p.errors.name);
  if (!clean(input.siteName)) throw new LetterInputError(w.p.errors.site);
  switch (input.kind) {
    case 'effacement':
      return effacement(w);
    case 'acces':
      return acces(w);
    case 'opposition':
      return opposition(w);
    case 'fermeture':
      return fermeture(w);
    case 'relance':
      return relance(w);
    case 'signalement':
      return signalement(w);
  }
}

/** Texte complet prêt à copier : objet puis corps. */
export function letterToText(letter: Letter): string {
  return `${PHRASES[letter.lang].subjectLabel}${letter.subject}\n\n${letter.body}\n`;
}

/** « Objet : » ou « Subject: », selon la langue de la lettre. */
export function subjectLabel(lang: Lang): string {
  return PHRASES[lang].subjectLabel;
}

/** Lien mailto: ouvert dans le logiciel de messagerie de la personne, rien ne transite par ShredRGPD. */
export function mailtoHref(letter: Pick<Letter, 'subject' | 'body'>, to = ''): string {
  const params = `subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`;
  return `mailto:${to.trim().replace(/[?&#\s]/g, '')}?${params}`;
}
