const {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} = require('node:crypto');
const QRCode = require('qrcode');
const { config } = require('../config/env');

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const totpPeriodSeconds = 30;
const totpDigits = 6;

const encodeBase32 = (buffer) => {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');

  let encoded = '';
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, '0');
    encoded += base32Alphabet[Number.parseInt(chunk, 2)];
  }
  return encoded;
};

const decodeBase32 = (value) => {
  const normalized = String(value || '').toUpperCase().replace(/=+$/g, '');
  let bits = '';

  for (const character of normalized) {
    const index = base32Alphabet.indexOf(character);
    if (index < 0) throw new Error('Geçersiz TOTP secret.');
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
};

const getEncryptionKey = () => {
  const key = Buffer.from(config.auth.adminTwoFactor.encryptionKey || '', 'base64');
  if (key.length !== 32) throw new Error('TOTP encryption key yapılandırılmamış.');
  return key;
};

const generateTotpSecret = () => encodeBase32(randomBytes(20));

const generateTotpToken = (secret, step) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  );
  return String(binary % (10 ** totpDigits)).padStart(totpDigits, '0');
};

const verifyTotpToken = ({ secret, token, now = Date.now(), window = 1, lastUsedStep = null }) => {
  if (!/^\d{6}$/.test(String(token || ''))) return null;
  const currentStep = Math.floor(now / 1000 / totpPeriodSeconds);

  for (let offset = -window; offset <= window; offset += 1) {
    const step = currentStep + offset;
    if (lastUsedStep !== null && step <= Number(lastUsedStep)) continue;
    const expected = Buffer.from(generateTotpToken(secret, step));
    const supplied = Buffer.from(String(token));
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) return step;
  }
  return null;
};

const encryptTotpSecret = (secret) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
};

const decryptTotpSecret = (payload) => {
  const [version, ivValue, authTagValue, encryptedValue] = String(payload || '').split('.');
  if (version !== 'v1' || !ivValue || !authTagValue || !encryptedValue) {
    throw new Error('Geçersiz TOTP secret payload.');
  }
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};

const normalizeRecoveryCode = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const hashRecoveryCode = (value) => createHmac('sha256', getEncryptionKey())
  .update(normalizeRecoveryCode(value))
  .digest('hex');

const generateRecoveryCodes = () => Array.from({ length: 8 }, () => {
  const value = randomBytes(8).toString('hex').toUpperCase();
  return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}`;
});

const consumeRecoveryCode = (storedHashes, suppliedCode) => {
  const suppliedHash = hashRecoveryCode(suppliedCode);
  const index = storedHashes.findIndex((storedHash) => {
    const expected = Buffer.from(storedHash, 'hex');
    const supplied = Buffer.from(suppliedHash, 'hex');
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  });
  if (index < 0) return null;
  return storedHashes.filter((_, currentIndex) => currentIndex !== index);
};

const buildTotpProvisioning = async ({ email, secret }) => {
  const issuer = config.auth.adminTwoFactor.issuer;
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${totpDigits}&period=${totpPeriodSeconds}`;
  const qrCodeDataUrl = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 1, width: 280 });
  return { secret, uri, qrCodeDataUrl };
};

module.exports = {
  buildTotpProvisioning,
  consumeRecoveryCode,
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  generateTotpToken,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyTotpToken,
};
