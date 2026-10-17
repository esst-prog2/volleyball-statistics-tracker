const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../src/core.js');

const app = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const sample = fs.readFileSync(path.join(__dirname, '../samples/cev-82293-selected-players.csv'), 'utf8');

// Minimal DOM surface for testing the real import handlers and render functions.
function setup(fetchImpl) {
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
  });
  return {
    get,
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
  assert.match(text(ui.get('player-detail')), /Excellent 21%/);
  await ui.csv(sample.replaceAll('VakifBank ISTANBUL', 'Replacement team'));
  assert.equal(ui.get('team-1-name').textContent, 'Replacement team');
  assert.doesNotMatch(text(ui.get('team-summary')), /VakifBank/);
  assert.equal(ui.get('errors').hidden, true);
});
