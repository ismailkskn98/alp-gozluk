import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieName, getApiUrl } from '@/lib/server-api';

const publicActions = new Set(['login', 'register', 'google', '2fa-setup', '2fa-verify']);
const googleNonceAction = 'google-nonce';
const googleNonceCookieName = 'alp_google_nonce';
const twoFactorCookieName = 'alp_admin_2fa_challenge';
const backendActionPaths = {
  '2fa-setup': '2fa/setup',
  '2fa-verify': '2fa/verify',
};

function getRequestMessage(request, trMessage, enMessage) {
  return request.headers.get('accept-language')?.toLowerCase().startsWith('en')
    ? enMessage
    : trMessage;
}

function getSecureCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

async function createGoogleNonce(request) {
  try {
    const acceptLanguage = request.headers.get('accept-language');
    const backendResponse = await fetch(`${getApiUrl()}/auth/google/nonce`, {
      headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : undefined,
      cache: 'no-store',
    });
    const payload = await backendResponse.json();
    const nonce = payload.data?.nonce;
    const response = NextResponse.json(payload, { status: backendResponse.status });

    if (backendResponse.ok && nonce) {
      response.cookies.set(googleNonceCookieName, nonce, {
        ...getSecureCookieOptions(),
        maxAge: Math.min(Number(payload.data.expiresIn) || 600, 600),
      });
    }
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}

async function forward(action, request) {
  if (!publicActions.has(action) && action !== 'logout' && action !== 'me') {
    return NextResponse.json({ status: false, message: 'Geçersiz auth işlemi.' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) headers['Accept-Language'] = acceptLanguage;

  let body;
  if (publicActions.has(action)) {
    try {
      const requestBody = await request.json();

      if (action === 'google') {
        const nonce = cookieStore.get(googleNonceCookieName)?.value;
        if (!nonce) {
          return NextResponse.json(
            {
              status: false,
              message: getRequestMessage(
                request,
                'Google giriş isteğinin süresi doldu. Lütfen tekrar deneyin.',
                'The Google sign-in request expired. Please try again.',
              ),
            },
            { status: 400 },
          );
        }
        body = JSON.stringify({ idToken: requestBody.credential, nonce });
      } else if (action === '2fa-setup' || action === '2fa-verify') {
        const challengeToken = cookieStore.get(twoFactorCookieName)?.value;
        if (!challengeToken) {
          return NextResponse.json(
            { status: false, message: 'Doğrulama isteğinin süresi doldu. Lütfen yeniden giriş yapın.' },
            { status: 401 },
          );
        }
        body = JSON.stringify({ ...requestBody, challengeToken });
      } else {
        body = JSON.stringify(requestBody);
      }
    } catch {
      return NextResponse.json({
        status: false,
        message: getRequestMessage(request, 'Geçersiz istek.', 'Invalid request.'),
      }, { status: 400 });
    }
  }

  try {
    const backendAction = backendActionPaths[action] || action;
    const backendResponse = await fetch(`${getApiUrl()}/auth/${backendAction}`, {
      method: action === 'me' ? 'GET' : 'POST',
      headers,
      body,
      cache: 'no-store',
    });
    const payload = await backendResponse.json();
    const tokenFromBackend = payload.data?.token;
    const challengeToken = payload.data?.challengeToken;
    const safePayload = tokenFromBackend || challengeToken
      ? { ...payload, data: { ...payload.data, token: undefined, challengeToken: undefined } }
      : payload;
    const response = NextResponse.json(safePayload, { status: backendResponse.status });

    if (backendResponse.ok && tokenFromBackend) {
      response.cookies.set(authCookieName, tokenFromBackend, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: payload.data.expiresAt ? new Date(payload.data.expiresAt) : undefined,
      });
    }
    if (action === 'login') {
      response.cookies.delete(twoFactorCookieName);
      if (backendResponse.ok && challengeToken) {
        response.cookies.set(twoFactorCookieName, challengeToken, {
          ...getSecureCookieOptions(),
          maxAge: Math.min(Number(payload.data.expiresIn) || 300, 600),
        });
      }
    }
    if (action === '2fa-verify' && backendResponse.ok && tokenFromBackend) {
      response.cookies.delete(twoFactorCookieName);
    }
    if (action === 'google') response.cookies.delete(googleNonceCookieName);
    if (action === 'logout') response.cookies.delete(authCookieName);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}

export async function GET(request, { params }) {
  const { action } = await params;
  if (action === googleNonceAction) return createGoogleNonce(request);
  return forward(action, request);
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (action === googleNonceAction) {
    return NextResponse.json({ status: false, message: 'Bu işlem GET isteği gerektirir.' }, { status: 405 });
  }
  return forward(action, request);
}
