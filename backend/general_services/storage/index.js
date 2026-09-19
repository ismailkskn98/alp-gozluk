const { config } = require('../../alpgozluk/v1/config/env');
const localStorage = require('./localStorage');
const s3Storage = require('./s3Storage');

const adapters = {
  local: localStorage,
  s3: s3Storage,
};

const getStorage = (driver = config.storage.driver) => {
  const adapter = adapters[driver];
  if (!adapter) throw new Error(`Desteklenmeyen storage driver: ${driver}`);
  return adapter;
};

module.exports = { getStorage };
