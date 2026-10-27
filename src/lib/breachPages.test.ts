import { describe, expect, it } from 'vitest';
import {
  allBreachPageMeta,
  breachFeed,
  breachPageMeta,
  breachPathsByName,
  catalogSummary,
  findBreachBySlug,
  formatMonthFr,
  pageBreaches,
} from './breachPages';
import { parseCatalog, type Breach } from './breaches';

const entry = (o: Record<string, unknown>) => ({
  Domain: 'exemple.test',
  PwnCount: 1000,
  DataClasses: ['Email addresses', 'Names'],
  IsVerified: true,
  IsFrench: true,
  ...o,
});

const CATALOG = parseCatalog({
  fetchedOn: '2026-10-05',
  breaches: [
    entry({
      Name: 'FreeMobile',
      Title: 'Free',
      Domain: 'free.fr',
      BreachDate: '2024-10-17',
      AddedDate: '2024-11-01T00:00:00Z',
      PwnCount: 13926173,
      DataClasses: ['Bank account numbers', 'Names', 'Phone numbers'],
    }),
    entry({
      Name: 'LaPosteMobile',
      Title: 'La Poste Mobile',
      BreachDate: '2022-07-04',
      AddedDate: '2025-01-10T00:00:00Z',
    }),
    entry({ Name: 'Shop1', Title: 'Boutique', BreachDate: '2021-01-01' }),
    entry({ Name: 'Shop2', Title: 'Boutique', BreachDate: '2020-01-01' }),
    entry({ Name: 'Stealer', Title: 'Stealer logs', BreachDate: '2025-01-01', IsMalware: true }),
    entry({ Name: 'Etranger', Title: 'Ailleurs', BreachDate: '2026-01-01', IsFrench: false }),
    entry({ Name: 'Compilation', Title: 'French Citizens', BreachDate: '2024-09-25', Domain: '' }),
  ],
});

describe('pages de fuite', () => {
  it('ne garde que les fuites françaises avec une entreprise identifiée, les plus récentes d’abord', () => {
    expect(pageBreaches(CATALOG.breaches).map((b) => b.name)).toEqual([
      'FreeMobile',
      'LaPosteMobile',
      'Shop1',
      'Shop2',
    ]);
  });

  it('tire l’adresse du titre, et du nom HIBP quand deux titres se confondent', () => {
    expect([...breachPathsByName(CATALOG.breaches)]).toEqual([
      ['FreeMobile', '/fuite/free'],
      ['LaPosteMobile', '/fuite/la-poste-mobile'],
      ['Shop1', '/fuite/shop1'],
      ['Shop2', '/fuite/shop2'],
    ]);
    expect(findBreachBySlug(CATALOG.breaches, 'la-poste-mobile')?.name).toBe('LaPosteMobile');
    expect(findBreachBySlug(CATALOG.breaches, 'boutique')).toBeNull();
    expect(findBreachBySlug(CATALOG.breaches, 'stealer-logs')).toBeNull();
  });

  it('décrit la page avec les vraies métadonnées', () => {
    const meta = breachPageMeta(CATALOG.breaches[0]!, 'free');
    expect(meta.title).toBe('Fuite Free (oct. 2024) : que faire ? · ShredRGPD');
    // Intl sépare les milliers par une espace fine insécable.
    expect(meta.description).toMatch(/du 17 octobre 2024 : 13\s926\s173 comptes, numéros de compte bancaire, noms/);
    expect(allBreachPageMeta(CATALOG.breaches).map((m) => m.path)).toHaveLength(4);
  });

  it("ne promet pas de réponse de l'entreprise pour une fuite non vérifiée", () => {
    const unverified = { ...CATALOG.breaches[0]!, verified: false };
    expect(breachPageMeta(unverified, 'free').description).toContain("Fuite non confirmée par l'entreprise");
    expect(breachPageMeta(unverified, 'free').description).not.toContain('demande à l');
  });

  it('formate le mois en abrégé', () => {
    expect(formatMonthFr('2024-10-17')).toBe('oct. 2024');
    expect(formatMonthFr('2023-02-01')).toBe('févr. 2023');
  });
});

describe('résumé pour l’accueil', () => {
  it('compte les fuites et liste les plus récentes avec leur page', () => {
    const summary = catalogSummary(CATALOG, 2);
    expect(summary).toMatchObject({ fetchedOn: '2026-10-05', total: 7, french: 4 });
    expect(summary.latest.map((l) => [l.title, l.path, l.risk])).toEqual([
      ['Free', '/fuite/free', 'eleve'],
      ['La Poste Mobile', '/fuite/la-poste-mobile', 'faible'],
    ]);
  });
});

const MANUAL: Breach = {
  name: 'Manuelle2026',
  title: 'Manuelle',
  domain: 'manuelle.test',
  date: '2026-07-02',
  addedDate: '2026-08-20',
  pwnCount: 2_000_000,
  countUnit: 'personnes',
  dataClasses: ['Names'],
  verified: true,
  fabricated: false,
  sensitive: false,
  spamList: false,
  malware: false,
  french: true,
  manual: true,
};

describe('fuites ajoutées à la main', () => {
  it('entrent dans les dernières fuites, pas dans les compteurs HIBP', () => {
    const summary = catalogSummary(CATALOG, 2, [MANUAL]);
    expect(summary).toMatchObject({ total: 7, french: 4 });
    expect(summary.latest.map((l) => [l.path, l.countUnit])).toEqual([
      ['/fuite/manuelle', 'personnes'],
      ['/fuite/free', 'comptes'],
    ]);
  });

  it('comptent des personnes dans la description et le flux', () => {
    expect(breachPageMeta(MANUAL, 'manuelle').description).toMatch(/2\s000\s000 personnes/);
    const feed = breachFeed({ ...CATALOG, breaches: [...CATALOG.breaches, MANUAL] }, 'https://shred.test');
    expect(feed).toMatch(/2\s000\s000 personnes\./);
    expect(feed).toContain('<updated>2026-08-20T00:00:00Z</updated>');
  });
});

describe('flux Atom', () => {
  const feed = breachFeed(CATALOG, 'https://shred.test');

  it('classe les fuites par date d’ajout au catalogue', () => {
    const titles = [...feed.matchAll(/<entry>\s*<title>([^<]+)<\/title>/g)].map((m) => m[1]);
    expect(titles.slice(0, 2)).toEqual(['Fuite La Poste Mobile (juil. 2022)', 'Fuite Free (oct. 2024)']);
    expect(feed).toContain('<updated>2025-01-10T00:00:00Z</updated>');
    expect(feed).toContain('<link href="https://shred.test/fuite/free" />');
  });

  it('échappe le XML', () => {
    const odd = parseCatalog({ breaches: [entry({ Name: 'AB', Title: 'A & B <x>', BreachDate: '2024-01-01' })] });
    expect(breachFeed(odd, 'https://shred.test')).toContain('Fuite A &amp; B &lt;x&gt;');
  });
});

describe('version anglaise', () => {
  it('donne une page anglaise à chaque fuite, à son adresse /en/breach/…', () => {
    const fr = allBreachPageMeta(CATALOG.breaches);
    const en = allBreachPageMeta(CATALOG.breaches, 'en');
    expect(en.map((p) => p.path)).toEqual(fr.map((p) => p.path.replace('/fuite/', '/en/breach/')));
    const free = breachPageMeta(findBreachBySlug(CATALOG.breaches, 'free')!, 'free', 'en');
    expect(free.title).toBe('Free data breach (Oct 2024): what to do? · ShredRGPD');
    expect(free.description).toContain('13,926,173 accounts, bank account numbers, names, phone numbers');
  });

  it('a son flux Atom anglais, vers les pages anglaises', () => {
    const feed = breachFeed(CATALOG, 'https://shred.test', 30, 'en');
    expect(feed).toContain('xml:lang="en"');
    expect(feed).toContain('<title>Free data breach (Oct 2024)</title>');
    expect(feed).toContain('<link href="https://shred.test/en/breach/free" />');
    expect(feed).toContain('Exposed data: bank account numbers, names, phone numbers.');
    expect(feed).toContain('https://shred.test/en/breaches.xml');
  });
});
