const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.ADMIN_2FA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const {
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpToken,
  hashRecoveryCode,
  verifyTotpToken,
} = require('../../alpgozluk/v1/services/totpService');

const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

test('TOTP RFC 6238 SHA1 vektöründen 6 haneli kod üretir', () => {
  assert.equal(generateTotpToken(rfcSecret, 1), '287082');
  assert.equal(verifyTotpToken({ secret: rfcSecret, token: '287082', now: 59_000, window: 0 }), 1);
});

test('TOTP aynı zaman adımındaki kodun yeniden kullanılmasını reddeder', () => {
  assert.equal(verifyTotpToken({
    secret: rfcSecret,
    token: '287082',
    now: 59_000,
    window: 0,
    lastUsedStep: 1,
  }), null);
});

test('TOTP secret veritabanına yazılmadan önce şifrelenir', () => {
  const encrypted = encryptTotpSecret(rfcSecret);
  assert.notEqual(encrypted, rfcSecret);
  assert.equal(decryptTotpSecret(encrypted), rfcSecret);
});

test('kurtarma kodu tek kullanımlık olarak tüketilir', () => {
  const [recoveryCode] = generateRecoveryCodes();
  const hashes = [hashRecoveryCode(recoveryCode)];
  assert.deepEqual(consumeRecoveryCode(hashes, recoveryCode), []);
  assert.equal(consumeRecoveryCode([], recoveryCode), null);
});
