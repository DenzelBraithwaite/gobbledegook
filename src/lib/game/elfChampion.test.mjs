import assert from 'node:assert/strict';
import test from 'node:test';
import { hasAscendedElfChampion, shouldAscendElfChampion, shouldForceElfDraw } from './elfChampion.ts';

test('Elf Champion ascends only when drawn after Elf King has left the deck', () => {
  assert.equal(shouldAscendElfChampion('elfChampion', ['elfKing', 'highElf']), false);
  assert.equal(shouldAscendElfChampion('elfChampion', ['highElf']), true);
  assert.equal(shouldAscendElfChampion('highElf', []), false);
});

test('an ascended held Champion forces ordinary Elf draws until that deck is exhausted', () => {
  assert.equal(shouldForceElfDraw(true, ['elfChampion'], ['highElf'], 'humans'), true);
  assert.equal(shouldForceElfDraw(true, ['elfChampion'], [], 'humans'), false);
  assert.equal(shouldForceElfDraw(true, [], ['highElf'], 'humans'), false);
  assert.equal(shouldForceElfDraw(true, ['elfChampion'], ['highElf'], 'xenoEgg'), false);
});

test('the double-score trait requires both the activated flag and Champion in hand', () => {
  assert.equal(hasAscendedElfChampion(true, ['elfChampion', 'bardLute']), true);
  assert.equal(hasAscendedElfChampion(false, ['elfChampion']), false);
  assert.equal(hasAscendedElfChampion(true, ['bardLute']), false);
});
