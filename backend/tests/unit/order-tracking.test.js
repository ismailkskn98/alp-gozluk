const test = require('node:test');
const assert = require('node:assert/strict');
const { config } = require('../../alpgozluk/v1/config/env');
const {
  createOrderTrackingToken,
  maskEmail,
  verifyOrderTrackingToken,
} = require('../../alpgozluk/v1/helpers/orderTracking');

config.orderTracking.secret = 'unit-test-order-tracking-secret-32-bytes';
config.orderTracking.ttlDays = 30;

test('sipariş takip anahtarı sipariş ve e-posta ile imzalanır', () => {
  const now = Date.UTC(2026, 9, 1);
  const token = createOrderTrackingToken({
    orderNumber: 'AG-26-23456789AB',
    customerEmail: 'guest@example.com',
    now,
  });

  assert.equal(verifyOrderTrackingToken({
    token,
    orderNumber: 'AG-26-23456789AB',
    customerEmail: 'guest@example.com',
    now,
  }), true);
  assert.equal(verifyOrderTrackingToken({
    token,
    orderNumber: 'AG-26-23456789AC',
    customerEmail: 'guest@example.com',
    now,
  }), false);
});

test('süresi dolan veya değiştirilen takip anahtarı reddedilir', () => {
  const now = Date.UTC(2026, 9, 1);
  const token = createOrderTrackingToken({
    orderNumber: 'AG-26-23456789AB',
    customerEmail: 'guest@example.com',
    now,
  });

  assert.equal(verifyOrderTrackingToken({
    token,
    orderNumber: 'AG-26-23456789AB',
    customerEmail: 'guest@example.com',
    now: now + (31 * 24 * 60 * 60 * 1000),
  }), false);
  assert.equal(verifyOrderTrackingToken({
    token: `${token.slice(0, -1)}x`,
    orderNumber: 'AG-26-23456789AB',
    customerEmail: 'guest@example.com',
    now,
  }), false);
});

test('sonuç ekranı için e-posta adresi kısmi maskelenir', () => {
  assert.equal(maskEmail('guest@example.com'), 'gu***@example.com');
});
