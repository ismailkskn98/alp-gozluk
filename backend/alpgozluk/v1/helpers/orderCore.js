const { createHash, randomBytes } = require('node:crypto');

const PUBLIC_NUMBER_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ORDER_NUMBER_PATTERN = /^AG-\d{2}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/;
const ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const ORDER_STATUSES = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const PAYMENT_STATUSES = Object.freeze({
  INITIALIZED: 'initialized',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
});

const FULFILLMENT_STATUSES = Object.freeze({
  UNFULFILLED: 'unfulfilled',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
});

const RESERVATION_STATUSES = Object.freeze({
  ACTIVE: 'active',
  COMMITTED: 'committed',
  RELEASED: 'released',
  EXPIRED: 'expired',
});

const orderTransitions = Object.freeze({
  [ORDER_STATUSES.PENDING_PAYMENT]: new Set([ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED]),
  [ORDER_STATUSES.PROCESSING]: new Set([ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED]),
  [ORDER_STATUSES.SHIPPED]: new Set([ORDER_STATUSES.DELIVERED]),
  [ORDER_STATUSES.DELIVERED]: new Set(),
  [ORDER_STATUSES.CANCELLED]: new Set(),
});

const paymentTransitions = Object.freeze({
  [PAYMENT_STATUSES.INITIALIZED]: new Set([
    PAYMENT_STATUSES.PENDING,
    PAYMENT_STATUSES.FAILED,
    PAYMENT_STATUSES.CANCELLED,
    PAYMENT_STATUSES.EXPIRED,
  ]),
  [PAYMENT_STATUSES.PENDING]: new Set([
    PAYMENT_STATUSES.PAID,
    PAYMENT_STATUSES.FAILED,
    PAYMENT_STATUSES.CANCELLED,
    PAYMENT_STATUSES.EXPIRED,
  ]),
  [PAYMENT_STATUSES.PAID]: new Set([
    PAYMENT_STATUSES.PARTIALLY_REFUNDED,
    PAYMENT_STATUSES.REFUNDED,
  ]),
  [PAYMENT_STATUSES.PARTIALLY_REFUNDED]: new Set([PAYMENT_STATUSES.REFUNDED]),
  [PAYMENT_STATUSES.FAILED]: new Set(),
  [PAYMENT_STATUSES.CANCELLED]: new Set(),
  [PAYMENT_STATUSES.EXPIRED]: new Set(),
  [PAYMENT_STATUSES.REFUNDED]: new Set(),
});

const createPublicNumber = (prefix, now = new Date(), randomBytesFn = randomBytes) => {
  const year = String(now.getUTCFullYear()).slice(-2);
  const bytes = randomBytesFn(10);
  let suffix = '';
  for (let index = 0; index < 10; index += 1) {
    suffix += PUBLIC_NUMBER_ALPHABET[bytes[index] & 31];
  }
  return `${prefix}-${year}-${suffix}`;
};

const createOrderNumber = (now, randomBytesFn) => createPublicNumber('AG', now, randomBytesFn);
const createGuestOrderToken = () => randomBytes(32).toString('base64url');

const hashOrderAccessToken = (token) => (
  createHash('sha256').update(token, 'utf8').digest('hex')
);

const isValidOrderNumber = (value) => (
  typeof value === 'string' && ORDER_NUMBER_PATTERN.test(value)
);

const isValidOrderAccessToken = (value) => (
  typeof value === 'string' && ACCESS_TOKEN_PATTERN.test(value)
);

const canTransitionOrder = (currentStatus, nextStatus) => (
  currentStatus === nextStatus || Boolean(orderTransitions[currentStatus]?.has(nextStatus))
);

const canTransitionPayment = (currentStatus, nextStatus) => (
  currentStatus === nextStatus || Boolean(paymentTransitions[currentStatus]?.has(nextStatus))
);

const allocateDiscountMinor = (lineAmounts, discountMinor) => {
  const normalizedLines = lineAmounts.map((amount) => Math.max(0, Number(amount) || 0));
  const subtotalMinor = normalizedLines.reduce((total, amount) => total + amount, 0);
  const normalizedDiscount = Math.min(subtotalMinor, Math.max(0, Number(discountMinor) || 0));
  if (subtotalMinor === 0 || normalizedDiscount === 0) return normalizedLines.map(() => 0);

  const allocations = normalizedLines.map((lineAmount, index) => {
    const exactShare = normalizedDiscount * lineAmount / subtotalMinor;
    return { index, amount: Math.floor(exactShare), remainder: exactShare % 1 };
  });
  let undistributed = normalizedDiscount - allocations.reduce((total, item) => total + item.amount, 0);

  allocations
    .slice()
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)
    .forEach((item) => {
      if (undistributed <= 0) return;
      allocations[item.index].amount += 1;
      undistributed -= 1;
    });

  return allocations.map((item) => item.amount);
};

const calculateIncludedTaxMinor = (amountMinor, taxRate) => {
  const amount = Math.max(0, Number(amountMinor) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);
  if (amount === 0 || rate === 0) return 0;
  return Math.round(amount * rate / (100 + rate));
};

module.exports = {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  RESERVATION_STATUSES,
  allocateDiscountMinor,
  calculateIncludedTaxMinor,
  canTransitionOrder,
  canTransitionPayment,
  createGuestOrderToken,
  createOrderNumber,
  hashOrderAccessToken,
  isValidOrderAccessToken,
  isValidOrderNumber,
};
