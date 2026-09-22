export const guestFavoritesStorageKey = 'alp_guest_favorites_v1';
export const guestFavoritesChangedEvent = 'alp:guest-favorites-changed';
export const guestFavoritesLimit = 100;

function normalizeProductIds(value) {
  if (!Array.isArray(value)) return [];

  const ids = [];
  const seen = new Set();

  for (const rawId of value) {
    const productId = Number(rawId);
    if (!Number.isSafeInteger(productId) || productId < 1 || seen.has(productId)) continue;
    seen.add(productId);
    ids.push(productId);
    if (ids.length === guestFavoritesLimit) break;
  }

  return ids;
}

function notifyGuestFavoritesChanged() {
  window.dispatchEvent(new CustomEvent(guestFavoritesChangedEvent));
}

export function readGuestFavoriteIds() {
  if (typeof window === 'undefined') return [];

  try {
    return normalizeProductIds(JSON.parse(window.localStorage.getItem(guestFavoritesStorageKey) || '[]'));
  } catch {
    return [];
  }
}

export function writeGuestFavoriteIds(productIds) {
  if (typeof window === 'undefined') return [];

  const normalizedIds = normalizeProductIds(productIds);
  window.localStorage.setItem(guestFavoritesStorageKey, JSON.stringify(normalizedIds));
  notifyGuestFavoritesChanged();
  return normalizedIds;
}

export function addGuestFavorite(productId) {
  const normalizedId = Number(productId);
  if (!Number.isSafeInteger(normalizedId) || normalizedId < 1) return readGuestFavoriteIds();

  const ids = readGuestFavoriteIds();
  if (ids.includes(normalizedId)) return ids;
  return writeGuestFavoriteIds([normalizedId, ...ids]);
}

export function removeGuestFavorite(productId) {
  const normalizedId = Number(productId);
  return writeGuestFavoriteIds(readGuestFavoriteIds().filter((id) => id !== normalizedId));
}

export function clearGuestFavorites() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(guestFavoritesStorageKey);
  notifyGuestFavoritesChanged();
}
