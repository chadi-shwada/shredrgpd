/**
 * Langues du site : français (adresses d'origine) et anglais (adresses en /en/…).
 * Logique pure, sans React : le contexte React est dans src/i18n.tsx.
 */

export type Lang = 'fr' | 'en';

export function isLang(value: unknown): value is Lang {
  return value === 'fr' || value === 'en';
}

/** Le texte de la langue demandée. */
export function pick<T>(lang: Lang, fr: T, en: T): T {
  return lang === 'en' ? en : fr;
}

/** Code de langue pour Intl (nombres, dates). */
export function locale(lang: Lang): string {
  return lang === 'en' ? 'en-GB' : 'fr-FR';
}
