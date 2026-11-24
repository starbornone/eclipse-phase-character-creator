import { Atom, Bot, Dna } from 'lucide-react';
import { useRef, useState } from 'react';
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

const comparisonLimit = 3;
const categories = [...new Set(sampleMorphs.map((morph) => morph.category))].sort();
const healthFields = [
  ['durability', 'Durability'],
  ['woundThreshold', 'Wound threshold'],
  ['deathRating', 'Death rating'],
] as const;

function MorphComparison({ morphs, onClear }: { morphs: MorphDefinition[]; onClear: () => void }) {
  return (
    <section className="panel comparison" aria-labelledby="comparison-title">
      <div className="comparison-heading">
        <h2 id="comparison-title">Morph comparison</h2>
        <button type="button" className="button secondary" onClick={onClear}>Clear comparison</button>
      </div>
      <p className="muted" id="comparison-note">
        Creation restrictions are unverified for these Quick-Start profiles.
      </p>
      <div className="comparison-scroll" role="region" aria-labelledby="comparison-title" tabIndex={0}>
        <table aria-describedby="comparison-note">
          <thead>
            <tr>
              <th scope="col">Profile</th>
              {morphs.map((morph) => <th scope="col" key={morph.id}>{morph.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Category</th>
              {morphs.map((morph) => <td key={morph.id}>{morph.category}</td>)}
            </tr>
            {healthFields.map(([field, label]) => (
              <tr key={field}>
                <th scope="row">{label}</th>
                {morphs.map((morph) => <td key={morph.id}>{morph[field] ?? 'Unverified'}</td>)}
              </tr>
            ))}
            <tr>
              <th scope="row">Source</th>
              {morphs.map((morph) => <td key={morph.id}><MorphSource morph={morph} /></td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MorphCatalog() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchInput = useRef<HTMLInputElement>(null);
  const search = query.trim().toLowerCase();
  const matches = sampleMorphs.filter((morph) => (
    (!category || morph.category === category)
    && (morph.name.toLowerCase().includes(search) || morph.description.toLowerCase().includes(search))
  ));
  const selectedMorphs = sampleMorphs.filter((morph) => selectedIds.includes(morph.id));

  function toggleComparison(id: string) {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      return ids.length < comparisonLimit ? [...ids, id] : ids;
    });
  }

  function clearComparison() {
    setSelectedIds([]);
    searchInput.current?.focus();
  }

  function resetFilters() {
    setQuery('');
    setCategory('');
    searchInput.current?.focus();
  }

  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Morph library</h1>
        <p>Browse sample bodies for your first sleeve. These profiles show the health values published in the Quick-Start Rules.</p>
      </header>
      <div className="catalog-filters">
        <label>
          Search morphs
          <input ref={searchInput} type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <p className="catalog-status muted" role="status">
        {matches.length} {matches.length === 1 ? 'morph' : 'morphs'} · {selectedIds.length} of {comparisonLimit} selected
        {selectedIds.length < 2 && ' for comparison. Select at least two to compare.'}
      </p>
      {matches.length === 0 && (
        <Card className="catalog-empty">
          <p>No morphs match these filters.</p>
          <button type="button" className="text-button" onClick={resetFilters}>Reset filters</button>
        </Card>
      )}
      <div className="catalog-grid">
        {matches.map((morph) => (
          <Card key={morph.id} className="catalog-card">
            <MorphIcon morph={morph} />
            <p className="caption">{morph.category}</p>
            <h2>{morph.name}</h2>
            <p>{morph.description}</p>
            <MorphStats morph={morph} />
            <MorphSource morph={morph} />
            <label className="compare-toggle">
              <input
                type="checkbox"
                checked={selectedIds.includes(morph.id)}
                disabled={selectedIds.length === comparisonLimit && !selectedIds.includes(morph.id)}
                onChange={() => toggleComparison(morph.id)}
              />
              <span>Compare {morph.name}</span>
            </label>
          </Card>
        ))}
      </div>
      {selectedMorphs.length > 0 && (
        selectedMorphs.length >= 2
          ? <MorphComparison morphs={selectedMorphs} onClear={clearComparison} />
          : <button type="button" className="button secondary comparison" onClick={clearComparison}>Clear comparison</button>
      )}
      <p className="muted catalog-note">To assign a morph, open or create an ego from My egos.</p>
    </>
  );
}
