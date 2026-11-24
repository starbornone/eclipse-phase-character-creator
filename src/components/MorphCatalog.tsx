import { Atom, Bot, Dna } from 'lucide-react';
import { sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import { aptitudes } from '../types/character.ts';
import type { MorphDefinition } from '../types/character.ts';
import { Card } from './ui/card.tsx';

export function MorphIcon({ morph }: { morph: MorphDefinition }) {
  const Icon = morph.id === 'industrial-frame' ? Bot : morph.category === 'Biomorph' ? Dna : Atom;
  return <span aria-hidden="true" className={`morph-icon ${morph.id}`}><Icon size={20} /></span>;
}

export function MorphStats({ morph }: { morph: MorphDefinition }) {
  return (
    <span className="morph-stats">
      <span>Durability <strong>{morph.durability}</strong></span>
      {aptitudes.map(({ id, label }) => {
        const modifier = morph.aptitudeModifiers[id];
        return modifier ? <span key={id}>{label} <strong>{modifier > 0 && '+'}{modifier}</strong></span> : null;
      })}
    </span>
  );
}

export function MorphCatalog() {
  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Morph library</h1>
        <p>Browse sample bodies for your first sleeve. These are original prototype fixtures with illustrative stats.</p>
      </header>
      <div className="catalog-grid">
        {sampleMorphs.map((morph) => (
          <Card key={morph.id} className="catalog-card">
            <MorphIcon morph={morph} />
            <p className="caption">{morph.category}</p>
            <h2>{morph.name}</h2>
            <p>{morph.description}</p>
            <MorphStats morph={morph} />
          </Card>
        ))}
      </div>
      <p className="muted catalog-note">To assign a morph, open or create an ego from My egos.</p>
    </>
  );
}
