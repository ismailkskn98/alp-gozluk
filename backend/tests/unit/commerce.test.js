const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateCouponDiscount,
  createGuestToken,
  fromMinorUnits,
  hashGuestToken,
  isValidGuestToken,
  toMinorUnits,
} = require('../../alpgozluk/v1/helpers/commerce');

test('misafir sepet tokenı 256-bit rastgele ve hashlenebilir biçimde üretilir', () => {
  const token = createGuestToken();
  const secondToken = createGuestToken();
  const hash = hashGuestToken(token);

  assert.equal(isValidGuestToken(token), true);
  assert.equal(token.length, 43);
  assert.notEqual(token, secondToken);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hashGuestToken(token), hash);
});

test('geçersiz misafir tokenları kabul edilmez', () => {
  assert.equal(isValidGuestToken('kisa'), false);
  assert.equal(isValidGuestToken('../'.repeat(15)), false);
  assert.equal(isValidGuestToken(null), false);
});

test('para hesapları kuruş cinsinden yuvarlama hatası üretmeden yapılır', () => {
  assert.equal(toMinorUnits('3490.50'), 349050);
  assert.equal(fromMinorUnits(349050), 3490.5);
  assert.equal(calculateCouponDiscount({ discount_type: 'percentage', discount_value: '15.00' }, 10000), 1500);
  assert.equal(calculateCouponDiscount({ discount_type: 'fixed', discount_value: '25.00' }, 1000), 1000);
});
