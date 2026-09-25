const { getDb } = require('../models/db');

const commerceSettingKeys = {
  dispatchMinDays: 'commerce.dispatch_min_days',
  dispatchMaxDays: 'commerce.dispatch_max_days',
  returnWindowDays: 'commerce.return_window_days',
};

const commerceDefaults = {
  dispatchMinDays: 1,
  dispatchMaxDays: 3,
  returnWindowDays: 14,
};

const readCommerceSettings = async (database) => {
  const [rows] = await database.query(
    `SELECT setting_key AS settingKey, setting_value AS settingValue
     FROM site_settings
     WHERE setting_key IN (?, ?, ?)`,
    Object.values(commerceSettingKeys),
  );
  const storedValues = new Map(rows.map((row) => [row.settingKey, Number(row.settingValue)]));
  return Object.fromEntries(Object.entries(commerceSettingKeys).map(([field, key]) => [
    field,
    Number.isSafeInteger(storedValues.get(key)) ? storedValues.get(key) : commerceDefaults[field],
  ]));
};

const getCommerceSettings = () => readCommerceSettings(getDb());

const updateCommerceSettings = async (input, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const previous = await readCommerceSettings(connection);
    for (const [field, key] of Object.entries(commerceSettingKeys)) {
      await connection.query(
        `INSERT INTO site_settings (setting_key, setting_value, value_type, is_public, updated_by)
         VALUES (?, ?, 'integer', 1, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), value_type = 'integer',
           is_public = 1, updated_by = VALUES(updated_by)`,
        [key, String(input[field]), requestMeta.userId],
      );
    }
    await connection.query(
      `INSERT INTO audit_logs
        (user_id, action, entity_type, request_id, ip_hash, changes_json)
       VALUES (?, 'settings.commerce.update', 'site_settings', ?, SHA2(?, 256), ?)`,
      [requestMeta.userId, requestMeta.requestId, requestMeta.ip, JSON.stringify({ previous, next: input })],
    );
    await connection.commit();
    return input;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { commerceDefaults, getCommerceSettings, updateCommerceSettings };
