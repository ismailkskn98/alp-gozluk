const path = require('node:path');
const dotenv = require('dotenv');

const nodeEnv = process.env.NODE_ENV || 'development';
const backendRoot = path.resolve(__dirname, '../../..');

if (!['development', 'production', 'test'].includes(nodeEnv)) {
  throw new Error(`Desteklenmeyen NODE_ENV değeri: ${nodeEnv}`);
}

if (nodeEnv !== 'test') {
  dotenv.config({ path: path.resolve(backendRoot, `.env.${nodeEnv}`) });
}

const toNumber = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const splitOrigins = (value = '') =>
  value.split(',').map((origin) => origin.trim()).filter(Boolean);

const iyzicoEnvironment = process.env.IYZICO_ENVIRONMENT || 'sandbox';
const iyzicoBaseUrls = {
  sandbox: 'https://sandbox-api.iyzipay.com',
  production: 'https://api.iyzipay.com',
};

const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: toNumber(process.env.PORT, 4000),
  appUrl: process.env.APP_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: splitOrigins(process.env.CORS_ORIGINS || 'http://localhost:3000'),
  database: {
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
  redis: {
    url: process.env.REDIS_URL,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'alpgozluk',
    defaultTtlSeconds: toNumber(process.env.CACHE_DEFAULT_TTL_SECONDS, 300),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    adminTwoFactor: {
      enabled: toBoolean(process.env.ADMIN_2FA_ENABLED),
      encryptionKey: process.env.ADMIN_2FA_ENCRYPTION_KEY,
      issuer: process.env.ADMIN_2FA_ISSUER || 'ALP Gözlük',
      challengeTtlSeconds: toNumber(process.env.ADMIN_2FA_CHALLENGE_TTL_SECONDS, 300),
      maxAttempts: toNumber(process.env.ADMIN_2FA_MAX_ATTEMPTS, 5),
    },
    bootstrapSuperAdmin: {
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'ALP',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Yönetici',
    },
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || (nodeEnv === 'production' ? 's3' : 'local'),
    localPath: path.resolve(backendRoot, process.env.LOCAL_STORAGE_PATH || 'uploads'),
    maxUploadSizeMb: toNumber(process.env.MAX_UPLOAD_SIZE_MB, 10),
    maxUploadFiles: toNumber(process.env.MAX_UPLOAD_FILES, 8),
    s3: {
      region: process.env.S3_REGION,
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
      forcePathStyle: toBoolean(process.env.S3_FORCE_PATH_STYLE),
      signedUrlExpiresSeconds: toNumber(process.env.S3_SIGNED_URL_EXPIRES_SECONDS, 300),
    },
  },
  rateLimit: {
    windowSeconds: toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 900),
    max: toNumber(process.env.RATE_LIMIT_MAX, 100),
    authMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
  },
  payments: {
    artifactEncryptionKey: process.env.PAYMENT_ARTIFACT_ENCRYPTION_KEY,
    iyzico: {
      enabled: toBoolean(process.env.IYZICO_ENABLED),
      environment: iyzicoEnvironment,
      baseUrl: iyzicoBaseUrls[iyzicoEnvironment],
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      callbackUrl: process.env.IYZICO_CALLBACK_URL ||
        `${process.env.APP_URL || 'http://localhost:4000'}/api/alpgozluk/v1/payments/iyzico/3ds/callback`,
      requestTimeoutMs: toNumber(process.env.IYZICO_REQUEST_TIMEOUT_MS, 15000),
      sandboxIdentityNumber: process.env.IYZICO_SANDBOX_IDENTITY_NUMBER || '11111111111',
      productionApproved: toBoolean(process.env.IYZICO_PRODUCTION_APPROVED),
    },
  },
};

const validateConfig = () => {
  const missingValues = [];

  for (const [name, value] of Object.entries({
    DB_HOST: config.database.host,
    DB_USER: config.database.user,
    DB_PASSWORD: config.database.password,
    DB_NAME: config.database.name,
    JWT_SECRET: config.auth.jwtSecret,
  })) {
    if (!value) missingValues.push(name);
  }

  if (!['local', 's3'].includes(config.storage.driver)) {
    throw new Error('STORAGE_DRIVER yalnızca local veya s3 olabilir.');
  }

  if (!config.payments.iyzico.baseUrl) {
    throw new Error('IYZICO_ENVIRONMENT yalnızca sandbox veya production olabilir.');
  }

  if (config.payments.iyzico.enabled) {
    for (const [name, value] of Object.entries({
      IYZICO_API_KEY: config.payments.iyzico.apiKey,
      IYZICO_SECRET_KEY: config.payments.iyzico.secretKey,
      PAYMENT_ARTIFACT_ENCRYPTION_KEY: config.payments.artifactEncryptionKey,
      REDIS_URL: config.redis.url,
    })) {
      if (!value) missingValues.push(name);
    }

    if (config.payments.artifactEncryptionKey) {
      const encryptionKey = Buffer.from(config.payments.artifactEncryptionKey, 'base64');
      if (encryptionKey.length !== 32) {
        throw new Error('PAYMENT_ARTIFACT_ENCRYPTION_KEY Base64 biçiminde 32 byte olmalıdır.');
      }
    }

    if (config.payments.iyzico.environment === 'production') {
      if (!config.payments.iyzico.productionApproved) missingValues.push('IYZICO_PRODUCTION_APPROVED');
      if (!config.payments.iyzico.callbackUrl.startsWith('https://')) {
        throw new Error('Canlı iyzico callback adresi HTTPS olmalıdır.');
      }
    }
  }

  if (config.storage.driver === 's3') {
    for (const [name, value] of Object.entries({
      S3_REGION: config.storage.s3.region,
      S3_BUCKET: config.storage.s3.bucket,
      S3_ACCESS_KEY_ID: config.storage.s3.accessKeyId,
      S3_SECRET_ACCESS_KEY: config.storage.s3.secretAccessKey,
    })) {
      if (!value) missingValues.push(name);
    }
  }

  if (config.isProduction) {
    if (!process.env.APP_URL) missingValues.push('APP_URL');
    if (!process.env.FRONTEND_URL) missingValues.push('FRONTEND_URL');
    if (!process.env.CORS_ORIGINS) missingValues.push('CORS_ORIGINS');
    if (!config.redis.url) missingValues.push('REDIS_URL');
  }

  if (config.auth.adminTwoFactor.enabled) {
    if (!config.redis.url) missingValues.push('REDIS_URL');
    if (!config.auth.adminTwoFactor.encryptionKey) {
      missingValues.push('ADMIN_2FA_ENCRYPTION_KEY');
    } else {
      const encryptionKey = Buffer.from(config.auth.adminTwoFactor.encryptionKey, 'base64');
      if (encryptionKey.length !== 32) {
        throw new Error('ADMIN_2FA_ENCRYPTION_KEY Base64 biçiminde 32 byte olmalıdır.');
      }
    }
  }

  const bootstrapValues = {
    SUPER_ADMIN_EMAIL: config.auth.bootstrapSuperAdmin.email,
    SUPER_ADMIN_PASSWORD: config.auth.bootstrapSuperAdmin.password,
  };
  const configuredBootstrapValues = Object.values(bootstrapValues).filter(Boolean).length;
  if (configuredBootstrapValues > 0 && configuredBootstrapValues < Object.keys(bootstrapValues).length) {
    for (const [name, value] of Object.entries(bootstrapValues)) {
      if (!value) missingValues.push(name);
    }
  }

  if (missingValues.length > 0) {
    throw new Error(`Eksik ortam değişkenleri: ${[...new Set(missingValues)].join(', ')}`);
  }
};

module.exports = { config, validateConfig };
