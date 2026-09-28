const { hashOrderAccessToken, isValidOrderAccessToken } = require('../helpers/orderCore');
const {
  isValidBinNumber,
  isValidInstallment,
  isValidOrderNumber,
  isValidPaymentIdempotencyKey,
  normalizeIdentityNumber,
  normalizePaymentCard,
} = require('../helpers/paymentInput');
const paymentArtifactService = require('../services/paymentArtifactService');
const paymentService = require('../services/iyzicoPaymentService');
const { config } = require('../config/env');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROOF_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SIGNATURE_PATTERN = /^[a-f0-9]{64}$/i;

const readOrderIdentity = (req) => {
  if (req.user) return { userId: req.user.id };
  const orderToken = req.get('x-order-token');
  if (!isValidOrderAccessToken(orderToken)) {
    const error = new Error('guest_order_token_invalid');
    error.statusCode = 401;
    error.publicMessage = req.t('orders.access_denied');
    throw error;
  }
  return { orderTokenHash: hashOrderAccessToken(orderToken) };
};

const invalidRequest = (req, res) => res.status(422).json({
  status: false,
  message: req.t('validation.invalid_request'),
});

exports.installments = async (req, res, next) => {
  const orderNumber = String(req.body.orderNumber || '').trim();
  const binNumber = String(req.body.binNumber || '').replace(/\D/g, '');
  if (!isValidOrderNumber(orderNumber) || !isValidBinNumber(binNumber)) {
    return invalidRequest(req, res);
  }
  try {
    const result = await paymentService.getInstallments({
      orderNumber,
      binNumber,
      identity: readOrderIdentity(req),
      locale: req.body.locale,
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ status: true, message: req.t('payments.installments_found'), data: result });
  } catch (error) {
    return next(error);
  }
};

exports.initializeThreeDs = async (req, res, next) => {
  const orderNumber = String(req.body.orderNumber || '').trim();
  const idempotencyKey = String(req.get('idempotency-key') || '').trim();
  const installment = Number(req.body.installment || 1);
  const card = normalizePaymentCard(req.body.card);
  const rawIdentityNumber = req.body.buyer?.identityNumber;
  const identityNumber = rawIdentityNumber ? normalizeIdentityNumber(rawIdentityNumber) : null;
  if (!isValidOrderNumber(orderNumber) || !isValidPaymentIdempotencyKey(idempotencyKey) ||
      !isValidInstallment(installment) || !card || (rawIdentityNumber && !identityNumber)) {
    return invalidRequest(req, res);
  }

  try {
    const result = await paymentService.initializeThreeDs({
      orderNumber,
      identity: readOrderIdentity(req),
      idempotencyKey,
      card,
      installment,
      identityNumber,
      locale: req.body.locale,
      ipAddress: req.ip,
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(result.reused ? 200 : 201).json({
      status: true,
      message: req.t(result.reused ? 'payments.reused' : 'payments.initialized'),
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

exports.threeDsSession = async (req, res, next) => {
  const { publicId, proof } = req.params;
  if (!UUID_PATTERN.test(publicId) || !PROOF_PATTERN.test(proof)) {
    return res.status(404).send('Ödeme oturumu bulunamadı.');
  }
  try {
    const base64Html = await paymentArtifactService.consumeArtifact(publicId, proof);
    if (!base64Html) return res.status(410).send('Ödeme oturumunun süresi doldu.');
    const html = Buffer.from(base64Html, 'base64').toString('utf8');
    if (!/<form\b/i.test(html) || html.length > 1_000_000) {
      return res.status(502).send('Ödeme sağlayıcısından geçersiz içerik alındı.');
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; " +
      "img-src data: https:; frame-src https:; form-action https:; base-uri 'none'; frame-ancestors 'none'",
    );
    return res.type('html').send(html);
  } catch (error) {
    return next(error);
  }
};

exports.threeDsCallback = async (req, res, next) => {
  const payload = {
    conversationData: String(req.body.conversationData || ''),
    conversationId: String(req.body.conversationId || ''),
    mdStatus: String(req.body.mdStatus || ''),
    paymentId: String(req.body.paymentId || ''),
    status: String(req.body.status || ''),
    signature: String(req.body.signature || ''),
  };
  if (payload.conversationData.length > 5000 || payload.conversationId.length > 190 ||
      payload.paymentId.length > 190 || !/^-?\d$/.test(payload.mdStatus) ||
      !['success', 'failure'].includes(payload.status) || !SIGNATURE_PATTERN.test(payload.signature)) {
    return invalidRequest(req, res);
  }
  try {
    const result = await paymentService.handleThreeDsCallback(payload);
    const resultUrl = new URL(`/${result.locale === 'en' ? 'en' : 'tr'}/checkout/result`, config.frontendUrl);
    resultUrl.searchParams.set('paymentAttemptId', result.paymentAttemptId);
    resultUrl.searchParams.set('status', result.status);
    return res.redirect(303, resultUrl.toString());
  } catch (error) {
    return next(error);
  }
};

exports.webhook = async (req, res, next) => {
  const signature = String(req.get('x-iyz-signature-v3') || '');
  const payload = req.body || {};
  if (!SIGNATURE_PATTERN.test(signature) || !payload.iyziEventType || !payload.paymentId ||
      !payload.paymentConversationId || !payload.status) {
    return invalidRequest(req, res);
  }
  try {
    await paymentService.processWebhook(payload, signature);
    return res.json({ status: true, message: 'OK' });
  } catch (error) {
    return next(error);
  }
};

exports.status = async (req, res, next) => {
  if (!UUID_PATTERN.test(req.params.publicId)) return invalidRequest(req, res);
  try {
    const result = await paymentService.getPaymentStatus({
      publicId: req.params.publicId,
      identity: readOrderIdentity(req),
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ status: true, message: req.t('payments.status_found'), data: result });
  } catch (error) {
    return next(error);
  }
};
