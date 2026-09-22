class CommerceApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'CommerceApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function commerceRequest(path, options = {}) {
  const locale = typeof document === 'undefined' ? '' : document.documentElement.lang;
  const headers = {
    ...(locale ? { 'X-App-Locale': locale } : {}),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  const response = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new CommerceApiError(
      payload?.message || 'İşlem tamamlanamadı.',
      response.status,
      payload,
    );
  }

  return payload?.data ?? null;
}

function jsonBody(value) {
  return JSON.stringify(value);
}

export async function fetchCart() {
  const result = await commerceRequest('/api/commerce/cart');
  return result?.cart || result;
}

export async function fetchCartSummary() {
  const result = await commerceRequest('/api/commerce/cart/summary');
  return result?.summary || result;
}

export function addCartItem({ variantId, quantity }) {
  return commerceRequest('/api/commerce/cart/items', {
    method: 'POST',
    body: jsonBody({ variantId, quantity }),
  });
}

export function updateCartItem({ itemId, ...input }) {
  return commerceRequest(`/api/commerce/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    body: jsonBody(input),
  });
}

export function removeCartItem(itemId) {
  return commerceRequest(`/api/commerce/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

export function updateCartSelection(input) {
  return commerceRequest('/api/commerce/cart/selection', {
    method: 'PATCH',
    body: jsonBody(input),
  });
}

export function applyCartCoupon(code) {
  return commerceRequest('/api/commerce/cart/coupon', {
    method: 'POST',
    body: jsonBody({ code }),
  });
}

export function removeCartCoupon() {
  return commerceRequest('/api/commerce/cart/coupon', { method: 'DELETE' });
}

export function mergeGuestCart() {
  return commerceRequest('/api/commerce/cart/merge', {
    method: 'POST',
    body: '{}',
    keepalive: true,
  });
}

export async function fetchFavoriteIds() {
  const result = await commerceRequest('/api/commerce/favorites/ids');
  const ids = Array.isArray(result) ? result : result?.ids;
  return Array.isArray(ids) ? ids.map(Number).filter(Number.isSafeInteger) : [];
}

export async function fetchFavorites() {
  const result = await commerceRequest('/api/commerce/favorites');
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.favorites)) return result.favorites;
  return Array.isArray(result?.items) ? result.items : [];
}

export function addFavorite(productId) {
  return commerceRequest(`/api/commerce/favorites/${encodeURIComponent(productId)}`, {
    method: 'PUT',
  });
}

export function removeFavorite(productId) {
  return commerceRequest(`/api/commerce/favorites/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

export function mergeGuestFavorites(productIds) {
  return commerceRequest('/api/commerce/favorites/merge', {
    method: 'POST',
    body: jsonBody({ productIds }),
    keepalive: true,
  });
}

export { CommerceApiError };
