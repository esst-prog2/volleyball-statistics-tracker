const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/core.js');

const sample = fs.readFileSync(path.join(__dirname, '..', 'samples', 'cev-82293-selected-players.csv'), 'utf8');
const secondRealMatch = fs.readFileSync(path.join(__dirname, '..', 'samples', 'cev-82294-full-match.csv'), 'utf8');

function editRows(change) {
  const records = core.parseCsv(sample);
  const headers = records[0].values;
  const rows = records.slice(1).map(({ values }) => [...values]);
  change(headers, rows);
  return [headers, ...rows].map((row) => row.map((value) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(',')).join('\n');
}

function hasError(result, field) {
  assert.equal(result.match, null);
  assert.ok(result.errors.some((error) => error.field === field), JSON.stringify(result.errors));
}

test('sample match loads with five sets and selected players', () => {
  const result = core.parseMatchCsv(sample);
  assert.deepEqual(result.errors, []);
  assert.equal(result.match.score1, 3);
  assert.equal(result.match.score2, 2);
  assert.equal(result.match.sets.length, 5);
  assert.equal(result.match.players.length, 4);
});

test('CSV handles reordered columns, extra columns, BOM, and quoted comma', () => {
  const changed = editRows((headers, rows) => {
    const teamIndex = headers.indexOf('team_1');
    headers.unshift(...headers.splice(teamIndex, 1));
    for (const row of rows) row.unshift(...row.splice(teamIndex, 1));
    headers.push('note');
    for (const row of rows) row.push('');
    rows[1][headers.indexOf('player')] = 'BOŠKOVIĆ, Tijana';
  });
  const result = core.parseMatchCsv(`\uFEFF${changed}`);
  assert.deepEqual(result.errors, []);
  assert.equal(result.match.players[0].name, 'BOŠKOVIĆ, Tijana');
});

test('missing required column is identified', () => {
  const changed = editRows((headers, rows) => {
    const index = headers.indexOf('block_points');
    headers.splice(index, 1);
    for (const row of rows) row.splice(index, 1);
  });
  hasError(core.parseMatchCsv(changed), 'block_points');
});

test('quoted newlines and escaped quotes parse as one field', () => {
  assert.deepEqual(core.parseCsv('a,b\n"one\n""two""",three'), [
    { line: 1, values: ['a', 'b'] },
    { line: 2, values: ['one\n"two"', 'three'] },
  ]);
});

test('incomplete set and played set after a gap are rejected', () => {
  const incomplete = editRows((headers, rows) => { rows[0][headers.indexOf('set_5_team_2')] = ''; });
  hasError(core.parseMatchCsv(incomplete), 'set_5_team_2');
  const gap = editRows((headers, rows) => {
    rows[0][headers.indexOf('set_4_team_1')] = '';
    rows[0][headers.indexOf('set_4_team_2')] = '';
  });
  hasError(core.parseMatchCsv(gap), 'set_5_team_1');
});

test('match must end with a team winning three sets', () => {
  const changed = editRows((headers, rows) => {
    rows[0][headers.indexOf('set_3_team_1')] = '25';
    rows[0][headers.indexOf('set_3_team_2')] = '27';
  });
  hasError(core.parseMatchCsv(changed), 'set_4_team_1');
});

test('player checks identify points, zero-vs-blank, team, and duplicate errors', () => {
  const points = editRows((headers, rows) => { rows[1][headers.indexOf('points')] = '35'; });
  hasError(core.parseMatchCsv(points), 'points');
  const blank = editRows((headers, rows) => { rows[1][headers.indexOf('serve_aces')] = ''; });
  hasError(core.parseMatchCsv(blank), 'serve_aces');
  const team = editRows((headers, rows) => { rows[1][headers.indexOf('team')] = 'Other'; });
  hasError(core.parseMatchCsv(team), 'team');
  const duplicate = editRows((headers, rows) => { rows.push([...rows[1]]); });
  hasError(core.parseMatchCsv(duplicate), 'player');
});

test('reception percentages and count constraints are validated', () => {
  const noPercent = editRows((headers, rows) => { rows[2][headers.indexOf('reception_positive_pct')] = ''; });
  hasError(core.parseMatchCsv(noPercent), 'reception_positive_pct');
  const extraPercent = editRows((headers, rows) => { rows[1][headers.indexOf('reception_positive_pct')] = '0'; });
  hasError(core.parseMatchCsv(extraPercent), 'reception_positive_pct');
  const attacks = editRows((headers, rows) => { rows[1][headers.indexOf('attack_attempts')] = '3'; });
  hasError(core.parseMatchCsv(attacks), 'attack_attempts');
});

test('CEV sample has the hand-checked player and partial-team results', () => {
  const match = core.parseMatchCsv(sample).match;
  const vakif = core.teamTotals(match, match.team1);
  assert.equal(vakif.points, 65);
  assert.equal(vakif.attack_attempts, 123);
  assert.equal(vakif.attack_points, 64);
  assert.equal(core.attackSuccess(vakif).toFixed(1), '52.0');
  assert.equal(core.attackEfficiency(vakif).toFixed(1), '41.5');
  const tijana = match.players.find((player) => player.name.includes('BOŠKOVIĆ'));
  assert.equal(core.attackSuccess(tijana).toFixed(1), '52.4');
  assert.equal(core.attackEfficiency(tijana).toFixed(1), '46.0');
  assert.equal(core.receptionErrorRate(tijana), null);
});

test('CSV format survives a second complete real CEV match', () => {
  const result = core.parseMatchCsv(secondRealMatch);
  assert.deepEqual(result.errors, []);
  assert.equal(result.match.team1, 'Eczacibasi Dynavit ISTANBUL');
  assert.equal(result.match.team2, 'Savino Del Bene SCANDICCI');
  assert.deepEqual([result.match.score1, result.match.score2], [3, 2]);
  assert.equal(result.match.sets.length, 5);
  assert.equal(result.match.players.length, 28);

  const antropova = result.match.players.find((player) => player.name === 'ANTROPOVA Ekaterina');
  assert.equal(antropova.points, 34);
  assert.equal(antropova.attack_attempts, 49);
  assert.equal(antropova.attack_points, 28);
});
