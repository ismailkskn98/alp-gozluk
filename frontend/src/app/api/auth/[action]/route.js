import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieName, getApiUrl } from '@/lib/server-api';

const publicActions = new Set(['login', 'register']);

async function forward(action, request) {
  if (!publicActions.has(action) && action !== 'logout' && action !== 'me') {
    return NextResponse.json({ status: false, message: 'Geçersiz auth işlemi.' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (publicActions.has(action)) body = JSON.stringify(await request.json());

  try {
    const backendResponse = await fetch(`${getApiUrl()}/auth/${action}`, {
      method: action === 'me' ? 'GET' : 'POST',
      headers,
      body,
      cache: 'no-store',
    });
    const payload = await backendResponse.json();
    const tokenFromBackend = payload.data?.token;
    const safePayload = tokenFromBackend
      ? { ...payload, data: { ...payload.data, token: undefined } }
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
    if (action === 'logout') response.cookies.delete(authCookieName);
    return response;
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}

export async function GET(request, { params }) {
  const { action } = await params;
  return forward(action, request);
}

export async function POST(request, { params }) {
  const { action } = await params;
  return forward(action, request);
}
