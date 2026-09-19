const path = require('node:path');
const { imageSize } = require('image-size');
const { createStorageKey } = require('../../../general_helpers/storageKey');

const imageFormats = {
  'image/jpeg': { extensions: new Set(['.jpg', '.jpeg']), outputExtension: 'jpg' },
  'image/png': { extensions: new Set(['.png']), outputExtension: 'png' },
  'image/webp': { extensions: new Set(['.webp']), outputExtension: 'webp' },
  'image/avif': { extensions: new Set(['.avif']), outputExtension: 'avif' },
};

const validateImageFile = async (file, options = {}) => {
  if (!file?.buffer || file.buffer.length === 0) {
    const error = new Error('Boş dosya.');
    error.statusCode = 422;
    throw error;
  }

  const expectedFormat = imageFormats[file.mimetype];
  const originalExtension = path.extname(file.originalname || '').toLowerCase();

  if (!expectedFormat || !expectedFormat.extensions.has(originalExtension)) {
    const error = new Error('Dosya uzantısı veya MIME türü izin verilen listede değil.');
    error.statusCode = 422;
    throw error;
  }

  const { fileTypeFromBuffer } = await import('file-type');
  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType || detectedType.mime !== file.mimetype) {
    const error = new Error('Dosya imzası MIME türüyle eşleşmiyor.');
    error.statusCode = 422;
    throw error;
  }

  let dimensions;
  try {
    dimensions = imageSize(file.buffer);
  } catch (error) {
    const validationError = new Error('Görsel boyutları okunamadı.');
    validationError.statusCode = 422;
    throw validationError;
  }

  if (!dimensions.width || !dimensions.height) {
    const error = new Error('Geçersiz görsel boyutları.');
    error.statusCode = 422;
    throw error;
  }

  const visibility = options.visibility === 'private' ? 'private' : 'public';
  const key = createStorageKey({
    prefix: options.prefix,
    extension: expectedFormat.outputExtension,
    visibility,
  });

  return {
    key,
    contentType: detectedType.mime,
    extension: expectedFormat.outputExtension,
    width: dimensions.width,
    height: dimensions.height,
    visibility,
  };
};

module.exports = { imageFormats, validateImageFile };
