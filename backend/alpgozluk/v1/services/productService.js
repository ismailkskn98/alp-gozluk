const { getStorage } = require('../../../general_services/storage');
const { resolveAudienceCodes } = require('../helpers/productFilters');
const { getDb } = require('../models/db');
const cache = require('./cacheService');
const { MAX_CART_LINE_QUANTITY } = require('../helpers/commerce');

const allowedLocales = new Set(['tr', 'en']);
const normalizeLocale = (locale) => allowedLocales.has(locale) ? locale : 'tr';

const createValidationError = () => {
  const error = new Error('Geçersiz katalog ilişkisi.');
  error.statusCode = 422;
  error.publicMessage = 'Gönderilen katalog ilişkilerinden biri geçersiz.';
  return error;
};

const attachMedia = async (products) => {
  if (products.length === 0) return products;
  const ids = products.map((product) => product.id);
  const [mediaRows] = await getDb().query(
    `SELECT entity_id AS productId, storage_key AS storageKey, storage_driver AS storageDriver,
       visibility, alt_text AS altText, sort_order AS sortOrder
     FROM media_assets
     WHERE entity_type = 'product' AND entity_id IN (${ids.map(() => '?').join(', ')})
     ORDER BY entity_id, sort_order, id`,
    ids,
  );
  const mediaByProduct = new Map();
  for (const media of mediaRows) {
    const resolved = {
      url: await getStorage(media.storageDriver).getUrl(media.storageKey, { visibility: media.visibility }),
      altText: media.altText,
      sortOrder: media.sortOrder,
    };
    const current = mediaByProduct.get(media.productId) || [];
    current.push(resolved);
    mediaByProduct.set(media.productId, current);
  }
  return products.map((product) => ({ ...product, images: mediaByProduct.get(product.id) || [] }));
};

const addAttributeFilter = (conditions, parameters, groupCode, values) => {
  if (!values?.length) return;
  conditions.push(
    `EXISTS (
      SELECT 1 FROM product_attribute_values filter_pav
      INNER JOIN attribute_values filter_av ON filter_av.id = filter_pav.attribute_value_id
      INNER JOIN attribute_groups filter_ag ON filter_ag.id = filter_av.attribute_group_id
      WHERE filter_pav.product_id = p.id AND filter_ag.code = ?
        AND filter_av.code IN (${values.map(() => '?').join(', ')})
    )`,
  );
  parameters.push(groupCode, ...values);
};

const listPublished = async (requestedLocale, filters = {}) => {
  const locale = normalizeLocale(requestedLocale);
  const cacheKey = ['catalog', 'products', locale, Buffer.from(JSON.stringify(filters)).toString('base64url')];
  const cached = await cache.getJson(...cacheKey);
  if (cached) return cached;

  const conditions = ["p.status = 'published'", 'p.deleted_at IS NULL'];
  const parameters = [locale];
  if (filters.audience) {
    const audienceCodes = resolveAudienceCodes(filters.audience);
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_audiences filter_pa
        INNER JOIN audiences filter_a ON filter_a.id = filter_pa.audience_id
        WHERE filter_pa.product_id = p.id AND filter_a.status = 'active'
          AND filter_a.code IN (${audienceCodes.map(() => '?').join(', ')})
      )`,
    );
    parameters.push(...audienceCodes);
  }
  if (filters.productType) addAttributeFilter(conditions, parameters, 'product_type', [filters.productType]);
  addAttributeFilter(conditions, parameters, 'frame_material', filters.material);
  addAttributeFilter(conditions, parameters, 'frame_shape', filters.shape);
  addAttributeFilter(conditions, parameters, 'lens_feature', filters.feature);
  if (filters.category) {
    conditions.push(
      `EXISTS (SELECT 1 FROM product_categories filter_pc
        INNER JOIN category_translations filter_ct ON filter_ct.category_id = filter_pc.category_id AND filter_ct.locale = ?
        WHERE filter_pc.product_id = p.id AND filter_ct.slug = ?)`,
    );
    parameters.push(locale, filters.category);
  }
  if (filters.collection) {
    conditions.push(
      `EXISTS (SELECT 1 FROM collection_products filter_cp
        INNER JOIN collection_translations filter_cot ON filter_cot.collection_id = filter_cp.collection_id AND filter_cot.locale = ?
        INNER JOIN collections filter_co ON filter_co.id = filter_cp.collection_id
        WHERE filter_cp.product_id = p.id AND filter_cot.slug = ? AND filter_co.status = 'active'
          AND (filter_co.starts_at IS NULL OR filter_co.starts_at <= UTC_TIMESTAMP(6))
          AND (filter_co.ends_at IS NULL OR filter_co.ends_at >= UTC_TIMESTAMP(6)))`,
    );
    parameters.push(locale, filters.collection);
  }
  if (filters.sale) conditions.push('EXISTS (SELECT 1 FROM product_variants sale_pv WHERE sale_pv.product_id = p.id AND sale_pv.compare_at_price > sale_pv.price AND sale_pv.deleted_at IS NULL)');
  if (filters.search) {
    conditions.push('(pt.name LIKE ? OR pt.short_description LIKE ? OR p.code LIKE ? OR p.brand LIKE ?)');
    const term = `%${filters.search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    parameters.push(term, term, term, term);
  }

  const orderBy = {
    featured: 'p.featured DESC, p.created_at DESC',
    newest: 'p.created_at DESC',
    'price-asc': 'price ASC, p.created_at DESC',
    'price-desc': 'price DESC, p.created_at DESC',
    popular: 'p.featured DESC, p.created_at DESC',
  }[filters.sort || 'featured'];
  const limit = filters.limit || 24;
  const offset = ((filters.page || 1) - 1) * limit;
  parameters.push(limit, offset);

  const [rows] = await getDb().query(
    `SELECT p.id, p.code, COALESCE(b.name, p.brand) AS brand, p.featured, pt.name, pt.slug,
       pt.short_description AS shortDescription,
       MIN(pv.price) AS price, MAX(pv.compare_at_price) AS compareAtPrice,
       SUM(pv.stock_quantity) AS stockQuantity,
       COUNT(pv.id) AS activeVariantCount, MIN(pv.id) AS defaultVariantId,
       ${MAX_CART_LINE_QUANTITY} AS maxPerOrder
     FROM products p
     INNER JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
     LEFT JOIN product_variants pv ON pv.product_id = p.id
       AND pv.status = 'active' AND pv.deleted_at IS NULL
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id, p.code, b.name, p.brand, p.featured, pt.name, pt.slug, pt.short_description
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    parameters,
  );
  const products = await attachMedia(rows);
  const result = { products, pagination: { page: filters.page || 1, limit, hasMore: products.length === limit } };
  await cache.setJson(cacheKey, result);
  return result;
};

const listAdmin = async (requestedLocale = 'tr') => {
  const locale = normalizeLocale(requestedLocale);
  const [rows] = await getDb().query(
    `SELECT p.id, p.code, COALESCE(b.name, p.brand) AS brand, p.status, p.featured,
       COALESCE(pt.name, p.code) AS name, COALESCE(pt.slug, p.code) AS slug,
       MIN(pv.price) AS price, SUM(pv.stock_quantity) AS stockQuantity,
       GROUP_CONCAT(DISTINCT COALESCE(at.name, a.code) ORDER BY a.sort_order SEPARATOR ', ') AS audiences,
       p.updated_at AS updatedAt
     FROM products p
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
     LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
     LEFT JOIN product_audiences pa ON pa.product_id = p.id
     LEFT JOIN audiences a ON a.id = pa.audience_id
     LEFT JOIN audience_translations at ON at.audience_id = a.id AND at.locale = ?
     WHERE p.deleted_at IS NULL
     GROUP BY p.id, p.code, b.name, p.brand, p.status, p.featured, pt.name, pt.slug, p.updated_at
     ORDER BY p.updated_at DESC
     LIMIT 200`,
    [locale, locale],
  );
  return rows;
};

const findPublishedBySlug = async (requestedLocale, slug) => {
  const locale = normalizeLocale(requestedLocale);
  const cached = await cache.getJson('catalog', 'product', locale, slug);
  if (cached) return cached;

  const [products] = await getDb().query(
    `SELECT p.id, p.code, COALESCE(b.name, p.brand) AS brand, p.featured, p.tax_rate AS taxRate,
       p.origin_country_code AS originCountryCode,
       pt.name, pt.slug, pt.short_description AS shortDescription,
       pt.description, pt.seo_title AS seoTitle, pt.seo_description AS seoDescription
     FROM products p
     INNER JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
     WHERE pt.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL
     LIMIT 1`,
    [locale, slug],
  );
  if (!products[0]) return null;
  const productId = products[0].id;
  const [variants, audiences, attributes] = await Promise.all([
    getDb().query(
      `SELECT id, sku, barcode, color_code AS colorCode, frame_size AS frameSize,
         lens_width_mm AS lensWidthMm, bridge_width_mm AS bridgeWidthMm,
         temple_length_mm AS templeLengthMm, lens_type AS lensType,
         lens_category AS lensCategory, uv_protection AS uvProtection,
         price, compare_at_price AS compareAtPrice, stock_quantity AS stockQuantity
       FROM product_variants WHERE product_id = ? AND status = 'active' AND deleted_at IS NULL ORDER BY id`,
      [productId],
    ),
    getDb().query(
      `SELECT a.code, COALESCE(at.name, a.code) AS name FROM product_audiences pa
       INNER JOIN audiences a ON a.id = pa.audience_id
       LEFT JOIN audience_translations at ON at.audience_id = a.id AND at.locale = ?
       WHERE pa.product_id = ? ORDER BY a.sort_order`,
      [locale, productId],
    ),
    getDb().query(
      `SELECT ag.code AS groupCode, COALESCE(agt.name, ag.code) AS groupName,
         av.code, COALESCE(avt.name, av.code) AS name
       FROM product_attribute_values pav
       INNER JOIN attribute_values av ON av.id = pav.attribute_value_id
       INNER JOIN attribute_groups ag ON ag.id = av.attribute_group_id
       LEFT JOIN attribute_group_translations agt ON agt.attribute_group_id = ag.id AND agt.locale = ?
       LEFT JOIN attribute_value_translations avt ON avt.attribute_value_id = av.id AND avt.locale = ?
       WHERE pav.product_id = ? ORDER BY ag.sort_order, av.sort_order`,
      [locale, locale, productId],
    ),
  ]);
  const [productWithMedia] = await attachMedia([products[0]]);
  const product = { ...productWithMedia, variants: variants[0], audiences: audiences[0], attributes: attributes[0] };
  await cache.setJson(['catalog', 'product', locale, slug], product);
  return product;
};

const validateRelations = async (connection, payload) => {
  const checks = [
    ['audiences', payload.audienceIds],
    ['categories', payload.categoryIds || []],
    ['collections', payload.collectionIds || []],
  ];
  if (!payload.audienceIds?.length) throw createValidationError();
  for (const [table, ids] of checks) {
    if (!ids.length) continue;
    const [rows] = await connection.query(`SELECT id FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`, ids);
    if (rows.length !== new Set(ids).size) throw createValidationError();
  }
  if (payload.brandId) {
    const [brands] = await connection.query('SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL', [payload.brandId]);
    if (!brands[0]) throw createValidationError();
  }
  const attributeIds = [
    ...(payload.productAttributeValueIds || []),
    ...payload.variants.flatMap((variant) => variant.attributeValueIds || []),
  ];
  if (attributeIds.length) {
    const [rows] = await connection.query(
      `SELECT av.id, ag.scope FROM attribute_values av
       INNER JOIN attribute_groups ag ON ag.id = av.attribute_group_id
       WHERE av.id IN (${attributeIds.map(() => '?').join(', ')}) AND av.status = 'active' AND ag.status = 'active'`,
      attributeIds,
    );
    const scopes = new Map(rows.map((row) => [row.id, row.scope]));
    if ((payload.productAttributeValueIds || []).some((id) => scopes.get(id) !== 'product')) throw createValidationError();
    if (payload.variants.some((variant) => (variant.attributeValueIds || []).some((id) => scopes.get(id) !== 'variant'))) throw createValidationError();
  }
};

const insertLinks = async (connection, table, columns, rows) => {
  for (const row of rows) {
    await connection.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      row,
    );
  }
};

const create = async (payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    await validateRelations(connection, payload);
    const [productResult] = await connection.query(
      `INSERT INTO products (code, brand, brand_id, status, featured, tax_rate, origin_country_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payload.code, payload.brand || 'ALP Gözlük', payload.brandId || null, payload.status,
        payload.featured ? 1 : 0, payload.taxRate, payload.originCountryCode?.trim().toUpperCase() || null],
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
      const [variantResult] = await connection.query(
        `INSERT INTO product_variants
          (product_id, sku, barcode, color_code, frame_size, lens_width_mm, bridge_width_mm,
           temple_length_mm, lens_type, lens_category, uv_protection, price, compare_at_price,
           cost_price, stock_quantity, low_stock_threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productResult.insertId, variant.sku, variant.barcode || null, variant.colorCode || null,
          variant.frameSize || null, variant.lensWidthMm || null, variant.bridgeWidthMm || null,
          variant.templeLengthMm || null, variant.lensType || null, variant.lensCategory || null,
          variant.uvProtection || null, variant.price, variant.compareAtPrice || null,
          variant.costPrice || null, variant.stockQuantity, variant.lowStockThreshold],
      );
      await insertLinks(connection, 'variant_attribute_values', ['variant_id', 'attribute_value_id'],
        (variant.attributeValueIds || []).map((id) => [variantResult.insertId, id]));
    }
    await insertLinks(connection, 'product_audiences', ['product_id', 'audience_id'], payload.audienceIds.map((id) => [productResult.insertId, id]));
    await insertLinks(connection, 'product_categories', ['product_id', 'category_id', 'is_primary'],
      (payload.categoryIds || []).map((id, index) => [productResult.insertId, id, index === 0 ? 1 : 0]));
    await insertLinks(connection, 'collection_products', ['collection_id', 'product_id', 'sort_order'],
      (payload.collectionIds || []).map((id, index) => [id, productResult.insertId, index]));
    await insertLinks(connection, 'product_attribute_values', ['product_id', 'attribute_value_id'],
      (payload.productAttributeValueIds || []).map((id) => [productResult.insertId, id]));
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
       VALUES (?, 'product.create', 'product', ?, ?, SHA2(?, 256), ?)`,
      [requestMeta.userId, productResult.insertId, requestMeta.requestId, requestMeta.ip, JSON.stringify({ code: payload.code, status: payload.status })],
    );
    await connection.commit();
    await cache.deleteByPrefix('catalog', 'products');
    return productResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { create, findPublishedBySlug, listAdmin, listPublished, normalizeLocale };
