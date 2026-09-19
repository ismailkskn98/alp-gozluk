const { config } = require('../config/env');
const { getRedisClient, buildRedisKey } = require('../models/redis');

const getJson = async (...keyParts) => {
  const client = getRedisClient();
  if (!client?.isReady) return null;

  try {
    const value = await client.get(buildRedisKey(...keyParts));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis cache okuma hatası:', error.message);
    return null;
  }
};

const setJson = async (keyParts, value, ttlSeconds = config.redis.defaultTtlSeconds) => {
  const client = getRedisClient();
  if (!client?.isReady) return false;

  try {
    await client.set(buildRedisKey(...keyParts), JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (error) {
    console.error('Redis cache yazma hatası:', error.message);
    return false;
  }
};

const deleteKeys = async (...keys) => {
  const client = getRedisClient();
  if (!client?.isReady || keys.length === 0) return false;

  try {
    await client.del(keys.map((keyParts) => buildRedisKey(...keyParts)));
    return true;
  } catch (error) {
    console.error('Redis cache temizleme hatası:', error.message);
    return false;
  }
};

module.exports = { getJson, setJson, deleteKeys };
