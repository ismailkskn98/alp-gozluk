const { createHash } = require('node:crypto');
const { config } = require('../config/env');
const { getRedisClient, buildRedisKey } = require('../models/redis');

const memoryCounters = new Map();

const hashIdentifier = (value) =>
  createHash('sha256').update(String(value || 'unknown')).digest('hex').slice(0, 32);

const consumeMemoryCounter = (key, windowSeconds) => {
  const now = Date.now();
  const current = memoryCounters.get(key);

  if (!current || current.expiresAt <= now) {
    const nextValue = { count: 1, expiresAt: now + windowSeconds * 1000 };
    memoryCounters.set(key, nextValue);
    return nextValue;
  }

  current.count += 1;
  return current;
};

const createRateLimit = ({ namespace, max = config.rateLimit.max, windowSeconds = config.rateLimit.windowSeconds }) =>
  async (req, res, next) => {
    const identifier = hashIdentifier(req.ip);
    const key = buildRedisKey('rate-limit', namespace, identifier);
    let count;
    let ttl = windowSeconds;

    try {
      const client = getRedisClient();
      if (!client?.isReady) throw new Error('Redis hazır değil.');

      count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSeconds);
      ttl = await client.ttl(key);
    } catch (error) {
      const memoryCounter = consumeMemoryCounter(key, windowSeconds);
      count = memoryCounter.count;
      ttl = Math.max(1, Math.ceil((memoryCounter.expiresAt - Date.now()) / 1000));
    }

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - count));
    res.setHeader('RateLimit-Reset', ttl);

    if (count > max) {
      return res.status(429).json({
        status: false,
        message: req.t('errors.rate_limit'),
      });
    }

    return next();
  };

module.exports = { createRateLimit, hashIdentifier };
