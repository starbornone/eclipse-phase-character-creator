// Eclipse Phase Second Edition, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
export const psiTrait = {
  id: 'psi', name: 'Psi', cpByLevel: [2, 4],
  effect: 'Unlocks the Psi skill and psi-chi sleights. Level 2 also unlocks psi-gamma sleights.',
} as const;

export const psiSkill = 'Psi';
export const psiSkillId = 'active:Psi';
export const infectionRatingPerLevel = 10;
export const psiSubStrainsSource = 'https://eclipsephase.github.io/en/14/02-watts-macleod-sub-strains.html';
export const psiSleightsSource = 'https://eclipsephase.github.io/en/14/06-psi-sleight-summaries.html';

const sleight = (name: string, minimumLevel: 1 | 2 = 1) => ({ name, minimumLevel });

export const psiSubStrains = [
  {
    id: 'architect', name: 'The Architect',
    drawbacks: ['Bipolar Disorder', 'Insomnia', 'Paramnesia'],
    sleights: [sleight('Enhanced Creativity'), sleight('Grok'), sleight('Implant Skill', 2)],
  },
  {
    id: 'beast', name: 'The Beast',
    drawbacks: ['ADHD', 'Anxiety', 'PTSD'],
    sleights: [sleight('High Pain Threshold'), sleight('Burst of Adrenaline', 2), sleight('Psychic Stab', 2)],
  },
  {
    id: 'haunter', name: 'The Haunter',
    drawbacks: ['Addiction', 'Cosmic Anxiety Disorder', 'Paranoia'],
    sleights: [sleight('Heightened Awareness'), sleight('Infectious Mind', 2), sleight('Nightmare', 2)],
  },
  {
    id: 'stranger', name: 'The Stranger',
    drawbacks: ['Disassociative Personality Disorder', 'Paramnesia', 'Paranoia'],
    sleights: [sleight('Superior Kinesics'), sleight('Basilisk Stare', 2), sleight('Subliminal', 2)],
  },
  {
    id: 'xenomorph', name: 'The Xenomorph',
    drawbacks: ['Alien Behavioral Disorder', 'Atavism', 'Body Dysmorphia', 'Conversion Disorder'],
    sleights: [sleight('Somatic Control'), sleight('Eco-Empathy'), sleight('Xeno-Empathy')],
  },
] satisfies readonly { id: string; name: string; drawbacks: readonly string[]; sleights: readonly ReturnType<typeof sleight>[] }[];
