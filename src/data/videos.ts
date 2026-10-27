/**
 * Vidéo de présentation du site (public/videos/shred-presentation.*) : le
 * principe de ShredRGPD en 45 s, en animation (pas de démo pas à pas). Muette : le
 * texte est incrusté à l'image, repris ici pour les sous-titres et la
 * transcription.
 * Fuites réelles (catalogue Have I Been Pwned, chiffres du 5 octobre 2026),
 * personne fictive.
 * Les fichiers .mp4 sont produits hors du dépôt (animation HTML rendue image
 * par image avec Playwright) ; après une nouvelle version, régénérer le .vtt
 * depuis ce fichier (toVtt) et ajuster les temps.
 *
 * Version anglaise (PRESENTATION_EN) : mêmes images (texte incrusté en français), sous-titres
 * et transcription en anglais, mêmes temps (vérifié par videos.test.ts).
 */

import type { Lang } from '../lib/lang';
import type { Cue } from '../lib/vtt';

export interface Video {
  id: string;
  title: string;
  /** Durée lisible, affichée à côté du titre. */
  duration: string;
  src: string;
  poster: string;
  captions: string;
  /** Langue des sous-titres et de la transcription. */
  lang: Lang;
  cues: Cue[];
}

export const PRESENTATION: Video = {
  id: 'presentation',
  title: 'ShredRGPD en 45 secondes',
  duration: '45 s',
  src: '/videos/shred-presentation.mp4',
  poster: '/videos/shred-presentation.jpg',
  captions: '/videos/shred-presentation.vtt',
  lang: 'fr',
  cues: [
    {
      start: 0,
      end: 5,
      text: 'Tes données ont fuité. 1 039 fuites connues, dont 27 en France. Autour, des bribes de données masquées : e-mail, mot de passe, IBAN, date de naissance.',
    },
    {
      start: 5,
      end: 9.3,
      text: 'Un extrait de la fuite Deezer de 2019 passe au broyeur. ShredRGPD : demande l’effacement de tes données. Gratuit, sans compte, sans traceur.',
    },
    {
      start: 9.3,
      end: 16.1,
      step: '01. Vérifier',
      text: 'Vois ce qui a fuité. Cherche ton e-mail sur Have I Been Pwned, coche les fuites : Free, Deezer (logos des entreprises, marques de leurs propriétaires). Ton e-mail ne passe jamais par ShredRGPD.',
    },
    {
      start: 16.1,
      end: 23.6,
      step: '02. Écrire',
      text: 'Ta lettre RGPD, en 5 étapes, pré-remplie depuis la fuite Free, avec les bons articles du RGPD (17.1, 19, 34, 12.3). À copier, envoyer ou imprimer.',
    },
    {
      start: 23.6,
      end: 30.1,
      step: '03. Suivre',
      text: 'Le délai, calculé pour toi : l’entreprise a un mois pour répondre (article 12.3 du RGPD). Délai dépassé ? Relance prête, plainte CNIL.',
    },
    {
      start: 30.1,
      end: 35.6,
      step: 'Mot de passe',
      text: 'Teste-le sans le confier. Son empreinte SHA-1 est calculée dans ton navigateur ; seuls ses 5 premiers caractères partent vers Pwned Passwords. La comparaison se fait chez toi.',
    },
    {
      start: 35.6,
      end: 40.1,
      text: 'Tes données restent chez toi : 0 serveur applicatif, 0 traceur, 0 compte, 100 % dans ton navigateur.',
    },
    {
      start: 40.1,
      end: 45,
      text: 'Reprends le contrôle de tes données. shredrgpd.fr. Gratuit, sans compte. Modèles de lettres indicatifs, pas un conseil juridique.',
    },
  ],
};

export const PRESENTATION_EN: Video = {
  id: 'presentation-en',
  title: 'ShredRGPD in 45 seconds',
  duration: '45 s',
  src: '/videos/shred-presentation.mp4',
  poster: '/videos/shred-presentation.jpg',
  captions: '/videos/shred-presentation.en.vtt',
  lang: 'en',
  cues: [
    {
      start: 0,
      end: 5,
      text: 'Your data leaked. 1,039 known breaches, 27 of them in France. Around them, scraps of masked data: email, password, IBAN, date of birth.',
    },
    {
      start: 5,
      end: 9.3,
      text: 'An extract from the 2019 Deezer breach goes through the shredder. ShredRGPD: request the erasure of your data. Free, no account, no tracker.',
    },
    {
      start: 9.3,
      end: 16.1,
      step: '01. Check',
      text: 'See what leaked. Search for your email on Have I Been Pwned, tick the breaches: Free, Deezer (company logos, trademarks of their owners). Your email never goes through ShredRGPD.',
    },
    {
      start: 16.1,
      end: 23.6,
      step: '02. Write',
      text: 'Your GDPR letter, in 5 steps, pre-filled from the Free breach, with the right GDPR articles (17.1, 19, 34, 12.3). To copy, send or print.',
    },
    {
      start: 23.6,
      end: 30.1,
      step: '03. Track',
      text: 'The deadline, worked out for you: the company has one month to reply (Article 12(3) GDPR). Deadline passed? A reminder ready, a CNIL complaint.',
    },
    {
      start: 30.1,
      end: 35.6,
      step: 'Password',
      text: 'Test it without handing it over. Its SHA-1 hash is computed in your browser; only its first 5 characters go to Pwned Passwords. The comparison happens on your device.',
    },
    {
      start: 35.6,
      end: 40.1,
      text: 'Your data stay with you: 0 application server, 0 tracker, 0 account, 100% in your browser.',
    },
    {
      start: 40.1,
      end: 45,
      text: 'Take back control of your data. shredrgpd.fr. Free, no account. Indicative letter templates, not legal advice.',
    },
  ],
};

/** La vidéo de présentation dans la langue de la page. */
export function presentation(lang: Lang): Video {
  return lang === 'en' ? PRESENTATION_EN : PRESENTATION;
}
