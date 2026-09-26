import test from 'node:test';
import assert from 'node:assert/strict';
import { selectNonBeastDraw } from './vultureDraw.ts';

const isBeast = card => ['vulture', 'lion', 'leon', 'nightTerror'].includes(card);

test('Scraps chooses a non-Beast from the remaining decks without removing rejected cards', () => {
  // ai generated: Leon counts as a Beast even though it comes from Neutrals.
  const decks = { beasts: ['vulture', 'lion'], neutrals: ['leon', 'echo'], humans: ['knight'] };
  const result = selectNonBeastDraw(['beasts', 'neutrals', 'humans'], decks, isBeast, () => 0);
  assert.deepEqual(result, { deck: 'neutrals', card: 'echo' });
  assert.deepEqual(decks.beasts, ['vulture', 'lion']);
});

test('Scraps allows a Beast when no non-Beast can be drawn', () => {
  assert.equal(selectNonBeastDraw(['beasts'], { beasts: ['lion', 'vulture'] }, isBeast), null);
});

test('Scraps preserves Elf Champion as the forced Elf draw', () => {
  const decks = { beasts: ['lion'], elves: ['elfChampion', 'bardLute'] };
  assert.deepEqual(selectNonBeastDraw(['beasts', 'elves'], decks, isBeast, () => 0), {
    deck: 'elves', card: 'elfChampion'
  });
});

test('Scraps ignores empty decks', () => {
  assert.deepEqual(selectNonBeastDraw(['beasts', 'humans'], { beasts: [], humans: ['knight'] }, isBeast, () => 0), {
    deck: 'humans', card: 'knight'
  });
});
