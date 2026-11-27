// Eclipse Phase Second Edition, Gear chapter, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
const gearChapter = 'https://eclipsephase.github.io/en/16';

export const equipmentCategories = [
  'Apps', 'Communications', 'Everyday technology', 'Exploration tools', 'Robots', 'Salvage tools', 'Science tools', 'Survival tools', 'Vacsuits',
] as const;
type EquipmentCategory = typeof equipmentCategories[number];

const section = (category: EquipmentCategory, path: string) => ({ category, source: `${gearChapter}/${path}` });
const apps = section('Apps', '13-apps-and-alis.html#apps');
const communications = section('Communications', '16-comms-and-mesh-gear.html#communications');
const everyday = section('Everyday technology', '05-common-tech-and-ware.html#everyday-technology');
const exploration = section('Exploration tools', '18-mission-gear.html#exploration-tools');
const explorationBots = section('Robots', '21-robots.html#exploration-bots');
const medicalBots = section('Robots', '21-robots.html#medical-bots');
const personalBots = section('Robots', '21-robots.html#personal-bots');
const utilityBots = section('Robots', '21-robots.html#utility-bots');
const salvage = section('Salvage tools', '18-mission-gear.html#salvage-tools');
const science = section('Science tools', '18-mission-gear.html#science-tools');
const survival = section('Survival tools', '18-mission-gear.html#survival-tools');
const vacsuits = section('Vacsuits', '18-mission-gear.html#vacsuits');

interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  complexity: 'Minor' | 'Moderate' | 'Major';
  gp: number;
  source: string;
  restricted?: boolean;
}

export const startingEquipment: readonly Equipment[] = [
  { id: 'adaptive-interface', name: 'Adaptive Interface', complexity: 'Major', gp: 3, ...science },
  { id: 'automech', name: 'Automech', complexity: 'Moderate', gp: 2, ...utilityBots },
  { id: 'biometric-matcher-app', name: 'Biometric Matcher App', complexity: 'Minor', gp: 1, ...apps },
  { id: 'breadcrumb-system', name: 'Breadcrumb System', complexity: 'Minor', gp: 1, ...communications },
  { id: 'breather', name: 'Breather', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'cold-suit', name: 'Cold Suit', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'creepy-bot', name: 'Creepy Bot', complexity: 'Minor', gp: 1, ...personalBots },
  { id: 'crypto-app', name: 'Crypto App', complexity: 'Minor', gp: 1, ...apps },
  { id: 'disassembly-tools', name: 'Disassembly Tools', complexity: 'Moderate', gp: 2, ...salvage },
  { id: 'docbot', name: 'Docbot', complexity: 'Major', gp: 3, ...medicalBots },
  { id: 'ecto', name: 'Ecto', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'electrogravitics-net', name: 'Electrogravitics Net', complexity: 'Minor', gp: 1, ...survival },
  { id: 'electronic-rope', name: 'Electronic Rope', complexity: 'Minor', gp: 1, ...survival },
  { id: 'emergency-bubble', name: 'Emergency Bubble', complexity: 'Major', gp: 3, ...survival },
  { id: 'emergency-distress-beacon', name: 'Emergency Distress Beacon', complexity: 'Minor', gp: 1, ...communications },
  { id: 'exploit-app', name: 'Exploit App', complexity: 'Moderate', gp: 2, ...apps, restricted: true },
  { id: 'explorenaut', name: 'Explorenaut', complexity: 'Major', gp: 3, ...explorationBots },
  { id: 'fractal-gloves', name: 'Fractal Gloves', complexity: 'Moderate', gp: 2, ...science },
  { id: 'grip-tape', name: 'Grip Tape', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'holographic-projector', name: 'Holographic Projector', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'laser-microwave-link-micro', name: 'Laser/Microwave Link (Micro)', complexity: 'Minor', gp: 1, ...communications },
  { id: 'laser-microwave-link-small', name: 'Laser/Microwave Link (Small)', complexity: 'Moderate', gp: 2, ...communications },
  { id: 'light-vacsuit', name: 'Light Vacsuit', complexity: 'Moderate', gp: 2, ...vacsuits },
  { id: 'manipulator', name: 'Manipulator', complexity: 'Major', gp: 3, ...personalBots },
  { id: 'mapping-missile', name: 'Mapping Missile', complexity: 'Moderate', gp: 2, ...exploration },
  { id: 'micrograv-shoes', name: 'Micrograv Shoes', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'mission-recorder', name: 'Mission Recorder', complexity: 'Minor', gp: 1, ...communications },
  { id: 'nuclear-battery', name: 'Nuclear Battery', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'pocket-lab', name: 'Pocket Lab', complexity: 'Moderate', gp: 2, ...science },
  { id: 'portable-sensor', name: 'Portable Sensor', complexity: 'Moderate', gp: 2, ...everyday },
  { id: 'portable-solarchive', name: 'Portable SolArchive', complexity: 'Minor', gp: 1, ...science },
  { id: 'pressure-tent', name: 'Pressure Tent', complexity: 'Moderate', gp: 2, ...survival },
  { id: 'radio-booster', name: 'Radio Booster', complexity: 'Minor', gp: 1, ...communications },
  { id: 'retriever', name: 'Retriever', complexity: 'Major', gp: 3, ...medicalBots },
  { id: 'satnet-in-a-can', name: 'Satnet-in-a-Can', complexity: 'Major', gp: 3, ...communications },
  { id: 'scout-missile', name: 'Scout Missile', complexity: 'Moderate', gp: 2, ...exploration },
  { id: 'servitor-bot', name: 'Servitor Bot', complexity: 'Minor', gp: 1, ...personalBots },
  { id: 'smart-anchors', name: 'Smart Anchors', complexity: 'Minor', gp: 1, ...survival },
  { id: 'smart-clothing', name: 'Smart Clothing', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'solar-charger', name: 'Solar Charger', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'specimen-container', name: 'Specimen Container', complexity: 'Minor', gp: 1, ...science },
  { id: 'specs', name: 'Specs', complexity: 'Moderate', gp: 2, ...everyday },
  { id: 'spider-hand', name: 'Spider Hand', complexity: 'Minor', gp: 1, ...personalBots },
  { id: 'spindle', name: 'Spindle', complexity: 'Moderate', gp: 2, ...survival },
  { id: 'spindle-climber', name: 'Spindle Climber', complexity: 'Minor', gp: 1, ...survival },
  { id: 'squishbot', name: 'Squishbot', complexity: 'Minor', gp: 1, ...explorationBots },
  { id: 'standard-battery', name: 'Standard Battery', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'standard-vacsuit', name: 'Standard Vacsuit', complexity: 'Major', gp: 3, ...vacsuits },
  { id: 'tools-facility', name: 'Tools (Facility)', complexity: 'Major', gp: 3, ...everyday },
  { id: 'tools-kit', name: 'Tools (Kit)', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'tools-shop', name: 'Tools (Shop)', complexity: 'Moderate', gp: 2, ...everyday },
  { id: 'utilitool', name: 'Utilitool', complexity: 'Minor', gp: 1, ...everyday },
  { id: 'viewers', name: 'Viewers', complexity: 'Moderate', gp: 2, ...everyday },
  { id: 'vpn-app', name: 'VPN App', complexity: 'Minor', gp: 1, ...apps },
  { id: 'wireless-energy-transmitter', name: 'Wireless Energy Transmitter', complexity: 'Minor', gp: 1, ...everyday },
];

export function findStartingEquipment(id: string) {
  return startingEquipment.find((item) => item.id === id);
}
