import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseMusicAfterHandChange, getUnlockedMusicTracks, mainMusicTracks, nextMainMusicTrack } from './music.ts';

test('Main-A and Main-B alternate without a manual main-track choice', () => {
  assert.equal(nextMainMusicTrack(mainMusicTracks[0].src).title, 'Main-B');
  assert.equal(nextMainMusicTrack(mainMusicTracks[1].src).title, 'Main-A');
});

test('only the named race cards unlock leader themes', () => {
  const tracks = getUnlockedMusicTracks(['emperor', 'ai', 'sporax', 'chastity', 'corruption', 'neutralize', 'drainite']);
  assert.deepEqual(tracks.map(track => track.title), ['Humanity', 'Warning', 'Spaceship']);
});

test('Dream Destroyer and Night Terror offer one Prowl choice', () => {
  assert.deepEqual(getUnlockedMusicTracks(['dreamDestroyer', 'nightTerror']).map(track => track.title), ['Prowl']);
  const prowl = getUnlockedMusicTracks(['dreamDestroyer']);
  assert.equal(chooseMusicAfterHandChange(prowl, getUnlockedMusicTracks(['dreamDestroyer', 'nightTerror']), prowl[0].src), null);
});

test('visible opposing Spirit King unlocks Serenity without duplicating a locally held King', () => {
  assert.deepEqual(getUnlockedMusicTracks([], true).map(track => track.title), ['Serenity']);
  assert.deepEqual(getUnlockedMusicTracks(['spiritKing'], true).map(track => track.title), ['Serenity']);
  assert.deepEqual(getUnlockedMusicTracks([], false), []);
  assert.equal(chooseMusicAfterHandChange([], getUnlockedMusicTracks([], true), mainMusicTracks[0].src), '/music/serenity.mp3');
  assert.equal(chooseMusicAfterHandChange(getUnlockedMusicTracks([], true), [], '/music/serenity.mp3'), mainMusicTracks[0].src);
});

test('five Bards including Leon unlock Concert but four do not', () => {
  const four = ['bardLute', 'bardFlute', 'bardHorn', 'leon'];
  assert.deepEqual(getUnlockedMusicTracks(four), []);
  assert.deepEqual(getUnlockedMusicTracks([...four, 'bardDrum']).map(track => track.title), ['Concert']);
  assert.deepEqual(getUnlockedMusicTracks([...four, 'bardDrum', 'bardSinger']).map(track => track.title), ['Concert']);
});

test('a newly drawn leader takes over but an already available Concert does not restart', () => {
  const fiveBards = ['bardLute', 'bardFlute', 'bardHorn', 'bardDrum', 'bardSinger'];
  const concert = getUnlockedMusicTracks(fiveBards);
  assert.equal(chooseMusicAfterHandChange([], concert, mainMusicTracks[0].src), '/music/concert.mp3');
  assert.equal(chooseMusicAfterHandChange(concert, getUnlockedMusicTracks([...fiveBards, 'leon']), '/music/concert.mp3'), null);
  assert.equal(chooseMusicAfterHandChange(concert, getUnlockedMusicTracks([...fiveBards, 'emperor']), '/music/concert.mp3'), '/music/humanity.mp3');
});

test('losing the last special theme returns to Main-A', () => {
  const previous = getUnlockedMusicTracks(['goblinLord']);
  assert.equal(chooseMusicAfterHandChange(previous, [], '/music/conquest.mp3'), mainMusicTracks[0].src);
});

test('discarding one of two leaders keeps the remaining theme eligible', () => {
  const previous = getUnlockedMusicTracks(['emperor', 'goblinLord']);
  assert.equal(chooseMusicAfterHandChange(previous, getUnlockedMusicTracks(['emperor']), '/music/conquest.mp3'), '/music/humanity.mp3');
  assert.equal(chooseMusicAfterHandChange(previous, getUnlockedMusicTracks(['emperor']), '/music/humanity.mp3'), null);
});
