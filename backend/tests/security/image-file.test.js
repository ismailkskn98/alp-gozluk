const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
const { validateImageFile } = require('../../alpgozluk/v1/helpers/imageFile');

const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('gerçek PNG imzası ve boyutları doğrulanır', async () => {
  const result = await validateImageFile(
    {
      buffer: pngBuffer,
      mimetype: 'image/png',
      originalname: 'urun.png',
      size: pngBuffer.length,
    },
    { prefix: 'products', visibility: 'public' },
  );

  assert.equal(result.contentType, 'image/png');
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.match(result.key, /^public\/products\/[a-f0-9-]+\.png$/);
});

test('dosya imzasıyla eşleşmeyen MIME türü reddedilir', async () => {
  await assert.rejects(
    validateImageFile(
      {
        buffer: pngBuffer,
        mimetype: 'image/jpeg',
        originalname: 'urun.jpg',
        size: pngBuffer.length,
      },
      { prefix: 'products' },
    ),
    /Dosya imzası/,
  );
});
