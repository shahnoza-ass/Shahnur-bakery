const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'test-only-secret-for-isolated-regression-tests';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Chat = require('../src/models/Chat');
const workflow = require('../src/services/orderWorkflow');
const chatWorkflow = require('../src/services/chatWorkflow');
const uid = '111111111111111111111111';
const pid = '222222222222222222222222';
const oid = '333333333333333333333333';
const validOrder = () => ({ items: [{ product: pid, quantity: 2 }], deliveryAddress: { street: 'Test street', city: 'Buxoro' }, deliveryDate: new Date(Date.now() + 86400000).toISOString(), deliveryTime: '12:00', paymentMethod: 'cash' });

test('saving unchanged passwords preserves the hash and calls next once', async () => {
  const hash = await bcrypt.hash('test-password', 4);
  const hook = User.schema.s.hooks._pres.get('save').find(h => h.fn.toString().includes('bcrypt.genSalt')).fn;
  const user = { password: hash, isModified: () => false };
  let calls = 0;
  await hook.call(user, () => calls++);
  assert.equal(calls, 1);
  assert.equal(user.password, hash);
  assert.equal(await bcrypt.compare('test-password', user.password), true);
});

test('new passwords are hashed exactly once', async () => {
  const hook = User.schema.s.hooks._pres.get('save').find(h => h.fn.toString().includes('bcrypt.genSalt')).fn;
  const user = { password: 'test-password', isModified: () => true };
  let calls = 0;
  await hook.call(user, () => calls++);
  assert.equal(calls, 1);
  assert.equal(await bcrypt.compare('test-password', user.password), true);
});

test('order validation rejects fake IDs, invalid quantities, dates, discounts and unconfigured payments', () => {
  for (const quantity of [0, -1, 1.5, '2', null, 1001]) {
    const data = validOrder(); data.items[0].quantity = quantity;
    assert.throws(() => workflow.validateOrder(data), { status: 400 });
  }
  for (const overrides of [{ discount: 1000000 }, { paymentMethod: 'payme' }, { deliveryTime: '25:00' }, { deliveryDate: 'invalid' }, { deliveryDate: '2020-01-01' }, { items: [{ product: '1', quantity: 1 }] }, { items: [] }]) {
    assert.throws(() => workflow.validateOrder({ ...validOrder(), ...overrides }), { status: 400 });
  }
  const data = validOrder(); data.items.push({ product: pid, quantity: 3 });
  assert.equal(workflow.validateOrder(data).items.get(pid), 5);
});

test('order creation uses conditional stock reservation and authoritative prices', async t => {
  t.mock.method(Order, 'countDocuments', () => ({ session: async () => 0 }));
  t.mock.method(require('../src/models/Commerce').Slot, 'updateOne', async () => ({ modifiedCount: 1 }));
  const session = {};
  let transactionCalls = 0;
  t.mock.method(mongoose.connection, 'transaction', async fn => { transactionCalls++; return fn(session); });
  t.mock.method(Product, 'findOneAndUpdate', async (query, update, options) => {
    assert.equal(query.stock.$gte, 2);
    assert.equal(query.isAvailable, true);
    assert.deepEqual(update.$inc, { stock: -2, soldCount: 2 });
    assert.equal(options.session, session);
    return { _id: pid, name: 'Cake', price: 150000 };
  });
  t.mock.method(Order, 'create', async (orders, options) => {
    assert.equal(options.session, session);
    assert.equal(orders[0].finalAmount, 300000);
    assert.equal(orders[0].items[0].price, 150000);
    assert.equal(orders[0].discount, 0);
    return orders;
  });
  const order = await workflow.createOrder({ ...validOrder(), totalAmount: 1 }, uid);
  assert.equal(order.finalAmount, 300000);
  assert.equal(transactionCalls, 1);
});

test('insufficient stock aborts before order creation', async t => {
  t.mock.method(mongoose.connection, 'transaction', async fn => fn({}));
  t.mock.method(Product, 'findOneAndUpdate', async () => null);
  const create = t.mock.method(Order, 'create', async () => { throw new Error('must not create'); });
  await assert.rejects(workflow.createOrder(validOrder(), uid), { status: 409 });
  assert.equal(create.mock.callCount(), 0);
});

test('retries with the same checkout key reuse the order without reserving stock again', async t => {
  const existing = { _id: oid, finalAmount: 300000 };
  t.mock.method(mongoose.connection, 'transaction', async fn => fn({}));
  t.mock.method(Order, 'findOne', () => ({ session: async () => existing }));
  const reserve = t.mock.method(Product, 'findOneAndUpdate', async () => { throw new Error('must not reserve'); });
  const result = await workflow.createOrder({ ...validOrder(), idempotencyKey: 'a-valid-checkout-key-1234' }, uid);
  assert.equal(result, existing);
  assert.equal(reserve.mock.callCount(), 0);
});

test('cancellation restores stock once and repeated cancellation is idempotent', async t => {
  const order = { user: new mongoose.Types.ObjectId(uid), status: 'confirmed', items: [{ product: pid, quantity: 2 }], statusHistory: [], save: async () => {} };
  t.mock.method(mongoose.connection, 'transaction', async fn => fn({}));
  t.mock.method(Order, 'findById', () => ({ session: async () => order }));
  const update = t.mock.method(Product, 'updateOne', async (_query, update) => { assert.deepEqual(update.$inc, { stock: 2, soldCount: -2 }); });
  await workflow.changeOrder(oid, { status: 'cancelled' }, { id: uid, role: 'user' });
  assert.equal(order.status, 'cancelled');
  await workflow.changeOrder(oid, { status: 'cancelled' }, { id: uid, role: 'user' });
  assert.equal(update.mock.callCount(), 1);
});

test('orders enforce ownership, terminal states and bounded discounts', async t => {
  const order = { user: new mongoose.Types.ObjectId(uid), status: 'delivered', totalAmount: 100, items: [], statusHistory: [], save: async () => {} };
  t.mock.method(mongoose.connection, 'transaction', async fn => fn({}));
  t.mock.method(Order, 'findById', () => ({ session: async () => order }));
  await assert.rejects(workflow.changeOrder(oid, { status: 'cancelled' }, { id: pid, role: 'user' }), { status: 403 });
  await assert.rejects(workflow.changeOrder(oid, { status: 'pending' }, { id: uid, role: 'admin' }), { status: 409 });
  await assert.rejects(workflow.changeOrder(oid, { discount: 101 }, { id: uid, role: 'admin' }), { status: 400 });
});

test('chat rejects nonparticipants and invalid message content', async t => {
  t.mock.method(Chat, 'findOne', () => ({ select: async () => null }));
  await assert.rejects(chatWorkflow.sendMessage(oid, uid, 'Hello'), { status: 403 });
  for (const content of ['', ' ', null, 'x'.repeat(2001)]) await assert.rejects(chatWorkflow.sendMessage(oid, uid, content), { status: 400 });
});

test('chat persists messages atomically and emits only to participant rooms', async t => {
  t.mock.method(Chat, 'findOne', () => ({ select: async () => ({ participants: [uid, pid] }) }));
  let persisted;
  t.mock.method(Chat, 'updateOne', async (query, update) => {
    assert.equal(query.participants, uid); assert.equal(query.isActive, true);
    persisted = update.$push.messages;
    assert.equal(update.$inc['unreadCount.' + pid], 1);
    return { modifiedCount: 1 };
  });
  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: uid, firstName: 'Test' }) }));
  const rooms = [];
  const io = { to: room => { rooms.push(room); return { emit: (event, data) => { assert.equal(event, 'new_message'); assert.equal(String(data.message._id), String(persisted._id)); } }; } };
  await chatWorkflow.sendMessage(oid, uid, ' Hello ', io);
  assert.equal(persisted.content, 'Hello');
  assert.deepEqual(rooms, ['user_' + uid, 'user_' + pid]);
});

test('ordinary admins cannot grant roles or edit superadmins', async t => {
  const { updateUser } = require('../src/controllers/adminController');
  const save = t.mock.fn();
  t.mock.method(User, 'findById', async () => ({ role: 'user', save }));
  let status;
  const res = { status: value => { status = value; return res; }, json: value => value };
  await updateUser({ body: { role: 'superadmin' }, user: { id: uid, role: 'admin' }, params: { id: pid } }, res);
  assert.equal(status, 403); assert.equal(save.mock.callCount(), 0);
});

test('password changes invalidate previously issued authentication tokens', async t => {
  const jwt = require('jsonwebtoken');
  const { protect } = require('../src/middleware/auth');
  const token = jwt.sign({ id: uid, version: 0 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  t.mock.method(User, 'findById', () => ({ select: async () => ({ id: uid, tokenVersion: 1, isActive: true, status: 'approved' }) }));
  let status;
  const res = { status: value => { status = value; return res; }, json: value => value };
  const next = t.mock.fn();
  await protect({ headers: { authorization: 'Bearer ' + token } }, res, next);
  assert.equal(status, 401);
  assert.equal(next.mock.callCount(), 0);
});

test('unconfigured electronic payments never report success', async () => {
  const PaymentService = require('../src/services/paymentService');
  assert.equal((await PaymentService.processPaymePayment()).success, false);
  assert.equal((await PaymentService.verifyPayment()).success, false);
});
