import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { evaluateStartingMorphBudget, parseStartingMorphAllowance, startingMorphBudgetForDraft } from '../rules/calculations/starting-morph-budget.ts';
import { traceStartingEquipment } from '../rules/calculations/starting-equipment.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';
import { startingEquipment } from '../rules/datasets/starting-equipment.ts';

const updatedAt = '2026-11-28T00:00:00.000Z';
const draft = {
  schemaVersion: 2, rulesVersion: 'ep2-quick-start-2.4', revision: 1, updatedAt,
  ego: { id: 'mp-test', name: 'MP test', pronouns: '', concept: '', aptitudes: {} },
  sleeves: [{ id: 'first', egoId: 'mp-test', morphDefinitionId: 'synth', assignedAt: updatedAt }],
};

test('starting MP applies the default, core morph prices, and the capped complete-pair Flex conversion', () => {
  for (const [id, cost, remaining, flex] of [
    ['bouncer', 4, 2, 1], ['case', 0, 6, 3], ['synth', 3, 3, 1],
    ['digimorph', 0, 6, 3], ['ikon', 1, 5, 2], ['agent', 2, 4, 2], ['operator', 2, 4, 2],
  ]) {
    const result = evaluateStartingMorphBudget({}, findSampleMorph(id));
    assert.deepEqual([result.allowance, result.cost, result.remaining, result.temporaryFlex], [6, cost, remaining, flex]);
    assert.ok(result.costSource.url.endsWith(`#${id}`));
  }
  const capped = evaluateStartingMorphBudget({ startingMorphPoints: 16 }, findSampleMorph('bouncer'));
  assert.deepEqual([capped.remaining, capped.temporaryFlex], [12, 3]);
  const deficit = evaluateStartingMorphBudget({ startingMorphPoints: 0 }, findSampleMorph('bouncer'));
  assert.deepEqual([deficit.available, deficit.remaining, deficit.temporaryFlex], [0, -4, 0]);
  const exact = evaluateStartingMorphBudget({ startingMorphPoints: 1 }, findSampleMorph('ikon'));
  assert.deepEqual([exact.remaining, exact.temporaryFlex], [0, 0]);
});

test('Resources spends shared CP and increases starting MP by the selected level', () => {
  for (const level of [1, 2, 3, 4]) {
    const traits = [{ id: 'resources', level }];
    const morph = findSampleMorph('bouncer');
    const { resources, available, remaining, temporaryFlex } = evaluateStartingMorphBudget({ traits }, morph);
    assert.deepEqual([resources, available, remaining, temporaryFlex], [level, 6 + level, 2 + level, Math.floor((2 + level) / 2)]);
    assert.equal(evaluateAptitudeBudget({}, [], { traits }).traitBudget.cost, 2 * level);
  }
  const invalid = evaluateStartingMorphBudget({ traits: [{ id: 'resources', level: 5 }] }, findSampleMorph('bouncer'));
  assert.deepEqual([invalid.available, invalid.resources], [6, 0]);
});

test('blank allowances use the default and missing or unpriced sleeves keep costs pending', () => {
  assert.deepEqual(parseStartingMorphAllowance(' '), { allowance: undefined });
  assert.deepEqual(parseStartingMorphAllowance(' 0 '), { allowance: 0 });
  assert.deepEqual(parseStartingMorphAllowance('12'), { allowance: 12 });
  for (const value of ['-1', '1.5', '1e2', 'abc', String(Number.MAX_SAFE_INTEGER)]) {
    assert.ok(parseStartingMorphAllowance(value).issue);
  }
  for (const morph of [undefined, findSampleMorph('survey-sleeve')]) {
    const budget = evaluateStartingMorphBudget({}, morph);
    assert.deepEqual([budget.available, budget.cost, budget.remaining, budget.temporaryFlex], [6, undefined, undefined, undefined]);
  }
});

test('backups preserve the allowance and Resources and reject malformed values', () => {
  const selected = { ...draft, ego: { ...draft.ego, startingMorphPoints: 0, traits: [{ id: 'resources', level: 2 }] } };
  assert.deepEqual(previewBackup(encodeBackup([selected])).drafts[0], selected);
  for (const value of ['7', -1, 1.5, Number.MAX_SAFE_INTEGER, null]) {
    const invalid = { ...draft, ego: { ...draft.ego, startingMorphPoints: value } };
    assert.throws(() => previewBackup(encodeBackup([invalid])), /startingMorphPoints must be/);
  }
  assert.deepEqual(previewBackup(encodeBackup([draft])).drafts[0], draft);
});

test('the dossier keeps the first sleeve cost and expires starting temporary Flex on resleeving', () => {
  assert.equal(startingMorphBudgetForDraft(draft).temporaryFlex, 1);
  const next = recordResleeving(draft, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const restored = previewBackup(encodeBackup([next])).drafts[0];
  for (const audience of ['player', 'gm']) {
    const { morph, startingMorphBudget: budget, egoFlex } = buildPrintableDossier(restored, audience, []);
    assert.equal(morph.id, 'case');
    assert.deepEqual([budget.morphName, budget.cost, budget.remaining, budget.temporaryFlex, budget.hasResleeved], ['Synth', 3, 3, 0, true]);
    assert.equal(egoFlex, 1);
  }
});

test('extra equipment counts units and charges the MP cost of each complexity tier', () => {
  const purchases = ['ecto', 'ecto', 'exploit-app', 'emergency-bubble'];
  const items = traceStartingEquipment(purchases);
  const ecto = items.find(({ id }) => id === 'ecto');
  const restricted = items.find(({ id }) => id === 'exploit-app');
  const bubble = items.find(({ id }) => id === 'emergency-bubble');
  assert.deepEqual([ecto.quantity, ecto.mpPerItem, ecto.totalMp], [2, 1, 2]);
  assert.deepEqual([restricted.complexity, restricted.mpPerItem, restricted.restricted], ['Moderate', 2, true]);
  assert.deepEqual([bubble.complexity, bubble.mpPerItem, bubble.totalMp], ['Major', 3, 3]);
  const ego = { startingMorphPoints: 10, startingEquipment: purchases };
  const budget = evaluateStartingMorphBudget(ego, findSampleMorph('digimorph'));
  assert.deepEqual([budget.equipmentCost, budget.remaining, budget.temporaryFlex], [7, 3, 1]);
  const removed = evaluateStartingMorphBudget({ ...ego, startingEquipment: purchases.slice(1) }, findSampleMorph('digimorph'));
  assert.deepEqual([removed.equipmentCost, removed.remaining, removed.temporaryFlex], [6, 4, 2]);
  const pending = evaluateStartingMorphBudget(ego);
  assert.deepEqual([pending.equipmentCost, pending.remaining, pending.temporaryFlex], [7, undefined, undefined]);
});

test('extra equipment survives backup and resleeving and rejects unsupported IDs', () => {
  const character = { ...draft, ego: { ...draft.ego, startingEquipment: ['ecto', 'ecto', 'emergency-bubble'] } };
  assert.equal(startingMorphBudgetForDraft(character).remaining, -2);
  const resleeved = recordResleeving(character, 'second', 'bouncer', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const restored = previewBackup(encodeBackup([resleeved])).drafts[0];
  assert.deepEqual(restored, resleeved);
  const print = buildPrintableDossier(restored, 'player', []);
  assert.deepEqual(print.startingEquipment, traceStartingEquipment(character.ego.startingEquipment));
  assert.deepEqual([print.startingMorphBudget.cost, print.startingMorphBudget.equipmentCost, print.startingMorphBudget.remaining], [3, 5, -2]);
  for (const invalid of ['invented-item', 2, '']) {
    const broken = { ...draft, ego: { ...draft.ego, startingEquipment: ['ecto', invalid] } };
    assert.throws(() => previewBackup(encodeBackup([broken])), /startingEquipment\[1\] must be/);
  }
});

test('the expanded equipment catalogue uses the listed section, complexity, and GP for each item', () => {
  assert.equal(new Set(startingEquipment.map(({ id }) => id)).size, startingEquipment.length);
  for (const [category, anchor, entries] of [
    ['Communications', 'communications', [
      ['breadcrumb-system', 'Minor', 1], ['laser-microwave-link-micro', 'Minor', 1], ['laser-microwave-link-small', 'Moderate', 2],
      ['radio-booster', 'Minor', 1], ['satnet-in-a-can', 'Major', 3],
    ]],
    ['Everyday technology', 'everyday-technology', [
      ['breather', 'Minor', 1], ['cold-suit', 'Minor', 1], ['ecto', 'Minor', 1], ['grip-tape', 'Minor', 1],
      ['holographic-projector', 'Minor', 1], ['micrograv-shoes', 'Minor', 1], ['nuclear-battery', 'Minor', 1],
      ['portable-sensor', 'Moderate', 2], ['smart-clothing', 'Minor', 1], ['solar-charger', 'Minor', 1],
      ['specs', 'Moderate', 2], ['standard-battery', 'Minor', 1], ['tools-kit', 'Minor', 1],
      ['tools-shop', 'Moderate', 2], ['tools-facility', 'Major', 3], ['utilitool', 'Minor', 1],
      ['viewers', 'Moderate', 2], ['wireless-energy-transmitter', 'Minor', 1],
    ]],
    ['Exploration tools', 'exploration-tools', [['mapping-missile', 'Moderate', 2], ['scout-missile', 'Moderate', 2]]],
    ['Robots', 'medical-bots', [['docbot', 'Major', 3], ['retriever', 'Major', 3]]],
    ['Robots', 'personal-bots', [
      ['creepy-bot', 'Minor', 1], ['manipulator', 'Major', 3], ['servitor-bot', 'Minor', 1], ['spider-hand', 'Minor', 1],
    ]],
    ['Salvage tools', 'salvage-tools', [['disassembly-tools', 'Moderate', 2]]],
    ['Science tools', 'science-tools', [
      ['adaptive-interface', 'Major', 3], ['fractal-gloves', 'Moderate', 2], ['pocket-lab', 'Moderate', 2],
      ['portable-solarchive', 'Minor', 1], ['specimen-container', 'Minor', 1],
    ]],
    ['Survival tools', 'survival-tools', [
      ['electrogravitics-net', 'Minor', 1], ['electronic-rope', 'Minor', 1], ['smart-anchors', 'Minor', 1],
      ['spindle', 'Moderate', 2], ['spindle-climber', 'Minor', 1],
    ]],
  ]) {
    for (const [id, complexity, gp] of entries) {
      const [item] = traceStartingEquipment([id]);
      assert.deepEqual([item.category, item.complexity, item.gp, item.restricted], [category, complexity, gp, undefined]);
      assert.ok(item.source.endsWith(`#${anchor}`));
    }
  }
});

test('field gear sizes and quantities keep their prices across backup, resleeving, and print', () => {
  const purchases = ['laser-microwave-link-micro', 'laser-microwave-link-small', 'spindle-climber', 'spindle-climber', 'adaptive-interface'];
  const character = { ...draft, ego: { ...draft.ego, startingMorphPoints: 15, startingEquipment: purchases } };
  const budget = startingMorphBudgetForDraft(character);
  assert.deepEqual([budget.equipmentCost, budget.remaining, budget.temporaryFlex], [8, 4, 2]);
  const next = recordResleeving(character, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const restored = previewBackup(encodeBackup([next])).drafts[0];
  assert.deepEqual(restored, next);
  const player = buildPrintableDossier(restored, 'player', []);
  const gm = buildPrintableDossier(restored, 'gm', []);
  assert.deepEqual(player.startingEquipment.map(({ name, quantity, totalMp }) => [name, quantity, totalMp]), [
    ['Adaptive Interface', 1, 3], ['Laser/Microwave Link (Micro)', 1, 1],
    ['Laser/Microwave Link (Small)', 1, 2], ['Spindle Climber', 2, 2],
  ]);
  assert.deepEqual([gm.startingMorphBudget.equipmentCost, gm.startingMorphBudget.remaining, gm.startingMorphBudget.temporaryFlex], [8, 4, 0]);
});

test('tool sizes are distinct purchases and preserve their pricing across backup, resleeving, and print', () => {
  const purchases = ['tools-kit', 'tools-kit', 'tools-shop', 'tools-facility', 'portable-sensor'];
  const character = { ...draft, ego: { ...draft.ego, startingMorphPoints: 15, startingEquipment: purchases } };
  const budget = startingMorphBudgetForDraft(character);
  assert.deepEqual([budget.equipmentCost, budget.remaining, budget.temporaryFlex], [9, 3, 1]);
  const next = recordResleeving(character, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const restored = previewBackup(encodeBackup([next])).drafts[0];
  assert.deepEqual(restored, next);
  const player = buildPrintableDossier(restored, 'player', []);
  const gm = buildPrintableDossier(restored, 'gm', []);
  assert.deepEqual(player.startingEquipment.map(({ name, quantity, mpPerItem }) => [name, quantity, mpPerItem]), [
    ['Portable Sensor', 1, 2], ['Tools (Facility)', 1, 3], ['Tools (Kit)', 2, 1], ['Tools (Shop)', 1, 2],
  ]);
  assert.deepEqual([gm.startingMorphBudget.equipmentCost, gm.startingMorphBudget.remaining, gm.startingMorphBudget.temporaryFlex], [9, 3, 0]);
});
