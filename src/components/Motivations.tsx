import { defaultFactionMotivation, motivationsSource, personalMotivationSlots } from '../rules/calculations/motivations.ts';
import type { CreationPackages, PersonalMotivation, PersonalMotivations } from '../types/character.ts';
import { Card } from './ui/card.tsx';

const labels = { first: 'Personal motivation 1', second: 'Personal motivation 2', third: 'Personal motivation 3' };

export function MotivationEditor({ packages, choices, onChange, onFactionChange }: {
  packages: CreationPackages;
  choices: PersonalMotivations;
  onChange: (choices: PersonalMotivations) => void;
  onFactionChange: (text: string) => void;
}) {
  const factionDefault = defaultFactionMotivation(packages);
  return (
    <Card className="editor-panel">
      <h2>Motivations</h2>
      <p className="muted">Choose causes or personal aims your ego supports or opposes. You can leave fields open while drafting.</p>
      <div className="identity-fields">
        {factionDefault && (
          <label className="concept">
            Faction motivation
            <input value={packages.faction?.motivation ?? ''} placeholder={factionDefault}
              maxLength={200} onChange={(event) => onFactionChange(event.target.value)} />
          </label>
        )}
        {personalMotivationSlots.map((slot) => {
          if (slot === 'third' && factionDefault) return null;
          const { text = '', stance = 'support' } = choices[slot] ?? {};
          function update(choice: PersonalMotivation) {
            onChange({ ...choices, [slot]: choice });
          }
          return (
            <div key={slot} className="concept identity-fields">
              <label>
                {labels[slot]}
                <input value={text} maxLength={200} onChange={(event) => update({ text: event.target.value, stance })} />
              </label>
              <label>
                {labels[slot]} stance
                <select value={stance} onChange={(event) => update({ text, stance: event.target.value === 'oppose' ? 'oppose' : 'support' })}>
                  <option value="support">+ Support</option>
                  <option value="oppose">− Oppose</option>
                </select>
              </label>
            </div>
          );
        })}
      </div>
      {factionDefault && choices.third?.text.trim() && (
        <p className="rules-note">Your third personal motivation is saved for when the ego has no faction.</p>
      )}
      <p className="rules-note"><a href={motivationsSource}>Core motivation rules</a></p>
    </Card>
  );
}

export function MotivationSummary({ motivations }: { motivations: readonly string[] }) {
  if (!motivations.length) return null;
  return (
    <section>
      <h3>Motivations</h3>
      <ul>{motivations.map((text, index) => <li className="concept-text" key={index}>{text}</li>)}</ul>
      <p className="rules-note"><a href={motivationsSource}>Core motivation rules</a></p>
    </section>
  );
}
