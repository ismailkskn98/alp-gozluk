const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  allocateDiscountMinor,
  calculateIncludedTaxMinor,
  canTransitionOrder,
  canTransitionPayment,
  createGuestOrderToken,
  createOrderNumber,
  hashOrderAccessToken,
  isValidOrderAccessToken,
  isValidOrderNumber,
} = require('../../alpgozluk/v1/helpers/orderCore');
const { buildCheckoutTotals } = require('../../alpgozluk/v1/services/orderService');

test('dış sipariş numarası yıl ve tahmin edilmesi zor alfanümerik bölüm içerir', () => {
  const orderNumber = createOrderNumber(
    new Date('2026-09-25T12:00:00.000Z'),
    () => Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  );

  assert.equal(orderNumber, 'AG-26-23456789AB');
  assert.equal(isValidOrderNumber(orderNumber), true);
  assert.equal(isValidOrderNumber('AG-26-000001'), false);
});

test('misafir sipariş erişim anahtarı yalnızca hashlenmiş biçimde saklanabilir', () => {
  const token = createGuestOrderToken();
  const hash = hashOrderAccessToken(token);

  assert.equal(isValidOrderAccessToken(token), true);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hashOrderAccessToken(token), hash);
});

test('sipariş ve ödeme durumları yalnızca tanımlı yönde ilerler', () => {
  assert.equal(canTransitionOrder(ORDER_STATUSES.PENDING_PAYMENT, ORDER_STATUSES.PROCESSING), true);
  assert.equal(canTransitionOrder(ORDER_STATUSES.PROCESSING, ORDER_STATUSES.PENDING_PAYMENT), false);
  assert.equal(canTransitionOrder(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED), false);
  assert.equal(canTransitionPayment(PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID), true);
  assert.equal(canTransitionPayment(PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.FAILED), false);
  assert.equal(canTransitionPayment(PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.PARTIALLY_REFUNDED), true);
});

test('kupon indirimi satırlara kuruş kaybetmeden dağıtılır', () => {
  const allocations = allocateDiscountMinor([10000, 5000, 2500], 2625);

  assert.deepEqual(allocations, [1500, 750, 375]);
  assert.equal(allocations.reduce((total, amount) => total + amount, 0), 2625);
  assert.deepEqual(allocateDiscountMinor([1, 1, 1], 2), [1, 1, 0]);
});

test('checkout toplamları backend fiyatı ve geçerli kupon üzerinden hesaplanır', () => {
  const totals = buildCheckoutTotals({
    coupon_id: 5,
    coupon_code: 'ALP10',
    coupon_active: 1,
    discount_type: 'percentage',
    discount_value: '10.00',
    minimum_order_amount: '100.00',
  }, [
    { price: '1200.00', quantity: 1, tax_rate: '20.00' },
    { price: '800.00', quantity: 2, tax_rate: '20.00' },
  ]);

  assert.equal(totals.subtotalMinor, 280000);
  assert.equal(totals.discountMinor, 28000);
  assert.equal(totals.totalMinor, 252000);
  assert.equal(totals.lineDiscounts.reduce((total, amount) => total + amount, 0), 28000);
  assert.equal(totals.taxMinor, calculateIncludedTaxMinor(252000, 20));
});
