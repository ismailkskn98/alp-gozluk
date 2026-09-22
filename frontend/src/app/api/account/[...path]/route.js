import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieName, getApiUrl } from '@/lib/server-api';

async function proxyAccountRequest(request, params, method) {
  const { path = [] } = await params;
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return NextResponse.json({ status: false, message: 'Oturum gerekli.' }, { status: 401 });

  const safePath = path.map(encodeURIComponent).join('/');
  const headers = { Authorization: `Bearer ${token}` };
  const options = { method, headers, cache: 'no-store' };
  if (!['GET', 'DELETE'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(await request.json());
  }

  try {
    const backendResponse = await fetch(`${getApiUrl()}/account/${safePath}`, options);
    return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}

export async function GET(request, { params }) { return proxyAccountRequest(request, params, 'GET'); }
export async function POST(request, { params }) { return proxyAccountRequest(request, params, 'POST'); }
export async function PATCH(request, { params }) { return proxyAccountRequest(request, params, 'PATCH'); }
export async function DELETE(request, { params }) { return proxyAccountRequest(request, params, 'DELETE'); }
