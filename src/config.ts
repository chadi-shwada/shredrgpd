/** Réglages du site, regroupés ici pour être modifiés en une ligne. */

/** Adresse publique du site (aperçus de partage, sitemap). */
export const SITE_URL = 'https://shredrgpd.fr';

/** Auteur, affiché dans le pied de page et les mentions légales. */
export const AUTHOR = { name: 'Cha4Sh', url: 'https://x.com/Cha4Sh' } as const;

/**
 * Lien vers le code source (dépôt public depuis le 6 octobre 2026). Avec null,
 * les liens « Code source » et la mention « code ouvert » sont masqués.
 */
export const SOURCE_CODE_URL: string | null = 'https://github.com/chadi-shwada/shredrgpd';

/**
 * Assistant ShredRGPD publié par l'auteur sur Grok Bot (service de xAI, hors du
 * site) : simple lien sortant depuis l'accueil, aucun script ni requête.
 */
export const ASSISTANT_URL = 'https://x.ai/bot/16GHz8N0fRrKUmdg9zU_h';

export const SITE_TITLE = "ShredRGPD · Demande l'effacement de tes données";
export const SITE_DESCRIPTION =
  'Vérifie ce qui a fuité et demande l’effacement de tes données personnelles avec une lettre RGPD. Gratuit, sans compte, sans cookie : tes données restent dans ton navigateur.';

export const SITE_TITLE_EN = 'ShredRGPD · Request the erasure of your data';
export const SITE_DESCRIPTION_EN =
  'See what leaked and request the erasure of your personal data with a GDPR letter. Free, no account, no cookie: your data stay in your browser.';
