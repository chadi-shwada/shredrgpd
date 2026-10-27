import { describe, expect, it } from 'vitest';
import { optedOut, stripUrl } from './analytics';

describe("mesure d'audience", () => {
  it("n'envoie que le chemin de la page, jamais la requête ni le fragment", () => {
    expect(stripUrl('https://shredrgpd.fr/lettre#site=exemple.test&donnees=email')).toBe('https://shredrgpd.fr/lettre');
    expect(stripUrl('https://shredrgpd.fr/verifier?x=1#parcours=mot-de-passe')).toBe('https://shredrgpd.fr/verifier');
    expect(stripUrl('https://shredrgpd.fr/en/check')).toBe('https://shredrgpd.fr/en/check');
  });

  it('respecte Global Privacy Control et Do Not Track', () => {
    expect(optedOut({ globalPrivacyControl: true })).toBe(true);
    expect(optedOut({ doNotTrack: '1' })).toBe(true);
    expect(optedOut({ doNotTrack: '0' })).toBe(false);
    expect(optedOut({})).toBe(false);
  });
});
