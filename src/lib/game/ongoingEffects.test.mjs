import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceOngoingEffects } from './ongoingEffects.ts';

test('Charge and Growth retain five earned points through a temporary block, then resume at six', () => {
  // ai generated: Holding Xeno Guard hides the accumulated bonus but does not erase or grow either counter.
  const player = { chargePoints: 5, growthPoints: 5, infectPoints: 0, numOfCharges: 1, numOfGrowths: 1, numOfInfects: 0 };
  advanceOngoingEffects(player, true, false);
  advanceOngoingEffects(player, true, false);
  assert.equal(player.chargePoints, 5);
  assert.equal(player.growthPoints, 5);
  advanceOngoingEffects(player, false, false);
  assert.equal(player.chargePoints, 6);
  assert.equal(player.growthPoints, 6);
});

test('Infect retains its penalty through Rhino, then resumes instead of restarting', () => {
  const player = { chargePoints: 0, growthPoints: 0, infectPoints: 5, numOfCharges: 0, numOfGrowths: 0, numOfInfects: 1 };
  advanceOngoingEffects(player, false, true);
  advanceOngoingEffects(player, false, true);
  assert.equal(player.infectPoints, 5);
  advanceOngoingEffects(player, false, false);
  assert.equal(player.infectPoints, 6);
});

test('permanent blockers pause stored totals until Neutralize clears the effects', () => {
  // ai generated: Corruption and Chastity use the same blocked flags; the game separately resets all counters on Neutralize.
  const player = { chargePoints: 5, growthPoints: 5, infectPoints: 5, numOfCharges: 1, numOfGrowths: 1, numOfInfects: 1 };
  advanceOngoingEffects(player, true, true);
  assert.deepEqual([player.chargePoints, player.growthPoints, player.infectPoints], [5, 5, 5]);
});
