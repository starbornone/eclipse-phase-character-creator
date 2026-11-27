// Eclipse Phase Second Edition, Gear Packs, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
// Enforcer: p. 69. Soldier and its synth alternative: p. 71, with errata 1.4 dose quantities.
// Hacker: p. 70. Scavenger, Scientist, and Techie: p. 71, checked against errata 1.4.
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
  ['hacker', {
    name: 'Hacker', anchor: 'hacker',
    items: [
      { name: 'Exploit App', gp: 2, restricted: true }, gear('Gray Box', 1), gear('Radio Booster', 1),
      gear('Sniffer App', 2), { name: 'Spoofer App', gp: 2, restricted: true }, gear('Tracker App', 2),
    ],
  }],
  ['scavenger', {
    name: 'Scavenger', anchor: 'scavenger',
    items: [
      gear('Breadcrumb System', 1), gear('Diamond Axe', 1), gear('Disassembly Tools', 2), gear('Guardian Swarm', 2),
      gear('Nanodetector', 1), gear('Orbital Hash (5 doses)', 1), gear('Robomule', 2),
    ],
  }],
  ['scientist', {
    name: 'Scientist', anchor: 'scientist',
    items: [
      gear('Enhanced Vision', 2), gear('Mind Amp', 3), gear('Mission Recorder', 1),
      gear('Pocket Lab', 2), gear('Servitor', 1), gear('Specimen Container', 1),
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
  ['techie', {
    name: 'Techie', anchor: 'techie',
    items: [
      gear('Automech', 2), gear('Electrical Sense', 1), gear('Fixer Swarm', 2), gear('Fokus (5 doses)', 1),
      gear('Medium Fabber', 2), gear('Tools (Kit)', 1), gear('Utilitool', 1),
    ],
  }],
]);
