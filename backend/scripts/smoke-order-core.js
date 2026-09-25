const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createGuestToken, hashGuestToken } = require('../alpgozluk/v1/helpers/commerce');
const { createGuestOrderToken, hashOrderAccessToken } = require('../alpgozluk/v1/helpers/orderCore');
const { closeDatabase, getDb } = require('../alpgozluk/v1/models/db');
const cartService = require('../alpgozluk/v1/services/cartService');
const orderService = require('../alpgozluk/v1/services/orderService');

const database = getDb();
const guestToken = createGuestToken();
const guestTokenHash = hashGuestToken(guestToken);
const orderToken = createGuestOrderToken();
const orderTokenHash = hashOrderAccessToken(orderToken);
const guestTokenHashes = [guestTokenHash];
const orderTokenHashes = [orderTokenHash];
let variantId;
let originalStock;

const customer = {
  firstName: 'Smoke',
  lastName: 'Test',
  email: 'smoke-test@example.com',
  phone: '05555555555',
};
const address = {
  firstName: customer.firstName,
  lastName: customer.lastName,
  phone: customer.phone,
  countryCode: 'TR',
  city: 'Ankara',
  district: 'Çankaya',
  postalCode: '06800',
  addressLine: 'Smoke test için geçici ve temizlenen adres kaydı.',
};

const cleanup = async () => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const orderPlaceholders = orderTokenHashes.map(() => '?').join(', ');
    const [orders] = await connection.query(
      `SELECT id FROM orders WHERE guest_access_token_hash IN (${orderPlaceholders}) FOR UPDATE`,
      orderTokenHashes,
    );
    const orderIds = orders.map((order) => order.id);
    if (orderIds.length) {
      const placeholders = orderIds.map(() => '?').join(', ');
      await connection.query(
        `DELETE FROM inventory_movements WHERE reference_type = 'order' AND reference_id IN (${placeholders})`,
        orderIds,
      );
      await connection.query(`DELETE FROM orders WHERE id IN (${placeholders})`, orderIds);
    }
    const cartPlaceholders = guestTokenHashes.map(() => '?').join(', ');
    await connection.query(`DELETE FROM carts WHERE guest_token_hash IN (${cartPlaceholders})`, guestTokenHashes);
    if (variantId && Number.isInteger(originalStock)) {
      await connection.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [originalStock, variantId]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const run = async () => {
  const [[variant]] = await database.query(
    `SELECT pv.id, pv.stock_quantity
     FROM product_variants pv INNER JOIN products p ON p.id = pv.product_id
     WHERE p.status = 'published' AND pv.status = 'active' AND pv.stock_quantity >= 2
     ORDER BY pv.id LIMIT 1`,
  );
  assert.ok(variant, 'Smoke test için stoklu ürün bulunamadı. Önce demo katalog seed çalıştırılmalı.');
  variantId = Number(variant.id);
  originalStock = Number(variant.stock_quantity);
  const cartIdentity = { guestTokenHash };
  const orderIdentity = { cartTokenHash: guestTokenHash, orderTokenHash };

  let cart = await cartService.addItem(cartIdentity, { variantId, quantity: 1 }, 'tr');
  assert.equal(cart.items.length, 1);
  assert.ok(cart.items[0].image?.url);
  const cartItemId = cart.items[0].id;
  cart = await cartService.updateItem(cartIdentity, cartItemId, { quantity: 2 }, 'tr');
  assert.equal(cart.items[0].quantity, 2);
  cart = await cartService.updateSelection(cartIdentity, { itemIds: [cartItemId], selected: false }, 'tr');
  assert.equal(cart.items[0].selected, false);
  cart = await cartService.removeItem(cartIdentity, cartItemId, 'tr');
  assert.equal(cart.items.length, 0);
  await cartService.addItem(cartIdentity, { variantId, quantity: 1 }, 'tr');
  const firstKey = `smoke-cancel-${randomUUID()}`;
  const first = await orderService.prepareOrder({
    identity: orderIdentity, idempotencyKey: firstKey, customer,
    shippingAddress: address, billingAddress: address, notes: 'Otomatik smoke test', locale: 'tr',
  });
  assert.equal(first.reused, false);
  assert.match(first.order.orderNumber, /^AG-\d{2}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/);
  assert.equal(first.order.items.length, 1);
  assert.equal(first.order.items[0].quantity, 1);

  const repeated = await orderService.prepareOrder({
    identity: orderIdentity, idempotencyKey: firstKey, customer,
    shippingAddress: address, billingAddress: address, notes: 'Otomatik smoke test', locale: 'tr',
  });
  assert.equal(repeated.reused, true);
  assert.equal(repeated.order.orderNumber, first.order.orderNumber);
  const cancelled = await orderService.cancelOrder({
    orderNumber: first.order.orderNumber,
    identity: { orderTokenHash },
    reason: 'smoke_test_cancelled',
  });
  assert.equal(cancelled.order.status, 'cancelled');
  const cancelledAgain = await orderService.cancelOrder({
    orderNumber: first.order.orderNumber,
    identity: { orderTokenHash },
    reason: 'smoke_test_cancelled_again',
  });
  assert.equal(cancelledAgain.reused, true);
  const [[afterCancel]] = await database.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantId]);
  assert.equal(Number(afterCancel.stock_quantity), originalStock);

  const failedPreparation = await orderService.prepareOrder({
    identity: orderIdentity, idempotencyKey: `smoke-failed-${randomUUID()}`, customer,
    shippingAddress: address, billingAddress: address, notes: 'Otomatik smoke test', locale: 'tr',
  });
  const [[failedRow]] = await database.query(
    'SELECT id FROM orders WHERE order_number = ? LIMIT 1',
    [failedPreparation.order.orderNumber],
  );
  const failed = await orderService.failOrderPayment({ orderId: failedRow.id, reason: 'smoke_provider_declined' });
  assert.equal(failed.order.status, 'cancelled');
  assert.equal(failed.order.paymentStatus, 'failed');
  const failedAgain = await orderService.failOrderPayment({ orderId: failedRow.id, reason: 'smoke_provider_declined_again' });
  assert.equal(failedAgain.reused, true);
  const [[afterFailure]] = await database.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantId]);
  assert.equal(Number(afterFailure.stock_quantity), originalStock);

  const secondKey = `smoke-paid-${randomUUID()}`;
  const second = await orderService.prepareOrder({
    identity: orderIdentity, idempotencyKey: secondKey, customer,
    shippingAddress: address, billingAddress: address, notes: 'Otomatik smoke test', locale: 'tr',
  });
  const [[secondRow]] = await database.query('SELECT id FROM orders WHERE order_number = ? LIMIT 1', [second.order.orderNumber]);
  const paid = await orderService.commitPaidOrder({ orderId: secondRow.id });
  assert.equal(paid.order.status, 'processing');
  assert.equal(paid.order.paymentStatus, 'paid');
  const paidAgain = await orderService.commitPaidOrder({ orderId: secondRow.id });
  assert.equal(paidAgain.reused, true);

  const [[afterPayment]] = await database.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantId]);
  assert.equal(Number(afterPayment.stock_quantity), originalStock - 1);
  const [[cartCount]] = await database.query(
    `SELECT COUNT(*) AS count FROM cart_items ci INNER JOIN carts c ON c.id = ci.cart_id
     WHERE c.guest_token_hash = ?`,
    [guestTokenHash],
  );
  assert.equal(Number(cartCount.count), 0);

  await database.query('UPDATE product_variants SET stock_quantity = 1 WHERE id = ?', [variantId]);
  const contenders = Array.from({ length: 2 }, () => {
    const cartTokenHash = hashGuestToken(createGuestToken());
    const accessTokenHash = hashOrderAccessToken(createGuestOrderToken());
    guestTokenHashes.push(cartTokenHash);
    orderTokenHashes.push(accessTokenHash);
    return { cartTokenHash, accessTokenHash };
  });
  for (const contender of contenders) {
    await cartService.addItem({ guestTokenHash: contender.cartTokenHash }, { variantId, quantity: 1 }, 'tr');
  }
  const concurrentResults = await Promise.allSettled(contenders.map((contender) => (
    orderService.prepareOrder({
      identity: { cartTokenHash: contender.cartTokenHash, orderTokenHash: contender.accessTokenHash },
      idempotencyKey: `smoke-concurrent-${randomUUID()}`,
      customer,
      shippingAddress: address,
      billingAddress: address,
      notes: 'Eşzamanlı son ürün smoke testi',
      locale: 'tr',
    })
  )));
  const successfulCheckouts = concurrentResults.filter((result) => result.status === 'fulfilled');
  const rejectedCheckouts = concurrentResults.filter((result) => result.status === 'rejected');
  assert.equal(successfulCheckouts.length, 1);
  assert.equal(rejectedCheckouts.length, 1);
  assert.equal(
    rejectedCheckouts[0].reason.statusCode,
    409,
    `Beklenen stok çakışması yerine ${rejectedCheckouts[0].reason.code || 'unknown'}: ${rejectedCheckouts[0].reason.message}`,
  );
  const [[afterConcurrentCheckout]] = await database.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantId]);
  assert.equal(Number(afterConcurrentCheckout.stock_quantity), 0);

  process.stdout.write('DB smoke testi geçti: sepet, tek-seferlik rezervasyon/iade, ödeme kesinleştirme ve eşzamanlı son ürün koruması.\n');
};

run()
  .then(cleanup)
  .catch(async (error) => {
    try {
      await cleanup();
    } catch (cleanupError) {
      process.stderr.write(`Smoke test temizleme hatası: ${cleanupError.stack || cleanupError.message}\n`);
    }
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
