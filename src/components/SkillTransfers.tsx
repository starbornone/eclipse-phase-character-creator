import { useState } from 'react';
import { resolveCustomActiveField } from '../rules/calculations/active-fields.ts';
import { calculateStartingSkills, knowFieldKey } from '../rules/calculations/starting-skills.ts';
import type { SkillInputs } from '../rules/calculations/starting-skills.ts';
import { activeFieldCategories, activeSkillNames } from '../rules/datasets/active-skills.ts';
import { aptitudes } from '../types/character.ts';
import type { SkillPointPurchase, SkillPointTransfer } from '../types/character.ts';

type Ledger = ReturnType<typeof calculateStartingSkills>;
const newKnowDestination = 'new-know';
const newActiveFieldDestination = 'new-active-field';
const cpSource = 'cp';

export function SkillTransfers({ ego, ledger, onChange, onPurchasesChange, onToggleArt }: {
  ego: SkillInputs;
  ledger: Ledger;
  onChange?: (transfers: SkillPointTransfer[]) => void;
  onPurchasesChange?: (purchases: SkillPointPurchase[]) => void;
  onToggleArt?: (field: string) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [knowField, setKnowField] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeField, setActiveField] = useState('');
  const [exoticAptitude, setExoticAptitude] = useState('');
  const [isArt, setIsArt] = useState(false);
  const [points, setPoints] = useState('');
  const [issue, setIssue] = useState('');
  const [notice, setNotice] = useState('');
  const transfers = ego.skillTransfers ?? [];
  const purchases = ego.skillPurchases ?? [];
  const sources = ledger.skills.filter((skill) => skill.allocatedPoints > 0);
  const editable = Boolean(onPurchasesChange || (onChange && sources.length));
  if (!editable && !ledger.transferResults.length && !ledger.purchaseResults.length) return null;
  const listedSkills = new Set(ledger.skills.map(({ id }) => id));
  const newActiveSkills = activeSkillNames.filter((name) => !listedSkills.has(`active:${name}`));
  const isNewKnow = to === newKnowDestination;
  const isNewActive = to === newActiveFieldDestination;
  const activeFieldCategory = activeFieldCategories.find(({ id }) => id === activeCategory);
  const buying = Boolean(onPurchasesChange && from === cpSource);
  const selectedSource = buying || sources.some(({ id }) => id === from) ? from : '';
  const selectedDestination = isNewKnow || isNewActive || listedSkills.has(to) || newActiveSkills.some((name) => `active:${name}` === to) ? to : '';
  const newKnowField = knowField.trim().replace(/\s+/g, ' ');
  const newFieldKey = knowFieldKey(newKnowField);
  const newKnowId = `know:${newFieldKey}`;
  const canClassifyField = isNewKnow && onToggleArt && !listedSkills.has(newKnowId);

  function addAllocation() {
    setNotice('');
    if (isNewKnow && !newKnowField) {
      setIssue('Enter a name for the new Know field.');
      return;
    }
    const newActive = isNewActive ? resolveCustomActiveField({
      category: activeCategory,
      name: activeField,
      aptitude: activeFieldCategory?.aptitude ?? exoticAptitude,
    }) : undefined;
    if (isNewActive && !newActive) {
      setIssue('Choose a category and enter a new field name. For an Exotic Skill, choose its linked aptitude. Use the existing option for a sample field.');
      return;
    }
    const entered = points.trim();
    const listedDestination = ledger.skills.find(({ id }) => id === selectedDestination);
    const existingField = listedDestination?.fieldKey && (buying || listedDestination.purchasedOnly)
      ? listedDestination.name.slice('Know: '.length) : undefined;
    const destinationField = isNewKnow ? newKnowField : existingField;
    const customActiveField = newActive?.field ?? listedDestination?.customActiveField;
    const allocation = {
      to: isNewKnow ? newKnowId : newActive?.id ?? selectedDestination,
      points: /^\d+$/.test(entered) ? Number(entered) : NaN,
      ...(destinationField ? { newKnowField: destinationField } : {}),
      ...(customActiveField ? { customActiveField } : {}),
    };
    const nextTransfers = buying ? transfers : [...transfers, { from: selectedSource, ...allocation }];
    const nextPurchases = buying ? [...purchases, allocation] : purchases;
    const artFields = ego.artisticKnowFields ?? [];
    const classificationChanged = canClassifyField && artFields.includes(newFieldKey) !== isArt;
    const artisticKnowFields = classificationChanged
      ? isArt ? [...artFields, newFieldKey] : artFields.filter((field) => field !== newFieldKey)
      : artFields;
    const updated = calculateStartingSkills({ ...ego, artisticKnowFields, skillTransfers: nextTransfers, skillPurchases: nextPurchases });
    const result = (buying ? updated.purchaseResults : updated.transferResults).at(-1);
    if (!result || result.issue) {
      setIssue(result?.issue ?? 'Choose a destination skill.');
      return;
    }
    setIssue('');
    setPoints('');
    if (isNewKnow) {
      setKnowField('');
      setIsArt(false);
      setTo(allocation.to);
    }
    if (isNewActive) {
      setActiveField('');
      setTo(allocation.to);
    }
    setNotice(buying ? 'Purchase added to the draft.' : 'Transfer added to the draft.');
    if (classificationChanged) onToggleArt?.(newFieldKey);
    if (buying) onPurchasesChange?.(nextPurchases);
    else onChange?.(nextTransfers);
  }

  function removeTransfer(index: number) {
    setIssue('');
    setNotice('Transfer removed from the draft.');
    onChange?.(transfers.filter((_, transferIndex) => index !== transferIndex));
  }

  function removePurchase(index: number) {
    setIssue('');
    setNotice('Purchase removed from the draft.');
    onPurchasesChange?.(purchases.filter((_, purchaseIndex) => index !== purchaseIndex));
  }

  return (
    <section className="skill-transfers" aria-labelledby="skill-transfers-title">
      <h3 id="skill-transfers-title">Allocate skill points</h3>
      {editable && (
        <>
          <p className="muted">Move package points or buy points with CP. Know package points can only move to another Know skill.</p>
          <div className="identity-fields">
            <label>
              Point source
              <select value={selectedSource} onChange={(event) => { setFrom(event.target.value); setIssue(''); }}>
                <option value="">Choose source</option>
                {onPurchasesChange && <option value={cpSource}>Customization Points (CP)</option>}
                {onChange && sources.map(({ id, name, allocatedPoints }) => <option key={id} value={id}>{name} ({allocatedPoints} points)</option>)}
              </select>
            </label>
            <label>
              To skill
              <select value={selectedDestination} onChange={(event) => { setTo(event.target.value); setIssue(''); }}>
                <option value="">Choose destination</option>
                <optgroup label="In the ledger">
                  {ledger.skills.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </optgroup>
                <optgroup label="New Active skill">
                  {newActiveSkills.map((name) => <option key={name} value={`active:${name}`}>{name}</option>)}
                </optgroup>
                <option value={newActiveFieldDestination}>Custom Active field…</option>
                <option value={newKnowDestination}>New Know field…</option>
              </select>
            </label>
            {isNewKnow && (
              <label>
                New Know field
                <input value={knowField} onChange={(event) => { setKnowField(event.target.value); setIssue(''); }} />
              </label>
            )}
            {isNewActive && (
              <>
                <label>
                  Active field category
                  <select value={activeCategory} onChange={(event) => { setActiveCategory(event.target.value); setIssue(''); }}>
                    <option value="">Choose a category</option>
                    {activeFieldCategories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </label>
                <label>
                  Active field name
                  <input value={activeField} onChange={(event) => { setActiveField(event.target.value); setIssue(''); }} />
                </label>
                {activeCategory === 'exotic' && (
                  <label>
                    GM-approved aptitude
                    <select value={exoticAptitude} onChange={(event) => { setExoticAptitude(event.target.value); setIssue(''); }}>
                      <option value="">Choose an aptitude</option>
                      {aptitudes.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </label>
                )}
              </>
            )}
            {canClassifyField && (
              <label className="skill-art">
                <input type="checkbox" checked={isArt} onChange={(event) => { setIsArt(event.target.checked); setIssue(''); }} />
                Art field (Intuition)
              </label>
            )}
            <label>
              {buying ? 'Points to buy' : 'Points to move'}
              <input inputMode="numeric" value={points} onChange={(event) => { setPoints(event.target.value); setIssue(''); }} />
            </label>
            <button className="button secondary" type="button" onClick={addAllocation}>{buying ? 'Add purchase' : 'Add transfer'}</button>
          </div>
          {issue && <p role="alert" className="error">{issue}</p>}
        </>
      )}
      <p role="status" className="rules-note">{notice}</p>
      {ledger.transferResults.length > 0 && (
        <ol>
          {ledger.transferResults.map(({ transfer, fromName, toName, issue: transferIssue }, index) => (
            <li key={index}>
              <div>
                <p>{transfer.points} points from <strong>{fromName}</strong> to <strong>{toName}</strong></p>
                {transferIssue && <p className="error">Needs review. {transferIssue}</p>}
              </div>
              {onChange && <button type="button" className="text-button" aria-label={`Remove transfer ${index + 1}`} onClick={() => removeTransfer(index)}>Remove</button>}
            </li>
          ))}
        </ol>
      )}
      {ledger.purchaseResults.length > 0 && (
        <ol aria-label="Skill purchases">
          {ledger.purchaseResults.map(({ purchase, toName, issue: purchaseIssue }, index) => (
            <li key={index}>
              <div>
                <p>{purchase.points} purchased points for <strong>{toName}</strong></p>
                {purchaseIssue && <p className="error">Needs review. {purchaseIssue} These points still count toward CP spent.</p>}
              </div>
              {onPurchasesChange && <button type="button" className="text-button" aria-label={`Remove purchase ${index + 1}`} onClick={() => removePurchase(index)}>Remove</button>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
