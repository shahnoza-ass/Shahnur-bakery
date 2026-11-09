const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootstrapAdmin } = require('../src/services/bootstrapAdmin');
const env = { ADMIN_EMAIL: ' Owner@Example.com ', ADMIN_PASSWORD: 'a-secure-test-password-123', ADMIN_PHONE: '+998901234567' };
const unavailable = { exists: async () => { throw new Error('Database must not be queried'); } };

test('admin bootstrap is disabled by default and rejects incomplete or weak credentials', async () => {
  assert.equal(await bootstrapAdmin({}, unavailable), 'disabled');
  for (const patch of [{ ADMIN_PASSWORD: 'short' }, { ADMIN_PHONE: '' }, { ADMIN_EMAIL: 'invalid' }, { ADMIN_PASSWORD: 'é'.repeat(37) }]) {
    assert.equal(await bootstrapAdmin({ ...env, ...patch }, unavailable), 'invalid');
  }
});

test('bootstrap creates an approved superadmin once without resetting existing credentials', async () => {
  const created = [];
  const users = { exists: async query => query.role === 'superadmin' && created.length > 0, create: async user => { created.push(user); } };
  assert.equal(await bootstrapAdmin(env, users), 'created');
  assert.equal(created[0].email, 'owner@example.com');
  assert.equal(created[0].role, 'superadmin');
  assert.equal(created[0].status, 'approved');
  assert.equal(await bootstrapAdmin({ ...env, ADMIN_PASSWORD: 'different-secure-password' }, users), 'exists');
  assert.equal(created.length, 1);
});

test('an existing ordinary account cannot receive admin privileges through bootstrap', async () => {
  const users = { exists: async query => Boolean(query.email), create: async () => { throw new Error('Must not create or promote'); } };
  assert.equal(await bootstrapAdmin(env, users), 'conflict');
});
