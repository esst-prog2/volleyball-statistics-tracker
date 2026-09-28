const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/core.js');
const { CevImportError, decodeEntities, parseCevHtml, validateCevUrl } = require('../src/cev.js');

const sourceUrl = 'https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293';
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures', 'cev-82293.html'), 'utf8');

test('CEV URL validator returns one canonical full-match URL', () => {
  assert.equal(validateCevUrl(sourceUrl), sourceUrl);
  assert.equal(validateCevUrl(`${sourceUrl}&setN=0`), sourceUrl);
});

test('CEV URL validator rejects unsafe and unsupported variations before retrieval', () => {
  const invalid = [
    'http://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293',
    'https://cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293',
    'https://www-old.cev.eu/other?ID=82293',
    'https://user:password@www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293',
    `${sourceUrl}#players`, `${sourceUrl}&ID=1`, `${sourceUrl}&setN=2`, `${sourceUrl}&next=https://example.com`,
  ];
  for (const value of invalid) assert.throws(() => validateCevUrl(value), CevImportError, value);
});

test('HTML entities are decoded for imported names', () => {
  assert.equal(decodeEntities('A &amp; B &#352; &#x160; &nbsp;'), 'A & B Š Š  ');
});

test('CEV fixture maps both teams, sets, players, placeholders, and provenance', () => {
  const match = parseCevHtml(fixture, sourceUrl);
  assert.equal(match.team1, 'VakifBank ISTANBUL');
  assert.equal(match.team2, 'A. Carraro Prosecco DOC CONEGLIANO');
  assert.deepEqual([match.score1, match.score2], [3, 2]);
  assert.deepEqual(match.sets.map((set) => [set.team1, set.team2]), [[22, 25], [18, 25], [29, 27], [25, 23], [15, 11]]);
  assert.equal(match.players.length, 4);
  const tijana = match.players.find((player) => player.name === 'BOŠKOVIĆ Tijana');
  assert.equal(tijana.points, 34);
  assert.equal(tijana.reception_attempts, 0);
  assert.equal(tijana.reception_positive_pct, null);
  assert.equal(core.attackEfficiency(tijana).toFixed(1), '46.0');
  const marina = match.players.find((player) => player.name === 'MARKOVA Marina');
  assert.equal(marina.reception_positive_pct, 47);
  assert.equal(marina.reception_excellent_pct, 21);
  assert.deepEqual(match.source, { type: 'cev', url: sourceUrl });
});

test('CEV parser rejects missing structure and invalid statistics', () => {
  assert.throws(() => parseCevHtml(fixture.replace('id="GV_elenco_fuori"', 'id="changed"'), sourceUrl), /missing GV_elenco_fuori/);
  assert.throws(() => parseCevHtml(fixture.replace('>34<', '>35<'), sourceUrl), /failed validation/);
  assert.throws(() => parseCevHtml(fixture.replace('id="L_Set3"', 'id="changed"'), sourceUrl), /nonconsecutive set scores/);
});
