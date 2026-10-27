/**
 * Version anglaise des textes rédigés des pages de fuite (src/data/breachEditorial.ts) :
 * mêmes faits, mêmes sources (en français), traduits paragraphe par paragraphe.
 * Même nombre de sections, de paragraphes, de questions et de sources que le français
 * (vérifié par manualBreaches.test.ts). Toute correction d'un fait se fait dans les deux.
 */

import type { BreachEditorial } from './breachEditorial';

export type BreachEditorialEn = Pick<BreachEditorial, 'concerned' | 'sections' | 'faq'> & {
  /** Libellés des sources, dans l'ordre du français (les adresses restent celles du français). */
  sourceLabels: string[];
};

export const BREACH_EDITORIAL_EN: Record<string, BreachEditorialEn> = {
  SFRFibre2026: {
    concerned: [
      'No website lets you check: this breach is not on Have I Been Pwned. On 20 August 2026, SFR notified the subscribers concerned, SFR and RED by SFR fibre customers. Also look in your spam folder, on the email address linked to your account.',
      'You received nothing but you have fibre with SFR or RED? Ask SFR what data it holds about you and what leaked: this is your right of access (Article 15 GDPR).',
    ],
    sections: [
      {
        heading: 'What happened',
        paragraphs: [
          'Someone used a hijacked legitimate account to get into an internal SFR tool used to manage fibre connections. SFR spotted the incident on 2 July 2026 and only notified its subscribers on 20 August. A hacker claims about 2.1 million lines; SFR has not given any figure.',
          'According to SFR’s letter, the data concerned are title, last name, first name, postal address, mobile number, contract ID and technical data about the line. According to SFR, neither passwords nor bank details are concerned.',
          'SFR notified the CNIL and filed a complaint with the public prosecutor.',
        ],
      },
      {
        heading: 'The real risk: the fake technician',
        paragraphs: [
          'With your name, address, number and contract ID, a scammer can call you pretending to be SFR or a fibre technician, and read your own details back to you to win your trust. The goal: get you to install remote-control software, read out a code received by text message or “settle an unpaid bill”.',
          'Never give out a code received by text message and do not install anything at a caller’s request. Hang up, then call SFR yourself on the number shown on your bill or in your customer account. Also be wary of “technician appointment” text messages containing a link.',
        ],
      },
      {
        heading: 'Which letter should you send to SFR?',
        paragraphs: [
          'You are still a customer: start with an access request (Article 15) to find out which of your data leaked. SFR has one month to reply. It may refuse to erase what it needs to provide your fibre service.',
          'You have left SFR: request erasure (Article 17). A former operator must not keep your file without a reason: in 2026, the CNIL fined Free Mobile, among other things, for keeping more than 15 million contracts terminated more than five years earlier.',
        ],
      },
    ],
    faq: [
      {
        q: 'Did my bank details leak at SFR?',
        a: 'According to SFR, no: neither passwords nor bank details are concerned. Still be wary of any call asking for your bank details (RIB) or a code received by text message.',
      },
      {
        q: 'Are RED by SFR customers affected?',
        a: 'Yes, RED by SFR fibre subscribers are among the customers notified by SFR.',
      },
      {
        q: 'How many customers are affected?',
        a: 'SFR has not said. The figure of 2.1 million lines comes from the hacker and has not been confirmed.',
      },
    ],
    sourceLabels: ['IT-Connect (in French)', 'Next (in French)', 'Journal du Geek, 21 August 2026 (in French)'],
  },

  FranceTravail2024: {
    concerned: [
      'This breach is not on Have I Been Pwned. According to the CNIL, it affects people registered as jobseekers at the time of the attack or during the previous 20 years, as well as people who had a candidate account on francetravail.fr.',
      'Have you been registered with Pôle emploi or France Travail since 2004? Assume that you are affected.',
    ],
    sections: [
      {
        heading: 'What happened',
        paragraphs: [
          'Between 6 February and 5 March 2024, attackers impersonated advisers from Cap emploi, the network that supports people with disabilities, to get into the France Travail information system. The public employment service announced it on 13 March 2024.',
          'The figure announced at the time, 43 million people, was later reduced to 36.8 million after removing duplicates.',
          'According to the CNIL, the leaked data are: last and first name, social security number, France Travail ID, email and postal addresses, phone number. France Travail also mentioned date of birth. Neither passwords nor bank details are concerned.',
        ],
      },
      {
        heading: 'The CNIL’s fine',
        paragraphs: [
          'On 22 January 2026, the CNIL fined France Travail €5 million for failing to ensure the security of the data (Article 32 GDPR). For a public body, the ceiling is €10 million. It also ordered it to fix its weaknesses, with a penalty of €5,000 per day of delay. France Travail did not challenge the fine.',
          'On 23 September 2026, the CNIL closed this order: France Travail had brought itself into compliance in time.',
        ],
      },
      {
        heading: 'The concrete risks',
        paragraphs: [
          'The social security number sets this breach apart: it cannot be changed. Together with your name and address, it makes fake messages from the Assurance maladie (health insurance), the CAF (family benefits) or France Travail credible (“update your file”, “refund pending”) and can be used to steal your identity.',
          'A message asking for your login details or your bank details (RIB) to “update your file” is suspicious: log in by typing francetravail.fr or ameli.fr yourself. Watch your statements, and file a complaint if a loan or contract is opened in your name.',
        ],
      },
      {
        heading: 'Which letter should you send to France Travail?',
        paragraphs: [
          'Send an access request (Article 15): you will find out what France Travail holds about you and what leaked. It has one month to reply.',
          'Erasure is limited: France Travail is a public service, and Article 17(3) GDPR allows it to refuse to erase what the law requires it to keep or what serves its mission. You can still request it for an old candidate account or data that are no longer used: it will have to reply and give reasons for any refusal.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many people are affected by the France Travail breach?',
        a: '36.8 million people, after removing duplicates. The first figure announced in March 2024 was 43 million.',
      },
      {
        q: 'Did my social security number leak?',
        a: 'Yes, if it was in your file: the CNIL lists it among the data concerned. It cannot be changed, which is why you should be wary of fake messages from the Assurance maladie.',
      },
      {
        q: 'Can I get my data erased by France Travail?',
        a: 'Not all of it: a public service may refuse to erase what the law requires it to keep (Article 17(3) GDPR). Start with an access request (Article 15).',
      },
    ],
    sourceLabels: [
      'CNIL, March 2024 (in French)',
      'Blog du Modérateur, March 2024 (in French)',
      'Siècle Digital, 29 January 2026 (in French)',
      'France Travail, press release of 29 January 2026 (in French)',
      'LexisVeille, closure of the order (September 2026, in French)',
    ],
  },

  FreeMobile: {
    sections: [
      {
        heading: 'What the CNIL held against Free',
        paragraphs: [
          'According to the CNIL, the attacker reached the data of 24 million subscriber contracts, including the IBAN of people who were customers of both Free and Free Mobile. The number shown above comes from Have I Been Pwned, which counts the email addresses found, not the contracts.',
          'In two decisions of 8 January 2026, published on 14 January, the CNIL imposed fines totalling €42 million: €27 million on Free Mobile and €15 million on Free, for insufficient security measures and an incomplete information email. Free Mobile was also fined for keeping more than 15 million contracts terminated more than five years earlier, some more than ten years earlier. Free announced an appeal to the Conseil d’État.',
        ],
      },
      {
        heading: 'Former customer? Now is the time to write',
        paragraphs: [
          'If you left Free, even long ago, your data may still have been there. Send an erasure request (Article 17) so that nothing is left.',
          'You are still a customer: first ask what leaked (Article 15). If your IBAN leaked, watch your direct debits. A direct debit you never authorised can be disputed with your bank up to 13 months after the debit; an authorised one, within 8 weeks. Nobody from Free or your bank will ask you for a code received by text message.',
        ],
      },
    ],
    faq: [
      {
        q: 'How much was Free ordered to pay for the 2024 breach?',
        a: '€42 million in total: €27 million for Free Mobile and €15 million for Free, in CNIL decisions of 8 January 2026. Free announced an appeal.',
      },
      {
        q: 'Did my IBAN leak at Free?',
        a: 'According to the CNIL, yes if you were a customer of both Free (internet box) and Free Mobile. Watch your direct debits and dispute with your bank any direct debit you did not authorise.',
      },
      {
        q: 'I am no longer a Free customer: are my data still kept?',
        a: 'Perhaps: the CNIL found more than 15 million contracts at Free Mobile that had been terminated more than five years earlier. Request erasure under Article 17 GDPR.',
      },
    ],
    sourceLabels: [
      'CNIL, €42M fine (January 2026, in French)',
      'Le Monde du Droit, January 2026 (in French)',
      'Univers Freebox, Free’s appeal (in French)',
      'Banque de France, disputed direct debits (13 months, 8 weeks)',
    ],
  },
};
