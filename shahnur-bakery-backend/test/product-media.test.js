const { test } = require('node:test');
const assert = require('node:assert/strict');
const { imageType } = require('../src/services/productMedia');
const validate = require('../src/middleware/validateProduct');
test('product images are recognized by content; SVG and renamed executables are rejected', () => {
  assert.equal(imageType(Buffer.from([255, 216, 255, 0])), 'image/jpeg');
  assert.equal(imageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(imageType(Buffer.from('RIFF0000WEBP')), 'image/webp');
  assert.equal(imageType(Buffer.from('GIF89a')), 'image/gif');
  assert.equal(imageType(Buffer.from('<svg onload="alert(1)"></svg>')), null);
  assert.equal(imageType(Buffer.from('MZ-not-an-image.jpg')), null);
});
test('admin product validation rejects unsafe images, invalid prices and fractional stock', () => {
  const run = body => { let status = 200; validate({ body }, { status: n => { status = n; return { json: () => {} }; } }, () => {}); return status; };
  assert.equal(run({ stock: 1.5 }), 400);
  assert.equal(run({ price: -1 }), 400);
  assert.equal(run({ price: 100, discountPrice: 200 }), 400);
  assert.equal(run({ images: [{ url: 'javascript:alert(1)' }] }), 400);
  assert.equal(run({ images: Array.from({ length: 6 }, () => ({ url: 'https://example.com/a.jpg' })) }), 400);
  assert.equal(run({ price: 100, stock: 2, discountPrice: null, isAvailable: false, images: [{ url: '/api/media/123456789012345678901234' }] }), 200);
});
