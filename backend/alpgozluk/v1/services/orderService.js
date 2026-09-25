const { getStorage } = require('../../../general_services/storage');
const { calculateCouponDiscount, fromMinorUnits, toMinorUnits } = require('../helpers/commerce');
const {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  RESERVATION_STATUSES,
  allocateDiscountMinor,
  calculateIncludedTaxMinor,
  createOrderNumber,
} = require('../helpers/orderCore');
const { getDb } = require('../models/db');

const RESERVATION_MINUTES = 20;
const allowedLocales = new Set(['tr', 'en']);

const commerceError = (statusCode, publicMessage, code) => {
  const error = new Error(code || publicMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  error.code = code;
  return error;
};

const normalizeLocale = (locale) => allowedLocales.has(locale) ? locale : 'tr';

const ownsOrder = (order, identity) => (
  identity.userId
    ? Number(order.user_id) === Number(identity.userId)
    : Boolean(identity.orderTokenHash) && order.guest_access_token_hash === identity.orderTokenHash
);

const findIdempotentOrder = async (connection, idempotencyKey, identity) => {
  const [rows] = await connection.query(
    `SELECT id, user_id, guest_access_token_hash
     FROM orders WHERE checkout_idempotency_key = ? LIMIT 1 FOR UPDATE`,
    [idempotencyKey],
  );
  if (!rows[0]) return null;
  if (!ownsOrder(rows[0], identity)) {
    throw commerceError(409, 'Bu işlem anahtarı başka bir checkout işlemi için kullanılmış.', 'idempotency_conflict');
  }
  return rows[0];
};

const findCartForCheckout = async (connection, identity) => {
  const condition = identity.userId ? 'c.user_id = ?' : 'c.guest_token_hash = ?';
  const value = identity.userId || identity.cartTokenHash;
  const [rows] = await connection.query(
    `SELECT c.id, c.user_id, c.guest_token_hash, c.currency, c.coupon_id,
       cp.code AS coupon_code, cp.discount_type, cp.discount_value, cp.minimum_order_amount,
       CASE WHEN cp.id IS NOT NULL AND cp.status = 'active'
         AND (cp.starts_at IS NULL OR cp.starts_at <= UTC_TIMESTAMP(6))
         AND (cp.ends_at IS NULL OR cp.ends_at >= UTC_TIMESTAMP(6))
         AND (cp.usage_limit IS NULL OR cp.usage_count < cp.usage_limit)
       THEN 1 ELSE 0 END AS coupon_active
     FROM carts c
     LEFT JOIN coupons cp ON cp.id = c.coupon_id
     WHERE ${condition} AND c.status = 'active' LIMIT 1 FOR UPDATE`,
    [value],
  );
  return rows[0] || null;
};

const loadCheckoutItems = async (connection, cartId, locale) => {
  const [rows] = await connection.query(
    `SELECT ci.id AS cart_item_id, ci.variant_id, ci.quantity,
       p.id AS product_id, p.code AS product_code, p.status AS product_status,
       p.deleted_at AS product_deleted_at, p.tax_rate,
       COALESCE(b.name, p.brand) AS brand_name,
       COALESCE(pt.name, fallback_pt.name, p.code) AS product_name,
       pv.sku, pv.color_code, pv.frame_size, pv.price, pv.stock_quantity,
       pv.status AS variant_status, pv.deleted_at AS variant_deleted_at,
       (SELECT ma.storage_key FROM media_assets ma
        WHERE ma.entity_type = 'product' AND ma.entity_id = p.id
        ORDER BY ma.sort_order, ma.id LIMIT 1) AS image_storage_key,
       (SELECT ma.storage_driver FROM media_assets ma
        WHERE ma.entity_type = 'product' AND ma.entity_id = p.id
        ORDER BY ma.sort_order, ma.id LIMIT 1) AS image_storage_driver,
       (SELECT ma.alt_text FROM media_assets ma
        WHERE ma.entity_type = 'product' AND ma.entity_id = p.id
        ORDER BY ma.sort_order, ma.id LIMIT 1) AS image_alt_text
     FROM cart_items ci
     INNER JOIN product_variants pv ON pv.id = ci.variant_id
     INNER JOIN products p ON p.id = pv.product_id
     LEFT JOIN brands b ON b.id = p.brand_id AND b.deleted_at IS NULL
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = ?
     LEFT JOIN product_translations fallback_pt ON fallback_pt.product_id = p.id AND fallback_pt.locale = 'tr'
     WHERE ci.cart_id = ? AND ci.is_selected = 1
     ORDER BY ci.id FOR UPDATE`,
    [locale, cartId],
  );
  return rows;
};

const buildCheckoutTotals = (cart, items) => {
  const lineSubtotals = items.map((item) => toMinorUnits(item.price) * Number(item.quantity));
  const subtotalMinor = lineSubtotals.reduce((total, amount) => total + amount, 0);
  const minimumMinor = cart.minimum_order_amount === null ? 0 : toMinorUnits(cart.minimum_order_amount);
  const couponValid = Boolean(cart.coupon_id) && Boolean(cart.coupon_active) && subtotalMinor >= minimumMinor;
  const discountMinor = couponValid ? calculateCouponDiscount(cart, subtotalMinor) : 0;
  const lineDiscounts = allocateDiscountMinor(lineSubtotals, discountMinor);
  const lineTaxes = items.map((item, index) => (
    calculateIncludedTaxMinor(lineSubtotals[index] - lineDiscounts[index], item.tax_rate)
  ));
  const shippingMinor = 0;

  return {
    couponId: couponValid ? cart.coupon_id : null,
    couponCode: couponValid ? cart.coupon_code : null,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor: lineTaxes.reduce((total, amount) => total + amount, 0),
    totalMinor: Math.max(0, subtotalMinor - discountMinor + shippingMinor),
    lineSubtotals,
    lineDiscounts,
    lineTaxes,
  };
};

const insertOrder = async (connection, values) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const orderNumber = createOrderNumber();
    try {
      const [result] = await connection.query(
        `INSERT INTO orders
          (order_number, user_id, coupon_id, source_cart_id, checkout_idempotency_key,
           guest_access_token_hash, status, payment_status, fulfillment_status, currency,
           subtotal_amount, discount_amount, shipping_amount, tax_amount, total_amount,
           customer_first_name, customer_last_name, customer_email, customer_phone, coupon_code,
           shipping_method_code, shipping_method_name, notes, reservation_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ${RESERVATION_MINUTES} MINUTE))`,
        [
          orderNumber,
          values.userId,
          values.totals.couponId,
          values.cartId,
          values.idempotencyKey,
          values.guestTokenHash,
          ORDER_STATUSES.PENDING_PAYMENT,
          PAYMENT_STATUSES.PENDING,
          FULFILLMENT_STATUSES.UNFULFILLED,
          values.currency,
          fromMinorUnits(values.totals.subtotalMinor),
          fromMinorUnits(values.totals.discountMinor),
          fromMinorUnits(values.totals.shippingMinor),
          fromMinorUnits(values.totals.taxMinor),
          fromMinorUnits(values.totals.totalMinor),
          values.customer.firstName,
          values.customer.lastName,
          values.customer.email,
          values.customer.phone,
          values.totals.couponCode,
          'standard',
          values.locale === 'en' ? 'Standard delivery' : 'Standart teslimat',
          values.notes || null,
        ],
      );
      return { id: result.insertId, orderNumber };
    } catch (error) {
      const orderNumberCollision = error.code === 'ER_DUP_ENTRY' && String(error.message).includes('uq_orders_order_number');
      if (!orderNumberCollision || attempt === 2) throw error;
    }
  }
  throw commerceError(500, 'Sipariş numarası oluşturulamadı.', 'order_number_failed');
};

const insertAddress = (connection, orderId, addressType, address) => connection.query(
  `INSERT INTO order_addresses
    (order_id, address_type, first_name, last_name, phone, country_code,
     city, district, postal_code, address_line)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    orderId,
    addressType,
    address.firstName,
    address.lastName,
    address.phone,
    address.countryCode,
    address.city,
    address.district,
    address.postalCode || null,
    address.addressLine,
  ],
);

const insertOrderItemAndReservation = async (connection, order, item, amounts) => {
  const quantity = Number(item.quantity);
  const unitPriceMinor = toMinorUnits(item.price);
  const [itemResult] = await connection.query(
    `INSERT INTO order_items
      (order_id, product_id, variant_id, source_cart_item_id, product_code, brand_name, product_name, sku,
       color_code, frame_size, image_storage_key, image_storage_driver, image_alt_text,
       quantity, unit_price, unit_tax_amount, discount_amount, tax_amount, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      item.product_id,
      item.variant_id,
      item.cart_item_id,
      item.product_code,
      item.brand_name,
      item.product_name,
      item.sku,
      item.color_code,
      item.frame_size,
      item.image_storage_key,
      item.image_storage_driver,
      item.image_alt_text,
      quantity,
      fromMinorUnits(unitPriceMinor),
      fromMinorUnits(calculateIncludedTaxMinor(unitPriceMinor, item.tax_rate)),
      fromMinorUnits(amounts.discountMinor),
      fromMinorUnits(amounts.taxMinor),
      fromMinorUnits(amounts.subtotalMinor - amounts.discountMinor),
    ],
  );

  const [stockResult] = await connection.query(
    `UPDATE product_variants
     SET stock_quantity = stock_quantity - ?
     WHERE id = ? AND status = 'active' AND deleted_at IS NULL AND stock_quantity >= ?`,
    [quantity, item.variant_id, quantity],
  );
  if (stockResult.affectedRows !== 1) {
    throw commerceError(409, `${item.product_name} için yeterli stok bulunmuyor.`, 'insufficient_stock');
  }

  const [balanceRows] = await connection.query(
    'SELECT stock_quantity FROM product_variants WHERE id = ? LIMIT 1',
    [item.variant_id],
  );
  await connection.query(
    `INSERT INTO inventory_movements
      (variant_id, movement_type, quantity, balance_after, reference_type, reference_id, note)
     VALUES (?, 'reservation_hold', ?, ?, 'order', ?, ?)`,
    [item.variant_id, -quantity, balanceRows[0].stock_quantity, order.id, order.orderNumber],
  );
  await connection.query(
    `INSERT INTO stock_reservations
      (order_id, order_item_id, variant_id, quantity, status, expires_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ${RESERVATION_MINUTES} MINUTE))`,
    [order.id, itemResult.insertId, item.variant_id, quantity, RESERVATION_STATUSES.ACTIVE],
  );
};

const addHistory = (connection, orderId, statuses, source, note = null) => connection.query(
  `INSERT INTO order_status_history
    (order_id, order_status, payment_status, fulfillment_status, source, note)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [orderId, statuses.order, statuses.payment, statuses.fulfillment, source, note],
);

const loadOrder = async (database, orderId) => {
  const [[orderRows], [addressRows], [itemRows]] = await Promise.all([
    database.query(
      `SELECT order_number, status, payment_status, fulfillment_status, currency,
         subtotal_amount, discount_amount, shipping_amount, tax_amount, total_amount,
         customer_first_name, customer_last_name, customer_email, customer_phone,
         coupon_code, shipping_method_code, shipping_method_name, notes,
         reservation_expires_at, placed_at, cancelled_at, created_at, updated_at
       FROM orders WHERE id = ? LIMIT 1`,
      [orderId],
    ),
    database.query(
      `SELECT address_type, first_name, last_name, phone, country_code, city,
         district, postal_code, address_line
       FROM order_addresses WHERE order_id = ? ORDER BY id`,
      [orderId],
    ),
    database.query(
      `SELECT product_id, variant_id, product_code, brand_name, product_name, sku,
         color_code, frame_size, image_storage_key, image_storage_driver, image_alt_text,
         quantity, unit_price, discount_amount, tax_amount, total_amount
       FROM order_items WHERE order_id = ? ORDER BY id`,
      [orderId],
    ),
  ]);
  const row = orderRows[0];
  if (!row) return null;

  const items = await Promise.all(itemRows.map(async (item) => ({
    productId: item.product_id,
    variantId: item.variant_id,
    productCode: item.product_code,
    brand: item.brand_name,
    name: item.product_name,
    sku: item.sku,
    colorCode: item.color_code,
    frameSize: item.frame_size,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    discountAmount: Number(item.discount_amount),
    taxAmount: Number(item.tax_amount),
    totalAmount: Number(item.total_amount),
    image: item.image_storage_key ? {
      url: await getStorage(item.image_storage_driver).getUrl(item.image_storage_key, { visibility: 'public' }),
      altText: item.image_alt_text,
    } : null,
  })));

  return {
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    currency: row.currency,
    subtotalAmount: Number(row.subtotal_amount),
    discountAmount: Number(row.discount_amount),
    shippingAmount: Number(row.shipping_amount),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    couponCode: row.coupon_code,
    shippingMethod: { code: row.shipping_method_code, name: row.shipping_method_name },
    notes: row.notes,
    reservationExpiresAt: row.reservation_expires_at,
    placedAt: row.placed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    addresses: addressRows.map((address) => ({
      type: address.address_type,
      firstName: address.first_name,
      lastName: address.last_name,
      phone: address.phone,
      countryCode: address.country_code,
      city: address.city,
      district: address.district,
      postalCode: address.postal_code,
      addressLine: address.address_line,
    })),
    items,
  };
};

const prepareOrder = async ({ identity, idempotencyKey, customer, shippingAddress, billingAddress, notes, locale }, database = getDb()) => {
  const connection = await database.getConnection();
  let orderId;
  let reused = false;
  try {
    await connection.beginTransaction();
    const existingOrder = await findIdempotentOrder(connection, idempotencyKey, identity);
    if (existingOrder) {
      orderId = existingOrder.id;
      reused = true;
      await connection.commit();
    } else {
      const cart = await findCartForCheckout(connection, identity);
      if (!cart) throw commerceError(404, 'Aktif sepet bulunamadı.', 'cart_not_found');
      const items = await loadCheckoutItems(connection, cart.id, normalizeLocale(locale));
      if (items.length === 0) throw commerceError(422, 'Checkout için seçili ürün bulunmuyor.', 'cart_empty');

      for (const item of items) {
        const purchasable = item.product_status === 'published' && !item.product_deleted_at &&
          item.variant_status === 'active' && !item.variant_deleted_at;
        if (!purchasable) throw commerceError(409, `${item.product_name} artık satın alınamıyor.`, 'item_unavailable');
        if (Number(item.stock_quantity) < Number(item.quantity)) {
          throw commerceError(409, `${item.product_name} için yeterli stok bulunmuyor.`, 'insufficient_stock');
        }
      }

      const totals = buildCheckoutTotals(cart, items);
      const order = await insertOrder(connection, {
        userId: identity.userId || null,
        guestTokenHash: identity.userId ? null : identity.orderTokenHash,
        cartId: cart.id,
        currency: cart.currency,
        idempotencyKey,
        customer,
        locale: normalizeLocale(locale),
        notes,
        totals,
      });
      orderId = order.id;
      await insertAddress(connection, order.id, 'shipping', shippingAddress);
      await insertAddress(connection, order.id, 'billing', billingAddress || shippingAddress);

      for (let index = 0; index < items.length; index += 1) {
        await insertOrderItemAndReservation(connection, order, items[index], {
          subtotalMinor: totals.lineSubtotals[index],
          discountMinor: totals.lineDiscounts[index],
          taxMinor: totals.lineTaxes[index],
        });
      }
      await addHistory(connection, order.id, {
        order: ORDER_STATUSES.PENDING_PAYMENT,
        payment: PAYMENT_STATUSES.PENDING,
        fulfillment: FULFILLMENT_STATUSES.UNFULFILLED,
      }, 'checkout', 'Sipariş oluşturuldu ve stok ayrıldı.');
      await connection.commit();
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { order: await loadOrder(database, orderId), reused };
};

const findAccessibleOrder = async (database, orderNumber, identity, lock = false) => {
  const [rows] = await database.query(
    `SELECT id, user_id, guest_access_token_hash, status, payment_status, fulfillment_status
     FROM orders WHERE order_number = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [orderNumber],
  );
  if (!rows[0] || !ownsOrder(rows[0], identity)) {
    throw commerceError(404, 'Sipariş bulunamadı.', 'order_not_found');
  }
  return rows[0];
};

const getOrder = async ({ orderNumber, identity }, database = getDb()) => {
  const row = await findAccessibleOrder(database, orderNumber, identity);
  return loadOrder(database, row.id);
};

const commitPaidOrder = async ({ orderId, paymentId = null }, database = getDb()) => {
  const connection = await database.getConnection();
  let resolvedOrderId = orderId;
  let reused = false;
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.query(
      `SELECT id, coupon_id, source_cart_id, status, payment_status, fulfillment_status
       FROM orders WHERE id = ? LIMIT 1 FOR UPDATE`,
      [orderId],
    );
    const order = orderRows[0];
    if (!order) throw commerceError(404, 'Sipariş bulunamadı.', 'order_not_found');
    resolvedOrderId = order.id;

    if (order.status === ORDER_STATUSES.PROCESSING && order.payment_status === PAYMENT_STATUSES.PAID) {
      reused = true;
      await connection.commit();
    } else {
      if (order.status !== ORDER_STATUSES.PENDING_PAYMENT || order.payment_status !== PAYMENT_STATUSES.PENDING) {
        throw commerceError(409, 'Sipariş ödeme için uygun durumda değil.', 'order_not_payable');
      }

      const [reservationResult] = await connection.query(
        `UPDATE stock_reservations SET status = ?, committed_at = UTC_TIMESTAMP(6)
         WHERE order_id = ? AND status = ?`,
        [RESERVATION_STATUSES.COMMITTED, order.id, RESERVATION_STATUSES.ACTIVE],
      );
      if (reservationResult.affectedRows === 0) {
        throw commerceError(409, 'Siparişe ait aktif stok rezervasyonu bulunamadı.', 'reservation_missing');
      }

      if (paymentId !== null) {
        const [paymentResult] = await connection.query(
          `UPDATE payments SET status = ?, paid_at = UTC_TIMESTAMP(6), completed_at = UTC_TIMESTAMP(6)
           WHERE id = ? AND order_id = ? AND status IN (?, ?)`,
          [PAYMENT_STATUSES.PAID, paymentId, order.id, PAYMENT_STATUSES.INITIALIZED, PAYMENT_STATUSES.PENDING],
        );
        if (paymentResult.affectedRows !== 1) {
          throw commerceError(409, 'Ödeme denemesi güncellenemedi.', 'payment_attempt_conflict');
        }
      }

      await connection.query(
        `UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ?,
           placed_at = UTC_TIMESTAMP(6), reservation_expires_at = NULL WHERE id = ?`,
        [ORDER_STATUSES.PROCESSING, PAYMENT_STATUSES.PAID, FULFILLMENT_STATUSES.PREPARING, order.id],
      );
      if (order.coupon_id) {
        await connection.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?', [order.coupon_id]);
      }
      if (order.source_cart_id) {
        await connection.query(
          `DELETE ci FROM cart_items ci
           INNER JOIN order_items oi ON oi.source_cart_item_id = ci.id
           WHERE oi.order_id = ? AND ci.cart_id = ?`,
          [order.id, order.source_cart_id],
        );
        await connection.query('UPDATE carts SET coupon_id = NULL WHERE id = ?', [order.source_cart_id]);
      }
      await addHistory(connection, order.id, {
        order: ORDER_STATUSES.PROCESSING,
        payment: PAYMENT_STATUSES.PAID,
        fulfillment: FULFILLMENT_STATUSES.PREPARING,
      }, 'payment', 'Ödeme doğrulandı ve stok rezervasyonu kesinleştirildi.');
      await connection.commit();
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { order: await loadOrder(database, resolvedOrderId), reused };
};

const releaseActiveReservations = async (connection, orderId, nextStatus, reason) => {
  const [reservations] = await connection.query(
    `SELECT id, variant_id, quantity FROM stock_reservations
     WHERE order_id = ? AND status = ? ORDER BY id FOR UPDATE`,
    [orderId, RESERVATION_STATUSES.ACTIVE],
  );
  for (const reservation of reservations) {
    await connection.query(
      'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [reservation.quantity, reservation.variant_id],
    );
    const [balanceRows] = await connection.query(
      'SELECT stock_quantity FROM product_variants WHERE id = ? LIMIT 1',
      [reservation.variant_id],
    );
    await connection.query(
      `INSERT INTO inventory_movements
        (variant_id, movement_type, quantity, balance_after, reference_type, reference_id, note)
       VALUES (?, 'reservation_release', ?, ?, 'order', ?, ?)`,
      [reservation.variant_id, reservation.quantity, balanceRows[0].stock_quantity, orderId, reason],
    );
    await connection.query(
      `UPDATE stock_reservations SET status = ?, released_at = UTC_TIMESTAMP(6), release_reason = ?
       WHERE id = ? AND status = ?`,
      [nextStatus, reason, reservation.id, RESERVATION_STATUSES.ACTIVE],
    );
  }
  return reservations.length;
};

const cancelOrder = async ({ orderNumber, identity, reason = 'customer_cancelled' }, database = getDb()) => {
  const connection = await database.getConnection();
  let orderId;
  try {
    await connection.beginTransaction();
    const order = await findAccessibleOrder(connection, orderNumber, identity, true);
    orderId = order.id;
    if (order.status === ORDER_STATUSES.CANCELLED) {
      await connection.commit();
      return { order: await loadOrder(database, orderId), reused: true };
    }
    if (order.status !== ORDER_STATUSES.PENDING_PAYMENT) {
      throw commerceError(409, 'Bu aşamadaki sipariş doğrudan iptal edilemez.', 'order_not_cancellable');
    }

    await releaseActiveReservations(connection, order.id, RESERVATION_STATUSES.RELEASED, reason);
    await connection.query(
      `UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ?,
         reservation_expires_at = NULL, cancelled_at = UTC_TIMESTAMP(6), cancellation_reason = ? WHERE id = ?`,
      [ORDER_STATUSES.CANCELLED, PAYMENT_STATUSES.CANCELLED, FULFILLMENT_STATUSES.CANCELLED, reason, order.id],
    );
    await connection.query(
      `UPDATE payments SET status = ?, completed_at = UTC_TIMESTAMP(6)
       WHERE order_id = ? AND status IN (?, ?)`,
      [PAYMENT_STATUSES.CANCELLED, order.id, PAYMENT_STATUSES.INITIALIZED, PAYMENT_STATUSES.PENDING],
    );
    await addHistory(connection, order.id, {
      order: ORDER_STATUSES.CANCELLED,
      payment: PAYMENT_STATUSES.CANCELLED,
      fulfillment: FULFILLMENT_STATUSES.CANCELLED,
    }, 'customer', reason);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return { order: await loadOrder(database, orderId), reused: false };
};

const failOrderPayment = async ({ orderId, paymentId = null, reason = 'payment_failed' }, database = getDb()) => {
  const connection = await database.getConnection();
  let reused = false;
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.query(
      'SELECT id, status, payment_status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
      [orderId],
    );
    const order = orderRows[0];
    if (!order) throw commerceError(404, 'Sipariş bulunamadı.', 'order_not_found');
    if (order.status === ORDER_STATUSES.CANCELLED && order.payment_status === PAYMENT_STATUSES.FAILED) {
      reused = true;
      await connection.commit();
    } else {
      if (order.status !== ORDER_STATUSES.PENDING_PAYMENT || order.payment_status !== PAYMENT_STATUSES.PENDING) {
        throw commerceError(409, 'Sipariş başarısız ödeme için uygun durumda değil.', 'order_not_payable');
      }
      await releaseActiveReservations(connection, order.id, RESERVATION_STATUSES.RELEASED, reason);
      if (paymentId !== null) {
        const [paymentResult] = await connection.query(
          `UPDATE payments SET status = ?, failure_code = ?, completed_at = UTC_TIMESTAMP(6)
           WHERE id = ? AND order_id = ? AND status IN (?, ?)`,
          [PAYMENT_STATUSES.FAILED, reason, paymentId, order.id,
            PAYMENT_STATUSES.INITIALIZED, PAYMENT_STATUSES.PENDING],
        );
        if (paymentResult.affectedRows !== 1) {
          throw commerceError(409, 'Ödeme denemesi güncellenemedi.', 'payment_attempt_conflict');
        }
      }
      await connection.query(
        `UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ?,
           reservation_expires_at = NULL, cancelled_at = UTC_TIMESTAMP(6), cancellation_reason = ?
         WHERE id = ?`,
        [ORDER_STATUSES.CANCELLED, PAYMENT_STATUSES.FAILED, FULFILLMENT_STATUSES.CANCELLED, reason, order.id],
      );
      await addHistory(connection, order.id, {
        order: ORDER_STATUSES.CANCELLED,
        payment: PAYMENT_STATUSES.FAILED,
        fulfillment: FULFILLMENT_STATUSES.CANCELLED,
      }, 'payment', reason);
      await connection.commit();
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return { order: await loadOrder(database, orderId), reused };
};

const expireReservations = async (limit = 100, database = getDb()) => {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const [orders] = await database.query(
    `SELECT DISTINCT o.id
     FROM orders o INNER JOIN stock_reservations sr ON sr.order_id = o.id
     WHERE o.status = ? AND sr.status = ? AND sr.expires_at <= UTC_TIMESTAMP(6)
     ORDER BY o.id LIMIT ?`,
    [ORDER_STATUSES.PENDING_PAYMENT, RESERVATION_STATUSES.ACTIVE, safeLimit],
  );
  let expired = 0;

  for (const orderRow of orders) {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const [lockedRows] = await connection.query(
        'SELECT id, status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
        [orderRow.id],
      );
      if (lockedRows[0]?.status !== ORDER_STATUSES.PENDING_PAYMENT) {
        await connection.commit();
        continue;
      }
      const released = await releaseActiveReservations(
        connection,
        orderRow.id,
        RESERVATION_STATUSES.EXPIRED,
        'payment_reservation_expired',
      );
      if (released === 0) {
        await connection.commit();
        continue;
      }
      await connection.query(
        `UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ?,
           reservation_expires_at = NULL, cancelled_at = UTC_TIMESTAMP(6),
           cancellation_reason = 'payment_reservation_expired'
         WHERE id = ?`,
        [ORDER_STATUSES.CANCELLED, PAYMENT_STATUSES.EXPIRED, FULFILLMENT_STATUSES.CANCELLED, orderRow.id],
      );
      await connection.query(
        `UPDATE payments SET status = ?, completed_at = UTC_TIMESTAMP(6)
         WHERE order_id = ? AND status IN (?, ?)`,
        [PAYMENT_STATUSES.EXPIRED, orderRow.id, PAYMENT_STATUSES.INITIALIZED, PAYMENT_STATUSES.PENDING],
      );
      await addHistory(connection, orderRow.id, {
        order: ORDER_STATUSES.CANCELLED,
        payment: PAYMENT_STATUSES.EXPIRED,
        fulfillment: FULFILLMENT_STATUSES.CANCELLED,
      }, 'system', 'Ödeme süresi dolduğu için stok serbest bırakıldı.');
      await connection.commit();
      expired += 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  return expired;
};

module.exports = {
  RESERVATION_MINUTES,
  buildCheckoutTotals,
  cancelOrder,
  commitPaidOrder,
  expireReservations,
  failOrderPayment,
  getOrder,
  prepareOrder,
};
