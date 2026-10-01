const { createHmac, timingSafeEqual } = require('node:crypto');
const { config } = require('../config/env');

const TOKEN_VERSION = 'v1';
const TOKEN_PATTERN = /^v1\.(\d{10})\.([A-Za-z0-9_-]{43})$/;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const createSignature = ({ orderNumber, customerEmail, expiresAt }) => createHmac(
  'sha256',
  config.orderTracking.secret,
).update(`${TOKEN_VERSION}.${expiresAt}.${orderNumber}.${normalizeEmail(customerEmail)}`).digest('base64url');

const createOrderTrackingToken = ({ orderNumber, customerEmail, now = Date.now() }) => {
  const expiresAt = Math.floor(now / 1000) + (config.orderTracking.ttlDays * 24 * 60 * 60);
  const signature = createSignature({ orderNumber, customerEmail, expiresAt });
  return `${TOKEN_VERSION}.${expiresAt}.${signature}`;
};

const verifyOrderTrackingToken = ({ token, orderNumber, customerEmail, now = Date.now() }) => {
  const match = TOKEN_PATTERN.exec(String(token || ''));
  if (!match) return false;

  const expiresAt = Number(match[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) return false;

  const expected = Buffer.from(createSignature({ orderNumber, customerEmail, expiresAt }));
  const received = Buffer.from(match[2]);
  return expected.length === received.length && timingSafeEqual(expected, received);
};

const maskEmail = (value) => {
  const [localPart, domain] = normalizeEmail(value).split('@');
  if (!localPart || !domain) return '';
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${'*'.repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
};

module.exports = {
  createOrderTrackingToken,
  maskEmail,
  verifyOrderTrackingToken,
};
