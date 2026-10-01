import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/server-api';

const allowedPaths = [
  /^provinces$/,
  /^provinces\/\d+\/districts$/,
  /^districts\/\d+\/neighborhoods$/,
];

export async function GET(request, { params }) {
  const { path = [] } = await params;
  const safePath = path.map(encodeURIComponent).join('/');
  if (!allowedPaths.some((pattern) => pattern.test(safePath))) {
    return NextResponse.json({ status: false, message: 'Geçersiz konum isteği.' }, { status: 404 });
  }

  try {
    const backendResponse = await fetch(`${getApiUrl()}/locations/${safePath}`, {
      headers: { 'Accept-Language': request.headers.get('accept-language') || 'tr' },
      next: { revalidate: 3600 },
    });
    const payload = await backendResponse.json();
    const response = NextResponse.json(payload, { status: backendResponse.status });
    response.headers.set(
      'Cache-Control',
      backendResponse.ok ? 'public, max-age=3600, stale-while-revalidate=86400' : 'no-store',
    );
    return response;
  } catch {
    return NextResponse.json(
      { status: false, message: 'Konum servisine ulaşılamıyor.' },
      { status: 503 },
    );
  }
}
