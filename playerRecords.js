// ai generated: The multiplayer server owns this small CSV so both clients share one record per name.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const defaultRecord = name => ({ name, wins: 0, losses: 0, draws: 0, elo: 1000 });
export const normalizeName = name => typeof name === 'string' ? name.trim().replace(/[\r\n]/g, ' ').slice(0, 20) : '';
const recordKey = name => normalizeName(name).toLocaleLowerCase();

// ai generated: Quotes and commas in player names are escaped instead of becoming extra CSV columns.
const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;
function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell);
  return cells;
}

export function createRecordStore(filePath = join(process.cwd(), 'data', 'player-records.csv')) {
  const records = new Map();
  if (existsSync(filePath)) {
    const lines = readFileSync(filePath, 'utf8').trim().split(/\r?\n/).slice(1);
    for (const line of lines) {
      if (!line) continue;
      const [name, wins, losses, draws, elo] = parseCsvLine(line);
      if (!normalizeName(name)) continue;
      records.set(recordKey(name), { name, wins: Number(wins), losses: Number(losses), draws: Number(draws), elo: Number(elo) });
    }
  }

  function get(name) {
    const cleanName = normalizeName(name);
    const existing = records.get(recordKey(cleanName));
    return existing ? { ...existing } : defaultRecord(cleanName);
  }

  // ai generated: Apply both sides before one write; equal names gain a win and loss but net zero ELO.
  function recordMatch(firstName, secondName, firstPoints, secondPoints) {
    const names = [normalizeName(firstName), normalizeName(secondName)];
    if (names.some(name => !name) || !Number.isFinite(firstPoints) || !Number.isFinite(secondPoints)) throw new Error('Invalid match result');
    const next = new Map(records);
    const outcomes = firstPoints === secondPoints ? ['draws', 'draws'] : firstPoints > secondPoints ? ['wins', 'losses'] : ['losses', 'wins'];
    names.forEach((name, index) => {
      const key = recordKey(name);
      const record = { ...(next.get(key) ?? defaultRecord(name)) };
      record[outcomes[index]]++;
      record.elo += outcomes[index] === 'wins' ? 10 : outcomes[index] === 'losses' ? -10 : 0;
      next.set(key, record);
    });
    mkdirSync(dirname(filePath), { recursive: true });
    const csv = ['name,wins,losses,draws,elo', ...[...next.values()].map(record => [record.name, record.wins, record.losses, record.draws, record.elo].map(csvCell).join(','))].join('\n') + '\n';
    const temporaryPath = `${filePath}.tmp`;
    writeFileSync(temporaryPath, csv);
    renameSync(temporaryPath, filePath);
    records.clear();
    next.forEach((record, key) => records.set(key, record));
    return { p1: get(names[0]), p2: get(names[1]) };
  }

  return { get, recordMatch };
}
