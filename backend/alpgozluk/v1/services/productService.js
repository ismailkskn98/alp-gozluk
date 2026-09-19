const { getDb } = require('../models/db');
const cache = require('./cacheService');

const allowedLocales = new Set(['tr', 'en']);

const normalizeLocale = (locale) => allowedLocales.has(locale) ? locale : 'tr';

const listPublished = async (requestedLocale) => {
  const locale = normalizeLocale(requestedLocale);
  const cached = await cache.getJson('catalog', 'products', locale);
  if (cached) return cached;

  const [rows] = await getDb().query(
    `SELECT p.id, p.code, p.brand, p.featured, pt.name, pt.slug,
       pt.short_description AS shortDescription,
       MIN(pv.price) AS price, SUM(pv.stock_quantity) AS stockQuantity
     FROM products p
     INNER JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     LEFT JOIN product_variants pv ON pv.product_id = p.id
       AND pv.status = 'active' AND pv.deleted_at IS NULL
     WHERE p.status = 'published' AND p.deleted_at IS NULL
     GROUP BY p.id, p.code, p.brand, p.featured, pt.name, pt.slug, pt.short_description
     ORDER BY p.featured DESC, p.created_at DESC
     LIMIT 100`,
    [locale],
  );
  await cache.setJson(['catalog', 'products', locale], rows);
  return rows;
};

const findPublishedBySlug = async (requestedLocale, slug) => {
  const locale = normalizeLocale(requestedLocale);
  const cached = await cache.getJson('catalog', 'product', locale, slug);
  if (cached) return cached;

  const [products] = await getDb().query(
    `SELECT p.id, p.code, p.brand, p.featured, p.tax_rate AS taxRate,
       pt.name, pt.slug, pt.short_description AS shortDescription,
       pt.description, pt.seo_title AS seoTitle, pt.seo_description AS seoDescription
     FROM products p
     INNER JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     WHERE pt.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL
     LIMIT 1`,
    [locale, slug],
  );
  if (!products[0]) return null;
  const [variants] = await getDb().query(
    `SELECT id, sku, barcode, color_code AS colorCode, frame_size AS frameSize,
       lens_type AS lensType, price, compare_at_price AS compareAtPrice, stock_quantity AS stockQuantity
     FROM product_variants WHERE product_id = ? AND status = 'active' AND deleted_at IS NULL
     ORDER BY id`,
    [products[0].id],
  );
  const product = { ...products[0], variants };
  await cache.setJson(['catalog', 'product', locale, slug], product);
  return product;
};

const create = async (payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [productResult] = await connection.query(
      `INSERT INTO products (code, brand, status, featured, tax_rate)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.code, payload.brand || 'ALP Gözlük', payload.status, payload.featured ? 1 : 0, payload.taxRate],
    );
    for (const translation of payload.translations) {
      await connection.query(
        `INSERT INTO product_translations
          (product_id, locale, name, slug, short_description, description, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productResult.insertId, translation.locale, translation.name, translation.slug,
          translation.shortDescription || null, translation.description || null,
          translation.seoTitle || null, translation.seoDescription || null],
      );
    }
    for (const variant of payload.variants) {
      await connection.query(
        `INSERT INTO product_variants
          (product_id, sku, barcode, color_code, frame_size, lens_type, price, compare_at_price, cost_price, stock_quantity, low_stock_threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productResult.insertId, variant.sku, variant.barcode || null, variant.colorCode || null,
          variant.frameSize || null, variant.lensType || null, variant.price,
          variant.compareAtPrice || null, variant.costPrice || null,
          variant.stockQuantity, variant.lowStockThreshold],
      );
    }
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
       VALUES (?, 'product.create', 'product', ?, ?, SHA2(?, 256), ?)`,
      [requestMeta.userId, productResult.insertId, requestMeta.requestId, requestMeta.ip, JSON.stringify({ code: payload.code, status: payload.status })],
    );
    await connection.commit();
    await cache.deleteKeys(['catalog', 'products', 'tr'], ['catalog', 'products', 'en']);
    return productResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { create, findPublishedBySlug, listPublished, normalizeLocale };
