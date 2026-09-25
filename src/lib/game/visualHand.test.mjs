import test from 'node:test';
import assert from 'node:assert/strict';
import { findDiscardIndex, reconcileVisualHand } from './visualHand.ts';

test('discarding the later duplicate removes that hand slot and rendered copy', () => {
  // ai generated: The newly drawn second Miner must disappear when it is the one clicked.
  const hand = ['miner', 'knight', 'miner', 'villager', 'bardLute', 'wolf'];
  const views = hand.map((title, index) => ({ title, key: index + 1 }));
  const clickedIndex = findDiscardIndex(hand, 'miner', 2);
  assert.equal(clickedIndex, 2);
  hand.splice(clickedIndex, 1);
  const result = reconcileVisualHand(views, hand, 3, 6);
  assert.deepEqual(result.cards.map(card => card.key), [1, 2, 4, 5, 6]);
});

test('discarding the earlier duplicate removes its own rendered copy', () => {
  const hand = ['miner', 'knight', 'miner', 'villager', 'bardLute', 'wolf'];
  const views = hand.map((title, index) => ({ title, key: index + 1 }));
  hand.splice(findDiscardIndex(hand, 'miner', 0), 1);
  const result = reconcileVisualHand(views, hand, 1, 6);
  assert.deepEqual(result.cards.map(card => card.key), [2, 3, 4, 5, 6]);
});

test('a forced discard or CPU choice still finds the named card', () => {
  assert.equal(findDiscardIndex(['miner', 'xenoEgg', 'miner'], 'xenoEgg', 2), 1);
  assert.equal(findDiscardIndex(['miner', 'knight', 'miner'], 'miner'), 0);
});
