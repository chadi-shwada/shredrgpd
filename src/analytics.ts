/**
 * Mesure d'audience : Vercel Web Analytics (paquet @vercel/analytics, licence MIT).
 * Choix de l'auteur du 27 octobre 2026 : savoir si le site est visité et par combien
 * de personnes.
 *
 * - Sans cookie : selon Vercel, un visiteur est reconnu par une empreinte calculée à partir
 *   de la requête, remise à zéro chaque jour, sans suivi d'un site à l'autre.
 * - Le script et les envois restent sur le domaine du site (/_vercel/insights/…), traités
 *   par Vercel, déjà hébergeur. La CSP n'autorise que ce chemin (src/security.ts).
 * - Seulement en production : en développement, le paquet chargerait un script depuis
 *   va.vercel-scripts.com (requête externe).
 * - L'adresse envoyée est réduite au chemin : rien de ce qui suit « ? » ou « # », où vivent
 *   les données de pré-remplissage d'une lettre (site, données exposées…).
 * - Rien n'est envoyé si le navigateur demande de ne pas être suivi (Global Privacy
 *   Control ou Do Not Track) : c'est le moyen de s'y opposer, indiqué dans les mentions légales.
 */

import { inject } from '@vercel/analytics';

/** Adresse sans requête ni fragment (« https://shredrgpd.fr/lettre#site=x » → « https://shredrgpd.fr/lettre »). */
export function stripUrl(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

/** La personne a-t-elle demandé à ne pas être suivie ? */
export function optedOut(nav: { doNotTrack?: string | null; globalPrivacyControl?: boolean }): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

export function startAnalytics(): void {
  if (!import.meta.env.PROD || typeof window === 'undefined') return;
  if (optedOut(navigator as Navigator & { globalPrivacyControl?: boolean })) return;
  inject({
    mode: 'production',
    beforeSend: (event) => ({ ...event, url: stripUrl(event.url) }),
  });
}
