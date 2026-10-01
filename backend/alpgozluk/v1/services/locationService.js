const { config } = require('../config/env');
const cache = require('./cacheService');

const CACHE_TTL_SECONDS = 60 * 60 * 24;
const PAGE_SIZE = 100;
const memoryCache = new Map();

const locationError = (message, code) => {
  const error = new Error(code);
  error.statusCode = 503;
  error.publicMessage = message;
  error.code = code;
  return error;
};

const readMemory = (key, allowStale = false) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (!allowStale && entry.expiresAt <= Date.now()) return null;
  return entry.value;
};

const writeMemory = (key, value) => {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  });
};

const providerUrl = (path, offset = 0) => {
  const baseUrl = new URL(config.locations.providerBaseUrl);
  if (baseUrl.protocol !== 'https:') {
    throw locationError('Konum servisi yapılandırması geçersiz.', 'location_provider_invalid');
  }
  const url = new URL(`${baseUrl.pathname.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, baseUrl.origin);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  return url;
};

const fetchPage = async (path, offset = 0) => {
  const response = await fetch(providerUrl(path, offset), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(config.locations.requestTimeoutMs),
  });
  if (!response.ok) {
    throw locationError('Konum bilgileri şu anda alınamıyor.', 'location_provider_unavailable');
  }
  const payload = await response.json();
  if (!Array.isArray(payload?.data)) {
    throw locationError('Konum servisi geçersiz yanıt verdi.', 'location_provider_invalid_response');
  }
  return payload;
};

const loadCollection = async (path, cacheParts) => {
  const memoryKey = cacheParts.join(':');
  const memoryValue = readMemory(memoryKey);
  if (memoryValue) return memoryValue;

  const cachedValue = await cache.getJson(...cacheParts);
  if (cachedValue) {
    writeMemory(memoryKey, cachedValue);
    return cachedValue;
  }

  try {
    const firstPage = await fetchPage(path);
    const total = Number(firstPage.meta?.total || firstPage.data.length);
    const remainingOffsets = [];
    for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) remainingOffsets.push(offset);
    const remainingPages = await Promise.all(remainingOffsets.map((offset) => fetchPage(path, offset)));
    const locations = [firstPage, ...remainingPages]
      .flatMap((page) => page.data)
      .map((location) => ({
        id: Number(location.id),
        name: String(location.name || '').trim(),
        postalCode: location.postalCode ? String(location.postalCode) : null,
      }))
      .filter((location) => Number.isSafeInteger(location.id) && location.id > 0 && location.name);
    writeMemory(memoryKey, locations);
    await cache.setJson(cacheParts, locations, CACHE_TTL_SECONDS);
    return locations;
  } catch (error) {
    const staleValue = readMemory(memoryKey, true);
    if (staleValue) return staleValue;
    if (error.statusCode) throw error;
    throw locationError('Konum bilgileri şu anda alınamıyor.', 'location_provider_unavailable');
  }
};

const listProvinces = () => loadCollection(
  'provinces?fields=id,name',
  ['locations', 'provinces'],
);

const listDistricts = (provinceId) => loadCollection(
  `provinces/${provinceId}/districts?fields=id,name`,
  ['locations', 'province', provinceId, 'districts'],
);

const listNeighborhoods = (districtId) => loadCollection(
  `districts/${districtId}/neighborhoods?fields=id,name,postalCode`,
  ['locations', 'district', districtId, 'neighborhoods'],
);

module.exports = { listDistricts, listNeighborhoods, listProvinces };
