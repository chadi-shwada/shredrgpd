import { describe, expect, it } from 'vitest';
import { pageBreaches, breachSlugs } from '../lib/breachPages';
import { isValidIsoDate } from '../lib/dates';
import { dataClassLabel, MANUAL_EN } from '../lib/breaches';
import { BREACH_EDITORIAL } from './breachEditorial';
import { BREACH_EDITORIAL_EN } from './breachEditorial.en';
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

describe('textes rédigés en anglais', () => {
  it.each(Object.entries(BREACH_EDITORIAL))('%s : même structure que le français', (name, fr) => {
    const en = BREACH_EDITORIAL_EN[name];
    expect(en).toBeDefined();
    expect(en!.concerned?.length ?? 0).toBe(fr.concerned?.length ?? 0);
    expect(en!.sections.map((s) => s.paragraphs.length)).toEqual(fr.sections.map((s) => s.paragraphs.length));
    expect(en!.faq.length).toBe(fr.faq.length);
    expect(en!.sourceLabels.length).toBe(fr.sources.length);
  });

  it("n'a pas de texte anglais sans texte français", () => {
    expect(Object.keys(BREACH_EDITORIAL_EN).sort()).toEqual(Object.keys(BREACH_EDITORIAL).sort());
  });

  it('donne un libellé anglais à chaque type de données des fiches manuelles', () => {
    for (const b of MANUAL_BREACHES) {
      for (const dc of b.dataClasses) {
        // Type HIBP (traduit en français) ou type propre à la fiche (libellé anglais dans MANUAL_EN).
        expect(dataClassLabel(dc) !== dc || dc in MANUAL_EN).toBe(true);
      }
    }
  });
});
