import type { evaluateStartingMorphBudget } from '../rules/calculations/starting-morph-budget.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import { quickStartRules } from '../rules/datasets/sample-morphs.ts';

export function StartingMorphBudgetSummary({ budget, live = false }: {
  budget: ReturnType<typeof evaluateStartingMorphBudget>;
  live?: boolean;
}) {
  const { allowance, resources, available, cost, equipmentCost, remaining, temporaryFlex, hasResleeved, morphName, costSource } = budget;
  const { mpPerTemporaryFlex, temporaryFlexCap, sourceUrl } = startingMorphBudgetRules;
  const showCostSource = cost !== undefined && costSource;

  return (
    <section className="starting-morph-budget">
      <h3>Starting Morph Point budget</h3>
      <dl className="print-checks" aria-live={live ? 'polite' : undefined}>
        <div><dt>GM allowance</dt><dd>{allowance} MP</dd></div>
        {resources > 0 && <div><dt>Resources</dt><dd>+{resources} MP</dd></div>}
        <div><dt>Available</dt><dd>{available} MP</dd></div>
        <div>
          <dt>First sleeve{morphName && <> · {showCostSource ? <a href={costSource.url}>{morphName}</a> : morphName}</>}</dt>
          <dd>{cost === undefined ? 'Cost pending' : `${cost} MP`}</dd>
        </div>
        {equipmentCost > 0 && <div><dt>Extra equipment</dt><dd>{equipmentCost} MP</dd></div>}
        <div>
          <dt>Remaining</dt>
          <dd>{remaining === undefined ? 'Pending' : remaining < 0 ? `${-remaining} MP over budget` : `${remaining} MP`}</dd>
        </div>
        <div><dt>Temporary Flex</dt><dd>{temporaryFlex ?? 'Pending'}{hasResleeved && ' · expired'}</dd></div>
      </dl>
      <p className="rules-note">Each full {mpPerTemporaryFlex} MP left gives 1 temporary Flex, up to {temporaryFlexCap}. It expires at the first resleeve.</p>
      <p className="rules-note">Adapted from <a href={sourceUrl}>Eclipse Phase Second Edition, Step 12</a> by{' '}
        <a href={quickStartRules.publisherUrl}>{quickStartRules.publisher}</a> under <a href={quickStartRules.licenseUrl}>{quickStartRules.license}</a>.</p>
    </section>
  );
}
