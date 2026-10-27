/**
 * Langue de la page (tirée de l'adresse par le routeur, posée par App) et petits
 * outils pour écrire le texte des deux langues côte à côte :
 *
 *   const { t, link } = useI18n();
 *   t('Vérifier mes fuites', 'Check my breaches');
 *   link('/lettre', { type: 'acces' }); // « /en/letter#type=acces » en anglais
 */

import { createContext, useContext, type ReactNode } from 'react';
import { pick, type Lang } from './lib/lang';
import { hasEnglish } from './lib/paths';
import { href, type RoutePath } from './router';

const LangContext = createContext<Lang>('fr');

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export interface I18n {
  lang: Lang;
  /** Le texte (ou le JSX) de la langue de la page. */
  t: <T>(fr: T, en: T) => T;
  /** Lien vers une page, dans la langue de la page si elle y existe. */
  link: (path: RoutePath, query?: Record<string, string>) => string;
  /** La page liée n'existe qu'en français alors que la page est en anglais. */
  frenchOnly: (path: RoutePath) => boolean;
}

export function useI18n(): I18n {
  const lang = useLang();
  return {
    lang,
    t: (fr, en) => pick(lang, fr, en),
    link: (path, query) => href(path, query, lang),
    frenchOnly: (path) => lang === 'en' && !hasEnglish(path),
  };
}

/**
 * Marque discrète « FR » après un lien anglais qui mène à une page en français.
 * Le texte lu par les lecteurs d'écran est « (in French) ». `hidden` : seulement pour eux
 * (menu de l'en-tête, où la place manque).
 */
export function FrenchTag({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return <span className="visually-hidden"> (in French)</span>;
  return (
    <span className="lang-tag">
      <span aria-hidden="true">FR</span>
      <span className="visually-hidden"> (in French)</span>
    </span>
  );
}
