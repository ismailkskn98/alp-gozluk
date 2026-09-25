const { getStockStatus } = require('../helpers/inventory');
const { getDb } = require('../models/db');

const escapeLike = (value) => value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

const writeAudit = async (connection, requestMeta, action, variantId, changes) => {
  await connection.query(
    `INSERT INTO audit_logs
      (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
     VALUES (?, ?, 'product_variant', ?, ?, SHA2(?, 256), ?)`,
    [requestMeta.userId, action, variantId, requestMeta.requestId, requestMeta.ip || '', JSON.stringify(changes)],
  );
};

const mapInventoryRow = (row) => ({
  ...row,
  availableQuantity: Number(row.availableQuantity),
  reservedQuantity: Number(row.reservedQuantity),
  physicalQuantity: Number(row.physicalQuantity),
  lowStockThreshold: Number(row.lowStockThreshold),
  stockStatus: getStockStatus(row.availableQuantity, row.lowStockThreshold),
  options: row.options ? row.options.split('||') : [],
});

const list = async ({ locale = 'tr', page = 1, limit = 25, search = '', status = 'all' }) => {
  const normalizedLocale = ['tr', 'en'].includes(locale) ? locale : 'tr';
  const offset = (page - 1) * limit;
  const conditions = ['pv.deleted_at IS NULL', "pv.status = 'active'", 'p.deleted_at IS NULL'];
  const parameters = [normalizedLocale];

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push('(COALESCE(pt.name, p.code) LIKE ? ESCAPE \'\\\\\' OR p.code LIKE ? ESCAPE \'\\\\\' OR pv.sku LIKE ? ESCAPE \'\\\\\')');
    parameters.push(term, term, term);
  }
  if (status === 'out_of_stock') conditions.push('pv.stock_quantity = 0');
  if (status === 'low_stock') conditions.push('pv.stock_quantity > 0 AND pv.stock_quantity <= pv.low_stock_threshold');
  if (status === 'in_stock') conditions.push('pv.stock_quantity > pv.low_stock_threshold');

  const fromSql = `
    FROM product_variants pv
    INNER JOIN products p ON p.id = pv.product_id
    LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
    LEFT JOIN (
      SELECT variant_id, SUM(quantity) AS reserved_quantity
      FROM stock_reservations
      WHERE status = 'active'
      GROUP BY variant_id
    ) reservations ON reservations.variant_id = pv.id
    LEFT JOIN (
      SELECT vav.variant_id,
        GROUP_CONCAT(
          CONCAT(COALESCE(agt.name, ag.code), ': ', COALESCE(avt.name, av.code))
          ORDER BY ag.sort_order, av.sort_order SEPARATOR '||'
        ) AS options
      FROM variant_attribute_values vav
      INNER JOIN attribute_values av ON av.id = vav.attribute_value_id
      INNER JOIN attribute_groups ag ON ag.id = av.attribute_group_id
      LEFT JOIN attribute_group_translations agt ON agt.attribute_group_id = ag.id AND agt.locale = ?
      LEFT JOIN attribute_value_translations avt ON avt.attribute_value_id = av.id AND avt.locale = ?
      GROUP BY vav.variant_id
    ) variant_options ON variant_options.variant_id = pv.id
    WHERE ${conditions.join(' AND ')}`;

  const [rows] = await getDb().query(
    `SELECT pv.id AS variantId, p.id AS productId, p.code AS productCode,
       COALESCE(pt.name, p.code) AS productName, pv.sku, pv.stock_quantity AS availableQuantity,
       COALESCE(reservations.reserved_quantity, 0) AS reservedQuantity,
       pv.stock_quantity + COALESCE(reservations.reserved_quantity, 0) AS physicalQuantity,
       pv.low_stock_threshold AS lowStockThreshold, variant_options.options,
       pv.updated_at AS updatedAt
     ${fromSql}
     ORDER BY
       CASE
         WHEN pv.stock_quantity = 0 THEN 2
         WHEN pv.stock_quantity <= pv.low_stock_threshold THEN 1
         ELSE 0
       END,
       COALESCE(pt.name, p.code), pv.sku
     LIMIT ? OFFSET ?`,
    [normalizedLocale, normalizedLocale, normalizedLocale, ...parameters.slice(1), limit, offset],
  );
  const [countRows] = await getDb().query(
    `SELECT COUNT(*) AS total
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     WHERE ${conditions.join(' AND ')}`,
    parameters,
  );

  return {
    items: rows.map(mapInventoryRow),
    pagination: { page, limit, total: Number(countRows[0]?.total || 0) },
  };
};

const listMovements = async (variantId, limit = 20) => {
  const [rows] = await getDb().query(
    `SELECT im.id, im.movement_type AS movementType, im.quantity,
       im.balance_after AS balanceAfter, im.reference_type AS referenceType,
       im.reference_id AS referenceId, im.note, im.created_at AS createdAt,
       CONCAT_WS(' ', u.first_name, u.last_name) AS createdBy
     FROM inventory_movements im
     LEFT JOIN users u ON u.id = im.created_by
     WHERE im.variant_id = ?
     ORDER BY im.created_at DESC, im.id DESC
     LIMIT ?`,
    [variantId, limit],
  );
  return rows.map((row) => ({ ...row, quantity: Number(row.quantity), balanceAfter: Number(row.balanceAfter) }));
};

const adjust = async (variantId, payload, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [variants] = await connection.query(
      `SELECT pv.id, pv.sku, pv.stock_quantity AS stockQuantity,
         pv.low_stock_threshold AS lowStockThreshold
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ? AND pv.status = 'active' AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [variantId],
    );
    if (!variants[0]) {
      await connection.rollback();
      return null;
    }

    const previousQuantity = Number(variants[0].stockQuantity);
    const signedQuantity = payload.direction === 'increase' ? payload.quantity : -payload.quantity;
    const nextQuantity = previousQuantity + signedQuantity;
    if (nextQuantity < 0) {
      const error = new Error('Insufficient available stock.');
      error.statusCode = 409;
      error.publicMessage = 'Kullanılabilir stok bu miktarda azaltılamaz.';
      throw error;
    }

    await connection.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [nextQuantity, variantId]);
    const [movement] = await connection.query(
      `INSERT INTO inventory_movements
        (variant_id, movement_type, quantity, balance_after, reference_type, note, created_by)
       VALUES (?, ?, ?, ?, 'admin_adjustment', ?, ?)`,
      [variantId, payload.reasonCode, signedQuantity, nextQuantity, payload.note || null, requestMeta.userId],
    );
    await writeAudit(connection, requestMeta, 'inventory.adjust', variantId, {
      direction: payload.direction,
      quantity: payload.quantity,
      reasonCode: payload.reasonCode,
      note: payload.note || null,
      previousQuantity,
      nextQuantity,
      movementId: movement.insertId,
    });
    await connection.commit();
    return {
      variantId,
      availableQuantity: nextQuantity,
      lowStockThreshold: Number(variants[0].lowStockThreshold),
      stockStatus: getStockStatus(nextQuantity, variants[0].lowStockThreshold),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateThreshold = async (variantId, lowStockThreshold, requestMeta) => {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const [variants] = await connection.query(
      `SELECT pv.stock_quantity AS stockQuantity, pv.low_stock_threshold AS lowStockThreshold
       FROM product_variants pv
       INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ? AND pv.status = 'active' AND pv.deleted_at IS NULL AND p.deleted_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [variantId],
    );
    if (!variants[0]) {
      await connection.rollback();
      return null;
    }
    const previousThreshold = Number(variants[0].lowStockThreshold);
    await connection.query('UPDATE product_variants SET low_stock_threshold = ? WHERE id = ?', [lowStockThreshold, variantId]);
    await writeAudit(connection, requestMeta, 'inventory.threshold_update', variantId, {
      previousThreshold,
      lowStockThreshold,
    });
    await connection.commit();
    return {
      variantId,
      availableQuantity: Number(variants[0].stockQuantity),
      lowStockThreshold,
      stockStatus: getStockStatus(variants[0].stockQuantity, lowStockThreshold),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { adjust, list, listMovements, updateThreshold };
