const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const { createApp } = require('../../app');

test('liveness endpoint servis durumunu standart response ile döndürür', async () => {
  const response = await request(createApp())
    .get('/api/alpgozluk/v1/health/live')
    .set('Accept-Language', 'tr')
    .expect(200);

  assert.equal(response.body.status, true);
  assert.equal(response.body.data.service, 'alp-gozluk-api');
  assert.ok(response.headers['x-request-id']);
});

test('bilinmeyen endpoint standart 404 response döndürür', async () => {
  const response = await request(createApp())
    .get('/api/alpgozluk/v1/bilinmeyen')
    .expect(404);

  assert.deepEqual(Object.keys(response.body).sort(), ['message', 'status']);
  assert.equal(response.body.status, false);
});
