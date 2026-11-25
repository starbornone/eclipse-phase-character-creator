import { useState } from 'react';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import type { SkillInputs } from '../rules/calculations/starting-skills.ts';
import type { SkillPointTransfer } from '../types/character.ts';

type Ledger = ReturnType<typeof calculateStartingSkills>;

export function SkillTransfers({ ego, ledger, onChange }: {
  ego: SkillInputs;
  ledger: Ledger;
  onChange?: (transfers: SkillPointTransfer[]) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [points, setPoints] = useState('');
  const [issue, setIssue] = useState('');
  const [notice, setNotice] = useState('');
  const transfers = ego.skillTransfers ?? [];
  const sources = ledger.skills.filter((skill) => skill.allocatedPoints > 0);
  const hasChoices = sources.length > 0 && ledger.skills.length >= 2;
  if (!ledger.transferResults.length && (!onChange || !hasChoices)) return null;

  function addTransfer() {
    if (!onChange) return;
    setNotice('');
    const entered = points.trim();
    const next = [...transfers, { from, to, points: /^\d+$/.test(entered) ? Number(entered) : NaN }];
    const result = calculateStartingSkills({ ...ego, skillTransfers: next }).transferResults.at(-1);
    if (!result || result.issue) {
      setIssue(result?.issue ?? 'Choose a source and destination skill.');
      return;
    }
    setIssue('');
    setPoints('');
    setNotice('Transfer added to the draft.');
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
          <p className="muted">Move points between skills in this ledger. Know points can only move to another Know skill.</p>
          <div className="identity-fields">
            <label>
              From skill
              <select value={sources.some(({ id }) => id === from) ? from : ''} onChange={(event) => { setFrom(event.target.value); setIssue(''); }}>
                <option value="">Choose source</option>
                {sources.map(({ id, name, allocatedPoints }) => <option key={id} value={id}>{name} ({allocatedPoints} points)</option>)}
              </select>
            </label>
            <label>
              To skill
              <select value={ledger.skills.some(({ id }) => id === to) ? to : ''} onChange={(event) => { setTo(event.target.value); setIssue(''); }}>
                <option value="">Choose destination</option>
                {ledger.skills.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
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
