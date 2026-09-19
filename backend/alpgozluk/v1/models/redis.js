const { createClient } = require('redis');
const { config } = require('../config/env');

let redisClient;

const getRedisClient = () => {
  if (!config.redis.url) return null;

  if (!redisClient) {
    redisClient = createClient({ url: config.redis.url });
    redisClient.on('error', (error) => {
      console.error('Redis bağlantı hatası:', error.message);
    });
  }

  return redisClient;
};

const connectRedis = async () => {
  const client = getRedisClient();
  if (!client || client.isOpen) return Boolean(client?.isReady);

  try {
    await client.connect();
    return client.isReady;
  } catch (error) {
    console.error('Redis kullanılamıyor, uygulama cache olmadan devam edecek:', error.message);
    return false;
  }
};

const checkRedis = async () => {
  const client = getRedisClient();
  if (!client?.isReady) return false;
  return (await client.ping()) === 'PONG';
};

const closeRedis = async () => {
  if (!redisClient?.isOpen) return;
  await redisClient.quit();
};

const buildRedisKey = (...parts) =>
  [config.redis.keyPrefix, ...parts]
    .map((part) => String(part).replace(/[^a-zA-Z0-9:_-]/g, '_'))
    .join(':');

module.exports = {
  getRedisClient,
  connectRedis,
  checkRedis,
  closeRedis,
  buildRedisKey,
};
