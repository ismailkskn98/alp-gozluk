import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieName, getApiUrl } from '@/lib/server-api';

export async function GET() {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return NextResponse.json({ status: false, message: 'Oturum gerekli.' }, { status: 401 });
  try {
    const backendResponse = await fetch(`${getApiUrl()}/admin/products?locale=tr`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept-Language': 'tr' },
      cache: 'no-store',
    });
    return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}

export async function POST(request) {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return NextResponse.json({ status: false, message: 'Oturum gerekli.' }, { status: 401 });

  try {
    const backendResponse = await fetch(`${getApiUrl()}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(await request.json()),
      cache: 'no-store',
    });
    return NextResponse.json(await backendResponse.json(), { status: backendResponse.status });
  } catch {
    return NextResponse.json({ status: false, message: 'API servisine ulaşılamıyor.' }, { status: 503 });
  }
}
