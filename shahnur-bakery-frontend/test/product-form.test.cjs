const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/productForm.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const validate = exportsObject.validateProductForm;
const valid = { name: 'Tort', description: 'Qulupnayli tort', price: '100000', discountPrice: '', stock: '0', weight: '', lowStockThreshold: '5', customizable: false, customPricePerKg: '' };

test('a product may be out of stock and omit optional weight and discount', () => {
  assert.equal(validate(valid), null);
  assert.equal(validate({ ...valid, stock: '3', weight: '1.5', discountPrice: '80000' }), null);
});

test('invalid names, prices, quantities and discounts are caught before photo upload', () => {
  for (const patch of [
    { name: '   ' }, { description: '\n ' },
    ...['', ' ', '0', '-1', 'NaN', 'Infinity', '1.5', '9007199254740992'].map(price => ({ price })),
    ...['', ' ', '-1', '1.5', 'NaN'].map(stock => ({ stock })),
    ...['', '-1', '2.5', 'NaN'].map(lowStockThreshold => ({ lowStockThreshold })),
    ...['100000', '120000', '0', '-1', 'Infinity'].map(discountPrice => ({ discountPrice })),
    { weight: '-1' }, { weight: 'Infinity' }, { customizable: true, customPricePerKg: '' },
    { customizable: true, customPricePerKg: '0' },
  ]) assert.equal(typeof validate({ ...valid, ...patch }), 'string', JSON.stringify(patch));
  assert.equal(validate({ ...valid, customizable: true, customPricePerKg: '150000' }), null);
});
