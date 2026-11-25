import { useState } from 'react';
import { calculateStartingSkills, knowFieldKey } from '../rules/calculations/starting-skills.ts';
import type { SkillInputs } from '../rules/calculations/starting-skills.ts';
import { activeSkillNames } from '../rules/datasets/active-skills.ts';
import type { SkillPointTransfer } from '../types/character.ts';

type Ledger = ReturnType<typeof calculateStartingSkills>;
const newKnowDestination = 'new-know';

export function SkillTransfers({ ego, ledger, onChange, onToggleArt }: {
  ego: SkillInputs;
  ledger: Ledger;
  onChange?: (transfers: SkillPointTransfer[]) => void;
  onToggleArt?: (field: string) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [knowField, setKnowField] = useState('');
  const [isArt, setIsArt] = useState(false);
  const [points, setPoints] = useState('');
  const [issue, setIssue] = useState('');
  const [notice, setNotice] = useState('');
  const transfers = ego.skillTransfers ?? [];
  const sources = ledger.skills.filter((skill) => skill.allocatedPoints > 0);
  const hasChoices = sources.length > 0;
  if (!ledger.transferResults.length && (!onChange || !hasChoices)) return null;
  const listedSkills = new Set(ledger.skills.map(({ id }) => id));
  const newActiveSkills = activeSkillNames.filter((name) => !listedSkills.has(`active:${name}`));
  const isNewKnow = to === newKnowDestination;
  const selectedSource = sources.some(({ id }) => id === from) ? from : '';
  const selectedDestination = isNewKnow || listedSkills.has(to) || newActiveSkills.some((name) => `active:${name}` === to) ? to : '';
  const newKnowField = knowField.trim().replace(/\s+/g, ' ');
  const newFieldKey = knowFieldKey(newKnowField);
  const newKnowId = `know:${newFieldKey}`;
  const canClassifyField = isNewKnow && onToggleArt && !listedSkills.has(newKnowId);

  function addTransfer() {
    if (!onChange) return;
    setNotice('');
    if (isNewKnow && !newKnowField) {
      setIssue('Enter a name for the new Know field.');
      return;
    }
    const entered = points.trim();
    const transfer = {
      from: selectedSource,
      to: isNewKnow ? newKnowId : selectedDestination,
      points: /^\d+$/.test(entered) ? Number(entered) : NaN,
      ...(isNewKnow ? { newKnowField } : {}),
    };
    const next = [...transfers, transfer];
    const artFields = ego.artisticKnowFields ?? [];
    const classificationChanged = canClassifyField && artFields.includes(newFieldKey) !== isArt;
    const artisticKnowFields = classificationChanged
      ? isArt ? [...artFields, newFieldKey] : artFields.filter((field) => field !== newFieldKey)
      : artFields;
    const result = calculateStartingSkills({ ...ego, artisticKnowFields, skillTransfers: next }).transferResults.at(-1);
    if (!result || result.issue) {
      setIssue(result?.issue ?? 'Choose a source and destination skill.');
      return;
    }
    setIssue('');
    setPoints('');
    if (isNewKnow) {
      setKnowField('');
      setIsArt(false);
      setTo(transfer.to);
    }
    setNotice('Transfer added to the draft.');
    if (classificationChanged) onToggleArt?.(newFieldKey);
    onChange(next);
  }

  function removeTransfer(index: number) {
    setIssue('');
    setNotice('Transfer removed from the draft.');
    onChange?.(transfers.filter((_, transferIndex) => index !== transferIndex));
  }

  return (
    <section className="skill-transfers" aria-labelledby="skill-transfers-title">
      <h3 id="skill-transfers-title">Skill point transfers</h3>
      {onChange && hasChoices && (
        <>
          <p className="muted">Move points to a listed skill or add a new destination. Know points can only move to another Know skill.</p>
          <div className="identity-fields">
            <label>
              From skill
              <select value={selectedSource} onChange={(event) => { setFrom(event.target.value); setIssue(''); }}>
                <option value="">Choose source</option>
                {sources.map(({ id, name, allocatedPoints }) => <option key={id} value={id}>{name} ({allocatedPoints} points)</option>)}
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
                <option value={newKnowDestination}>New Know field…</option>
              </select>
            </label>
            {isNewKnow && (
              <label>
                New Know field
                <input value={knowField} onChange={(event) => { setKnowField(event.target.value); setIssue(''); }} />
              </label>
            )}
            {canClassifyField && (
              <label className="skill-art">
                <input type="checkbox" checked={isArt} onChange={(event) => { setIsArt(event.target.checked); setIssue(''); }} />
                Art field (Intuition)
              </label>
            )}
            <label>
              Points to move
              <input inputMode="numeric" value={points} onChange={(event) => { setPoints(event.target.value); setIssue(''); }} />
            </label>
            <button className="button secondary" type="button" onClick={addTransfer}>Add transfer</button>
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
    </section>
  );
}
