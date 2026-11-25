import { useState } from 'react';
import { normalizeSpecializationName, specializationKey } from '../rules/calculations/skill-specializations.ts';
import type { traceSkillSpecializations } from '../rules/calculations/skill-specializations.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import type { SkillSpecialization } from '../types/character.ts';

export function SkillSpecializations({ entries, skills = [], onChange }: {
  entries: ReturnType<typeof traceSkillSpecializations>;
  skills?: readonly { id: string; name: string }[];
  onChange?: (specializations: SkillSpecialization[]) => void;
}) {
  const [skillId, setSkillId] = useState('');
  const [name, setName] = useState('');
  const [issue, setIssue] = useState('');
  const [notice, setNotice] = useState('');
  const selectedSkillId = skills.some(({ id }) => id === skillId) ? skillId : '';
  const choices = entries.map(({ skillId, name }) => ({ skillId, name }));
  const { cpPerSpecialization, specializationBonus, specializationsUrl } = coreCustomizationRules;
  if (!onChange && !entries.length) return null;

  function add() {
    const choice = { skillId: selectedSkillId, name: normalizeSpecializationName(name) };
    setNotice('');
    if (!choice.skillId || !choice.name) {
      setIssue('Choose a skill and enter a specialization name.');
      return;
    }
    const key = specializationKey(choice);
    if (choices.some((existing) => specializationKey(existing) === key)) {
      setIssue('That skill already has this specialization.');
      return;
    }
    onChange?.([...choices, choice]);
    setIssue('');
    setName('');
    setNotice('Specialization added to the draft.');
  }

  return (
    <section className="skill-transfers" aria-labelledby="skill-specializations-title">
      <h3 id="skill-specializations-title">Skill specializations</h3>
      {onChange && (
        <>
          <p className="muted">
            Each specialization costs {cpPerSpecialization} CP and gives +{specializationBonus} when it applies.
          </p>
          {skills.length ? (
            <div className="identity-fields">
              <label>
                Skill to specialize in
                <select value={selectedSkillId} onChange={(event) => { setSkillId(event.target.value); setIssue(''); }}>
                  <option value="">Choose a skill</option>
                  {skills.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
              <label>
                Specialization name
                <input value={name} onChange={(event) => { setName(event.target.value); setIssue(''); }} />
              </label>
              <button type="button" className="button secondary" onClick={add}>Add specialization</button>
            </div>
          ) : <p className="muted">Add a skill to the ledger to choose a specialization.</p>}
          {issue && <p className="error" role="alert">{issue}</p>}
          <p className="rules-note" role="status">{notice}</p>
        </>
      )}
      {entries.length > 0 && (
        <ul>
          {entries.map((entry, index) => (
            <li key={specializationKey(entry)}>
              <div>
                <p><strong>{entry.skillName} ({entry.name})</strong></p>
                {entry.missingSkill ? <p className="error">Needs review. This skill is missing from the ledger. The specialization still costs CP.</p>
                  : <p>{entry.target === undefined ? `+${specializationBonus} when it applies · Target pending`
                    : `Target ${entry.target} when it applies (+${specializationBonus})`}</p>}
              </div>
              {onChange && (
                <button type="button" className="text-button" aria-label={`Remove ${entry.name} from ${entry.skillName}`} onClick={() => {
                  onChange(choices.filter((_, choiceIndex) => choiceIndex !== index));
                  setIssue('');
                  setNotice('Specialization removed from the draft.');
                }}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="rules-note"><a href={specializationsUrl}>Core specialization rules</a></p>
    </section>
  );
}
