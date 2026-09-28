const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidBinNumber,
  isValidInstallment,
  normalizeIdentityNumber,
  normalizePaymentCard,
  passesLuhn,
} = require('../../alpgozluk/v1/helpers/paymentInput');

test('sandbox test kartı boşluklardan arındırılıp normalize edilir', () => {
  const card = normalizePaymentCard({
    cardHolderName: '  Ada   Yılmaz ',
    cardNumber: '5526 0800 0000 0006',
    expireMonth: '12',
    expireYear: '30',
    cvc: '123',
  }, new Date('2026-09-25T12:00:00Z'));

  assert.deepEqual(card, {
    cardHolderName: 'Ada Yılmaz',
    cardNumber: '5526080000000006',
    expireMonth: '12',
    expireYear: '2030',
    cvc: '123',
    registerCard: 0,
  });
});

test('Luhn hatası, geçmiş tarih ve biçimsiz CVC reddedilir', () => {
  assert.equal(passesLuhn('5526080000000007'), false);
  assert.equal(normalizePaymentCard({
    cardHolderName: 'Ada Yılmaz',
    cardNumber: '5526080000000007',
    expireMonth: '12',
    expireYear: '2030',
    cvc: '123',
  }), null);
  assert.equal(normalizePaymentCard({
    cardHolderName: 'Ada Yılmaz',
    cardNumber: '5526080000000006',
    expireMonth: '01',
    expireYear: '2020',
    cvc: '12',
  }), null);
});

test('BIN, taksit ve kimlik girdileri allowlist ile doğrulanır', () => {
  assert.equal(isValidBinNumber('55260800'), true);
  assert.equal(isValidBinNumber('552608'), false);
  assert.equal(isValidInstallment(6), true);
  assert.equal(isValidInstallment(5), false);
  assert.equal(normalizeIdentityNumber('11111111111'), '11111111111');
  assert.equal(normalizeIdentityNumber('../kimlik'), null);
});
