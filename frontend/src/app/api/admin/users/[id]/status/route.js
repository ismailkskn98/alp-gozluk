import { proxyAdminRequest } from '@/lib/admin-backend';

export async function PUT(request, { params }) {
  const { id } = await params;
  return proxyAdminRequest(request, `/admin/users/${encodeURIComponent(id)}/status`, 'PUT');
}
