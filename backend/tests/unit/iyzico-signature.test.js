const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const {
  createAuthorizationHeader,
  createResponseSignature,
  createWebhookSignature,
  normalizePriceForSignature,
  verifyResponseSignature,
  verifyWebhookSignature,
} = require('../../alpgozluk/v1/helpers/iyzicoSignature');

test('iyzico yanıt imzası resmî parametre sırası ve iki nokta ayırıcıyla üretilir', () => {
  const secretKey = 'sandbox-qaIiLIxhjMgx3LSKIVvp6j17NunHOFtD';
  const values = ['22416032', 'TRY', 'basketId', 'conversationId', '10.5', '10.5'];
  const signature = createResponseSignature(values, secretKey);

  assert.equal(signature, '836c3a6c8db86c81043f2ca74edb13518b54a813f454f8dd762f0dd658610173');
  assert.equal(verifyResponseSignature(values, signature, secretKey), true);
  assert.equal(verifyResponseSignature([...values.slice(0, -1), '10.6'], signature, secretKey), false);
});

test('imza fiyatları iyzico kuralına göre sondaki sıfırlardan arındırılır', () => {
  assert.equal(normalizePriceForSignature('50.00'), '50');
  assert.equal(normalizePriceForSignature('10.51050'), '10.5105');
  assert.equal(normalizePriceForSignature(10.5), '10.5');
});

test('webhook V3 imzası değiştirilmiş bildirimi reddeder', () => {
  const payload = {
    iyziEventType: 'THREE_DS_AUTH',
    paymentId: '25149157',
    paymentConversationId: 'AGP-example',
    status: 'SUCCESS',
  };
  const signature = createWebhookSignature(payload, 'secret-key');

  assert.equal(verifyWebhookSignature(payload, signature, 'secret-key'), true);
  assert.equal(verifyWebhookSignature({ ...payload, status: 'FAILURE' }, signature, 'secret-key'), false);
});

test('IYZWSv2 başlığı gövdenin birebir JSON metnini imzalar', () => {
  const body = '{"binNumber":"41579200"}';
  const randomKey = '1722246017090123456789';
  const path = '/payment/bin/check';
  const secretKey = 'test-secret';
  const header = createAuthorizationHeader({
    apiKey: 'test-api-key', secretKey, path, body, randomKey,
  });
  const decoded = Buffer.from(header.slice('IYZWSv2 '.length), 'base64').toString('utf8');
  const expectedSignature = createHmac('sha256', secretKey)
    .update(`${randomKey}${path}${body}`, 'utf8')
    .digest('hex');

  assert.equal(
    decoded,
    `apiKey:test-api-key&randomKey:${randomKey}&signature:${expectedSignature}`,
  );
});
