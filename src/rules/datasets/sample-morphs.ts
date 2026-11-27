import type { MorphDefinition } from '../../types/character.ts';
import { corePhysicalMorphs, corePhysicalMorphSource, slowWalk, standardSynthWare, standardWalk } from './core-physical-morphs.ts';
import { coreInfomorphs } from './infomorphs.ts';

export const quickStartRules = {
  title: 'Eclipse Phase Second Edition Quick-Start Rules',
  version: '2.4',
  publisher: 'Posthuman Studios, LLC',
  publisherUrl: 'https://eclipsephase.com/',
  url: 'https://eclipsephase.com/wp-content/uploads/2024/02/PS10001_EclipsePhaseSecondEdition_QuickStartRulesAcrimony_Nov2023.pdf',
  license: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
} as const;

export function quickStartPageUrl(printedPage: number) {
  // The cover is the first PDF page and precedes the printed page numbering.
  return `${quickStartRules.url}#page=${printedPage + 1}`;
}

const source = (page: number) => ({ label: `Quick-Start Rules, p. ${page}`, url: quickStartPageUrl(page) });

// Core player profiles, Common Biomorphs and Synthmorphs, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
// The Quick-Start NPC examples also use these health values.
export const sampleMorphs: readonly MorphDefinition[] = [
  {
    id: 'bouncer',
    name: 'Bouncer',
    category: 'Biomorph',
    description: 'A biological sleeve suited to work in low gravity.',
    durability: 35,
    woundThreshold: 7,
    deathRating: 53,
    morphPoints: 4,
    availability: 60,
    morphPointsSource: corePhysicalMorphSource('Biomorph', 'bouncer'),
    includedTraits: [{ id: 'limberness', level: 1 }],
    pools: { insight: 1, moxie: 0, vigor: 1, flex: 2 },
    includedWare: ['Biomods', 'Cold Tolerance', 'Cortical Stack', 'Grip Pads', 'Mesh Inserts', 'Oxygen Reserve', 'Prehensile Feet'],
    movement: [slowWalk],
    source: source(24),
  },
  {
    id: 'case',
    name: 'Case',
    category: 'Synthmorph',
    description: 'A lightweight synthetic sleeve with a lower durability rating.',
    durability: 25,
    woundThreshold: 5,
    deathRating: 50,
    morphPoints: 0,
    availability: 100,
    morphPointsSource: corePhysicalMorphSource('Synthmorph', 'case'),
    includedTraits: [{ id: 'exotic-morphology', level: 1 }, { id: 'inherent-flaws', level: 1 }],
    pools: { insight: 0, moxie: 0, vigor: 0, flex: 0 },
    includedWare: standardSynthWare,
    movement: [slowWalk],
    armor: '6/4',
    source: source(25),
  },
  {
    id: 'synth',
    name: 'Synth',
    category: 'Synthmorph',
    description: 'A general-purpose synthetic sleeve with a more durable frame.',
    durability: 40,
    woundThreshold: 8,
    deathRating: 80,
    morphPoints: 3,
    availability: 80,
    morphPointsSource: corePhysicalMorphSource('Synthmorph', 'synth'),
    includedTraits: [{ id: 'exotic-morphology', level: 1 }],
    pools: { insight: 0, moxie: 0, vigor: 1, flex: 1 },
    includedWare: standardSynthWare,
    movement: [standardWalk],
    armor: '6/4',
    source: source(25),
  },
  ...coreInfomorphs,
  ...corePhysicalMorphs,
];

// Preserve names and health values from existing prototype sleeve records.
const legacyMorphs: readonly MorphDefinition[] = [
  {
    id: 'survey-sleeve',
    name: 'Survey Sleeve',
    category: 'Biomorph',
    description: 'A biological field sleeve for surveying habitats and unfamiliar terrain.',
    durability: 30,
  },
  {
    id: 'vector-frame',
    name: 'Vector Frame',
    category: 'Synthmorph',
    description: 'A lightweight synthetic frame built for precise movement in microgravity.',
    durability: 35,
  },
  {
    id: 'industrial-frame',
    name: 'Industrial Frame',
    category: 'Synthmorph',
    description: 'A reinforced synthetic body designed for heavy exterior maintenance.',
    durability: 45,
  },
];

export function findSampleMorph(id: string | undefined) {
  return sampleMorphs.find((morph) => morph.id === id) ?? legacyMorphs.find((morph) => morph.id === id);
}
