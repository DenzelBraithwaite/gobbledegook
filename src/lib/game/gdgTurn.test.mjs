import assert from 'node:assert/strict';
import test from 'node:test';
import { isGdgUnlocked, maximumGdgTurn, minimumGdgTurn, rollGdgUnlockTurn } from './gdgTurn.js';

// ai generated: Named deterministic rolls make both inclusive ends of the wheel easy to verify.
function firstPosition() {
  return 0;
}

function lastPosition() {
  return 0.999999;
}

function exactUpperBoundary() {
  return 1;
}

test('the roll includes both turn 10 and turn 25', () => {
  assert.equal(minimumGdgTurn, 10);
  assert.equal(maximumGdgTurn, 25);
  assert.equal(rollGdgUnlockTurn(firstPosition), 10);
  assert.equal(rollGdgUnlockTurn(lastPosition), 25);
  assert.equal(rollGdgUnlockTurn(exactUpperBoundary), 25);
});

test('the rolled turn controls declarations, while a declared game keeps its final-turn option', () => {
  assert.equal(isGdgUnlocked(22, 23), false);
  assert.equal(isGdgUnlocked(23, 23), true);
  assert.equal(isGdgUnlocked(22, 23, true), true);
  assert.equal(isGdgUnlocked(1, 0), false);
});
