import { useState } from 'react';
import { traceStartingEquipment } from '../rules/calculations/starting-equipment.ts';
import { equipmentCategories, startingEquipment } from '../rules/datasets/starting-equipment.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import { Card } from './ui/card.tsx';

type EquipmentItems = ReturnType<typeof traceStartingEquipment>;
const equipmentGroups = equipmentCategories.map((category) => ({
  category,
  items: startingEquipment.filter((item) => item.category === category),
}));

function EquipmentList({ items, onRemove }: { items: EquipmentItems; onRemove?: (id: string) => void }) {
  return (
    <ul className="starting-equipment-items">
      {items.map(({ id, name, source, complexity, restricted, quantity, mpPerItem, totalMp }) => (
        <li key={id}>
          <div>
            <a href={source}>{name}</a>{quantity > 1 && ` × ${quantity}`}{restricted && ' · Restricted'}
            <p className="rules-note">{complexity} · {mpPerItem} MP each{quantity > 1 && ` · ${totalMp} MP total`}</p>
          </div>
          {onRemove && (
            <button type="button" className="text-button" aria-label={`Remove one ${name}`} onClick={() => onRemove(id)}>Remove one</button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StartingEquipmentEditor({ purchases, onChange }: { purchases: string[]; onChange: (purchases: string[]) => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const search = query.trim().toLowerCase();
  const matchingGroups = equipmentGroups.map(({ category, items }) => ({
    category,
    items: category.toLowerCase().includes(search) ? items : items.filter(({ name }) => name.toLowerCase().includes(search)),
  })).filter(({ items }) => items.length > 0);
  const visibleSelection = matchingGroups.some(({ items }) => items.some(({ id }) => id === selected)) ? selected : '';
  const matchCount = matchingGroups.reduce((sum, { items }) => sum + items.length, 0);
  const items = traceStartingEquipment(purchases);
  const totalMp = items.reduce((sum, { totalMp }) => sum + totalMp, 0);
  const { gearMpByComplexity, sourceUrl } = startingMorphBudgetRules;

  function remove(id: string) {
    const index = purchases.indexOf(id);
    onChange(purchases.filter((_, position) => position !== index));
  }

  return (
    <Card className="editor-panel starting-equipment">
      <h2>Extra starting equipment</h2>
      <p className="rules-note">Buy extra equipment with MP. <a href={`${sourceUrl}#extra-gear`}>Core costs by complexity</a></p>
      <div className="identity-fields">
        <label className="concept">
          Search equipment
          <input type="search" value={query} aria-controls="starting-equipment-choice"
            onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }} />
        </label>
        <label className="concept">
          Equipment to buy
          <select id="starting-equipment-choice" value={visibleSelection} disabled={!matchCount} onChange={(event) => setSelected(event.target.value)}>
            <option value="">{matchCount ? 'Choose equipment' : 'No matching equipment'}</option>
            {matchingGroups.map(({ category, items }) => (
              <optgroup key={category} label={category}>
                {items.map(({ id, name, complexity, restricted }) => (
                  <option key={id} value={id}>{name} · {gearMpByComplexity[complexity]} MP{restricted && ' · Restricted'}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <div className="actions">
        <button type="button" className="button secondary" disabled={!visibleSelection} onClick={() => {
          if (visibleSelection) onChange([...purchases, visibleSelection]);
        }}>Add one</button>
        <p className="rules-note" role="status">{totalMp} MP in extra equipment{search && ` · ${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`}</p>
      </div>
      <EquipmentList items={items} onRemove={remove} />
    </Card>
  );
}

export function StartingEquipmentSummary({ items, styled }: { items: EquipmentItems; styled?: boolean }) {
  if (!items.length) return null;
  return (
    <section className={styled ? 'starting-equipment panel editor-panel' : 'starting-equipment'}>
      <h3>Extra starting equipment</h3>
      <EquipmentList items={items} />
    </section>
  );
}
