process.env.NODE_ENV = 'development';
process.env.IYZICO_ENABLED = 'true';
process.env.IYZICO_ENVIRONMENT = 'sandbox';
process.env.IYZICO_API_KEY = 'smoke-api-key';
process.env.IYZICO_SECRET_KEY = 'smoke-secret-key';
process.env.PAYMENT_ARTIFACT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createGuestToken, hashGuestToken } = require('../alpgozluk/v1/helpers/commerce');
const { createGuestOrderToken, hashOrderAccessToken } = require('../alpgozluk/v1/helpers/orderCore');
const { createResponseSignature } = require('../alpgozluk/v1/helpers/iyzicoSignature');
const { closeDatabase, getDb } = require('../alpgozluk/v1/models/db');
const cartService = require('../alpgozluk/v1/services/cartService');
const orderService = require('../alpgozluk/v1/services/orderService');
const paymentService = require('../alpgozluk/v1/services/iyzicoPaymentService');

const database = getDb();
const secretKey = process.env.IYZICO_SECRET_KEY;
const guestTokenHashes = [];
const orderTokenHashes = [];
let variantId;
let originalStock;
let paymentSequence = 1000;
let authorizeCount = 0;
const initRequests = new Map();
const artifacts = new Map();

const customer = {
  firstName: 'Payment', lastName: 'Smoke', email: 'payment-smoke@example.com', phone: '05555555555',
};
const address = {
  firstName: customer.firstName,
  lastName: customer.lastName,
  phone: customer.phone,
  countryCode: 'TR',
  city: 'Ankara',
  district: 'Çankaya',
  postalCode: '06800',
  addressLine: 'iyzico ödeme smoke testi için geçici adres.',
};

const fakeArtifactService = {
  async storeArtifact(publicId, content) {
    artifacts.set(publicId, content);
    return `proof-${publicId}`;
  },
  async artifactExists(publicId) {
    return artifacts.has(publicId);
  },
  createProof(publicId) {
    return `proof-${publicId}`;
  },
};

const fakeClient = {
  async retrieveInstallments(payload) {
    return {
      status: 'success',
      conversationId: payload.conversationId,
      installmentDetails: [{
        cardType: 'CREDIT_CARD',
        cardAssociation: 'MASTER_CARD',
        cardFamilyName: 'World',
        bankName: 'Smoke Bank',
        installmentPrices: [{
          installmentNumber: 1,
          installmentPrice: Number(payload.price),
          totalPrice: Number(payload.price),
        }],
      }],
    };
  },
  async initializeThreeDs(payload) {
    paymentSequence += 1;
    const paymentId = String(paymentSequence);
    initRequests.set(payload.conversationId, { ...payload, paymentId });
    return {
      status: 'success',
      conversationId: payload.conversationId,
      paymentId,
      threeDSHtmlContent: Buffer.from('<html><form action="https://sandbox-api.iyzipay.com"></form></html>').toString('base64'),
      signature: createResponseSignature([paymentId, payload.conversationId], secretKey),
    };
  },
  async authorizeThreeDs(payload) {
    authorizeCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    const initialized = initRequests.get(payload.conversationId);
    const response = {
      status: 'success',
      paymentStatus: 'SUCCESS',
      paymentId: payload.paymentId,
      currency: payload.currency,
      basketId: payload.basketId,
      conversationId: payload.conversationId,
      paidPrice: payload.paidPrice,
      price: initialized.price,
      installment: initialized.installment,
      fraudStatus: 1,
      mdStatus: 1,
      cardType: 'CREDIT_CARD',
      cardAssociation: 'MASTER_CARD',
      cardFamily: 'World',
      binNumber: '55260800',
      lastFourDigits: '0006',
      itemTransactions: initialized.basketItems.map((item, index) => ({
        itemId: item.id,
        paymentTransactionId: `SMOKE-TX-${payload.paymentId}-${index}`,
        transactionStatus: 2,
        price: item.price,
        paidPrice: item.price,
      })),
    };
    response.signature = createResponseSignature([
      response.paymentId,
      response.currency,
      response.basketId,
      response.conversationId,
      String(Number(response.paidPrice)),
      String(Number(response.price)),
    ], secretKey);
    return response;
  },
};

const cleanup = async () => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    if (orderTokenHashes.length) {
      const placeholders = orderTokenHashes.map(() => '?').join(', ');
      const [orders] = await connection.query(
        `SELECT id FROM orders WHERE guest_access_token_hash IN (${placeholders}) FOR UPDATE`,
        orderTokenHashes,
      );
      const orderIds = orders.map((order) => order.id);
      if (orderIds.length) {
        const orderPlaceholders = orderIds.map(() => '?').join(', ');
        const [payments] = await connection.query(
          `SELECT id FROM payments WHERE order_id IN (${orderPlaceholders})`,
          orderIds,
        );
        const paymentIds = payments.map((payment) => payment.id);
        if (paymentIds.length) {
          const paymentPlaceholders = paymentIds.map(() => '?').join(', ');
          await connection.query(
            `DELETE FROM payment_webhook_events WHERE payment_id IN (${paymentPlaceholders})`,
            paymentIds,
          );
        }
        await connection.query(`DELETE FROM payments WHERE order_id IN (${orderPlaceholders})`, orderIds);
        await connection.query(
          `DELETE FROM inventory_movements WHERE reference_type = 'order' AND reference_id IN (${orderPlaceholders})`,
          orderIds,
        );
        await connection.query(`DELETE FROM orders WHERE id IN (${orderPlaceholders})`, orderIds);
      }
    }
    if (guestTokenHashes.length) {
      const placeholders = guestTokenHashes.map(() => '?').join(', ');
      await connection.query(`DELETE FROM carts WHERE guest_token_hash IN (${placeholders})`, guestTokenHashes);
    }
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

const preparePaymentOrder = async () => {
  const guestTokenHash = hashGuestToken(createGuestToken());
  const orderTokenHash = hashOrderAccessToken(createGuestOrderToken());
  guestTokenHashes.push(guestTokenHash);
  orderTokenHashes.push(orderTokenHash);
  await cartService.addItem({ guestTokenHash }, { variantId, quantity: 1 }, 'tr');
  const prepared = await orderService.prepareOrder({
    identity: { cartTokenHash: guestTokenHash, orderTokenHash },
    idempotencyKey: `smoke-order-${randomUUID()}`,
    customer,
    shippingAddress: address,
    billingAddress: address,
    notes: 'iyzico ödeme smoke testi',
    locale: 'tr',
  });
  return { order: prepared.order, identity: { orderTokenHash } };
};

const initializePayment = async ({ order, identity }) => paymentService.initializeThreeDs({
  orderNumber: order.orderNumber,
  identity,
  idempotencyKey: `smoke-payment-${randomUUID()}`,
  card: {
    cardHolderName: 'Payment Smoke',
    cardNumber: '5526080000000006',
    expireMonth: '12',
    expireYear: '2030',
    cvc: '123',
    registerCard: 0,
  },
  installment: 1,
  identityNumber: '11111111111',
  locale: 'tr',
  ipAddress: '127.0.0.1',
}, { database, client: fakeClient, artifactService: fakeArtifactService });

const callbackFor = async (paymentAttemptId, mdStatus = '1') => {
  const [[attempt]] = await database.query(
    `SELECT provider_payment_id, provider_conversation_id FROM payments WHERE public_id = ? LIMIT 1`,
    [paymentAttemptId],
  );
  const payload = {
    conversationData: 'smoke-conversation-data',
    conversationId: attempt.provider_conversation_id,
    mdStatus,
    paymentId: attempt.provider_payment_id,
    status: 'success',
  };
  payload.signature = createResponseSignature([
    payload.conversationData,
    payload.conversationId,
    payload.mdStatus,
    payload.paymentId,
    payload.status,
  ], secretKey);
  return paymentService.handleThreeDsCallback(payload, { database, client: fakeClient });
};

const run = async () => {
  const [[variant]] = await database.query(
    `SELECT pv.id, pv.stock_quantity FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     WHERE p.status = 'published' AND pv.status = 'active' AND pv.stock_quantity >= 2
     ORDER BY pv.id LIMIT 1`,
  );
  assert.ok(variant, 'Smoke test için en az iki stoklu aktif varyant gerekiyor.');
  variantId = Number(variant.id);
  originalStock = Number(variant.stock_quantity);

  const paidOrder = await preparePaymentOrder();
  const initialized = await initializePayment(paidOrder);
  assert.equal(initialized.status, 'pending');
  assert.ok(initialized.threeDsPageUrl);

  const [[storedAttempt]] = await database.query('SELECT * FROM payments WHERE public_id = ?', [initialized.paymentAttemptId]);
  const storedJson = JSON.stringify(storedAttempt);
  assert.equal(storedJson.includes('5526080000000006'), false);
  assert.equal(storedJson.includes('Payment Smoke'), false);
  assert.equal(storedJson.includes('"cvc"'), false);

  const concurrentCallbacks = await Promise.all([
    callbackFor(initialized.paymentAttemptId),
    callbackFor(initialized.paymentAttemptId),
  ]);
  assert.deepEqual(
    concurrentCallbacks.map((result) => result.status).sort(),
    ['paid', 'pending'],
  );
  const paidAgain = await callbackFor(initialized.paymentAttemptId);
  assert.equal(paidAgain.status, 'paid');
  assert.equal(paidAgain.reused, true);
  assert.equal(authorizeCount, 1);

  const failedOrder = await preparePaymentOrder();
  const failedInitialized = await initializePayment(failedOrder);
  const failed = await callbackFor(failedInitialized.paymentAttemptId, '0');
  assert.equal(failed.status, 'failed');
  const failedSnapshot = await orderService.getOrder({
    orderNumber: failedOrder.order.orderNumber,
    identity: failedOrder.identity,
  });
  assert.equal(failedSnapshot.status, 'cancelled');
  assert.equal(failedSnapshot.paymentStatus, 'failed');

  const [[stock]] = await database.query('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantId]);
  assert.equal(Number(stock.stock_quantity), originalStock - 1);

  process.stdout.write('iyzico DB smoke testi geçti: Init 3DS, imza, çift callback idempotency ve başarısız 3DS stok iadesi.\n');
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
