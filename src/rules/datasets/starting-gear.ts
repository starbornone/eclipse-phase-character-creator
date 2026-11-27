// Eclipse Phase Second Edition, Gear Packs, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
// Enforcer: p. 69. Soldier and its synth alternative: p. 71, with errata 1.4 dose quantities.
export const gearPacksSource = 'https://eclipsephase.github.io/en/04/27-gear-packs.html';

interface GearItem {
  name: string;
  gp: number;
  restricted?: boolean;
  replacedOnSynth?: boolean;
}

interface GearPack {
  name: string;
  anchor: string;
  items: readonly GearItem[];
  synthAlternatives?: readonly GearItem[];
}

const gear = (name: string, gp: number): GearItem => ({ name, gp });
const replaceOnSynth = (name: string, gp: number): GearItem => ({ name, gp, replacedOnSynth: true });
const mediumPistol = { name: 'Medium Pistol Firearm', gp: 1, restricted: true };
const tacNet = gear('TacNet App', 2);
const archive = gear('Portable SolArchive', 1);
const synthArmor = [gear('Anti-Glare', 1), gear('Industrial Armor', 1)];

const firewall: GearPack = {
  name: 'Firewall Agent / Criminal', anchor: 'firewall-agentcriminal',
  items: [
    gear('Anonymizer', 1), replaceOnSynth('Armor Vest (Light)', 1), { name: 'Fake Ego ID', gp: 3, restricted: true },
    mediumPistol, replaceOnSynth('Smart Clothing', 1), tacNet, gear('VPN App', 1),
  ],
  synthAlternatives: synthArmor,
};

const gatecrashing: GearPack = {
  name: 'Gatecrashing', anchor: 'gatecrashing',
  items: [
    replaceOnSynth('Autocook', 1), gear('Electronic Rope', 1), replaceOnSynth('Healing Spray', 1),
    mediumPistol, archive, replaceOnSynth('Standard Vacsuit', 3), tacNet,
  ],
  synthAlternatives: [...synthArmor, gear('Medichines', 3)],
};

export const gearCampaigns = [
  { id: 'firewall', label: 'Firewall', pack: firewall },
  { id: 'criminal', label: 'Criminal', pack: firewall },
  { id: 'gatecrashing', label: 'Gatecrashing', pack: gatecrashing },
] as const;

export type GearCampaign = (typeof gearCampaigns)[number]['id'];

export function findGearCampaign(id?: string) {
  return gearCampaigns.find((campaign) => campaign.id === id);
}

export const careerGearPacks: ReadonlyMap<string, GearPack> = new Map([
  ['academic', {
    name: 'Academic', anchor: 'academic',
    items: [
      gear('Creepy Bot', 1), gear('Holographic Projector', 1), gear('Microcar', 2), gear('Multi-Tasking', 2),
      gear('Neem (5 doses)', 1), archive, gear('Servitor Bot', 1), gear('Simulspace', 1),
    ],
  }],
  ['enforcer', {
    name: 'Enforcer', anchor: 'enforcer',
    items: [
      gear('Aggro (5 doses)', 1), gear('Claws', 1), gear('Flex Cutter', 1), gear('Grin (5 doses)', 1),
      gear('Muscle Augmentation', 3), gear('Shock Glove', 1), { name: 'Shredder', gp: 2, restricted: true },
    ],
  }],
  ['explorer', {
    name: 'Explorer', anchor: 'explorer',
    items: [
      gear('Breadcrumb System', 1), gear('Direction Sense', 1), gear('Enhanced Vision', 2),
      gear('Mission Recorder', 1), gear('Pressure Tent', 2), gear('Saucer', 1), gear('Scout Missile', 2),
    ],
  }],
  ['face', {
    name: 'Face / Dealer', anchor: 'facedealer',
    items: [
      gear('Enhanced Hearing', 1), gear('Guardian Angel', 2), gear('Medium Fabber', 2), gear('Nanodetector', 1),
      gear('Neuromodulation', 2), gear('Smart Hawk', 1), gear('Stiff (5 doses)', 1),
    ],
  }],
  ['soldier', {
    name: 'Soldier', anchor: 'soldier',
    items: [
      { name: 'Assault Rifle Railgun', gp: 2, restricted: true }, gear('Enhanced Vision', 2),
      gear('Grin (5 doses)', 1), replaceOnSynth('Meds (5 doses)', 2), gear('Neurachem', 3),
    ],
    synthAlternatives: [gear('Fixer Swarm', 2)],
  }],
]);
