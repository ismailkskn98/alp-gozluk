const fs = require('node:fs/promises');
const path = require('node:path');
const { imageSize } = require('image-size');
const { demoProducts } = require('../alpgozluk/v1/seeds/demoCatalog');
const { config } = require('../alpgozluk/v1/config/env');
const { closeDatabase, getDb } = require('../alpgozluk/v1/models/db');
const cache = require('../alpgozluk/v1/services/cacheService');
const { getStorage } = require('../general_services/storage');

const assetRoot = path.resolve(__dirname, '..', 'seed-assets', 'catalog');
const storage = getStorage();

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const slugify = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const readSpecification = (product, locale, keys) => {
  const specifications = product.specifications?.[locale] || {};
  const key = keys.find((candidate) => specifications[candidate]);
  return key ? String(specifications[key]) : null;
};

const numericMeasurement = (value, position) => {
  const matches = String(value || '').match(/\d+/g);
  return matches?.[position] ? Number(matches[position]) : null;
};

const upsertTaxonomy = async (connection) => {
  const brands = [...new Set(demoProducts.map((product) => product.brand))];
  for (const [index, name] of brands.entries()) {
    const code = slugify(name);
    await connection.query(
      `INSERT INTO brands (code, name, slug, status, sort_order)
       VALUES (?, ?, ?, 'active', ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), status = 'active'`,
      [code, name, code, (index + 1) * 10],
    );
  }

  const categories = [
    { code: 'sunglasses', sortOrder: 10, tr: ['Güneş gözlükleri', 'gunes-gozlugu'], en: ['Sunglasses', 'sunglasses'] },
    { code: 'optical', sortOrder: 20, tr: ['Optik çerçeveler', 'optik'], en: ['Optical frames', 'optical'] },
  ];
  for (const category of categories) {
    await connection.query(
      `INSERT INTO categories (code, status, sort_order) VALUES (?, 'active', ?)
       ON DUPLICATE KEY UPDATE status = 'active', sort_order = VALUES(sort_order), deleted_at = NULL`,
      [category.code, category.sortOrder],
    );
    const [[row]] = await connection.query('SELECT id FROM categories WHERE code = ? LIMIT 1', [category.code]);
    for (const locale of ['tr', 'en']) {
      await connection.query(
        `INSERT INTO category_translations (category_id, locale, name, slug)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug)`,
        [row.id, locale, category[locale][0], category[locale][1]],
      );
    }
  }

  await connection.query(
    `INSERT INTO coupons
      (code, discount_type, discount_value, minimum_order_amount, usage_limit, status)
     VALUES ('ALP10', 'percentage', 10, 500, NULL, 'active')
     ON DUPLICATE KEY UPDATE discount_type = 'percentage', discount_value = 10,
       minimum_order_amount = 500, status = 'active'`,
  );
};

const loadReferenceMaps = async (connection) => {
  const [brands] = await connection.query('SELECT id, name FROM brands WHERE deleted_at IS NULL');
  const [audiences] = await connection.query('SELECT id, code FROM audiences WHERE status = \'active\'');
  const [categories] = await connection.query('SELECT id, code FROM categories WHERE deleted_at IS NULL');
  const [attributes] = await connection.query(
    `SELECT av.id, ag.code AS group_code, av.code
     FROM attribute_values av INNER JOIN attribute_groups ag ON ag.id = av.attribute_group_id
     WHERE av.status = 'active' AND ag.status = 'active'`,
  );
  return {
    brands: new Map(brands.map((row) => [row.name, row.id])),
    audiences: new Map(audiences.map((row) => [row.code, row.id])),
    categories: new Map(categories.map((row) => [row.code, row.id])),
    attributes: new Map(attributes.map((row) => [`${row.group_code}:${row.code}`, row.id])),
  };
};

const upsertProduct = async (connection, product, references, index) => {
  const brandId = references.brands.get(product.brand);
  const [productResult] = await connection.query(
    `INSERT INTO products (code, brand, brand_id, status, featured, tax_rate)
     VALUES (?, ?, ?, 'published', ?, 20)
     ON DUPLICATE KEY UPDATE brand = VALUES(brand), brand_id = VALUES(brand_id),
       status = 'published', featured = VALUES(featured), deleted_at = NULL`,
    [product.code, product.brand, brandId, index < 6 ? 1 : 0],
  );
  const productId = productResult.insertId || (await connection.query(
    'SELECT id FROM products WHERE code = ? LIMIT 1', [product.code],
  ))[0][0].id;

  for (const locale of ['tr', 'en']) {
    const isTurkish = locale === 'tr';
    const shortDescription = isTurkish
      ? product.shortDescription
      : `${product.brand} ${product.code} eyewear with a distinctive, everyday design.`;
    await connection.query(
      `INSERT INTO product_translations
        (product_id, locale, name, slug, short_description, description, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug),
         short_description = VALUES(short_description), description = VALUES(description),
         seo_title = VALUES(seo_title), seo_description = VALUES(seo_description)`,
      [productId, locale, product.name, product.slug, shortDescription, shortDescription,
        `${product.name} | ALP Gözlük`, shortDescription],
    );
  }

  const size = readSpecification(product, 'tr', ['Ölçü', 'Model ölçüsü']);
  const colorCode = readSpecification(product, 'tr', ['Renk kodu']);
  const lensCategory = readSpecification(product, 'tr', ['Cam kategorisi', 'Filtre kodu']);
  const uvProtection = readSpecification(product, 'tr', ['UV koruması']);
  const sku = `DEMO-${product.code.replace(/[^A-Za-z0-9-]/g, '-')}`.toUpperCase();
  const [variantRows] = await connection.query('SELECT id FROM product_variants WHERE sku = ? LIMIT 1 FOR UPDATE', [sku]);
  let variantId = variantRows[0]?.id;
  if (variantId) {
    await connection.query(
      `UPDATE product_variants SET product_id = ?, color_code = ?, frame_size = ?,
         lens_width_mm = ?, bridge_width_mm = ?, temple_length_mm = ?, lens_type = ?,
         lens_category = ?, uv_protection = ?, price = ?, compare_at_price = ?,
         low_stock_threshold = 3, status = 'active', deleted_at = NULL WHERE id = ?`,
      [productId, colorCode, size, numericMeasurement(size, 0), numericMeasurement(size, 1),
        numericMeasurement(size, 2), product.features.includes('polarized') ? 'polarized' : null,
        lensCategory, uvProtection, product.price, product.compareAtPrice, variantId],
    );
  } else {
    const [variantResult] = await connection.query(
      `INSERT INTO product_variants
        (product_id, sku, color_code, frame_size, lens_width_mm, bridge_width_mm,
         temple_length_mm, lens_type, lens_category, uv_protection, price, compare_at_price,
         stock_quantity, low_stock_threshold, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 'active')`,
      [productId, sku, colorCode, size, numericMeasurement(size, 0), numericMeasurement(size, 1),
        numericMeasurement(size, 2), product.features.includes('polarized') ? 'polarized' : null,
        lensCategory, uvProtection, product.price, product.compareAtPrice, product.stockQuantity],
    );
    variantId = variantResult.insertId;
    await connection.query(
      `INSERT INTO inventory_movements
        (variant_id, movement_type, quantity, balance_after, reference_type, note)
       VALUES (?, 'initial_stock', ?, ?, 'demo_seed', 'Demo katalog başlangıç stoğu')`,
      [variantId, product.stockQuantity, product.stockQuantity],
    );
  }

  await connection.query('DELETE FROM product_audiences WHERE product_id = ?', [productId]);
  for (const code of product.audiences) {
    const audienceId = references.audiences.get(code);
    if (!audienceId) throw new Error(`Hedef kitle bulunamadı: ${code}`);
    await connection.query('INSERT INTO product_audiences (product_id, audience_id) VALUES (?, ?)', [productId, audienceId]);
  }

  await connection.query('DELETE FROM product_categories WHERE product_id = ?', [productId]);
  const categoryId = references.categories.get(product.productType);
  if (!categoryId) throw new Error(`Kategori bulunamadı: ${product.productType}`);
  await connection.query(
    'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES (?, ?, 1)',
    [productId, categoryId],
  );

  const attributeKeys = [
    `product_type:${product.productType}`,
    ...product.material.map((code) => `frame_material:${code}`),
    ...product.features.map((code) => `lens_feature:${code}`),
  ];
  await connection.query('DELETE FROM product_attribute_values WHERE product_id = ?', [productId]);
  for (const key of attributeKeys) {
    const attributeId = references.attributes.get(key);
    if (!attributeId) throw new Error(`Ürün özelliği bulunamadı: ${key}`);
    await connection.query(
      'INSERT INTO product_attribute_values (product_id, attribute_value_id) VALUES (?, ?)',
      [productId, attributeId],
    );
  }
  return productId;
};

const seedMedia = async (database, productId, product) => {
  const expectedMedia = new Set();

  for (const [index, relativeUrl] of product.images.entries()) {
    const relativeAssetPath = relativeUrl.replace(/^\//, '').replaceAll('/', path.sep);
    const sourcePath = path.resolve(assetRoot, relativeAssetPath);
    if (!sourcePath.startsWith(`${assetRoot}${path.sep}`)) throw new Error(`Geçersiz seed görseli: ${relativeUrl}`);
    const extension = path.extname(sourcePath).toLowerCase();
    const mimeType = mimeTypes[extension];
    if (!mimeType) continue;
    const fileName = `${String(index + 1).padStart(2, '0')}-${slugify(path.basename(sourcePath, extension))}${extension}`;
    const storageKey = `public/products/demo/${product.slug}/${fileName}`;
    expectedMedia.add(`${config.storage.driver}:${storageKey}`);
    const [[existing]] = await database.query(
      'SELECT id FROM media_assets WHERE storage_driver = ? AND storage_key = ? LIMIT 1',
      [config.storage.driver, storageKey],
    );

    const buffer = await fs.readFile(sourcePath);
    const dimensions = imageSize(buffer);
    await storage.save(
      { buffer },
      {
        key: storageKey,
        contentType: mimeType,
        visibility: 'public',
        overwrite: true,
      },
    );

    try {
      await database.query(
        `INSERT INTO media_assets
          (entity_type, entity_id, storage_key, storage_driver, mime_type, size_bytes,
           width, height, alt_text, sort_order, visibility)
         VALUES ('product', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public')
         ON DUPLICATE KEY UPDATE entity_type = 'product', entity_id = VALUES(entity_id),
           mime_type = VALUES(mime_type), size_bytes = VALUES(size_bytes),
           width = VALUES(width), height = VALUES(height), alt_text = VALUES(alt_text),
           sort_order = VALUES(sort_order), visibility = 'public',
           updated_at = UTC_TIMESTAMP(6)`,
        [productId, storageKey, config.storage.driver, mimeType, buffer.length,
          dimensions.width || null, dimensions.height || null, product.name, index],
      );
    } catch (error) {
      if (!existing) await storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  const [existingDemoMedia] = await database.query(
    `SELECT id, storage_key, storage_driver FROM media_assets
     WHERE entity_type = 'product' AND entity_id = ?
       AND storage_key LIKE 'public/products/demo/%'`,
    [productId],
  );

  for (const media of existingDemoMedia) {
    const identity = `${media.storage_driver}:${media.storage_key}`;
    if (expectedMedia.has(identity)) continue;

    await database.query('DELETE FROM media_assets WHERE id = ?', [media.id]);
    await getStorage(media.storage_driver).delete(media.storage_key).catch(() => undefined);
  }
};

const run = async () => {
  const database = getDb();
  const connection = await database.getConnection();
  const seeded = [];
  try {
    await connection.beginTransaction();
    await upsertTaxonomy(connection);
    const references = await loadReferenceMaps(connection);
    for (const [index, product] of demoProducts.entries()) {
      const productId = await upsertProduct(connection, product, references, index);
      seeded.push({ productId, product });
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  for (const entry of seeded) await seedMedia(database, entry.productId, entry.product);
  await cache.deleteByPrefix('catalog');
  process.stdout.write(`${seeded.length} demo ürün ${config.storage.driver} storage ile hazırlandı.\n`);
};

run()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
