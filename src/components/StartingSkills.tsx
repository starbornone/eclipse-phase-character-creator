import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import type { SkillInputs } from '../rules/calculations/starting-skills.ts';
import { traceSkillSpecializations } from '../rules/calculations/skill-specializations.ts';
import { coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';
import type { Ego, SkillPointPurchase, SkillPointTransfer, SkillSpecialization } from '../types/character.ts';
import { SkillSpecializations } from './SkillSpecializations.tsx';
import { SkillTransfers } from './SkillTransfers.tsx';

export function StartingSkills({ ego, onToggleArt, onTransfersChange, onPurchasesChange, onSpecializationsChange }: {
  ego: SkillInputs & Pick<Ego, 'specializations'>;
  onToggleArt?: (field: string) => void;
  onTransfersChange?: (transfers: SkillPointTransfer[]) => void;
  onPurchasesChange?: (purchases: SkillPointPurchase[]) => void;
  onSpecializationsChange?: (specializations: SkillSpecialization[]) => void;
}) {
  const ledger = calculateStartingSkills(ego);
  const { skills, unassignedKnowPoints, cap, transferResults } = ledger;
  const specializations = traceSkillSpecializations(skills, ego.specializations);
  if (!skills.length && !unassignedKnowPoints && !transferResults.length && !ledger.purchaseResults.length
    && !specializations.length && !onToggleArt && !onSpecializationsChange) return null;

  return (
    <section className="panel editor-panel starting-skills" aria-labelledby="starting-skills-title">
      <h2 id="starting-skills-title">Starting skill ledger</h2>
      <p className="muted">Totals add allocated points to the linked aptitude. Fray and Perceive use twice their aptitude.</p>
      {unassignedKnowPoints > 0 && <p className="muted">{unassignedKnowPoints} Know points await a field choice.</p>}
      {skills.length ? (
        <div className="comparison-scroll" role="region" aria-label="Starting skill totals" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">Skill</th><th scope="col">Allocated points</th><th scope="col">Aptitude base</th><th scope="col">Total</th></tr></thead>
            <tbody>
              {skills.map(({ id, name, fieldKey, grants, adjustableKnow, isArt, aptitude, aptitudeScore, base, multiplier, packagePoints, allocatedPoints, purchasedPoints, total, excess }) => (
                <tr key={id}>
                  <th scope="row">
                    {name}
                    {fieldKey && adjustableKnow && onToggleArt && (
                      <label className="skill-art">
                        <input type="checkbox" checked={isArt} onChange={() => onToggleArt(fieldKey)} aria-label={`Art field for ${name}`} />
                        Art field
                      </label>
                    )}
                  </th>
                  <td>
                    <strong>{allocatedPoints + purchasedPoints}</strong>
                    {grants.map(({ source, points }, index) => <span className="skill-grant muted" key={index}>{source} +{points}</span>)}
                    {allocatedPoints !== packagePoints && (
                      <span className="skill-grant muted">Transfers {allocatedPoints > packagePoints ? '+' : ''}{allocatedPoints - packagePoints}</span>
                    )}
                    {purchasedPoints > 0 && <span className="skill-grant muted">Purchased +{purchasedPoints}</span>}
                  </td>
                  <td>
                    {aptitude?.toUpperCase() ?? '—'}
                    {aptitudeScore === undefined ? ' · pending' : multiplier === 2 ? ` ${aptitudeScore} × 2 = ${base}` : ` ${base}`}
                  </td>
                  <td>
                    <strong>{total ?? '—'}</strong>
                    {excess > 0 && <span className="skill-grant error">{excess} over {cap}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted">Choose a package or enter Reflexes or Intuition to see skills here.</p>}
      <SkillTransfers ego={ego} ledger={ledger} onChange={onTransfersChange} onPurchasesChange={onPurchasesChange} onToggleArt={onToggleArt} />
      <SkillSpecializations entries={specializations} skills={skills} onChange={onSpecializationsChange} />
      <p className="rules-note">
        Art fields use Intuition. Other Know fields use Cognition. Review over-cap totals before play.{' '}
        <a href={coreAptitudeRules.coreBookUrl}>Core rulebook, pp. 45 and 48–50</a>
      </p>
    </section>
  );
}
