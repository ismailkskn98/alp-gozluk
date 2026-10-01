class CheckoutApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'CheckoutApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function checkoutRequest(path, options = {}) {
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
    throw new CheckoutApiError(
      payload?.message || 'İşlem tamamlanamadı.',
      response.status,
      payload,
    );
  }

  return payload?.data ?? null;
}

const jsonBody = (value) => JSON.stringify(value);

export function prepareOrder(payload, idempotencyKey) {
  return checkoutRequest('/api/checkout/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: jsonBody(payload),
  });
}

export function fetchOrder(orderNumber, { signal } = {}) {
  return checkoutRequest(`/api/checkout/orders/${encodeURIComponent(orderNumber)}`, { signal });
}

export function fetchGuestOrderTracking(orderNumber, trackingToken, { signal } = {}) {
  return checkoutRequest(`/api/checkout/orders/${encodeURIComponent(orderNumber)}/tracking`, {
    method: 'POST',
    body: jsonBody({ trackingToken }),
    signal,
  });
}

export function cancelOrder(orderNumber) {
  return checkoutRequest(`/api/checkout/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: 'POST',
    body: '{}',
  });
}

export function fetchInstallments(payload, { signal } = {}) {
  return checkoutRequest('/api/payments/iyzico/installments', {
    method: 'POST',
    body: jsonBody(payload),
    signal,
  });
}

export function initializeThreeDs(payload, idempotencyKey) {
  return checkoutRequest('/api/payments/iyzico/3ds/initialize', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: jsonBody(payload),
  });
}

export function fetchPaymentStatus(paymentAttemptId, { signal } = {}) {
  return checkoutRequest(`/api/payments/${encodeURIComponent(paymentAttemptId)}`, { signal });
}

export { CheckoutApiError };
