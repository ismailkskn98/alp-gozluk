const { createHash } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getDb } = require('../models/db');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}$/;
const roleCodePattern = /^[a-z0-9_.-]{2,64}$/;

const normalizeRoleCodes = (roleCodes) => {
  if (!Array.isArray(roleCodes)) return [];
  return [...new Set(roleCodes.map((role) => String(role).trim()).filter((role) => roleCodePattern.test(role)))];
};

const getAssignableRoles = async (connection, roleCodes) => {
  if (roleCodes.length === 0 || roleCodes.length > 10) return [];
  const placeholders = roleCodes.map(() => '?').join(', ');
  const [roles] = await connection.query(
    `SELECT id, code, name
     FROM roles
     WHERE is_assignable = 1 AND code IN (${placeholders})
     ORDER BY name`,
    roleCodes,
  );
  return roles;
};

const addAuditLog = async (connection, req, action, entityId, changes) => {
  const ipHash = createHash('sha256').update(req.ip || '').digest('hex');
  await connection.query(
    `INSERT INTO audit_logs
      (user_id, action, entity_type, entity_id, request_id, ip_hash, changes_json)
     VALUES (?, ?, 'user', ?, ?, ?, ?)`,
    [req.user.id, action, entityId, req.requestId, ipHash, JSON.stringify(changes)],
  );
};

const getMutableUser = async (connection, userId) => {
  const [users] = await connection.query(
    `SELECT u.id, u.is_protected,
       EXISTS(
         SELECT 1 FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = u.id AND r.code = 'super_admin'
       ) AS is_super_admin
     FROM users u
     WHERE u.id = ? AND u.deleted_at IS NULL
     LIMIT 1
     FOR UPDATE`,
    [userId],
  );
  return users[0] || null;
};

exports.list = async (req, res) => {
  try {
    const [users] = await getDb().query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.is_protected,
         u.last_login_at, u.created_at,
         GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes,
         CASE WHEN utc.user_id IS NULL THEN 0 ELSE 1 END AS two_factor_configured
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_totp_credentials utc ON utc.user_id = u.id
       WHERE u.deleted_at IS NULL
         AND r.code <> 'customer'
       GROUP BY u.id, u.email, u.first_name, u.last_name, u.status, u.is_protected,
         u.last_login_at, u.created_at, utc.user_id
       ORDER BY u.is_protected DESC, u.created_at ASC`,
    );

    return res.json({
      status: true,
      message: req.t('admin_users.listed'),
      data: {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          status: user.status,
          isProtected: Boolean(user.is_protected),
          twoFactorConfigured: Boolean(user.two_factor_configured),
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          roles: user.role_codes ? user.role_codes.split(',') : [],
        })),
      },
    });
  } catch (error) {
    console.error('Yönetici kullanıcı listeleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.listRoles = async (req, res) => {
  try {
    const [roles] = await getDb().query(
      `SELECT code, name
       FROM roles
       WHERE is_assignable = 1
       ORDER BY name`,
    );
    return res.json({ status: true, message: req.t('admin_users.roles_listed'), data: { roles } });
  } catch (error) {
    console.error('Atanabilir rol listeleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.create = async (req, res) => {
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const roleCodes = normalizeRoleCodes(req.body.roleCodes);

  if (
    firstName.length < 2 || firstName.length > 80 ||
    lastName.length < 2 || lastName.length > 80 ||
    !emailPattern.test(email) || !passwordPattern.test(password) ||
    roleCodes.length === 0
  ) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }

  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const roles = await getAssignableRoles(connection, roleCodes);
    if (roles.length !== roleCodes.length) {
      await connection.rollback();
      return res.status(422).json({ status: false, message: req.t('admin_users.invalid_roles') });
    }

    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ status: false, message: req.t('auth.email_in_use') });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [email, passwordHash, firstName, lastName],
    );
    for (const role of roles) {
      await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [result.insertId, role.id]);
    }
    await addAuditLog(connection, req, 'admin_user.created', result.insertId, { email, roleCodes });
    await connection.commit();

    return res.status(201).json({
      status: true,
      message: req.t('admin_users.created'),
      data: { user: { id: result.insertId, email, firstName, lastName, status: 'active', roles: roleCodes } },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Yönetici kullanıcı oluşturma hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally {
    connection.release();
  }
};

exports.updateRoles = async (req, res) => {
  const userId = Number(req.params.id);
  const roleCodes = normalizeRoleCodes(req.body.roleCodes);
  if (!Number.isSafeInteger(userId) || userId <= 0 || roleCodes.length === 0) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }

  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const targetUser = await getMutableUser(connection, userId);
    if (!targetUser) {
      await connection.rollback();
      return res.status(404).json({ status: false, message: req.t('admin_users.not_found') });
    }
    if (targetUser.is_protected || targetUser.is_super_admin || userId === req.user.id) {
      await connection.rollback();
      return res.status(409).json({ status: false, message: req.t('admin_users.protected') });
    }

    const roles = await getAssignableRoles(connection, roleCodes);
    if (roles.length !== roleCodes.length) {
      await connection.rollback();
      return res.status(422).json({ status: false, message: req.t('admin_users.invalid_roles') });
    }

    await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    for (const role of roles) {
      await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, role.id]);
    }
    await connection.query(
      'UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE user_id = ? AND revoked_at IS NULL',
      [userId],
    );
    await addAuditLog(connection, req, 'admin_user.roles_updated', userId, { roleCodes });
    await connection.commit();
    return res.json({ status: true, message: req.t('admin_users.roles_updated'), data: {} });
  } catch (error) {
    await connection.rollback();
    console.error('Yönetici rol güncelleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally {
    connection.release();
  }
};

exports.updateStatus = async (req, res) => {
  const userId = Number(req.params.id);
  const status = String(req.body.status || '');
  if (!Number.isSafeInteger(userId) || userId <= 0 || !['active', 'disabled'].includes(status)) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }

  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const targetUser = await getMutableUser(connection, userId);
    if (!targetUser) {
      await connection.rollback();
      return res.status(404).json({ status: false, message: req.t('admin_users.not_found') });
    }
    if (targetUser.is_protected || targetUser.is_super_admin || userId === req.user.id) {
      await connection.rollback();
      return res.status(409).json({ status: false, message: req.t('admin_users.protected') });
    }

    await connection.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    if (status === 'disabled') {
      await connection.query(
        'UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE user_id = ? AND revoked_at IS NULL',
        [userId],
      );
    }
    await addAuditLog(connection, req, 'admin_user.status_updated', userId, { status });
    await connection.commit();
    return res.json({ status: true, message: req.t('admin_users.status_updated'), data: {} });
  } catch (error) {
    await connection.rollback();
    console.error('Yönetici durum güncelleme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally {
    connection.release();
  }
};

exports.remove = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_id') });
  }

  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const targetUser = await getMutableUser(connection, userId);
    if (!targetUser) {
      await connection.rollback();
      return res.status(404).json({ status: false, message: req.t('admin_users.not_found') });
    }
    if (targetUser.is_protected || targetUser.is_super_admin || userId === req.user.id) {
      await connection.rollback();
      return res.status(409).json({ status: false, message: req.t('admin_users.protected') });
    }

    await connection.query(
      "UPDATE users SET status = 'deleted', deleted_at = UTC_TIMESTAMP(6) WHERE id = ?",
      [userId],
    );
    await connection.query(
      'UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE user_id = ? AND revoked_at IS NULL',
      [userId],
    );
    await addAuditLog(connection, req, 'admin_user.deleted', userId, {});
    await connection.commit();
    return res.json({ status: true, message: req.t('admin_users.deleted'), data: {} });
  } catch (error) {
    await connection.rollback();
    console.error('Yönetici kullanıcı silme hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally {
    connection.release();
  }
};
