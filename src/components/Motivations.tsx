import { defaultFactionMotivation, motivationsSource, personalMotivationSlots } from '../rules/calculations/motivations.ts';
import type { StartingMotivation } from '../rules/calculations/motivations.ts';
import type { CreationPackages, CreationPackageSelection, PersonalMotivation, PersonalMotivations } from '../types/character.ts';
import { Card } from './ui/card.tsx';

const labels = { first: 'Personal motivation 1', second: 'Personal motivation 2', third: 'Personal motivation 3' };

export function MotivationEditor({ packages, choices, onChange, onFactionChange }: {
  packages: CreationPackages;
  choices: PersonalMotivations;
  onChange: (choices: PersonalMotivations) => void;
  onFactionChange: (update: Pick<CreationPackageSelection, 'motivation' | 'motivationGoal'>) => void;
}) {
  const factionDefault = defaultFactionMotivation(packages);
  return (
    <Card className="editor-panel">
      <h2>Motivations</h2>
      <p className="muted">Choose causes or personal aims your ego supports or opposes. You can leave fields open while drafting.</p>
      <div className="identity-fields">
        {factionDefault && (
          <>
            <label className="concept">
              Faction motivation
              <input value={packages.faction?.motivation ?? ''} placeholder={factionDefault}
                maxLength={200} onChange={(event) => onFactionChange({ motivation: event.target.value })} />
            </label>
            <label className="concept">
              Faction motivation goal (optional)
              <textarea rows={2} maxLength={1000} value={packages.faction?.motivationGoal ?? ''}
                onChange={(event) => onFactionChange({ motivationGoal: event.target.value })} />
            </label>
          </>
        )}
        {personalMotivationSlots.map((slot) => {
          if (slot === 'third' && factionDefault) return null;
          const { text = '', stance = 'support', goal = '' } = choices[slot] ?? {};
          function update(changes: Partial<PersonalMotivation>) {
            onChange({ ...choices, [slot]: { text, stance, goal, ...changes } });
          }
          return (
            <div key={slot} className="concept identity-fields">
              <label>
                {labels[slot]}
                <input value={text} maxLength={200} onChange={(event) => update({ text: event.target.value })} />
              </label>
              <label>
                {labels[slot]} stance
                <select value={stance} onChange={(event) => update({ stance: event.target.value === 'oppose' ? 'oppose' : 'support' })}>
                  <option value="support">+ Support</option>
                  <option value="oppose">− Oppose</option>
                </select>
              </label>
              <label className="concept">
                {labels[slot]} goal (optional)
                <textarea rows={2} maxLength={1000} value={goal} onChange={(event) => update({ goal: event.target.value })} />
              </label>
            </div>
          );
        })}
      </div>
      {factionDefault && (choices.third?.text.trim() || choices.third?.goal?.trim()) && (
        <p className="rules-note">Your third personal slot is saved for when the ego has no faction.</p>
      )}
      <p className="rules-note"><a href={motivationsSource}>Core motivation rules</a></p>
    </Card>
  );
}

export function MotivationSummary({ motivations }: { motivations: readonly StartingMotivation[] }) {
  if (!motivations.length) return null;
  return (
    <section>
      <h3>Motivations</h3>
      <ul>
        {motivations.map(({ label, goal }, index) => (
          <li key={index}>
            <strong className="concept-text">{label}</strong>
            {goal && <p className="concept-text">Goal: {goal}</p>}
          </li>
        ))}
      </ul>
      <p className="rules-note"><a href={motivationsSource}>Core motivation rules</a></p>
    </section>
  );
}
