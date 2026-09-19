const { config } = require('../config/env');
const { getDb } = require('../models/db');
const { validateImageFile } = require('../helpers/imageFile');
const { getStorage } = require('../../../general_services/storage');

const entityPrefixes = {
  product: 'products',
  category: 'categories',
  collection: 'collections',
  content: 'content',
  user: 'users',
};

const normalizeMediaInput = (input = {}) => {
  const entityType = String(input.entityType || '').trim().toLowerCase();
  const entityId = Number(input.entityId);
  const altText = String(input.altText || '').trim();
  const sortOrder = Number(input.sortOrder || 0);

  if (!entityPrefixes[entityType] || !Number.isInteger(entityId) || entityId <= 0) {
    const error = new Error('Geçersiz medya ilişkisi.');
    error.statusCode = 422;
    throw error;
  }

  if (altText.length > 255 || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    const error = new Error('Geçersiz medya bilgileri.');
    error.statusCode = 422;
    throw error;
  }

  return { entityType, entityId, altText, sortOrder };
};

const withResolvedUrl = async (row) => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  storageKey: row.storage_key,
  storageDriver: row.storage_driver,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  width: row.width,
  height: row.height,
  altText: row.alt_text,
  sortOrder: row.sort_order,
  visibility: row.visibility,
  url: await getStorage(row.storage_driver).getUrl(row.storage_key, {
    visibility: row.visibility,
  }),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const saveFile = async (file, mediaInput) => {
  const fileInfo = await validateImageFile(file, {
    prefix: entityPrefixes[mediaInput.entityType],
    visibility: 'public',
  });
  const storage = getStorage(config.storage.driver);
  const savedFile = await storage.save(file, fileInfo);

  return { ...fileInfo, ...savedFile, sizeBytes: file.size };
};

const uploadMedia = async ({ files, input, userId }) => {
  const mediaInput = normalizeMediaInput(input);
  const database = getDb();
  const connection = await database.getConnection();
  const savedFiles = [];

  try {
    await connection.beginTransaction();
    const insertedIds = [];

    for (let index = 0; index < files.length; index += 1) {
      const savedFile = await saveFile(files[index], mediaInput);
      savedFiles.push(savedFile);

      const [result] = await connection.query(
        `INSERT INTO media_assets
          (entity_type, entity_id, storage_key, storage_driver, mime_type, size_bytes,
           width, height, alt_text, sort_order, visibility, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public', ?)`,
        [
          mediaInput.entityType,
          mediaInput.entityId,
          savedFile.key,
          savedFile.driver,
          savedFile.contentType,
          savedFile.sizeBytes,
          savedFile.width,
          savedFile.height,
          mediaInput.altText,
          mediaInput.sortOrder + index,
          userId,
        ],
      );
      insertedIds.push(result.insertId);
    }

    await connection.commit();

    const placeholders = insertedIds.map(() => '?').join(', ');
    const [rows] = await database.query(
      `SELECT * FROM media_assets WHERE id IN (${placeholders}) ORDER BY sort_order, id`,
      insertedIds,
    );
    return Promise.all(rows.map(withResolvedUrl));
  } catch (error) {
    await connection.rollback();
    await Promise.allSettled(
      savedFiles.map((file) => getStorage(file.driver).delete(file.key)),
    );
    throw error;
  } finally {
    connection.release();
  }
};

const listMedia = async ({ page, limit, entityType, entityId }) => {
  const where = [];
  const values = [];

  if (entityType) {
    if (!entityPrefixes[entityType]) {
      const error = new Error('Geçersiz entity türü.');
      error.statusCode = 422;
      throw error;
    }
    where.push('entity_type = ?');
    values.push(entityType);
  }

  if (entityId) {
    where.push('entity_id = ?');
    values.push(entityId);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const database = getDb();
  const [[countRow], [rows]] = await Promise.all([
    database.query(`SELECT COUNT(*) AS total FROM media_assets ${whereSql}`, values),
    database.query(
      `SELECT * FROM media_assets ${whereSql}
       ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    ),
  ]);

  return {
    records: await Promise.all(rows.map(withResolvedUrl)),
    pagination: { page, limit, total: Number(countRow[0].total) },
  };
};

const updateMedia = async ({ id, altText, sortOrder }) => {
  const normalizedAltText = String(altText || '').trim();
  const normalizedSortOrder = Number(sortOrder);

  if (normalizedAltText.length > 255 || !Number.isInteger(normalizedSortOrder) || normalizedSortOrder < 0) {
    const error = new Error('Geçersiz medya bilgileri.');
    error.statusCode = 422;
    throw error;
  }

  const database = getDb();
  const [result] = await database.query(
    'UPDATE media_assets SET alt_text = ?, sort_order = ? WHERE id = ?',
    [normalizedAltText, normalizedSortOrder, id],
  );

  if (result.affectedRows === 0) return null;
  const [rows] = await database.query('SELECT * FROM media_assets WHERE id = ? LIMIT 1', [id]);
  return withResolvedUrl(rows[0]);
};

const replaceMedia = async ({ id, file, userId }) => {
  const database = getDb();
  const [existingRows] = await database.query(
    'SELECT * FROM media_assets WHERE id = ? LIMIT 1',
    [id],
  );
  const existingMedia = existingRows[0];
  if (!existingMedia) return null;

  const mediaInput = normalizeMediaInput({
    entityType: existingMedia.entity_type,
    entityId: existingMedia.entity_id,
    altText: existingMedia.alt_text,
    sortOrder: existingMedia.sort_order,
  });
  const savedFile = await saveFile(file, mediaInput);

  try {
    await database.query(
      `UPDATE media_assets
       SET storage_key = ?, storage_driver = ?, mime_type = ?, size_bytes = ?,
           width = ?, height = ?, updated_by = ?, updated_at = UTC_TIMESTAMP(6)
       WHERE id = ?`,
      [
        savedFile.key,
        savedFile.driver,
        savedFile.contentType,
        savedFile.sizeBytes,
        savedFile.width,
        savedFile.height,
        userId,
        id,
      ],
    );
  } catch (error) {
    await getStorage(savedFile.driver).delete(savedFile.key).catch(() => undefined);
    throw error;
  }

  getStorage(existingMedia.storage_driver)
    .delete(existingMedia.storage_key)
    .catch((error) => console.error('Eski medya dosyası temizlenemedi:', error.message));

  const [rows] = await database.query('SELECT * FROM media_assets WHERE id = ? LIMIT 1', [id]);
  return withResolvedUrl(rows[0]);
};

const deleteMedia = async (id) => {
  const database = getDb();
  const [rows] = await database.query('SELECT * FROM media_assets WHERE id = ? LIMIT 1', [id]);
  const media = rows[0];
  if (!media) return false;

  await database.query('DELETE FROM media_assets WHERE id = ?', [id]);
  getStorage(media.storage_driver)
    .delete(media.storage_key)
    .catch((error) => console.error('Silinen kaydın dosyası temizlenemedi:', error.message));
  return true;
};

module.exports = {
  uploadMedia,
  listMedia,
  updateMedia,
  replaceMedia,
  deleteMedia,
  normalizeMediaInput,
};
