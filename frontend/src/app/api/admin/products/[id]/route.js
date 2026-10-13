import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/products/${encodeURIComponent(id)}`, 'GET');
}

export async function PUT(request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/products/${encodeURIComponent(id)}`, 'PUT');
}
