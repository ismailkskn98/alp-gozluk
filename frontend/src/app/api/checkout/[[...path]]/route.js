import { NextResponse } from 'next/server';
import { proxyCommerceRequest } from '@/lib/commerce-proxy';

const orderNumberPattern = /^AG-\d{2}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/;

function resolveCheckoutRoute(method, path) {
  if (method === 'POST' && path.length === 1 && path[0] === 'orders') return 'orders';
  if (path.length === 2 && path[0] === 'orders' && orderNumberPattern.test(path[1])) {
    return method === 'GET' ? `orders/${path[1]}` : null;
  }
  if (method === 'POST' && path.length === 3 && path[0] === 'orders' &&
      orderNumberPattern.test(path[1]) && path[2] === 'cancel') {
    return `orders/${path[1]}/cancel`;
  }
  if (method === 'POST' && path.length === 3 && path[0] === 'orders' &&
      orderNumberPattern.test(path[1]) && path[2] === 'tracking') {
    return `orders/${path[1]}/tracking`;
  }
  return null;
}

async function handleCheckoutRequest(request, params) {
  const { path = [] } = await params;
  const route = resolveCheckoutRoute(request.method, path);
  if (!route) {
    return NextResponse.json({ status: false, message: 'Geçersiz checkout işlemi.' }, { status: 404 });
  }

  return proxyCommerceRequest(request, {
    backendPath: `/checkout/${route}`,
    createOrderToken: request.method === 'POST' && route === 'orders',
    useOrderToken: route.endsWith('/tracking') ? false : true,
    forwardHeaders: ['idempotency-key'],
    maxBodyBytes: 32_768,
    requireJson: request.method === 'POST',
  });
}

export async function GET(request, { params }) {
  return handleCheckoutRequest(request, params);
}

export async function POST(request, { params }) {
  return handleCheckoutRequest(request, params);
}
