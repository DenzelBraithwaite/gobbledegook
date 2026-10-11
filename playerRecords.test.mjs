// ai generated: Run with `node --test playerRecords.test.mjs`; these use a temporary CSV, not real saves.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createRecordStore, getEloAdjustment } from './playerRecords.js';

test('each tier uses its own win and loss movement', () => {
  assert.equal(getEloAdjustment(699, 'wins'), 30);
  assert.equal(getEloAdjustment(699, 'losses'), -20);
  assert.equal(getEloAdjustment(700, 'wins'), 28);
  assert.equal(getEloAdjustment(899, 'losses'), -22);
  assert.equal(getEloAdjustment(900, 'wins'), 26);
  assert.equal(getEloAdjustment(1099, 'losses'), -24);
  assert.equal(getEloAdjustment(1100, 'wins'), 25);
  assert.equal(getEloAdjustment(1299, 'losses'), -25);
  assert.equal(getEloAdjustment(1300, 'wins'), 22);
  assert.equal(getEloAdjustment(1500, 'losses'), -28);
  assert.equal(getEloAdjustment(1000, 'draws'), 0);
});

test('records start at 1000 and are not written merely by looking up a name', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gdg-records-'));
  const file = join(folder, 'records.csv');
  try {
    const records = createRecordStore(file);
    assert.deepEqual(records.get(' Kaz '), { name: 'Kaz', wins: 0, losses: 0, draws: 0, elo: 1000 });
    assert.throws(() => readFileSync(file));
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('wins, losses, draws, reloads, and case-insensitive names', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gdg-records-'));
  const file = join(folder, 'records.csv');
  try {
    const records = createRecordStore(file);
    records.recordMatch('Kaz', 'Denzel', 50, 30);
    assert.equal(records.get('Kaz').elo, 1026);
    assert.equal(records.get('Denzel').elo, 976);
    records.recordMatch('KAZ', 'Denzel', 10, 20);
    records.recordMatch('Kaz', 'Denzel', 25, 25);
    const loaded = createRecordStore(file);
    assert.deepEqual(loaded.get('kaz'), { name: 'Kaz', wins: 1, losses: 1, draws: 1, elo: 1002 });
    assert.deepEqual(loaded.get('Denzel'), { name: 'Denzel', wins: 1, losses: 1, draws: 1, elo: 1002 });
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('same-name players cancel ELO while recording both outcomes, and CSV quotes names', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gdg-records-'));
  const file = join(folder, 'records.csv');
  try {
    const records = createRecordStore(file);
    records.recordMatch('Kaz, "Ace"', 'KAZ, "ACE"', 40, 20);
    assert.deepEqual(createRecordStore(file).get('kaz, "ace"'), { name: 'Kaz, "Ace"', wins: 1, losses: 1, draws: 0, elo: 1000 });
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
