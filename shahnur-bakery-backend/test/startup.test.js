const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateEnvironment, describeFailure } = require('../src/utils/startupDiagnostics');
const config = { JWT_SECRET: 'x'.repeat(48), MONGODB_URI: 'mongodb+srv://user:example@cluster.example/bakery' };

test('startup rejects missing secrets and unfilled Atlas placeholders before connecting', () => {
  assert.throws(() => validateEnvironment({ ...config, JWT_SECRET: '' }), /JWT_SECRET/);
  assert.throws(() => validateEnvironment({ ...config, MONGODB_URI: '' }), /MONGODB_URI/);
  assert.throws(() => validateEnvironment({ ...config, MONGODB_URI: 'mongodb+srv://user:<db_password>@cluster.example/bakery' }), /placeholders/);
  assert.throws(() => validateEnvironment({ ...config, TRUST_PROXY_HOPS: 'true' }), /TRUST_PROXY_HOPS/);
  assert.doesNotThrow(() => validateEnvironment({ ...config, TRUST_PROXY_HOPS: '1' }));
});

test('startup diagnostics classify connection failures without exposing credentials or records', () => {
  const secret = 'private-password-test';
  for (const error of [
    { code: 18, message: 'Authentication failed for ' + secret },
    { message: 'querySrv ENOTFOUND ' + secret },
    { name: 'MongooseServerSelectionError', message: secret },
    { code: 11000, message: 'Duplicate private customer value: ' + secret },
    { message: 'mongodb+srv://user:' + secret + '@example.com' },
  ]) {
    const output = describeFailure(error);
    assert.ok(!output.includes(secret));
    assert.ok(!output.includes('mongodb+srv://'));
  }
  assert.match(describeFailure({ code: 18 }), /MONGODB_AUTH/);
  assert.match(describeFailure({ name: 'MongooseServerSelectionError' }), /MONGODB_NETWORK/);
});
