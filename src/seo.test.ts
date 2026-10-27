import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTES } from './router';
import { EN_PATHS } from './lib/paths';
import {
  headTags,
  htmlFileName,
  NOT_FOUND,
  NOT_FOUND_EN,
  pageMeta,
  PAGES,
  PAGES_EN,
  sitemapXml,
  structuredData,
} from './seo';

describe('pages', () => {
  it('couvre exactement les routes de l’application', () => {
    expect(PAGES.map((p) => p.path).sort()).toEqual([...PUBLIC_ROUTES].sort());
  });

  it('a un titre et une description uniques', () => {
    expect(new Set(PAGES.map((p) => p.title)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((p) => p.description)).size).toBe(PAGES.length);
    for (const p of PAGES) expect(p.description.length).toBeLessThanOrEqual(200);
  });

  it('donne un fichier HTML par adresse', () => {
    expect(PAGES.map(htmlFileName)).toContain('verifier.html');
    expect(htmlFileName(PAGES[0]!)).toBe('index.html');
  });
});

describe('headTags', () => {
  it('chaque page est sa propre adresse canonique', () => {
    const tags = headTags(pageMeta('/verifier'));
    expect(tags).toContain('<link rel="canonical" href="https://shredrgpd.fr/verifier" />');
    expect(tags).toContain('<meta property="og:url" content="https://shredrgpd.fr/verifier" />');
    expect(tags).toContain('<title>Vérifier mes fuites · ShredRGPD</title>');
  });

  it("l'accueil pointe vers « / »", () => {
    expect(headTags(pageMeta('/'))).toContain('href="https://shredrgpd.fr/"');
  });

  it("la page 404 n'est pas indexée et n'a pas d'adresse canonique", () => {
    const tags = headTags(NOT_FOUND, { noindex: true });
    expect(tags).toContain('<meta name="robots" content="noindex" />');
    expect(tags).not.toContain('canonical');
    expect(pageMeta('/inconnue')).toBe(NOT_FOUND);
  });

  it('échappe les guillemets', () => {
    expect(headTags({ path: '/x', title: 'a"b', description: '<c>' })).toContain('content="a&quot;b"');
  });
});

describe('sitemap', () => {
  it('liste toutes les pages, sans la 404', () => {
    const xml = sitemapXml();
    for (const p of PAGES) expect(xml).toContain(`<loc>https://shredrgpd.fr${p.path}</loc>`);
    expect(xml).not.toContain('404');
  });

  it('utilise l’image propre à la page quand elle existe', () => {
    const tags = headTags({ path: '/fuite/free', title: 'Fuite Free', description: 'x', image: '/og/free.jpg' });
    expect(tags).toContain('content="https://shredrgpd.fr/og/free.jpg"');
    expect(tags).toContain('<meta property="og:image:alt" content="Fuite Free" />');
    expect(headTags(pageMeta('/'))).toContain('content="https://shredrgpd.fr/og.png"');
  });
});

describe('référencement', () => {
  it('ajoute la date de mise à jour des pages qui en ont une', () => {
    const xml = sitemapXml([{ path: '/fuite/free', title: 'Fuite Free', description: 'x', lastmod: '2024-10-19' }]);
    expect(xml).toContain('<url><loc>https://shredrgpd.fr/fuite/free</loc><lastmod>2024-10-19</lastmod></url>');
    expect(xml).toContain('<url><loc>https://shredrgpd.fr/verifier</loc></url>');
  });

  it('décrit le site et l’outil gratuit en JSON-LD, sur l’accueil seulement', () => {
    const block = structuredData();
    const json = JSON.parse(block.replace(/^<script type="application\/ld\+json">|<\/script>$/g, ''));
    expect(json['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(['WebSite', 'WebApplication']);
    expect(json['@graph'][1].offers.price).toBe('0');
    expect(block).not.toMatch(/<(?!script|\/script)/);
    expect(headTags(pageMeta('/'))).toContain('application/ld+json');
    expect(headTags(pageMeta('/verifier'))).not.toContain('application/ld+json');
    expect(headTags(NOT_FOUND, { noindex: true })).not.toContain('application/ld+json');
  });
});

describe('version anglaise', () => {
  it('traduit toutes les pages', () => {
    expect(PAGES_EN.length).toBe(PUBLIC_ROUTES.length);
    for (const route of PUBLIC_ROUTES) expect(pageMeta(route, 'en')).not.toBe(NOT_FOUND_EN);
  });

  it('a une page par adresse anglaise, en anglais', () => {
    expect(PAGES_EN.map((p) => p.path).sort()).toEqual(Object.values(EN_PATHS).sort());
    for (const p of PAGES_EN) expect(p.lang).toBe('en');
    expect(new Set(PAGES_EN.map((p) => p.title)).size).toBe(PAGES_EN.length);
    for (const p of PAGES_EN) expect(p.description.length).toBeLessThanOrEqual(200);
  });

  it('trouve la page anglaise par son chemin français', () => {
    expect(pageMeta('/verifier', 'en').path).toBe('/en/check');
    expect(pageMeta('/suivi', 'en').path).toBe('/en/tracker');
    expect(pageMeta('/inconnue', 'en')).toBe(NOT_FOUND_EN);
  });

  it('écrit en/check.html et en.html', () => {
    expect(htmlFileName(pageMeta('/verifier', 'en'))).toBe('en/check.html');
    expect(htmlFileName(pageMeta('/', 'en'))).toBe('en.html');
  });

  it('relie les deux versions (hreflang), le français par défaut', () => {
    for (const page of [pageMeta('/verifier'), pageMeta('/verifier', 'en')]) {
      const tags = headTags(page);
      expect(tags).toContain('<link rel="alternate" hreflang="fr" href="https://shredrgpd.fr/verifier" />');
      expect(tags).toContain('<link rel="alternate" hreflang="en" href="https://shredrgpd.fr/en/check" />');
      expect(tags).toContain('<link rel="alternate" hreflang="x-default" href="https://shredrgpd.fr/verifier" />');
    }
    expect(headTags(pageMeta('/', 'en'))).toContain('hreflang="fr" href="https://shredrgpd.fr/"');
    expect(headTags({ path: '/fuite/free', title: 'Fuite Free', description: 'x' })).toContain(
      'hreflang="en" href="https://shredrgpd.fr/en/breach/free"',
    );
    expect(headTags(NOT_FOUND, { noindex: true })).not.toContain('hreflang');
  });

  it('annonce la langue anglaise et sa propre adresse canonique', () => {
    const tags = headTags(pageMeta('/lettre', 'en'));
    expect(tags).toContain('<meta property="og:locale" content="en_GB" />');
    expect(tags).toContain('<link rel="canonical" href="https://shredrgpd.fr/en/letter" />');
    expect(headTags(pageMeta('/lettre'))).toContain('content="fr_FR"');
  });

  it("met les pages anglaises au sitemap et le JSON-LD anglais sur l'accueil anglais", () => {
    expect(sitemapXml()).toContain('<loc>https://shredrgpd.fr/en/check</loc>');
    const tags = headTags(pageMeta('/', 'en'));
    expect(tags).toContain('"inLanguage":"en-GB"');
    expect(tags).toContain('"url":"https://shredrgpd.fr/en"');
  });
});

describe('pages anglaises : image et flux', () => {
  it("utilisent l'image d'aperçu et le flux anglais", () => {
    const tags = headTags(pageMeta('/verifier', 'en'));
    expect(tags).toContain('content="https://shredrgpd.fr/og-en.png"');
    expect(tags).toContain('href="/en/breaches.xml"');
    expect(headTags(pageMeta('/verifier'))).toContain('href="/fuites.xml"');
  });
});
