const crypto = require('node:crypto');
const { getDb } = require('../models/db');
const cache = require('./cacheService');

const normalizeLocale = (locale) => ['tr', 'en'].includes(locale) ? locale : 'tr';

const selectFields = `id, code, message_tr AS messageTr, message_en AS messageEn,
  link_label_tr AS linkLabelTr, link_label_en AS linkLabelEn, link_url AS linkUrl,
  link_underline AS linkUnderline,
  background_color AS backgroundColor, text_color AS textColor,
  duration_seconds AS durationSeconds, sort_order AS sortOrder, is_active AS isActive,
  starts_at AS startsAt, ends_at AS endsAt, created_at AS createdAt, updated_at AS updatedAt`;

const localize = (record, locale) => ({
  id: record.id,
  message: locale === 'en' && record.messageEn ? record.messageEn : record.messageTr,
  linkLabel: locale === 'en' && record.linkLabelEn ? record.linkLabelEn : record.linkLabelTr,
  linkUrl: record.linkUrl,
  linkUnderline: Boolean(record.linkUnderline),
  backgroundColor: record.backgroundColor,
  textColor: record.textColor,
  durationSeconds: record.durationSeconds,
});

const listPublic = async (requestedLocale) => {
  const locale = normalizeLocale(requestedLocale);
  const cached = await cache.getJson('announcements', 'public', locale);
  if (cached) return cached;

  const [rows] = await getDb().query(
    `SELECT ${selectFields} FROM announcements
     WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP(6))
       AND (ends_at IS NULL OR ends_at >= UTC_TIMESTAMP(6))
     ORDER BY sort_order, id LIMIT 10`,
  );
  const announcements = rows.map((record) => localize(record, locale));
  await cache.setJson(['announcements', 'public', locale], announcements, 60);
  return announcements;
};

const listAdmin = async () => {
  const [rows] = await getDb().query(`SELECT ${selectFields} FROM announcements ORDER BY sort_order, id`);
  return rows.map((row) => ({ ...row, isActive: Boolean(row.isActive), linkUnderline: Boolean(row.linkUnderline) }));
};

const writeAudit = async (connection, requestMeta, action, id, changes = {}) => {
  await connection.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
     VALUES (?, ?, 'announcement', ?, ?, SHA2(?, 256), ?)`,
    [requestMeta.userId, action, id, requestMeta.requestId, requestMeta.ip || '', JSON.stringify(changes)],
  );
};

const valuesFor = (payload) => [
  payload.messageTr, payload.messageEn, payload.linkLabelTr, payload.linkLabelEn, payload.linkUrl,
  payload.linkUnderline ? 1 : 0,
  payload.backgroundColor, payload.textColor, payload.durationSeconds, payload.sortOrder,
  payload.isActive ? 1 : 0, payload.startsAt, payload.endsAt,
];

const clearPublicCache = () => cache.deleteKeys(
  ['announcements', 'public', 'tr'],
  ['announcements', 'public', 'en'],
);

const create = async (payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO announcements
       (code, message_tr, message_en, link_label_tr, link_label_en, link_url, link_underline,
        background_color, text_color, duration_seconds, sort_order, is_active,
        starts_at, ends_at, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), ...valuesFor(payload), requestMeta.userId, requestMeta.userId],
    );
    await writeAudit(connection, requestMeta, 'announcement.create', result.insertId, { messageTr: payload.messageTr });
    await connection.commit();
    await clearPublicCache();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const update = async (id, payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `UPDATE announcements SET message_tr = ?, message_en = ?, link_label_tr = ?, link_label_en = ?,
       link_url = ?, link_underline = ?, background_color = ?, text_color = ?, duration_seconds = ?, sort_order = ?,
       is_active = ?, starts_at = ?, ends_at = ?, updated_by = ? WHERE id = ?`,
      [...valuesFor(payload), requestMeta.userId, id],
    );
    if (!result.affectedRows) {
      await connection.rollback();
      return false;
    }
    await writeAudit(connection, requestMeta, 'announcement.update', id, { messageTr: payload.messageTr, isActive: payload.isActive });
    await connection.commit();
    await clearPublicCache();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const reorder = async (ids, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT id FROM announcements WHERE id IN (${ids.map(() => '?').join(', ')}) FOR UPDATE`,
      ids,
    );
    if (rows.length !== ids.length) {
      await connection.rollback();
      return false;
    }
    for (let index = 0; index < ids.length; index += 1) {
      await connection.query('UPDATE announcements SET sort_order = ?, updated_by = ? WHERE id = ?', [index, requestMeta.userId, ids[index]]);
    }
    await writeAudit(connection, requestMeta, 'announcement.reorder', ids[0], { ids });
    await connection.commit();
    await clearPublicCache();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const remove = async (id, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query('DELETE FROM announcements WHERE id = ?', [id]);
    if (result.affectedRows) await writeAudit(connection, requestMeta, 'announcement.delete', id);
    await connection.commit();
    await clearPublicCache();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { create, listAdmin, listPublic, remove, reorder, update };
