import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveStartingGear, startingGearForDraft } from '../rules/calculations/starting-gear.ts';

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
