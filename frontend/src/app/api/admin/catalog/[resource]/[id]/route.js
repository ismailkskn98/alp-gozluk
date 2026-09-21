import { proxyAdminRequest } from '@/lib/admin-backend';

export async function PUT(request, { params }) {
  const { resource, id } = await params;
  return proxyAdminRequest(request, `/admin/catalog/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, 'PUT');
}

export async function DELETE(request, { params }) {
  const { resource, id } = await params;
  return proxyAdminRequest(request, `/admin/catalog/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, 'DELETE');
}
