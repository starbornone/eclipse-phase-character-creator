import { useState } from 'react';
import { traceStartingEquipment } from '../rules/calculations/starting-equipment.ts';
import { findStartingEquipment, startingEquipment } from '../rules/datasets/starting-equipment.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import { Card } from './ui/card.tsx';

type EquipmentItems = ReturnType<typeof traceStartingEquipment>;

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
  const [selected, setSelected] = useState('');
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
          Equipment to buy
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Choose equipment</option>
            {startingEquipment.map(({ id, name, complexity, restricted }) => (
              <option key={id} value={id}>{name} · {gearMpByComplexity[complexity]} MP{restricted && ' · Restricted'}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="actions">
        <button type="button" className="button secondary" disabled={!selected} onClick={() => {
          if (findStartingEquipment(selected)) onChange([...purchases, selected]);
        }}>Add one</button>
        <p className="rules-note" role="status">{totalMp} MP in extra equipment</p>
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
