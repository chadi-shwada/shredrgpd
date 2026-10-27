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
import { localizePath } from './lib/paths';
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
  /** Lien vers une page, dans la langue de la page. */
  link: (path: RoutePath, query?: Record<string, string>) => string;
  /** Chemin interne déjà écrit (« /fuite/free », « /verifier#parcours=… ») dans la langue de la page. */
  localize: (path: string) => string;
}

export function useI18n(): I18n {
  const lang = useLang();
  return {
    lang,
    t: (fr, en) => pick(lang, fr, en),
    link: (path, query) => href(path, query, lang),
    localize: (path) => localizePath(path, lang),
  };
}

/**
 * Marque discrète « FR » après un lien de la version anglaise vers un site externe en
 * français (33700, Signal Spam, sources de presse…). Lue « (in French) ».
 */
export function FrenchTag() {
  return (
    <span className="lang-tag">
      <span aria-hidden="true">FR</span>
      <span className="visually-hidden"> (in French)</span>
    </span>
  );
}
