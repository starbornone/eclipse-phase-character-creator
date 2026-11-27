export function SkillTestModifiers({ total, testTarget, testModifiers }: {
  total?: number;
  testTarget?: number;
  testModifiers: readonly { source: string; points: number }[];
}) {
  if (!testModifiers.length) return null;
  return (
    <span className="skill-grant muted">
      Test target {total === undefined ? 'pending' : `${total}${testModifiers.map(({ points }) => ` ${points < 0 ? '−' : '+'} ${Math.abs(points)}`).join('')} = ${testTarget}`}
      {testModifiers.map(({ source, points }) => <span className="skill-grant muted" key={source}>{source} {points < 0 ? '−' : '+'}{Math.abs(points)}</span>)}
    </span>
  );
}
