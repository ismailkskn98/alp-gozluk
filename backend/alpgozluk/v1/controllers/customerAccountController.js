const { getDb } = require('../models/db');
const { getStorage } = require('../../../general_services/storage');

const genders = new Set(['female', 'male', 'prefer_not_to_say']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stringValue(value, maxLength) {
  const result = String(value || '').trim();
  return result.length <= maxLength ? result : null;
}

function booleanValue(value) {
  return value === true || value === 1 || value === '1';
}

function serializeUser(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birth_date,
    gender: row.gender,
    marketingEmailOptIn: Boolean(row.marketing_email_opt_in),
    marketingSmsOptIn: Boolean(row.marketing_sms_opt_in),
    createdAt: row.created_at,
  };
}

function serializeAddress(row) {
  return {
    id: row.id,
    title: row.title,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    countryCode: row.country_code,
    city: row.city,
    district: row.district,
    postalCode: row.postal_code,
    addressLine: row.address_line,
    isDefault: Boolean(row.is_default),
  };
}

function serializeOrder(row) {
  return {
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    placedAt: row.placed_at || row.created_at,
    itemCount: Number(row.item_count),
  };
}

async function getAccountData(userId) {
  const database = getDb();
  const [userRows, addressRows, orderRows, favoriteRows] = await Promise.all([
    database.query(`SELECT id, email, first_name, last_name, phone, birth_date, gender,
      marketing_email_opt_in, marketing_sms_opt_in, created_at FROM users WHERE id = ? LIMIT 1`, [userId]),
    database.query(`SELECT id, title, first_name, last_name, phone, country_code, city, district,
      postal_code, address_line, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`, [userId]),
    database.query(`SELECT o.order_number, o.status, o.payment_status, o.fulfillment_status,
      o.total_amount, o.currency, o.placed_at, o.created_at, COUNT(oi.id) AS item_count
      FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ? GROUP BY o.id ORDER BY COALESCE(o.placed_at, o.created_at) DESC LIMIT 12`, [userId]),
    database.query(`SELECT p.id, pt.slug, pt.name,
      (SELECT pv.price FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'active' ORDER BY pv.price ASC, pv.id ASC LIMIT 1) AS price_amount,
      'TRY' AS currency,
      (SELECT m.storage_key FROM media_assets m WHERE m.entity_type = 'product' AND m.entity_id = p.id ORDER BY m.sort_order ASC, m.id ASC LIMIT 1) AS storage_key,
      (SELECT m.storage_driver FROM media_assets m WHERE m.entity_type = 'product' AND m.entity_id = p.id ORDER BY m.sort_order ASC, m.id ASC LIMIT 1) AS storage_driver,
      (SELECT m.visibility FROM media_assets m WHERE m.entity_type = 'product' AND m.entity_id = p.id ORDER BY m.sort_order ASC, m.id ASC LIMIT 1) AS visibility
      FROM customer_favorites cf
      INNER JOIN products p ON p.id = cf.product_id
      INNER JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'tr'
      WHERE cf.user_id = ? AND p.status = 'published'
      ORDER BY cf.created_at DESC`, [userId]),
  ]);

  return {
    profile: userRows[0][0] ? serializeUser(userRows[0][0]) : null,
    addresses: addressRows[0].map(serializeAddress),
    orders: orderRows[0].map(serializeOrder),
    favorites: await Promise.all(favoriteRows[0].map(async (row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      priceAmount: row.price_amount === null ? null : Number(row.price_amount),
      currency: row.currency || 'TRY',
      imageUrl: row.storage_key ? await getStorage(row.storage_driver).getUrl(row.storage_key, { visibility: row.visibility }) : null,
    }))),
  };
}

exports.overview = async (req, res) => {
  try {
    const data = await getAccountData(req.user.id);
    return res.json({ status: true, message: req.t('health.ready'), data });
  } catch (error) {
    console.error('Müşteri hesap özeti hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.updateProfile = async (req, res) => {
  const firstName = stringValue(req.body.firstName, 80);
  const lastName = stringValue(req.body.lastName, 80);
  const phone = stringValue(req.body.phone, 32);
  const birthDate = req.body.birthDate ? String(req.body.birthDate) : null;
  const gender = req.body.gender ? String(req.body.gender) : null;

  if (!firstName || firstName.length < 2 || !lastName || lastName.length < 2 || (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) || (gender && !genders.has(gender))) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }

  try {
    await getDb().query(`UPDATE users SET first_name = ?, last_name = ?, phone = ?, birth_date = ?, gender = ?,
      marketing_email_opt_in = ?, marketing_sms_opt_in = ? WHERE id = ?`, [
      firstName, lastName, phone || null, birthDate, gender,
      booleanValue(req.body.marketingEmailOptIn), booleanValue(req.body.marketingSmsOptIn), req.user.id,
    ]);
    const data = await getAccountData(req.user.id);
    return res.json({ status: true, message: 'Profil güncellendi.', data });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.createAddress = async (req, res) => {
  const fields = ['title', 'firstName', 'lastName', 'phone', 'city', 'district', 'addressLine'];
  const values = Object.fromEntries(fields.map((field) => [field, stringValue(req.body[field], field === 'addressLine' ? 1000 : 100)]));
  if (Object.values(values).some((value) => !value)) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  const postalCode = stringValue(req.body.postalCode, 20);
  const isDefault = booleanValue(req.body.isDefault);
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    if (isDefault) await connection.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await connection.query(`INSERT INTO addresses (user_id, title, first_name, last_name, phone, country_code, city, district, postal_code, address_line, is_default)
      VALUES (?, ?, ?, ?, ?, 'TR', ?, ?, ?, ?, ?)`, [req.user.id, values.title, values.firstName, values.lastName, values.phone, values.city, values.district, postalCode, values.addressLine, isDefault]);
    await connection.commit();
    return res.status(201).json({ status: true, message: 'Adres eklendi.', data: await getAccountData(req.user.id) });
  } catch (error) {
    await connection.rollback();
    console.error('Adres ekleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally { connection.release(); }
};

exports.updateAddress = async (req, res) => {
  const addressId = Number(req.params.addressId);
  const fields = ['title', 'firstName', 'lastName', 'phone', 'city', 'district', 'addressLine'];
  const values = Object.fromEntries(fields.map((field) => [field, stringValue(req.body[field], field === 'addressLine' ? 1000 : 100)]));
  if (!Number.isSafeInteger(addressId) || addressId < 1 || Object.values(values).some((value) => !value)) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  const postalCode = stringValue(req.body.postalCode, 20);
  const isDefault = booleanValue(req.body.isDefault);
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    if (isDefault) await connection.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    const [result] = await connection.query(`UPDATE addresses SET title = ?, first_name = ?, last_name = ?, phone = ?, city = ?, district = ?, postal_code = ?, address_line = ?, is_default = ? WHERE id = ? AND user_id = ?`, [
      values.title, values.firstName, values.lastName, values.phone, values.city, values.district, postalCode, values.addressLine, isDefault, addressId, req.user.id,
    ]);
    if (result.affectedRows === 0) { await connection.rollback(); return res.status(404).json({ status: false, message: 'Adres bulunamadı.' }); }
    await connection.commit();
    return res.json({ status: true, message: 'Adres güncellendi.', data: await getAccountData(req.user.id) });
  } catch (error) {
    await connection.rollback();
    console.error('Adres güncelleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally { connection.release(); }
};

exports.deleteAddress = async (req, res) => {
  const addressId = Number(req.params.addressId);
  if (!Number.isSafeInteger(addressId) || addressId < 1) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    const [result] = await getDb().query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ status: false, message: 'Adres bulunamadı.' });
    return res.json({ status: true, message: 'Adres silindi.', data: await getAccountData(req.user.id) });
  } catch (error) {
    console.error('Adres silme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.removeFavorite = async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isSafeInteger(productId) || productId < 1) return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  try {
    await getDb().query('DELETE FROM customer_favorites WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    return res.json({ status: true, message: 'Ürün favorilerden çıkarıldı.', data: await getAccountData(req.user.id) });
  } catch (error) {
    console.error('Favori silme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};
