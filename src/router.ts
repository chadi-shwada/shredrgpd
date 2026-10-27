import { useSyncExternalStore } from 'react';
import type { Lang } from './lib/lang';
import { localizePath, resolvePath } from './lib/paths';

/**
 * Routage par chemin (/lettre, /verifier…) pour que chaque page soit indexable.
 *
 * Les paramètres de pré-remplissage (site, données exposées…) passent dans le
 * fragment (/lettre#site=…) et non dans la requête (?site=…) : le fragment n'est
 * jamais envoyé au serveur, donc rien n'apparaît dans les journaux de l'hébergeur.
 *
 * Les anciennes adresses en #/lettre?… restent valables (parseLocation).
 *
 * Version anglaise : les chemins en /en/… (src/lib/paths.ts) sont ramenés au chemin
 * français de la page (« /en/check » → « /verifier »), avec la langue dans la route.
 */

export type RoutePath =
  | '/'
  | '/verifier'
  | '/que-faire'
  | '/lettre'
  | '/suivi'
  | '/ressources'
  | '/chiffres'
  | '/nouvelles-fuites'
  | '/a-propos'
  | '/mentions-legales';

/** Toutes les routes, pour vérifier qu'elles ont chacune leurs métadonnées (seo.test.ts). */
export const PUBLIC_ROUTES: readonly RoutePath[] = [
  '/',
  '/verifier',
  '/que-faire',
  '/lettre',
  '/suivi',
  '/ressources',
  '/chiffres',
  '/nouvelles-fuites',
  '/a-propos',
  '/mentions-legales',
];

export interface Route {
  /** Chemin français de la page, qui sert d'identifiant (« /verifier », même sur /en/check). */
  path: string;
  query: URLSearchParams;
  lang: Lang;
}

const NAVIGATE = 'shred:navigate';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  window.addEventListener(NAVIGATE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(NAVIGATE, onChange);
  };
}

function snapshot(): string {
  return window.location.pathname + window.location.hash;
}

/** Chemin rendu hors navigateur (pré-rendu des pages au build, scripts/prerender.mjs). */
let serverLocation = '/';

export function setServerLocation(path: string): void {
  serverLocation = path;
}

function normalizePath(path: string): string {
  const clean = `/${path.replace(/^\/+/, '')}`.replace(/\/+$/, '');
  return clean || '/';
}

/** Lit le chemin et le fragment ; gère les anciennes adresses « #/page?param ». */
export function parseLocation(pathname: string, hash: string): Route {
  const fragment = hash.replace(/^#/, '');
  if (fragment.startsWith('/')) {
    const [legacyPath = '/', search = ''] = fragment.split('?');
    return { path: normalizePath(legacyPath), query: new URLSearchParams(search), lang: 'fr' };
  }
  const { path, lang } = resolvePath(normalizePath(pathname));
  return { path, query: new URLSearchParams(fragment), lang };
}

export function useRoute(): Route {
  const location = useSyncExternalStore(subscribe, snapshot, () => serverLocation);
  const hashIndex = location.indexOf('#');
  return hashIndex === -1
    ? parseLocation(location, '')
    : parseLocation(location.slice(0, hashIndex), location.slice(hashIndex));
}

/** Adresse d'une page, dans la langue demandée si elle y existe (sinon en français). */
export function href(path: RoutePath, query?: Record<string, string>, lang: Lang = 'fr'): string {
  const search = query ? new URLSearchParams(query).toString() : '';
  return `${localizePath(path, lang)}${search ? `#${search}` : ''}`;
}

export function navigate(url: string, { replace = false } = {}): void {
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAVIGATE));
}

/** Convertit une ancienne adresse « #/page?param » en « /page#param », sans recharger. */
export function upgradeLegacyUrl(): void {
  const { pathname, hash } = window.location;
  if (!hash.startsWith('#/')) return;
  const route = parseLocation(pathname, hash);
  const search = route.query.toString();
  navigate(`${route.path}${search ? `#${search}` : ''}`, { replace: true });
}

/**
 * Identifiant d'ancre du fragment (« #donnees-personnelles » → « donnees-personnelles »), ou null
 * si le fragment porte des paramètres (« #site=… », « #annee=2024 ») ou une ancienne adresse (« #/… »).
 */
export function anchorId(hash: string): string | null {
  const id = hash.replace(/^#/, '');
  return /^[a-z][a-z0-9-]*$/i.test(id) ? id : null;
}

/** Lien vers une page de l'application, et pas vers un fichier (/fuites.xml, /videos/…mp4). */
export function isAppLink(raw: string): boolean {
  if (!raw.startsWith('/') || raw.startsWith('//')) return false;
  const path = raw.split(/[?#]/)[0] ?? '';
  return !/\.[a-z0-9]+$/i.test(path);
}

/**
 * Intercepte les clics sur les liens internes pour naviguer sans recharger la page.
 * Laisse passer les liens externes, les nouveaux onglets et les touches de modification.
 */
export function interceptLinks(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = (event.target as Element | null)?.closest?.('a');
  if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
  const raw = anchor.getAttribute('href');
  if (!raw || !isAppLink(raw)) return;
  event.preventDefault();
  const before = window.location.pathname;
  navigate(raw);
  if (window.location.pathname !== before) return;
  // Lien vers la page ouverte : comme sans JavaScript, on va à l'ancre, ou en haut s'il n'y a pas de fragment.
  const hash = raw.includes('#') ? raw.slice(raw.indexOf('#')) : '';
  const id = anchorId(hash);
  if (id) document.getElementById(id)?.scrollIntoView();
  else if (!hash) window.scrollTo(0, 0);
}
