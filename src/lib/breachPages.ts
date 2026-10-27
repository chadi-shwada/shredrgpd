/**
 * Pages publiques par fuite française (/fuite/free…), résumé du catalogue pour
 * l'accueil et flux Atom des fuites françaises. Tout est tiré du catalogue
 * public HIBP (métadonnées seulement) au build, plus quelques fuites absentes de
 * HIBP ajoutées à la main (src/data/manualBreaches.ts, withManualBreaches) :
 * aucune requête à l'exécution.
 */

import {
  countUnit,
  dataClassLabel,
  formatCount,
  recentFrenchBreaches,
  withManualBreaches,
  type Breach,
  type BreachCatalog,
} from './breaches';
import { formatLong, formatLongFr, type IsoDate } from './dates';
import type { Lang } from './lang';
import { BREACH_PREFIX_FR, localizePath } from './paths';
import { breachRisk, type RiskLevel } from './risk';
import { slugify } from './slug';

export const BREACH_PATH_PREFIX = BREACH_PREFIX_FR;

/**
 * Fuites qui ont une page : françaises, avec une entreprise identifiée (un
 * domaine) à qui écrire. Les compilations sans domaine en sont exclues. Les plus
 * récentes d'abord.
 */
export function pageBreaches(breaches: Breach[]): Breach[] {
  return recentFrenchBreaches(breaches, Number.POSITIVE_INFINITY).filter((b) => b.domain !== '');
}

/**
 * Adresse lisible tirée du titre (« La Poste Mobile » → la-poste-mobile).
 * Si deux fuites donnent la même, chacune prend son nom HIBP, qui est unique.
 */
export function breachSlugs(breaches: Breach[]): Map<string, Breach> {
  const byTitle = new Map<string, Breach[]>();
  for (const b of breaches) {
    const slug = slugify(b.title);
    byTitle.set(slug, [...(byTitle.get(slug) ?? []), b]);
  }
  const slugs = new Map<string, Breach>();
  for (const [slug, list] of byTitle) {
    if (list.length === 1) slugs.set(slug, list[0]!);
    else for (const b of list) slugs.set(slugify(b.name), b);
  }
  return slugs;
}

/** Index inverse : nom HIBP → adresse de la page, pour les liens. */
export function breachPathsByName(breaches: Breach[]): Map<string, string> {
  return new Map([...breachSlugs(pageBreaches(breaches))].map(([slug, b]) => [b.name, BREACH_PATH_PREFIX + slug]));
}

export function findBreachBySlug(breaches: Breach[], slug: string): Breach | null {
  return breachSlugs(pageBreaches(breaches)).get(slug) ?? null;
}

const count = formatCount;

const MONTHS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** « oct. 2024 ». */
export function formatMonthFr(iso: IsoDate): string {
  return `${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

/** « oct. 2024 » en français, « Oct 2024 » en anglais. */
export function formatMonth(iso: IsoDate, lang: Lang): string {
  if (lang === 'fr') return formatMonthFr(iso);
  return `${MONTHS_SHORT_EN[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

export interface BreachPageMeta {
  path: string;
  title: string;
  description: string;
  /** Date d'ajout de la fuite au catalogue HIBP (fiche manuelle : date où elle a été rendue publique), pour le sitemap. */
  lastmod?: string;
}

/** « comptes » ou « personnes » dans la langue demandée. */
export function countUnitLabel(unit: 'comptes' | 'personnes', lang: Lang): string {
  if (lang === 'fr') return unit;
  return unit === 'personnes' ? 'people' : 'accounts';
}

export function breachPageMeta(breach: Breach, slug: string, lang: Lang = 'fr'): BreachPageMeta {
  if (lang === 'en') {
    const typesEn = breach.dataClasses
      .slice(0, 4)
      .map((dc) => dataClassLabel(dc, 'en'))
      .join(', ');
    const accountsEn =
      breach.pwnCount > 0 ? `${formatCount(breach.pwnCount, 'en')} ${countUnitLabel(countUnit(breach), 'en')}, ` : '';
    return {
      path: localizePath(BREACH_PATH_PREFIX + slug, 'en'),
      title: `${breach.title} data breach (${formatMonth(breach.date, 'en')}): what to do? · ShredRGPD`,
      description: `${breach.title} data breach of ${formatLong(breach.date, 'en')}: ${accountsEn}${typesEn}. ${
        breach.verified
          ? 'Check whether you are affected and ask the company what data it holds about you, with a free GDPR letter.'
          : 'Breach not confirmed by the company: check whether you are affected and protect your accounts.'
      }`,
      ...(breach.addedDate ? { lastmod: breach.addedDate } : {}),
    };
  }
  const types = breach.dataClasses
    .slice(0, 4)
    .map((dc) => dataClassLabel(dc))
    .join(', ');
  const accounts = breach.pwnCount > 0 ? `${count(breach.pwnCount)} ${countUnit(breach)}, ` : '';
  return {
    path: BREACH_PATH_PREFIX + slug,
    title: `Fuite ${breach.title} (${formatMonthFr(breach.date)}) : que faire ? · ShredRGPD`,
    description: `Fuite de données ${breach.title} du ${formatLongFr(breach.date)} : ${accounts}${types}. ${
      breach.verified
        ? "Vérifie si tu es concerné et demande à l'entreprise ce qu'elle détient sur toi, avec une lettre RGPD gratuite."
        : "Fuite non confirmée par l'entreprise : vérifie si tu es concerné et protège tes comptes."
    }`,
    ...(breach.addedDate ? { lastmod: breach.addedDate } : {}),
  };
}

/** Toutes les pages de fuite, pour le build (HTML, sitemap). */
export function allBreachPageMeta(breaches: Breach[], lang: Lang = 'fr'): BreachPageMeta[] {
  return [...breachSlugs(pageBreaches(breaches))].map(([slug, b]) => breachPageMeta(b, slug, lang));
}

/* ---------- Résumé pour l'accueil ---------- */

export interface CatalogSummary {
  fetchedOn: IsoDate | null;
  total: number;
  french: number;
  latest: {
    name: string;
    title: string;
    path: string;
    date: IsoDate;
    pwnCount: number;
    countUnit: 'comptes' | 'personnes';
    /** Types de données HIBP, non traduits : la page les affiche dans sa langue. */
    dataClasses: string[];
    risk: RiskLevel;
  }[];
}

/**
 * Les compteurs (total, french) sont ceux du catalogue HIBP, cité comme source ; les
 * dernières fuites incluent les fiches manuelles.
 */
export function catalogSummary(catalog: BreachCatalog, latest = 6, manual: Breach[] = []): CatalogSummary {
  const all = withManualBreaches(catalog.breaches, manual);
  const paths = breachPathsByName(all);
  return {
    fetchedOn: catalog.fetchedOn,
    total: catalog.breaches.length,
    french: pageBreaches(catalog.breaches).length,
    latest: pageBreaches(all)
      .slice(0, latest)
      .map((b) => ({
        name: b.name,
        title: b.title,
        path: paths.get(b.name)!,
        date: b.date,
        pwnCount: b.pwnCount,
        countUnit: countUnit(b),
        dataClasses: b.dataClasses,
        risk: breachRisk(b.dataClasses),
      })),
  };
}

/* ---------- Flux Atom ---------- */

const xml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Flux Atom des fuites françaises, par date d'ajout au catalogue HIBP (la plus
 * récente d'abord ; fiche manuelle : date où la fuite a été rendue publique) :
 * on s'abonne sans compte ni e-mail.
 */
export function breachFeed(catalog: BreachCatalog, siteUrl: string, limit = 30, lang: Lang = 'fr'): string {
  if (lang === 'en') return breachFeedEn(catalog, siteUrl, limit);
  const paths = breachPathsByName(catalog.breaches);
  const entries = pageBreaches(catalog.breaches)
    .map((b) => ({ b, added: b.addedDate ?? b.date }))
    .sort((x, y) => y.added.localeCompare(x.added))
    .slice(0, limit);
  const updated = `${entries[0]?.added ?? catalog.fetchedOn ?? '2026-01-01'}T00:00:00Z`;
  const items = entries.map(({ b, added }) => {
    const url = siteUrl + paths.get(b.name)!;
    const types = b.dataClasses.map((dc) => dataClassLabel(dc)).join(', ');
    const accounts = b.pwnCount > 0 ? ` ${count(b.pwnCount)} ${countUnit(b)}.` : '';
    return `  <entry>
    <title>${xml(`Fuite ${b.title} (${formatMonthFr(b.date)})`)}</title>
    <link href="${xml(url)}" />
    <id>${xml(url)}</id>
    <updated>${added}T00:00:00Z</updated>
    <summary>${xml(`Fuite du ${formatLongFr(b.date)}.${accounts} Données exposées : ${types}.`)}</summary>
  </entry>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">
  <title>ShredRGPD · Fuites de données en France</title>
  <subtitle>Fuites françaises du catalogue public Have I Been Pwned (CC BY 4.0) et quelques fuites absentes de ce catalogue, sourcées, avec la marche à suivre.</subtitle>
  <link href="${xml(siteUrl)}/fuites.xml" rel="self" />
  <link href="${xml(siteUrl)}/" />
  <id>${xml(siteUrl)}/fuites.xml</id>
  <updated>${updated}</updated>
${items.join('\n')}
</feed>
`;
}

/** Flux Atom en anglais : mêmes fuites, pages anglaises (/en/breach/…). */
function breachFeedEn(catalog: BreachCatalog, siteUrl: string, limit: number): string {
  const paths = breachPathsByName(catalog.breaches);
  const entries = pageBreaches(catalog.breaches)
    .map((b) => ({ b, added: b.addedDate ?? b.date }))
    .sort((x, y) => y.added.localeCompare(x.added))
    .slice(0, limit);
  const updated = `${entries[0]?.added ?? catalog.fetchedOn ?? '2026-01-01'}T00:00:00Z`;
  const items = entries.map(({ b, added }) => {
    const url = siteUrl + localizePath(paths.get(b.name)!, 'en');
    const types = b.dataClasses.map((dc) => dataClassLabel(dc, 'en')).join(', ');
    const accounts = b.pwnCount > 0 ? ` ${formatCount(b.pwnCount, 'en')} ${countUnitLabel(countUnit(b), 'en')}.` : '';
    return `  <entry>
    <title>${xml(`${b.title} data breach (${formatMonth(b.date, 'en')})`)}</title>
    <link href="${xml(url)}" />
    <id>${xml(url)}</id>
    <updated>${added}T00:00:00Z</updated>
    <summary>${xml(`Breach of ${formatLong(b.date, 'en')}.${accounts} Exposed data: ${types}.`)}</summary>
  </entry>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>ShredRGPD · Data breaches in France</title>
  <subtitle>French breaches from the public Have I Been Pwned catalogue (CC BY 4.0) and a few sourced breaches missing from it, with what to do.</subtitle>
  <link href="${xml(siteUrl)}/en/breaches.xml" rel="self" />
  <link href="${xml(siteUrl)}/en" />
  <id>${xml(siteUrl)}/en/breaches.xml</id>
  <updated>${updated}</updated>
${items.join('\n')}
</feed>
`;
}
