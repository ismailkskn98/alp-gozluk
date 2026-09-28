const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeInstallmentResponse } = require('../../alpgozluk/v1/services/iyzicoPaymentService');
const { createIyzicoApiClient } = require('../../alpgozluk/v1/services/iyzicoApiClient');

test('taksit cevabı yalnız desteklenen seçenekleri ve kart özetini açığa çıkarır', () => {
  const result = sanitizeInstallmentResponse({
    installmentDetails: [{
      cardType: 'CREDIT_CARD',
      cardAssociation: 'MASTER_CARD',
      cardFamilyName: 'World',
      bankName: 'Test Bank',
      installmentPrices: [
        { installmentNumber: 1, installmentPrice: 100, totalPrice: 100 },
        { installmentNumber: 3, installmentPrice: 35, totalPrice: 105 },
        { installmentNumber: 5, installmentPrice: 22, totalPrice: 110 },
      ],
    }],
  }, 100);

  assert.deepEqual(result.options, [
    { installment: 1, installmentPrice: 100, totalPrice: 100 },
    { installment: 3, installmentPrice: 35, totalPrice: 105 },
  ]);
  assert.equal(result.card.family, 'World');
  assert.equal(result.forceThreeDs, true);
});

test('native iyzico istemcisi IYZWSv2 başlığıyla yalnız sabit sağlayıcı yoluna istek atar', async () => {
  let captured;
  const client = createIyzicoApiClient({
    apiKey: 'api-key',
    secretKey: 'secret-key',
    baseUrl: 'https://sandbox-api.iyzipay.com',
    randomKeyFactory: () => 'fixed-random',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ status: 'success' }) };
    },
  });

  await client.retrieveInstallments({ locale: 'tr', price: '100.00', binNumber: '55260800' });

  assert.equal(captured.url, 'https://sandbox-api.iyzipay.com/payment/iyzipos/installment');
  assert.match(captured.options.headers.Authorization, /^IYZWSv2 /);
  assert.equal(captured.options.headers['x-iyzi-rnd'], 'fixed-random');
  assert.equal(captured.options.body, '{"locale":"tr","price":"100.00","binNumber":"55260800"}');
});
