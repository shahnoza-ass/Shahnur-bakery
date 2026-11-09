const { test } = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../src/services/commercePolicy');
const payments = require('../src/services/payments');
test('cake quote validates choices and never trusts client prices', () => {
  const config = policy.customization({ weight: 2, flavor: 'chocolate', cream: 'cheese', decoration: 'berries', inscription: '  Happy birthday  ', price: 1 });
  assert.equal(config.inscription, 'Happy birthday');
  assert.equal(policy.cakePrice({ customizable: true, customPricePerKg: 150000 }, config), 405000);
  assert.equal(config.price, undefined);
  for (const change of [{ weight: -1 }, { weight: '2' }, { flavor: '__proto__' }, { inscription: 'x'.repeat(61) }]) assert.throws(() => policy.customization({ ...config, ...change }), { status: 400 });
  assert.throws(() => policy.cakePrice({ customizable: false }, config), { status: 409 });
});
test('delivery slots obey Uzbekistan time and a two-hour lead', () => {
  const now = Date.parse('2026-11-10T08:30:00+05:00');
  const slots = policy.slotsFor('2026-11-10', now);
  assert.equal(slots[0], '11:00'); assert.equal(slots.at(-1), '20:00');
  assert.throws(() => policy.dateKey('2026-02-30'), { status: 400 });
  assert.throws(() => policy.slotsFor('2027-11-10', now), { status: 400 });
});
test('gift recipient validation rejects partial or oversized requests', () => {
  assert.equal(policy.gift({ enabled: false }), undefined);
  assert.throws(() => policy.gift({ enabled: true, recipient: 'Test' }), { status: 400 });
  assert.equal(policy.gift({ enabled: true, recipient: 'Test', phone: '+998901234567', message: '', packaging: 'ribbon' }).packaging, 'ribbon');
});
test('unconfigured payments and invalid webhook signatures fail closed', async () => {
  const result = await payments.payme({ method: 'PerformTransaction', params: { id: 'fake' } }, 'Basic fake');
  assert.equal(result.error.code, -32504);
  assert.equal((await payments.click({ sign_string: 'fake' }, 1)).error, -1);
  assert.equal(payments.safeEqual('same', 'same'), true);
  assert.equal(payments.safeEqual('same', 'different'), false);
});
