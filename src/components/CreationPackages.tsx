import { creationPackageKinds } from '../types/character.ts';
import type { CreationPackageKind, CreationPackageSelection, CreationPackages as PackageSelections } from '../types/character.ts';
import { coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';
import { coreCreationPackages, creationPackageNames, findCreationPackage, packageLabels } from '../rules/datasets/creation-packages.ts';
import { Card } from './ui/card.tsx';

export function CorePackageCredit() {
  return (
    <p className="rules-note">
      Package choices adapted from <a href={coreAptitudeRules.coreBookUrl}>Eclipse Phase Second Edition, pp. 38–44</a> by{' '}
      <a href="https://eclipsephase.com/">Posthuman Studios, LLC</a> under{' '}
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.
    </p>
  );
}

export function PackageSummary({ packages }: { packages?: PackageSelections }) {
  const names = creationPackageNames(packages);
  if (!names.length) return null;

  return (
    <dl className="package-summary">
      {names.map(({ kind, label, name }) => <div key={kind}><dt>{label}</dt><dd>{name}</dd></div>)}
    </dl>
  );
}

export function CreationPackages({ packages, onChange }: {
  packages: PackageSelections;
  onChange: (packages: PackageSelections) => void;
}) {
  function update(kind: CreationPackageKind, selection?: CreationPackageSelection) {
    const next = { ...packages };
    if (selection) next[kind] = selection;
    else delete next[kind];
    onChange(next);
  }

  return (
    <Card className="editor-panel">
      <h2>Core creation packages</h2>
      <p className="muted">Choose from the supported starter packages. The grants below are package points for the later skill calculation.</p>
      <div className="package-choices">
        {creationPackageKinds.map((kind) => {
          const selection = packages[kind];
          const choice = findCreationPackage(kind, selection?.id);
          const label = packageLabels[kind];
          const options = coreCreationPackages[kind];
          const groups = [...new Set(options.map(({ group }) => group))];
          return (
            <fieldset key={kind}>
              <legend>{label}</legend>
              <div className="identity-fields">
                <label className="concept">
                  {label} package
                  <select value={selection?.id ?? ''} onChange={(event) => update(kind, event.target.value ? { id: event.target.value } : undefined)}>
                    <option value="">Choose {label.toLowerCase()}</option>
                    {groups.map((group) => {
                      const entries = options.filter((option) => option.group === group)
                        .map(({ id, name }) => <option key={id} value={id}>{name}</option>);
                      return group ? <optgroup key={group} label={group}>{entries}</optgroup> : entries;
                    })}
                  </select>
                </label>
                {selection && choice && choice.grants.flatMap(({ skill, points, slot, suggestedFields, skillOptions }) => slot ? [
                  <label className="concept" key={slot}>
                    {`${label} ${skill} ${skillOptions ? 'choice' : 'field'} (${points} points)`}
                    {skillOptions ? (
                      <select value={selection.fields?.[slot] ?? ''} onChange={(event) => update(kind, {
                        ...selection,
                        fields: { ...selection.fields, [slot]: event.target.value },
                      })}>
                        <option value="">Choose a skill</option>
                        {skillOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : <input
                      value={selection.fields?.[slot] ?? ''}
                      list={suggestedFields ? `${kind}-${slot}-suggestions` : undefined}
                      maxLength={100}
                      onChange={(event) => update(kind, {
                        ...selection,
                        fields: { ...selection.fields, [slot]: event.target.value },
                      })}
                    />}
                    {suggestedFields && (
                      <datalist id={`${kind}-${slot}-suggestions`}>
                        {suggestedFields.map((field) => <option key={field} value={field} />)}
                      </datalist>
                    )}
                  </label>,
                ] : [])}
              </div>
              {choice && (
                <>
                    {choice.requiresPsi && <p className="rules-note">Requires the Psi trait.</p>}
                  <ul className="package-grants">
                    {choice.grants.map(({ skill, points, slot, skillOptions }) => {
                      const field = slot && selection?.fields?.[slot]?.trim();
                      const name = slot ? `${skill}: ${field || (skillOptions ? skillOptions.join(' or ') : 'field to choose')}` : skill;
                      return <li key={slot ?? skill}><span>{name}</span><strong>{points}</strong></li>;
                    })}
                  </ul>
                  <p className="rules-note">Core rulebook, p. {choice.page}</p>
                </>
              )}
            </fieldset>
          );
        })}
      </div>
      <p className="rules-note">Skill and field choices can be filled in later.</p>
      <CorePackageCredit />
    </Card>
  );
}
