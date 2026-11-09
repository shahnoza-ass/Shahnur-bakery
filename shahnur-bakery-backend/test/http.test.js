const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
test('HTTP health, authorization, validation and mounted chat endpoints', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const health = await fetch(base + '/health'); assert.equal(health.status, 200);
    assert.equal((await fetch(base + '/ready')).status, 503);
    for (const route of ['/api/chat', '/api/chat/unread', '/api/admin/users', '/api/orders']) {
      assert.equal((await fetch(base + route)).status, 401, route);
    }
    assert.equal((await fetch(base + '/api/products/not-an-id')).status, 404);
    for (const query of ['limit=0', 'limit=101', 'page=-1', 'page=1.5', 'search=' + 'x'.repeat(101)]) {
      assert.equal((await fetch(base + '/api/products?' + query)).status, 400);
    }
    const response = await fetch(base + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', email: 'invalid', message: 'Hi' }) });
    assert.equal(response.status, 400);
    assert.equal((await fetch(base + '/missing')).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
