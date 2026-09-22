const { createHash, randomBytes } = require('node:crypto');
const { config } = require('../config/env');
const { getRedisClient, buildRedisKey } = require('../models/redis');

const getChallengeKey = (token) => buildRedisKey(
  'auth',
  'admin-2fa',
  createHash('sha256').update(token).digest('hex'),
);

const requireRedis = () => {
  const redisClient = getRedisClient();
  if (!redisClient?.isReady) {
    const error = new Error('2FA için Redis kullanılamıyor.');
    error.authCode = 'two_factor_unavailable';
    throw error;
  }
  return redisClient;
};

const createTwoFactorChallenge = async ({ userId, setupRequired }) => {
  const redisClient = requireRedis();
  const token = randomBytes(32).toString('base64url');
  const key = getChallengeKey(token);
  await redisClient.hSet(key, {
    userId: String(userId),
    setupRequired: setupRequired ? '1' : '0',
    attempts: '0',
  });
  await redisClient.expire(key, config.auth.adminTwoFactor.challengeTtlSeconds);
  return { token, expiresIn: config.auth.adminTwoFactor.challengeTtlSeconds };
};

const getTwoFactorChallenge = async (token) => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(token || ''))) return null;
  const redisClient = requireRedis();
  const key = getChallengeKey(token);
  const challenge = await redisClient.hGetAll(key);
  if (!challenge.userId) return null;
  return {
    key,
    userId: Number(challenge.userId),
    setupRequired: challenge.setupRequired === '1',
    secret: challenge.secret || null,
  };
};

const setChallengeSecret = async (key, secret) => {
  const redisClient = requireRedis();
  await redisClient.hSet(key, 'secret', secret);
};

const recordTwoFactorAttempt = async (key) => {
  const redisClient = requireRedis();
  const attempts = await redisClient.hIncrBy(key, 'attempts', 1);
  if (attempts > config.auth.adminTwoFactor.maxAttempts) {
    await redisClient.del(key);
    return false;
  }
  return true;
};

const consumeTwoFactorChallenge = async (key) => {
  const redisClient = requireRedis();
  await redisClient.del(key);
};

module.exports = {
  consumeTwoFactorChallenge,
  createTwoFactorChallenge,
  getTwoFactorChallenge,
  recordTwoFactorAttempt,
  setChallengeSecret,
};
