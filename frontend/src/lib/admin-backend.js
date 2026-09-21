import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieName, getApiUrl } from './server-api';

export async function proxyAdminRequest(request, path, method = 'GET') {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return NextResponse.json({ status: false, message: 'Oturum gerekli.' }, { status: 401 });

  try {
    const headers = { Authorization: `Bearer ${token}`, 'Accept-Language': 'tr' };
    const options = { method, headers, cache: 'no-store' };
    if (!['GET', 'HEAD'].includes(method)) {
      headers['Content-Type'] = 'application/json';
      const body = await request.text();
      if (body) options.body = body;
    }
    const backendResponse = await fetch(`${getApiUrl()}${path}`, options);
    return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}
