const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const { createApp } = require('../../app');

test('admin medya endpointi tokensız istekleri reddeder', async () => {
  const response = await request(createApp())
    .get('/api/alpgozluk/v1/admin/media/list')
    .expect(401);

  assert.equal(response.body.status, false);
  assert.ok(response.body.message);
});

test('admin ürün oluşturma endpointi tokensız istekleri reddeder', async () => {
  const response = await request(createApp())
    .post('/api/alpgozluk/v1/admin/products')
    .send({})
    .expect(401);

  assert.equal(response.body.status, false);
  assert.ok(response.body.message);
});

test('admin katalog ve navigasyon endpointleri tokensız istekleri reddeder', async () => {
  const app = createApp();
  await request(app).get('/api/alpgozluk/v1/admin/catalog').expect(401);
  await request(app).get('/api/alpgozluk/v1/admin/navigation/header').expect(401);
  await request(app).get('/api/alpgozluk/v1/admin/announcements').expect(401);
  await request(app).put('/api/alpgozluk/v1/admin/announcements/reorder').send({ ids: [1] }).expect(401);
});

test('süper admin kullanıcı yönetimi endpointi tokensız istekleri reddeder', async () => {
  const response = await request(createApp())
    .get('/api/alpgozluk/v1/admin/users')
    .expect(401);

  assert.equal(response.body.status, false);
  assert.ok(response.body.message);
});

test('public ürün filtreleri allowlist dışındaki hedef kitleyi reddeder', async () => {
  const response = await request(createApp())
    .get('/api/alpgozluk/v1/products?audience=women%27%20OR%201=1')
    .expect(422);

  assert.equal(response.body.status, false);
});

test('Google auth endpointi eksik veya biçimsiz token bilgisini reddeder', async () => {
  const response = await request(createApp())
    .post('/api/alpgozluk/v1/auth/google')
    .send({ idToken: 'gecersiz', nonce: 'gecersiz' })
    .expect(422);

  assert.equal(response.body.status, false);
});

test('Google nonce endpointi tek kullanımlık bir challenge üretir', async () => {
  const response = await request(createApp())
    .get('/api/alpgozluk/v1/auth/google/nonce')
    .expect(200);

  assert.equal(response.body.status, true);
  assert.match(response.body.data.nonce, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(response.body.data.expiresIn, 600);
});

test('auth rate limit Redis yokken güvenli memory fallback ile çalışır', async () => {
  const app = createApp();
  let finalResponse;

  for (let index = 0; index < 11; index += 1) {
    finalResponse = await request(app)
      .post('/api/alpgozluk/v1/auth/login')
      .send({ email: 'gecersiz', password: '' });
  }

  assert.equal(finalResponse.status, 429);
  assert.equal(finalResponse.body.status, false);
});
