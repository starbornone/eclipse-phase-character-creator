import type { traceStartingPsi } from '../rules/calculations/psi.ts';
import { psiSleightsSource, psiSubStrains, psiSubStrainsSource } from '../rules/datasets/psi.ts';
import { quickStartRules } from '../rules/datasets/sample-morphs.ts';
import type { PsiConfiguration } from '../types/character.ts';

type StartingPsi = ReturnType<typeof traceStartingPsi>;

const drawbackLabel = (name: string) => name === 'Addiction' ? name : `Mental Disorder · ${name}`;

export function StartingPsiSection({ psi, onChange, discardedSleight = false }: {
  psi: StartingPsi;
  onChange?: (choices?: PsiConfiguration) => void;
  discardedSleight?: boolean;
}) {
  const { level, requiredBy, subStrain, drawback, freeSleight, sleights, selection } = psi;
  if (!level && !requiredBy.length) return null;

  return (
    <section className={onChange ? 'starting-psi panel editor-panel' : 'starting-psi'}>
      <h3>Starting Psi</h3>
      {!level ? (
        <p className="rules-note">{requiredBy.join(' and ')} {requiredBy.length === 1 ? 'requires' : 'require'} the Psi trait.</p>
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
                    {sleights.map(({ name, minimumLevel }) => (
                      <option key={name} value={name}>{name} · {minimumLevel === 1 ? 'Psi-chi' : 'Psi-gamma'}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
          {discardedSleight && <p className="rules-note" role="status">The previous sleight requires Psi Level 2. Select an eligible sleight or restore the higher level before saving.</p>}
        </>
      ) : (
        <dl className="print-checks">
          <div><dt>Sub-strain</dt><dd>{subStrain?.name ?? 'Pending'}</dd></div>
          <div><dt>Required drawback</dt><dd>{drawback ? `${drawbackLabel(drawback)} · 0 CP` : 'Pending'}</dd></div>
          <div><dt>Free starting sleight</dt><dd>{freeSleight?.name ?? 'Pending'}</dd></div>
        </dl>
      )}
      {Boolean(level) && <p className="rules-note">Adapted from <a href={psiSubStrainsSource}>core sub-strains</a> and{' '}
        <a href={psiSleightsSource}>sleights</a> by <a href={quickStartRules.publisherUrl}>{quickStartRules.publisher}</a> under{' '}
        <a href={quickStartRules.licenseUrl}>{quickStartRules.license}</a>.</p>}
    </section>
  );
}
