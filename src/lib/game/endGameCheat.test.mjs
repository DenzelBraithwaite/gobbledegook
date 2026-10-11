import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldEndGameByName } from './endGameCheat.js';

test('the end-screen shortcut requires both names to be exactly end, case-insensitively', () => {
  assert.equal(shouldEndGameByName('end', 'End'), true);
  assert.equal(shouldEndGameByName('END', 'eNd'), true);
  assert.equal(shouldEndGameByName('end', 'Player 2'), false);
  assert.equal(shouldEndGameByName('ending', 'end'), false);
});
