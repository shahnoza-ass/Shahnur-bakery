const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function service(api) {
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/authService.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => ({ default: api }) });
  return exports.authService;
}
test('login adapts the actual flat backend payload to the authentication context', async () => {
  const api = { post: async (url, credentials) => {
    assert.equal(url, '/auth/login'); assert.equal(credentials.email, 'test@example.com');
    return { data: { data: { _id: 'user-id', firstName: 'Test', role: 'user', token: 'jwt-token' } } };
  } };
  const result = await service(api).login('test@example.com', 'test-password');
  assert.equal(result.user.firstName, 'Test');
  assert.equal(result.user._id, 'user-id');
  assert.equal(result.token, 'jwt-token');
  assert.equal(result.user.token, undefined);
});
test('login failures propagate instead of creating a fake authenticated user', async () => {
  const api = { post: async () => { throw new Error('Unauthorized'); } };
  await assert.rejects(service(api).login('test@example.com', 'wrong'), /Unauthorized/);
});
