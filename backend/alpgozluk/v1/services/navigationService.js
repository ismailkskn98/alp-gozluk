const { getStorage } = require('../../../general_services/storage');
const { getDb } = require('../models/db');
const cache = require('./cacheService');

const normalizeLocale = (locale) => ['tr', 'en'].includes(locale) ? locale : 'tr';

const buildTree = (rows) => {
  const items = new Map(rows.map((row) => [row.id, { ...row, children: [] }]));
  const roots = [];
  for (const item of items.values()) {
    if (item.parentId && items.has(item.parentId)) items.get(item.parentId).children.push(item);
    else roots.push(item);
  }
  return roots;
};

const getHeader = async (requestedLocale, includeInactive = false) => {
  const locale = normalizeLocale(requestedLocale);
  if (!includeInactive) {
    const cached = await cache.getJson('navigation', 'header', locale);
    if (cached) return cached;
  }

  const activeCondition = includeInactive
    ? ''
    : "AND nm.status = 'active' AND ni.status = 'active' AND (nm.starts_at IS NULL OR nm.starts_at <= UTC_TIMESTAMP(6)) AND (nm.ends_at IS NULL OR nm.ends_at >= UTC_TIMESTAMP(6))";
  const [rows] = await getDb().query(
    `SELECT ni.id, ni.parent_id AS parentId, ni.code, ni.item_type AS itemType,
       COALESCE(t.href, ni.custom_url) AS href, ni.column_position AS columnPosition, ni.sort_order AS sortOrder,
       ni.status, COALESCE(t.label, ni.code) AS label, t.description,
       ma.storage_key AS storageKey, ma.storage_driver AS storageDriver, ma.visibility
     FROM navigation_menus nm
     INNER JOIN navigation_items ni ON ni.menu_id = nm.id
     LEFT JOIN navigation_item_translations t ON t.navigation_item_id = ni.id AND t.locale = ?
     LEFT JOIN media_assets ma ON ma.id = ni.media_asset_id
     WHERE nm.code = 'header-main' ${activeCondition}
     ORDER BY ni.parent_id IS NOT NULL, ni.column_position, ni.sort_order, ni.id`,
    [locale],
  );

  const resolvedRows = await Promise.all(rows.map(async (row) => {
    let imageUrl = null;
    if (row.storageKey && row.storageDriver) {
      imageUrl = await getStorage(row.storageDriver).getUrl(row.storageKey, { visibility: row.visibility });
    }
    const { storageKey, storageDriver, visibility, ...item } = row;
    return { ...item, imageUrl };
  }));
  const menu = { code: 'header-main', items: buildTree(resolvedRows) };
  if (!includeInactive) await cache.setJson(['navigation', 'header', locale], menu, 600);
  return menu;
};

const mergeTranslations = (primaryItems, secondaryItems) => {
  const secondaryByCode = new Map(secondaryItems.map((item) => [item.code, item]));
  return primaryItems.map((item) => {
    const secondary = secondaryByCode.get(item.code);
    return {
      ...item,
      translations: [
        { locale: 'tr', label: item.label, description: item.description, href: item.href },
        { locale: 'en', label: secondary?.label || item.label, description: secondary?.description || null, href: secondary?.href || item.href },
      ],
      children: mergeTranslations(item.children || [], secondary?.children || []),
    };
  });
};

const getHeaderEditor = async () => {
  const [turkishMenu, englishMenu] = await Promise.all([getHeader('tr', true), getHeader('en', true)]);
  return { ...turkishMenu, items: mergeTranslations(turkishMenu.items, englishMenu.items) };
};

const saveHeader = async (payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [menuRows] = await connection.query("SELECT id FROM navigation_menus WHERE code = 'header-main' LIMIT 1 FOR UPDATE");
    let menuId = menuRows[0]?.id;
    if (!menuId) {
      const [menuResult] = await connection.query("INSERT INTO navigation_menus (code, location, status) VALUES ('header-main', 'header', 'active')");
      menuId = menuResult.insertId;
    }

    const pending = [...payload.items];
    const idsByCode = new Map();
    let guard = 0;
    while (pending.length > 0 && guard < payload.items.length + 1) {
      guard += 1;
      for (let index = pending.length - 1; index >= 0; index -= 1) {
        const item = pending[index];
        if (item.parentCode && !idsByCode.has(item.parentCode)) continue;
        const parentId = item.parentCode ? idsByCode.get(item.parentCode) : null;
        const [result] = await connection.query(
          `INSERT INTO navigation_items
            (menu_id, parent_id, code, item_type, custom_url, column_position, sort_order, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), parent_id = VALUES(parent_id),
             item_type = VALUES(item_type), custom_url = VALUES(custom_url),
             column_position = VALUES(column_position), sort_order = VALUES(sort_order), status = VALUES(status)`,
          [menuId, parentId, item.code, item.itemType, item.customUrl, item.columnPosition, item.sortOrder, item.status],
        );
        const itemId = result.insertId;
        idsByCode.set(item.code, itemId);
        for (const translation of item.translations) {
          await connection.query(
            `INSERT INTO navigation_item_translations (navigation_item_id, locale, label, description, href)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), href = VALUES(href)`,
            [itemId, translation.locale, translation.label, translation.description, translation.href],
          );
        }
        pending.splice(index, 1);
      }
    }
    if (pending.length > 0) throw new Error('Navigasyon üst-alt ilişkisi çözümlenemedi.');

    const codes = payload.items.map((item) => item.code);
    await connection.query(
      `UPDATE navigation_items SET status = 'inactive'
       WHERE menu_id = ? AND code NOT IN (${codes.map(() => '?').join(', ')})`,
      [menuId, ...codes],
    );
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
       VALUES (?, 'navigation.update', 'navigation_menu', ?, ?, SHA2(?, 256), ?)`,
      [requestMeta.userId, menuId, requestMeta.requestId, requestMeta.ip, JSON.stringify({ itemCount: payload.items.length })],
    );
    await connection.commit();
    await cache.deleteKeys(['navigation', 'header', 'tr'], ['navigation', 'header', 'en']);
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { getHeader, getHeaderEditor, saveHeader };
