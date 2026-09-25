const fs = require('node:fs/promises');
const path = require('node:path');
const { config } = require('../../alpgozluk/v1/config/env');
const { encodeStorageKey } = require('../../general_helpers/storageKey');

const rootPath = config.storage.localPath;

const resolveStoragePath = (storageKey) => {
  const normalizedKey = String(storageKey).replaceAll('\\', '/');

  if (!normalizedKey || normalizedKey.startsWith('/') || normalizedKey.includes('../')) {
    throw new Error('Geçersiz storage key.');
  }

  const absolutePath = path.resolve(rootPath, normalizedKey);
  if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error('Storage alanı dışına erişim engellendi.');
  }

  return absolutePath;
};

const save = async (file, options) => {
  const absolutePath = resolveStoragePath(options.key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, file.buffer, { flag: options.overwrite ? 'w' : 'wx' });
  return { key: options.key, driver: 'local' };
};

const remove = async (storageKey) => {
  const absolutePath = resolveStoragePath(storageKey);

  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
};

const getUrl = async (storageKey, options = {}) => {
  if (options.visibility === 'private') return null;
  return `${config.appUrl.replace(/\/$/, '')}/uploads/${encodeStorageKey(storageKey)}`;
};

module.exports = { save, delete: remove, getUrl, resolveStoragePath };
