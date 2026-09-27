import test from 'node:test';
import assert from 'node:assert/strict';
import { get, writable } from 'svelte/store';
import { refreshRaceScores, resolveCurrentPlayer } from './scoreRefresh.ts';
import { advanceOngoingEffects } from './ongoingEffects.ts';

test('a score refresh recalculates and publishes both players without advancing effects', () => {
  const first = { handPoints: 12, ongoingPoints: 3, racePoints: 0 };
  const second = { handPoints: 7, ongoingPoints: 2, racePoints: 0 };
  const published = [];

  refreshRaceScores({
    first,
    second,
    score: player => { player.racePoints = player.handPoints + player.ongoingPoints; },
    publish: () => { published.push([first.racePoints, second.racePoints]); }
  });

  assert.deepEqual(published, [[15, 9]]);
  assert.equal(first.ongoingPoints, 3);
  assert.equal(second.ongoingPoints, 2);
});

test('an actual new turn advances each effect once, but a later display refresh does not', () => {
  const makePlayer = (numOfCharges, numOfGrowths, numOfInfects) => ({
    handPoints: 10,
    racePoints: 0,
    chargePoints: 0,
    growthPoints: 0,
    infectPoints: 0,
    numOfCharges,
    numOfGrowths,
    numOfInfects,
    boostsBlocked: false,
    trapsBlocked: false
  });
  const first = makePlayer(1, 2, 1);
  const second = makePlayer(2, 1, 2);
  const score = player => {
    player.racePoints = player.handPoints + player.chargePoints + player.growthPoints - player.infectPoints;
  };
  const publish = () => {};
  const advance = player => advanceOngoingEffects(player, player.boostsBlocked, player.trapsBlocked);

  refreshRaceScores({ first, second, score, publish, advance });
  assert.deepEqual([first.racePoints, second.racePoints], [12, 11]);
  assert.deepEqual([first.chargePoints, first.growthPoints, first.infectPoints], [1, 2, 1]);
  assert.deepEqual([second.chargePoints, second.growthPoints, second.infectPoints], [2, 1, 2]);

  first.handPoints = 15;
  second.boostsBlocked = true;
  refreshRaceScores({ first, second, score: player => {
    player.racePoints = player.handPoints + (player.boostsBlocked ? 0 : player.chargePoints + player.growthPoints) - player.infectPoints;
  }, publish });
  assert.deepEqual([first.racePoints, second.racePoints], [17, 8]);
  assert.deepEqual([first.chargePoints, first.growthPoints, first.infectPoints], [1, 2, 1]);
  assert.deepEqual([second.chargePoints, second.growthPoints, second.infectPoints], [2, 1, 2]);
});

test('multiplayer preserves the opponent-owned score while refreshing the local display', () => {
  const first = { handPoints: 8, racePoints: 0 };
  const second = { handPoints: 4, racePoints: 37 };
  const scored = [];

  refreshRaceScores({
    first,
    second,
    score: player => { scored.push(player); player.racePoints = player.handPoints; },
    publish: () => {},
    refreshSecond: false
  });

  assert.deepEqual(scored, [first]);
  assert.equal(first.racePoints, 8);
  assert.equal(second.racePoints, 37);
});

test('publishing an in-place score calculation notifies a Svelte player store', () => {
  const first = { handPoints: 6, racePoints: 0 };
  const second = { handPoints: 4, racePoints: 0 };
  const firstStore = writable(first);
  const shownScores = [];
  const unsubscribe = firstStore.subscribe(player => shownScores.push(player.racePoints));

  refreshRaceScores({
    first,
    second,
    score: player => { player.racePoints = player.handPoints; },
    publish: () => firstStore.set(first),
    refreshSecond: false
  });

  assert.deepEqual(shownScores, [0, 6]);
  unsubscribe();
});

for (const card of ['eggGiraffe', 'xenoEgg', 'vision', 'exposed']) {
  test(`drawing ${card} scores the replacement player object, not its stale pre-draw reference`, () => {
    const beforeDraw = { id: 'p1', hand: ['bear'], racePoints: 0, vultureNextDraw: true };
    const opponent = { id: 'p2', hand: [], racePoints: 0, vultureNextDraw: false };
    const playerStore = writable(beforeDraw);
    playerStore.set({ ...beforeDraw, hand: [...beforeDraw.hand, card] });

    const currentPlayer = resolveCurrentPlayer(beforeDraw, get(playerStore), opponent);
    currentPlayer.vultureNextDraw = false;
    refreshRaceScores({
      first: currentPlayer,
      second: opponent,
      score: player => { player.racePoints = player.hand.length; },
      publish: () => playerStore.set(currentPlayer),
      refreshSecond: false
    });

    assert.equal(get(playerStore).racePoints, 2);
    assert.equal(get(playerStore).vultureNextDraw, false);
    assert.equal(beforeDraw.racePoints, 0);
  });
}
