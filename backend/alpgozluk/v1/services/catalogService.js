const { getDb } = require('../models/db');
const cache = require('./cacheService');

const normalizeLocale = (locale) => ['tr', 'en'].includes(locale) ? locale : 'tr';

const writeAudit = async (connection, requestMeta, action, resource, id, payload = {}) => {
  if (!requestMeta?.userId) return;
  await connection.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
     VALUES (?, ?, ?, ?, ?, SHA2(?, 256), ?)`,
    [requestMeta.userId, action, resource, id, requestMeta.requestId, requestMeta.ip || '', JSON.stringify(payload)],
  );
};

const listCatalog = async (requestedLocale = 'tr', includeInactive = false) => {
  const locale = normalizeLocale(requestedLocale);
  const statusCondition = includeInactive ? '' : "AND source.status = 'active'";
  const db = getDb();

  const [brandsResult, audiencesResult, categoriesResult, collectionsResult, groupsResult, valuesResult] = await Promise.all([
    db.query(
      `SELECT source.id, source.code, source.name, source.slug, source.status, source.sort_order AS sortOrder
       FROM brands source WHERE source.deleted_at IS NULL ${statusCondition}
       ORDER BY source.sort_order, source.name`,
    ),
    db.query(
      `SELECT source.id, source.code, COALESCE(t.name, source.code) AS name,
         COALESCE(t.slug, source.code) AS slug, source.status, source.sort_order AS sortOrder
       FROM audiences source
       LEFT JOIN audience_translations t ON t.audience_id = source.id AND t.locale = ?
       WHERE 1 = 1 ${statusCondition}
       ORDER BY source.sort_order, source.id`,
      [locale],
    ),
    db.query(
      `SELECT source.id, source.parent_id AS parentId, source.code, COALESCE(t.name, source.code) AS name,
         COALESCE(t.slug, source.code) AS slug, t.description, source.status, source.sort_order AS sortOrder
       FROM categories source
       LEFT JOIN category_translations t ON t.category_id = source.id AND t.locale = ?
       WHERE source.deleted_at IS NULL ${statusCondition}
       ORDER BY source.sort_order, source.id`,
      [locale],
    ),
    db.query(
      `SELECT source.id, source.code, COALESCE(t.name, source.code) AS name,
         COALESCE(t.slug, source.code) AS slug, t.description, source.status,
         source.sort_order AS sortOrder, source.starts_at AS startsAt, source.ends_at AS endsAt
       FROM collections source
       LEFT JOIN collection_translations t ON t.collection_id = source.id AND t.locale = ?
       WHERE source.deleted_at IS NULL ${statusCondition}
       ORDER BY source.sort_order, source.id`,
      [locale],
    ),
    db.query(
      `SELECT source.id, source.code, source.scope, source.selection_mode AS selectionMode,
         source.filterable, COALESCE(t.name, source.code) AS name, source.status,
         source.sort_order AS sortOrder
       FROM attribute_groups source
       LEFT JOIN attribute_group_translations t ON t.attribute_group_id = source.id AND t.locale = ?
       WHERE 1 = 1 ${statusCondition}
       ORDER BY source.sort_order, source.id`,
      [locale],
    ),
    db.query(
      `SELECT source.id, source.attribute_group_id AS groupId, source.code,
         COALESCE(t.name, source.code) AS name, COALESCE(t.slug, source.code) AS slug,
         source.swatch_value AS swatchValue, source.status, source.sort_order AS sortOrder
       FROM attribute_values source
       LEFT JOIN attribute_value_translations t ON t.attribute_value_id = source.id AND t.locale = ?
       WHERE 1 = 1 ${statusCondition}
       ORDER BY source.sort_order, source.id`,
      [locale],
    ),
  ]);

  const valuesByGroup = new Map();
  for (const value of valuesResult[0]) {
    const values = valuesByGroup.get(value.groupId) || [];
    values.push(value);
    valuesByGroup.set(value.groupId, values);
  }

  return {
    brands: brandsResult[0],
    audiences: audiencesResult[0],
    categories: categoriesResult[0],
    collections: collectionsResult[0],
    attributeGroups: groupsResult[0].map((group) => ({ ...group, values: valuesByGroup.get(group.id) || [] })),
  };
};

const getTranslations = async (resource, id) => {
  const mappings = {
    audiences: ['audience_translations', 'audience_id', true],
    categories: ['category_translations', 'category_id', true],
    collections: ['collection_translations', 'collection_id', true],
    'attribute-groups': ['attribute_group_translations', 'attribute_group_id', false],
    'attribute-values': ['attribute_value_translations', 'attribute_value_id', true],
  };
  const mapping = mappings[resource];
  if (!mapping) return [];
  const slugField = mapping[2] ? ', slug' : '';
  const [rows] = await getDb().query(
    `SELECT locale, name${slugField} FROM ${mapping[0]} WHERE ${mapping[1]} = ? ORDER BY locale`,
    [id],
  );
  return rows;
};

const listResource = async (resource, locale = 'tr') => {
  const catalog = await listCatalog(locale, true);
  const map = {
    audiences: catalog.audiences,
    brands: catalog.brands,
    categories: catalog.categories,
    collections: catalog.collections,
    'attribute-groups': catalog.attributeGroups.map(({ values, ...group }) => group),
    'attribute-values': catalog.attributeGroups.flatMap((group) => group.values.map((value) => ({ ...value, groupName: group.name }))),
  };
  const records = map[resource] || [];
  if (resource === 'brands') return records;
  return Promise.all(records.map(async (record) => ({ ...record, translations: await getTranslations(resource, record.id) })));
};

const writeTranslations = async (connection, resource, id, translations) => {
  const mappings = {
    audiences: ['audience_translations', 'audience_id', true],
    categories: ['category_translations', 'category_id', true],
    collections: ['collection_translations', 'collection_id', true],
    'attribute-groups': ['attribute_group_translations', 'attribute_group_id', false],
    'attribute-values': ['attribute_value_translations', 'attribute_value_id', true],
  };
  const [table, foreignKey, hasSlug] = mappings[resource];

  for (const translation of translations) {
    if (hasSlug) {
      await connection.query(
        `INSERT INTO ${table} (${foreignKey}, locale, name, slug) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug)`,
        [id, translation.locale, translation.name, translation.slug],
      );
    } else {
      await connection.query(
        `INSERT INTO ${table} (${foreignKey}, locale, name) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [id, translation.locale, translation.name],
      );
    }
  }
};

const createResource = async (resource, payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    let result;
    if (resource === 'brands') {
      [result] = await connection.query(
        'INSERT INTO brands (code, name, slug, status, sort_order) VALUES (?, ?, ?, ?, ?)',
        [payload.code, payload.name, payload.slug, payload.status, payload.sortOrder],
      );
    } else if (resource === 'audiences') {
      [result] = await connection.query(
        'INSERT INTO audiences (code, status, sort_order) VALUES (?, ?, ?)',
        [payload.code, payload.status, payload.sortOrder],
      );
    } else if (resource === 'categories') {
      [result] = await connection.query(
        'INSERT INTO categories (parent_id, code, status, sort_order) VALUES (?, ?, ?, ?)',
        [payload.parentId, payload.code, payload.status, payload.sortOrder],
      );
    } else if (resource === 'collections') {
      [result] = await connection.query(
        'INSERT INTO collections (code, status, sort_order, starts_at, ends_at) VALUES (?, ?, ?, ?, ?)',
        [payload.code, payload.status, payload.sortOrder, payload.startsAt, payload.endsAt],
      );
    } else if (resource === 'attribute-groups') {
      [result] = await connection.query(
        'INSERT INTO attribute_groups (code, scope, selection_mode, filterable, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [payload.code, payload.scope, payload.selectionMode, payload.filterable ? 1 : 0, payload.status, payload.sortOrder],
      );
    } else {
      [result] = await connection.query(
        'INSERT INTO attribute_values (attribute_group_id, code, swatch_value, status, sort_order) VALUES (?, ?, ?, ?, ?)',
        [payload.groupId, payload.code, payload.swatchValue, payload.status, payload.sortOrder],
      );
    }

    if (resource !== 'brands') await writeTranslations(connection, resource, result.insertId, payload.translations);
    await writeAudit(connection, requestMeta, 'catalog.create', resource, result.insertId, { code: payload.code });
    await connection.commit();
    await Promise.all([
      cache.deleteKeys(['catalog', 'facets', 'tr'], ['catalog', 'facets', 'en']),
      cache.deleteByPrefix('catalog', 'products'),
    ]);
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateResource = async (resource, id, payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    let result;
    if (resource === 'brands') {
      [result] = await connection.query(
        'UPDATE brands SET code = ?, name = ?, slug = ?, status = ?, sort_order = ? WHERE id = ? AND deleted_at IS NULL',
        [payload.code, payload.name, payload.slug, payload.status, payload.sortOrder, id],
      );
    } else if (resource === 'audiences') {
      [result] = await connection.query('UPDATE audiences SET code = ?, status = ?, sort_order = ? WHERE id = ?', [payload.code, payload.status, payload.sortOrder, id]);
    } else if (resource === 'categories') {
      if (payload.parentId === id) {
        await connection.rollback();
        return false;
      }
      [result] = await connection.query(
        'UPDATE categories SET parent_id = ?, code = ?, status = ?, sort_order = ? WHERE id = ? AND deleted_at IS NULL',
        [payload.parentId, payload.code, payload.status, payload.sortOrder, id],
      );
    } else if (resource === 'collections') {
      [result] = await connection.query(
        'UPDATE collections SET code = ?, status = ?, sort_order = ?, starts_at = ?, ends_at = ? WHERE id = ? AND deleted_at IS NULL',
        [payload.code, payload.status, payload.sortOrder, payload.startsAt, payload.endsAt, id],
      );
    } else if (resource === 'attribute-groups') {
      [result] = await connection.query(
        'UPDATE attribute_groups SET code = ?, scope = ?, selection_mode = ?, filterable = ?, status = ?, sort_order = ? WHERE id = ?',
        [payload.code, payload.scope, payload.selectionMode, payload.filterable ? 1 : 0, payload.status, payload.sortOrder, id],
      );
    } else {
      [result] = await connection.query(
        'UPDATE attribute_values SET attribute_group_id = ?, code = ?, swatch_value = ?, status = ?, sort_order = ? WHERE id = ?',
        [payload.groupId, payload.code, payload.swatchValue, payload.status, payload.sortOrder, id],
      );
    }

    if (result.affectedRows === 0) {
      await connection.rollback();
      return false;
    }
    if (resource !== 'brands') await writeTranslations(connection, resource, id, payload.translations);
    await writeAudit(connection, requestMeta, 'catalog.update', resource, id, { code: payload.code, status: payload.status });
    await connection.commit();
    await Promise.all([
      cache.deleteKeys(['catalog', 'facets', 'tr'], ['catalog', 'facets', 'en']),
      cache.deleteByPrefix('catalog', 'products'),
    ]);
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const archiveResource = async (resource, id, requestMeta) => {
  const mappings = {
    audiences: ['audiences', 'status = \'archived\''],
    brands: ['brands', 'deleted_at = UTC_TIMESTAMP(6), status = \'archived\''],
    categories: ['categories', 'deleted_at = UTC_TIMESTAMP(6), status = \'archived\''],
    collections: ['collections', 'deleted_at = UTC_TIMESTAMP(6), status = \'archived\''],
    'attribute-groups': ['attribute_groups', 'status = \'archived\''],
    'attribute-values': ['attribute_values', 'status = \'archived\''],
  };
  const mapping = mappings[resource];
  if (!mapping) return false;
  const connection = await getDb().getConnection();
  let result;
  try {
    await connection.beginTransaction();
    [result] = await connection.query(`UPDATE ${mapping[0]} SET ${mapping[1]} WHERE id = ?`, [id]);
    if (result.affectedRows > 0) await writeAudit(connection, requestMeta, 'catalog.archive', resource, id);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await Promise.all([
    cache.deleteKeys(['catalog', 'facets', 'tr'], ['catalog', 'facets', 'en']),
    cache.deleteByPrefix('catalog', 'products'),
  ]);
  return result.affectedRows > 0;
};

module.exports = { archiveResource, createResource, listCatalog, listResource, updateResource };
