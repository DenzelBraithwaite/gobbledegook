import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drawSoundEffects, gameSoundEffects, getDrawSoundEffect, getEventSoundEffect } from './soundEffects.ts';

test('only requested drawn cards have private entrance sounds', () => {
  assert.equal(Object.keys(drawSoundEffects).length, 10);
  assert.equal(getDrawSoundEffect('goblinLordsMark'), '/music/intruder_sound.mp3');
  assert.equal(getDrawSoundEffect('elfKing'), '/music/elf_king_taunt.mp3');
  assert.equal(getDrawSoundEffect('spiritKing'), '/music/spirit_king_voice.mp3');
  assert.equal(getDrawSoundEffect('shuffle'), null);
});

test('only actual public or local action events play action sounds', () => {
  for (const event of ['revealed', 'vision', 'exposed']) assert.equal(getEventSoundEffect(event), gameSoundEffects.flip);
  assert.equal(getEventSoundEffect('switcharoo'), gameSoundEffects.switcharoo);
  assert.equal(getEventSoundEffect('shuffle'), gameSoundEffects.shuffle);
  assert.equal(getEventSoundEffect('gaze'), null);
});

test('every selected sound has a source asset and a Vite development copy', () => {
  for (const src of [...Object.values(drawSoundEffects), ...Object.values(gameSoundEffects)]) {
    assert.ok(existsSync(fileURLToPath(new URL(`../../../server/serve${src}`, import.meta.url))), `missing source: ${src}`);
    assert.ok(existsSync(fileURLToPath(new URL(`../../../public${src}`, import.meta.url))), `missing public copy: ${src}`);
  }
});
