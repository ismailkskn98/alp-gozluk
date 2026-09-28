const { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } = require('node:crypto');
const { config } = require('../config/env');
const { buildRedisKey, getRedisClient } = require('../models/redis');

const ARTIFACT_TTL_SECONDS = 300;

const unavailableError = () => {
  const error = new Error('payment_artifact_store_unavailable');
  error.statusCode = 503;
  error.publicMessage = 'Güvenli ödeme oturumu şu anda başlatılamıyor. Lütfen tekrar deneyin.';
  error.code = 'payment_artifact_store_unavailable';
  return error;
};

const getEncryptionKey = () => {
  const key = Buffer.from(config.payments.artifactEncryptionKey || '', 'base64');
  if (key.length !== 32) throw unavailableError();
  return key;
};

const artifactKey = (publicId) => buildRedisKey('payment-3ds', publicId);

const createProof = (publicId) => createHmac('sha256', getEncryptionKey())
  .update(`3ds-bridge:${publicId}`, 'utf8')
  .digest('base64url');

const verifyProof = (publicId, proof) => {
  const expected = Buffer.from(createProof(publicId), 'utf8');
  const received = Buffer.from(String(proof || ''), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
};

const encrypt = (value) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return JSON.stringify({
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  });
};

const decrypt = (value) => {
  const envelope = JSON.parse(value);
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

const getReadyClient = () => {
  const client = getRedisClient();
  if (!client?.isReady) throw unavailableError();
  return client;
};

const storeArtifact = async (publicId, base64HtmlContent) => {
  if (typeof base64HtmlContent !== 'string' || base64HtmlContent.length < 20 || base64HtmlContent.length > 1_500_000) {
    throw unavailableError();
  }
  await getReadyClient().set(artifactKey(publicId), encrypt(base64HtmlContent), { EX: ARTIFACT_TTL_SECONDS });
  return createProof(publicId);
};

const artifactExists = async (publicId) => (
  (await getReadyClient().exists(artifactKey(publicId))) === 1
);

const consumeArtifact = async (publicId, proof) => {
  if (!verifyProof(publicId, proof)) return null;
  const encryptedArtifact = await getReadyClient().getDel(artifactKey(publicId));
  return encryptedArtifact ? decrypt(encryptedArtifact) : null;
};

module.exports = {
  ARTIFACT_TTL_SECONDS,
  artifactExists,
  consumeArtifact,
  createProof,
  storeArtifact,
  verifyProof,
};
