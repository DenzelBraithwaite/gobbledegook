import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drawSoundEffects, gameSoundEffects, getDrawSoundEffect, getEventSoundEffect } from './soundEffects.ts';

test('named cards play their sound only on a completed private draw', () => {
  const expectedCards = [
    'emperor', 'goblinLord', 'longbeardLeader', 'elfKing', 'ai', 'dreamDestroyer',
    'nightTerror', 'spiritKing', 'sporax', 'goblinLordsMark', 'charge', 'chastity',
    'chester', 'chjester', 'oreoCookie', 'chocoChipCookie', 'thumbprintCookie',
    'oatmealCookie', 'corruption', 'dwarvenCall', 'echo', 'eradicate', 'exposed',
    'feast', 'gaze', 'growth', 'infect', 'lost', 'neutralize', 'rejuvenate', 'sap',
    'ticktock', 'tocktick', 'vision', 'xenoBloom', 'xenoBlossom', 'xenophobia',
    'shuffle', 'switcharoo'
  ];
  assert.deepEqual(Object.keys(drawSoundEffects).sort(), expectedCards.sort());
  assert.equal(getDrawSoundEffect('goblinLordsMark'), '/sounds/intruder_sound.mp3');
  assert.equal(getDrawSoundEffect('elfKing'), '/sounds/elf_king_taunt_sound.mp3');
  assert.equal(getDrawSoundEffect('spiritKing'), '/sounds/spirit_king_voice_sound.mp3');
  assert.equal(getDrawSoundEffect('oreoCookie'), getDrawSoundEffect('oatmealCookie'));
  assert.equal(getDrawSoundEffect('cookieCrumbs'), null);
  assert.equal(getDrawSoundEffect('rottenCookieCrumbs'), null);
  assert.equal(getDrawSoundEffect('lost'), '/sounds/lost_sound.mp3');
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
