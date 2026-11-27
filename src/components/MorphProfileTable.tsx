import type { ReactNode } from 'react';
import { describeMovement, morphCapabilities } from '../rules/calculations/morph-catalog.ts';
import { traceIncludedMorphTraits } from '../rules/calculations/morph-traits.ts';
import type { MorphDefinition } from '../types/character.ts';
import { IncludedMorphTraits } from './IncludedMorphTraits.tsx';
import { MorphSource, poolFields } from './MorphProfile.tsx';

interface ProfileColumn {
  id: string;
  label: string;
  morph?: MorphDefinition;
}

const profileRows: { label: string; value: (morph: MorphDefinition) => ReactNode }[] = [
  { label: 'Category', value: (morph) => morph.category },
  { label: 'Cost (MP)', value: (morph) => morph.morphPoints },
  { label: 'Availability', value: (morph) => morph.availability },
  { label: 'Durability', value: (morph) => morph.durability },
  { label: 'Wound threshold', value: (morph) => morph.woundThreshold },
  { label: 'Death rating', value: (morph) => morph.deathRating },
  { label: 'Movement', value: describeMovement },
  { label: 'Frame armor', value: (morph) => morph.source ? (morph.armor ?? 'None listed') : undefined },
  ...poolFields.map(([id, label]) => ({ label, value: (morph: MorphDefinition) => morph.pools?.[id] })),
  { label: 'Capabilities', value: (morph) => morph.includedWare && (morphCapabilities(morph).join(', ') || 'None listed') },
  { label: 'Included traits', value: (morph) => {
    if (!morph.source) return undefined;
    const traits = traceIncludedMorphTraits(morph);
    return traits.length ? <IncludedMorphTraits entries={traits} compact /> : 'None listed';
  } },
  { label: 'Size and profile limits', value: (morph) => {
    if (!morph.source) return undefined;
    const limits = morph.limitations ?? [];
    return [morph.size && `${morph.size} size.`, ...limits].filter(Boolean).join(' ') || 'None listed';
  } },
  { label: 'Source', value: (morph) => <MorphSource morph={morph} /> },
];

export function MorphProfileTable({ columns, titleId, noteId }: {
  columns: ProfileColumn[];
  titleId: string;
  noteId: string;
}) {
  return (
    <div className="comparison-scroll" role="region" aria-labelledby={titleId} tabIndex={0}>
      <table aria-describedby={noteId}>
        <thead>
          <tr>
            <th scope="col">Profile</th>
            {columns.map(({ id, label }) => <th scope="col" key={id}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {profileRows.map(({ label, value }) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {columns.map(({ id, morph }) => <td key={id}>{(morph && value(morph)) ?? 'Unverified'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
