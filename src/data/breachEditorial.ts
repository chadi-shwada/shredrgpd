/**
 * Texte rédigé pour certaines pages de fuite (/fuite/<slug>), en plus du gabarit commun,
 * indexé par le nom de la fuite (nom HIBP, ou nom de la fiche manuelle de manualBreaches.ts).
 *
 * Chaque fait vient d'une source publique listée dans `sources` (CNIL, organisme concerné,
 * presse), avec la date du relevé (vérifié par manualBreaches.test.ts). Pas de fait sans source :
 * dans le doute, on retire la phrase.
 */

import type { IsoDate } from '../lib/dates';

export interface BreachEditorial {
  /** Jour où les faits ont été relevés dans les sources. */
  verifiedOn: IsoDate;
  /** Remplace « Es-tu concerné ? » (recherche sur HIBP) pour une fuite absente de HIBP. */
  concerned?: string[];
  sections: { heading: string; paragraphs: string[] }[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
}

export const BREACH_EDITORIAL: Record<string, BreachEditorial> = {
  SFRFibre2026: {
    verifiedOn: '2026-10-13',
    concerned: [
      "Aucun site ne permet de le vérifier : cette fuite n'est pas sur Have I Been Pwned. SFR a prévenu les abonnés concernés le 20 août 2026, clients fibre SFR et RED by SFR. Regarde aussi dans tes courriers indésirables, sur l'adresse e-mail liée à ton compte.",
      "Tu n'as rien reçu mais tu as la fibre chez SFR ou RED ? Demande à SFR ce qu'il détient sur toi et ce qui a fuité : c'est ton droit d'accès (article 15 du RGPD).",
    ],
    sections: [
      {
        heading: "Ce qui s'est passé",
        paragraphs: [
          "Quelqu'un a utilisé un compte légitime détourné pour entrer dans un outil interne de SFR qui sert à gérer les raccordements fibre. SFR a repéré l'incident le 2 juillet 2026 et n'a prévenu ses abonnés que le 20 août. Un pirate revendique environ 2,1 millions de lignes ; SFR n'a donné aucun chiffre.",
          "D'après le courrier de SFR, les données concernées sont la civilité, le nom, le prénom, l'adresse postale, le numéro de mobile, l'identifiant de contrat et des données techniques de la ligne. Selon SFR, ni les mots de passe ni les informations bancaires ne sont concernés.",
          'SFR a notifié la CNIL et porté plainte auprès du procureur de la République.',
        ],
      },
      {
        heading: 'Le vrai risque : le faux technicien',
        paragraphs: [
          "Avec ton nom, ton adresse, ton numéro et ton identifiant de contrat, un escroc peut t'appeler en se faisant passer pour SFR ou pour un technicien fibre, et te réciter tes propres informations pour gagner ta confiance. Le but : te faire installer un logiciel de prise en main à distance, te faire lire un code reçu par SMS ou te faire « régler un impayé ».",
          "Ne donne jamais un code reçu par SMS et n'installe rien à la demande d'un appelant. Raccroche, puis rappelle toi-même SFR au numéro indiqué sur ta facture ou dans ton espace client. Méfie-toi aussi des SMS de « rendez-vous technicien » avec un lien.",
        ],
      },
      {
        heading: 'Quelle lettre envoyer à SFR ?',
        paragraphs: [
          "Tu es encore client : commence par une demande d'accès (article 15) pour savoir quelles données te concernant ont fuité. SFR a un mois pour répondre. Il peut refuser d'effacer ce dont il a besoin pour te fournir la fibre.",
          "Tu as quitté SFR : demande l'effacement (article 17). Un ancien opérateur ne doit pas garder ton dossier sans raison : en 2026, la CNIL a sanctionné Free Mobile entre autres pour avoir gardé plus de 15 millions de contrats résiliés depuis plus de cinq ans.",
        ],
      },
    ],
    faq: [
      {
        q: 'Mes coordonnées bancaires ont-elles fuité chez SFR ?',
        a: 'Selon SFR, non : ni les mots de passe ni les informations bancaires ne sont concernés. Méfie-toi quand même de tout appel qui te demande ton RIB ou un code reçu par SMS.',
      },
      {
        q: 'Les clients RED by SFR sont-ils concernés ?',
        a: 'Oui, les abonnés fibre RED by SFR font partie des clients prévenus par SFR.',
      },
      {
        q: 'Combien de clients sont touchés ?',
        a: "SFR ne l'a pas dit. Le chiffre de 2,1 millions de lignes vient du pirate et n'a pas été confirmé.",
      },
    ],
    sources: [
      {
        label: 'IT-Connect',
        url: 'https://www.it-connect.fr/sfr-fuite-donnees-abonnes-fibre-nova/',
      },
      {
        label: 'Next',
        url: 'https://next.ink/215573/fuite-de-donnees-confirmee-chez-sfr-liee-au-raccordement-fibre/',
      },
      {
        label: 'Journal du Geek, 21 août 2026',
        url: 'https://www.journaldugeek.com/2026/08/21/sfr-encore-pirate-21-millions-de-lignes-fibre-dans-la-nature-voici-ce-que-vous-risquez/',
      },
    ],
  },

  FranceTravail2024: {
    verifiedOn: '2026-10-13',
    concerned: [
      "Cette fuite n'est pas sur Have I Been Pwned. Selon la CNIL, elle touche les personnes inscrites comme demandeurs d'emploi au moment de l'attaque ou au cours des 20 années précédentes, ainsi que celles qui avaient un espace candidat sur francetravail.fr.",
      'Tu as été inscrit à Pôle emploi ou à France Travail depuis 2004 ? Pars du principe que tu en fais partie.',
    ],
    sections: [
      {
        heading: "Ce qui s'est passé",
        paragraphs: [
          "Entre le 6 février et le 5 mars 2024, des attaquants ont usurpé l'identité de conseillers Cap emploi, le réseau qui accompagne les personnes en situation de handicap, pour entrer dans le système d'information de France Travail. L'organisme l'a annoncé le 13 mars 2024.",
          'Le chiffre annoncé alors, 43 millions de personnes, a ensuite été ramené à 36,8 millions après suppression des doublons.',
          'Selon la CNIL, ont fuité : nom et prénom, numéro de sécurité sociale, identifiant France Travail, adresses e-mail et postale, numéro de téléphone. France Travail citait aussi la date de naissance. Ni les mots de passe ni les coordonnées bancaires ne sont concernés.',
        ],
      },
      {
        heading: 'La sanction de la CNIL',
        paragraphs: [
          "Le 22 janvier 2026, la CNIL a infligé 5 millions d'euros d'amende à France Travail pour ne pas avoir assuré la sécurité des données (article 32 du RGPD). Pour un organisme public, le plafond est de 10 millions d'euros. Elle lui a aussi ordonné de corriger ses failles, sous astreinte de 5 000 € par jour de retard. France Travail n'a pas contesté la sanction.",
          "Le 23 septembre 2026, la CNIL a clos cette injonction : France Travail s'est mis en conformité dans les délais.",
        ],
      },
      {
        heading: 'Les risques concrets',
        paragraphs: [
          "Le numéro de sécurité sociale rend cette fuite à part : il ne se change pas. Avec ton nom et ton adresse, il rend crédibles de faux messages de l'Assurance maladie, de la CAF ou de France Travail (« mettez à jour votre dossier », « remboursement en attente ») et peut servir à usurper ton identité.",
          'Un message qui te demande tes identifiants ou ton RIB pour « mettre à jour ton dossier » est suspect : connecte-toi en tapant toi-même francetravail.fr ou ameli.fr. Surveille tes relevés, et porte plainte si un crédit ou un contrat est ouvert à ton nom.',
        ],
      },
      {
        heading: 'Quelle lettre envoyer à France Travail ?',
        paragraphs: [
          "Envoie une demande d'accès (article 15) : tu sauras ce que France Travail détient sur toi et ce qui a fuité. Il a un mois pour répondre.",
          "L'effacement est limité : France Travail est un service public, et l'article 17.3 du RGPD lui permet de refuser d'effacer ce que la loi l'oblige à garder ou ce qui sert sa mission. Tu peux quand même le demander pour un ancien espace candidat ou des données qui ne servent plus : il devra te répondre et motiver un refus.",
        ],
      },
    ],
    faq: [
      {
        q: 'Combien de personnes sont touchées par la fuite France Travail ?',
        a: '36,8 millions de personnes, après suppression des doublons. Le premier chiffre annoncé en mars 2024 était de 43 millions.',
      },
      {
        q: 'Mon numéro de sécurité sociale a-t-il fuité ?',
        a: "Oui, s'il figurait dans ton dossier : la CNIL le cite parmi les données concernées. Il ne se change pas, d'où l'importance de se méfier des faux messages de l'Assurance maladie.",
      },
      {
        q: 'Puis-je faire effacer mes données de France Travail ?',
        a: "Pas toutes : un service public peut refuser d'effacer ce que la loi l'oblige à garder (article 17.3 du RGPD). Commence par une demande d'accès (article 15).",
      },
    ],
    sources: [
      {
        label: 'CNIL, mars 2024',
        url: 'https://www.cnil.fr/fr/france-travail-la-cnil-enquete-sur-la-fuite-de-donnees-et-donne-des-conseils-pour-se-proteger',
      },
      {
        label: 'Blog du Modérateur, mars 2024',
        url: 'https://www.blogdumoderateur.com/france-travail-victime-cyberattaque-quelles-donnees-concernees/',
      },
      {
        label: 'Siècle Digital, 29 janvier 2026',
        url: 'https://siecledigital.fr/2026/01/29/france-travail-sanctionne-apres-une-fuite-massive-de-donnees/',
      },
      {
        label: 'France Travail, communiqué du 29 janvier 2026',
        url: 'https://www.francetravail.org/files/live/sites/peorg/files/documents/Communiqu%C3%A9%20de%20presse/2026/20260129%20-%20FRANCE%20TRAVAIL%20-%20CP%20-%20France%20Travail%20prend%20acte%20de%20la%20sanction%20de%20la%20CNIL.pdf',
      },
      {
        label: 'LexisVeille, clôture de l’injonction (septembre 2026)',
        url: 'https://www.lexisveille.fr/node/82346',
      },
    ],
  },

  FreeMobile: {
    verifiedOn: '2026-10-13',
    sections: [
      {
        heading: 'Ce que la CNIL a reproché à Free',
        paragraphs: [
          "Selon la CNIL, l'attaquant a touché les données de 24 millions de contrats d'abonnés, avec l'IBAN des personnes clientes à la fois de Free et de Free Mobile. Le nombre affiché plus haut vient de Have I Been Pwned, qui compte les adresses e-mail retrouvées et non les contrats.",
          "Par deux décisions du 8 janvier 2026, publiées le 14 janvier, la CNIL a infligé 42 millions d'euros d'amende : 27 millions à Free Mobile et 15 millions à Free, pour des mesures de sécurité insuffisantes et un e-mail d'information incomplet. Free Mobile est aussi sanctionnée pour avoir gardé plus de 15 millions de contrats résiliés depuis plus de cinq ans, certains depuis plus de dix ans. Free a annoncé un recours devant le Conseil d'État.",
        ],
      },
      {
        heading: "Ancien client ? C'est le moment d'écrire",
        paragraphs: [
          "Si tu as quitté Free, même il y a longtemps, tes données étaient peut-être encore là. Envoie une demande d'effacement (article 17) pour qu'il n'en reste rien.",
          "Tu es encore client : demande d'abord ce qui a fuité (article 15). Si ton IBAN a fuité, surveille tes prélèvements. Un prélèvement que tu n'as jamais autorisé se conteste auprès de ta banque jusqu'à 13 mois après le débit ; un prélèvement autorisé, dans les 8 semaines. Personne de Free ni de ta banque ne te demandera un code reçu par SMS.",
        ],
      },
    ],
    faq: [
      {
        q: 'Combien Free a-t-il été condamné à payer pour la fuite de 2024 ?',
        a: "42 millions d'euros au total : 27 millions pour Free Mobile et 15 millions pour Free, par décisions de la CNIL du 8 janvier 2026. Free a annoncé un recours.",
      },
      {
        q: 'Mon IBAN a-t-il fuité chez Free ?',
        a: "Selon la CNIL, oui si tu étais client à la fois de Free (box) et de Free Mobile. Surveille tes prélèvements et conteste auprès de ta banque tout prélèvement que tu n'as pas autorisé.",
      },
      {
        q: 'Je ne suis plus client Free, mes données sont-elles encore conservées ?',
        a: "Peut-être : la CNIL a trouvé chez Free Mobile plus de 15 millions de contrats résiliés depuis plus de cinq ans. Demande l'effacement avec l'article 17 du RGPD.",
      },
    ],
    sources: [
      { label: 'CNIL, sanction de 42 M€ (janvier 2026)', url: 'https://www.cnil.fr/sanction-free-2026' },
      {
        label: 'Le Monde du Droit, janvier 2026',
        url: 'https://www.lemondedudroit.fr/pi-tic/300-protection-de-la-vie-privee/102523-vol-de-donnees-free-sanctionne-a-hauteur-de-42-millions-d-euros.html',
      },
      {
        label: 'Univers Freebox, recours de Free',
        url: 'https://www.universfreebox.com/article/590333/fuite-de-donnees-apres-lamende-de-42-millions-deuros-free-denonce-une-sanction-dune-severite-inedite-et-annonce-un-recours',
      },
      {
        label: 'Banque de France, prélèvements contestés (13 mois, 8 semaines)',
        url: 'https://www.banque-france.fr/en/node/415078',
      },
    ],
  },
};
