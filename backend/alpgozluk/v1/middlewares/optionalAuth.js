const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { getDb } = require('../models/db');

const optionalAuth = async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  if (!authorization) return next();

  try {
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ status: false, message: req.t('auth.unauthorized') });
    }

    const payload = jwt.verify(token, config.auth.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'alp-gozluk-api',
      audience: 'alp-gozluk-web',
    });
    const [rows] = await getDb().query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status,
         (SELECT GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',')
          FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id) AS role_codes
       FROM auth_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.jti = ? AND s.user_id = ? AND s.revoked_at IS NULL
         AND s.expires_at > UTC_TIMESTAMP(6) AND u.status = 'active'
       LIMIT 1`,
      [payload.jti, payload.sub],
    );

    if (!rows[0]) {
      return res.status(401).json({ status: false, message: req.t('auth.unauthorized') });
    }

    req.user = {
      id: rows[0].id,
      email: rows[0].email,
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      roles: rows[0].role_codes ? rows[0].role_codes.split(',') : [],
    };
    req.auth = { token, jti: payload.jti, expiresAt: payload.exp };
    return next();
  } catch (error) {
    return res.status(401).json({ status: false, message: req.t('auth.unauthorized') });
  }
};

module.exports = optionalAuth;
