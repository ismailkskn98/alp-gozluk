const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCatalogPayload } = require('../../alpgozluk/v1/helpers/catalogInput');
const { normalizeNavigationPayload } = require('../../alpgozluk/v1/helpers/navigationInput');
const { parseProductFilters, resolveAudienceCodes } = require('../../alpgozluk/v1/helpers/productFilters');

test('kadın ve erkek katalogları unisex hedef kitleyi de içerir', () => {
  assert.deepEqual(resolveAudienceCodes('women'), ['women', 'unisex']);
  assert.deepEqual(resolveAudienceCodes('men'), ['men', 'unisex']);
  assert.deepEqual(resolveAudienceCodes('kids'), ['kids']);
});

test('ürün filtreleri sayfalama, sıralama ve kod allowlist kurallarını uygular', () => {
  assert.equal(parseProductFilters({ audience: 'women', limit: '500' }), null);
  assert.equal(parseProductFilters({ sort: 'DROP TABLE products' }), null);
  assert.equal(parseProductFilters({ material: 'acetate,metal' }).material.length, 2);
});

test('katalog payload doğrulaması bilinmeyen kaynak ve geçersiz slug değerini reddeder', () => {
  assert.equal(normalizeCatalogPayload('unknown', {}), null);
  assert.equal(normalizeCatalogPayload('audiences', {
    code: 'women',
    status: 'active',
    sortOrder: 1,
    translations: [{ locale: 'tr', name: 'Kadın', slug: '../kadin' }],
  }), null);
  assert.equal(normalizeCatalogPayload('collections', {
    code: 'summer', status: 'active', sortOrder: 1, startsAt: 'not-a-date',
    translations: [{ locale: 'tr', name: 'Yaz', slug: 'yaz' }],
  }), null);
});

test('navigasyon payload doğrulaması eksik üst öğeyi ve harici URLyi reddeder', () => {
  assert.equal(normalizeNavigationPayload({ items: [{
    code: 'child', parentCode: 'missing', itemType: 'link', customUrl: '/shop', columnPosition: 1, sortOrder: 1,
    translations: [{ locale: 'tr', label: 'Alt bağlantı', href: '/shop' }],
  }] }), null);
  assert.equal(normalizeNavigationPayload({ items: [{
    code: 'external', itemType: 'link', customUrl: 'https://example.com', columnPosition: 1, sortOrder: 1,
    translations: [{ locale: 'tr', label: 'Harici bağlantı' }],
  }] }), null);
  assert.equal(normalizeNavigationPayload({ items: [
    { code: 'parent', parentCode: 'child', itemType: 'group', columnPosition: 1, sortOrder: 1, translations: [{ locale: 'tr', label: 'Üst grup' }] },
    { code: 'child', parentCode: 'parent', itemType: 'group', columnPosition: 1, sortOrder: 2, translations: [{ locale: 'tr', label: 'Alt grup' }] },
  ] }), null);
});
