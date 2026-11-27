// Eclipse Phase Second Edition, Gear chapter, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
const gearChapter = 'https://eclipsephase.github.io/en/16';
const apps = `${gearChapter}/13-apps-and-alis.html#apps`;
const everyday = `${gearChapter}/05-common-tech-and-ware.html#everyday-technology`;
const communications = `${gearChapter}/16-comms-and-mesh-gear.html#communications`;
const mission = `${gearChapter}/18-mission-gear.html`;
const robots = `${gearChapter}/21-robots.html`;

interface Equipment {
  id: string;
  name: string;
  complexity: 'Minor' | 'Moderate' | 'Major';
  gp: number;
  source: string;
  restricted?: boolean;
}

export const startingEquipment: readonly Equipment[] = [
  { id: 'automech', name: 'Automech', complexity: 'Moderate', gp: 2, source: `${robots}#utility-bots` },
  { id: 'biometric-matcher-app', name: 'Biometric Matcher App', complexity: 'Minor', gp: 1, source: apps },
  { id: 'breather', name: 'Breather', complexity: 'Minor', gp: 1, source: everyday },
  { id: 'crypto-app', name: 'Crypto App', complexity: 'Minor', gp: 1, source: apps },
  { id: 'docbot', name: 'Docbot', complexity: 'Major', gp: 3, source: `${robots}#medical-bots` },
  { id: 'ecto', name: 'Ecto', complexity: 'Minor', gp: 1, source: everyday },
  { id: 'emergency-bubble', name: 'Emergency Bubble', complexity: 'Major', gp: 3, source: `${mission}#survival-tools` },
  { id: 'emergency-distress-beacon', name: 'Emergency Distress Beacon', complexity: 'Minor', gp: 1, source: communications },
  { id: 'exploit-app', name: 'Exploit App', complexity: 'Moderate', gp: 2, source: apps, restricted: true },
  { id: 'explorenaut', name: 'Explorenaut', complexity: 'Major', gp: 3, source: `${robots}#exploration-bots` },
  { id: 'holographic-projector', name: 'Holographic Projector', complexity: 'Minor', gp: 1, source: everyday },
  { id: 'light-vacsuit', name: 'Light Vacsuit', complexity: 'Moderate', gp: 2, source: `${mission}#vacsuits` },
  { id: 'mission-recorder', name: 'Mission Recorder', complexity: 'Minor', gp: 1, source: communications },
  { id: 'pressure-tent', name: 'Pressure Tent', complexity: 'Moderate', gp: 2, source: `${mission}#survival-tools` },
  { id: 'squishbot', name: 'Squishbot', complexity: 'Minor', gp: 1, source: `${robots}#exploration-bots` },
  { id: 'standard-vacsuit', name: 'Standard Vacsuit', complexity: 'Major', gp: 3, source: `${mission}#vacsuits` },
  { id: 'utilitool', name: 'Utilitool', complexity: 'Minor', gp: 1, source: everyday },
  { id: 'vpn-app', name: 'VPN App', complexity: 'Minor', gp: 1, source: apps },
];

export function findStartingEquipment(id: string) {
  return startingEquipment.find((item) => item.id === id);
}
