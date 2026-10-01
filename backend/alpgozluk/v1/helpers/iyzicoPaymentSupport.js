const { config } = require('../config/env');
const { toMinorUnits } = require('./commerce');
const { normalizePriceForSignature, verifyResponseSignature } = require('./iyzicoSignature');

const PROVIDER = 'iyzico';
const PAYMENT_SOURCE = 'ALP_GOZLUK_WEB';
const SUPPORTED_INSTALLMENTS = new Set([1, 2, 3, 4, 6, 9, 12]);

const paymentError = (statusCode, publicMessage, code) => {
  const error = new Error(code || publicMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  error.code = code;
  return error;
};

const ensureEnabled = () => {
  if (!config.payments.iyzico.enabled) {
    throw paymentError(503, 'Kartla ödeme şu anda kullanılamıyor.', 'payment_provider_disabled');
  }
};

const ownsOrder = (row, identity) => (
  identity.userId
    ? Number(row.user_id) === Number(identity.userId)
    : Boolean(identity.orderTokenHash) && row.guest_access_token_hash === identity.orderTokenHash
);

const money = (value) => Number(value).toFixed(2);
const compactProviderMessage = (value) => String(value || '').trim().slice(0, 500) || null;
const validProviderItemTransaction = (transaction) => (
  Boolean(transaction?.itemId) && Boolean(transaction?.paymentTransactionId) &&
  [1, 2].includes(Number(transaction.transactionStatus)) &&
  Number.isFinite(Number(transaction.price)) && Number(transaction.price) >= 0 &&
  Number.isFinite(Number(transaction.paidPrice)) && Number(transaction.paidPrice) >= 0
);

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('90')) return `+${digits}`;
  if (digits.startsWith('0')) return `+9${digits}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
};

const countryName = (countryCode) => countryCode === 'TR' ? 'Turkey' : countryCode;

const providerAddress = (address) => ({
  contactName: `${address.first_name} ${address.last_name}`.trim(),
  city: address.city,
  country: countryName(address.country_code),
  address: [address.address_line, address.neighborhood, address.district].filter(Boolean).join(', '),
  zipCode: address.postal_code || undefined,
});

const buildBasketItems = (order) => {
  const items = order.items.filter((item) => Number(item.total_amount) > 0).map((item) => ({
    id: `OI-${item.id}`,
    price: money(item.total_amount),
    name: String(item.product_name).slice(0, 190),
    category1: 'Gözlük',
    category2: String(item.sku || '').slice(0, 100) || undefined,
    itemType: 'PHYSICAL',
  }));
  if (Number(order.shipping_amount) > 0) {
    items.push({
      id: `SHIP-${order.order_number}`,
      price: money(order.shipping_amount),
      name: 'Kargo',
      category1: 'Teslimat',
      itemType: 'PHYSICAL',
    });
  }
  return items;
};

const resolveBuyerIdentityNumber = (identityNumber) => {
  if (identityNumber) return identityNumber;
  if (config.payments.iyzico.environment === 'sandbox') {
    return config.payments.iyzico.sandboxIdentityNumber;
  }
  throw paymentError(
    422,
    'Ödeme için alıcı kimlik veya pasaport bilgisi gereklidir.',
    'buyer_identity_required',
  );
};

const buildBuyer = (order, identityNumber, ipAddress) => ({
  id: order.user_id ? `USER-${order.user_id}` : `GUEST-${order.guest_access_token_hash.slice(0, 20)}`,
  name: order.customer_first_name,
  surname: order.customer_last_name,
  identityNumber: resolveBuyerIdentityNumber(identityNumber),
  email: order.customer_email,
  gsmNumber: normalizePhone(order.customer_phone),
  registrationAddress: [
    order.billingAddress.address_line,
    order.billingAddress.neighborhood,
    order.billingAddress.district,
  ].filter(Boolean).join(', '),
  city: order.billingAddress.city,
  country: countryName(order.billingAddress.country_code),
  zipCode: order.billingAddress.postal_code || undefined,
  ip: ipAddress,
});

const sanitizeInstallmentResponse = (response, baseAmount) => {
  const details = Array.isArray(response.installmentDetails) ? response.installmentDetails : [];
  const detail = details[0] || {};
  const options = (Array.isArray(detail.installmentPrices) ? detail.installmentPrices : [])
    .filter((option) => SUPPORTED_INSTALLMENTS.has(Number(option.installmentNumber)))
    .map((option) => ({
      installment: Number(option.installmentNumber),
      installmentPrice: Number(option.installmentPrice),
      totalPrice: Number(option.totalPrice),
    }))
    .filter((option) => Number.isFinite(option.installmentPrice) && Number.isFinite(option.totalPrice));

  if (!options.some((option) => option.installment === 1)) {
    options.unshift({ installment: 1, installmentPrice: Number(baseAmount), totalPrice: Number(baseAmount) });
  }

  return {
    card: {
      type: detail.cardType || null,
      association: detail.cardAssociation || null,
      family: detail.cardFamilyName || null,
      bankName: detail.bankName || null,
      commercial: Boolean(detail.commercial),
    },
    forceThreeDs: true,
    options: options.sort((left, right) => left.installment - right.installment),
  };
};

const attemptResponse = (attempt, { reused = false, bridgeProof = null } = {}) => ({
  paymentAttemptId: attempt.public_id,
  status: attempt.status,
  orderNumber: attempt.order_number,
  amount: Number(attempt.amount),
  currency: attempt.currency,
  installment: Number(attempt.installment),
  reused,
  threeDsPageUrl: bridgeProof
    ? `${config.appUrl}/api/alpgozluk/v1/payments/iyzico/3ds/session/${attempt.public_id}/${bridgeProof}`
    : null,
});

const assertPaymentResponse = (attempt, response) => {
  const signatureValues = [
    response.paymentId,
    response.currency,
    response.basketId,
    response.conversationId,
    normalizePriceForSignature(response.paidPrice),
    normalizePriceForSignature(response.price),
  ];
  const signatureValid = verifyResponseSignature(
    signatureValues,
    response.signature,
    config.payments.iyzico.secretKey,
  );
  const fieldsMatch = String(response.paymentId) === String(attempt.provider_payment_id) &&
    response.conversationId === attempt.provider_conversation_id &&
    response.basketId === attempt.provider_basket_id && response.currency === attempt.currency &&
    toMinorUnits(response.price) === toMinorUnits(attempt.base_amount) &&
    toMinorUnits(response.paidPrice) === toMinorUnits(attempt.amount);
  if (!signatureValid || !fieldsMatch) {
    throw paymentError(502, 'Ödeme sonucu güvenli biçimde doğrulanamadı.', 'provider_response_invalid');
  }
};

module.exports = {
  PAYMENT_SOURCE,
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
};
