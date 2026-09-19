const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { config } = require('../../alpgozluk/v1/config/env');
const { encodeStorageKey } = require('../../general_helpers/storageKey');

let s3Client;

const getClient = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.storage.s3.region,
      endpoint: config.storage.s3.endpoint || undefined,
      forcePathStyle: config.storage.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
      },
    });
  }

  return s3Client;
};

const save = async (file, options) => {
  await getClient().send(new PutObjectCommand({
    Bucket: config.storage.s3.bucket,
    Key: options.key,
    Body: file.buffer,
    ContentType: options.contentType,
    CacheControl: options.visibility === 'public'
      ? 'public, max-age=31536000, immutable'
      : 'private, no-store',
    Metadata: {
      visibility: options.visibility,
    },
  }));

  return { key: options.key, driver: 's3' };
};

const remove = async (storageKey) => {
  await getClient().send(new DeleteObjectCommand({
    Bucket: config.storage.s3.bucket,
    Key: storageKey,
  }));
  return true;
};

const getPublicUrl = (storageKey) => {
  const encodedKey = encodeStorageKey(storageKey);

  if (config.storage.s3.publicBaseUrl) {
    return `${config.storage.s3.publicBaseUrl.replace(/\/$/, '')}/${encodedKey}`;
  }

  if (config.storage.s3.endpoint) {
    const endpoint = config.storage.s3.endpoint.replace(/\/$/, '');
    return config.storage.s3.forcePathStyle
      ? `${endpoint}/${config.storage.s3.bucket}/${encodedKey}`
      : `${endpoint}/${encodedKey}`;
  }

  return `https://${config.storage.s3.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${encodedKey}`;
};

const getUrl = async (storageKey, options = {}) => {
  if (options.visibility !== 'private') return getPublicUrl(storageKey);

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: config.storage.s3.bucket, Key: storageKey }),
    { expiresIn: config.storage.s3.signedUrlExpiresSeconds },
  );
};

module.exports = { save, delete: remove, getUrl };
