import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieName, getApiUrl } from './server-api';

export const guestCartCookieName = 'alp_guest_cart';
export const guestOrderCookieName = 'alp_guest_order';

const guestCartCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

const guestOrderCookieOptions = {
  ...guestCartCookieOptions,
  maxAge: 60 * 60 * 24 * 30,
};

function createGuestCartToken() {
  return randomBytes(32).toString('base64url');
}

function createGuestOrderToken() {
  return randomBytes(32).toString('base64url');
}

async function retryGuestCartMerge(authToken, guestCartToken, acceptLanguage) {
  if (!authToken || !guestCartToken) return false;

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'X-Cart-Token': guestCartToken,
  };
  if (acceptLanguage) headers['Accept-Language'] = acceptLanguage;

  try {
    const response = await fetch(`${getApiUrl()}/cart/merge`, {
      method: 'POST',
      headers,
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {
      status: false,
      message: response.ok ? 'API yanıtı okunamadı.' : 'API isteği tamamlanamadı.',
    };
  }
}

export async function proxyCommerceRequest(request, {
  backendPath,
  createGuestToken = false,
  createOrderToken = false,
  useOrderToken = false,
  requireAuth = false,
  clearGuestCartOnSuccess = false,
  forwardHeaders = [],
  maxBodyBytes = null,
  requireJson = false,
}) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(authCookieName)?.value;

  if (requireAuth && !authToken) {
    return NextResponse.json({ status: false, message: 'Oturum gerekli.' }, { status: 401 });
  }

  let guestCartToken = cookieStore.get(guestCartCookieName)?.value;
  let generatedGuestToken = false;
  if (!authToken && !guestCartToken && createGuestToken) {
    guestCartToken = createGuestCartToken();
    generatedGuestToken = true;
  }

  let guestOrderToken = cookieStore.get(guestOrderCookieName)?.value;
  let generatedOrderToken = false;
  if (!authToken && !guestOrderToken && createOrderToken) {
    guestOrderToken = createGuestOrderToken();
    generatedOrderToken = true;
  }

  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (guestCartToken) headers['X-Cart-Token'] = guestCartToken;
  if (!authToken && useOrderToken && guestOrderToken) headers['X-Order-Token'] = guestOrderToken;
  for (const headerName of forwardHeaders) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) headers[headerName] = headerValue;
  }
  const acceptLanguage = request.headers.get('x-app-locale') || request.headers.get('accept-language');
  if (acceptLanguage) headers['Accept-Language'] = acceptLanguage;
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  if (!searchParams.has('locale') && acceptLanguage) {
    searchParams.set('locale', acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'tr');
  }

  const guestCartMerged = backendPath !== '/cart/merge'
    ? await retryGuestCartMerge(authToken, guestCartToken, acceptLanguage)
    : false;

  const method = request.method.toUpperCase();
  const options = { method, headers, cache: 'no-store' };
  if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
    const contentType = request.headers.get('content-type') || '';
    if (requireJson && !contentType.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ status: false, message: 'JSON istek gövdesi gerekli.' }, { status: 415 });
    }
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (maxBodyBytes && declaredLength > maxBodyBytes) {
      return NextResponse.json({ status: false, message: 'İstek gövdesi çok büyük.' }, { status: 413 });
    }
    const body = await request.text();
    if (maxBodyBytes && new TextEncoder().encode(body).byteLength > maxBodyBytes) {
      return NextResponse.json({ status: false, message: 'İstek gövdesi çok büyük.' }, { status: 413 });
    }
    if (body) {
      headers['Content-Type'] = contentType || 'application/json';
      options.body = body;
    }
  }

  try {
    const backendResponse = await fetch(
      `${getApiUrl()}${backendPath}${searchParams.size ? `?${searchParams}` : ''}`,
      options,
    );
    const payload = await readJsonResponse(backendResponse);
    const response = NextResponse.json(payload, { status: backendResponse.status });
    response.headers.set('Cache-Control', 'no-store');

    if (generatedGuestToken) {
      response.cookies.set(guestCartCookieName, guestCartToken, guestCartCookieOptions);
    }
    if (generatedOrderToken) {
      response.cookies.set(guestOrderCookieName, guestOrderToken, guestOrderCookieOptions);
    }
    if (clearGuestCartOnSuccess && backendResponse.ok) {
      response.cookies.delete(guestCartCookieName);
    }
    if (guestCartMerged) response.cookies.delete(guestCartCookieName);

    return response;
  } catch {
    const response = NextResponse.json(
      { status: false, message: 'API servisine ulaşılamıyor.' },
      { status: 503 },
    );
    if (generatedGuestToken) {
      response.cookies.set(guestCartCookieName, guestCartToken, guestCartCookieOptions);
    }
    if (generatedOrderToken) {
      response.cookies.set(guestOrderCookieName, guestOrderToken, guestOrderCookieOptions);
    }
    return response;
  }
}
