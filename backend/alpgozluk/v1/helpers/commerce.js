const { createHash, randomBytes } = require('node:crypto');

const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_CART_LINE_QUANTITY = 10;
const MAX_GUEST_FAVORITES = 100;

const createGuestToken = () => randomBytes(32).toString('base64url');

const isValidGuestToken = (token) => (
  typeof token === 'string' && GUEST_TOKEN_PATTERN.test(token)
);

const hashGuestToken = (token) => (
  createHash('sha256').update(token, 'utf8').digest('hex')
);

const toMinorUnits = (value) => {
  const normalized = String(value ?? '0').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return 0;
  const [whole, fraction = ''] = normalized.split('.');
  return (Number(whole) * 100) + Number(fraction.padEnd(2, '0'));
};

const fromMinorUnits = (value) => Number((Math.max(0, value) / 100).toFixed(2));

const calculateCouponDiscount = (coupon, subtotalMinor) => {
  if (!coupon || subtotalMinor <= 0) return 0;
  const discountType = String(coupon.discount_type || '').toLowerCase();
  const valueMinor = toMinorUnits(coupon.discount_value);

  if (['percentage', 'percent'].includes(discountType)) {
    const percentage = Number(coupon.discount_value);
    if (!Number.isFinite(percentage) || percentage <= 0) return 0;
    return Math.min(subtotalMinor, Math.round(subtotalMinor * Math.min(percentage, 100) / 100));
  }

  if (['fixed', 'amount'].includes(discountType)) {
    return Math.min(subtotalMinor, valueMinor);
  }

  return 0;
};

module.exports = {
  MAX_CART_LINE_QUANTITY,
  MAX_GUEST_FAVORITES,
  calculateCouponDiscount,
  createGuestToken,
  fromMinorUnits,
  hashGuestToken,
  isValidGuestToken,
  toMinorUnits,
};
