const { createHash, randomBytes } = require('node:crypto');
const { getRedisClient, buildRedisKey } = require('../models/redis');

const challengeTtlSeconds = 600;
const memoryChallenges = new Map();

const getChallengeKey = (nonce) =>
  buildRedisKey(
    'auth',
    'google-nonce',
    createHash('sha256').update(nonce).digest('hex'),
  );

const removeExpiredMemoryChallenges = () => {
  const now = Date.now();
  for (const [key, expiresAt] of memoryChallenges.entries()) {
    if (expiresAt <= now) memoryChallenges.delete(key);
  }
};

const createGoogleNonce = async () => {
  const nonce = randomBytes(32).toString('base64url');
  const key = getChallengeKey(nonce);
  const redisClient = getRedisClient();

  if (redisClient?.isReady) {
    try {
      await redisClient.set(key, '1', { EX: challengeTtlSeconds, NX: true });
      return { nonce, expiresIn: challengeTtlSeconds };
    } catch (error) {
      console.error('Google nonce Redis yazma hatası:', error.message);
    }
  }

  removeExpiredMemoryChallenges();
  memoryChallenges.set(key, Date.now() + challengeTtlSeconds * 1000);
  return { nonce, expiresIn: challengeTtlSeconds };
};

const consumeGoogleNonce = async (nonce) => {
  const key = getChallengeKey(nonce);
  const redisClient = getRedisClient();

  if (redisClient?.isReady) {
    try {
      const value = await redisClient.getDel(key);
      if (value === '1') return true;
    } catch (error) {
      console.error('Google nonce Redis okuma hatası:', error.message);
    }
  }

  const expiresAt = memoryChallenges.get(key);
  memoryChallenges.delete(key);
  return Boolean(expiresAt && expiresAt > Date.now());
};

module.exports = { createGoogleNonce, consumeGoogleNonce };
