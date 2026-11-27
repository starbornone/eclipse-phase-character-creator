import { aptitudes } from '../../types/character.ts';
import type { AptitudeScores, Ego, SkillPointPurchase } from '../../types/character.ts';
import { coreAptitudeRules } from '../datasets/aptitude-templates.ts';
import { coreCustomizationRules } from '../datasets/customization.ts';
import { evaluateEgoTraitBudget } from './ego-traits.ts';
import { traceStartingPsi, type StartingPsiChoices } from './psi.ts';
import { evaluateReputation } from './reputation.ts';

export function normalizeLanguage(language: string) {
  return language.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function parseLanguages(entries: readonly string[]) {
  const languages = new Map<string, string>();
  let hasDuplicates = false;
  for (const entry of entries) {
    const name = normalizeLanguage(entry);
    if (!name) continue;
    const key = name.toLowerCase();
    if (languages.has(key)) hasDuplicates = true;
    else languages.set(key, name);
  }
  return { languages: [...languages.values()], hasDuplicates };
}

export function evaluateAptitudeBudget(
  scores: AptitudeScores,
  skillPurchases: readonly SkillPointPurchase[] = [],
  { egoFlex = coreCustomizationRules.startingEgoFlex, languages = [], reputation, specializations = [], traits, psi, psiSleightPurchases }:
    Pick<Ego, 'egoFlex' | 'languages' | 'reputation' | 'specializations'> & StartingPsiChoices = {},
) {
  const entered = aptitudes.flatMap(({ id, label }) => {
    const score = scores[id];
    return score === undefined ? [] : [{ id, label, score }];
  });
  const total = entered.reduce((sum, { score }) => sum + score, 0);
  const aptitudeCp = Math.max(0, total - coreAptitudeRules.basePoints);
  const purchasedSkillPoints = skillPurchases.reduce((sum, { points }) => (
    Number.isSafeInteger(points) && points > 0 ? sum + points : sum
  ), 0);
  const skillCp = Math.ceil(purchasedSkillPoints / coreCustomizationRules.skillsPerCp);
  const flexCp = (egoFlex - coreCustomizationRules.startingEgoFlex) * coreCustomizationRules.cpPerExtraFlex;
  const languageAptitudes = scores.cog === undefined || scores.int === undefined ? undefined : scores.cog + scores.int;
  const freeLanguages = coreCustomizationRules.startingLanguages + (languageAptitudes === undefined ? 0
    : coreCustomizationRules.bonusLanguageThresholds.filter((threshold) => languageAptitudes >= threshold).length);
  const languageCp = Math.max(0, languages.length - freeLanguages) * coreCustomizationRules.cpPerExtraLanguage;
  const reputationBudget = evaluateReputation(reputation);
  const specializationCp = specializations.length * coreCustomizationRules.cpPerSpecialization;
  const { purchaseCp: sleightCp } = traceStartingPsi({ traits, psi, psiSleightPurchases });
  const traitBudget = evaluateEgoTraitBudget(traits);
  const traitBonus = Math.min(traitBudget.bonus, coreAptitudeRules.maximumTraitBonus);
  const availableCp = coreAptitudeRules.startingCp + traitBonus;
  const totalCp = aptitudeCp + skillCp + flexCp + languageCp + reputationBudget.cp + specializationCp + traitBudget.cost + sleightCp;

  return {
    entered: entered.length,
    total,
    templatePointsLeft: Math.max(0, coreAptitudeRules.basePoints - total),
    aptitudeCp,
    skillCp,
    flexCp,
    freeLanguages,
    languageAptitudes,
    languageCp,
    reputationBudget,
    specializationCp,
    sleightCp,
    traitBudget,
    availableCp,
    cpLeft: availableCp - totalCp,
    totalCp,
    purchasedSkillPoints,
    unspentPurchasedSkillPoints: skillCp * coreCustomizationRules.skillsPerCp - purchasedSkillPoints,
    baseCpLeft: coreAptitudeRules.startingCp - totalCp,
    exceedsMaximumCp: totalCp > coreAptitudeRules.startingCp + coreAptitudeRules.maximumTraitBonus,
    outOfRange: entered.filter(({ score }) => score < coreAptitudeRules.minimum || score > coreAptitudeRules.maximum),
  };
}
