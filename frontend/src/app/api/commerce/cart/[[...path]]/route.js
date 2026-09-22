import { NextResponse } from 'next/server';
import { proxyCommerceRequest } from '@/lib/commerce-proxy';

function resolveCartRoute(method, path) {
  const route = path.join('/');
  const allowedRoutes = new Set([
    'GET:',
    'GET:summary',
    'POST:items',
    'PATCH:selection',
    'POST:coupon',
    'DELETE:coupon',
    'POST:merge',
  ]);

  if (allowedRoutes.has(`${method}:${route}`)) return route;
  if (/^items\/\d+$/.test(route) && ['PATCH', 'DELETE'].includes(method)) return route;
  return null;
}

async function handleCartRequest(request, params) {
  const { path = [] } = await params;
  const route = resolveCartRoute(request.method, path);
  if (route === null) {
    return NextResponse.json({ status: false, message: 'Geçersiz sepet işlemi.' }, { status: 404 });
  }

  return proxyCommerceRequest(request, {
    backendPath: `/cart${route ? `/${route}` : ''}`,
    createGuestToken: request.method === 'POST' && ['items', 'coupon'].includes(route),
    requireAuth: route === 'merge',
    clearGuestCartOnSuccess: route === 'merge',
  });
}

export async function GET(request, { params }) {
  return handleCartRequest(request, params);
}

export async function POST(request, { params }) {
  return handleCartRequest(request, params);
}

export async function PATCH(request, { params }) {
  return handleCartRequest(request, params);
}

export async function DELETE(request, { params }) {
  return handleCartRequest(request, params);
}
