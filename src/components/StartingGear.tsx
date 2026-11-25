import { deriveStartingGear } from '../rules/calculations/starting-gear.ts';
import { findGearCampaign, gearCampaigns, gearPacksSource } from '../rules/datasets/starting-gear.ts';
import type { GearCampaign } from '../rules/datasets/starting-gear.ts';
import type { MorphDefinition } from '../types/character.ts';
import { Card } from './ui/card.tsx';

type StartingGear = ReturnType<typeof deriveStartingGear>;

function GearContents({ packs }: StartingGear) {
  return (
    <>
      <p className="muted">Free starting gear <strong>Muse ALI</strong></p>
      {packs.map(({ name, source, items, gp, usesSynthAlternatives }) => (
        <section className="starting-gear-pack" key={source}>
          <h4><a href={source}>{name}</a> · {gp} GP</h4>
          {usesSynthAlternatives && <p className="muted">Includes synthmorph alternatives.</p>}
          <dl className="print-checks">
            {items.map(({ name: item, gp: value, restricted }) => (
              <div key={item}><dt>{item}</dt><dd>{value} GP{restricted && ' · Restricted'}</dd></div>
            ))}
          </dl>
        </section>
      ))}
      <p className="rules-note">
        Adapted from <a href={gearPacksSource}>Eclipse Phase Second Edition gear packs</a> by{' '}
        <a href="https://eclipsephase.com/">Posthuman Studios, LLC</a> under{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.
      </p>
    </>
  );
}

export function StartingGearEditor({ campaign, career, morphCategory, onChange }: {
  campaign?: GearCampaign;
  career?: string;
  morphCategory?: MorphDefinition['category'];
  onChange: (value?: GearCampaign) => void;
}) {
  const { packs } = deriveStartingGear(campaign, career, morphCategory);
  return (
    <Card className="editor-panel">
      <h2>Starting gear</h2>
      <div className="identity-fields">
        <label>
          Campaign
          <select value={campaign ?? ''} onChange={(event) => onChange(findGearCampaign(event.target.value)?.id)}>
            <option value="">Choose campaign</option>
            {gearCampaigns.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className="rules-note">Your career adds a second pack. Gear Point (GP) values describe the items.</p>
      {campaign && !morphCategory && <p className="rules-note">Choose a first morph to apply any synthmorph alternatives.</p>}
      <GearContents packs={packs} />
    </Card>
  );
}

export function StartingGearSummary({ gear, styled }: { gear?: StartingGear; styled?: boolean }) {
  if (!gear?.packs.length) return null;
  return (
    <section className={styled ? 'starting-gear panel editor-panel' : 'starting-gear'}>
      <h3>Starting gear</h3>
      <GearContents packs={gear.packs} />
    </section>
  );
}
