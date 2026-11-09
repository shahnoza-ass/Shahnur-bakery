const { test } = require('node:test');
const assert = require('node:assert/strict');
const { importInitialCatalog } = require('../src/services/initialCatalog');
const Product = require('../src/models/Product');
const catalog = require('../src/data/initial-catalog.json');

function fixture(count, completed = false) {
  let marker = completed ? { _id: 'initial-public-catalog-v1' } : null;
  const calls = { inserted: 0, transactions: 0 };
  const migrations = { findOne: async () => marker, insertOne: async document => { marker = document; } };
  const connection = { db: { collection: () => migrations }, transaction: async action => { calls.transactions++; await action({}); } };
  const products = { countDocuments: () => ({ session: async () => count }), insertMany: async items => { calls.inserted += items.length; } };
  return { connection, products, calls, marker: () => marker };
}

test('initial catalog contains valid products and no customer or order data', () => {
  assert.equal(catalog.length, 3);
  for (const item of catalog) {
    assert.equal(new Product(item).validateSync(), undefined);
    assert.equal(typeof item.ingredients, 'string');
    for (const field of ['ratings', 'reviews', 'user', 'email', 'phone', 'password', 'orders']) assert.equal(item[field], undefined);
  }
  assert.ok(catalog.some(p => p.customizable && p.customPricePerKg > 0));
});

test('empty production catalog is imported once and later deletions are preserved', async () => {
  const state = fixture(0);
  await importInitialCatalog(state.connection, state.products);
  assert.equal(state.calls.inserted, catalog.length);
  assert.equal(state.marker().imported, catalog.length);
  await importInitialCatalog(state.connection, state.products);
  assert.equal(state.calls.inserted, catalog.length);
  assert.equal(state.calls.transactions, 1);
});

test('an existing catalog and its stock are never overwritten by the import', async () => {
  const state = fixture(1);
  await importInitialCatalog(state.connection, state.products);
  assert.equal(state.calls.inserted, 0);
  assert.equal(state.marker().skippedExistingCatalog, true);
});
