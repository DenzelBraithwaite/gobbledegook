// ai generated: Run with `node --test playerRecords.test.mjs`; these use a temporary CSV, not real saves.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createRecordStore } from './playerRecords.js';

test('records start at 1000 and are not written merely by looking up a name', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gdg-records-'));
  const file = join(folder, 'records.csv');
  try {
    const records = createRecordStore(file);
    assert.deepEqual(records.get(' Kaz '), { name: 'Kaz', wins: 0, losses: 0, draws: 0, elo: 1000 });
    assert.throws(() => readFileSync(file));
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

test('wins, losses, draws, reloads, and case-insensitive names', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gdg-records-'));
  const file = join(folder, 'records.csv');
  try {
    const records = createRecordStore(file);
    records.recordMatch('Kaz', 'Denzel', 50, 30);
    assert.equal(records.get('Kaz').elo, 1010);
    assert.equal(records.get('Denzel').elo, 990);
    records.recordMatch('KAZ', 'Denzel', 10, 20);
    records.recordMatch('Kaz', 'Denzel', 25, 25);
    const loaded = createRecordStore(file);
    assert.deepEqual(loaded.get('kaz'), { name: 'Kaz', wins: 1, losses: 1, draws: 1, elo: 1000 });
    assert.deepEqual(loaded.get('Denzel'), { name: 'Denzel', wins: 1, losses: 1, draws: 1, elo: 1000 });
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

test('same-name players cancel ELO while recording both outcomes, and CSV quotes names', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gdg-records-'));
  const file = join(folder, 'records.csv');
  try {
    const records = createRecordStore(file);
    records.recordMatch('Kaz, "Ace"', 'KAZ, "ACE"', 40, 20);
    assert.deepEqual(createRecordStore(file).get('kaz, "ace"'), { name: 'Kaz, "Ace"', wins: 1, losses: 1, draws: 0, elo: 1000 });
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
