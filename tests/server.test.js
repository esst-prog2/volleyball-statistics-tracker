const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createAppServer, importCevPage, safeStaticPath } = require('../server.js');

const sourceUrl = 'https://www-old.cev.eu/Competition-Area/MatchStatistics.aspx?ID=82293';
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures', 'cev-82293.html'), 'utf8');

async function withServer(options, action) {
  const server = createAppServer(options);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try { return await action(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('static server serves the app and sample with content types', async () => {
  await withServer({}, async (base) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /^text\/html/);
    assert.match(await page.text(), /Volleyball Match Report/);
    const sample = await fetch(`${base}/samples/cev-82293-selected-players.csv`);
    assert.match(sample.headers.get('content-type'), /^text\/csv/);
  });
  assert.equal(safeStaticPath('/..%2Fpackage.json'), null);
  assert.equal(safeStaticPath('/.git/config'), null);
});

test('CEV endpoint returns a validated match from an allowed URL', async () => {
  let requested;
  const fetchImpl = async (url, options) => {
    requested = { url, redirect: options.redirect };
    return new Response(fixture, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  await withServer({ fetchImpl }, async (base) => {
    const response = await fetch(`${base}/api/cev-import`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: `${sourceUrl}&setN=0` }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual([body.match.score1, body.match.score2, body.match.players.length], [3, 2, 4]);
  });
  assert.deepEqual(requested, { url: sourceUrl, redirect: 'manual' });
});

test('CEV endpoint rejects unsupported URLs without fetching', async () => {
  let calls = 0;
  await withServer({ fetchImpl: async () => { calls += 1; } }, async (base) => {
    const response = await fetch(`${base}/api/cev-import`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com/' }),
    });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error.code, 'unsupported_url');
  });
  assert.equal(calls, 0);
});

test('retrieval rejects redirects, failed responses, oversized pages, and timeouts', async () => {
  await assert.rejects(() => importCevPage(sourceUrl, { fetchImpl: async () => new Response('', { status: 302 }) }), /did not follow/);
  await assert.rejects(() => importCevPage(sourceUrl, { fetchImpl: async () => new Response('', { status: 503 }) }), /HTTP 503/);
  await assert.rejects(() => importCevPage(sourceUrl, { maxBytes: 5, fetchImpl: async () => new Response('123456') }), /too large/);
  const waitingFetch = async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason)));
  await assert.rejects(() => importCevPage(sourceUrl, { timeoutMs: 5, fetchImpl: waitingFetch }), /timed out/);
});

test('endpoint limits request bodies and reports changed page structure', async () => {
  await withServer({ fetchImpl: async () => new Response('<html></html>') }, async (base) => {
    const changed = await fetch(`${base}/api/cev-import`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: sourceUrl }),
    });
    assert.equal(changed.status, 422);
    assert.equal((await changed.json()).error.code, 'format_changed');
    const huge = await fetch(`${base}/api/cev-import`, { method: 'POST', body: 'x'.repeat(9000) });
    assert.equal(huge.status, 413);
  });
});
