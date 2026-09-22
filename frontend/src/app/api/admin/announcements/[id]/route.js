import { proxyAdminRequest } from '@/lib/admin-backend';

export async function PUT(request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/announcements/${encodeURIComponent(id)}`, 'PUT');
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/announcements/${encodeURIComponent(id)}`, 'DELETE');
}

