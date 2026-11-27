import { useState } from 'react';
import { egoTraitChoiceKey, normalizeTraitDetail, scopedEgoTraitIssue, traceEgoTraits } from '../rules/calculations/ego-traits.ts';
import { egoTraits, supportedHardeningStressTypes } from '../rules/datasets/ego-traits.ts';
import { reputationNetworks } from '../rules/datasets/reputation.ts';
import type { EgoTraitChoice } from '../types/character.ts';

export function RepeatableEgoTraits({ choices, onChange }: {
  choices: EgoTraitChoice[];
  onChange: (choices: EgoTraitChoice[]) => void;
}) {
  const [id, setId] = useState('contact');
  const [detail, setDetail] = useState('');
  const [network, setNetwork] = useState('');
  const [issue, setIssue] = useState('');
  const isContact = id === 'contact';
  const isHardening = id === 'hardening';
  const definition = egoTraits.find((trait) => trait.id === id);
  const selected = traceEgoTraits(choices).filter(({ selection }) => selection);

  function add() {
    const networkId = reputationNetworks.find((entry) => entry.id === network)?.id;
    const choice: EgoTraitChoice = { id, level: 1, detail: normalizeTraitDetail(detail), ...(isContact && networkId ? { network: networkId } : {}) };
    const error = scopedEgoTraitIssue(choice, choices);
    if (error) { setIssue(error); return; }
    onChange([...choices, choice]);
    setDetail('');
    setIssue('');
  }

  return (
    <section className="skill-transfers repeatable-traits" aria-labelledby="repeatable-traits-title">
      <h3 id="repeatable-traits-title">Repeatable ego traits</h3>
      <p className="rules-note">Each choice costs 1 CP. Add each contact, morph type, or Hardening stress type separately.</p>
      <div className="identity-fields">
        <label>Trait to add
          <select value={id} onChange={(event) => { setId(event.target.value); setDetail(''); setIssue(''); }}>
            {egoTraits.filter(({ selection }) => selection).map(({ id, name }) => <option value={id} key={id}>{name}</option>)}
          </select>
        </label>
        <label>{isContact ? 'Contact name' : isHardening ? 'Hardening stress type' : 'Familiar morph type'}
          {isHardening ? <select value={detail} aria-describedby="repeatable-trait-effect" onChange={(event) => { setDetail(event.target.value); setIssue(''); }}>
            <option value="">Choose a stress type</option>
            {supportedHardeningStressTypes.map((type) => <option value={type} key={type}>{type}</option>)}
          </select> : <input value={detail} maxLength={100} aria-describedby="repeatable-trait-effect" onChange={(event) => { setDetail(event.target.value); setIssue(''); }} />}
        </label>
        {isContact && <label>Contact reputation network
          <select value={network} onChange={(event) => { setNetwork(event.target.value); setIssue(''); }}>
            <option value="">Choose a network</option>
            {reputationNetworks.map(({ id, name }) => <option value={id} key={id}>{id} · {name}</option>)}
          </select>
        </label>}
        <button type="button" className="button secondary" onClick={add}>Add {definition?.name}</button>
      </div>
      <p className="rules-note" id="repeatable-trait-effect">{definition?.effect}</p>
      {isHardening && <p className="rules-note">The Unknown stress type awaits its required Psi support.</p>}
      {issue && <p className="error" role="alert">{issue}</p>}
      {selected.length > 0 && <ul>
        {selected.map(({ key, name, detail, network }) => <li key={key}>
          <span>{name} · {detail}{network && ` · ${network}`} · 1 CP</span>
          <button type="button" className="button secondary" aria-label={`Remove ${name}: ${detail}${network ? ` (${network})` : ''}`}
            onClick={() => { onChange(choices.filter((choice) => egoTraitChoiceKey(choice) !== key)); setIssue(''); }}>Remove</button>
        </li>)}
      </ul>}
    </section>
  );
}
