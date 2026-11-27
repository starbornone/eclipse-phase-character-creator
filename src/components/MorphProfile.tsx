import { Atom, Bot, Dna, Monitor } from 'lucide-react';
import { describeMovement } from '../rules/calculations/morph-catalog.ts';
import { quickStartRules } from '../rules/datasets/sample-morphs.ts';
import type { MorphDefinition } from '../types/character.ts';

export const poolFields = [
  ['insight', 'Insight'], ['moxie', 'Moxie'], ['vigor', 'Vigor'], ['flex', 'Morph Flex'],
] as const;

export function MorphIcon({ morph }: { morph: MorphDefinition }) {
  const Icon = morph.category === 'Infomorph' ? Monitor
    : morph.category === 'Biomorph' ? Dna
    : morph.id === 'case' || morph.id === 'vector-frame' ? Atom : Bot;
  return <span aria-hidden="true" className={`morph-icon ${morph.id}`}><Icon size={20} /></span>;
}

export function MorphStats({ morph, showPools = true }: { morph: MorphDefinition; showPools?: boolean }) {
  const { pools, armor } = morph;
  const movement = describeMovement(morph);
  return (
    <span className="morph-stats">
      <span>Durability <strong>{morph.durability}</strong></span>
      {morph.woundThreshold !== undefined && <span>Wound threshold <strong>{morph.woundThreshold}</strong></span>}
      {morph.deathRating !== undefined && <span>Death rating <strong>{morph.deathRating}</strong></span>}
      {morph.morphPoints !== undefined && <span>Cost <strong>{morph.morphPoints} MP</strong></span>}
      {movement && <span>Movement <strong>{movement}</strong></span>}
      {armor && <span>Frame armor <strong>{armor}</strong></span>}
      {showPools && pools && poolFields.map(([id, label]) => (
        <span key={id}>{label} <strong>{pools[id]}</strong></span>
      ))}
    </span>
  );
}

export function IncludedMorphWare({ morph }: { morph: MorphDefinition }) {
  return morph.includedWare?.length ? <p className="concept-text">Built-in ware <strong>{morph.includedWare.join(', ')}</strong></p> : null;
}

export function MorphSource({ morph }: { morph: MorphDefinition }) {
  if (!morph.source) return <p className="rules-note">Legacy morph profile. Its durability is illustrative.</p>;
  return (
    <p className="rules-note">
      <a href={morph.source.url}>{morph.source.label}</a>
      {morph.morphPointsSource && <> · <a href={morph.morphPointsSource.url}>{morph.morphPointsSource.label}</a></>}
      {' · '}<a href={quickStartRules.publisherUrl}>{quickStartRules.publisher}</a> ·{' '}
      <a href={quickStartRules.licenseUrl}>{quickStartRules.license}</a>
    </p>
  );
}

export function QuickStartCredit() {
  return (
    <>
      Game data and calculations adapted from <a href={quickStartRules.url}>{quickStartRules.title} v{quickStartRules.version}</a> by{' '}
      <a href={quickStartRules.publisherUrl}>{quickStartRules.publisher} (eclipsephase.com)</a>, licensed{' '}
      <a href={quickStartRules.licenseUrl}>{quickStartRules.license}</a>.
    </>
  );
}
