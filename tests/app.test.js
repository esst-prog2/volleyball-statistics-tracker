const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../src/core.js');

const app = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const sample = fs.readFileSync(path.join(__dirname, '../samples/cev-82293-selected-players.csv'), 'utf8');

// Minimal DOM surface for testing the real import handlers and render functions.
function setup(fetchImpl, storage = new Map()) {
  function node() {
    return {
      hidden: false, textContent: '', children: [], handlers: {}, files: [],
      classList: { add() {} }, setAttribute() {},
      append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
      addEventListener(type, handler) { this.handlers[type] = handler; },
    };
  }
  const nodes = new Map();
  const get = (id) => {
    if (!nodes.has(id)) nodes.set(id, node());
    return nodes.get(id);
  };
  vm.runInNewContext(app, {
    VBT: core, document: { getElementById: get, createElement: node },
    location: { protocol: 'http:' }, fetch: fetchImpl,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  return {
    get,
    storage,
    csv(text) {
      get('csv-file').files = [{ name: 'match.csv', text: () => text }];
      return get('csv-file').handlers.change();
    },
    cev() { return get('cev-form').handlers.submit({ preventDefault() {} }); },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

for (const source of ['csv', 'cev']) {
  test(`late ${source} import cannot restore a report after a newer invalid CSV`, async () => {
    const pending = deferred();
    const ui = setup(() => pending.promise);
    await ui.csv(sample);
    assert.equal(ui.get('report').hidden, false);
    const earlier = source === 'csv' ? ui.csv(pending.promise) : ui.cev();
    await ui.csv('invalid CSV');
    assert.equal(ui.get('report').hidden, true);
    assert.equal(ui.get('errors').hidden, false);
    pending.resolve(source === 'csv' ? sample : {
      ok: true, json: async () => ({ match: core.parseMatchCsv(sample).match }),
    });
    await earlier;
    assert.equal(ui.get('report').hidden, true);
    assert.equal(ui.get('errors').hidden, false);
  });
}

test('late CEV failure cannot replace a newer successful CSV with an error', async () => {
  const pending = deferred();
  const ui = setup(() => pending.promise);
  const earlier = ui.cev();
  await ui.csv(sample);
  pending.resolve({ ok: false, json: async () => ({ error: { message: 'Old failure' } }) });
  await earlier;
  assert.equal(ui.get('report').hidden, false);
  assert.equal(ui.get('errors').hidden, true);
  assert.equal(ui.get('cev-submit').disabled, false);
});

test('CSV report renders required values, supports player selection, and replaces matches', async () => {
  const ui = setup(() => { throw new Error('CSV must not fetch'); });
  const text = (node) => typeof node === 'string' ? node :
    [String(node.textContent), ...node.children.map(text)].join(' ');
  await ui.csv(sample);
  assert.equal(ui.get('team-1-name').textContent, 'VakifBank ISTANBUL');
  assert.equal(ui.get('team-1-sets').textContent, 3);
  assert.equal(ui.get('team-2-sets').textContent, 2);
  assert.equal(ui.get('sets').children.length, 5);
  assert.match(text(ui.get('team-summary')), /Player points 65/);
  assert.match(text(ui.get('team-summary')), /Efficiency 41\.5%/);
  assert.match(text(ui.get('player-detail')), /Efficiency 46\.0%/);
  assert.match(text(ui.get('player-detail')), /Unavailable/);
  const markova = ui.get('player-list').children[0].children.find((node) => node.textContent === 'MARKOVA Marina');
  markova.handlers.click();
  assert.match(text(ui.get('player-detail')), /MARKOVA Marina/);
  assert.match(text(ui.get('player-detail')), /Positive 47%/);
  // Markova: 2 reception errors / 34 attempts = 5.9% rounded.
  assert.match(text(ui.get('player-detail')), /Error rate 5\.9%/);
  assert.match(text(ui.get('team-summary')), /Error rate 5\.9%/);
  assert.match(text(ui.get('player-detail')), /Excellent 21%/);
  await ui.csv(sample.replaceAll('VakifBank ISTANBUL', 'Replacement team'));
  assert.equal(ui.get('team-1-name').textContent, 'Replacement team');
  assert.doesNotMatch(text(ui.get('team-summary')), /VakifBank/);
  assert.equal(ui.get('errors').hidden, true);
});

function content(node) {
  return typeof node === 'string' ? node : [String(node.textContent), ...node.children.map(content)].join(' ');
}

test('saved matches survive reload, replace repeat imports, reopen without fetching, and delete', async () => {
  const noFetch = () => { throw new Error('must not fetch'); };
  const ui = setup(noFetch);
  await ui.csv(sample);
  await ui.csv(sample);
  assert.equal(ui.get('saved-matches').children.length, 1);
  const reloaded = setup(noFetch, ui.storage);
  assert.equal(reloaded.get('saved-matches').children.length, 1);
  reloaded.get('saved-matches').children[0].children[0].handlers.click();
  assert.equal(reloaded.get('report').hidden, false);
  assert.equal(reloaded.get('team-1-name').textContent, 'VakifBank ISTANBUL');
  reloaded.get('saved-matches').children[0].children[1].handlers.click();
  assert.match(content(reloaded.get('saved-matches')), /No saved matches/);
  assert.equal(setup(noFetch, ui.storage).get('comparison-player').disabled, true);
});

test('comparison shows independently calculated rates across saved matches', async () => {
  const ui = setup();
  await ui.csv(sample);
  await ui.csv(sample.replaceAll('VakifBank ISTANBUL', 'Another team').replace('63,2,2,33,1', '60,2,2,33,1'));
  // Use the actual source spelling rather than assuming accents or spacing.
  ui.get('comparison-player').value = core.parseMatchCsv(sample).match.players.find(p => p.name.includes('BOŠKOVIĆ')).name;
  ui.get('comparison-player').handlers.change();
  const rendered = content(ui.get('comparison-results'));
  assert.match(rendered, /52\.4%/);
  assert.match(rendered, /46\.0%/);
  // Second report: 33 / 60 = 55%; (33 - 2 - 2) / 60 = 48.3% rounded.
  assert.match(rendered, /55\.0%/);
  assert.match(rendered, /48\.3%/);
  assert.match(rendered, /Unavailable/);
  assert.match(rendered, /2 saved appearances/);
  assert.match(rendered, /Another team/);
  assert.match(rendered, /VakifBank/);
});

test('storage failure leaves imported report usable and damaged data does not crash startup', async () => {
  const storage = new Map();
  storage.set = () => { throw new Error('quota'); };
  const ui = setup(undefined, storage);
  await ui.csv(sample);
  assert.equal(ui.get('report').hidden, false);
  assert.match(ui.get('saved-status').textContent, /Could not save/);
  const damaged = setup(undefined, new Map([['vbt.saved-matches.v1', '{broken']]));
  assert.match(damaged.get('saved-status').textContent, /could not be loaded/);
  assert.equal(damaged.get('comparison-player').disabled, true);
});

test('reopening a saved match prevents a pending import from replacing it', async () => {
  const pending = deferred();
  const ui = setup(() => pending.promise);
  await ui.csv(sample);
  const earlier = ui.cev();
  ui.get('saved-matches').children[0].children[0].handlers.click();
  pending.resolve({ ok: false, json: async () => ({ error: { code: 'cev_timeout', message: 'Timed out' } }) });
  await earlier;
  assert.equal(ui.get('report').hidden, false);
  assert.equal(ui.get('errors').hidden, true);
});

test('timeout offers a working retry while invalid URL gives corrective guidance', async () => {
  let attempts = 0;
  const ui = setup(async () => ++attempts === 1 ? {
    ok: false, json: async () => ({ error: { code: 'cev_timeout', message: 'Timed out' } }),
  } : { ok: true, json: async () => ({ match: core.parseMatchCsv(sample).match }) });
  ui.get('cev-form').requestSubmit = () => ui.cev();
  await ui.cev();
  assert.match(content(ui.get('errors')), /Check your connection/);
  const retry = ui.get('errors').children.find(node => node.textContent === 'Retry import');
  await retry.handlers.click();
  assert.equal(ui.get('report').hidden, false);
  assert.equal(attempts, 2);
  const invalid = setup(async () => ({ ok: false, json: async () => ({ error: { code: 'unsupported_url', message: 'Unsupported URL' } }) }));
  await invalid.cev();
  assert.match(content(invalid.get('errors')), /including its ID/);
  assert.equal(invalid.get('errors').children.some(node => node.textContent === 'Retry import'), false);
});
