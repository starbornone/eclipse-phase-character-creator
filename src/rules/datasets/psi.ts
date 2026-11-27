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

const chi = 1;
const gamma = 2;
const sleightLevels = {
  'Charisma': chi,
  'Control Behavior': chi,
  'Eco-Empathy': chi,
  'Enhanced Creativity': chi,
  'Enhanced Memory': chi,
  'Grok': chi,
  'Heightened Awareness': chi,
  'High Pain Threshold': chi,
  'Inner Spark': chi,
  'Pattern Recognition': chi,
  'Predictive Boost': chi,
  'Psi Armor': chi,
  'Qualia': chi,
  'Savant Calculation': chi,
  'Scramble': chi,
  'Self Control': chi,
  'Social Cunning': chi,
  'Somatic Control': chi,
  'Superior Kinesics': chi,
  'Xeno-Empathy': chi,
  'Alter Effect': gamma,
  'Animal Control': gamma,
  'Aphasia': gamma,
  'Basilisk Stare': gamma,
  'Block Pain': gamma,
  'Block Sense': gamma,
  'Block Skill': gamma,
  'Browse Thoughts': gamma,
  'Burst of Adrenaline': gamma,
  'Burst of Clarity': gamma,
  'Burst of Confidence': gamma,
  'Cloud Memory': gamma,
  'Deep Scan': gamma,
  'Deja Vu': gamma,
  'Downtime': gamma,
  'Ego Sense': gamma,
  'Empathic Scan': gamma,
  'Illusion': gamma,
  'Implant Memory': gamma,
  'Implant Skill': gamma,
  'Induce Error': gamma,
  'Infectious Mind': gamma,
  'Influence': gamma,
  'Invigorate': gamma,
  'Mimic': gamma,
  'Mindlink': gamma,
  'Neural Hardening': gamma,
  'Nightmare': gamma,
  'Pain': gamma,
  'Psi Shield': gamma,
  'Psychic Stab': gamma,
  'Sense Infection': gamma,
  'Short Circuit': gamma,
  'Spam': gamma,
  'Static': gamma,
  'Subliminal': gamma,
  'Tranquility': gamma,
} as const;

const sleight = (name: keyof typeof sleightLevels) => ({ name, minimumLevel: sleightLevels[name] });
export const psiSleights = Object.entries(sleightLevels).map(([name, minimumLevel]) => ({ name, minimumLevel }));
export const psiSleightTypes = { 1: 'Psi-chi', 2: 'Psi-gamma' } as const;

export const psiSubStrains = [
  {
    id: 'architect', name: 'The Architect',
    drawbacks: ['Bipolar Disorder', 'Insomnia', 'Paramnesia'],
    sleights: [sleight('Enhanced Creativity'), sleight('Grok'), sleight('Implant Skill')],
  },
  {
    id: 'beast', name: 'The Beast',
    drawbacks: ['ADHD', 'Anxiety', 'PTSD'],
    sleights: [sleight('High Pain Threshold'), sleight('Burst of Adrenaline'), sleight('Psychic Stab')],
  },
  {
    id: 'haunter', name: 'The Haunter',
    drawbacks: ['Addiction', 'Cosmic Anxiety Disorder', 'Paranoia'],
    sleights: [sleight('Heightened Awareness'), sleight('Infectious Mind'), sleight('Nightmare')],
  },
  {
    id: 'stranger', name: 'The Stranger',
    drawbacks: ['Disassociative Personality Disorder', 'Paramnesia', 'Paranoia'],
    sleights: [sleight('Superior Kinesics'), sleight('Basilisk Stare'), sleight('Subliminal')],
  },
  {
    id: 'xenomorph', name: 'The Xenomorph',
    drawbacks: ['Alien Behavioral Disorder', 'Atavism', 'Body Dysmorphia', 'Conversion Disorder'],
    sleights: [sleight('Somatic Control'), sleight('Eco-Empathy'), sleight('Xeno-Empathy')],
  },
] satisfies readonly { id: string; name: string; drawbacks: readonly string[]; sleights: readonly ReturnType<typeof sleight>[] }[];
