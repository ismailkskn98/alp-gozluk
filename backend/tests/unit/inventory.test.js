const test = require('node:test');
const assert = require('node:assert/strict');
const { STOCK_STATUSES, getStockStatus } = require('../../alpgozluk/v1/helpers/inventory');

test('stok durumu sıfır, düşük stok eşiği ve normal stok için doğru hesaplanır', () => {
  assert.equal(getStockStatus(0, 5), STOCK_STATUSES.OUT_OF_STOCK);
  assert.equal(getStockStatus(5, 5), STOCK_STATUSES.LOW_STOCK);
  assert.equal(getStockStatus(6, 5), STOCK_STATUSES.IN_STOCK);
});

test('her varyantın stok durumu kendi miktarı ve eşiğinden bağımsız hesaplanır', () => {
  const blackVariant = getStockStatus(0, 3);
  const tortoiseVariant = getStockStatus(8, 3);

  assert.equal(blackVariant, STOCK_STATUSES.OUT_OF_STOCK);
  assert.equal(tortoiseVariant, STOCK_STATUSES.IN_STOCK);
});

test('negatif veya biçimsiz stok public durumda satın alınamaz kabul edilir', () => {
  assert.equal(getStockStatus(-4, 5), STOCK_STATUSES.OUT_OF_STOCK);
  assert.equal(getStockStatus('geçersiz', 5), STOCK_STATUSES.OUT_OF_STOCK);
});
