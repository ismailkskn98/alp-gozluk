const bcrypt = require('bcryptjs');
const { getDb } = require('../models/db');
const { getRedisClient, buildRedisKey } = require('../models/redis');
const { createSession } = require('../services/authSessionService');
const { signInWithGoogle } = require('../services/googleAuthService');
const { createGoogleNonce } = require('../services/googleNonceService');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{10,128}$/;

exports.register = async (req, res) => {
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (
    firstName.length < 2 || firstName.length > 80 ||
    lastName.length < 2 || lastName.length > 80 ||
    !emailPattern.test(email) || !passwordPattern.test(password)
  ) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }

  const database = getDb();
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

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

    await connection.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT ?, id FROM roles WHERE code = 'customer' LIMIT 1`,
      [result.insertId],
    );

    const user = { id: result.insertId, email, firstName, lastName, roles: ['customer'] };
    const session = await createSession(connection, user, req);
    await connection.commit();

    return res.status(201).json({
      status: true,
      message: req.t('auth.registered'),
      data: { user, ...session },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Kayıt hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!emailPattern.test(email) || password.length === 0 || password.length > 128) {
    return res.status(401).json({ status: false, message: req.t('auth.invalid_credentials') });
  }

  try {
    const database = getDb();
    const [users] = await database.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status,
         (SELECT GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',')
          FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id) AS role_codes
       FROM users u WHERE u.email = ? LIMIT 1`,
      [email],
    );

    const user = users[0];
    const passwordHash = user?.password_hash || '$2b$12$C6UzMDM.H6dfI/f/IKcEe.ouLXNA7nj8L0R4qM9m6QmD9t6Pr5qGS';
    const passwordValid = await bcrypt.compare(password, passwordHash);

    if (!user || !passwordValid || user.status !== 'active') {
      return res.status(401).json({ status: false, message: req.t('auth.invalid_credentials') });
    }

    const connection = await database.getConnection();
    try {
      const session = await createSession(connection, user, req);
      return res.json({
        status: true,
        message: req.t('auth.login_success'),
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            roles: user.role_codes ? user.role_codes.split(',') : [],
          },
          ...session,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.googleNonce = async (req, res) => {
  try {
    const challenge = await createGoogleNonce();
    return res.json({
      status: true,
      message: req.t('auth.google_ready'),
      data: challenge,
    });
  } catch (error) {
    console.error('Google nonce oluşturma hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.google = async (req, res) => {
  const idToken = String(req.body.idToken || '');
  const nonce = String(req.body.nonce || '');

  if (idToken.length < 100 || idToken.length > 12000 || !/^[A-Za-z0-9_-]{32,128}$/.test(nonce)) {
    return res.status(422).json({ status: false, message: req.t('validation.invalid_request') });
  }

  try {
    const authResult = await signInWithGoogle({ idToken, nonce, req });
    return res.json({
      status: true,
      message: req.t('auth.google_success'),
      data: authResult,
    });
  } catch (error) {
    if (error.authCode === 'google_unavailable') {
      return res.status(503).json({ status: false, message: req.t('auth.google_unavailable') });
    }
    if (error.authCode === 'google_email_conflict') {
      return res.status(409).json({ status: false, message: req.t('auth.google_email_conflict') });
    }
    if (error.authCode === 'google_invalid') {
      return res.status(401).json({ status: false, message: req.t('auth.google_invalid') });
    }

    console.error('Google giriş hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};

exports.me = async (req, res) => {
  res.json({
    status: true,
    message: req.t('health.ready'),
    data: { user: req.user },
  });
};

exports.logout = async (req, res) => {
  try {
    await getDb().query(
      'UPDATE auth_sessions SET revoked_at = UTC_TIMESTAMP(6) WHERE jti = ? AND user_id = ?',
      [req.auth.jti, req.user.id],
    );

    const redisClient = getRedisClient();
    if (redisClient?.isReady) {
      const ttlSeconds = Math.max(1, req.auth.expiresAt - Math.floor(Date.now() / 1000));
      await redisClient.set(buildRedisKey('auth', 'revoked', req.auth.jti), '1', { EX: ttlSeconds });
    }

    return res.json({ status: true, message: req.t('auth.logout_success'), data: {} });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    return res.status(500).json({ status: false, message: req.t('errors.server_error') });
  }
};
