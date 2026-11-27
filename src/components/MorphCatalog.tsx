import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useOutletContext } from 'react-router';
import type { Workspace } from '../app/App.tsx';
import { filterMorphs, morphFilterOptions } from '../rules/calculations/morph-catalog.ts';
import type { MorphFilters } from '../rules/calculations/morph-catalog.ts';
import { sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import type { MorphDefinition } from '../types/character.ts';
import { MorphDetailsDrawer } from './MorphDetailsDrawer.tsx';
import { MorphIcon, MorphStats } from './MorphProfile.tsx';
import { MorphProfileTable } from './MorphProfileTable.tsx';
import { Card } from './ui/card.tsx';

const comparisonLimit = 3;
const filterOptions = morphFilterOptions(sampleMorphs);

function CatalogFilters({ filters, onChange, searchInput }: {
  filters: MorphFilters;
  onChange: (filters: MorphFilters) => void;
  searchInput: RefObject<HTMLInputElement | null>;
}) {
  const { categories, costs, durability, movement, capabilities } = filterOptions;
  return (
    <div className="catalog-filters">
      <label className="catalog-search">
        Search morphs
        <input ref={searchInput} type="search" value={filters.query ?? ''} onChange={(event) => onChange({ ...filters, query: event.target.value })} />
      </label>
      <label>
        Category
        <select value={filters.category ?? ''} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
          <option value="">All categories</option>
          {categories.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label>
        Maximum cost
        <select value={filters.maximumMp ?? ''} onChange={(event) => onChange({
          ...filters, maximumMp: event.target.value === '' ? undefined : Number(event.target.value),
        })}>
          <option value="">Any cost</option>
          {costs.map((option) => <option key={option} value={option}>{option} MP</option>)}
        </select>
      </label>
      <label>
        Minimum durability
        <select value={filters.minimumDurability ?? ''} onChange={(event) => onChange({
          ...filters, minimumDurability: event.target.value === '' ? undefined : Number(event.target.value),
        })}>
          <option value="">Any durability</option>
          {durability.map((option) => <option key={option} value={option}>{option} DUR</option>)}
        </select>
      </label>
      <label>
        Movement
        <select value={filters.movement ?? ''} onChange={(event) => onChange({ ...filters, movement: event.target.value })}>
          <option value="">Any movement</option>
          {movement.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label>
        Capability
        <select value={filters.capability ?? ''} onChange={(event) => onChange({ ...filters, capability: event.target.value })}>
          <option value="">Any capability</option>
          {capabilities.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label>
        Sort by
        <select value={filters.sort ?? ''} onChange={(event) => onChange({ ...filters, sort: event.target.value })}>
          <option value="">Name</option>
          <option value="cost">Lowest cost</option>
          <option value="durability">Highest durability</option>
        </select>
      </label>
    </div>
  );
}

export function MorphCatalog() {
  const { drafts } = useOutletContext<Workspace>();
  const [filters, setFilters] = useState<MorphFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detail, setDetail] = useState<MorphDefinition>();
  const searchInput = useRef<HTMLInputElement>(null);
  const comparisonTitle = useRef<HTMLHeadingElement>(null);
  const clearComparisonButton = useRef<HTMLButtonElement>(null);
  const matches = filterMorphs(sampleMorphs, filters);
  const selectedMorphs = selectedIds.flatMap((id) => sampleMorphs.find((morph) => morph.id === id) ?? []);
  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

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

  function removeFromComparison(id: string) {
    if (selectedIds.length === 1) {
      clearComparison();
      return;
    }
    clearComparisonButton.current?.focus();
    toggleComparison(id);
  }

  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Morph library</h1>
        <p>Browse core morphs for character creation and resleeving.</p>
      </header>
      <CatalogFilters filters={filters} onChange={setFilters} searchInput={searchInput} />
      <div className="catalog-status">
        <p className="muted" role="status">
          {matches.length} {matches.length === 1 ? 'morph' : 'morphs'} · {selectedIds.length} of {comparisonLimit} selected
          {selectedIds.length < 2 && ' for comparison. Select at least two to compare.'}
        </p>
        {hasFilters && <button type="button" className="text-button" onClick={() => {
          setFilters({});
          searchInput.current?.focus();
        }}>Reset filters</button>}
      </div>
      {selectedMorphs.length > 0 && (
        <section className="panel comparison catalog-comparison" aria-labelledby="comparison-title">
          <div className="comparison-heading">
            <h2 ref={comparisonTitle} id="comparison-title" tabIndex={-1}>Morph comparison</h2>
            <button ref={clearComparisonButton} type="button" className="button secondary" onClick={clearComparison}>Clear comparison</button>
          </div>
          <ul className="comparison-selected" aria-label="Selected morphs">
            {selectedMorphs.map(({ id, name }) => (
              <li key={id}>
                {name}
                <button type="button" className="text-button" aria-label={`Remove ${name} from comparison`} onClick={() => removeFromComparison(id)}>Remove</button>
              </li>
            ))}
          </ul>
          {selectedMorphs.length >= 2 && (
            <>
              <p className="muted" id="comparison-note">Base profiles. Availability applies during play. Scroll the table on narrow screens to see all selected morphs.</p>
              <MorphProfileTable
                columns={selectedMorphs.map((morph) => ({ id: morph.id, label: morph.name, morph }))}
                titleId="comparison-title"
                noteId="comparison-note"
              />
            </>
          )}
        </section>
      )}
      {matches.length === 0 && <Card className="catalog-empty"><p>No morphs match these filters.</p></Card>}
      <div className="catalog-grid">
        {matches.map((morph) => (
          <Card key={morph.id} className="catalog-card">
            <MorphIcon morph={morph} />
            <p className="caption">{morph.category}</p>
            <h2>{morph.name}</h2>
            <p>{morph.description}</p>
            <MorphStats morph={morph} />
            <div className="catalog-card-actions">
              <button type="button" className="text-button" aria-label={`View details for ${morph.name}`} onClick={() => setDetail(morph)}>View details</button>
              <label className="compare-toggle">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(morph.id)}
                  disabled={selectedIds.length === comparisonLimit && !selectedIds.includes(morph.id)}
                  onChange={() => toggleComparison(morph.id)}
                />
                <span>Compare {morph.name}</span>
              </label>
              {selectedIds.length >= 2 && selectedIds.includes(morph.id) && (
                <button type="button" className="text-button" onClick={() => {
                  comparisonTitle.current?.focus({ preventScroll: true });
                  comparisonTitle.current?.scrollIntoView({ block: 'start' });
                }}>View comparison</button>
              )}
            </div>
          </Card>
        ))}
      </div>
      <MorphDetailsDrawer morph={detail} drafts={drafts} onClose={() => setDetail(undefined)} />
    </>
  );
}
