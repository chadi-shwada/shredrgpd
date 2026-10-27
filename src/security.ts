/**
 * Politique de sécurité du contenu (CSP), source unique.
 *
 * connect-src n'autorise que deux destinations :
 * - api.pwnedpasswords.com, pour le test de mot de passe par k-anonymat (seuls 5
 *   caractères de l'empreinte SHA-1 partent, et seulement quand la personne lance le test) ;
 * - le chemin /_vercel/insights/ du site lui-même, pour la mesure d'audience sans cookie de
 *   Vercel, l'hébergeur (src/analytics.ts). Limité à ce chemin et au domaine de production :
 *   les aperçus de branche ne mesurent rien.
 * Toute autre requête réseau est bloquée par le navigateur (règle n° 1 du projet).
 *
 * - CSP_META est injectée dans index.html au build (vite.config.ts).
 * - CSP_HEADER est envoyée en en-tête HTTP par Vercel (vercel.json) ; elle ajoute
 *   frame-ancestors, que les navigateurs ignorent dans une balise <meta>.
 * security.test.ts vérifie que vercel.json reste aligné.
 */

import { SITE_URL } from './config';
import { PWNED_ORIGIN } from './lib/pwned';

/** Chemin des envois de Vercel Web Analytics, sur le domaine du site. */
export const ANALYTICS_ENDPOINT = `${SITE_URL}/_vercel/insights/`;

const DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${PWNED_ORIGIN} ${ANALYTICS_ENDPOINT}`,
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
];

export const CSP_META = DIRECTIVES.join('; ');

export const CSP_HEADER = [...DIRECTIVES, "frame-ancestors 'none'"].join('; ');
