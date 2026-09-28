const { createHmac, timingSafeEqual } = require('node:crypto');

const hmacHex = (value, secretKey) => (
  createHmac('sha256', secretKey).update(value, 'utf8').digest('hex')
);

const safeHexEqual = (left, right) => {
  if (!/^[a-f0-9]{64}$/i.test(String(left || '')) || !/^[a-f0-9]{64}$/i.test(String(right || ''))) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
};

const normalizePriceForSignature = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized.includes('.')) return normalized;
  return normalized.replace(/0+$/, '').replace(/\.$/, '');
};

const createResponseSignature = (values, secretKey) => (
  hmacHex(values.map((value) => String(value ?? '')).join(':'), secretKey)
);

const verifyResponseSignature = (values, signature, secretKey) => (
  safeHexEqual(createResponseSignature(values, secretKey), signature)
);

const createWebhookSignature = (payload, secretKey) => hmacHex(
  `${secretKey}${payload.iyziEventType || ''}${payload.paymentId || ''}` +
  `${payload.paymentConversationId || ''}${payload.status || ''}`,
  secretKey,
);

const verifyWebhookSignature = (payload, signature, secretKey) => (
  safeHexEqual(createWebhookSignature(payload, secretKey), signature)
);

const createAuthorizationHeader = ({ apiKey, secretKey, path, body, randomKey }) => {
  const signature = hmacHex(`${randomKey}${path}${body || ''}`, secretKey);
  const authorization = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(authorization, 'utf8').toString('base64')}`;
};

module.exports = {
  createAuthorizationHeader,
  createResponseSignature,
  createWebhookSignature,
  normalizePriceForSignature,
  safeHexEqual,
  verifyResponseSignature,
  verifyWebhookSignature,
};
