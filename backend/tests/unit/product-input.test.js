const test = require('node:test');
const assert = require('node:assert/strict');
const { validProductPayload } = require('../../alpgozluk/v1/helpers/productInput');

const payload = () => ({
  code: 'PR17WS',
  brand: 'Prada',
  brandId: 1,
  status: 'published',
  featured: false,
  taxRate: 20,
  originCountryCode: 'IT',
  translations: [
    { locale: 'tr', name: 'Prada PR17WS', slug: 'prada-pr17ws' },
    { locale: 'en', name: 'Prada PR17WS', slug: 'prada-pr17ws-en' },
  ],
  audienceIds: [1],
  categoryIds: [2],
  collectionIds: [],
  productAttributeValueIds: [],
  variants: [{
    sku: 'PR17WS-BLK',
    price: 10000,
    stockQuantity: 2,
    lowStockThreshold: 1,
    attributeValueIds: [],
  }],
});

test('ürün oluşturma payloadı geçerli alanlarla kabul edilir', () => {
  assert.equal(validProductPayload(payload()), true);
});

test('varyant kimliği yalnız güncelleme akışında kabul edilir', () => {
  const input = payload();
  input.variants[0].id = 42;
  assert.equal(validProductPayload(input), false);
  assert.equal(validProductPayload(input, { allowVariantIds: true }), true);
});

test('tekrarlanan varyant kimliği ve biçimsiz çeviri reddedilir', () => {
  const repeated = payload();
  repeated.variants.push({ ...repeated.variants[0], id: 5, sku: 'SECOND' });
  repeated.variants[0].id = 5;
  assert.equal(validProductPayload(repeated, { allowVariantIds: true }), false);

  const invalidTranslation = payload();
  invalidTranslation.translations[0].slug = '../urun';
  assert.equal(validProductPayload(invalidTranslation), false);
});
