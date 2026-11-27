import { useState } from 'react';
import type { traceStartingPsi } from '../rules/calculations/psi.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { psiSleightsSource, psiSleightTypes, psiSubStrains, psiSubStrainsSource } from '../rules/datasets/psi.ts';
import { quickStartRules } from '../rules/datasets/sample-morphs.ts';
import type { PsiConfiguration } from '../types/character.ts';

type StartingPsi = ReturnType<typeof traceStartingPsi>;

const drawbackLabel = (name: string) => name === 'Addiction' ? name : `Mental Disorder · ${name}`;
const sleightLabel = ({ name, minimumLevel }: StartingPsi['purchased'][number]) => `${name} · ${psiSleightTypes[minimumLevel]}`;

function SleightPurchases({ psi, onChange }: {
  psi: StartingPsi;
  onChange: (name: string, selected: boolean) => void;
}) {
  const [choice, setChoice] = useState('');
  const { purchased, purchaseOptions, purchaseCp } = psi;
  const { cpPerSleight, maximumPurchasedSleights, sleightPurchasesUrl } = coreCustomizationRules;
  const atLimit = purchased.length >= maximumPurchasedSleights;
  const eligibleChoice = purchaseOptions.find(({ name }) => name === choice);

  return (
    <>
      <h4>Purchased sleights</h4>
      <p className="rules-note"><a href={sleightPurchasesUrl}>{cpPerSleight} CP per sleight</a> · {purchased.length} / {maximumPurchasedSleights} purchased · {purchaseCp} CP spent</p>
      <div className="identity-fields sleight-purchase-fields">
        <label>
          Sleight to purchase
          <select value={eligibleChoice?.name ?? ''} disabled={atLimit} onChange={(event) => setChoice(event.target.value)}>
            <option value="">{atLimit ? 'Purchase limit reached' : 'Choose a sleight'}</option>
            {purchaseOptions.map((entry) => <option key={entry.name} value={entry.name}>{sleightLabel(entry)}</option>)}
          </select>
        </label>
        <button type="button" className="button secondary" disabled={atLimit || !eligibleChoice} onClick={() => {
          if (!eligibleChoice || atLimit) return;
          onChange(eligibleChoice.name, true);
          setChoice('');
        }}>Purchase sleight</button>
      </div>
      {purchased.length > 0 && (
        <ul className="sleight-purchases">
          {purchased.map((sleight) => (
            <li key={sleight.name}>
              <span>{sleightLabel(sleight)}</span>
              <button type="button" className="button secondary" aria-label={`Remove ${sleight.name}`} onClick={() => onChange(sleight.name, false)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function StartingPsiSection({ psi, onChange, onPurchaseChange, discardedSleight = false }: {
  psi: StartingPsi;
  onChange?: (choices?: PsiConfiguration) => void;
  onPurchaseChange?: (name: string, selected: boolean) => void;
  discardedSleight?: boolean;
}) {
  const { level, requiredBy, subStrain, drawback, freeSleight, sleights, selection, purchased, purchaseCp, discardedPurchases } = psi;
  const warnAboutPurchases = Boolean(onPurchaseChange && discardedPurchases);
  if (!level && !requiredBy.length && !warnAboutPurchases) return null;

  return (
    <section className={onChange ? 'starting-psi panel editor-panel' : 'starting-psi'}>
      <h3>Starting Psi</h3>
      {!level ? (
        requiredBy.length > 0 && <p className="rules-note">{requiredBy.join(' and ')} {requiredBy.length === 1 ? 'requires' : 'require'} the Psi trait.</p>
      ) : onChange ? (
        <>
          <p className="rules-note">Choose a sub-strain, its required drawback, and one free sleight. The drawback grants 0 CP.</p>
          <div className="identity-fields">
            <label className="concept">
              Psi sub-strain
              <select value={subStrain?.id ?? ''} onChange={(event) => (
                onChange(event.target.value ? { subStrain: event.target.value } : undefined)
              )}>
                <option value="">Choose a sub-strain</option>
                {psiSubStrains.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            {selection && subStrain && (
              <>
                <label>
                  Required drawback
                  <select value={drawback ?? ''} onChange={(event) => (
                    onChange({ ...selection, drawback: event.target.value || undefined })
                  )}>
                    <option value="">Choose a drawback</option>
                    {subStrain.drawbacks.map((name) => <option key={name} value={name}>{drawbackLabel(name)}</option>)}
                  </select>
                </label>
                <label>
                  Free starting sleight
                  <select value={freeSleight?.name ?? ''} onChange={(event) => (
                    onChange({ ...selection, freeSleight: event.target.value || undefined })
                  )}>
                    <option value="">Choose a sleight</option>
                    {sleights.map((entry) => (
                      <option key={entry.name} value={entry.name}>{sleightLabel(entry)}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
          {discardedSleight && <p className="rules-note" role="status">The previous sleight requires Psi Level 2. Select an eligible sleight or restore the higher level before saving.</p>}
          {onPurchaseChange && <SleightPurchases psi={psi} onChange={onPurchaseChange} />}
        </>
      ) : (
        <dl className="print-checks">
          <div><dt>Sub-strain</dt><dd>{subStrain?.name ?? 'Pending'}</dd></div>
          <div><dt>Required drawback</dt><dd>{drawback ? `${drawbackLabel(drawback)} · 0 CP` : 'Pending'}</dd></div>
          <div><dt>Free starting sleight</dt><dd>{freeSleight?.name ?? 'Pending'}</dd></div>
          {purchased.length > 0 && (
            <div className="purchased-sleight-summary"><dt>Purchased sleights · {purchaseCp} CP</dt><dd>{purchased.map(sleightLabel).join(', ')}</dd></div>
          )}
        </dl>
      )}
      {warnAboutPurchases && (
        <p className="rules-note" role="status">{discardedPurchases} {discardedPurchases === 1 ? 'purchase is' : 'purchases are'} ineligible and will be removed on save. Check the Psi level, free sleight, and purchase limit to restore them before saving.</p>
      )}
      {Boolean(level) && <p className="rules-note">Adapted from <a href={psiSubStrainsSource}>core sub-strains</a> and{' '}
        <a href={psiSleightsSource}>sleights</a> by <a href={quickStartRules.publisherUrl}>{quickStartRules.publisher}</a> under{' '}
        <a href={quickStartRules.licenseUrl}>{quickStartRules.license}</a>.</p>}
    </section>
  );
}
