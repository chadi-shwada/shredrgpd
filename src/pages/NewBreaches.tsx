import summary from 'virtual:catalog-summary';
import { useState } from 'react';
import { copyText } from '../browser';
import { BreachMark } from '../components/BreachMark';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/PageHead';
import { SITE_URL } from '../config';
import { useI18n } from '../i18n';
import { formatMonth } from '../lib/breachPages';
import { FEED_PATH, FEED_PATH_EN } from '../seo';

const READERS = [
  {
    name: 'Feedly',
    url: 'https://feedly.com',
    text: 'dans le navigateur et sur mobile',
    en: 'in the browser and on mobile',
  },
  {
    name: 'Inoreader',
    url: 'https://www.inoreader.com',
    text: 'dans le navigateur et sur mobile',
    en: 'in the browser and on mobile',
  },
  {
    name: 'NetNewsWire',
    url: 'https://netnewswire.com',
    text: 'application libre pour Mac et iPhone',
    en: 'free and open-source app for Mac and iPhone',
  },
  {
    name: 'Thunderbird',
    url: 'https://www.thunderbird.net',
    text: 'messagerie libre, qui lit aussi les flux',
    en: 'open-source email app that also reads feeds',
  },
];

export function NewBreaches() {
  const { t, lang, link, localize } = useI18n();
  const [copied, setCopied] = useState<'ok' | 'ko' | null>(null);
  /** Flux Atom des fuites françaises, généré au build (vite.config.ts), dans la langue de la page. */
  const feedPath = lang === 'en' ? FEED_PATH_EN : FEED_PATH;
  const FEED_URL = SITE_URL + feedPath;

  const onCopy = async () => setCopied((await copyText(FEED_URL)) ? 'ok' : 'ko');

  return (
    <>
      <PageHead
        eyebrow={t('Nouvelles fuites', 'New breaches')}
        command={{
          input: t('shredrgpd suivre --fuites', 'shredrgpd follow --breaches'),
          output: t('flux Atom · sans compte', 'Atom feed · no account'),
        }}
        title={t('Suis les nouvelles fuites en France', 'Follow new breaches in France')}
      >
        {t(
          'Chaque fuite française ajoutée au catalogue Have I Been Pwned arrive dans ton lecteur de flux. Sans compte, sans e-mail : ShredRGPD ne sait pas qui le suit.',
          'Every French breach added to the Have I Been Pwned catalogue arrives in your feed reader. No account, no email: ShredRGPD does not know who follows it.',
        )}
      </PageHead>

      <div className="container page-body">
        <div className="content-grid">
          <div className="prose">
            <h2>{t("S'abonner en deux gestes", 'Subscribe in two steps')}</h2>
            <ol>
              <li>{t("Copie l'adresse du flux ci-dessous.", 'Copy the feed address below.')}</li>
              <li>
                {t(
                  "Colle-la dans ton lecteur de flux, à l'endroit prévu pour ajouter un abonnement.",
                  'Paste it into your feed reader, where you add a subscription.',
                )}
              </li>
            </ol>
            <div className="feed-url">
              <label htmlFor="feed-url">{t('Adresse du flux', 'Feed address')}</label>
              <div className="feed-url__row">
                <input id="feed-url" className="input" value={FEED_URL} readOnly onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn--primary" onClick={onCopy}>
                  <Icon name={copied === 'ok' ? 'check' : 'copy'} size={18} />
                  {copied === 'ok' ? t('Copiée', 'Copied') : t('Copier', 'Copy')}
                </button>
              </div>
              <p className="hint" role="status">
                {copied === 'ko' &&
                  t(
                    'La copie a échoué : sélectionne l’adresse et copie-la à la main.',
                    'Copying failed: select the address and copy it by hand.',
                  )}
              </p>
            </div>

            <h2>{t('Pas encore de lecteur de flux ?', 'No feed reader yet?')}</h2>
            <p>
              {t(
                'Un lecteur de flux rassemble les nouveautés des sites que tu suis, sans algorithme ni publicité. Quelques lecteurs gratuits :',
                'A feed reader gathers the latest posts from the websites you follow, with no algorithm and no ads. A few free readers:',
              )}
            </p>
            <ul>
              {READERS.map((r) => (
                <li key={r.name}>
                  <ExternalLink href={r.url}>{r.name}</ExternalLink>
                  {t(' : ', ': ')}
                  {t(r.text, r.en)}.
                </li>
              ))}
            </ul>
            <p className="small">
              {t(
                "Ces services n'ont aucun lien avec ShredRGPD. Le lecteur que tu choisis voit que tu suis ce flux, comme n'importe quel abonnement.",
                'These services have no connection with ShredRGPD. The reader you choose sees that you follow this feed, like any subscription.',
              )}
            </p>

            <h2>{t('Sans lecteur de flux', 'Without a feed reader')}</h2>
            {lang === 'en' ? (
              <p>
                On the <a href={link('/verifier')}>Check</a> page, at the step where you tick your breaches, the “Show
                me new breaches” button keeps the date of your visit in your browser. When you come back, ShredRGPD
                shows you the French breaches added since.
              </p>
            ) : (
              <p>
                Sur la page <a href={link('/verifier')}>Vérifier</a>, à l'étape où tu coches tes fuites, le bouton « Me
                signaler les nouvelles fuites » garde la date de ta visite dans ton navigateur. À ton retour, ShredRGPD
                te montre les fuites françaises ajoutées depuis.
              </p>
            )}
            <p className="small">
              {t('Tu cherches le fichier lui-même ? ', 'Looking for the file itself? ')}
              <a href={feedPath}>{feedPath.slice(feedPath.lastIndexOf('/') + 1)}</a>
              {t(
                " (format Atom, fait pour les lecteurs de flux : ton navigateur l'affiche en code brut).",
                ' (Atom format, made for feed readers: your browser shows it as raw code).',
              )}
            </p>
          </div>

          {summary.latest.length > 0 && (
            <aside className="breach-page__side" aria-labelledby="dernieres">
              <h2 id="dernieres">{t('Ce que contient le flux', 'What the feed contains')}</h2>
              <p className="small muted">{t('Les dernières fuites françaises :', 'The latest French breaches:')}</p>
              <ul className="breach-links">
                {summary.latest.map((b) => (
                  <li key={b.path}>
                    <span className="breach-links__name">
                      <BreachMark title={b.title} name={b.name} size="sm" />
                      <a href={localize(b.path)}>{b.title}</a>
                    </span>
                    <span className="hint">{formatMonth(b.date, lang)}</span>
                  </li>
                ))}
              </ul>
              <p className="small">
                <a href={link('/chiffres')}>{t('Toutes les fuites, en chiffres', 'All breaches, in figures')}</a>
              </p>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
