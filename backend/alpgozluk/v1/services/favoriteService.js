const { getStorage } = require('../../../general_services/storage');
const { MAX_GUEST_FAVORITES } = require('../helpers/commerce');
const { getDb } = require('../models/db');

const allowedLocales = new Set(['tr', 'en']);
const normalizeLocale = (locale) => allowedLocales.has(locale) ? locale : 'tr';

const listIds = async (userId) => {
  const [rows] = await getDb().query(
    'SELECT product_id FROM customer_favorites WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return rows.map((row) => row.product_id);
};

const list = async (userId, requestedLocale = 'tr') => {
  const locale = normalizeLocale(requestedLocale);
  const [rows] = await getDb().query(
    `SELECT p.id, COALESCE(pt.slug, fallback_pt.slug, p.code) AS slug,
       COALESCE(pt.name, fallback_pt.name, p.code) AS name,
       MIN(CASE WHEN pv.status = 'active' AND pv.deleted_at IS NULL THEN pv.price END) AS price_amount,
       COUNT(CASE WHEN pv.status = 'active' AND pv.deleted_at IS NULL THEN 1 END) AS active_variant_count,
       MIN(CASE WHEN pv.status = 'active' AND pv.deleted_at IS NULL THEN pv.id END) AS default_variant_id,
       'TRY' AS currency,
       (SELECT m.storage_key FROM media_assets m WHERE m.entity_type = 'product' AND m.entity_id = p.id ORDER BY m.sort_order, m.id LIMIT 1) AS storage_key,
       (SELECT m.storage_driver FROM media_assets m WHERE m.entity_type = 'product' AND m.entity_id = p.id ORDER BY m.sort_order, m.id LIMIT 1) AS storage_driver,
       (SELECT m.visibility FROM media_assets m WHERE m.entity_type = 'product' AND m.entity_id = p.id ORDER BY m.sort_order, m.id LIMIT 1) AS visibility
     FROM customer_favorites cf
     INNER JOIN products p ON p.id = cf.product_id
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     LEFT JOIN product_translations fallback_pt ON fallback_pt.product_id = p.id AND fallback_pt.locale = 'tr'
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     WHERE cf.user_id = ? AND p.status = 'published' AND p.deleted_at IS NULL
     GROUP BY p.id, pt.slug, fallback_pt.slug, p.code, pt.name, fallback_pt.name, cf.created_at
     ORDER BY cf.created_at DESC`,
    [locale, userId],
  );
  return Promise.all(rows.map(async (row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceAmount: row.price_amount === null ? null : Number(row.price_amount),
    currency: row.currency,
    activeVariantCount: Number(row.active_variant_count),
    defaultVariantId: row.default_variant_id,
    imageUrl: row.storage_key
      ? await getStorage(row.storage_driver).getUrl(row.storage_key, { visibility: row.visibility })
      : null,
  })));
};

const add = async (userId, productId) => {
  const [products] = await getDb().query(
    `SELECT id FROM products WHERE id = ? AND status = 'published' AND deleted_at IS NULL LIMIT 1`,
    [productId],
  );
  if (!products[0]) {
    const error = new Error('favorite_product_not_found');
    error.statusCode = 404;
    error.publicMessage = 'Ürün bulunamadı.';
    throw error;
  }
  await getDb().query(
    'INSERT IGNORE INTO customer_favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
  );
};

const remove = async (userId, productId) => {
  await getDb().query(
    'DELETE FROM customer_favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId],
  );
};

const merge = async (userId, productIds) => {
  const uniqueIds = [...new Set(productIds)].slice(0, MAX_GUEST_FAVORITES);
  if (uniqueIds.length === 0) return { mergedIds: [], skippedIds: [] };
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [products] = await connection.query(
      `SELECT id FROM products WHERE id IN (${uniqueIds.map(() => '?').join(', ')})
       AND status = 'published' AND deleted_at IS NULL FOR UPDATE`,
      uniqueIds,
    );
    const validIds = products.map((product) => product.id);
    for (const productId of validIds) {
      await connection.query(
        'INSERT IGNORE INTO customer_favorites (user_id, product_id) VALUES (?, ?)',
        [userId, productId],
      );
    }
    await connection.commit();
    const validSet = new Set(validIds.map(Number));
    return {
      mergedIds: validIds,
      skippedIds: uniqueIds.filter((id) => !validSet.has(Number(id))),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { add, list, listIds, merge, remove };
