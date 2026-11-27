import type { Ego, EgoTraitChoice, PsiConfiguration } from '../../types/character.ts';
import { findCreationPackage } from '../datasets/creation-packages.ts';
import { coreCustomizationRules } from '../datasets/customization.ts';
import { psiSleights, psiSubStrains, psiTrait } from '../datasets/psi.ts';

export type StartingPsiChoices = Pick<Ego, 'traits' | 'psi' | 'psiSleightPurchases'>;

export function startingPsiLevel(choices?: readonly EgoTraitChoice[]) {
  const level = choices?.find(({ id }) => id === psiTrait.id)?.level;
  return level === 1 || level === 2 ? level : 0;
}

export function traceStartingPsi({ traits, packages, psi, psiSleightPurchases = [] }: StartingPsiChoices & Pick<Ego, 'packages'>) {
  const level = startingPsiLevel(traits);
  const requiredBy = [findCreationPackage('background', packages?.background?.id), findCreationPackage('interest', packages?.interest?.id)]
    .flatMap((choice) => choice?.requiresPsi ? [choice.name] : []);
  const subStrain = level ? psiSubStrains.find(({ id }) => id === psi?.subStrain) : undefined;
  const sleights = subStrain?.sleights.filter(({ minimumLevel }) => minimumLevel <= level) ?? [];
  const drawback = subStrain?.drawbacks.find((name) => name === psi?.drawback);
  const freeSleight = sleights.find(({ name }) => name === psi?.freeSleight);
  const selection: PsiConfiguration | undefined = subStrain ? {
    subStrain: subStrain.id,
    ...(drawback ? { drawback } : {}),
    ...(freeSleight ? { freeSleight: freeSleight.name } : {}),
  } : undefined;
  const eligiblePurchases = psiSleights.filter(({ name, minimumLevel }) => minimumLevel <= level && name !== freeSleight?.name);
  const purchased = [...new Set(psiSleightPurchases)].flatMap((name) => eligiblePurchases.find((entry) => entry.name === name) ?? [])
    .slice(0, coreCustomizationRules.maximumPurchasedSleights);
  const purchasedNames = purchased.map(({ name }) => name);
  const purchaseOptions = eligiblePurchases.filter(({ name }) => !purchasedNames.includes(name));
  const purchaseCp = purchased.length * coreCustomizationRules.cpPerSleight;
  return {
    level, requiredBy, subStrain, drawback, freeSleight, sleights, selection,
    purchased, purchasedNames, purchaseOptions, purchaseCp,
    discardedPurchases: psiSleightPurchases.length - purchased.length,
  };
}
