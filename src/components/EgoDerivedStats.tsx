import type { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { coreDerivedStatRules } from '../rules/datasets/derived-stats.ts';

export function EgoDerivedStats({ stats, styled = false, headingLevel = 2 }: {
  stats: ReturnType<typeof traceDerivedEgoStats>;
  styled?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className={`derived-ego-stats${styled ? ' panel editor-panel' : ''}`}>
      <Heading>Derived ego stats</Heading>
      <dl className="derived-ego-stat-list">
        {stats.map(({ id, label, total, formula, calculation, inputs, modifiers }) => <div key={id}>
          <dt>{label}</dt>
          <dd><strong>{total ?? 'Pending'}</strong></dd>
          <dd className="derived-stat-calculation">
            {calculation ?? `${formula} · Needs ${inputs.filter(({ value }) => value === undefined).map(({ source }) => source).join(' and ')}.`}
            {modifiers.map(({ source, points }) => <span className="skill-grant" key={source}>{source} {points < 0 ? '−' : '+'}{Math.abs(points)}</span>)}
          </dd>
        </div>)}
      </dl>
      <p className="rules-note">Use aptitude scores for these values. Division <a href={coreDerivedStatRules.roundingUrl}>rounds to the nearest whole number</a>.</p>
      <p className="rules-note">Adapted from <a href={coreDerivedStatRules.sourceUrl}>Eclipse Phase Second Edition, p. 46</a> by{' '}
        <a href="https://eclipsephase.com/">Posthuman Studios, LLC</a> under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.</p>
    </section>
  );
}
