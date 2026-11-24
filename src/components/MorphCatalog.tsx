import { Atom, Bot, Dna } from 'lucide-react';
import { quickStartPageUrl, quickStartRules, sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import type { MorphDefinition } from '../types/character.ts';
import { Card } from './ui/card.tsx';

export function MorphIcon({ morph }: { morph: MorphDefinition }) {
  const Icon = morph.category === 'Biomorph' ? Dna : morph.id === 'case' || morph.id === 'vector-frame' ? Atom : Bot;
  return <span aria-hidden="true" className={`morph-icon ${morph.id}`}><Icon size={20} /></span>;
}

export function MorphStats({ morph }: { morph: MorphDefinition }) {
  return (
    <span className="morph-stats">
      <span>Durability <strong>{morph.durability}</strong></span>
      {morph.woundThreshold !== undefined && <span>Wound threshold <strong>{morph.woundThreshold}</strong></span>}
      {morph.deathRating !== undefined && <span>Death rating <strong>{morph.deathRating}</strong></span>}
    </span>
  );
}

export function MorphSource({ morph }: { morph: MorphDefinition }) {
  return morph.sourcePage === undefined
    ? <p className="rules-note">Legacy prototype morph. Its durability is illustrative.</p>
    : <p className="rules-note"><a href={quickStartPageUrl(morph.sourcePage)}>Quick-Start Rules, p. {morph.sourcePage}</a></p>;
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

export function MorphCatalog() {
  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Morph library</h1>
        <p>Browse sample bodies for your first sleeve. These profiles show the health values published in the Quick-Start Rules.</p>
      </header>
      <div className="catalog-grid">
        {sampleMorphs.map((morph) => (
          <Card key={morph.id} className="catalog-card">
            <MorphIcon morph={morph} />
            <p className="caption">{morph.category}</p>
            <h2>{morph.name}</h2>
            <p>{morph.description}</p>
            <MorphStats morph={morph} />
            <MorphSource morph={morph} />
          </Card>
        ))}
      </div>
      <p className="muted catalog-note">To assign a morph, open or create an ego from My egos.</p>
    </>
  );
}
