const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
const { normalizeMediaInput, normalizeMediaMetadata } = require('../../alpgozluk/v1/services/mediaService');

test('model görseli metadata alanları normalize edilir', () => {
  assert.deepEqual(normalizeMediaInput({
    entityType: 'PRODUCT',
    entityId: '12',
    altText: ' Prada gözlük ',
    mediaRole: 'ON_MODEL',
    modelName: ' Sueda ',
    isFeatured: 'true',
    sortOrder: '20',
  }), {
    entityType: 'product',
    entityId: 12,
    altText: 'Prada gözlük',
    mediaRole: 'on_model',
    modelName: 'Sueda',
    isFeatured: true,
    sortOrder: 20,
  });
});

test('galeri görselinde model adı ve bilinmeyen roller reddedilir', () => {
  assert.throws(() => normalizeMediaMetadata({ mediaRole: 'gallery', modelName: 'Sueda' }), /Geçersiz medya/);
  assert.throws(() => normalizeMediaMetadata({ mediaRole: 'hero' }), /Geçersiz medya/);
});

test('öne çıkan alanı yalnızca açık boolean değerlerini kabul eder', () => {
  assert.equal(normalizeMediaMetadata({ isFeatured: '1' }).isFeatured, true);
  assert.equal(normalizeMediaMetadata({ isFeatured: 'false' }).isFeatured, false);
  assert.throws(() => normalizeMediaMetadata({ isFeatured: 'yes' }), /Geçersiz medya/);
});
