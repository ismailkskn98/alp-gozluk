const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
const { createGoogleNonce, consumeGoogleNonce } = require('../../alpgozluk/v1/services/googleNonceService');

test('Google nonce tek kullanımlıktır', async () => {
  const { nonce, expiresIn } = await createGoogleNonce();

  assert.match(nonce, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(expiresIn, 600);
  assert.equal(await consumeGoogleNonce(nonce), true);
  assert.equal(await consumeGoogleNonce(nonce), false);
});
