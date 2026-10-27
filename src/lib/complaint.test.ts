import { describe, expect, it } from 'vitest';
import { cnilDossier, complaintSummary } from './complaint';
import type { TrackedRequest } from './tracking';

const req: TrackedRequest = {
  id: 'a',
  site: 'exemple.test',
  kind: 'effacement',
  channel: 'email',
  sentOn: '2026-01-31',
  status: 'relancee',
  notes: 'Ticket 42',
};

describe('complaintSummary', () => {
  const text = complaintSummary(req, '2026-04-02');

  it('rappelle la demande, son fondement et l’échéance de l’article 12.3', () => {
    expect(text).toContain('Organisme concerné : exemple.test');
    expect(text).toContain("Le 31 janvier 2026, j'ai adressé à cet organisme une demande d'effacement");
    expect(text).toContain("l'article 17 du RGPD");
    expect(text).toContain('expirait le 28 février 2026');
    expect(text).toContain("Je l'ai relancé");
    expect(text).toContain('Précisions : Ticket 42');
  });

  it('décrit une opposition', () => {
    const t = complaintSummary({ ...req, kind: 'opposition' }, '2026-04-02');
    expect(t).toContain("une opposition au traitement de mes données personnelles, fondée sur l'article 21 du RGPD");
  });

  it('tient compte de la prolongation et de l’accès', () => {
    const t = complaintSummary({ ...req, kind: 'acces', status: 'prolongee', notes: '' }, '2026-06-01');
    expect(t).toContain("l'article 15 du RGPD");
    expect(t).toContain('expirait le 30 avril 2026');
    expect(t).not.toContain('Précisions');
  });
});

describe('cnilDossier', () => {
  it('rassemble le récapitulatif, les lettres et les pièces à joindre', () => {
    const text = cnilDossier(
      { ...req, letters: [{ date: '2026-01-31', subject: "Demande d'effacement", body: 'Madame, Monsieur…' }] },
      '2026-04-02',
    );
    expect(text).toContain('Organisme concerné : exemple.test');
    expect(text).toContain('LETTRES ENVOYÉES (1)');
    expect(text).toContain("--- 31 janvier 2026 : Demande d'effacement ---");
    expect(text).toContain('Madame, Monsieur…');
    expect(text).toContain('PIÈCES À JOINDRE');
  });

  it('signale l’absence de copie', () => {
    expect(cnilDossier(req, '2026-04-02')).toContain('Aucune copie gardée');
  });
});

describe('récapitulatif en anglais', () => {
  const text = complaintSummary(req, '2026-04-02', 'en');

  it('reprend les mêmes faits, en anglais', () => {
    expect(text).toContain('Organisation concerned: exemple.test');
    expect(text).toContain(
      'On 31 January 2026, I sent this organisation a request for the erasure of my personal data',
    );
    expect(text).toContain('based on Article 17 of the GDPR');
    expect(text).toContain('Article 12(3) of the GDPR expired on 28 February 2026');
    expect(text).toContain('I sent a reminder');
    expect(text).toContain('Details: Ticket 42');
    expect(text).not.toMatch(/organisme|RGPD/);
  });

  it('prépare le dossier complet en anglais', () => {
    const dossier = cnilDossier(req, '2026-04-02', 'en');
    expect(dossier.startsWith('CNIL COMPLAINT FILE')).toBe(true);
    expect(dossier).toContain('LETTERS SENT (0)');
    expect(dossier).toContain('DOCUMENTS TO ATTACH');
  });
});
