/**
 * Plan d'action personnalisé selon les types de données exposées (libellés HIBP).
 * Les identifiants sont stables pour mémoriser les cases cochées ; ils sont les
 * mêmes dans les deux langues.
 */

import type { Lang } from './lang';
import { localizePath } from './paths';

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  /** Lien interne (chemin) ou externe (https). */
  link?: { href: string; label: string };
}

interface Rule {
  when: string[];
  items: ActionItem[];
}

const RULES: Rule[] = [
  {
    when: ['Passwords', 'Password hints', 'Security questions and answers'],
    items: [
      {
        id: 'mdp-changer',
        title: 'Change le mot de passe de chaque compte concerné',
        detail: "Et partout où tu l'as réutilisé : les pirates essaient le même mot de passe sur d'autres sites.",
      },
      {
        id: 'mdp-2fa',
        title: 'Active la double authentification',
        detail: 'En priorité sur ta messagerie, ta banque et tes réseaux sociaux.',
      },
      {
        id: 'mdp-unique',
        title: 'Utilise un mot de passe unique par site',
        detail: 'Un gestionnaire de mots de passe aide à les retenir. ShredRGPD peut en créer un solide.',
        link: { href: '/verifier#parcours=mot-de-passe', label: 'Tester ou créer un mot de passe' },
      },
    ],
  },
  {
    when: ['Email addresses'],
    items: [
      {
        id: 'email-hameconnage',
        title: 'Méfie-toi des e-mails qui citent la fuite',
        detail: "Ne clique pas sur les liens inattendus. Signale l'hameçonnage à Signal Spam.",
        link: { href: '/que-faire', label: 'Que faire face à un message suspect' },
      },
    ],
  },
  {
    when: ['Phone numbers'],
    items: [
      {
        id: 'tel-33700',
        title: 'Signale les SMS et appels suspects au 33700',
        detail: 'Un SMS gratuit suffit. Ne rappelle jamais un numéro inconnu qui cite tes informations.',
        link: { href: '/que-faire', label: 'Comment signaler' },
      },
    ],
  },
  {
    when: ['Credit cards', 'Partial credit card data', 'Bank account numbers'],
    items: [
      {
        id: 'banque',
        title: 'Préviens ta banque et surveille tes relevés',
        detail:
          'En cas d’opération suspecte, fais opposition auprès de ta banque ou au 0 892 705 705 (service interbancaire, 7 j/7, 24 h/24).',
        link: { href: '/que-faire', label: 'Démarches bancaires' },
      },
    ],
  },
  {
    when: ['Government issued IDs', 'Passport numbers', 'Social security numbers'],
    items: [
      {
        id: 'identite',
        title: "Garde des preuves et surveille l'usurpation d'identité",
        detail:
          "En cas d'usage frauduleux, dépose plainte. France Victimes t'aide gratuitement au 116 006, 7 j/7 de 9 h à 19 h.",
        link: { href: '/que-faire', label: "En cas d'usurpation" },
      },
    ],
  },
  {
    when: ['Physical addresses', 'Names', 'Dates of birth'],
    items: [
      {
        id: 'courrier',
        title: 'Reste attentif aux courriers et démarches à ton nom',
        detail: 'Ces informations servent à rendre les arnaques plus crédibles.',
      },
    ],
  },
];

const WRITE: ActionItem = {
  id: 'ecrire',
  title: 'Demande aux entreprises ce qui a fuité',
  detail: "Elles doivent te répondre dans un délai d'un mois (article 12.3 du RGPD).",
};

/** Textes anglais, par identifiant. Les démarches restent françaises (33700, Signal Spam…). */
const ENGLISH: Record<string, Omit<ActionItem, 'id' | 'link'> & { link?: string }> = {
  'mdp-changer': {
    title: 'Change the password of every account concerned',
    detail: 'And everywhere you reused it: attackers try the same password on other websites.',
  },
  'mdp-2fa': {
    title: 'Turn on two-factor authentication',
    detail: 'First on your email, your bank and your social networks.',
  },
  'mdp-unique': {
    title: 'Use a different password for each website',
    detail: 'A password manager helps you remember them. ShredRGPD can create a strong one.',
    link: 'Test or create a password',
  },
  'email-hameconnage': {
    title: 'Be wary of emails that mention the breach',
    detail: 'Do not click unexpected links. Report phishing to Signal Spam (French service).',
    link: 'What to do about a suspicious message',
  },
  'tel-33700': {
    title: 'Report suspicious texts and calls to 33700',
    detail: 'A free text message is enough. Never call back an unknown number that quotes your details.',
    link: 'How to report',
  },
  banque: {
    title: 'Tell your bank and watch your statements',
    detail:
      'If you see a suspicious payment, block your card with your bank or on 0 892 705 705 (interbank line, 24/7).',
    link: 'Bank steps',
  },
  identite: {
    title: 'Keep evidence and watch for identity theft',
    detail:
      'If your identity is misused, file a complaint with the police. France Victimes helps for free on 116 006, every day from 9 am to 7 pm.',
    link: 'In case of identity theft',
  },
  courrier: {
    title: 'Watch out for letters and procedures in your name',
    detail: 'This information is used to make scams more convincing.',
  },
  ecrire: {
    title: 'Ask the companies what leaked',
    detail: 'They must reply within one month (Article 12(3) GDPR).',
  },
};

function inLanguage(item: ActionItem, lang: Lang): ActionItem {
  if (lang === 'fr') return item;
  const en = ENGLISH[item.id];
  if (!en) return item;
  return {
    id: item.id,
    title: en.title,
    detail: en.detail,
    ...(item.link ? { link: { href: localizePath(item.link.href, lang), label: en.link ?? item.link.label } } : {}),
  };
}

/**
 * Actions à mener pour un ensemble de types de données exposées, sans doublon.
 * `write: false` retire l'étape « écrire aux entreprises » (fuite non confirmée : peut-être personne à qui écrire).
 */
export function buildActionPlan(
  dataClasses: string[],
  { write = true, lang = 'fr' }: { write?: boolean; lang?: Lang } = {},
): ActionItem[] {
  if (dataClasses.length === 0) return [];
  const items: ActionItem[] = [];
  for (const rule of RULES) {
    if (rule.when.some((w) => dataClasses.includes(w))) {
      for (const item of rule.items) if (!items.some((i) => i.id === item.id)) items.push(item);
    }
  }
  if (write) items.push(WRITE);
  return items.map((item) => inLanguage(item, lang));
}

export const PLAN_STORAGE_KEY = 'shred.plan.v1';

/** Lit les actions cochées (identifiants). Liste vide si le stockage est absent ou illisible. */
export function loadDone(raw: string | null): string[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
