const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

test('production serves SPA routes and PWA assets without masking API errors', { skip: !fs.existsSync(path.resolve(__dirname, '../../shahnur-bakery-frontend/dist/index.html')) }, async () => {
  process.env.NODE_ENV = 'production';
  process.env.TRUST_PROXY_HOPS = '1';
  const app = require('../src/app');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const url of ['/', '/cake-builder', '/checkout']) {
      const response = await fetch(base + url);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.match(await response.text(), /id="root"/);
    }
    const manifest = await fetch(base + '/manifest.webmanifest');
    assert.equal(manifest.status, 200);
    assert.equal((await manifest.json()).display, 'standalone');
    const sw = await fetch(base + '/sw.js');
    assert.equal(sw.status, 200);
    assert.match(sw.headers.get('cache-control'), /no-cache/);
    for (const url of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png', '/offline.html']) {
      assert.equal((await fetch(base + url)).status, 200, url);
    }
    assert.equal((await fetch(base + '/api/missing')).status, 404);
    assert.equal((await fetch(base + '/missing.js')).status, 404);
    assert.equal((await fetch(base + '/ready')).status, 503);
    assert.equal(app.get('trust proxy'), 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('service worker bypasses APIs and mutations and supplies only an offline navigation fallback', async () => {
  const vm = require('node:vm');
  const handlers = {};
  const offline = { offline: true };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../shahnur-bakery-frontend/public/sw.js'), 'utf8'), {
    URL,
    self: { location: { origin: 'https://bakery.example' }, addEventListener: (event, handler) => { handlers[event] = handler; } },
    caches: { match: async key => key === '/offline.html' ? offline : undefined },
    fetch: async () => { throw new Error('offline'); },
  });
  const send = async (pathname, method, mode) => {
    let result;
    handlers.fetch({ request: { url: 'https://bakery.example' + pathname, method, mode }, respondWith: promise => { result = promise; } });
    return result;
  };
  assert.equal(await send('/api/orders', 'POST', 'cors'), undefined);
  assert.equal(await send('/api/products', 'GET', 'cors'), undefined);
  assert.equal(await send('/socket.io/?transport=polling', 'GET', 'cors'), undefined);
  assert.equal(await send('/checkout', 'GET', 'navigate'), offline);
});
