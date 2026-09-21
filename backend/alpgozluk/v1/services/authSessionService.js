const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

const createSession = async (connection, user, req) => {
  const jti = randomUUID();
  const token = jwt.sign(
    { sub: String(user.id), jti },
    config.auth.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.auth.jwtExpiresIn,
      issuer: 'alp-gozluk-api',
      audience: 'alp-gozluk-web',
    },
  );
  const decodedToken = jwt.decode(token);

  await connection.query(
    `INSERT INTO auth_sessions
      (user_id, jti, ip_hash, user_agent, expires_at)
     VALUES (?, ?, SHA2(?, 256), ?, FROM_UNIXTIME(?))`,
    [user.id, jti, req.ip || '', (req.get('user-agent') || '').slice(0, 500), decodedToken.exp],
  );

  return { token, expiresAt: new Date(decodedToken.exp * 1000).toISOString() };
};

module.exports = { createSession };
