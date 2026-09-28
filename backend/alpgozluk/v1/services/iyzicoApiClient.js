const { randomBytes } = require('node:crypto');
const { config } = require('../config/env');
const { createAuthorizationHeader } = require('../helpers/iyzicoSignature');

const providerError = (message, code = 'payment_provider_unavailable') => {
  const error = new Error(code);
  error.statusCode = 502;
  error.publicMessage = message;
  error.code = code;
  return error;
};

const createRandomKey = () => `${Date.now()}${randomBytes(12).toString('hex')}`;

const createIyzicoApiClient = ({
  apiKey = config.payments.iyzico.apiKey,
  secretKey = config.payments.iyzico.secretKey,
  baseUrl = config.payments.iyzico.baseUrl,
  timeoutMs = config.payments.iyzico.requestTimeoutMs,
  fetchImpl = globalThis.fetch,
  randomKeyFactory = createRandomKey,
} = {}) => {
  const post = async (path, payload) => {
    if (!apiKey || !secretKey || !baseUrl) {
      throw providerError('Ödeme sağlayıcısı henüz yapılandırılmadı.', 'payment_provider_not_configured');
    }

    const body = JSON.stringify(payload);
    const randomKey = randomKeyFactory();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: createAuthorizationHeader({ apiKey, secretKey, path, body, randomKey }),
          'Content-Type': 'application/json',
          'x-iyzi-rnd': randomKey,
        },
        body,
        signal: controller.signal,
      });
      const responseBody = await response.json().catch(() => null);
      if (!response.ok || !responseBody || typeof responseBody !== 'object') {
        throw providerError('Ödeme sağlayıcısından geçerli yanıt alınamadı.');
      }
      return responseBody;
    } catch (error) {
      if (error.statusCode) throw error;
      if (error.name === 'AbortError') {
        throw providerError('Ödeme sağlayıcısı zamanında yanıt vermedi.', 'payment_provider_timeout');
      }
      throw providerError('Ödeme sağlayıcısına şu anda ulaşılamıyor.');
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    initializeThreeDs: (payload) => post('/payment/3dsecure/initialize', payload),
    authorizeThreeDs: (payload) => post('/payment/v2/3dsecure/auth', payload),
    retrieveInstallments: (payload) => post('/payment/iyzipos/installment', payload),
    retrievePayment: (payload) => post('/payment/detail', payload),
  };
};

module.exports = { createIyzicoApiClient };
