import { deriveStartingGear, startingGearReplacements } from '../rules/calculations/starting-gear.ts';
import { findGearCampaign, gearCampaigns, gearPacksSource } from '../rules/datasets/starting-gear.ts';
import type { GearCampaign } from '../rules/datasets/starting-gear.ts';
import type { MorphDefinition, StartingGearSwap } from '../types/character.ts';
import { Card } from './ui/card.tsx';

type StartingGear = ReturnType<typeof deriveStartingGear>;

function GearContents({ packs, replacements, onSwap }: {
  packs: StartingGear['packs'];
  replacements?: ReturnType<typeof startingGearReplacements>;
  onSwap?: (swap: StartingGearSwap) => void;
}) {
  return (
    <>
      <p className="muted">Free starting gear <strong>Muse ALI</strong></p>
      {packs.map(({ id, name, source, items, gp, usesSynthAlternatives, hasAdditionalGpCosts }) => (
        <section className="starting-gear-pack" key={source}>
          <h4><a href={source}>{name}</a> · {gp} GP{hasAdditionalGpCosts && ' base'}</h4>
          {usesSynthAlternatives && <p className="muted">Includes synthmorph alternatives.</p>}
          <dl className="print-checks">
            {items.map(({ name: item, originalName, replacementSource, gp: value, restricted, additionalGpCost }) => (
              <div key={originalName}>
                <dt>
                  {replacementSource ? <a href={replacementSource}>{item}</a> : item}
                  {replacementSource && <small className="gear-swap-source">Replaces {originalName}</small>}
                </dt>
                <dd>{value} GP{additionalGpCost && ` + ${additionalGpCost}`}{restricted && ' · Restricted'}</dd>
              </div>
            ))}
          </dl>
          {hasAdditionalGpCosts && <p className="rules-note">The total sums listed base GP. Swarm payload costs depend on the selected drug or toxin.</p>}
          {onSwap && replacements && (
            <details className="gear-swaps">
              <summary>Swap {name} gear</summary>
              <div className="identity-fields">
                {items.filter(({ additionalGpCost }) => !additionalGpCost).map(({ name: item, originalName, gp: value, replacementSource }) => (
                  <label key={originalName}>
                    Replace {originalName} ({value} GP)
                    <select value={replacementSource ? item : ''} onChange={(event) => (
                      onSwap({ packId: id, item: originalName, replacement: event.target.value })
                    )}>
                      <option value="">Keep {originalName}</option>
                      {replacements.filter(({ name, gp }) => name !== originalName && gp === value).map(({ name, restricted }) => (
                        <option key={name} value={name}>{name}{restricted && ' · Restricted'}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </details>
          )}
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

export function StartingGearEditor({ campaign, gear, morphCategory, swaps, useInfomorphPack, onChange, onSwapsChange, onInfomorphPackChange }: {
  campaign?: GearCampaign;
  gear: StartingGear;
  morphCategory?: MorphDefinition['category'];
  swaps: StartingGearSwap[];
  useInfomorphPack: boolean;
  onChange: (value?: GearCampaign) => void;
  onSwapsChange: (swaps: StartingGearSwap[]) => void;
  onInfomorphPackChange: (selected: boolean) => void;
}) {
  const { packs, appliedSwaps, usesInfomorphPack } = gear;
  function updateSwap(swap: StartingGearSwap) {
    const next = swaps.filter(({ packId, item }) => packId !== swap.packId || item !== swap.item);
    if (swap.replacement) next.push(swap);
    onSwapsChange(next);
  }

  return (
    <Card className="editor-panel">
      <h2 id="creation-starting-gear-title" className="creation-review-target" tabIndex={-1}>Starting gear</h2>
      <div className="identity-fields">
        <label>
          Campaign
          <select id="creation-campaign" value={campaign ?? ''} onChange={(event) => onChange(findGearCampaign(event.target.value)?.id)}>
            <option value="">Choose campaign</option>
            {gearCampaigns.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>
      {morphCategory === 'Infomorph' && (
        <label className="compare-toggle">
          <input type="checkbox" checked={usesInfomorphPack} onChange={(event) => onInfomorphPackChange(event.target.checked)} />
          <span>Use the optional Infomorph pack in place of the campaign pack</span>
        </label>
      )}
      <p className="rules-note">Your career adds a second pack. Swap fixed-cost items for gear of the same GP from other packs or the supported Gear chapter listings.</p>
      {campaign && !morphCategory && <p className="rules-note">Choose a first morph to apply any synthmorph alternatives.</p>}
      <div role="status">
        {useInfomorphPack && !usesInfomorphPack && <p className="rules-note">The optional Infomorph pack requires an infomorph first sleeve. Saving will use the selected campaign pack.</p>}
        {appliedSwaps.length < swaps.length && <p className="rules-note">Some swaps no longer fit these packs or the first morph. Saving will remove those swaps.</p>}
      </div>
      <GearContents packs={packs} replacements={packs.length ? startingGearReplacements(morphCategory) : undefined} onSwap={updateSwap} />
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
