const { randomUUID } = require('node:crypto');
const { toMinorUnits } = require('../helpers/commerce');
const {
  PAYMENT_SOURCE,
  PROVIDER,
  money,
  ownsOrder,
  paymentError,
  validProviderItemTransaction,
} = require('../helpers/iyzicoPaymentSupport');

const loadOrderContext = async (database, orderNumber, identity, { lock = false } = {}) => {
  const [orderRows] = await database.query(
    `SELECT id, order_number, user_id, guest_access_token_hash, status, payment_status,
       currency, shipping_amount, total_amount, customer_first_name, customer_last_name, customer_email,
       customer_phone, reservation_expires_at, created_at
     FROM orders WHERE order_number = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [orderNumber],
  );
  const order = orderRows[0];
  if (!order || !ownsOrder(order, identity)) {
    throw paymentError(404, 'Sipariş bulunamadı.', 'order_not_found');
  }
  if (order.status !== 'pending_payment' || order.payment_status !== 'pending') {
    throw paymentError(409, 'Sipariş ödeme için uygun durumda değil.', 'order_not_payable');
  }
  if (!order.reservation_expires_at || new Date(order.reservation_expires_at).getTime() <= Date.now()) {
    throw paymentError(409, 'Siparişin stok ayırma süresi dolmuş.', 'reservation_expired');
  }
  if (toMinorUnits(order.total_amount) <= 0) {
    throw paymentError(409, 'Bu sipariş kartla ödeme için uygun değil.', 'order_amount_invalid');
  }

  const [addressRows] = await database.query(
    `SELECT address_type, first_name, last_name, phone, country_code, city, district,
       neighborhood, postal_code, address_line
     FROM order_addresses WHERE order_id = ? ORDER BY id`,
    [order.id],
  );
  const [itemRows] = await database.query(
    `SELECT id, product_name, sku, quantity, total_amount
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [order.id],
  );
  const shippingAddress = addressRows.find((address) => address.address_type === 'shipping');
  const billingAddress = addressRows.find((address) => address.address_type === 'billing');
  if (!shippingAddress || !billingAddress || itemRows.length === 0) {
    throw paymentError(409, 'Sipariş ödeme bilgileri eksik.', 'order_snapshot_incomplete');
  }
  return { ...order, shippingAddress, billingAddress, items: itemRows };
};

const loadAttemptByIdempotency = async (database, idempotencyKey) => {
  const [rows] = await database.query(
    `SELECT p.*, o.order_number, o.user_id, o.guest_access_token_hash,
       o.status AS order_status, o.payment_status AS order_payment_status
     FROM payments p INNER JOIN orders o ON o.id = p.order_id
     WHERE p.idempotency_key = ? LIMIT 1`,
    [idempotencyKey],
  );
  return rows[0] || null;
};

const createAttempt = async ({ order, identity, idempotencyKey, paidPrice, installment, locale, card }, database) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const lockedOrder = await loadOrderContext(connection, order.order_number, identity, { lock: true });
    const [numberRows] = await connection.query(
      'SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt FROM payments WHERE order_id = ?',
      [lockedOrder.id],
    );
    const publicId = randomUUID();
    const conversationId = `AGP-${publicId}`;
    const [result] = await connection.query(
      `INSERT INTO payments
        (public_id, order_id, attempt_number, provider, idempotency_key, status,
         amount, refunded_amount, base_amount, currency, locale, installment,
         payment_source, provider_conversation_id, provider_basket_id, card_bin,
         card_last_four, expires_at)
       VALUES (?, ?, ?, ?, ?, 'initialized', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [publicId, lockedOrder.id, numberRows[0].next_attempt, PROVIDER, idempotencyKey,
        money(paidPrice), money(lockedOrder.total_amount), lockedOrder.currency, locale, installment,
        PAYMENT_SOURCE, conversationId, lockedOrder.order_number, card.cardNumber.slice(0, 8),
        card.cardNumber.slice(-4), lockedOrder.reservation_expires_at],
    );
    await connection.commit();
    return {
      id: result.insertId,
      public_id: publicId,
      order_id: lockedOrder.id,
      order_number: lockedOrder.order_number,
      provider_conversation_id: conversationId,
      provider_basket_id: lockedOrder.order_number,
      status: 'initialized',
      amount: money(paidPrice),
      base_amount: money(lockedOrder.total_amount),
      currency: lockedOrder.currency,
      locale,
      installment,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const loadAttemptByConversation = async (database, conversationId) => {
  const [rows] = await database.query(
    `SELECT p.*, o.order_number, o.user_id, o.guest_access_token_hash,
       o.status AS order_status, o.payment_status AS order_payment_status
     FROM payments p INNER JOIN orders o ON o.id = p.order_id
     WHERE p.provider = ? AND p.provider_conversation_id = ? LIMIT 1`,
    [PROVIDER, conversationId],
  );
  return rows[0] || null;
};

const claimCallback = async (database, attempt, { mdStatus = null, markAuthorizing = false } = {}) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.query(
      'SELECT status, payment_status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
      [attempt.order_id],
    );
    const [paymentRows] = await connection.query(
      'SELECT status, provider_status, callback_received_at FROM payments WHERE id = ? LIMIT 1 FOR UPDATE',
      [attempt.id],
    );
    const order = orderRows[0];
    const payment = paymentRows[0];
    if (!order || !payment) throw paymentError(404, 'Ödeme denemesi bulunamadı.', 'payment_attempt_not_found');
    if (payment.status === 'paid') {
      await connection.commit();
      return 'paid';
    }
    if (order.status !== 'pending_payment' || order.payment_status !== 'pending' || payment.status !== 'pending') {
      await connection.commit();
      return 'terminal';
    }
    if (markAuthorizing && payment.provider_status === 'AUTHORIZING' && payment.callback_received_at) {
      await connection.commit();
      return 'processing';
    }
    const hasMdStatus = mdStatus !== null && mdStatus !== undefined && mdStatus !== '';
    const normalizedMdStatus = hasMdStatus && Number.isInteger(Number(mdStatus)) ? Number(mdStatus) : null;
    await connection.query(
      `UPDATE payments SET callback_received_at = UTC_TIMESTAMP(6),
         md_status = COALESCE(?, md_status), signature_verified_at = UTC_TIMESTAMP(6),
         provider_status = CASE WHEN ? = 1 THEN 'AUTHORIZING' ELSE provider_status END
       WHERE id = ?`,
      [normalizedMdStatus, markAuthorizing ? 1 : 0, attempt.id],
    );
    await connection.commit();
    return 'claimed';
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const saveProviderResult = async (database, attempt, response, providerStatus) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE payments SET provider_status = ?, md_status = ?, fraud_status = ?,
         card_bin = COALESCE(?, card_bin), card_last_four = COALESCE(?, card_last_four),
         card_type = ?, card_association = ?, card_family = ?, last_reconciled_at = UTC_TIMESTAMP(6),
         signature_verified_at = UTC_TIMESTAMP(6), failure_code = NULL, failure_message = NULL
       WHERE id = ?`,
      [providerStatus, response.mdStatus ?? null, response.fraudStatus ?? null,
        response.binNumber || null, response.lastFourDigits || null, response.cardType || null,
        response.cardAssociation || null, response.cardFamily || null, attempt.id],
    );
    for (const transaction of response.itemTransactions || []) {
      const match = /^OI-(\d+)$/.exec(String(transaction.itemId || ''));
      if (!validProviderItemTransaction(transaction)) continue;
      let orderItemId = null;
      if (match) {
        const [orderItemRows] = await connection.query(
          'SELECT id FROM order_items WHERE id = ? AND order_id = ? LIMIT 1',
          [Number(match[1]), attempt.order_id],
        );
        if (!orderItemRows[0]) continue;
        orderItemId = orderItemRows[0].id;
      }
      await connection.query(
        `INSERT INTO payment_item_transactions
          (payment_id, order_item_id, provider_item_id, provider_transaction_id,
           provider_status, price, paid_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE provider_transaction_id = VALUES(provider_transaction_id),
           provider_status = VALUES(provider_status), price = VALUES(price),
           paid_price = VALUES(paid_price)`,
        [attempt.id, orderItemId, String(transaction.itemId).slice(0, 190),
          transaction.paymentTransactionId, transaction.transactionStatus ?? null,
          money(transaction.price), money(transaction.paidPrice)],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getPaymentStatus = async ({ publicId, identity }, database) => {
  const [rows] = await database.query(
    `SELECT p.public_id, p.status, p.provider_status, p.amount, p.base_amount, p.currency,
       p.installment, p.failure_code, p.created_at, p.completed_at,
       o.order_number, o.user_id, o.guest_access_token_hash, o.status AS order_status,
       o.payment_status AS order_payment_status, email_outbox.status AS email_delivery_status
     FROM payments p INNER JOIN orders o ON o.id = p.order_id
     LEFT JOIN transactional_email_outbox email_outbox
       ON email_outbox.order_id = o.id AND email_outbox.template = 'order_confirmation'
     WHERE p.public_id = ? LIMIT 1`,
    [publicId],
  );
  const row = rows[0];
  if (!row || !ownsOrder(row, identity)) {
    throw paymentError(404, 'Ödeme denemesi bulunamadı.', 'payment_attempt_not_found');
  }
  return {
    paymentAttemptId: row.public_id,
    status: row.status,
    providerStatus: row.provider_status,
    amount: Number(row.amount),
    baseAmount: Number(row.base_amount),
    currency: row.currency,
    installment: Number(row.installment),
    failureCode: row.failure_code,
    order: {
      number: row.order_number,
      status: row.order_status,
      paymentStatus: row.order_payment_status,
      emailDeliveryStatus: row.email_delivery_status || null,
    },
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
};

module.exports = {
  claimCallback,
  createAttempt,
  getPaymentStatus,
  loadAttemptByConversation,
  loadAttemptByIdempotency,
  loadOrderContext,
  saveProviderResult,
};
