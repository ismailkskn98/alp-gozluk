import { proxyAdminRequest } from '@/lib/admin-backend';

export async function DELETE(request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/users/${encodeURIComponent(id)}`, 'DELETE');
}
