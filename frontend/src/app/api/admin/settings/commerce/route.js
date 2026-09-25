import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request) {
  return proxyAdminRequest(request, '/admin/settings/commerce');
}

export async function PATCH(request) {
  return proxyAdminRequest(request, '/admin/settings/commerce', 'PATCH');
}
