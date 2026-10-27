import { PageHead } from '../components/PageHead';
import { useI18n } from '../i18n';

export function NotFound() {
  const { t, link } = useI18n();
  return (
    <>
      <PageHead
        eyebrow={t('Erreur 404', 'Error 404')}
        command={{
          input: t('shredrgpd ouvrir --page', 'shredrgpd open --page'),
          output: t('erreur 404 : introuvable', 'error 404: not found'),
        }}
        title={t("Cette page n'existe pas", 'This page does not exist')}
      >
        {t('Le lien est peut-être incomplet.', 'The link may be incomplete.')} 01000100 01100101 01101100.
      </PageHead>
      <div className="container page-body">
        <a className="btn btn--primary" href={link('/')}>
          {t("Retour à l'accueil", 'Back to the home page')}
        </a>
      </div>
    </>
  );
}
