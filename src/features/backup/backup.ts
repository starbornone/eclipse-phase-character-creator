import { normalizeDraft } from '../sleeve/history.ts';
import { findCreationPackage } from '../../rules/datasets/creation-packages.ts';
import { coreCustomizationRules } from '../../rules/datasets/customization.ts';
import { normalizeLanguage } from '../../rules/calculations/aptitude-budget.ts';
import { isStartingReputationScore } from '../../rules/calculations/reputation.ts';
import { evaluateEgoTraitBudget } from '../../rules/calculations/ego-traits.ts';
import { isSpecializationSkillId, normalizeSpecializationName, specializationKey } from '../../rules/calculations/skill-specializations.ts';
import { reputationNetworks, startingReputationRules } from '../../rules/datasets/reputation.ts';
import { findEgoTrait } from '../../rules/datasets/ego-traits.ts';
import { coreAptitudeRules } from '../../rules/datasets/aptitude-templates.ts';
import { knowFieldKey } from '../../rules/calculations/starting-skills.ts';
import { aptitudes, creationPackageKinds } from '../../types/character.ts';
import type { AptitudeScores, CharacterDraft, CreationPackages, Ego, ReputationScores, ResleevingEvent, Sleeve } from '../../types/character.ts';

const format = 'eclipse-phase-character-backup';
const backupVersion = 1;

export interface BackupPreview {
  drafts: CharacterDraft[];
  migratedCount: number;
}

function badField(path: string, expected: string): never {
  throw new Error(`${path} must be ${expected}.`);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    badField(path, 'an object');
  }
  return value as Record<string, unknown>;
}

function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) badField(path, 'an array');
  return value;
}

function string(value: unknown, path: string, required = false): string {
  if (typeof value !== 'string' || (required && !value.trim())) {
    badField(path, required ? 'a non-empty string' : 'a string');
  }
  return value;
}

function timestamp(value: unknown, path: string): string {
  const text = string(value, path, true);
  const date = new Date(text);
  if (!Number.isFinite(date.valueOf()) || date.toISOString() !== text) {
    badField(path, 'a UTC timestamp in the format used by the app');
  }
  return text;
}

function ensureUnique(ids: string[], path: string) {
  if (new Set(ids).size !== ids.length) badField(path, 'unique');
}

function readCreationPackages(value: unknown, path: string): CreationPackages {
  const choices = object(value, path);
  const validated: CreationPackages = {};
  for (const kind of creationPackageKinds) {
    if (!Object.hasOwn(choices, kind)) continue;
    const selectionPath = `${path}.${kind}`;
    const selection = object(choices[kind], selectionPath);
    const id = string(selection.id, `${selectionPath}.id`, true);
    const option = findCreationPackage(kind, id);
    if (!option) badField(`${selectionPath}.id`, 'a supported choice for this category');
    const fields = selection.fields === undefined
      ? undefined
      : Object.fromEntries(Object.entries(object(selection.fields, `${selectionPath}.fields`)).map(([slot, field]) => {
        if (!option.grants.some((grant) => grant.slot === slot)) {
          badField(`${selectionPath}.fields`, 'limited to slots in the selected package');
        }
        return [slot, string(field, `${selectionPath}.fields.${slot}`)];
      }));
    if (selection.motivation !== undefined && kind !== 'faction') {
      badField(`${selectionPath}.motivation`, 'absent outside the faction choice');
    }
    validated[kind] = {
      id,
      ...(fields === undefined ? {} : { fields }),
      ...(selection.motivation === undefined ? {} : { motivation: string(selection.motivation, `${selectionPath}.motivation`) }),
    };
  }
  if (Object.keys(choices).length !== Object.keys(validated).length) {
    badField(path, 'limited to supported package categories');
  }
  return validated;
}

function readSkillAllocation(entry: Record<string, unknown>, field: string) {
  const { points } = entry;
  if (typeof points !== 'number' || !Number.isSafeInteger(points) || points < 1) {
    badField(`${field}.points`, 'a positive whole number');
  }
  const to = string(entry.to, `${field}.to`, true);
  const newKnowField = entry.newKnowField === undefined ? undefined : string(entry.newKnowField, `${field}.newKnowField`, true);
  if (newKnowField !== undefined && to !== `know:${knowFieldKey(newKnowField)}`) {
    badField(`${field}.to`, 'the key matching the new Know field');
  }
  return { to, points, ...(newKnowField === undefined ? {} : { newKnowField }) };
}

function readReputation(value: unknown, path: string) {
  const entries = object(value, path);
  const scores: ReputationScores = {};
  for (const { id } of reputationNetworks) {
    if (!Object.hasOwn(entries, id)) continue;
    const score = entries[id];
    if (!isStartingReputationScore(score)) {
      badField(`${path}.${id}`, `a whole number from 0 to ${startingReputationRules.networkCap}`);
    }
    scores[id] = score;
  }
  if (Object.keys(entries).length !== Object.keys(scores).length) {
    badField(path, 'limited to supported reputation networks');
  }
  return scores;
}

function readEgoTraits(value: unknown, path: string) {
  const traits = list(value, path).map((entry, index) => {
    const field = `${path}[${index}]`;
    const choice = object(entry, field);
    const id = string(choice.id, `${field}.id`, true);
    const definition = findEgoTrait(id);
    if (!definition) badField(`${field}.id`, 'a supported ego trait');
    const { level } = choice;
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > definition.cpByLevel.length) {
      badField(`${field}.level`, 'a supported level for this trait');
    }
    return { id, level };
  });
  ensureUnique(traits.map(({ id }) => id), path);
  if (evaluateEgoTraitBudget(traits).bonus > coreAptitudeRules.maximumTraitBonus) {
    badField(path, `within the ${coreAptitudeRules.maximumTraitBonus} CP limit for negative traits`);
  }
  return traits;
}

function readEgo(value: unknown, path: string): Ego {
  const ego = object(value, path);
  const fields = object(ego.aptitudes, `${path}.aptitudes`);
  const scores: AptitudeScores = {};
  for (const { id } of aptitudes) {
    if (!Object.hasOwn(fields, id)) continue;
    const value = fields[id];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 99) {
      badField(`${path}.aptitudes.${id}`, 'a whole number from 0 to 99');
    }
    scores[id] = value;
  }
  if (Object.keys(fields).length !== Object.keys(scores).length) {
    badField(`${path}.aptitudes`, 'limited to supported aptitude keys');
  }
  const { egoFlex } = ego;
  const { startingEgoFlex, maximumEgoFlex } = coreCustomizationRules;
  if (egoFlex !== undefined && (typeof egoFlex !== 'number' || !Number.isInteger(egoFlex)
    || egoFlex < startingEgoFlex || egoFlex > maximumEgoFlex)) {
    badField(`${path}.egoFlex`, `a whole number from ${startingEgoFlex} to ${maximumEgoFlex}`);
  }
  const languages = ego.languages === undefined ? undefined
    : list(ego.languages, `${path}.languages`).map((language, index) =>
      normalizeLanguage(string(language, `${path}.languages[${index}]`, true)));
  if (languages) ensureUnique(languages.map((language) => language.toLowerCase()), `${path}.languages`);
  const artisticKnowFields = ego.artisticKnowFields === undefined ? undefined
    : list(ego.artisticKnowFields, `${path}.artisticKnowFields`).map((field) => knowFieldKey(string(field, `${path}.artisticKnowFields`, true)));
  if (artisticKnowFields) ensureUnique(artisticKnowFields, `${path}.artisticKnowFields`);
  const skillTransfers = ego.skillTransfers === undefined ? undefined
    : list(ego.skillTransfers, `${path}.skillTransfers`).map((entry, index) => {
      const field = `${path}.skillTransfers[${index}]`;
      const transfer = object(entry, field);
      return { from: string(transfer.from, `${field}.from`, true), ...readSkillAllocation(transfer, field) };
    });
  const skillPurchases = ego.skillPurchases === undefined ? undefined
    : list(ego.skillPurchases, `${path}.skillPurchases`).map((entry, index) => {
      const field = `${path}.skillPurchases[${index}]`;
      return readSkillAllocation(object(entry, field), field);
    });
  const specializations = ego.specializations === undefined ? undefined
    : list(ego.specializations, `${path}.specializations`).map((entry, index) => {
      const field = `${path}.specializations[${index}]`;
      const specialization = object(entry, field);
      const skillId = string(specialization.skillId, `${field}.skillId`, true);
      if (!isSpecializationSkillId(skillId)) badField(`${field}.skillId`, 'a supported skill ID');
      const name = normalizeSpecializationName(string(specialization.name, `${field}.name`, true));
      return { skillId, name };
    });
  if (specializations) ensureUnique(specializations.map(specializationKey), `${path}.specializations`);
  return {
    id: string(ego.id, `${path}.id`, true),
    name: string(ego.name, `${path}.name`),
    pronouns: string(ego.pronouns, `${path}.pronouns`),
    concept: string(ego.concept, `${path}.concept`),
    aptitudes: scores,
    ...(egoFlex === undefined ? {} : { egoFlex }),
    ...(languages === undefined ? {} : { languages }),
    ...(ego.reputation === undefined ? {} : { reputation: readReputation(ego.reputation, `${path}.reputation`) }),
    ...(ego.packages === undefined ? {} : { packages: readCreationPackages(ego.packages, `${path}.packages`) }),
    ...(artisticKnowFields === undefined ? {} : { artisticKnowFields }),
    ...(skillTransfers === undefined ? {} : { skillTransfers }),
    ...(skillPurchases === undefined ? {} : { skillPurchases }),
    ...(specializations === undefined ? {} : { specializations }),
    ...(ego.traits === undefined ? {} : { traits: readEgoTraits(ego.traits, `${path}.traits`) }),
  };
}

function readEvent(value: unknown, path: string): ResleevingEvent {
  const event = object(value, path);
  const date = string(event.date, `${path}.date`);
  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (!/^\d{4,}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(year) || year < 1
      || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
      badField(`${path}.date`, 'a calendar date or an empty string');
    }
  }
  return {
    date,
    location: string(event.location, `${path}.location`),
    cause: string(event.cause, `${path}.cause`),
    notes: string(event.notes, `${path}.notes`),
  };
}

function readSleeve(value: unknown, egoId: string, path: string): Sleeve {
  const sleeve = object(value, path);
  if (sleeve.egoId !== egoId) badField(`${path}.egoId`, 'the id of its draft’s ego');
  return {
    id: string(sleeve.id, `${path}.id`, true),
    egoId,
    morphDefinitionId: string(sleeve.morphDefinitionId, `${path}.morphDefinitionId`, true),
    assignedAt: timestamp(sleeve.assignedAt, `${path}.assignedAt`),
    ...(sleeve.event === undefined ? {} : { event: readEvent(sleeve.event, `${path}.event`) }),
  };
}

function readDraft(value: unknown, index: number) {
  const path = `Draft ${index + 1}`;
  const draft = object(value, path);
  const { schemaVersion, revision, rulesVersion } = draft;
  if (schemaVersion !== 1 && schemaVersion !== 2) {
    throw new Error(`${path} uses an unsupported draft version.`);
  }
  if (rulesVersion !== 'prototype-1' && rulesVersion !== 'ep2-quick-start-2.4') {
    throw new Error(`${path} uses an unsupported rules version.`);
  }
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1) {
    badField(`${path}.revision`, 'a positive safe integer');
  }
  const ego = readEgo(draft.ego, `${path}.ego`);
  const common: Omit<CharacterDraft, 'schemaVersion' | 'sleeves'> = {
    ego, revision, rulesVersion, updatedAt: timestamp(draft.updatedAt, `${path}.updatedAt`),
  };
  if (schemaVersion === 1) {
    const sleeve = draft.sleeve === undefined ? undefined : readSleeve(draft.sleeve, ego.id, `${path}.sleeve`);
    return { draft: normalizeDraft({ ...common, schemaVersion, sleeve }), migrated: true };
  }
  const sleeves = list(draft.sleeves, `${path}.sleeves`).map((sleeve, index) => (
    readSleeve(sleeve, ego.id, `${path}.sleeves[${index}]`)
  ));
  ensureUnique(sleeves.map((sleeve) => sleeve.id), `${path} sleeve ids`);
  return { draft: normalizeDraft({ ...common, schemaVersion, sleeves }), migrated: false };
}

export function encodeBackup(drafts: CharacterDraft[]) {
  return JSON.stringify({ format, version: backupVersion, drafts }, null, 2) + '\n';
}

export function previewBackup(text: string): BackupPreview {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('The file contains invalid JSON.');
  }
  const backup = object(value, 'Backup');
  if (backup.format !== format) throw new Error('Choose an Eclipse Phase character backup.');
  if (backup.version !== backupVersion) throw new Error('This backup format version is unsupported.');
  const records = list(backup.drafts, 'Backup drafts');
  if (!records.length) throw new Error('This backup contains zero drafts.');
  const parsed = records.map(readDraft);
  const drafts = parsed.map(({ draft }) => draft);
  ensureUnique(drafts.map(({ ego }) => ego.id), 'Backup ego ids');
  return { drafts, migratedCount: parsed.filter(({ migrated }) => migrated).length };
}

export function copyBackupDrafts(drafts: CharacterDraft[], newId = () => crypto.randomUUID()) {
  return drafts.map((draft): CharacterDraft => {
    const egoId = newId();
    return {
      ...draft,
      revision: 1,
      ego: { ...draft.ego, id: egoId },
      sleeves: draft.sleeves.map((sleeve) => ({ ...sleeve, id: newId(), egoId })),
    };
  });
}

export function downloadBackup(drafts: CharacterDraft[], filename: string) {
  const file = new Blob([encodeBackup(drafts)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
