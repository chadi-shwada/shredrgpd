/**
 * Adresses de la version anglaise. Les pages gardent leur chemin français comme
 * identifiant interne (« /verifier ») ; la version anglaise a ses propres chemins
 * (« /en/check »). Une page sans version anglaise reste en français : ses liens
 * depuis une page anglaise mènent à la page française.
 *
 * Logique pure, partagée par le routeur, le build (pages HTML, sitemap, hreflang)
 * et les modules qui écrivent des liens (plan d'action).
 */

import type { Lang } from './lang';

export const EN_PREFIX = '/en';

/** Chemin français → chemin anglais, pour les pages traduites. */
export const EN_PATHS: Readonly<Record<string, string>> = {
  '/': '/en',
  '/verifier': '/en/check',
  '/que-faire': '/en/what-to-do',
  '/lettre': '/en/letter',
};

const FR_BY_EN: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(EN_PATHS).map(([fr, en]) => [en, fr]),
);

/** La page existe-t-elle en anglais ? */
export function hasEnglish(path: string): boolean {
  return path in EN_PATHS;
}

/** Adresse anglaise inconnue : la page 404 la reçoit. */
export const UNKNOWN_EN_PATH = '/en/404';

/**
 * Lit un chemin publié : « /en/check » → page « /verifier » en anglais.
 * Un chemin en /en/… sans page anglaise donne une page inconnue (404), en anglais.
 */
export function resolvePath(pathname: string): { path: string; lang: Lang } {
  if (pathname !== EN_PREFIX && !pathname.startsWith(`${EN_PREFIX}/`)) return { path: pathname, lang: 'fr' };
  return { path: FR_BY_EN[pathname] ?? UNKNOWN_EN_PATH, lang: 'en' };
}

/**
 * Chemin publié d'une page dans une langue : « /verifier » → « /en/check » en anglais.
 * Sans version anglaise, le chemin français. Le fragment (« #parcours=… ») est gardé.
 */
export function localizePath(target: string, lang: Lang): string {
  if (lang === 'fr') return target;
  const cut = target.search(/[?#]/);
  const path = cut === -1 ? target : target.slice(0, cut);
  const rest = cut === -1 ? '' : target.slice(cut);
  const en = EN_PATHS[path];
  return en ? en + rest : target;
}
