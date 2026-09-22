const { getStorage } = require('../../../general_services/storage');
const { getDb } = require('../models/db');
const {
  MAX_CART_LINE_QUANTITY,
  calculateCouponDiscount,
  fromMinorUnits,
  toMinorUnits,
} = require('../helpers/commerce');

const allowedLocales = new Set(['tr', 'en']);
const normalizeLocale = (locale) => allowedLocales.has(locale) ? locale : 'tr';

const commerceError = (statusCode, publicMessage, code) => {
  const error = new Error(code || publicMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  error.code = code;
  return error;
};

const emptyCart = () => ({
  items: [],
  coupon: null,
  warnings: [],
  summary: {
    itemCount: 0,
    selectedItemCount: 0,
    subtotalAmount: 0,
    discountAmount: 0,
    shippingAmount: 0,
    totalAmount: 0,
    currency: 'TRY',
  },
  updatedAt: null,
});

const findActiveCart = async (database, identity, lock = false) => {
  if (!identity.userId && !identity.guestTokenHash) return null;
  const condition = identity.userId ? 'user_id = ?' : 'guest_token_hash = ?';
  const value = identity.userId || identity.guestTokenHash;
  const [rows] = await database.query(
    `SELECT id, user_id, guest_token_hash, coupon_id, currency, status, updated_at
     FROM carts WHERE ${condition} AND status = 'active' LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [value],
  );
  return rows[0] || null;
};

const getOrCreateCart = async (connection, identity) => {
  const current = await findActiveCart(connection, identity, true);
  if (current) return current;
  if (!identity.userId && !identity.guestTokenHash) {
    throw commerceError(422, 'Misafir sepet kimliği oluşturulamadı.', 'guest_identity_missing');
  }

  try {
    const [result] = await connection.query(
      `INSERT INTO carts (user_id, guest_token_hash, currency, status, expires_at)
       VALUES (?, ?, 'TRY', 'active', CASE WHEN ? IS NULL THEN DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 30 DAY) ELSE NULL END)`,
      [identity.userId || null, identity.guestTokenHash || null, identity.userId || null],
    );
    const [rows] = await connection.query(
      `SELECT id, user_id, guest_token_hash, coupon_id, currency, status, updated_at
       FROM carts WHERE id = ? LIMIT 1 FOR UPDATE`,
      [result.insertId],
    );
    return rows[0];
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const racedCart = await findActiveCart(connection, identity, true);
    if (racedCart) return racedCart;
    throw commerceError(409, 'Bu misafir sepeti artık kullanılamıyor. Sepeti yenileyip tekrar deneyin.', 'guest_cart_stale');
  }
};

const resolveMedia = async (rows) => {
  const productIds = [...new Set(rows.map((row) => row.product_id))];
  if (productIds.length === 0) return new Map();
  const [mediaRows] = await getDb().query(
    `SELECT entity_id AS product_id, storage_key, storage_driver, visibility, alt_text
     FROM media_assets
     WHERE entity_type = 'product' AND entity_id IN (${productIds.map(() => '?').join(', ')})
     ORDER BY entity_id, sort_order, id`,
    productIds,
  );
  const mediaByProduct = new Map();
  for (const media of mediaRows) {
    if (mediaByProduct.has(media.product_id)) continue;
    mediaByProduct.set(media.product_id, {
      url: await getStorage(media.storage_driver).getUrl(media.storage_key, { visibility: media.visibility }),
      altText: media.alt_text,
    });
  }
  return mediaByProduct;
};

const loadCart = async (cartId, requestedLocale = 'tr') => {
  if (!cartId) return emptyCart();
  const locale = normalizeLocale(requestedLocale);
  const database = getDb();
  const [cartRows, itemRows] = await Promise.all([
    database.query(
      `SELECT c.id, c.currency, c.updated_at, cp.id AS coupon_id, cp.code AS coupon_code,
         cp.discount_type, cp.discount_value, cp.minimum_order_amount, cp.usage_limit,
         cp.usage_count,
         CASE WHEN cp.id IS NOT NULL AND cp.status = 'active'
           AND (cp.starts_at IS NULL OR cp.starts_at <= UTC_TIMESTAMP(6))
           AND (cp.ends_at IS NULL OR cp.ends_at >= UTC_TIMESTAMP(6))
           AND (cp.usage_limit IS NULL OR cp.usage_count < cp.usage_limit)
         THEN 1 ELSE 0 END AS coupon_active
       FROM carts c LEFT JOIN coupons cp ON cp.id = c.coupon_id
       WHERE c.id = ? AND c.status = 'active' LIMIT 1`,
      [cartId],
    ),
    database.query(
      `SELECT ci.id, ci.variant_id, ci.quantity, ci.is_selected, ci.unit_price_snapshot,
         p.id AS product_id, p.status AS product_status, p.deleted_at AS product_deleted_at,
         COALESCE(pt.name, fallback_pt.name, p.code) AS product_name,
         COALESCE(pt.slug, fallback_pt.slug, p.code) AS product_slug,
         pv.sku, pv.color_code, pv.frame_size, pv.lens_type, pv.price, pv.compare_at_price,
         pv.stock_quantity, pv.status AS variant_status, pv.deleted_at AS variant_deleted_at
       FROM cart_items ci
       INNER JOIN product_variants pv ON pv.id = ci.variant_id
       INNER JOIN products p ON p.id = pv.product_id
       LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
       LEFT JOIN product_translations fallback_pt ON fallback_pt.product_id = p.id AND fallback_pt.locale = 'tr'
       WHERE ci.cart_id = ? ORDER BY ci.created_at, ci.id`,
      [locale, cartId],
    ),
  ]);
  const cart = cartRows[0][0];
  if (!cart) return emptyCart();
  const mediaByProduct = await resolveMedia(itemRows[0]);
  const warnings = [];
  let subtotalMinor = 0;
  let itemCount = 0;
  let selectedItemCount = 0;

  const items = itemRows[0].map((row) => {
    const quantity = Number(row.quantity);
    const currentPriceMinor = toMinorUnits(row.price);
    const snapshotMinor = toMinorUnits(row.unit_price_snapshot);
    const productAvailable = row.product_status === 'published' && !row.product_deleted_at;
    const variantAvailable = row.variant_status === 'active' && !row.variant_deleted_at;
    const hasEnoughStock = Number(row.stock_quantity) >= quantity;
    const available = productAvailable && variantAvailable && hasEnoughStock && Number(row.stock_quantity) > 0;
    const itemWarnings = [];

    if (!productAvailable || !variantAvailable) itemWarnings.push('unavailable');
    else if (Number(row.stock_quantity) === 0) itemWarnings.push('out_of_stock');
    else if (!hasEnoughStock) itemWarnings.push('insufficient_stock');
    if (currentPriceMinor !== snapshotMinor) itemWarnings.push('price_changed');
    for (const code of itemWarnings) warnings.push({ itemId: row.id, code });

    itemCount += quantity;
    if (Boolean(row.is_selected) && available) {
      selectedItemCount += quantity;
      subtotalMinor += currentPriceMinor * quantity;
    }

    return {
      id: row.id,
      variantId: row.variant_id,
      productId: row.product_id,
      name: row.product_name,
      slug: row.product_slug,
      sku: row.sku,
      colorCode: row.color_code,
      frameSize: row.frame_size,
      lensType: row.lens_type,
      quantity,
      selected: Boolean(row.is_selected),
      available,
      stockQuantity: Number(row.stock_quantity),
      unitPrice: fromMinorUnits(currentPriceMinor),
      compareAtPrice: row.compare_at_price === null ? null : fromMinorUnits(toMinorUnits(row.compare_at_price)),
      unitPriceSnapshot: fromMinorUnits(snapshotMinor),
      lineTotal: fromMinorUnits(currentPriceMinor * quantity),
      image: mediaByProduct.get(row.product_id) || null,
      warnings: itemWarnings,
    };
  });

  const minimumMinor = cart.minimum_order_amount === null ? 0 : toMinorUnits(cart.minimum_order_amount);
  const couponValid = Boolean(cart.coupon_id) && Boolean(cart.coupon_active) && subtotalMinor >= minimumMinor;
  const discountMinor = couponValid ? calculateCouponDiscount(cart, subtotalMinor) : 0;
  const shippingMinor = 0;
  const totalMinor = Math.max(0, subtotalMinor - discountMinor + shippingMinor);
  if (cart.coupon_id && !couponValid) warnings.push({ code: 'coupon_unavailable' });

  return {
    items,
    coupon: cart.coupon_id ? {
      id: cart.coupon_id,
      code: cart.coupon_code,
      valid: couponValid,
      discountType: cart.discount_type,
      discountValue: Number(cart.discount_value),
      minimumOrderAmount: cart.minimum_order_amount === null ? null : Number(cart.minimum_order_amount),
    } : null,
    warnings,
    summary: {
      itemCount,
      selectedItemCount,
      subtotalAmount: fromMinorUnits(subtotalMinor),
      discountAmount: fromMinorUnits(discountMinor),
      shippingAmount: fromMinorUnits(shippingMinor),
      totalAmount: fromMinorUnits(totalMinor),
      currency: cart.currency,
    },
    updatedAt: cart.updated_at,
  };
};

const getCart = async (identity, locale) => {
  if (!identity.userId && !identity.guestTokenHash) return emptyCart();
  const cart = await findActiveCart(getDb(), identity);
  return cart ? loadCart(cart.id, locale) : emptyCart();
};

const addItem = async (identity, payload, locale) => {
  const connection = await getDb().getConnection();
  let cartId;
  try {
    await connection.beginTransaction();
    const cart = await getOrCreateCart(connection, identity);
    cartId = cart.id;
    const [variants] = await connection.query(
      `SELECT pv.id, pv.price, pv.stock_quantity
       FROM product_variants pv INNER JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ? AND pv.status = 'active' AND pv.deleted_at IS NULL
         AND p.status = 'published' AND p.deleted_at IS NULL LIMIT 1 FOR UPDATE`,
      [payload.variantId],
    );
    const variant = variants[0];
    if (!variant) throw commerceError(404, 'Ürün seçeneği bulunamadı.', 'variant_not_found');
    const [currentItems] = await connection.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1 FOR UPDATE',
      [cart.id, payload.variantId],
    );
    const nextQuantity = Number(currentItems[0]?.quantity || 0) + payload.quantity;
    if (nextQuantity > MAX_CART_LINE_QUANTITY) {
      throw commerceError(422, `Bir üründen en fazla ${MAX_CART_LINE_QUANTITY} adet ekleyebilirsiniz.`, 'quantity_limit');
    }
    if (nextQuantity > Number(variant.stock_quantity)) {
      throw commerceError(409, 'İstenen adet için yeterli stok bulunmuyor.', 'insufficient_stock');
    }
    if (currentItems[0]) {
      await connection.query('UPDATE cart_items SET quantity = ?, is_selected = 1 WHERE id = ?', [nextQuantity, currentItems[0].id]);
    } else {
      await connection.query(
        `INSERT INTO cart_items (cart_id, variant_id, quantity, is_selected, unit_price_snapshot)
         VALUES (?, ?, ?, 1, ?)`,
        [cart.id, payload.variantId, payload.quantity, variant.price],
      );
    }
    if (!identity.userId) {
      await connection.query('UPDATE carts SET expires_at = DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 30 DAY) WHERE id = ?', [cart.id]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(cartId, locale);
};

const updateItem = async (identity, itemId, payload, locale) => {
  const connection = await getDb().getConnection();
  let cartId;
  try {
    await connection.beginTransaction();
    const cart = await findActiveCart(connection, identity, true);
    if (!cart) throw commerceError(404, 'Sepet bulunamadı.', 'cart_not_found');
    cartId = cart.id;
    const [rows] = await connection.query(
      `SELECT ci.id, ci.quantity, pv.stock_quantity, pv.status AS variant_status,
         pv.deleted_at AS variant_deleted_at, p.status AS product_status, p.deleted_at AS product_deleted_at
       FROM cart_items ci INNER JOIN product_variants pv ON pv.id = ci.variant_id
       INNER JOIN products p ON p.id = pv.product_id
       WHERE ci.id = ? AND ci.cart_id = ? LIMIT 1 FOR UPDATE`,
      [itemId, cart.id],
    );
    const item = rows[0];
    if (!item) throw commerceError(404, 'Sepet ürünü bulunamadı.', 'cart_item_not_found');
    if (payload.quantity !== undefined) {
      if (payload.quantity > MAX_CART_LINE_QUANTITY) throw commerceError(422, 'Ürün adet sınırı aşıldı.', 'quantity_limit');
      const purchasable = item.variant_status === 'active' && !item.variant_deleted_at && item.product_status === 'published' && !item.product_deleted_at;
      if (!purchasable) throw commerceError(409, 'Bu ürün artık satın alınamıyor.', 'item_unavailable');
      if (payload.quantity > Number(item.stock_quantity)) throw commerceError(409, 'İstenen adet için yeterli stok bulunmuyor.', 'insufficient_stock');
    }
    await connection.query(
      `UPDATE cart_items SET quantity = COALESCE(?, quantity), is_selected = COALESCE(?, is_selected)
       WHERE id = ? AND cart_id = ?`,
      [payload.quantity ?? null, payload.selected === undefined ? null : (payload.selected ? 1 : 0), itemId, cart.id],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(cartId, locale);
};

const removeItem = async (identity, itemId, locale) => {
  const connection = await getDb().getConnection();
  let cartId;
  try {
    await connection.beginTransaction();
    const cart = await findActiveCart(connection, identity, true);
    if (!cart) throw commerceError(404, 'Sepet bulunamadı.', 'cart_not_found');
    cartId = cart.id;
    const [result] = await connection.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cart.id]);
    if (result.affectedRows === 0) throw commerceError(404, 'Sepet ürünü bulunamadı.', 'cart_item_not_found');
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(cartId, locale);
};

const updateSelection = async (identity, payload, locale) => {
  const connection = await getDb().getConnection();
  let cartId;
  try {
    await connection.beginTransaction();
    const cart = await findActiveCart(connection, identity, true);
    if (!cart) throw commerceError(404, 'Sepet bulunamadı.', 'cart_not_found');
    cartId = cart.id;
    if (payload.itemIds) {
      const placeholders = payload.itemIds.map(() => '?').join(', ');
      const [ownedRows] = await connection.query(
        `SELECT id FROM cart_items WHERE cart_id = ? AND id IN (${placeholders}) FOR UPDATE`,
        [cart.id, ...payload.itemIds],
      );
      if (ownedRows.length !== payload.itemIds.length) throw commerceError(404, 'Sepet ürünlerinden biri bulunamadı.', 'cart_item_not_found');
      await connection.query(
        `UPDATE cart_items SET is_selected = ? WHERE cart_id = ? AND id IN (${placeholders})`,
        [payload.selected ? 1 : 0, cart.id, ...payload.itemIds],
      );
    } else {
      await connection.query('UPDATE cart_items SET is_selected = ? WHERE cart_id = ?', [payload.selected ? 1 : 0, cart.id]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(cartId, locale);
};

const applyCoupon = async (identity, code, locale) => {
  const connection = await getDb().getConnection();
  let cartId;
  try {
    await connection.beginTransaction();
    const cart = await getOrCreateCart(connection, identity);
    cartId = cart.id;
    const [coupons] = await connection.query(
      `SELECT id, minimum_order_amount FROM coupons
       WHERE UPPER(code) = ? AND status = 'active'
         AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP(6))
         AND (ends_at IS NULL OR ends_at >= UTC_TIMESTAMP(6))
         AND (usage_limit IS NULL OR usage_count < usage_limit)
       LIMIT 1 FOR UPDATE`,
      [code.toUpperCase()],
    );
    const coupon = coupons[0];
    if (!coupon) throw commerceError(422, 'Kupon geçersiz veya kullanım süresi dolmuş.', 'coupon_invalid');
    const [subtotalRows] = await connection.query(
      `SELECT COALESCE(SUM(pv.price * ci.quantity), 0) AS subtotal
       FROM cart_items ci INNER JOIN product_variants pv ON pv.id = ci.variant_id
       INNER JOIN products p ON p.id = pv.product_id
       WHERE ci.cart_id = ? AND ci.is_selected = 1 AND pv.status = 'active'
         AND pv.deleted_at IS NULL AND p.status = 'published' AND p.deleted_at IS NULL
         AND pv.stock_quantity >= ci.quantity`,
      [cart.id],
    );
    const subtotalMinor = toMinorUnits(subtotalRows[0].subtotal);
    if (subtotalMinor < toMinorUnits(coupon.minimum_order_amount || 0)) {
      throw commerceError(422, 'Sepet tutarı kuponun alt limitini karşılamıyor.', 'coupon_minimum_not_met');
    }
    await connection.query('UPDATE carts SET coupon_id = ? WHERE id = ?', [coupon.id, cart.id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(cartId, locale);
};

const removeCoupon = async (identity, locale) => {
  const connection = await getDb().getConnection();
  let cartId;
  try {
    await connection.beginTransaction();
    const cart = await findActiveCart(connection, identity, true);
    if (!cart) throw commerceError(404, 'Sepet bulunamadı.', 'cart_not_found');
    cartId = cart.id;
    await connection.query('UPDATE carts SET coupon_id = NULL WHERE id = ?', [cart.id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(cartId, locale);
};

const mergeGuestCart = async (userId, guestTokenHash, locale) => {
  const connection = await getDb().getConnection();
  let targetCartId;
  try {
    await connection.beginTransaction();
    const targetCart = await getOrCreateCart(connection, { userId });
    targetCartId = targetCart.id;
    if (!guestTokenHash) {
      await connection.commit();
      return loadCart(targetCartId, locale);
    }
    const [guestRows] = await connection.query(
      `SELECT id, status, merged_into_cart_id, coupon_id FROM carts
       WHERE guest_token_hash = ? AND user_id IS NULL LIMIT 1 FOR UPDATE`,
      [guestTokenHash],
    );
    const guestCart = guestRows[0];
    if (!guestCart || guestCart.id === targetCart.id) {
      await connection.commit();
      return loadCart(targetCartId, locale);
    }
    if (guestCart.status === 'merged') {
      await connection.commit();
      return loadCart(targetCartId, locale);
    }
    if (guestCart.status !== 'active') {
      await connection.commit();
      return loadCart(targetCartId, locale);
    }

    const [guestItems] = await connection.query(
      `SELECT ci.variant_id, ci.quantity, ci.is_selected, ci.unit_price_snapshot, pv.stock_quantity
       FROM cart_items ci INNER JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.cart_id = ? ORDER BY ci.id FOR UPDATE`,
      [guestCart.id],
    );
    for (const guestItem of guestItems) {
      const [targetItems] = await connection.query(
        'SELECT id, quantity, is_selected FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1 FOR UPDATE',
        [targetCart.id, guestItem.variant_id],
      );
      const mergedQuantity = Number(targetItems[0]?.quantity || 0) + Number(guestItem.quantity);
      const stockLimit = Number(guestItem.stock_quantity) > 0 ? Number(guestItem.stock_quantity) : MAX_CART_LINE_QUANTITY;
      const finalQuantity = Math.max(1, Math.min(MAX_CART_LINE_QUANTITY, stockLimit, mergedQuantity));
      if (targetItems[0]) {
        await connection.query(
          'UPDATE cart_items SET quantity = ?, is_selected = ? WHERE id = ?',
          [finalQuantity, (targetItems[0].is_selected || guestItem.is_selected) ? 1 : 0, targetItems[0].id],
        );
      } else {
        await connection.query(
          `INSERT INTO cart_items (cart_id, variant_id, quantity, is_selected, unit_price_snapshot)
           VALUES (?, ?, ?, ?, ?)`,
          [targetCart.id, guestItem.variant_id, finalQuantity, guestItem.is_selected ? 1 : 0, guestItem.unit_price_snapshot],
        );
      }
    }
    if (!targetCart.coupon_id && guestCart.coupon_id) {
      await connection.query('UPDATE carts SET coupon_id = ? WHERE id = ?', [guestCart.coupon_id, targetCart.id]);
    }
    await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [guestCart.id]);
    await connection.query(
      `UPDATE carts SET status = 'merged', coupon_id = NULL, merged_into_cart_id = ?,
         merged_at = UTC_TIMESTAMP(6), expires_at = NULL WHERE id = ?`,
      [targetCart.id, guestCart.id],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadCart(targetCartId, locale);
};

module.exports = {
  addItem,
  applyCoupon,
  emptyCart,
  getCart,
  mergeGuestCart,
  removeCoupon,
  removeItem,
  updateItem,
  updateSelection,
};
