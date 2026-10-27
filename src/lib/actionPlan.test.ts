import { describe, expect, it } from 'vitest';
import { buildActionPlan, loadDone } from './actionPlan';

describe('buildActionPlan', () => {
  it("retire l'étape « écrire » sur demande (fuite non confirmée)", () => {
    expect(buildActionPlan(['Passwords']).map((i) => i.id)).toContain('ecrire');
    expect(buildActionPlan(['Passwords'], { write: false }).map((i) => i.id)).not.toContain('ecrire');
  });

  it('adapte les actions aux données exposées, sans doublon', () => {
    const ids = buildActionPlan(['Email addresses', 'Passwords', 'Password hints', 'Credit cards']).map((i) => i.id);
    expect(ids).toEqual(['mdp-changer', 'mdp-2fa', 'mdp-unique', 'email-hameconnage', 'banque', 'ecrire']);
  });

  it("propose toujours d'écrire aux entreprises, et rien sans données", () => {
    expect(buildActionPlan(['Genders']).map((i) => i.id)).toEqual(['ecrire']);
    expect(buildActionPlan([])).toEqual([]);
  });

  it("couvre l'usurpation d'identité", () => {
    const plan = buildActionPlan(['Social security numbers']);
    expect(plan[0]?.detail).toContain('116\u00a0006');
  });
});

describe('loadDone', () => {
  it('relit les cases cochées et résiste aux données abîmées', () => {
    expect(loadDone('["banque","ecrire"]')).toEqual(['banque', 'ecrire']);
    expect(loadDone('{oups')).toEqual([]);
    expect(loadDone('[1,"ok"]')).toEqual(['ok']);
    expect(loadDone(null)).toEqual([]);
  });
});

describe('buildActionPlan en anglais', () => {
  it('garde les mêmes actions, traduites, avec des liens vers les pages anglaises', () => {
    const classes = [
      'Email addresses',
      'Passwords',
      'Phone numbers',
      'Credit cards',
      'Social security numbers',
      'Names',
    ];
    const fr = buildActionPlan(classes);
    const en = buildActionPlan(classes, { lang: 'en' });
    expect(en.map((i) => i.id)).toEqual(fr.map((i) => i.id));
    for (const [i, item] of en.entries()) {
      expect(item.title).not.toBe(fr[i]!.title);
      expect(Boolean(item.link)).toBe(Boolean(fr[i]!.link));
    }
    expect(en.find((i) => i.id === 'mdp-unique')?.link?.href).toBe('/en/check#parcours=mot-de-passe');
    expect(en.find((i) => i.id === 'tel-33700')?.link?.href).toBe('/en/what-to-do');
    expect(en.find((i) => i.id === 'identite')?.detail).toContain('116 006');
  });
});
