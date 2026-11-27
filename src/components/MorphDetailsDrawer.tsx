import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { egoPath, morphSelectionPath } from '../app/paths.ts';
import { activeSleeve } from '../features/sleeve/history.ts';
import { traceIncludedMorphTraits } from '../rules/calculations/morph-traits.ts';
import { synthCharacteristicsSource, synthEnvironmentCapabilities } from '../rules/datasets/core-physical-morphs.ts';
import type { CharacterDraft, MorphDefinition } from '../types/character.ts';
import { IncludedMorphTraits } from './IncludedMorphTraits.tsx';
import { IncludedMorphWare, MorphSource, MorphStats } from './MorphProfile.tsx';

function MorphAssignment({ morph, drafts }: { morph: MorphDefinition; drafts: readonly CharacterDraft[] }) {
  const [egoId, setEgoId] = useState('');
  const draft = drafts.find(({ ego }) => ego.id === egoId);
  const resleeving = Boolean(activeSleeve(draft));
  const path = draft ? egoPath(draft.ego.id, resleeving ? 'resleeve' : 'edit') : '/egos/new';
  const action = resleeving ? 'Preview resleeving' : draft ? 'Review assignment' : 'Create ego with this morph';
  return (
    <section className="morph-assignment" aria-labelledby="morph-assign-title">
      <h3 id="morph-assign-title">Assign to ego</h3>
      {drafts.length > 0 && (
        <div className="identity-fields">
          <label>
            Ego
            <select value={draft?.ego.id ?? ''} onChange={(event) => setEgoId(event.target.value)}>
              <option value="">New ego</option>
              {drafts.map((record) => (
                <option key={record.ego.id} value={record.ego.id}>
                  {record.ego.name || 'Untitled ego'} · {activeSleeve(record) ? 'Assigned sleeve' : 'No sleeve'}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p className="muted">Review the selected morph and save in the editor to apply it.</p>
      <Link className="button primary" to={morphSelectionPath(path, morph.id)}>{action}</Link>
    </section>
  );
}

function MorphDetails({ morph, drafts }: { morph: MorphDefinition; drafts: readonly CharacterDraft[] }) {
  const { availability, category, size, limitations = [], commonExtras = [] } = morph;
  const synthmorph = category === 'Synthmorph';
  const infomorph = category === 'Infomorph';
  return (
    <>
      <p className="caption">{category}</p>
      <h2 id="morph-details-title">{morph.name}</h2>
      <p>{morph.description}</p>
      <section aria-label="Base profile">
        <h3>Base profile</h3>
        <MorphStats morph={morph} />
        {size && <p>Size <strong>{size}</strong></p>}
        <IncludedMorphWare morph={morph} />
        <IncludedMorphTraits entries={traceIncludedMorphTraits(morph)} />
        {synthmorph && <p>Shell capabilities <strong>{synthEnvironmentCapabilities.join(', ')}</strong></p>}
        {commonExtras.length > 0 && <p>Common or optional extras <strong>{commonExtras.join(', ')}</strong></p>}
      </section>
      <section aria-label="Availability and restrictions">
        <h3>Availability and restrictions</h3>
        {availability !== undefined && (
          <p>Availability <strong>{availability}</strong> · <a href="https://eclipsephase.github.io/en/15/03-acquiring-morphs.html#morph-availability">Used when acquiring a morph during play</a>. Starting morphs use your GM’s MP allowance.</p>
        )}
        {synthmorph && <p>Tactile Perceive Tests take a −30 modifier. <a href={synthCharacteristicsSource}>Synthmorph characteristics</a></p>}
        {infomorph && <p>A digital sleeve uses a host, with physical actions handled through controlled devices.</p>}
        {limitations.length > 0 && <ul>{limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul>}
        {Boolean(morph.movement?.length) && <p className="rules-note">Movement lists base and full distance in meters per action turn. <a href="https://eclipsephase.github.io/en/12/24-movement.html#movement-rate">Movement rules</a></p>}
        <MorphSource morph={morph} />
      </section>
      <MorphAssignment morph={morph} drafts={drafts} />
    </>
  );
}

export function MorphDetailsDrawer({ morph, drafts, onClose }: {
  morph?: MorphDefinition;
  drafts: readonly CharacterDraft[];
  onClose: () => void;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (morph && drawer.current && !drawer.current.open) drawer.current.showModal();
  }, [morph]);
  return (
    <dialog ref={drawer} className="morph-details-drawer" aria-labelledby="morph-details-title" onClose={onClose}>
      <button type="button" className="button secondary drawer-close" onClick={() => drawer.current?.close()}>Close details</button>
      {morph && <MorphDetails key={morph.id} morph={morph} drafts={drafts} />}
    </dialog>
  );
}
