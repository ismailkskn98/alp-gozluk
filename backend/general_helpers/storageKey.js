const { randomUUID } = require('node:crypto');

const allowedPrefixes = new Set(['products', 'categories', 'collections', 'content', 'users']);

const createStorageKey = ({ prefix, extension, visibility = 'public' }) => {
  const safePrefix = allowedPrefixes.has(prefix) ? prefix : 'content';
  const safeVisibility = visibility === 'private' ? 'private' : 'public';
  const safeExtension = String(extension).toLowerCase().replace(/[^a-z0-9]/g, '');

  return `${safeVisibility}/${safePrefix}/${randomUUID()}.${safeExtension}`;
};

const encodeStorageKey = (storageKey) =>
  storageKey.split('/').map((segment) => encodeURIComponent(segment)).join('/');

module.exports = { createStorageKey, encodeStorageKey };
