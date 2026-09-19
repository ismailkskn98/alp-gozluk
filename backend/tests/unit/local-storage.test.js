const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';

test('local storage kaydetme, URL çözme ve silme sözleşmesini uygular', async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'alp-storage-'));
  process.env.LOCAL_STORAGE_PATH = temporaryDirectory;
  process.env.APP_URL = 'http://localhost:4000';

  const modulePath = require.resolve('../../general_services/storage/localStorage');
  delete require.cache[modulePath];
  const localStorage = require('../../general_services/storage/localStorage');
  const key = 'public/products/test-file.png';

  try {
    const result = await localStorage.save(
      { buffer: Buffer.from('safe-image-data') },
      { key },
    );
    assert.equal(result.key, key);
    assert.equal(await fs.readFile(path.join(temporaryDirectory, key), 'utf8'), 'safe-image-data');
    assert.equal(
      await localStorage.getUrl(key, { visibility: 'public' }),
      'http://localhost:4000/uploads/public/products/test-file.png',
    );
    assert.equal(await localStorage.delete(key), true);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('local storage path traversal girişimini reddeder', async () => {
  const localStorage = require('../../general_services/storage/localStorage');
  assert.throws(() => localStorage.resolveStoragePath('../secret.txt'), /Geçersiz storage key/);
});
