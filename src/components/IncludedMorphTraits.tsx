import type { traceIncludedMorphTraits } from '../rules/calculations/morph-traits.ts';
import { morphTraitSource } from '../rules/datasets/morph-traits.ts';

export function IncludedMorphTraits({ entries, compact = false }: {
  entries: ReturnType<typeof traceIncludedMorphTraits>;
  compact?: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <ul className={compact ? 'included-morph-traits rules-note' : 'included-morph-traits morph-trait-summary'}
      aria-label="Included morph traits">
      {entries.map(({ id, name, level, effect }) => (
        <li key={id}>
          <a href={morphTraitSource(id)}>{name}</a>{level !== undefined && ` · Level ${level}`}
          {!compact && <> · Included<p className="rules-note">{effect}</p></>}
        </li>
      ))}
    </ul>
  );
}
