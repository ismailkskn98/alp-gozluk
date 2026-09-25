import { proxyAdminRequest } from '@/lib/admin-backend';

export async function PATCH(request, { params }) {
  const { variantId } = await params;
  return proxyAdminRequest(request, `/admin/inventory/${encodeURIComponent(variantId)}`, 'PATCH');
}
