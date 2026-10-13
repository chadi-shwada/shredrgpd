import { describe, expect, it } from 'vitest';
import { pageBreaches, breachSlugs } from '../lib/breachPages';
import { isValidIsoDate } from '../lib/dates';
import { BREACH_EDITORIAL } from './breachEditorial';
import { MANUAL_BREACHES } from './manualBreaches';

describe('fuites ajoutées à la main', () => {
  it.each(MANUAL_BREACHES.map((b) => [b.name, b] as const))('%s : fiche complète, texte et sources', (name, b) => {
    expect(b.manual).toBe(true);
    expect(b.french).toBe(true);
    expect(b.domain).not.toBe('');
    expect(isValidIsoDate(b.date)).toBe(true);
    expect(b.addedDate && b.addedDate >= b.date).toBe(true);
    // Sans texte ni sources, une fiche manuelle n'a rien qui la justifie.
    const editorial = BREACH_EDITORIAL[name];
    expect(editorial?.concerned?.length).toBeGreaterThan(0);
    expect(editorial?.sources.length).toBeGreaterThan(0);
  });

  it('ont chacune leur page', () => {
    const slugs = [...breachSlugs(pageBreaches(MANUAL_BREACHES)).keys()];
    expect(slugs.sort()).toEqual(['france-travail', 'sfr']);
  });

  it('ont des noms uniques', () => {
    const names = MANUAL_BREACHES.map((b) => b.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('textes rédigés', () => {
  it.each(Object.entries(BREACH_EDITORIAL))('%s : sources en https et date du relevé', (_, e) => {
    expect(isValidIsoDate(e.verifiedOn)).toBe(true);
    expect(e.sources.length).toBeGreaterThan(0);
    for (const s of e.sources) {
      expect(s.label.trim()).not.toBe('');
      expect(s.url).toMatch(/^https:\/\/[^\s]+$/);
    }
    for (const section of e.sections) expect(section.paragraphs.length).toBeGreaterThan(0);
  });

  it('respectent le style : tutoiement, sans « veuillez » ni « simplement »', () => {
    const text = JSON.stringify(BREACH_EDITORIAL);
    expect(text).not.toMatch(/veuillez|simplement/i);
  });
});
