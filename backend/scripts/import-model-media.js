const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { imageSize } = require('image-size');
const { config, validateConfig } = require('../alpgozluk/v1/config/env');
const { closeDatabase, getDb } = require('../alpgozluk/v1/models/db');
const cache = require('../alpgozluk/v1/services/cacheService');
const { imageFormats } = require('../alpgozluk/v1/helpers/imageFile');
const { getStorage } = require('../general_services/storage');

const defaultSourceRoot = path.resolve(__dirname, '../seed-assets/model-media');
const sourceRoot = path.resolve(process.argv[2] || defaultSourceRoot);
const storage = getStorage();

const productMatchers = [
  ['CL40235U', /CL40235U/i],
  ['CL40254U', /CL40254U/i],
  ['DK015', /DK015/i],
  ['FE4075US', /FE4075US/i],
  ['GG1604S', /GG1604S/i],
  ['98299', /98299/i],
  ['PR17WS', /PR17WS/i],
  ['SPR58Y', /SPR58Y/i],
];

const titleCaseModelName = (value) => {
  const normalized = String(value || '').trim().toLocaleLowerCase('tr-TR');
  return normalized ? `${normalized[0].toLocaleUpperCase('tr-TR')}${normalized.slice(1)}` : null;
};

const slugify = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const listFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
};

const getProductCode = (fileName) =>
  productMatchers.find(([, pattern]) => pattern.test(fileName))?.[0] || null;

const inspectSourceFile = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const { fileTypeFromBuffer } = await import('file-type');
  const detectedType = await fileTypeFromBuffer(buffer);
  const expectedFormat = detectedType ? imageFormats[detectedType.mime] : null;

  if (!expectedFormat || !expectedFormat.extensions.has(extension)) {
    throw new Error(`Desteklenmeyen veya uzantısıyla eşleşmeyen görsel: ${filePath}`);
  }
  if (buffer.length > config.storage.maxUploadSizeMb * 1024 * 1024) {
    throw new Error(`Görsel yükleme sınırını aşıyor: ${filePath}`);
  }

  const dimensions = imageSize(buffer);
  if (!dimensions.width || !dimensions.height) throw new Error(`Görsel boyutu okunamadı: ${filePath}`);

  return {
    buffer,
    mimeType: detectedType.mime,
    extension: expectedFormat.outputExtension,
    width: dimensions.width,
    height: dimensions.height,
  };
};

const buildSourceRecords = async () => {
  const files = (await listFiles(sourceRoot)).sort((left, right) => left.localeCompare(right, 'tr'));
  const records = [];

  for (const filePath of files) {
    const productCode = getProductCode(path.basename(filePath));
    if (!productCode) throw new Error(`Ürün kodu eşleştirilemedi: ${filePath}`);
    const relativePath = path.relative(sourceRoot, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Kaynak klasörü dışındaki dosya reddedildi: ${filePath}`);
    }

    const isEditorial = path.dirname(relativePath) === '.';
    const modelName = isEditorial
      ? 'Sueda'
      : titleCaseModelName(relativePath.split(path.sep)[0]);
    const file = await inspectSourceFile(filePath);
    const contentHash = crypto.createHash('sha256').update(file.buffer).digest('hex').slice(0, 20);
    const storageKey = `public/products/model-media/${slugify(productCode)}/${contentHash}.${file.extension}`;

    records.push({
      ...file,
      filePath,
      productCode,
      storageKey,
      mediaRole: isEditorial ? 'editorial' : 'on_model',
      isFeatured: isEditorial,
      modelName,
    });
  }

  return records;
};

const run = async () => {
  validateConfig();
  const database = getDb();
  const records = await buildSourceRecords();
  const productCodes = [...new Set(records.map((record) => record.productCode))];
  const [products] = await database.query(
    `SELECT p.id, p.code, COALESCE(pt.name, p.code) AS name
     FROM products p
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'tr'
     WHERE p.code IN (${productCodes.map(() => '?').join(', ')}) AND p.deleted_at IS NULL`,
    productCodes,
  );
  const productsByCode = new Map(products.map((product) => [product.code, product]));
  const missingCodes = productCodes.filter((code) => !productsByCode.has(code));
  if (missingCodes.length) throw new Error(`Ürün bulunamadı: ${missingCodes.join(', ')}`);

  const expectedStorageKeys = new Set();
  const sortOrderByProduct = new Map();

  for (const record of records.sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured))) {
    const product = productsByCode.get(record.productCode);
    const currentSortOrder = sortOrderByProduct.get(product.id) || 0;
    sortOrderByProduct.set(product.id, currentSortOrder + 10);
    expectedStorageKeys.add(`${config.storage.driver}:${record.storageKey}`);

    await storage.save(
      { buffer: record.buffer },
      {
        key: record.storageKey,
        contentType: record.mimeType,
        visibility: 'public',
        overwrite: true,
      },
    );

    await database.query(
      `INSERT INTO media_assets
        (entity_type, entity_id, storage_key, storage_driver, mime_type, size_bytes,
         width, height, alt_text, media_role, model_name, is_featured, sort_order, visibility)
       VALUES ('product', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public')
       ON DUPLICATE KEY UPDATE entity_type = 'product', entity_id = VALUES(entity_id),
         mime_type = VALUES(mime_type), size_bytes = VALUES(size_bytes), width = VALUES(width),
         height = VALUES(height), alt_text = VALUES(alt_text), media_role = VALUES(media_role),
         model_name = VALUES(model_name), is_featured = VALUES(is_featured),
         sort_order = VALUES(sort_order), visibility = 'public', updated_at = UTC_TIMESTAMP(6)`,
      [
        product.id,
        record.storageKey,
        config.storage.driver,
        record.mimeType,
        record.buffer.length,
        record.width,
        record.height,
        `${product.name} gözlük`,
        record.mediaRole,
        record.modelName,
        record.isFeatured ? 1 : 0,
        currentSortOrder,
      ],
    );
  }

  const [staleMedia] = await database.query(
    `SELECT id, storage_key, storage_driver FROM media_assets
     WHERE storage_key LIKE 'public/products/model-media/%'`,
  );
  for (const media of staleMedia) {
    if (expectedStorageKeys.has(`${media.storage_driver}:${media.storage_key}`)) continue;
    await database.query('DELETE FROM media_assets WHERE id = ?', [media.id]);
    await getStorage(media.storage_driver).delete(media.storage_key).catch(() => undefined);
  }

  await cache.deleteByPrefix('catalog');
  console.log(`${records.length} model görseli ${productCodes.length} ürüne bağlandı.`);
};

run()
  .catch((error) => {
    console.error(`Model görselleri içe aktarılamadı: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
