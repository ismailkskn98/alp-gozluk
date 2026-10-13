import { proxyAdminFormDataRequest } from '@/lib/admin-backend';

export async function PUT(request, { params }) {
  const { id } = await params;
  return proxyAdminFormDataRequest(request, `/admin/media/replace/${encodeURIComponent(id)}`, 'PUT');
}
