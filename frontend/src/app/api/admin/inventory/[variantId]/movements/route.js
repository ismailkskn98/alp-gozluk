import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request, { params }) {
  const { variantId } = await params;
  return proxyAdminRequest(request, `/admin/inventory/${encodeURIComponent(variantId)}/movements${request.nextUrl.search}`);
}
