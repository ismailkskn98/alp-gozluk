import { NextResponse } from 'next/server';
import { proxyCommerceRequest } from '@/lib/commerce-proxy';

function resolveFavoritesRoute(method, path) {
  const route = path.join('/');
  if (method === 'GET' && (route === '' || route === 'ids')) return route;
  if (method === 'POST' && route === 'merge') return route;
  if (/^\d+$/.test(route) && ['PUT', 'DELETE'].includes(method)) return route;
  return null;
}

async function handleFavoritesRequest(request, params) {
  const { path = [] } = await params;
  const route = resolveFavoritesRoute(request.method, path);
  if (route === null) {
    return NextResponse.json({ status: false, message: 'Geçersiz favori işlemi.' }, { status: 404 });
  }

  return proxyCommerceRequest(request, {
    backendPath: `/account/favorites${route ? `/${route}` : ''}`,
    requireAuth: true,
  });
}

export async function GET(request, { params }) {
  return handleFavoritesRequest(request, params);
}

export async function POST(request, { params }) {
  return handleFavoritesRequest(request, params);
}

export async function PUT(request, { params }) {
  return handleFavoritesRequest(request, params);
}

export async function DELETE(request, { params }) {
  return handleFavoritesRequest(request, params);
}
