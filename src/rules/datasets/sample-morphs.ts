import type { MorphDefinition } from '../../types/character.ts';
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

// Adapted from the Quick-Start Rules' NPC Stats, pp. 24–25. Health values
// describe these published examples. Player MP prices come from the core rules.
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
    morphPointsSource: { label: 'Core Bouncer cost', url: 'https://eclipsephase.github.io/en/04/22-common-biomorphs.html#bouncer' },
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
    morphPointsSource: { label: 'Core Case cost', url: 'https://eclipsephase.github.io/en/04/25-synthmorphs.html#case' },
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
    morphPointsSource: { label: 'Core Synth cost', url: 'https://eclipsephase.github.io/en/04/25-synthmorphs.html#synth' },
    source: source(25),
  },
  ...coreInfomorphs,
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
