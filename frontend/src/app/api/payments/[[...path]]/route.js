import { NextResponse } from 'next/server';
import { proxyCommerceRequest } from '@/lib/commerce-proxy';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolvePaymentRoute(method, path) {
  const route = path.join('/');
  if (method === 'POST' && ['iyzico/installments', 'iyzico/3ds/initialize'].includes(route)) {
    return route;
  }
  if (method === 'GET' && path.length === 1 && uuidPattern.test(path[0])) return path[0];
  return null;
}

async function handlePaymentRequest(request, params) {
  const { path = [] } = await params;
  const route = resolvePaymentRoute(request.method, path);
  if (!route) {
    return NextResponse.json({ status: false, message: 'Geçersiz ödeme işlemi.' }, { status: 404 });
  }

  return proxyCommerceRequest(request, {
    backendPath: `/payments/${route}`,
    useOrderToken: true,
    forwardHeaders: ['idempotency-key'],
    maxBodyBytes: 8_192,
    requireJson: request.method === 'POST',
  });
}

export async function GET(request, { params }) {
  return handlePaymentRequest(request, params);
}

export async function POST(request, { params }) {
  return handlePaymentRequest(request, params);
}
