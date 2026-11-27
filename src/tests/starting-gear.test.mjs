import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveStartingGear, startingGearForDraft, startingGearReplacements } from '../rules/calculations/starting-gear.ts';
import { coreCreationPackages } from '../rules/datasets/creation-packages.ts';
import { careerGearPacks } from '../rules/datasets/starting-gear.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { recordResleeving } from '../features/sleeve/history.ts';

test('combat gear packs retain item costs, restrictions, and corrected dose quantities', () => {
  for (const [career, items] of [
    ['enforcer', [
      ['Aggro (5 doses)', 1], ['Claws', 1], ['Flex Cutter', 1], ['Grin (5 doses)', 1],
      ['Muscle Augmentation', 3], ['Shock Glove', 1], ['Shredder', 2],
    ]],
    ['soldier', [
      ['Assault Rifle Railgun', 2], ['Enhanced Vision', 2], ['Grin (5 doses)', 1], ['Meds (5 doses)', 2], ['Neurachem', 3],
    ]],
  ]) {
    const [pack] = deriveStartingGear(undefined, career, 'Biomorph').packs;
    assert.equal(pack.gp, 10);
    assert.equal(pack.usesSynthAlternatives, false);
    assert.deepEqual(pack.items.map(({ name, gp }) => [name, gp]), items);
    assert.deepEqual(pack.items.filter(({ restricted }) => restricted).map(({ name }) => name), [career === 'enforcer' ? 'Shredder' : 'Assault Rifle Railgun']);
    assert.ok(pack.source.endsWith(`#${career}`));
  }
});

test('Soldier synth alternative replaces Meds and preserves starting gear through resleeving', () => {
  const ego = { id: 'ego', startingCampaign: 'firewall', packages: { career: { id: 'soldier' } } };
  const sleeve = (morphDefinitionId) => ({ morphDefinitionId });
  const biologicalFirst = startingGearForDraft({ ego, sleeves: [sleeve('bouncer'), sleeve('synth')] });
  const syntheticFirst = startingGearForDraft({ ego, sleeves: [sleeve('synth'), sleeve('bouncer')] });
  const [bioCampaign, bioCareer] = biologicalFirst.packs;
  const [synthCampaign, synthCareer] = syntheticFirst.packs;
  assert.equal(bioCareer.usesSynthAlternatives, false);
  assert.ok(bioCareer.items.some(({ name }) => name === 'Meds (5 doses)'));
  assert.equal(synthCareer.usesSynthAlternatives, true);
  assert.ok(synthCareer.items.some(({ name, gp }) => name === 'Fixer Swarm' && gp === 2));
  assert.ok(!synthCareer.items.some(({ name }) => name.startsWith('Meds')));
  assert.deepEqual([bioCampaign.gp, bioCareer.gp, synthCampaign.gp, synthCareer.gp], [10, 10, 10, 10]);
  const pendingMorph = startingGearForDraft({ ego, sleeves: [] }).packs[1];
  assert.equal(pendingMorph.usesSynthAlternatives, false);
  assert.ok(pendingMorph.items.some(({ name }) => name === 'Meds (5 doses)'));
  const enforcer = deriveStartingGear(undefined, 'enforcer', 'Synthmorph').packs[0];
  assert.equal(enforcer.usesSynthAlternatives, false);
});

test('technical career gear retains sourced items, GP totals, and Hacker restrictions', () => {
  for (const [career, expected] of [
    ['hacker', [['Exploit App', 2], ['Gray Box', 1], ['Radio Booster', 1], ['Sniffer App', 2], ['Spoofer App', 2], ['Tracker App', 2]]],
    ['scavenger', [['Breadcrumb System', 1], ['Diamond Axe', 1], ['Disassembly Tools', 2], ['Guardian Swarm', 2], ['Nanodetector', 1], ['Orbital Hash (5 doses)', 1], ['Robomule', 2]]],
    ['scientist', [['Enhanced Vision', 2], ['Mind Amp', 3], ['Mission Recorder', 1], ['Pocket Lab', 2], ['Servitor', 1], ['Specimen Container', 1]]],
    ['techie', [['Automech', 2], ['Electrical Sense', 1], ['Fixer Swarm', 2], ['Fokus (5 doses)', 1], ['Medium Fabber', 2], ['Tools (Kit)', 1], ['Utilitool', 1]]],
  ]) {
    for (const category of [undefined, 'Biomorph', 'Synthmorph']) {
      const [pack] = deriveStartingGear(undefined, career, category).packs;
      assert.equal(pack.gp, 10);
      assert.equal(pack.usesSynthAlternatives, false);
      assert.deepEqual(pack.items.map(({ name, gp }) => [name, gp]), expected);
      assert.deepEqual(pack.items.filter(({ restricted }) => restricted).map(({ name }) => name), career === 'hacker' ? ['Exploit App', 'Spoofer App'] : []);
      assert.ok(pack.source.endsWith(`#${career}`));
    }
  }
});

test('every core career has a gear pack and the remaining packs preserve source costs and errata', () => {
  assert.deepEqual([...careerGearPacks.keys()], coreCreationPackages.career.map(({ id }) => id));
  for (const [career, expected, restricted] of [
    ['covert-operative', [['Chameleon Cloak', 2], ['Cleaner Swarm', 1], ['Covert Operations Tool', 3], ['Microbug', 1], ['Skinflex', 2], ['Spy Nanoswarm', 1]], ['Covert Operations Tool']],
    ['genehacker', [['Archive', 1], ['Dino Pet', 1], ['Fokus (5 doses)', 1], ['Medichines', 3], ['Pusher Swarm', 1], ['Specimen Container', 1], ['Tools (Kit)', 1], ['Twitch (5 doses)', 1]], ['Pusher Swarm', 'Twitch (5 doses)']],
    ['investigator', [['Biometric Matcher App', 1], ['Brainprint Scanner', 1], ['Cuffband', 1], ['Klar (5 doses)', 1], ['Microbug', 1], ['Oracles', 2], ['Scout Nanoswarm', 1], ['Speck', 1], ['Spy Nanoswarm', 1]], []],
    ['medic', [['Docbot', 3], ['Healing Spray', 1], ['Healing Vat', 3], ['Med Scanner', 1], ['Meds (5 doses)', 2]], []],
    ['mindhacker', [['Comfurt (5 doses)', 1], ['Eelware', 1], ['Ego Bridge', 2], ['Multi-Tasking', 2], ['Private Server', 2], ['Psychosurgery App', 2]], []],
  ]) {
    const [pack] = deriveStartingGear(undefined, career, 'Biomorph').packs;
    assert.equal(pack.gp, 10);
    assert.deepEqual(pack.items.map(({ name, gp }) => [name, gp]), expected);
    assert.deepEqual(pack.items.filter(({ restricted }) => restricted).map(({ name }) => name), restricted);
    assert.ok(pack.source.endsWith(`#${career}`));
  }
});

test('Covert Operative uses Synthetic Mask for a synthetic first sleeve and retains it after resleeving', () => {
  const ego = { packages: { career: { id: 'covert-operative' } } };
  const synthetic = startingGearForDraft({ ego, sleeves: [{ morphDefinitionId: 'synth' }, { morphDefinitionId: 'bouncer' }] }).packs[0];
  assert.equal(synthetic.gp, 10);
  assert.equal(synthetic.usesSynthAlternatives, true);
  assert.ok(synthetic.items.some(({ name, gp }) => name === 'Synthetic Mask' && gp === 2));
  assert.ok(!synthetic.items.some(({ name }) => name === 'Skinflex'));
  const biological = startingGearForDraft({ ego, sleeves: [{ morphDefinitionId: 'bouncer' }, { morphDefinitionId: 'synth' }] }).packs[0];
  assert.equal(biological.usesSynthAlternatives, false);
  assert.ok(biological.items.some(({ name }) => name === 'Skinflex'));
});

test('Genehacker lists payload cost separately without inventing a GP value', () => {
  const [pack] = deriveStartingGear(undefined, 'genehacker').packs;
  assert.equal(pack.gp, 10);
  assert.equal(pack.hasAdditionalGpCosts, true);
  const payloadItems = pack.items.filter(({ additionalGpCost }) => additionalGpCost);
  assert.deepEqual(payloadItems.map(({ name, gp, additionalGpCost }) => [name, gp, additionalGpCost]), [['Pusher Swarm', 1, 'drug/toxin']]);
  assert.equal(deriveStartingGear(undefined, 'mindhacker').packs[0].hasAdditionalGpCosts, false);
});

const swapTacNet = { packId: 'firewall-agentcriminal', item: 'TacNet App', replacement: 'Exploit App' };
const swapMeds = { packId: 'soldier', item: 'Meds (5 doses)', replacement: 'Ego Bridge' };

test('field gear replacements match the selected size and GP and deduplicate pack entries', () => {
  const small = { ...swapTacNet, replacement: 'Laser/Microwave Link (Small)' };
  const micro = { ...swapTacNet, replacement: 'Laser/Microwave Link (Micro)' };
  const valid = deriveStartingGear('firewall', undefined, 'Synthmorph', [small]);
  assert.deepEqual(valid.appliedSwaps, [small]);
  assert.equal(valid.packs[0].gp, 10);
  const replacement = valid.packs[0].items.find(({ originalName }) => originalName === 'TacNet App');
  assert.equal(replacement.name, small.replacement);
  assert.ok(replacement.replacementSource.endsWith('#communications'));
  assert.deepEqual(deriveStartingGear('firewall', undefined, 'Synthmorph', [micro]).appliedSwaps, []);
  const radioBoosters = startingGearReplacements('Synthmorph').filter(({ name, gp }) => name === 'Radio Booster' && gp === 1);
  assert.equal(radioBoosters.length, 1);
});

test('equal-GP replacements retain their own source and restrictions and preserve pack totals', () => {
  const { packs, appliedSwaps } = deriveStartingGear('firewall', 'soldier', 'Biomorph', [swapTacNet, swapMeds]);
  assert.deepEqual(appliedSwaps, [swapTacNet, swapMeds]);
  assert.deepEqual(packs.map(({ gp }) => gp), [10, 10]);
  const app = packs[0].items.find(({ originalName }) => originalName === 'TacNet App');
  assert.equal(app.name, 'Exploit App');
  assert.equal(app.restricted, true);
  assert.ok(app.replacementSource.endsWith('#hacker'));
  assert.equal(packs[1].items.find(({ originalName }) => originalName === 'Meds (5 doses)').name, 'Ego Bridge');
  assert.deepEqual(deriveStartingGear('criminal', 'soldier', 'Biomorph', [swapTacNet]).appliedSwaps, [swapTacNet]);
  assert.deepEqual(deriveStartingGear('firewall', 'soldier', 'Synthmorph', [swapTacNet, swapMeds]).appliedSwaps, [swapTacNet]);
});

test('inactive slots, self-swaps, unequal costs, and conditional payload costs cannot change gear', () => {
  const swaps = [
    { ...swapTacNet, packId: 'gatecrashing' },
    { ...swapTacNet, replacement: 'TacNet App' },
    { ...swapTacNet, replacement: 'Anonymizer' },
    { ...swapTacNet, replacement: 'Unknown Requisition' },
    { ...swapTacNet, item: 'Anonymizer', replacement: 'Pusher Swarm' },
    { packId: 'genehacker', item: 'Pusher Swarm', replacement: 'Anonymizer' },
  ];
  const baseline = deriveStartingGear('firewall', 'genehacker', 'Biomorph');
  for (const swap of swaps) {
    assert.deepEqual(deriveStartingGear('firewall', 'genehacker', 'Biomorph', [swap]), baseline);
  }
});

test('backups and player print retain swaps tied to the first sleeve and reject stale or duplicate choices', () => {
  const updatedAt = '2026-11-28T00:00:00.000Z';
  const draft = {
    schemaVersion: 2, rulesVersion: 'ep2-quick-start-2.4', revision: 1, updatedAt,
    ego: { id: 'gear-test', name: 'Gear test', pronouns: '', concept: '', aptitudes: {}, startingCampaign: 'firewall',
      packages: { career: { id: 'soldier' } }, startingGearSwaps: [swapTacNet, swapMeds] },
    sleeves: [{ id: 'first', egoId: 'gear-test', morphDefinitionId: 'bouncer', assignedAt: updatedAt }],
  };
  const next = recordResleeving(draft, 'second', 'synth', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  assert.deepEqual(previewBackup(encodeBackup([next])).drafts[0], next);
  assert.deepEqual(buildPrintableDossier(next, 'player', []).startingGear, startingGearForDraft(draft));
  const incomplete = { ...draft, sleeves: [] };
  assert.deepEqual(previewBackup(encodeBackup([incomplete])).drafts[0], incomplete);
  assert.throws(() => previewBackup(encodeBackup([{ ...next, sleeves: [...next.sleeves].reverse() }])), /equal-GP replacements/);
  const duplicate = { ...draft, ego: { ...draft.ego, startingGearSwaps: [swapTacNet, { ...swapTacNet, replacement: 'Tracker App' }] } };
  assert.throws(() => previewBackup(encodeBackup([duplicate])), /unique equal-GP replacements/);
});

test('the optional Infomorph pack replaces only the campaign pack and keeps its sourced gear', () => {
  const defaults = deriveStartingGear('firewall', 'academic', 'Infomorph');
  const { packs, usesInfomorphPack } = deriveStartingGear('firewall', 'academic', 'Infomorph', [], true);
  assert.equal(usesInfomorphPack, true);
  assert.equal(packs.length, 2);
  assert.equal(packs[0].gp, 10);
  assert.equal(packs[0].usesSynthAlternatives, false);
  assert.ok(packs[0].source.endsWith('#optional-pack-infomorph'));
  assert.deepEqual(packs[0].items.map(({ name, gp }) => [name, gp]), [
    ['Drone Rig', 2], ['Enhanced Security', 2], ['Exploit App', 2], ['Gnat', 1], ['Guardian Angel', 2], ['Private Server', 1],
  ]);
  assert.deepEqual(packs[0].items.filter(({ restricted }) => restricted).map(({ name }) => name), ['Exploit App']);
  assert.equal(defaults.packs[0].name, 'Firewall Agent / Criminal');
  assert.deepEqual(packs[1], defaults.packs[1]);
  for (const category of ['Biomorph', 'Synthmorph', undefined]) {
    assert.deepEqual(deriveStartingGear('firewall', 'academic', category, [], true), deriveStartingGear('firewall', 'academic', category));
    assert.ok(!startingGearReplacements(category).some(({ name }) => name === 'Drone Rig'));
  }
  const swap = { packId: 'optional-pack-infomorph', item: 'Drone Rig', replacement: 'TacNet App' };
  const swapped = deriveStartingGear('firewall', 'academic', 'Infomorph', [swap], true);
  assert.deepEqual(swapped.appliedSwaps, [swap]);
  assert.equal(swapped.packs[0].gp, 10);
  assert.deepEqual(deriveStartingGear('firewall', 'academic', 'Infomorph', [swap]).appliedSwaps, []);
  const regularPackSwap = { packId: 'firewall-agentcriminal', item: 'TacNet App', replacement: 'Drone Rig' };
  assert.deepEqual(deriveStartingGear('firewall', 'academic', 'Infomorph', [regularPackSwap]).appliedSwaps, [regularPackSwap]);
});

test('save-oriented models preserve the optional pack across resleeving and back up only eligible selections', () => {
  const updatedAt = '2026-11-28T00:00:00.000Z';
  const draft = {
    schemaVersion: 2, rulesVersion: 'ep2-quick-start-2.4', revision: 1, updatedAt,
    ego: { id: 'info-test', name: 'Infomorph test', pronouns: '', concept: '', aptitudes: {},
      startingCampaign: 'firewall', startingInfomorphPack: true },
    sleeves: [{ id: 'first', egoId: 'info-test', morphDefinitionId: 'operator', assignedAt: updatedAt }],
  };
  for (const audience of ['player', 'gm']) {
    assert.equal(buildPrintableDossier(draft, audience, []).morph.id, 'operator');
  }
  const next = recordResleeving(draft, 'second', 'synth', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const restored = previewBackup(encodeBackup([next])).drafts[0];
  assert.deepEqual(restored, next);
  const player = buildPrintableDossier(restored, 'player', []);
  assert.equal(player.morph.id, 'synth');
  assert.equal(player.startingGear.packs[0].name, 'Infomorph');
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [] }])), /infomorph first sleeve/);
  assert.throws(() => previewBackup(encodeBackup([{ ...next, sleeves: [...next.sleeves].reverse() }])), /infomorph first sleeve/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, ego: { ...draft.ego, startingInfomorphPack: 'true' } }])), /true when/);
});

test('Gear chapter entries support equal-GP pack swaps with their own source links', () => {
  const swap = { packId: 'firewall-agentcriminal', item: 'Fake Ego ID', replacement: 'Emergency Bubble' };
  const gear = deriveStartingGear('firewall', undefined, 'Biomorph', [swap]);
  const item = gear.packs[0].items.find(({ originalName }) => originalName === swap.item);
  assert.deepEqual(gear.appliedSwaps, [swap]);
  assert.equal(gear.packs[0].gp, 10);
  assert.equal(item.gp, 3);
  assert.equal(item.restricted, undefined);
  assert.ok(item.replacementSource.endsWith('18-mission-gear.html#survival-tools'));
  const invalid = { ...swap, replacement: 'Ecto' };
  assert.deepEqual(deriveStartingGear('firewall', undefined, 'Biomorph', [invalid]).appliedSwaps, []);
});
