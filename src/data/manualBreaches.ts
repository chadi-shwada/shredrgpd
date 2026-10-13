import type { Breach } from '../lib/breaches';

/**
 * Fuites françaises absentes de Have I Been Pwned, ajoutées à la main pour avoir leur page
 * (/fuite/sfr…). Métadonnées publiques seulement (règle n° 2), chacune avec ses sources et
 * son texte dans src/data/breachEditorial.ts (vérifié par manualBreaches.test.ts).
 *
 * Elles ont une page, entrent dans le flux et dans les dernières fuites de l'accueil, mais pas
 * dans les chiffres (/chiffres), la recherche ni les compteurs, qui restent ceux du catalogue HIBP.
 * Si HIBP publie la même fuite (même domaine, dates proches), sa fiche prend le relais
 * (withManualBreaches).
 *
 * Types de données : noms HIBP quand ils existent (traduits par dataClassLabel), sinon en
 * français. date : jour de la fuite (ou fin de l'intrusion) ; addedDate : jour où elle a été
 * rendue publique.
 */
const manual = (
  b: Omit<Breach, 'fabricated' | 'sensitive' | 'spamList' | 'malware' | 'french' | 'manual'>,
): Breach => ({
  ...b,
  fabricated: false,
  sensitive: false,
  spamList: false,
  malware: false,
  french: true,
  manual: true,
});

export const MANUAL_BREACHES: Breach[] = [
  manual({
    name: 'SFRFibre2026',
    title: 'SFR',
    domain: 'sfr.fr',
    date: '2026-07-02',
    addedDate: '2026-08-20',
    // SFR n'a donné aucun chiffre ; les 2,1 millions de lignes sont une revendication.
    pwnCount: 0,
    dataClasses: [
      'Salutations',
      'Names',
      'Physical addresses',
      'Phone numbers',
      'identifiants de contrat',
      'données techniques de la ligne',
    ],
    verified: true,
  }),
  manual({
    name: 'FranceTravail2024',
    title: 'France Travail',
    domain: 'francetravail.fr',
    date: '2024-03-05',
    addedDate: '2024-03-13',
    pwnCount: 36_800_000,
    countUnit: 'personnes',
    dataClasses: [
      'Names',
      'Dates of birth',
      'Social security numbers',
      'identifiants France Travail',
      'Email addresses',
      'Physical addresses',
      'Phone numbers',
    ],
    verified: true,
  }),
];
