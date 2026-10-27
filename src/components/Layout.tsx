import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AUTHOR, SOURCE_CODE_URL } from '../config';
import { useI18n } from '../i18n';
import { EN_PREFIX, hasEnglish, localizePath } from '../lib/paths';
import type { RoutePath } from '../router';
import { ExternalLink } from './ExternalLink';
import { FooterWord } from './FooterWord';
import { Icon } from './Icon';
import { Logo } from './Logo';

const NAV: { path: RoutePath; label: string; en: string }[] = [
  { path: '/verifier', label: 'Vérifier', en: 'Check' },
  { path: '/lettre', label: 'Écrire une lettre', en: 'Write a letter' },
  { path: '/suivi', label: 'Suivi', en: 'Tracker' },
  { path: '/que-faire', label: 'Que faire ?', en: 'What to do?' },
  { path: '/chiffres', label: 'Chiffres', en: 'Figures' },
  { path: '/ressources', label: 'Ressources', en: 'Resources' },
];

/**
 * Lien vers l'autre langue : la même page si elle est traduite, sinon l'accueil de
 * l'autre langue.
 */
function LanguageSwitch({ path }: { path: string }) {
  const { lang } = useI18n();
  if (lang === 'en') {
    const target = hasEnglish(path) ? path : '/';
    return (
      <a className="lang-switch" href={target} hrefLang="fr" lang="fr" aria-label="Version française">
        FR
      </a>
    );
  }
  const target = hasEnglish(path) ? localizePath(path, 'en') : EN_PREFIX;
  return (
    <a className="lang-switch" href={target} hrefLang="en" lang="en" aria-label="English version">
      EN
    </a>
  );
}

interface LayoutProps {
  path: string;
  children: ReactNode;
}

export function Layout({ path, children }: LayoutProps) {
  const { t, link } = useI18n();
  /** Lien de pied de page, marqué « FR » depuis une page anglaise s'il mène à une page française. */
  const footerLink = (to: RoutePath, label: string, anchor = '') => <a href={link(to) + anchor}>{label}</a>;
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Ferme le menu mobile à chaque changement de page.
  const [lastPath, setLastPath] = useState(path);
  if (lastPath !== path) {
    setLastPath(path);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Barre de navigation détachée et arrondie dès que la page défile.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const skipToContent = (event: MouseEvent) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#contenu" onClick={skipToContent}>
        {t('Aller au contenu', 'Skip to content')}
      </a>
      <header className="site-header theme-dark" data-scrolled={scrolled}>
        <div className="container site-header__inner">
          <a
            className="brand"
            href={link('/')}
            aria-label={t('ShredRGPD, outil français, accueil', 'ShredRGPD, a French tool, home')}
          >
            <Logo />
            <span className="brand__flag" aria-hidden="true" title={t('Fait en France', 'Made in France')} />
          </a>
          <button
            type="button"
            className="btn btn--ghost btn--sm nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
            <span>Menu</span>
          </button>
          <nav
            id="navigation"
            className="nav-wrap"
            data-open={menuOpen}
            aria-label={t('Navigation principale', 'Main navigation')}
          >
            <ul className="nav">
              {NAV.map((item) => (
                <li key={item.path}>
                  <a href={link(item.path)} aria-current={path === item.path ? 'page' : undefined}>
                    {t(item.label, item.en)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitch path={path} />
          <a className="btn btn--primary btn--sm header-cta" href={link('/lettre')}>
            {t('Écrire ma lettre', 'Write my letter')}
          </a>
        </div>
      </header>

      <main id="contenu" ref={mainRef} tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer theme-dark">
        <div className="container">
          <div className="site-footer__grid">
            <div className="site-footer__brand">
              <a className="brand" href={link('/')} aria-label={t('ShredRGPD, accueil', 'ShredRGPD, home')}>
                <Logo />
              </a>
              <p>
                {t(
                  'Outil gratuit pour exercer tes droits RGPD face aux sites qui exposent des données issues de fuites.',
                  'A free tool to exercise your GDPR rights against websites and companies that expose data from breaches.',
                )}
              </p>
            </div>
            <div className="site-footer__cols">
              <div>
                <h2>{t('Outil', 'Tool')}</h2>
                <ul>
                  <li>{footerLink('/verifier', t('Vérifier mes fuites', 'Check my breaches'))}</li>
                  <li>{footerLink('/lettre', t('Écrire une lettre', 'Write a letter'))}</li>
                  <li>{footerLink('/suivi', t('Suivi', 'Tracker'))}</li>
                  <li>{footerLink('/nouvelles-fuites', t('Suivre les nouvelles fuites', 'Follow new breaches'))}</li>
                </ul>
              </div>
              <div>
                <h2>{t('Comprendre', 'Learn')}</h2>
                <ul>
                  <li>{footerLink('/que-faire', t('Que faire ?', 'What to do?'))}</li>
                  <li>{footerLink('/ressources', t('Ressources', 'Resources'))}</li>
                  <li>{footerLink('/chiffres', t('Les fuites en chiffres', 'Breaches in figures'))}</li>
                  <li>{footerLink('/a-propos', t('À propos', 'About'))}</li>
                  <li>
                    <ExternalLink href={AUTHOR.url}>
                      {t('Une erreur, une idée ? Écris-moi', 'A mistake, an idea? Write to me')}
                    </ExternalLink>
                  </li>
                </ul>
              </div>
              <div>
                <h2>{t('Légal', 'Legal')}</h2>
                <ul>
                  <li>{footerLink('/mentions-legales', t('Mentions légales', 'Legal notice'))}</li>
                  <li>
                    {footerLink(
                      '/mentions-legales',
                      t('Données personnelles', 'Personal data'),
                      '#donnees-personnelles',
                    )}
                  </li>
                  <li>
                    {footerLink('/mentions-legales', t('Licences et crédits', 'Licences and credits'), '#licences')}
                  </li>
                  {SOURCE_CODE_URL && (
                    <li>
                      <a href={SOURCE_CODE_URL} rel="noopener noreferrer">
                        {t('Code source (licence MIT)', 'Source code (MIT licence)')}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="site-footer__legal">
            <a href={`${link('/mentions-legales')}#responsabilite`}>
              {t('Modèles indicatifs, pas un conseil juridique.', 'Indicative templates, not legal advice.')}
            </a>
            <span>
              {t('Conçu avec ❤️ par ', 'Made with ❤️ by ')}
              <ExternalLink href={AUTHOR.url}>{AUTHOR.name}</ExternalLink>
              {t(" et l'IA · © 2026", ' and AI · © 2026')}
            </span>
            <span>{t('Ce que tu saisis reste dans ton navigateur.', 'What you type stays in your browser.')}</span>
          </div>
        </div>
        <FooterWord />
      </footer>
    </>
  );
}
