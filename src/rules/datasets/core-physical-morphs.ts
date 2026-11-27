import type { MorphDefinition, MorphMovement } from '../../types/character.ts';

// Eclipse Phase Second Edition, Common Biomorphs and Synthmorphs, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
const commonBiomorphs = 'https://eclipsephase.github.io/en/04/22-common-biomorphs.html';
const synthmorphs = 'https://eclipsephase.github.io/en/04/25-synthmorphs.html';

export const synthCharacteristicsSource = `${synthmorphs}#synthmorph-characteristics`;
export const synthEnvironmentCapabilities = ['Cold Tolerance', 'Vacuum Sealing'];

export function corePhysicalMorphSource(category: 'Biomorph' | 'Synthmorph', id: string) {
  return { label: 'Core morph profile', url: `${category === 'Biomorph' ? commonBiomorphs : synthmorphs}#${id}` };
}

export const slowWalk: MorphMovement = { mode: 'Walker', base: 4, full: 12 };
export const standardWalk: MorphMovement = { mode: 'Walker', base: 4, full: 20 };
const basicBioware = ['Biomods', 'Cortical Stack', 'Mesh Inserts'];
const basicShellWare = ['Access Jacks', 'Cyberbrain', 'Mesh Inserts', 'Mnemonics', 'Puppet Sock'];
export const standardSynthWare = [...basicShellWare, 'Cortical Stack', 'Lidar'].sort();

export const corePhysicalMorphs: readonly MorphDefinition[] = [
  {
    id: 'flat', name: 'Flat', category: 'Biomorph', description: 'An unmodified human sleeve.',
    durability: 30, woundThreshold: 6, deathRating: 45, morphPoints: 0, availability: 30,
    pools: { insight: 0, moxie: 0, vigor: 0, flex: 0 }, movement: [standardWalk],
    includedWare: [], includedTraits: [], commonExtras: ['Genetic Defect trait'],
    source: corePhysicalMorphSource('Biomorph', 'flat'),
  },
  {
    id: 'splicer', name: 'Splicer', category: 'Biomorph', description: 'A general-purpose human sleeve with standard genetic enhancements.',
    durability: 30, woundThreshold: 6, deathRating: 45, morphPoints: 1, availability: 90,
    pools: { insight: 0, moxie: 0, vigor: 0, flex: 1 }, movement: [standardWalk],
    includedWare: basicBioware, includedTraits: [], source: corePhysicalMorphSource('Biomorph', 'splicer'),
  },
  {
    id: 'ruster', name: 'Ruster', category: 'Biomorph', description: 'A human sleeve adapted to the cold and thin atmosphere of Mars.',
    durability: 35, woundThreshold: 7, deathRating: 53, morphPoints: 3, availability: 70,
    pools: { insight: 0, moxie: 1, vigor: 1, flex: 1 }, movement: [standardWalk],
    includedWare: ['Biomods', 'Cold Tolerance', 'Cortical Stack', 'Enhanced Respiration', 'Mesh Inserts', 'Radiation Sense'],
    includedTraits: [], commonExtras: ['Planned Obsolescence trait'], source: corePhysicalMorphSource('Biomorph', 'ruster'),
  },
  {
    id: 'futura', name: 'Futura', category: 'Biomorph', description: 'A discontinued human sleeve designed for the Lost Generation and valued for its high Moxie pool.',
    durability: 35, woundThreshold: 7, deathRating: 53, morphPoints: 4, availability: 25,
    pools: { insight: 2, moxie: 4, vigor: 1, flex: 0 }, movement: [standardWalk],
    includedWare: basicBioware, includedTraits: [], source: corePhysicalMorphSource('Biomorph', 'futura'),
  },
  {
    id: 'hibernoid', name: 'Hibernoid', category: 'Biomorph', description: 'A human sleeve suited to long journeys, with reduced sleep needs and voluntary hibernation.',
    durability: 35, woundThreshold: 7, deathRating: 53, morphPoints: 4, availability: 70,
    pools: { insight: 1, moxie: 1, vigor: 0, flex: 2 }, movement: [standardWalk],
    includedWare: ['Biomods', 'Circadian Regulation', 'Clean Metabolism', 'Cold Tolerance', 'Cortical Stack', 'Hibernation', 'Mesh Inserts'],
    includedTraits: [], source: corePhysicalMorphSource('Biomorph', 'hibernoid'),
  },
  {
    id: 'spare', name: 'Spare', category: 'Synthmorph', description: 'A portable emergency shell that unfolds into a six-limbed body.',
    durability: 15, woundThreshold: 3, deathRating: 30, morphPoints: 0, availability: 80,
    pools: { insight: 0, moxie: 1, vigor: 0, flex: 0 }, movement: [slowWalk], armor: '6/4', size: 'Small',
    includedWare: [...basicShellWare, 'Grip Pads', 'Lidar', 'Skinlink', 'Stress Control'].sort(),
    includedTraits: [{ id: 'exotic-morphology', level: 3 }], commonExtras: ['Cortical Stack (optional)'],
    source: corePhysicalMorphSource('Synthmorph', 'spare'),
  },
  {
    id: 'dragonfly', name: 'Dragonfly', category: 'Synthmorph', description: 'A small shell with eight wings and a grasping tail.',
    durability: 25, woundThreshold: 5, deathRating: 50, morphPoints: 1, availability: 70,
    pools: { insight: 1, moxie: 0, vigor: 1, flex: 0 },
    movement: [{ mode: 'Walker', base: 2, full: 8 }, { mode: 'Winged', base: 8, full: 32 }], armor: '6/4', size: 'Small',
    includedWare: [...basicShellWare, 'Cortical Stack', 'Prehensile Tail', 'Radar', 'Wings'].sort(),
    includedTraits: [{ id: 'exotic-morphology', level: 3 }], limitations: ['Winged movement requires an atmosphere.'],
    source: corePhysicalMorphSource('Synthmorph', 'dragonfly'),
  },
  {
    id: 'slitheroid', name: 'Slitheroid', category: 'Synthmorph', description: 'A segmented shell that rolls or slithers on a serpentine body.',
    durability: 45, woundThreshold: 9, deathRating: 90, morphPoints: 5, availability: 50,
    pools: { insight: 0, moxie: 1, vigor: 3, flex: 0 },
    movement: [{ mode: 'Roller', base: 8, full: 32 }, { mode: 'Snake', base: 4, full: 12 }], armor: '8/6',
    includedWare: [...basicShellWare, 'Cortical Stack', 'Enhanced Vision', 'Retracting Limbs'].sort(),
    includedTraits: [{ id: 'exotic-morphology', level: 2 }], source: corePhysicalMorphSource('Synthmorph', 'slitheroid'),
  },
  {
    id: 'arachnoid', name: 'Arachnoid', category: 'Synthmorph', description: 'A rugged shell with several locomotion systems for rough terrain and microgravity.',
    durability: 55, woundThreshold: 11, deathRating: 110, morphPoints: 6, availability: 40,
    pools: { insight: 1, moxie: 0, vigor: 3, flex: 0 },
    movement: [
      { mode: 'Hopper', base: 4, full: 12 }, { mode: 'Thrust Vector', variant: 'Gas Jet', base: 8, full: 40 },
      standardWalk, { mode: 'Wheeled', base: 8, full: 40 },
    ],
    armor: '8/6', includedWare: [...standardSynthWare, 'Magnetic System', 'Pneumatics', 'Retracting Limbs'].sort(),
    includedTraits: [{ id: 'exotic-morphology', level: 3 }], limitations: ['The gas jets provide thrust in microgravity.'],
    source: corePhysicalMorphSource('Synthmorph', 'arachnoid'),
  },
];
