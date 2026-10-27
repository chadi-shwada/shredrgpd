/**
 * Métadonnées de chaque page : titre, description, adresse canonique et
 * aperçu de partage. Utilisé au build (vite.config.ts) pour générer une page
 * HTML par adresse, et dans le navigateur pour le titre de l'onglet.
 */

import { SITE_DESCRIPTION, SITE_DESCRIPTION_EN, SITE_TITLE, SITE_TITLE_EN, SITE_URL } from './config';
import type { Lang } from './lib/lang';
import { BREACH_PREFIX_EN, BREACH_PREFIX_FR, EN_PATHS, UNKNOWN_EN_PATH } from './lib/paths';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Image d'aperçu propre à la page (chemin depuis la racine) ; sinon /og.png (/og-en.png en anglais). */
  image?: string;
  /** Dernière modification connue (AAAA-MM-JJ), pour le sitemap. */
  lastmod?: string;
  /** Langue de la page (français par défaut). */
  lang?: Lang;
}

export const PAGES: PageMeta[] = [
  { path: '/', title: SITE_TITLE, description: SITE_DESCRIPTION },
  {
    path: '/verifier',
    title: 'Vérifier mes fuites · ShredRGPD',
    description:
      "Repère les fuites qui contiennent ton e-mail, vois quelles données sont exposées et teste un mot de passe sans le confier à personne. Puis écris à l'entreprise en un clic.",
  },
  {
    path: '/que-faire',
    title: 'Que faire après une fuite ? · ShredRGPD',
    description:
      'SMS, appel ou e-mail suspect, carte bancaire, pièce d’identité ou mot de passe exposé : les bons réflexes et les canaux officiels de signalement.',
  },
  {
    path: '/lettre',
    title: 'Écrire une lettre RGPD · ShredRGPD',
    description:
      "Génère une lettre d'effacement, d'accès, d'opposition, de relance ou un signalement à l'hébergeur, avec les bons articles du RGPD. Gratuit, dans ton navigateur.",
  },
  {
    path: '/suivi',
    title: 'Suivi de mes demandes · ShredRGPD',
    description:
      "Suis tes demandes RGPD : échéance d'un mois calculée, rappel dans ton agenda, relance et récapitulatif de plainte CNIL. Tout reste dans ton navigateur.",
  },
  {
    path: '/ressources',
    title: 'Mes droits, étape par étape · ShredRGPD',
    description:
      "Comment faire effacer tes données après une fuite : preuves, bon contact, envoi, relance, signalement à l'hébergeur et plainte à la CNIL.",
  },
  {
    path: '/chiffres',
    title: 'Fuites de données en France : les chiffres · ShredRGPD',
    description:
      'Combien de fuites touchent des entreprises françaises, quelles données sont exposées, les plus grosses fuites : les chiffres du catalogue Have I Been Pwned, mis à jour chaque jour.',
  },
  {
    path: '/nouvelles-fuites',
    title: 'Suivre les nouvelles fuites en France · ShredRGPD',
    description:
      'Reçois chaque nouvelle fuite de données touchant la France dans ton lecteur de flux (RSS/Atom), sans compte ni e-mail. Adresse du flux et lecteurs gratuits.',
  },
  {
    path: '/a-propos',
    title: 'À propos · ShredRGPD',
    description:
      'ShredRGPD aide les victimes de fuites de données à exercer leurs droits RGPD, sans compte, sans cookie et sans base de fuites.',
  },
  {
    path: '/mentions-legales',
    title: 'Mentions légales · ShredRGPD',
    description: 'Éditeur, hébergeur et traitement des données du site ShredRGPD.',
  },
];

/**
 * Pages de la version anglaise, à leur adresse publiée (/en/check…). Une entrée par
 * chemin de EN_PATHS (vérifié par seo.test.ts).
 */
export const PAGES_EN: PageMeta[] = [
  { path: '/en', title: SITE_TITLE_EN, description: SITE_DESCRIPTION_EN },
  {
    path: '/en/check',
    title: 'Check my data breaches · ShredRGPD',
    description:
      'Find the breaches that contain your email address, see which data were exposed and test a password without handing it to anyone. Then write to the company in one click.',
  },
  {
    path: '/en/what-to-do',
    title: 'What to do after a data breach in France · ShredRGPD',
    description:
      'Suspicious text, call or email, exposed bank card, ID document or password: what to do and the official French reporting channels.',
  },
  {
    path: '/en/letter',
    title: 'Write a GDPR letter · ShredRGPD',
    description:
      'Generate an erasure, access, objection or reminder letter, or a notice to the hosting provider, citing the right GDPR articles, in English or French. Free, in your browser.',
  },
  {
    path: '/en/tracker',
    title: 'Track my requests · ShredRGPD',
    description:
      'Track your GDPR requests: one-month deadline worked out, calendar reminder, follow-up letter and CNIL complaint summary. Everything stays in your browser.',
  },
  {
    path: '/en/resources',
    title: 'My rights, step by step · ShredRGPD',
    description:
      'How to get your data erased after a breach: evidence, the right contact, sending, follow-up, notice to the hosting provider and complaint to the CNIL.',
  },
  {
    path: '/en/figures',
    title: 'Data breaches in France: the figures · ShredRGPD',
    description:
      'How many breaches hit French companies, which data are exposed, the biggest breaches: figures from the Have I Been Pwned catalogue, updated every day.',
  },
  {
    path: '/en/new-breaches',
    title: 'Follow new data breaches in France · ShredRGPD',
    description:
      'Get every new data breach affecting France in your feed reader (RSS/Atom), with no account and no email. Feed address and free readers.',
  },
  {
    path: '/en/about',
    title: 'About · ShredRGPD',
    description:
      'ShredRGPD helps victims of data breaches exercise their GDPR rights, with no account, no cookie and no breach database.',
  },
  {
    path: '/en/legal-notice',
    title: 'Legal notice · ShredRGPD',
    description: 'Publisher, hosting provider and personal data processing of the ShredRGPD website.',
  },
].map((page) => ({ ...page, lang: 'en' as const }));

/** Image d'aperçu par défaut des pages anglaises (texte en anglais). */
export const DEFAULT_IMAGE_EN = '/og-en.png';

/** Flux Atom des fuites françaises, généré au build (vite.config.ts), en français et en anglais. */
export const FEED_PATH = '/fuites.xml';
export const FEED_PATH_EN = '/en/breaches.xml';

export const NOT_FOUND: PageMeta = {
  path: '/404',
  title: 'Page introuvable · ShredRGPD',
  description: "Cette page n'existe pas.",
};

export const NOT_FOUND_EN: PageMeta = {
  path: UNKNOWN_EN_PATH,
  title: 'Page not found · ShredRGPD',
  description: 'This page does not exist.',
  lang: 'en',
};

/** Métadonnées d'une page, par son chemin français (identifiant de la route) et sa langue. */
export function pageMeta(path: string, lang: Lang = 'fr'): PageMeta {
  if (lang === 'en') {
    const en = EN_PATHS[path];
    return PAGES_EN.find((p) => p.path === en) ?? NOT_FOUND_EN;
  }
  return PAGES.find((p) => p.path === path) ?? NOT_FOUND;
}

/** Les deux versions d'une page (adresses publiées), sinon null (page 404). */
export function alternates(page: PageMeta): { fr: string; en: string } | null {
  for (const [fr, en] of Object.entries(EN_PATHS)) {
    if (page.path === fr || page.path === en) return { fr, en };
  }
  if (page.path.startsWith(BREACH_PREFIX_FR)) {
    return { fr: page.path, en: BREACH_PREFIX_EN + page.path.slice(BREACH_PREFIX_FR.length) };
  }
  if (page.path.startsWith(BREACH_PREFIX_EN)) {
    return { fr: BREACH_PREFIX_FR + page.path.slice(BREACH_PREFIX_EN.length), en: page.path };
  }
  return null;
}

/** Nom du fichier HTML généré pour une page (« /verifier » → « verifier.html », « /en/check » → « en/check.html »). */
export function htmlFileName(page: PageMeta): string {
  return page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
}

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Balises <head> d'une page. La page 404 n'a pas d'adresse canonique et n'est pas indexée. */
export function headTags(page: PageMeta, { noindex = false } = {}): string {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  const en = page.lang === 'en';
  const image = `${SITE_URL}${page.image ?? (en ? DEFAULT_IMAGE_EN : '/og.png')}`;
  const imageAlt = page.image
    ? page.title
    : en
      ? 'ShredRGPD: request the erasure of your data'
      : "ShredRGPD : demande l'effacement de tes données";
  const versions = noindex ? null : alternates(page);
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:locale" content="${en ? 'en_GB' : 'fr_FR'}" />`,
    ...(versions
      ? [
          `<link rel="alternate" hreflang="fr" href="${SITE_URL}${versions.fr}" />`,
          `<link rel="alternate" hreflang="en" href="${SITE_URL}${versions.en}" />`,
          `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${versions.fr}" />`,
        ]
      : []),
    '<meta property="og:site_name" content="ShredRGPD" />',
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    ...(noindex ? [] : [`<meta property="og:url" content="${url}" />`]),
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    en
      ? `<link rel="alternate" type="application/atom+xml" title="Data breaches in France" href="${FEED_PATH_EN}" />`
      : `<link rel="alternate" type="application/atom+xml" title="Fuites de données en France" href="${FEED_PATH}" />`,
    ...((page.path === '/' || page.path === '/en') && !noindex ? [structuredData(page.lang ?? 'fr')] : []),
  ];
  return tags.join('\n    ');
}

/**
 * Données structurées de l'accueil (schema.org, JSON-LD) : le site et l'outil gratuit. Bloc de données,
 * jamais exécuté : la CSP (script-src 'self') ne le concerne pas.
 */
export function structuredData(lang: Lang = 'fr'): string {
  const en = lang === 'en';
  const url = en ? `${SITE_URL}/en` : `${SITE_URL}/`;
  const description = en ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION;
  const inLanguage = en ? 'en-GB' : 'fr-FR';
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: 'ShredRGPD', url, inLanguage, description },
      {
        '@type': 'WebApplication',
        name: 'ShredRGPD',
        url,
        description,
        inLanguage,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
    ],
  };
  // « < » échappé : le texte ne peut pas fermer la balise <script>.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/** Plan du site : les pages fixes, plus les pages générées au build (une par fuite). */
export function sitemapXml(extra: readonly PageMeta[] = []): string {
  const urls = [...PAGES, ...PAGES_EN, ...extra]
    .map((p) => `  <url><loc>${SITE_URL}${p.path}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
