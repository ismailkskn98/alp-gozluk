const { config } = require('../config/env');
const { getDb } = require('../models/db');
const { createSession } = require('./authSessionService');
const {
  buildTotpProvisioning,
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyTotpToken,
} = require('./totpService');
const {
  consumeTwoFactorChallenge,
  createTwoFactorChallenge,
  getTwoFactorChallenge,
  recordTwoFactorAttempt,
  setChallengeSecret,
} = require('./twoFactorChallengeService');

const panelRoles = new Set(['super_admin', 'admin', 'editor']);

const createAuthError = (code) => {
  const error = new Error(code);
  error.authCode = code;
  return error;
};

const isPanelUser = (roles) => roles.some((role) => panelRoles.has(role));

const beginAdminTwoFactor = async (user) => {
  if (!config.auth.adminTwoFactor.enabled || !isPanelUser(user.roles)) return null;

  const [credentials] = await getDb().query(
    'SELECT user_id FROM user_totp_credentials WHERE user_id = ? LIMIT 1',
    [user.id],
  );
  const setupRequired = credentials.length === 0;
  const challenge = await createTwoFactorChallenge({ userId: user.id, setupRequired });
  return {
    twoFactorRequired: true,
    setupRequired,
    challengeToken: challenge.token,
    expiresIn: challenge.expiresIn,
  };
};

const getAdminTwoFactorSetup = async (challengeToken) => {
  if (!config.auth.adminTwoFactor.enabled) throw createAuthError('two_factor_disabled');
  const challenge = await getTwoFactorChallenge(challengeToken);
  if (!challenge || !challenge.setupRequired) throw createAuthError('two_factor_challenge_invalid');

  const [users] = await getDb().query(
    `SELECT email FROM users
     WHERE id = ? AND status = 'active' AND deleted_at IS NULL
     LIMIT 1`,
    [challenge.userId],
  );
  if (users.length === 0) throw createAuthError('two_factor_challenge_invalid');

  let secret = challenge.secret;
  if (!secret) {
    secret = generateTotpSecret();
    await setChallengeSecret(challenge.key, secret);
  }
  return buildTotpProvisioning({ email: users[0].email, secret });
};

const completeAdminTwoFactor = async ({ challengeToken, code, req }) => {
  if (!config.auth.adminTwoFactor.enabled) throw createAuthError('two_factor_disabled');
  const challenge = await getTwoFactorChallenge(challengeToken);
  if (!challenge) throw createAuthError('two_factor_challenge_invalid');
  if (!(await recordTwoFactorAttempt(challenge.key))) throw createAuthError('two_factor_attempts_exceeded');

  const database = getDb();
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.status
       FROM users u
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1
       FOR UPDATE`,
      [challenge.userId],
    );
    const userRow = users[0];
    const [roleRows] = userRow ? await connection.query(
      `SELECT r.code
       FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?
       ORDER BY r.code`,
      [userRow.id],
    ) : [[]];
    const roles = roleRows.map((role) => role.code);
    if (!userRow || userRow.status !== 'active' || !isPanelUser(roles)) {
      throw createAuthError('two_factor_challenge_invalid');
    }

    let recoveryCodes;
    if (challenge.setupRequired) {
      if (!challenge.secret || !/^\d{6}$/.test(code)) throw createAuthError('two_factor_invalid');
      const [existingCredentials] = await connection.query(
        'SELECT user_id FROM user_totp_credentials WHERE user_id = ? LIMIT 1',
        [userRow.id],
      );
      if (existingCredentials.length > 0) throw createAuthError('two_factor_challenge_invalid');

      const usedStep = verifyTotpToken({ secret: challenge.secret, token: code });
      if (usedStep === null) throw createAuthError('two_factor_invalid');
      recoveryCodes = generateRecoveryCodes();
      await connection.query(
        `INSERT INTO user_totp_credentials
          (user_id, secret_encrypted, recovery_codes_json, last_used_step)
         VALUES (?, ?, ?, ?)`,
        [
          userRow.id,
          encryptTotpSecret(challenge.secret),
          JSON.stringify(recoveryCodes.map(hashRecoveryCode)),
          usedStep,
        ],
      );
    } else {
      const [credentials] = await connection.query(
        `SELECT secret_encrypted, recovery_codes_json, last_used_step
         FROM user_totp_credentials
         WHERE user_id = ?
         LIMIT 1
         FOR UPDATE`,
        [userRow.id],
      );
      if (credentials.length === 0) throw createAuthError('two_factor_challenge_invalid');
      const credential = credentials[0];

      if (/^\d{6}$/.test(code)) {
        const usedStep = verifyTotpToken({
          secret: decryptTotpSecret(credential.secret_encrypted),
          token: code,
          lastUsedStep: credential.last_used_step,
        });
        if (usedStep === null) throw createAuthError('two_factor_invalid');
        await connection.query(
          'UPDATE user_totp_credentials SET last_used_step = ? WHERE user_id = ?',
          [usedStep, userRow.id],
        );
      } else {
        const normalizedCode = normalizeRecoveryCode(code);
        if (normalizedCode.length !== 16) throw createAuthError('two_factor_invalid');
        const storedHashes = JSON.parse(credential.recovery_codes_json || '[]');
        const remainingHashes = consumeRecoveryCode(storedHashes, normalizedCode);
        if (!remainingHashes) throw createAuthError('two_factor_invalid');
        await connection.query(
          'UPDATE user_totp_credentials SET recovery_codes_json = ? WHERE user_id = ?',
          [JSON.stringify(remainingHashes), userRow.id],
        );
      }
    }

    await connection.query('UPDATE users SET last_login_at = UTC_TIMESTAMP(6) WHERE id = ?', [userRow.id]);
    const user = {
      id: userRow.id,
      email: userRow.email,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      roles,
    };
    const session = await createSession(connection, user, req);
    await connection.commit();
    try {
      await consumeTwoFactorChallenge(challenge.key);
    } catch (error) {
      console.error('Kullanılmış 2FA challenge temizlenemedi:', error.message);
    }

    return { user, ...session, ...(recoveryCodes ? { recoveryCodes } : {}) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  beginAdminTwoFactor,
  completeAdminTwoFactor,
  getAdminTwoFactorSetup,
  isPanelUser,
};
