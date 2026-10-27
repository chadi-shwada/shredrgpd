import { describe, expect, it } from 'vitest';
import { EN_PATHS, hasEnglish, localizePath, resolvePath, UNKNOWN_EN_PATH } from './paths';

describe('adresses anglaises', () => {
  it('ramène une adresse anglaise au chemin français de la page', () => {
    expect(resolvePath('/en')).toEqual({ path: '/', lang: 'en' });
    expect(resolvePath('/en/check')).toEqual({ path: '/verifier', lang: 'en' });
    expect(resolvePath('/verifier')).toEqual({ path: '/verifier', lang: 'fr' });
  });

  it('une adresse en /en/… sans page anglaise est une page inconnue, en anglais', () => {
    expect(resolvePath('/en/suivi')).toEqual({ path: UNKNOWN_EN_PATH, lang: 'en' });
    expect(resolvePath('/en/breach')).toEqual({ path: UNKNOWN_EN_PATH, lang: 'en' });
    // « /entreprise » ne commence pas par le préfixe /en/.
    expect(resolvePath('/entreprise')).toEqual({ path: '/entreprise', lang: 'fr' });
  });

  it('écrit le lien dans la langue demandée, en gardant le fragment', () => {
    expect(localizePath('/lettre', 'en')).toBe('/en/letter');
    expect(localizePath('/verifier#parcours=mot-de-passe', 'en')).toBe('/en/check#parcours=mot-de-passe');
    expect(localizePath('/lettre', 'fr')).toBe('/lettre');
  });

  it('traduit les pages de fuite', () => {
    expect(resolvePath('/en/breach/free')).toEqual({ path: '/fuite/free', lang: 'en' });
    expect(localizePath('/fuite/free', 'en')).toBe('/en/breach/free');
    expect(hasEnglish('/fuite/free')).toBe(true);
  });

  it('garde le chemin tel quel pour une adresse inconnue', () => {
    expect(localizePath('/inconnue', 'en')).toBe('/inconnue');
    expect(hasEnglish('/inconnue')).toBe(false);
    expect(hasEnglish('/suivi')).toBe(true);
  });

  it('a des chemins anglais uniques, tous sous /en', () => {
    const en = Object.values(EN_PATHS);
    expect(new Set(en).size).toBe(en.length);
    for (const path of en) expect(path === '/en' || path.startsWith('/en/')).toBe(true);
    for (const [fr, path] of Object.entries(EN_PATHS)) expect(resolvePath(path).path).toBe(fr);
  });
});
