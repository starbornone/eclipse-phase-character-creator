import type { traceAptitudeChecks } from '../rules/calculations/draft.ts';

export function AptitudeCheckCalculation({ check }: { check: ReturnType<typeof traceAptitudeChecks>[number] }) {
  const { base, multiplier, modifier, modifiers } = check;
  return (
    <>
      {base === undefined ? '—' : `${base} × ${multiplier}${modifier ? ` + ${modifier}` : ''}`}
      {modifiers.map(({ source, level, points }) => (
        <span className="skill-grant muted" key={source}>{source} · Level {level} +{points}</span>
      ))}
    </>
  );
}
