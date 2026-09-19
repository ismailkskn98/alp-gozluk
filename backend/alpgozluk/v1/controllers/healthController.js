const { checkDatabase } = require('../models/db');
const { checkRedis } = require('../models/redis');
const { config } = require('../config/env');

exports.live = (req, res) => {
  res.json({
    status: true,
    message: req.t('health.live'),
    data: {
      service: 'alp-gozluk-api',
      environment: config.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
};

exports.ready = async (req, res) => {
  const [databaseResult, redisResult] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
  ]);

  const databaseReady = databaseResult.status === 'fulfilled' && databaseResult.value === true;
  const redisReady = redisResult.status === 'fulfilled' && redisResult.value === true;

  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady,
    message: req.t(databaseReady && redisReady ? 'health.ready' : 'health.degraded'),
    data: {
      database: databaseReady ? 'ready' : 'unavailable',
      redis: redisReady ? 'ready' : 'degraded',
      storage: config.storage.driver,
    },
  });
};
