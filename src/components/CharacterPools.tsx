import type { tracePools } from '../rules/calculations/pools.ts';

export function CharacterPools({ pools, headingLevel = 3 }: { pools: ReturnType<typeof tracePools>; headingLevel?: 3 | 4 }) {
  if (!pools) return null;
  const { insight, moxie, vigor, flex, morphFlex, egoFlex, temporaryFlex } = pools;
  const Heading = headingLevel === 3 ? 'h3' : 'h4';
  return (
    <section className="character-pools" aria-label="Character pools">
      <Heading>Character pools</Heading>
      <p className="morph-stats">
        <span>Insight <strong>{insight}</strong></span>
        <span>Moxie <strong>{moxie}</strong></span>
        <span>Vigor <strong>{vigor}</strong></span>
        <span>Flex <strong>{flex ?? 'Pending'}</strong></span>
      </p>
      <p className="rules-note">Flex adds {morphFlex} from the morph, {egoFlex} from the ego, and {temporaryFlex ?? 'pending'} from unspent starting MP.</p>
    </section>
  );
}
