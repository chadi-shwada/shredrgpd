import type { ReactNode } from 'react';
import { useLang } from '../i18n';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Lien sortant, sans référent ni accès à la fenêtre d'origine. */
export function ExternalLink({ href, children, className, title }: ExternalLinkProps) {
  const lang = useLang();
  return (
    <a href={href} className={className} title={title} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden">{lang === 'en' ? ' (new tab)' : ' (nouvel onglet)'}</span>
    </a>
  );
}
