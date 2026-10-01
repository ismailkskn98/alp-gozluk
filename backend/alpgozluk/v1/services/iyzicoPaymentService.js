const { createHash, randomUUID } = require('node:crypto');
const { config } = require('../config/env');
const { toMinorUnits } = require('../helpers/commerce');
const {
  verifyResponseSignature,
  verifyWebhookSignature,
} = require('../helpers/iyzicoSignature');
const {
  PROVIDER,
  assertPaymentResponse,
  attemptResponse,
  buildBasketItems,
  buildBuyer,
  compactProviderMessage,
  ensureEnabled,
  money,
  ownsOrder,
  paymentError,
  providerAddress,
  sanitizeInstallmentResponse,
  validProviderItemTransaction,
} = require('../helpers/iyzicoPaymentSupport');
const { getDb } = require('../models/db');
const { createOrderTrackingToken, maskEmail } = require('../helpers/orderTracking');
const orderService = require('./orderService');
const { createIyzicoApiClient } = require('./iyzicoApiClient');
const paymentRepository = require('./iyzicoPaymentRepository');
const paymentArtifactService = require('./paymentArtifactService');
const transactionalEmailService = require('./transactionalEmailService');
const {
  claimCallback,
  createAttempt,
  loadAttemptByConversation,
  loadAttemptByIdempotency,
  loadOrderContext,
  saveProviderResult,
} = paymentRepository;

const fetchInstallments = async (order, binNumber, locale, client) => {
  const conversationId = `INSTALLMENT-${randomUUID()}`;
  const response = await client.retrieveInstallments({
    locale,
    conversationId,
    binNumber,
    price: money(order.total_amount),
  });
  if (response.status !== 'success' || response.conversationId !== conversationId) {
    throw paymentError(422, 'Bu kart için taksit seçenekleri alınamadı.', 'installment_lookup_failed');
  }
  return sanitizeInstallmentResponse(response, order.total_amount);
};

const getInstallments = async ({ orderNumber, identity, binNumber, locale = 'tr' }, {
  database = getDb(),
  client = createIyzicoApiClient(),
} = {}) => {
  ensureEnabled();
  const order = await loadOrderContext(database, orderNumber, identity);
  return fetchInstallments(order, binNumber, locale === 'en' ? 'en' : 'tr', client);
};

const reuseExistingAttempt = async (attempt, order, identity, artifactService) => {
  if (!ownsOrder(attempt, identity) || Number(attempt.order_id) !== Number(order.id)) {
    throw paymentError(409, 'Bu işlem anahtarı başka bir ödeme için kullanılmış.', 'idempotency_conflict');
  }
  if (attempt.status === 'pending' && await artifactService.artifactExists(attempt.public_id)) {
    return attemptResponse(attempt, {
      reused: true,
      bridgeProof: artifactService.createProof(attempt.public_id),
    });
  }
  if (attempt.status === 'paid') return attemptResponse(attempt, { reused: true });
  if (attempt.status === 'initialized') {
    throw paymentError(409, 'Ödeme başlatma işlemi hâlâ devam ediyor.', 'payment_initialization_in_progress');
  }
  throw paymentError(409, 'Bu ödeme anahtarı tamamlanmış bir denemeye ait.', 'payment_attempt_terminal');
};

const updateFailedAttempt = async (database, attempt, code, message = null, errorGroup = null) => {
  await database.query(
    `UPDATE payments SET provider_status = 'failure', failure_code = ?, failure_message = ?,
       provider_error_group = ? WHERE id = ? AND status IN ('initialized', 'pending')`,
    [String(code || 'payment_failed').slice(0, 100), compactProviderMessage(message),
      String(errorGroup || '').slice(0, 100) || null, attempt.id],
  );
  try {
    await orderService.failOrderPayment({
      orderId: attempt.order_id,
      paymentId: attempt.id,
      reason: String(code || 'payment_failed').slice(0, 100),
    }, database);
  } catch (error) {
    if (!['order_not_payable', 'payment_attempt_conflict'].includes(error.code)) throw error;
  }
};

const initializeThreeDs = async ({
  orderNumber,
  identity,
  idempotencyKey,
  card,
  installment,
  identityNumber,
  locale = 'tr',
  ipAddress,
}, {
  database = getDb(),
  client = createIyzicoApiClient(),
  artifactService = paymentArtifactService,
} = {}) => {
  ensureEnabled();
  const safeLocale = locale === 'en' ? 'en' : 'tr';
  const order = await loadOrderContext(database, orderNumber, identity);
  const basketItems = buildBasketItems(order);
  const basketTotalMinor = basketItems.reduce((total, item) => total + toMinorUnits(item.price), 0);
  if (basketItems.length === 0 || basketTotalMinor !== toMinorUnits(order.total_amount)) {
    throw paymentError(409, 'Sipariş ödeme toplamı doğrulanamadı.', 'order_total_mismatch');
  }
  const existingAttempt = await loadAttemptByIdempotency(database, idempotencyKey);
  if (existingAttempt) return reuseExistingAttempt(existingAttempt, order, identity, artifactService);

  const installmentResult = await fetchInstallments(order, card.cardNumber.slice(0, 8), safeLocale, client);
  const selectedOption = installmentResult.options.find((option) => option.installment === Number(installment));
  if (!selectedOption) {
    throw paymentError(422, 'Seçilen taksit bu kart için kullanılamıyor.', 'installment_not_available');
  }

  let attempt;
  try {
    attempt = await createAttempt({
      order,
      identity,
      idempotencyKey,
      paidPrice: selectedOption.totalPrice,
      installment: selectedOption.installment,
      locale: safeLocale,
      card,
    }, database);
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const collidedAttempt = await loadAttemptByIdempotency(database, idempotencyKey);
    if (!collidedAttempt) throw error;
    return reuseExistingAttempt(collidedAttempt, order, identity, artifactService);
  }

  try {
    const response = await client.initializeThreeDs({
      locale: safeLocale,
      conversationId: attempt.provider_conversation_id,
      price: money(attempt.base_amount),
      paidPrice: money(attempt.amount),
      currency: attempt.currency,
      installment: Number(attempt.installment),
      paymentChannel: 'WEB',
      basketId: attempt.provider_basket_id,
      paymentGroup: 'PRODUCT',
      callbackUrl: config.payments.iyzico.callbackUrl,
      paymentCard: card,
      buyer: buildBuyer(order, identityNumber, ipAddress),
      shippingAddress: providerAddress(order.shippingAddress),
      billingAddress: providerAddress(order.billingAddress),
      basketItems,
    });

    const validResponse = response.status === 'success' && response.paymentId &&
      response.conversationId === attempt.provider_conversation_id && response.threeDSHtmlContent &&
      verifyResponseSignature(
        [response.paymentId, response.conversationId],
        response.signature,
        config.payments.iyzico.secretKey,
      );
    if (!validResponse) {
      await updateFailedAttempt(
        database,
        attempt,
        response.errorCode || 'provider_signature_invalid',
        response.errorMessage,
        response.errorGroup,
      );
      throw paymentError(422, 'Ödeme güvenli biçimde başlatılamadı.', 'payment_initialization_failed');
    }

    const bridgeProof = await artifactService.storeArtifact(attempt.public_id, response.threeDSHtmlContent);
    await database.query(
      `UPDATE payments SET provider_payment_id = ?, provider_status = ?, status = 'pending',
         signature_verified_at = UTC_TIMESTAMP(6)
       WHERE id = ? AND status = 'initialized'`,
      [response.paymentId, response.status, attempt.id],
    );
    return attemptResponse({ ...attempt, status: 'pending' }, { bridgeProof });
  } catch (error) {
    if (attempt && error.code !== 'payment_initialization_failed') {
      await updateFailedAttempt(database, attempt, error.code || 'payment_initialization_failed', error.publicMessage);
    }
    throw error;
  }
};

const finalizeProviderResponse = async (database, attempt, response) => {
  if (response.status !== 'success') {
    if (response.conversationId && response.conversationId !== attempt.provider_conversation_id) {
      throw paymentError(502, 'Ödeme sonucu güvenli biçimde doğrulanamadı.', 'provider_response_invalid');
    }
    await updateFailedAttempt(
      database,
      attempt,
      response.errorCode || 'payment_declined',
      response.errorMessage,
      response.errorGroup,
    );
    return { status: 'failed', orderNumber: attempt.order_number, reused: false };
  }
  assertPaymentResponse(attempt, response);
  if (response.paymentStatus && !['SUCCESS', 'FAILURE'].includes(response.paymentStatus)) {
    await saveProviderResult(database, attempt, response, response.paymentStatus);
    return { status: 'pending_review', orderNumber: attempt.order_number, reused: false };
  }
  const itemTransactionsApproved = Array.isArray(response.itemTransactions) &&
    response.itemTransactions.length > 0 &&
    response.itemTransactions.every(validProviderItemTransaction);
  const approved = response.paymentStatus !== 'FAILURE' && Number(response.fraudStatus) === 1 &&
    itemTransactionsApproved;
  const review = Number(response.fraudStatus) === 0;

  if (approved) {
    await saveProviderResult(database, attempt, response, response.paymentStatus || 'SUCCESS');
    const result = await orderService.commitPaidOrder({ orderId: attempt.order_id, paymentId: attempt.id }, database);
    transactionalEmailService.scheduleOrderConfirmation(result.order.orderNumber);
    return { status: 'paid', order: result.order, reused: result.reused };
  }
  if (review || (Number(response.fraudStatus) === 1 && !itemTransactionsApproved)) {
    await saveProviderResult(
      database,
      attempt,
      response,
      review ? 'FRAUD_REVIEW' : 'ITEM_REVIEW',
    );
    return { status: 'pending_review', orderNumber: attempt.order_number, reused: false };
  }

  await updateFailedAttempt(
    database,
    attempt,
    response.errorCode || 'payment_declined',
    response.errorMessage,
    response.errorGroup,
  );
  return { status: 'failed', orderNumber: attempt.order_number, reused: false };
};

const reconcilePendingPayments = async (limit = 50, {
  database = getDb(),
  client = createIyzicoApiClient(),
} = {}) => {
  ensureEnabled();
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const [attempts] = await database.query(
    `SELECT p.*, o.order_number, o.user_id, o.guest_access_token_hash,
       o.status AS order_status, o.payment_status AS order_payment_status
     FROM payments p INNER JOIN orders o ON o.id = p.order_id
     WHERE p.provider = ? AND p.status = 'pending' AND p.provider_payment_id IS NOT NULL
       AND (p.callback_received_at IS NOT NULL OR p.provider_status IN ('FRAUD_REVIEW', 'ITEM_REVIEW'))
     ORDER BY p.updated_at LIMIT ?`,
    [PROVIDER, safeLimit],
  );
  const summary = { checked: 0, paid: 0, failed: 0, pending: 0, errors: 0 };

  for (const attempt of attempts) {
    summary.checked += 1;
    try {
      const response = await client.retrievePayment({
        locale: attempt.locale,
        paymentId: attempt.provider_payment_id,
        paymentConversationId: attempt.provider_conversation_id,
      });
      const result = await finalizeProviderResponse(database, attempt, response);
      if (result.status === 'paid') summary.paid += 1;
      else if (result.status === 'failed') summary.failed += 1;
      else summary.pending += 1;
    } catch (error) {
      summary.errors += 1;
      await database.query(
        `UPDATE payments SET failure_message = ?, last_reconciled_at = UTC_TIMESTAMP(6)
         WHERE id = ? AND status = 'pending'`,
        [String(error.code || 'reconciliation_failed').slice(0, 500), attempt.id],
      );
    }
  }
  return summary;
};

const handleThreeDsCallback = async (payload, {
  database = getDb(),
  client = createIyzicoApiClient(),
} = {}) => {
  ensureEnabled();
  const signatureValid = verifyResponseSignature(
    [payload.conversationData, payload.conversationId, payload.mdStatus, payload.paymentId, payload.status],
    payload.signature,
    config.payments.iyzico.secretKey,
  );
  if (!signatureValid) {
    throw paymentError(400, 'Geçersiz ödeme bildirimi.', 'callback_signature_invalid');
  }

  const attempt = await loadAttemptByConversation(database, payload.conversationId);
  if (!attempt || String(attempt.provider_payment_id) !== String(payload.paymentId)) {
    throw paymentError(404, 'Ödeme denemesi bulunamadı.', 'payment_attempt_not_found');
  }
  const shouldAuthorize = payload.status === 'success' && Number(payload.mdStatus) === 1;
  const callbackClaim = await claimCallback(database, attempt, {
    mdStatus: payload.mdStatus,
    markAuthorizing: shouldAuthorize,
  });
  if (callbackClaim === 'paid') {
    return { paymentAttemptId: attempt.public_id, status: 'paid', locale: attempt.locale, reused: true };
  }
  if (callbackClaim === 'terminal') {
    return { paymentAttemptId: attempt.public_id, status: attempt.status, locale: attempt.locale, reused: true };
  }
  if (callbackClaim === 'processing') {
    return { paymentAttemptId: attempt.public_id, status: 'pending', locale: attempt.locale, reused: true };
  }

  if (payload.status !== 'success' || Number(payload.mdStatus) !== 1) {
    await updateFailedAttempt(database, attempt, `3ds_md_status_${payload.mdStatus}`);
    return { paymentAttemptId: attempt.public_id, status: 'failed', locale: attempt.locale };
  }
  const response = await client.authorizeThreeDs({
    locale: attempt.locale,
    conversationId: attempt.provider_conversation_id,
    paymentId: attempt.provider_payment_id,
    paidPrice: money(attempt.amount),
    basketId: attempt.provider_basket_id,
    currency: attempt.currency,
  });
  const result = await finalizeProviderResponse(database, attempt, response);
  return { paymentAttemptId: attempt.public_id, locale: attempt.locale, ...result };
};

const webhookEventId = (payload) => createHash('sha256').update([
  payload.iyziEventType,
  payload.paymentId,
  payload.paymentConversationId,
  payload.status,
  payload.iyziReferenceCode,
  payload.iyziEventTime,
].map((value) => String(value || '')).join('|')).digest('hex');

const processWebhook = async (payload, signature, {
  database = getDb(),
  client = createIyzicoApiClient(),
} = {}) => {
  ensureEnabled();
  if (!verifyWebhookSignature(payload, signature, config.payments.iyzico.secretKey)) {
    throw paymentError(401, 'Geçersiz webhook imzası.', 'webhook_signature_invalid');
  }

  const eventId = webhookEventId(payload);
  const sanitizedPayload = JSON.stringify({
    iyziEventType: payload.iyziEventType,
    paymentId: payload.paymentId,
    paymentConversationId: payload.paymentConversationId,
    status: payload.status,
    iyziReferenceCode: payload.iyziReferenceCode || null,
    iyziEventTime: payload.iyziEventTime || null,
  });
  await database.query(
    `INSERT INTO payment_webhook_events
      (provider, provider_event_id, event_type, payload_json, status, signature_verified)
     VALUES (?, ?, ?, ?, 'received', 1)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [PROVIDER, eventId, String(payload.iyziEventType || 'UNKNOWN').slice(0, 120), sanitizedPayload],
  );
  const [eventRows] = await database.query(
    'SELECT id, status FROM payment_webhook_events WHERE provider = ? AND provider_event_id = ? LIMIT 1',
    [PROVIDER, eventId],
  );
  const event = eventRows[0];
  if (event.status === 'processed' || event.status === 'ignored') return { reused: true };

  if (payload.iyziEventType !== 'THREE_DS_AUTH' || !['SUCCESS', 'FAILURE'].includes(payload.status)) {
    await database.query(
      `UPDATE payment_webhook_events SET status = 'processed', processed_at = UTC_TIMESTAMP(6)
       WHERE id = ?`,
      [event.id],
    );
    return { reused: false, ignored: true };
  }

  const attempt = await loadAttemptByConversation(database, payload.paymentConversationId);
  if (!attempt || String(attempt.provider_payment_id) !== String(payload.paymentId)) {
    await database.query(
      `UPDATE payment_webhook_events SET status = 'ignored', processed_at = UTC_TIMESTAMP(6)
       WHERE id = ?`,
      [event.id],
    );
    return { reused: false, ignored: true };
  }

  await database.query(
    `UPDATE payment_webhook_events SET payment_id = ?, status = 'processing', processing_error = NULL
     WHERE id = ?`,
    [attempt.id, event.id],
  );
  try {
    const providerClaim = await claimCallback(database, attempt, { mdStatus: attempt.md_status });
    if (providerClaim === 'terminal') {
      throw paymentError(
        409,
        'Sağlayıcı sonucu ile yerel sipariş durumu çakışıyor.',
        'payment_state_reconciliation_required',
      );
    }
    if (providerClaim === 'paid') {
      await database.query(
        `UPDATE payment_webhook_events SET status = 'processed', processed_at = UTC_TIMESTAMP(6)
         WHERE id = ?`,
        [event.id],
      );
      return { status: 'paid', reused: true };
    }
    const response = await client.retrievePayment({
      locale: attempt.locale,
      paymentId: attempt.provider_payment_id,
      paymentConversationId: attempt.provider_conversation_id,
    });
    const result = await finalizeProviderResponse(database, attempt, response);
    await database.query(
      `UPDATE payment_webhook_events SET status = 'processed', processed_at = UTC_TIMESTAMP(6)
       WHERE id = ?`,
      [event.id],
    );
    return result;
  } catch (error) {
    await database.query(
      `UPDATE payment_webhook_events SET status = 'failed', processing_error = ? WHERE id = ?`,
      [String(error.code || 'webhook_processing_failed').slice(0, 500), event.id],
    );
    throw error;
  }
};

const getPaymentStatus = async (payload, database = getDb()) => {
  const payment = await paymentRepository.getPaymentStatus(payload, database);
  const order = await orderService.getOrder({
    orderNumber: payment.order.number,
    identity: payload.identity,
  }, database);
  const paid = payment.status === 'paid' && order.paymentStatus === 'paid';

  return {
    ...payment,
    order: {
      ...payment.order,
      fulfillmentStatus: order.fulfillmentStatus,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      totalAmount: order.totalAmount,
      placedAt: order.placedAt,
      shippingMethod: order.shippingMethod,
      items: order.items,
      contactEmail: maskEmail(order.customer.email),
      trackingToken: paid ? createOrderTrackingToken({
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
      }) : null,
    },
  };
};

module.exports = {
  getInstallments,
  getPaymentStatus,
  handleThreeDsCallback,
  initializeThreeDs,
  processWebhook,
  reconcilePendingPayments,
  sanitizeInstallmentResponse,
};
