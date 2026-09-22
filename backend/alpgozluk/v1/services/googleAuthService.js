const { OAuth2Client } = require('google-auth-library');
const { config } = require('../config/env');
const { getDb } = require('../models/db');
const { createSession } = require('./authSessionService');
const { consumeGoogleNonce } = require('./googleNonceService');

let googleClient;

const createAuthError = (code) => {
  const error = new Error(code);
  error.authCode = code;
  return error;
};

const getGoogleClient = () => {
  if (!config.auth.googleClientId) throw createAuthError('google_unavailable');
  if (!googleClient) googleClient = new OAuth2Client(config.auth.googleClientId);
  return googleClient;
};

const getUserRoles = async (connection, userId) => {
  const [roles] = await connection.query(
    `SELECT r.code
     FROM user_roles ur
     INNER JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.code`,
    [userId],
  );

  return roles.map((role) => role.code);
};

const signInWithGoogle = async ({ idToken, nonce, req }) => {
  let payload;

  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken,
      audience: config.auth.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    if (error.authCode === 'google_unavailable') throw error;
    throw createAuthError('google_invalid');
  }

  const email = String(payload?.email || '').trim().toLowerCase();
  const providerSubject = String(payload?.sub || '');
  const nonceMatches = payload?.nonce === nonce;
  const nonceIsActive = nonceMatches ? await consumeGoogleNonce(nonce) : false;

  if (!providerSubject || !email || payload?.email_verified !== true || !nonceIsActive) {
    throw createAuthError('google_invalid');
  }

  const database = getDb();
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    const [identityRows] = await connection.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status
       FROM user_auth_identities i
       INNER JOIN users u ON u.id = i.user_id
       WHERE i.provider = 'google' AND i.provider_subject = ?
       LIMIT 1 FOR UPDATE`,
      [providerSubject],
    );

    let user = identityRows[0];

    if (!user) {
      const [emailRows] = await connection.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
        [email],
      );

      if (emailRows.length > 0) throw createAuthError('google_email_conflict');

      const firstName = String(payload.given_name || payload.name || email.split('@')[0])
        .trim()
        .slice(0, 80);
      const lastName = String(payload.family_name || '').trim().slice(0, 80);
      const [userResult] = await connection.query(
        `INSERT INTO users
          (email, password_hash, first_name, last_name, status, email_verified_at, last_login_at)
         VALUES (?, NULL, ?, ?, 'active', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))`,
        [email, firstName || 'Google', lastName],
      );

      await connection.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT ?, id FROM roles WHERE code = 'customer' LIMIT 1`,
        [userResult.insertId],
      );
      await connection.query(
        `INSERT INTO user_auth_identities
          (user_id, provider, provider_subject, provider_email)
         VALUES (?, 'google', ?, ?)`,
        [userResult.insertId, providerSubject, email],
      );

      user = {
        id: userResult.insertId,
        email,
        first_name: firstName || 'Google',
        last_name: lastName,
        status: 'active',
      };
    } else {
      await connection.query(
        `UPDATE users
         SET last_login_at = UTC_TIMESTAMP(6),
             email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP(6))
         WHERE id = ?`,
        [user.id],
      );
      await connection.query(
        `UPDATE user_auth_identities
         SET provider_email = ?, last_used_at = UTC_TIMESTAMP(6)
         WHERE provider = 'google' AND provider_subject = ?`,
        [email, providerSubject],
      );
    }

    if (user.status !== 'active') throw createAuthError('google_invalid');

    const roles = await getUserRoles(connection, user.id);
    if (roles.some((role) => ['super_admin', 'admin', 'editor'].includes(role))) {
      throw createAuthError('admin_google_forbidden');
    }
    const session = await createSession(connection, user, req);
    await connection.commit();

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles,
      },
      ...session,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { signInWithGoogle };
