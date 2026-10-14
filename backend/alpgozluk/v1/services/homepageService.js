const { getStorage } = require('../../../general_services/storage');
const { getDb } = require('../models/db');
const { imageSlots } = require('../helpers/homepageInput');
const cache = require('./cacheService');

const settingKey = 'content.homepage';
const homepageEntityId = 1;

const emptyStoredConfig = () => ({ tr: {}, en: {}, images: Object.fromEntries(imageSlots.map((slot) => [slot, null])) });

const readStoredConfig = async (database = getDb()) => {
  const [rows] = await database.query(
    'SELECT setting_value AS settingValue FROM site_settings WHERE setting_key = ? LIMIT 1',
    [settingKey],
  );
  if (!rows[0]?.settingValue) return emptyStoredConfig();
  try {
    const stored = JSON.parse(rows[0].settingValue);
    return {
      tr: stored.tr || {},
      en: stored.en || {},
      images: { ...emptyStoredConfig().images, ...(stored.images || {}) },
    };
  } catch {
    return emptyStoredConfig();
  }
};

const resolveImages = async (images, database = getDb()) => {
  const ids = [...new Set(Object.values(images).filter((id) => Number.isInteger(Number(id))).map(Number))];
  const recordsById = new Map();
  if (ids.length > 0) {
    const [rows] = await database.query(
      `SELECT id, storage_key AS storageKey, storage_driver AS storageDriver, visibility,
         alt_text AS altText, width, height
       FROM media_assets
       WHERE entity_type = 'content' AND entity_id = ?
         AND id IN (${ids.map(() => '?').join(', ')})`,
      [homepageEntityId, ...ids],
    );
    for (const row of rows) {
      recordsById.set(row.id, {
        mediaAssetId: row.id,
        url: await getStorage(row.storageDriver).getUrl(row.storageKey, { visibility: row.visibility }),
        altText: row.altText,
        width: row.width,
        height: row.height,
      });
    }
  }
  return Object.fromEntries(imageSlots.map((slot) => [slot, recordsById.get(Number(images[slot])) || null]));
};

const getHomepage = async () => {
  const stored = await readStoredConfig();
  return { tr: stored.tr, en: stored.en, images: await resolveImages(stored.images) };
};

const assertOwnedImages = async (images, connection) => {
  const ids = [...new Set(Object.values(images).filter(Boolean))];
  if (ids.length === 0) return;
  const [rows] = await connection.query(
    `SELECT id FROM media_assets
     WHERE entity_type = 'content' AND entity_id = ?
       AND id IN (${ids.map(() => '?').join(', ')})`,
    [homepageEntityId, ...ids],
  );
  if (rows.length !== ids.length) {
    const error = new Error('Anasayfa görsellerinden biri bu içeriğe ait değil.');
    error.statusCode = 422;
    throw error;
  }
};

const updateHomepage = async (input, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    await assertOwnedImages(input.images, connection);
    await connection.query(
      `INSERT INTO site_settings (setting_key, setting_value, value_type, is_public, updated_by)
       VALUES (?, ?, 'json', 1, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), value_type = 'json',
         is_public = 1, updated_by = VALUES(updated_by), updated_at = UTC_TIMESTAMP(6)`,
      [settingKey, JSON.stringify(input), requestMeta.userId],
    );
    await connection.query(
      `INSERT INTO audit_logs
        (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
       VALUES (?, 'content.homepage.update', 'site_settings', ?, ?, SHA2(?, 256), ?)`,
      [requestMeta.userId, homepageEntityId, requestMeta.requestId, requestMeta.ip, JSON.stringify({ imageSlots: input.images })],
    );
    await connection.commit();
    await cache.deleteByPrefix('content');
    return getHomepage();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { getHomepage, homepageEntityId, updateHomepage };
