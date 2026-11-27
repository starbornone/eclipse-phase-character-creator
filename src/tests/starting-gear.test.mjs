import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveStartingGear, startingGearForDraft } from '../rules/calculations/starting-gear.ts';
import { coreCreationPackages } from '../rules/datasets/creation-packages.ts';
import { careerGearPacks } from '../rules/datasets/starting-gear.ts';

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
