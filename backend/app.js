const path = require('node:path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { config, validateConfig } = require('./alpgozluk/v1/config/env');
const apiRouter = require('./alpgozluk/v1');
const requestContext = require('./alpgozluk/v1/middlewares/requestContext');
const { notFound, errorHandler } = require('./alpgozluk/v1/middlewares/errorHandler');
const { connectRedis, closeRedis } = require('./alpgozluk/v1/models/redis');
const { checkDatabase, closeDatabase } = require('./alpgozluk/v1/models/db');

const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(requestContext);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      const error = new Error('İzin verilmeyen origin.');
      error.statusCode = 403;
      error.publicMessage = 'Bu origin için erişim izni bulunmuyor.';
      return callback(error);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Request-Id', 'X-Cart-Token'],
    exposedHeaders: ['X-Cart-Token', 'X-Request-Id'],
    credentials: false,
    maxAge: 600,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  if (config.storage.driver === 'local') {
    app.use(
      '/uploads/public',
      express.static(path.resolve(process.cwd(), config.storage.localPath, 'public'), {
        fallthrough: false,
        immutable: config.isProduction,
        maxAge: config.isProduction ? '7d' : 0,
      }),
    );
  }

  app.use('/api/alpgozluk/v1', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const startServer = async () => {
  validateConfig();
  await checkDatabase();
  await connectRedis();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`ALP Gözlük API ${config.port} portunda çalışıyor.`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} alındı, bağlantılar kapatılıyor.`);
    server.close(async () => {
      await Promise.allSettled([closeRedis(), closeDatabase()]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('API başlatılamadı:', error.message);
    process.exit(1);
  });
}

module.exports = { createApp, startServer };
