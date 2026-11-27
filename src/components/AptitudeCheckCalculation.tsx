import type { traceAptitudeChecks } from '../rules/calculations/draft.ts';

export function AptitudeCheckCalculation({ check, missingBase = '—' }: {
  check: ReturnType<typeof traceAptitudeChecks>[number];
  missingBase?: string;
}) {
  const { base, multiplier, modifier, modifiers } = check;
  return (
    <>
      {base === undefined ? missingBase : `${base} × ${multiplier}${modifier ? ` ${modifier < 0 ? '−' : '+'} ${Math.abs(modifier)}` : ''}`}
      {modifiers.map(({ source, level, points }) => (
        <span className="skill-grant muted" key={source}>{source} · Level {level} {points < 0 ? '−' : '+'}{Math.abs(points)}</span>
      ))}
    </>
  );
}
